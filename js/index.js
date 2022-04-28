function srcollVideo(e, video) {
    if ($('input:focus').length) return;
    var d = $(e.target);
    if (d.parents('.dropdown-menu').length) return; // 裁剪列表
    if (!video) video = e.currentTarget;
    var duration = video.duration;
    if (!isNaN(duration)) {
        var i = e.deltaY;
        var add;
        if (e.altKey) {
            add = 1;
        } else
        if (e.ctrlKey) {
            add = 5;
        } else {
            add = duration * 0.01; // 视频的1%
        }
        if (add < 1) add = 1;
        add = i > 0 ? 0 - add : add;
        video.currentTime += add;
        clearEventBubble(e);
    }
}

function nextScrollTime() {
    var next = domSelector({ action: 'setScrollAddTime' }, '.active').next();
    if (next.length) {
        return next.click();
    }
    setScrollAddTime('0.1');
}


function setScrollAddTime(time, save = true) {
    if (save) {
        g_config.scrollAdd = time;
        local_saveJson('config', g_config);
    }
    $('#scrollAddTime').html(time);
    domSelector({ action: 'setScrollAddTime' }, '.active').removeClass('active');
    domSelector({ action: 'setScrollAddTime', time: time }).addClass('active');
}

function loadConfig() {
    setScrollAddTime(g_config.scrollAdd || 1, false);
}

function bindModalEvent(modal, opts) {
    modal
        .on('shown.bs.modal', function(event) {
            opts.onShow && opts.onShow(modal);
        })
        .on('hidden.bs.modal', function(event) {
            opts.onClose && opts.onClose(modal);
        });
    return modal;
}

function buildModal(text, opts) {
    opts = Object.assign({
        id: 'modal_confirm',
        title: '弹出窗口',
        btns: [{
            id: 'ok',
            text: '确定',
            class: 'btn-primary',
        }, {
            id: 'cancel',
            text: '取消',
            class: 'btn-secondary',
        }],
        onShow: () => {},
        callback: (id) => {},
        onBtnClick: (config, btn) => {},
    }, opts);
    var modal = $('#' + opts.id);
    if (!modal.length) {
        // 临时
        modal = $(MODAL_HTML(opts.id, '')).appendTo('body');
    }
    modal.find('.modal-title').html(opts.title);
    modal.find('.modal-body').html(text);
    var footer = modal.find('.modal-footer').html('');
    for (var btn of opts.btns) {
        $(`<button id="btn_${btn.id}" type="button" class="btn ${btn.class}">${btn.text}</button>`)
            .prependTo(footer)
            .on('click', function() {
                opts.onBtnClick(opts, this);
            });
    }
    bindModalEvent(modal, opts).modal('show');
}

function hidePreview() {
    clearTimeout(g_cache.previewClip);
    $('#preview_video_popup').css({
        display: 'none',
        position: 'fixed',
    }).find('video').attr('src', '');
    g_player.tryStart();
}
$(function() {
    loadConfig();
    $('[data-toggle="tooltip"]').tooltip()



    $(window).on('DOMContentLoaded', event => {
            const sidebarToggle = document.body.querySelector('#sidebarToggle');
            if (sidebarToggle) {
                if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
                    document.body.classList.toggle('sb-sidenav-toggled');
                }
            }
        })
        .on('blur', event => {
            g_cache.playing = g_player.isPlaying();
            g_player.playVideo(false);
            hidePreview();
        })
        .on('focus', event => {
            if (g_cache.playing) g_player.playVideo(true);
        });


    window.prompt = function(text, opts) {
        buildModal(`<textarea class="form-control" rows="3">${text}</textarea>`, Object.assign({
            id: 'modal_prompt',
            title: '请输入',
            onBtnClick: (config, btn) => {
                var par = $(btn).parents('.modal');
                if (config.callback(par.find('textarea').val()) === false) return;
                par.modal('hide');
            }
        }, opts));
    }

    window.confirm = function(text, opts) {
        buildModal(text, Object.assign({
            id: 'modal_confirm',
            title: '询问',
            onBtnClick: (config, btn) => {
                if (config.callback(btn.id.substring(4)) === false) return;
                $(btn).parents('.modal').modal('hide');
            }
        }, opts));
    }

    $(document)
        .on('dragstart', '[data-file]', function(e) {
            g_cache.draging = true;
            dragFile(e, $(this).find('img').attr('src'));
        })
        .on('dragend', '[data-file]', function(e) {
            g_cache.draging = false;
        })
        .on('focus', '.time_start,.time_end', function(e) {
            doAction(null, this.classList.contains('time_start') ? 'toStart' : 'toEnd');
            g_player.playVideo(false);
        })
        .on('mousewheel', '.time_start,.time_end', e => g_video.onTimeInputScroll(e))
        .on('mousewheel', '[data-preview]', function(event) {
            srcollVideo(event, $('#preview_video_popup video')[0])
        })
        .on('mouseenter', '[data-preview]', function(event) {
            //if(!event.altKey) return;
            var self = $(this);
            var pos = self.data('pos');
            var popup = $('#preview_video_popup');

            var target = $(this.parentNode);
            var offset = target.offset();
            var file = nodejs.files.getPath(target.data('file'));
            clearTimeout(g_cache.previewClip);
            if (pos == 'self') {
                fun = () => {
                    popup.css({
                        left: (event.pageX - popup.width() / 2) + 'px',
                        top: (event.pageY - popup.height() / 2) + 'px',
                        display: 'unset',
                    })
                }
            } else {
                fun = () => {
                    popup.css({
                        left: (offset.left - 10 - popup.width()) + 'px',
                        top: (offset.top - popup.height() / 2) + 'px',
                        display: 'unset',
                    })
                }
            }
            g_cache.previewClip = setTimeout(() => {
                g_player.tryStop();
                // 如果video全屏，则插入到video内部 反之插入body内部
                popup.prependTo(g_cache.fullScreen ? '#player' : 'body');
                fun();
                popup.find('video').attr('src', file);
            }, 250);
        })
        .on('mouseout', '[data-preview]', function(event) {
            if (this.dataset.pos == 'self') return;
            hidePreview();
        })
        .on('mouseout', '#preview_video_popup', function(event) {
            hidePreview();
        })
        .on('shown.bs.modal', function(event) {
            var i = 4;
            for (var modal of $('.modal.show')) {
                modal.style.backgroundColor = 'rgba(0, 0, 0, ' + (++i / 10) + ')';
            }
        })
        .on('hidden.bs.modal', function(event) {
            var modal = event.target;
            if (modal.dataset.destroy) {
                modal.remove();
            }
        })
        .on('show.bs.collapse', '.collapse', function(event) {
            var items = $(this).find('[data-video]');
            if (!items.length) { // 没有视频
                clearEventBubble(event); // 禁止打开
                return;
            }
        })
        .on('show.bs.dropdown', '[data-dropdown]', function(event) {
            switch (this.dataset.dropdown) {
                case 'clipList':
                    $(this).find('.dropdown-menu').html($('.div_video_side_list').html()).find('.lazyload').lazyload();
                    break;
            }
        })
        .on('hide.bs.dropdown', '[data-dropdown]', function(event) {
            hidePreview();
            switch (this.dataset.dropdown) {
                case 'clipList':
                    $(this).find('.dropdown-menu').html('');
                    break;
            }
        })
        .on('shown.bs.collapse', '.collapse', function(event) {
            g_config.lastFolder = this.id.substring(7);
            local_saveJson('config', g_config);
            if (g_cache.folderShow) clearTimeout(g_cache.folderShow);
            g_cache.folderShow = setTimeout(() => {
                var d = $(this.children);
                d.css('height', 'calc(100vh - ' + d.offset().top + 'px)');
            }, 1000);
        })
        .on('keyup', function(e) {
            // console.log(e.code.toLowerCase());
            switch (e.code.toLowerCase()) {
                case 'space':
                    if ($('input:focus').length) return;
                    if ($('.modal.show').length) return;
                    clearEventBubble(e);
                    g_player.playVideo();
                    return;
                case 'digit1':
                    if (e.altKey) g_video.setStart();
                    return;
                case 'digit2':
                    if (e.altKey) g_video.setEnd();
                    return;
                case 'digit3':
                    if (e.altKey) {
                        loadTab('tags');
                        $('#input_tag').focus();
                    }
                    return;
                case 'digit4':
                    if (e.altKey) doAction(null, 'addPos');
                    return;
                case 'f11':
                    //toggleFullScreen();
                    return;
                case 'browserback':
                    window.history.back();
                    return;
                case 'keyf':
                    if (e.ctrlKey) {
                        g_video.modal_search();
                    }
                    return;
                case 'keyr':
                    if (e.ctrlKey) ipc_send('reload');
                    return;
                case 'f12':
                    ipc_send('devtool');
                    return;
                case 'f5':
                    ipc_send('reload');
                    return;
            }
            switch (e.key.toLowerCase()) {
                case 'arrowleft':
                    if (e.altKey) window.history.back();
                    return;
                case 'browserforward':
                    window.history.forward();
                    return;
                case 'arrowright':
                    if (e.altKey) window.history.forward();
                    return;
            }
        })
        .on('click', '[data-action]', function(event) {
            if (this.classList.contains('disabled')) return;
            doAction(this, this.dataset.action, event);
        })
        .on('contextmenu', '[data-contenx]', function(event) {
            if (this.classList.contains('disabled')) return;
            doAction(this, this.dataset.contenx, event);
            clearEventBubble(event);
        });
});


function toggleSidebar() {
    document.body.classList.toggle('sb-sidenav-toggled');
    localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
}

var g_cache = {
    selectedClips: [],
    searchedClip: {},
    previewClip: -1,
    searchTags: [],
    filters: [],
    fullScreen: false,
}

function doAction(dom, action, event) {
    var action = action.split(',');
    // if (g_actions[action[0]]) {
    //     g_actions[action[0]](dom, action, event);
    // }
    switch (action[0]) {
        case 'openURL':
            ipc_send('url', dom.dataset.url);
            break;
        case 'modal_folders':
            var input = $(action[1]);
            g_video.modal_folder(input.val(), folder => {
                input.val(folder[0]);
            });
            break;
        case 'singleSelect':
            $(action[1] + '.' + action[2]).removeClass(action[2]);
            dom.classList.add(action[2])
            break;
        case 'sub_item':
            g_player.setCurrentTime(Number(dom.dataset.time));
            break;
        case 'sub_saveSub':
            g_sub.saveSub();
            break;
        case 'sub_refresh':
            g_sub.loadSub(g_video.key);
        case 'sub_delete':
            var file = './subs/' + g_video.key + '.vtt';
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
            break;
        case 'sub_setTarget':
            var key = g_video.key;
            if (key) {
                g_sub.modal(dir => {
                    g_sub.setTarget(key, dir);
                });
            }
            break;
        case 'videoThumb':
            var key = g_video.key;
            if (key) {
                toast('生成中,可能要花费一些时间');
                ipc_send('videoThumb', { file: g_player.getUrl(), key: key });
            }
            break;
        case 'openFile':
        case 'openFolder':
            ipc_send('openFile', dom.dataset.file)
            break;
        case 'btnGroup_select':
            for (var d of dom.parentElement.children) {
                d.className = 'btn' + (d == dom ? ' btn-primary' : '');
            }
            break;
        case 'filter_addFolder':
            if (g_video.filter_get('folder').length) {
                return toast('目录过滤器已经存在!', 'alert-danger');
            }
            g_video.modal_folder('', folder => {
                g_video.filter_add('目录: ' + folder[0], `d.folder == '${folder[0]}'`, 'folder');
            });
            break;
        case 'filter_addTag':
            g_video.modal_tag(g_cache.searchTags, tags => {
                for (var tag of tags) {
                    g_video.filter_add('标签: ' + tag, `clip.tags.includes('${tag}')`, 'tag');
                }
            });
            break;
        case 'filter_addTime':
            g_video.modal_time(res => {
                var t = res.date.getTime();
                g_video.filter_add(`创建日期: ${res.symbol}${res.date.format('yyyy/MM/dd'), 'date'}`, `time ${res.symbol} ${t}`);
            });
            break;
        case 'filter_addSize':
            g_video.modal_size(res => {
                var w1 = unescapeHTML(res.w1);
                var h1 = unescapeHTML(res.h1);
                g_video.filter_add(`尺寸: 宽 ${w1} ${res.w} & 高 ${h1} ${res.h}`, `d.meta && d.meta.width ${w1} ${res.w} && d.meta.height ${h1} ${res.h}`, 'size');
            });
            break;
        case 'data_export':
            var d = {};
            for (var key of local_getList()) {
                d[key] = localStorage.getItem(key);
            }
            downloadData(JSON.stringify(d), 'data_' + (new Date().format('yyyy_MM_dd_hh_mm_ss')) + '.json');
            break;
        case 'data_import':
            $('#upload').click();
            break;
        case 'data_reset':
            confirm('<b class="text-danger">你的数据将会被清空,无法找回!</b>', {
                title: '确定删除吗?',
                callback: (id) => {
                    if (id == 'ok') {
                        local_saveJson('videos', {});
                        location.reload();
                    }
                    return true;
                }
            });
            break;
        case 'setScrollAddTime':
            setScrollAddTime(dom.dataset.time);

            break;
        case 'toStart':
            if (g_video.pos1 >= 0) g_player.setCurrentTime(g_video.pos1);
            break;
        case 'toEnd':
            if (g_video.pos2 >= 0) g_player.setCurrentTime(g_video.pos2);
            break;
        case 'resetPos':
            g_video.clearInput();
            break;
        case 'setVideoCover':
            var k = g_video.key;
            if (!k) return;
            ipc_send('deleteFile', [`%path%/cover/${k}.jpg`]);
            g_video.videoCover(k, true, g_player.getCurrentTime());
            break;
        case 'folder_rename':
            var folder = g_menu.target.parents('[data-folder]').data('folder');
            prompt(folder, {
                title: '重命名',
                callback: newFolder => {
                    if (newFolder != folder) {
                        for (var time in g_video.getFolders()[folder]) {
                            g_video.getVideo(time).folder = newFolder;
                        }
                        local_saveJson('_videos', g_video);
                        g_video.initVideos();
                    }
                }
            });
            g_menu.hideMenu('folder_item');
            break;
        case 'video_cover':
        case 'video_delete':
        case 'video_openFolder':
        case 'video_setFolder':

            var p = $(dom).parents('[data-key]');
            var k = p.attr('data-key');
            var d = g_video.getVideo(k);
            switch (action[0]) {
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
                    confirm('是否同时删除文件?', {
                        title: '<b class="text-danger">删除文件</b>',
                        callback: id => {
                            if (id == 'ok') ipc_send('deleteFile', [d.file]);
                        }
                    });
                    break;
            }
            g_menu.hideMenu('video_item');
            break;
        case 'clip_delete':
        case 'clip_cover':
        case 'clip_cut':
        case 'clip_openFolder':
            var p = $(dom).parents('[data-key]');
            var k = p.attr('data-key');
            var d = g_video.data.clips[k];

            switch (action[0]) {
                case 'clip_openFolder':
                    ipc_send('openFolder', `%path%/cuts/${k}.mp4`)
                    break;
                case 'clip_cut':
                    //  -c:v libx264 -c:a aac
                    g_video.cut(k, d.start, d.end - d.start, g_video.data.file, `%path%/cuts/${k}.mp4`);
                    break;
                case 'clip_cover':
                    g_video.cover(k, d.start, g_video.data.file, `%path%/cover/${k}.jpg`);
                    break;

                case 'clip_delete':
                    ipc_send('deleteFile', [`%path%/cover/${k}.jpg`, `%path%/cuts/${k}.mp4`]);
                    g_video.removeClip(g_video.key, k);
                    break;
            }
            g_menu.hideMenu('clip_item');
            break;
        case 'btn_file_selectAll':
            var a = $('[data-action="files_select"].active');
            if (a.length) {
                a.removeClass('active');
            } else {
                $('[data-action="files_select"]').addClass('active');
            }
            g_video.onSelectFile();
            break;

            break;
        case 'collection_add':
            var a = $('[data-action="card_selected"].bg-primary');
            for (var d of a) {
                var key = d.dataset.key;
                g_cache.selectedClips[key] = g_cache.searchedClip[key];
            }
            toast('成功添加了 ' + a.length + ' 个视频', 'alert-success');
            g_video.clearSearchClip();
            break;
        case 'btn_file_add':
            var files = [];
            var a = $('[data-action="files_select"].active');
            for (var d of a) files.push(d.dataset.file);
            toast('成功添加了 ' + a.length + ' 个视频', 'alert-success');
            g_video.addFiles(files, $('#input_folderName').val());
            $('#modal_addFiles').modal('hide');
            break;
        case 'files_select':
            $(dom).toggleClass('active');
            g_video.onSelectFile();
            break;
        case 'card_selected':
            $(dom).toggleClass('bg-primary');
            var cnt = $('[data-action="card_selected"].bg-primary').length;
            $('#selected_cnt').html(cnt);
            $('[data-action="collection_add"]').toggleClass('disabled', cnt == 0);
            break;
        case 'tag_add':
            if (!$(dom).hasClass('badge-success')) { // 排除最近的已被添加的标签
                g_video.tags.addTag($(dom).attr('data-tag'));
            }
            break;
        case 'loadClip':
            var d = $(dom);
            if (d.hasClass('card_active')) {
                return doAction(null, 'resetPos');
            }
            g_video.loadClip($(dom).attr('data-clip'));
            break;
        case 'toggleSideBar':
            toggleSidebar();
            break;
        case 'loadVideo':
            g_video.loadVideo($(dom).attr('data-video'));
            break;
        case 'addPos':
            g_video.addPos();
            break;
        case 'tag_remove':
            g_video.tags.removeTag($(dom).attr('data-tag'));
            break;
        case 'search':
            g_site.doSubmit();
            break;
        case 'site_add':
            g_site.editSite();

            break;

        case 'minSize':
            ipc_send('min');
            break;

        case 'maxSize':
            ipc_send('max');
            break;

        case 'close':
            ipc_send('close');
            break;
    }
}

function loadTab(id) {
    $('#_' + id + '-tab').click();
}

function domSelector(opts, s = '') {
    for (var key in opts) {
        s += '[data-' + key;
        if (opts[key] != '') {
            s += '="' + opts[key] + '"';
        }
        s += ']';
    }
    return $(s);
}

function dragFile(ev, src) {
    g_player.playVideo(false);

    var target = ev.currentTarget;
    ev.preventDefault();

    var file = target.dataset.file;
    g_cache.dragFile = file;
    ipc_send('ondragstart', {
        file: file,
        icon: target.dataset.icon || src,
    });
}

function ipc_send(type, msg) {
    var data = {
        type: type,
        msg: msg
    }
    if (typeof(_api) != 'undefined') {
        _api.method(data); // ELECTRON
    } else {
        console.log(JSON.stringify(data));
    }
}

function toast(msg, style = 'alert-info', time = 3000) {
    var dom = $('.alert');
    dom.removeClass(dom.attr('data-style')).addClass(style).attr('data-style', style);
    dom.removeClass('hide').find('.text').html(msg);
    if (g_cache.toastTimer) clearInterval(g_cache.toastTimer);
    g_cache.toastTimer = setInterval(() => {
        dom.addClass('hide');
    }, time);
}