var _player;
var _videos = local_readJson('videos', {



});
// _videos = {
//     a: {
//         file: 'D:\\dev\\videoManager\\res\\1.mp4',
//         tags: [],
//         date: new Date().getTime(),
//         clips: {
//             1650213149864: {
//                 start: 1,
//                 end: 10,
//                 tags: ['a', 'b']
//             }

//         },
//         // folder: 'test',
//     }
// }

var g_video = {
    pos1: -1,
    pos2: -1,
    inited: false,
    cache: {},
    init: function() {
        var self = this;
        if (self.inited) return;
        self.inited = true;
        self.tags.preInit();
        $('#input_tag').on('keydown', function(e) {
            if (e.keyCode == 13) {
                self.tags.addTag(this.value);
                this.value = '';
            }
        }).on('input', function(e) {
            self.tags.searchTag(this.value);
        })
        self.initVideos();
        if (g_config.lastVideo != undefined) {
            self.loadVideo(g_config.lastVideo);
        }

    },

    tags: {
        all: {},
        list: [],
        preInit: function() {
            this.update();
        },
        addTag: function(tag) {
            $('#input_tag').val('');
            if (!this.list.includes(tag)) {
                this.list.push(tag);
                if (!this.all[tag]) this.all[tag] = 1;
            }
            var rent = g_config.tags_rent || [];
            var i = rent.indexOf(tag);
            if (i != -1) rent.splice(i, 1);
            rent.unshift(tag);
            g_config.tags_rent = rent.slice(0, 8);
            local_saveJson('config', g_config);
            this.update(this.list);
        },

        getAllTags: function() {
            return Object.keys(this.all);
        },

        searchTag: function(search) {
            var h = '';
            var py = PinYinTranslate.start(search);
            var sz = PinYinTranslate.sz(search);
            for (var tag of this.getAllTags().filter((t) => {
                    return t.indexOf(search) != -1 || PinYinTranslate.start(t).indexOf(py) != -1 || PinYinTranslate.sz(t).indexOf(sz) != -1
                })) {
                h += this.getHtml(tag, 'tag_add', 'badge-primary');

            }
            $('#tags_all .tags_content').html(h);
        },

        initRentTags: function(tags) {
            if (!tags) tags = g_config.tags_rent || [];
            var h = '';
            for (var tag of tags) {
                h += this.getHtml(tag, 'tag_add', this.list.includes(tag) ? 'badge-success' : 'badge-primary');
            }
            $('#tags_rent').html(h);
        },

        update: function(list) {
            if (list) {
                this.list = list;
                this.initTags(list);
            }
            this.initRentTags();
            this.initAll();
        },

        removeTag: function(tag) {
            var i = this.list.indexOf(tag);
            if (i != -1) {
                this.list.splice(i, 1);
                this.update(this.list);
                // todo 从all中移除？
            }
            $('#tags .tag[data-tag="' + tag + '"]').remove();
        },

        getHtml: function(tag, action, classes) {
            return `<a class="tag badge ${classes} m-2" data-tag="${tag}" data-action="${action}">${tag}</a>`
        },

        initTags: function() {
            var h = '';
            for (var tag of this.list) {
                h += this.getHtml(tag, 'tag_remove', 'badge-dark');
            }
            $('#tags .tags_content').html(h);
        },
        initAll: function(action = 'tag_add') {
            var h = '';
            for (var tag of this.getAllTags()) {
                if (!this.list.includes(tag)) {
                    h += this.getHtml(tag, action, 'badge-dark');
                }
            }
            $('#tags_all .tags_content').html(h);
        }
    },



    initTagsFolder: function() {
        var h = ``;
        for (var name of []) {
            h += `<option>${name}</option>`;
        }
        $('#select_tag_folder').html(h);

    },
    removeVideo: function(key, save = true) {
        delete _videos[key];
        if (save) {
            local_saveJson('videos', _videos);
            this.initVideos();
        }
    },

    removeClip: function(key, clip, save = true) {
        if (_videos[key]['clips'][clip]) {
            delete _videos[key]['clips'][clip];
            save && local_saveJson('videos', _videos);
            this.initPos();
        }
    },

    getFolders: function() {
        var all = {};
        var r = { '未分组': [] };
        for (var key in _videos) {
            var d = _videos[key];
            var folder = getVal(d.folder, '未分组');
            if (!r[folder]) r[folder] = {};
            r[folder][key] = d.file;

            for (var tag of this.getVideoTags(d)) {
                if (!all[tag]) all[tag] = 0;
                all[tag]++;
            }

        }
        this.tags.all = all;
        this.tags.initAll();
        return r;
    },

    getVideoTags: function(d) {
        var set = new Set();
        if (typeof(d) != 'object') {
            d = this.getVideo(d);
            if (!d) return [];
        }
        for (var time in d.clips) {
            for (var tag of d.clips[time].tags) {
                set.add(tag);
            }
        }
        return Array.from(set);
    },

    initVideos: function() {
        var self = this;
        var h = '';
        var list = self.getFolders();
        for (var folder in list) {
            var id = 'folder_' + folder;
            h += `
                <div class="card" data-folder="${folder}" >
                    <div class="card-header" id="${id}_header">
                      <h2 class="mb-0">
                        <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#${id}" aria-expanded="true" aria-controls="${id}">
                          ${folder} <span class="badge badge-primary ml-2">${Object.keys(list[folder]).length}</span>
                        </button>
                      </h2>
                    </div>
                    <div id="${id}" class="collapse" aria-labelledby="${id}_header" data-parent="#accordionExample" >
                      <div class="card-body p-0" style="overflow-y: auto;">
                       ` + (() => {

                var r = '';
                var cnt = 0;
                var style = g_config.folder_style || 'image';
                var sort = g_config.folder_sort || '名称';
                var keys = Object.keys(list[folder]).sort(function(a, b){
                    var a1 = self.getVideo(a);
                    var b1 = self.getVideo(b);
                    switch(sort){
                        case '替换文本':
                            var a2 = a1.file;
                            var b2 = b1.file;
                            for(var s of g_config.folder_sort_replace.split(',')){
                                a2 = a2.replace(s, '')
                                b2 = b2.replace(s, '');
                            }
                            return parseInt(b2.replace(/[^0-9]/ig, '')) - parseInt(a2.replace(/[^0-9]/ig, ''));
                        case '自定义':
                            return eval('(() => {'+g_config.folder_sort_fun.replaceAll('\n', '')+'})()');
                        case '名称':
                            return parseInt(b1.file.replace(/[^0-9]/ig, '')) - parseInt(a1.file.replace(/[^0-9]/ig, ''));
                        case '片段数':
                            return Object.keys(b1.clips).length - Object.keys(a1.clips).length;
                        case '添加日期':
                            return d1.add - a1.add;
                    }
                });

                if(g_config.folder_sort_reverse == '1') keys = keys.reverse();
                for (var key of keys) {
                    var d = self.getVideo(key);
                    var t = 0;
                    var c = 0;
                    for (var clip of Object.values(d.clips)) {
                        t += clip.end - clip.start;
                        c++;
                    }
                    var file = list[folder][key];
                    var name = getFileName(file);
                    var classes = key == g_video.key ? ' card_active' : '';
                    switch (style) {
                        case 'image':
                            r += `
                            <div class="card p-2 text-white${classes}" data-file="${file}" draggable="true" data-action="loadVideo" data-video="${key}">
                              <img data-src="./cover/${key}.jpg" class="card-img lazyload" alt="${name}">
                              <div class="card-img-overlay">
                                <h5 class="card-title" style="max-height: 50%;overflow: hidden">${name}</h5>
                                `;
                            r += `<span class="badge badge-danger mr-2${ !c ? ' hide' : ''}">${c}个片段</span>`;
                            r += `<span class="badge badge-primary mr-2${ !d.meta ? ' hide' : ''}">${d.meta ? getTime(d.meta.duration) : ''}</span>`;
                            r += `<span class="badge badge-success mr-2${ !d.meta ? ' hide' : ''}">${d.meta ? d.meta.quickly.replace('yuv', '') : ''}</span>`;
                            r += `<p class="card-text">${new Date(d.add).format('yyyy/MM/dd')}</p>
                              </div>
                            </div>`;
                            break;

                        case 'text':
                            if (cnt == 0) {
                                r += '<ul class="list-group">';
                            }
                            r += `<li class="list-group-item${classes}" data-file="${file}" draggable="true" data-action="loadVideo" data-video="${key}"><span class="badge badge-danger mr-2${ !c ? ' hide' : ''}">${c}个片段</span>${name}</li>`;
                            if (cnt == keys.length - 1) {
                                r += '</ul>';
                            }
                    }
                    cnt++;
                }
                return r;
            })() + `
                      </div>
                    </div>
               </div>
            `;

        }
        $('#sidebar-wrapper .accordion').html(h).find('.lazyload').lazyload();
        if (g_config.lastFolder != undefined) {
            g_video.openFolder(g_config.lastFolder)
        }

    },

    getShowingFolder: function() {
        return $('.collapse.show').attr('id') || ''
    },

    openFolder: function(folder) {
        if (this.getShowingFolder().substring(7) == folder) return; // 展示中
        domSelector({
            toggle: "collapse",
            target: '#folder_' + folder
        }).click();
    },

    setStart: function(time, jump = false) {
        var t = (Number(time) || g_player.getCurrentTime()).toFixed(2);
        if (t < 0) t = 0;
        this.pos1 = t;
        this.onSetPos();
        jump && g_player.setCurrentTime(t);
    },

    setEnd: function(time, jump = false) {
        var t = (Number(time) || g_player.getCurrentTime()).toFixed(2);
        if (t < 0) t = 0;
        this.pos2 = t;
        this.onSetPos();
        jump && g_player.setCurrentTime(t);
    },

    onSetPos: function() {
        $('.time_start').val(getTime(this.pos1));
        $('.time_end').val(getTime(this.pos2));
    },

    addPos: function() {
        var self = this;
        if (!this.key) return;
        this.pos1 = Math.min(this.pos1, this.pos2);
        this.pos2 = Math.max(this.pos1, this.pos2);
        if (this.pos1 == -1) {
            return alert('未设置pos1');
        }
        // if (this.pos2 == -1) {
        //     return alert('未设置pos2');
        // }
        if (this.pos2 != -1 && this.pos1 == this.pos2) {
            return alert('至少要有1秒');
        }
        var tag = $('#input_tag').val();
        if (tag != '') {
            self.tags.addTag(tag);
            $('#input_tag').val('');
        }

        var run = true;
        if (!this.clip) { // 新建
            this.clip = new Date().getTime();
        }else
        if(this.clipData.start != this.pos1 || this.clipData.end != this.pos2){ // 改动
            // 重新剪辑
        }else{
            run = false;
        }

        var time = this.clip;
        if (!_videos[this.key]['clips']) _videos[this.key]['clips'] = {};
        _videos[this.key]['clips'][time] = {
            start: this.pos1,
            end: this.pos2,
            tags: this.tags.list,
        }
        local_saveJson('videos', _videos);

        if(run){
            this.setClipStatus(time, '队列中', 'badge-primary');
            this.cover(time, this.pos1, this.data.file, `*path*/cover/${time}.jpg`, false);
            this.cut(time, this.pos1, this.pos2 - this.pos1, this.data.file, `*path*/cuts/${time}.mp4`, false);
        }
        
        this.initPos();
        g_player.setCurrentTime(this.pos2);
        g_player.playVideo(true);

        this.clearInput(this.pos2);
        toast('添加成功', 'alert-success');

    },

    modal_search: function() {
        g_player.playVideo(false);
        bindModalEvent($('#modal_search'), {
            onShow: modal => g_player.tryStop(),
            onClose: modal => g_player.tryStart(),
        }).modal('show');
        g_filter.filter_init('local');
    },

    clearInput: function(start = -1) {
        this.unselectClip();
        $('.time_end').val('');
        $('.time_start').val(start > 0 ? getTime(start) : '');
        $('[data-action="resetPos"]').addClass('hide');
        this.tags.update([]);
        this.pos1 = start;
        this.pos2 = -1;
        this.clip = undefined;
        delete g_cache.lastClip;
    },

    cut: function(key, start, time, file, saveTo, tip = true) {
        if(isNaN(time) || time <= 0) return;
        ipc_send('cmd', {
            input: file,
            key: key,
            duration: time,
            params: [
                '-y',
                `-ss ${start}`,
                `-t ${time}`,
                // '-vcodec rawvideo',
                // '-accurate_seek',
                // '-codec copy',
                // '-codec libx264',
                // '-avoid_negative_ts 1',
            ],
            output: saveTo,
            type: 'cut',
            callback: (k, saveFile, success) => {
                tip && toast('裁剪' + (success ? '成功' : '失败'), 'alert-' + (success ? 'success' : 'danger'));
                if (success) {

                }
            }
        });
    },
    cover: function(key, time, file, saveTo, tip = true) {
        var self = this;
        ipc_send('cmd', {
            input: file,
            key: key,
            output: saveTo,
            params: [time],
            type: 'cover',
            size: '240x180',
            callback: (k, saveFile, success) => {
                tip && toast('更新封面' + (success ? '成功' : '失败'), 'alert-' + (success ? 'success' : 'danger'));
                if (success) {
                    self.setClipCover(k, 'file://' + saveFile + '?t=' + new Date().getTime());
                }
            }
        });
    },

    videoCover: function(key, tip = true, time = 0) {
        var self = this;
        var d = self.getVideo(key);
        if (!d) return;
        ipc_send('cmd', {
            input: d.file,
            key: key,
            output: '*path*/cover/' + key + '.jpg',
            params: [time],
            type: 'cover',
            size: '240x180',
            callback: (k, saveFile, success) => {
                tip && toast('更新视频封面' + (success ? '成功' : '失败'), 'alert-' + (success ? 'success' : 'danger'));
                if (success) {
                    self.setVideoCover(k, 'file://' + saveFile + '?t=' + new Date().getTime());
                }
            }
        });
    },

    setClipCover: function(time, url) {
        $('[data-action="loadClip"][data-clip="' + time + '"]').find('.lazyload').attr('data-src', url).lazyload();
    },

    setVideoCover: function(time, url) {
        $('[data-action="loadVideo"][data-video="' + time + '"]').find('.lazyload').attr('data-src', url).lazyload();
    },

    setClipStatus: function(clip, text, style = 'badge-primary') {
        var d = domSelector({ action: 'loadClip', clip: clip });
        if (!d.length) return;
        var empty = text == undefined || text == '';
        var badge = d.find('.badge');
        if (!badge.length) {
            if (empty) return;
            badge = $(`<span></span>`).appendTo(d.find('h5'));
        }
        if (empty) return badge.remove();
        badge.attr('class', `badge ${style} float-right`).html(text);
    },

    initPos: function() {
        var h = '';
        var i = 0;
        for (var time in this.data.clips) {
            var d = this.data.clips[time];
            h += `
                <li data-start="${d.start}" data-file="*path*/cuts/${time}.mp4" draggable="true" class="media p-2" data-action="loadClip" data-clip="${time}">
                    <img draggable="false" data-src="./cover/${time}.jpg" class="mr-3 lazyload" data-preview>
                    <div class="media-body">
                        <h5 class="mt-0 mb-1">
                        ${getTime(d.start)} - ${getTime(d.end)}
                        
                        </h5>
                        <p>${d.tags.join(' , ')}</p>
                    </div>
                </li>
            `;
            i++;
        }
        if (h == '') h = '<h5 class="text-center mt-10">还没有任何片段</h5>';
        $('[data-video].card_active').find('.badge-danger').html(i + '个片段').toggleClass('hide', i == 0);
        $('#_list-tab span').html(i).toggleClass('hide', i == 0);
        $('.div_video_side_list').html(h).find('.lazyload').lazyload();
    },

    onTimeInputScroll: function(e) {
        if (!this.key) return;
        var i = e.originalEvent.deltaY;
        var t = Number($('#scrollAddTime').html());
        var add = i > 0 ? 0 - t : t;
        if (e.target.classList.contains('time_start')) {
            if (this.pos1 == -1) return;
            this.setStart(Number(g_video.pos1) + add, true)
        } else {
            if (this.pos2 == -1) return;
            this.setEnd(Number(g_video.pos2) + add, true)
        }
    },


    unselectClip: function() {
        $('.div_video_side_list').find('.card_active').removeClass('card_active');
    },

    loadClip: function(time) {
        this.unselectClip();
        domSelector({ action: 'loadClip', clip: time }).addClass('card_active');
        $('[data-action="resetPos"]').removeClass('hide');
        this.clip = time;
        var d = this.data.clips[time];
        this.clipData = d;
        this.setStart(d.start);
        this.setEnd(d.end);
        this.tags.update(d.tags);
        g_player.setCurrentTime(d.start, true);
    },


    loadVideo: function(key, start = 0) {
        loadTab('list');
        g_sub.unlinkTarget();
        var d = this.getVideo(key);
        if (d) {
            // g_sub.loadSub(key);
            this.clearInput();

            var t = new Date().getTime();
            g_config.lastVideo = key;
            if(!g_config.last) g_config.last = {};
            g_config.last[key] = t;
            for(var i=Object.keys(g_config.last).length;i>20;i--) delete g_config.last[key];
            local_saveJson('config', g_config);
            d.last = t;

            this.key = key;
            this.data = d;
            g_player.load(d.file, key, start);
            $('#sidebar-wrapper').find('.card_active').removeClass('card_active');
            domSelector({ action: 'loadVideo', video: key }).addClass('card_active');

            $('[data-action="resetPos"]').addClass('hide');
            this.initPos();
            setHeight($('.div_video_side_list'));
            if (!d.meta) {
                this.getMeta(key);
            } else {
                this.loadMeta(d.meta);
            }

            this.saveVideos(false);
        }
    },

    getMeta: function(key) {
        var self = this;
        var d = self.getVideo(key);
        ipc_send('meta', {
            input: d.file,
            key: key,
            callback: (k, data) => {
                var f = data.format;
                var v = data.streams[0];
                d.meta = {
                    width: v.width,
                    height: v.height,
                    duration: f.duration,
                    quickly: v.pix_fmt,
                    size: f.size,
                }
                self.saveVideos(false);
                self.loadMeta(d.meta);
            }
        });
    },

    loadMeta: function(meta) {
        var card = $('[data-video].card_active');
        card.find('.badge-primary').html(getTime(meta.duration)).removeClass('hide');
        card.find('.badge-success').html(meta.quickly.replace('yuv', '')).removeClass('hide');
        $('#_detail').html(
            `<ul class="list-group list-group-flush">
              <li class="list-group-item">分辨率: ${meta.width + 'x' + meta.height}(${meta.quickly})</li>
              <li class="list-group-item">时长: ${getTime(parseInt(meta.duration), '小时', '分', '秒', false)}</li>
              <li class="list-group-item">大小: ${renderSize(meta.size)}</li>
            </ul>`
        );
    },

    getVideo: function(key, clone = false) {
        return _videos[key];
    },

    reviceFiles: function(files, overwrite = false) {
        $('#file-drop').toggleClass('hide', true);
        var modal = $('#modal_addFiles').modal('show');
        modal.find('input').focus();
        modal.find('.modal-title').html(overwrite ? '覆盖文件' : '添加文件')
        var h = '';
        for (var file of files) {
            h += `<li data-action="files_select" class="list-group-item" data-file="${file}">${file}</li>`;
        }
        $('#files_add').html(h).find('input').focus();
    },
    onSelectFile: function() {
        var cnt = $('[data-action="files_select"].active').length;
        $('#selected_file_cnt').html(cnt);
        $('[data-action="btn_file_add"]').toggleClass('disabled', cnt == 0);
    },

    addFiles: function(files, folder = '') {
        var exists = [];
        var saved = 0;
        for (var file of files) {
            var key = SparkMD5.hash(file);
            if (_videos[key]) {
                exists.push(file);
            } else {
                saved++;
                _videos[key] = {
                    file: file,
                    tags: [],
                    folder: folder,
                    add: new Date().getTime(),
                    clips: {},
                }
                // TODO 队列
                this.videoCover(key, false);
            }
        }
        if (saved) {
            this.saveVideos();
        }
        if (exists.length) {
            //this.reviceFiles(exists, true);
            toast('有 ' + exists.length + ' 个文件重复', 'alert-danger');
        }
    },
    saveVideos: function(init = true) {
        local_saveJson('videos', _videos);
        init && this.initVideos();
    }

}

g_video.init();
//g_video.reviceFiles(['D:\\dev\\videoManager\\res\\2.mp4', 'D:\\dev\\videoManager\\res\\3.mp4']);