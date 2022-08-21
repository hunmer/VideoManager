var g_sub = {

    init: function() {
        registerAction('sub_toTxt', (dom, action) => {
            g_sub.showTxt();
        });
        registerAction('sub_setTarget', (dom, action) => {
            var key = g_video.key;
            if (key) {
                g_sub.modal(dir => {
                    g_sub.setTarget(key, dir);
                });
            }
        });
        registerAction('sub_delete', (dom, action) => {
            var file = '*path*/subs/' + g_video.key + '.vtt';
            if (nodejs.files.exists(file)) {
                confirm('字幕', {
                    title: '<b class="text-danger">是否删除字幕?</b>',
                    callback: id => {
                        if (id == 'ok') {
                            ipc_send('deleteFile', [file]);
                            g_sub.loadSub(g_video.key);
                        }
                    }
                });
            }
        });
        registerAction('sub_refresh', (dom, action) => {
            g_sub.loadSub(g_video.key, false);

        });
        registerAction('sub_saveSub', (dom, action) => {
            g_sub.saveSub();
        });
        registerAction('sub_item', (dom, action) => {
            g_player.setCurrentTime(Number(dom.dataset.time));

        });
    },
    modal_setJianyin_path: function() {
        prompt(g_config.jianyin || nodejs.env.LOCALAPPDATA + '\\JianyingPro\\User Data\\Projects\\com.lveditor.draft\\', {
            title: '请先设置剪映项目根目录',
            callback: path => {
                if (!nodejs.files.isDir(path)) {
                    toast('不是有效的目录', 'alert-danger');
                    return false;
                }
                g_config.jianyin = path;
                local_saveJson('config', g_config);
                toast('设置成功', 'alert-success');
            }
        });
    },
    getFolderItemHtml: function(dir) {
        return `
                <li data-action="singleSelect,[data-jianyin],active" class="list-group-item d-flex justify-content-between align-items-center${g_cache.jianyin == dir ? ' active' : ''}"  data-jianyin="${dir}">
                    ${popString(dir, '\\')}
                  </li>
                `;
    },
    modal: function(callback) {
        var path = g_config.jianyin || '';
        if (!nodejs.files.isDir(path)) {
            return this.modal_setJianyin_path();
        }
        var h = `
    <div class="input-group mb-3">
      <div class="input-group-prepend">
        <span class="input-group-text">搜索</span>
      </div>
      <input type="text" class="form-control" placeholder="搜索剪映项目" aria-label="" id="input_searchJianyin" >
       <div class="input-group-append">
        <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="false">...</button>
        <div class="dropdown-menu">
          <a class="dropdown-item" href="javascript: g_sub.modal_setJianyin_path()">剪映目录</a>
        </div>
      </div>
    </div>

    <ul class="list-group" id="list_jianyin">`;
        let names = []
        for (var dir of files.listDir(path)) {
            h += this.getFolderItemHtml(dir);
            names.push(popString(dir, '\\'));
        }
        this.folders = names;

        h += '</ul>';
        confirm(h, {
            title: '选择剪映项目',
            btns: [{
                id: 'ok',
                text: '确定',
                class: 'btn-primary',
            }, {
                id: 'refresh',
                text: '刷新',
                class: 'btn-info',
            }, {
                id: 'cancel',
                text: '取消',
                class: 'btn-secondary',
            }],
            callback: (id) => {
                if (id == 'refresh') return this.modal(callback);
                if (id == 'ok') {
                    var selected = $('[data-jianyin].active');
                    if (!selected.length) return false;
                    callback(selected.data('jianyin'));
                }
                return true;
            }
        });

        $('#input_searchJianyin').on('input', function(e) {
            var search = this.value;
            let h = '';
            let base = g_config.jianyin;
            for (let dir of g_sub.folders.filter(s => s.indexOf(search) != -1)) {
                h += g_sub.getFolderItemHtml(base + dir);
            }
            $('#list_jianyin').html(h);
        });
    },
    searchSub: function(s) {
        g_sub.updateSub(undefined, s == '' ? undefined : sub => $(sub.text).text().indexOf(s) != -1)
    },
    loadSub: function(key, cache = true) {
        var file = '*path*/subs/' + key + '.vtt';
        var subs;
        var exists = cache && nodejs.files.exists(file);
        if (exists) {
            // subs = PF_SRT.parse(nodejs.files.read(file));
            subs = _player.video.textTracks[0].cues;
        } else {
            subs = this.getSub(file);
        }
        this.subs = subs;
        this.updateSub(subs, this.filter);
        !exists && $('[data-action="sub_saveSub"]').removeClass('hide', Object.keys(subs).length == 0);
    },

    updateSub: function(subs, filter) {
        if (!subs) subs = this.subs;
        var h = `
             <ul class="list-group list-group-flush" style="overflow-y: auto;padding-bottom: 50px;height: calc(100vh - 250px);" id="list_sub_item">                 
        `;
        var i = 0;
        if (subs) {
            this.filter = filter;
            if (filter) subs = Array.from(subs).filter(filter);
            for (var sub of subs) {
                h += `<li class="list-group-item sub_item" data-action="sub_item" data-time="${sub.startTime}">
                        <b  style="user-select: none;margin-right: 10px;" >${getTime(sub.startTime)}</b>
                        <span>${sub.text.trim()}</span>
                    </li>`;
                i++;
            }
        }
        g_sub.lines = i;
        if (i) {
            h += `</ul>
             <div style="text-align: right;">
                <button type="button" data-action="sub_saveSub" class="btn btn-info hide">保存</button>
            </div>
                        `;
            $('#sub_content').html(h);
        } else {
            this.reset();
        }
    },
    reset: function() {
        $('#sub_content').html(`
             <div class="card text-center rounded none-select" draggable="true" data-file="${g_video.data.file}" data-icon="*path*/cover/${g_video.key}.jpg">
                <i class="bi bi-video" style="font-size: 4rem;"></i>
                <div class="card-body">
                    <p class="card-text">把我拖到剪映识别文字</p>
                    <p style="font-size: 12px;">多文件识别请添加到列表</p>
                </div>
            </div>
        `);
    },
    unlinkTarget: function() {
        clearInterval(this.timer);
    },
    timer: -1,
    setTarget: function(key, dir) {
        this.unlinkTarget();
        var self = this;
        this.dir = dir;
        this.file = dir + '\\draft_content.json';
        this.timer = setInterval(() => {
            var stat = nodejs.files.stat(this.file);
            if (self.mtime != stat.mtimeMs) {
                self.loadSub(key, false);
                self.mtime = stat.mtimeMs;
            }
        }, 1000);
    },
    saveSub: function() {
        var key = g_video.key;
        if (!key || !this.subs) return;
        var s = '';
        var i = 0;
        for (var sub of this.subs) {
            s += `${getTime(sub.startTime, ':', ':', '', false, 3)} --> ${getTime(sub.endTime, ':', ':', '',false, 3)}\r\n${sub.text}\r\n\r\n`;
            i++;
        }
        if (s == '') {
            toast('没有字幕内容', 'alert-danger');
        } else {
            nodejs.files.write('*path*/subs/' + key + '.vtt', `WEBVTT` + '\r\n\r\n' + s);
            toast('保存成功', 'alert-success');
            $('[data-action="sub_saveSub"]').addClass('hide');
            this.unlinkTarget();
            g_video.loadVideo(g_video.key, g_player.getCurrentTime());
        }
    },
    showTxt: function() {
        let items = $('.sub_item span');
        if (!items.length) return toast('没有字幕内容', 'alert-danger');
        prompt("\r\n", {
            title: '输入连接符号',
            callback: join => {
                var s = '';
                for (var span of items) {
                    s += `${span.outerText}${join}`;
                }
                showCopy(s);
            }
        })
    },
    getSub: function(file) {
        var r = [];
        if (file) {
            if (!nodejs.files.exists(file)) return;
            try {
                var json = JSON.parse(nodejs.files.read(file));
                if (json.tracks[1]) {
                    var i = 0;
                    var max = json.tracks[1].segments.length;
                    for (var sub of json.materials.texts) {
                        if (i < max) {
                            var time = json.tracks[1].segments[i].target_timerange;
                            var start = Number(time.start * 1 / 1000000).toFixed(3);
                            var duration = Number(time.duration * 1 / 1000000).toFixed(3);
                            var end = (Number(start) + Number(duration)).toFixed(3);
                            r.push({
                                line: i,
                                startTime: start,
                                endTime: end,
                                text: sub.content,
                            })
                        }
                        i++

                    }
                }
            } catch (e) {
                console.error(e);
                toast('错误json', 'alert-danger');
            }
        }
        console.log(r);
        return r;
    },

}
g_sub.init();