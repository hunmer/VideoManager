var g_menu = {
    buildItems: function(list){
        var h = '';
        for(var d of list){
            h += `
            <a data-action="${d.action}" class="list-group-item list-group-item-action ${d.class || ''}" aria-current="true">
                <i class="bi ${d.icon} mr-2 me-2"></i><span>${d.text}</span>
            </a>`
        }
        return '<div class="list-group p-0" style="width: 100%;">'+h+'</div>';
    },
    init: function() {
        this.registerMenu({
            name: 'clip_item',
            selector: '[data-dbaction="loadClip"]',
            dataKey: 'data-clip',
            html: g_menu.buildItems([{
                action: 'clip_selectAll',
                text: '全选',
                icon: 'bi-check-square'
            },{
                action: 'clip_startAtEnd',
                text: '从终点开始',
                icon: 'bi-arrow-return-right'
            },{
                action: 'clip_addToList',
                text: '加入列表',
                icon: 'bi-plus'
            },{
                action: 'clip_openFolder',
                class: 'text-warning',
                text: '定位',
                icon: 'bi-folder'
            },{
                action: 'clip_cut',
                class: 'text-secondary',
                text: '裁剪',
                icon: 'bi-scissors'
            },{
                action: 'clip_cover',
                class: 'text-success',
                text: '封面',
                icon: 'bi-image'
            },{
                action: 'clip_delete',
                class: 'text-danger',
                text: '删除',
                icon: 'bi-trash'
            }]),
            onShow: key => {
                domSelector({ action: 'clip_addToList' }).find('span').html(g_list.isInList('clips', key) ? '从列表移除' : '加入列表');
                domSelector({ action: 'clip_selectAll' }).find('span').html($('.div_video_side_list .card_selected').length ? '全不选' : '全选');
            }
        });

        this.registerMenu({
            name: 'share_item',
            selector: '[data-action="share_item"]',
            dataKey: 'data-file',
            html: g_menu.buildItems([{
                action: 'share_item_openFolder',
                class: 'text-warning',
                text: '定位',
                icon: 'bi-folder'
            },{
                action: 'share_item_deleteFile',
                class: 'text-danger',
                text: '删除',
                icon: 'bi-trash'
            }]),
        });

        this.registerMenu({
            name: 'video_item',
            selector: '[data-action="loadVideo"]',
            dataKey: 'data-video',
             html: g_menu.buildItems([{
                action: 'video_addToList',
                text: '加入列表',
                icon: 'bi-plus'
            },{
                action: 'video_addClipsToList',
                text: '片段加入列表',
                icon: 'bi-list-nested'
            },{
                action: 'video_checkClips',
                text: '检查丢失',
                icon: 'bi-bug-fill'
            },{
                action: 'video_openFolder',
                class: 'text-warning',
                text: '定位',
                icon: 'bi-folder'
            },{
                action: 'video_setFolder',
                text: '分类',
                icon: 'bi-inbox'
            },{
                action: 'video_cover',
                class: 'text-success',
                text: '封面',
                icon: 'bi-scissors'
            },{
                action: 'video_delete',
                class: 'text-danger',
                text: '删除',
                icon: 'bi-trash'
            }]),
            onShow: key => {
                domSelector({ action: 'video_addToList' }).find('span').html(g_list.isInList('videos', key) ? '从列表移除' : '加入列表');
                domSelector({ action: 'video_addClipsToList' }).toggleClass('hide', Object.keys(g_video.getVideo(key).clips).length == 0);
            }
        });

        this.registerMenu({
            name: 'folder_item',
            selector: '#sidebar-wrapper .accordion .card-header',
            dataKey: 'id',
             html: g_menu.buildItems([{
                action: 'folder_rename',
                class: 'text-primary',
                text: '重命名',
                icon: 'bi-folder'
            },{
                action: 'folder_delete',
                class: 'text-danger',
                text: '删除',
                icon: 'bi-trash'
            }]),
        });
        registerAction('showlist', (dom, action) => {
            $('#modal_list').modal('show');

        });

        registerAction('clip_selectAll', (dom, action) => {
            var selected = $('.div_video_side_list .card_selected');
            if(selected.length){
                selected.removeClass('card_selected');
            }else{
                $('.div_video_side_list .card').addClass('card_selected')
            }
            g_menu.hideMenu('clip_item');
        });

        registerAction(['clip_delete', 'clip_cover', 'clip_cut', 'clip_openFolder', 'clip_addToList', 'clip_startAtEnd'], (dom, action) => {
            var p = $(dom).parents('[data-key]');
            var k = p.attr('data-key');
            var d = g_video.data.clips[k];

            switch (action[0]) {
                case 'clip_startAtEnd':
                    if(!d.end) return toast('此片段没有设置终点');
                    g_player.setCurrentTime(d.end);
                    break;
                case 'clip_addToList':
                    g_list.addToList('clips', k, d.tags.join(','))
                    break;
                case 'clip_openFolder':
                    ipc_send('openFolder', `*path*/cuts/${k}.mp4`)
                    break;
                case 'clip_cut':
                    //  -c:v libx264 -c:a aac
                    g_video.cut(k, d.start, d.end - d.start, g_video.data.file, `*path*/cuts/${k}.mp4`);
                    break;
                case 'clip_cover':
                    g_video.cover(k, d.start, g_video.data.file, `*path*/cover/${k}.jpg`);
                    break;

                case 'clip_delete':
                    ipc_send('deleteFile', [`*path*/cover/${k}.jpg`, `*path*/cuts/${k}.mp4`]);
                    g_video.removeClip(g_video.key, k);
                    break;
            }
            g_menu.hideMenu('clip_item');
        });
        registerAction('folder_rename', (dom, action) => {
            var folder = g_menu.target.parents('[data-folder]').data('folder');
            prompt(folder, {
                title: '重命名',
                callback: newFolder => {
                    if (newFolder != folder) {
                        for (var time in g_video.getFolders()[folder]) {
                            g_video.getVideo(time).folder = newFolder;
                        }
                        g_video.saveVideos();
                    }
                }
            });
            g_menu.hideMenu('folder_item');
        });
        registerAction('folder_delete', (dom, action) => {
            var folder = g_menu.target.parents('[data-folder]').data('folder');
            prompt('', {
                title: '删除目录 ' + folder,
                placeholder: '输入目录名称（' + folder + '）将同时删除视频',
                callback: text => {
                    var b = text == folder;
                    for (var time in g_video.getFolders()[folder]) {
                        if (b) {
                            var d = g_video.getVideo(time);
                            nodejs.files.remove(d.file);
                        }
                        g_video.removeVideo(time, false);
                    }
                    g_video.saveVideos();
                }
            });
            g_menu.hideMenu('folder_item');
        });

        registerAction(['video_cover', 'video_addClipsToList', 'video_delete', 'video_openFolder', 'video_setFolder', 'video_addToList', 'video_checkClips'], (dom, action) => {
            var p = $(dom).parents('[data-key]');
            var k = p.attr('data-key');
            var d = g_video.getVideo(k);
            switch (action[0]) {
                case 'video_checkClips':
                    for(var time in d.clips){
                        var clip =  d.clips[time];
                        var saveTo = '*path*/cover/'+time+'.jpg';
                        if(!nodejs.files.exists(saveTo)){
                            i++;
                            g_video.cover(time, clip.start, d.file, saveTo, false);
                        }
                        var saveTo = '*path*/cuts/'+time+'.mp4';
                        if(!nodejs.files.exists(saveTo)){
                            i++;
                             g_video.cut(time, clip.start, clip.end - clip.start, d.file, saveTo, false);
                        }
                    }
                    toast(i > 0? `有${i}处正在修复` : '没有丢失');
                    break;
                case 'video_addClipsToList':
                    var i = 0
                    for (var k in d.clips) {
                        g_list.addToList('clips', k, d.clips[k].tags.join(','));
                        i++;
                    }
                    toast('成功添加 ' + i + ' 个片段!', 'alert-success');
                    break;
                case 'video_addToList':
                    g_list.addToList('videos', k, d.file);
                    break;
                case 'video_setFolder':
                    var folder = d.folder || '';
                    g_video.modal_folder(folder, newFolder => {
                        console.log(newFolder, folder);
                        if (newFolder != folder) {
                            d.folder = newFolder;
                            g_video.saveVideos();
                        }
                    });
                    break;

                case 'video_openFolder':
                    ipc_send('openFolder', d.file)
                    break;
                case 'video_cover':
                    g_video.videoCover(k);
                    break;

                case 'video_delete':
                    g_video.removeVideo(k);
                    // confirm('是否同时删除文件?', {
                    //     title: '<b class="text-danger">删除文件</b>',
                    //     callback: id => {
                    //         if (id == 'ok') ipc_send('deleteFile', [d.file]);
                    //     },
                    //     onShow: () => {
                    //         setInterval(() => 3000);
                    //     }
                    // });
                    break;
            }
            g_menu.hideMenu('video_item');
        });
    },

    hideMenu: function(key) {
        $('#rm_' + key).hide();
    },
    unregisterMenu: function(name) {
        //todo
        delete g_menu.list[name];
    },
    list: {},
    registerMenu: function(opts) {
        g_menu.list[opts.name] = opts;
        var id = 'rm_' + opts.name;
        //background-color: rgba(0, 0, 0, .5);
        $(`
            <div id="${id}" style="position: fixed;top: 0; left: 0;width: 100%;height: 100%;z-index: 99999;display: none;" onclick="
            var child = $(this).find('.menu');
            if(event.target == this){
             var x = event.clientX;
            var y = event.clientY;
            var l = child.offset().left;
            var t = child.offset().top;
            if(!(x >= l && x <= l + child.width() && y >= t && y <= t + child.height())){
                this.style.display = 'none';
            }
        }
            " oncontextmenu="this.style.display = 'none'">
                <div class="menu bg-white row position-absolute border rounded w-auto" style="min-width: 150px;" >
                    ${opts.html}
                </div>
            </div>
        `).appendTo('body');

        registerContextMenu(opts.selector, (dom, event) => {
            g_menu.showMenu(opts.name, dom, event);
        });
    },

    getMenu: function(name) {
        return g_menu.list[name];
    },

    showMenu: function(name, dom, event) {
        var opts = g_menu.getMenu(name);
        var id = 'rm_' + opts.name;
        var key;

        g_menu.target = dom;
        if(typeof(opts.dataKey) == 'function'){
            key = opts.dataKey(dom)
        }else
        if(dom){
            key = dom.attr(opts.dataKey);
        }

        g_menu.key = key;
        if(opts.onShow){
            if(opts.onShow(key, dom) === false) return;
        }
        var par = $('#' + id).attr('data-key', key).show();
        var div = par.find('.menu');
        var i = div.width() / 2;
        var x = event.pageX;
        var mw = $(window).width();
        if (x + i > mw) {
            x = mw - div.width();
        } else {
            x -= i;
            if (x < 0) x = 0;
        }

        // var y = event.pageY + 20;
        var y = event.pageY;
        var h = div.height();
        var mh = $(window).height();
        if (mh - y < h) {
            y -= h;
        }

        div.css({
            left: x + 'px',
            top: y + 'px',
        });
    }

}

g_menu.init();
var g_down = {};

function registerContextMenu(selector, callback) {
    $('body')
        .on('touchstart', selector, function(event) {
            var dom = $(this);
            g_down.start = getNow();
            g_down.element = dom;
            g_down.task = setTimeout(function() {
                if (g_down.start > 0) {
                    g_down.holding = true;
                    event.originalEvent.preventDefault(true);
                    event.originalEvent.stopPropagation();
                    callback(g_down.element, event);
                }
                g_down.start = 0;
                g_down.task = -1;

            }, 1500);
        })
        .on('touchend', selector, function(event) {
            if (g_down.task != -1) {
                clearTimeout(g_down.task);
            }
            g_down.start = 0;
            if (g_down.holding) {
                event.originalEvent.preventDefault(true);
                event.originalEvent.stopPropagation();
            }
            g_down.holding = false;
        })
        .on('contextmenu', selector, function(event) {
            var dom = $(this);
            event.originalEvent.preventDefault(true);
            event.originalEvent.stopPropagation();
            g_down.element = dom;
            callback(g_down.element, event);
        });
}