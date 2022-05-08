$(function() {
    $.fn.tooltip.Constructor.Default.whiteList['*'].push(/^data-[\w-]*$/i);
    loadConfig();
    $('[data-toggle="tooltip"]').tooltip()
    $('[data-toggle="popover"]').
    on('shown.bs.popover', function(e) {
        switch (this.dataset.originalTitle) {
            case '视图':
                domSelector({ action: 'folder_style,' + g_config.folder_style }).addClass('active');
                break;

        }
    }).popover({
        html: true,
        container: "body",
        trigger: 'focus',
        content: function() {
            switch (this.dataset.originalTitle) {
                case '搜索视图':
                    var h = '敬请期待';
                    // for (var type of ['image', 'text']) {
                    //     h += `<a data-action="search_style,${type}" href="#" class="badge badge-${type == g_config.search_style ? 'primary' : 'secondary'} mr-2">${type}</a>`;
                    // }
                    return h;

                case '视图':
                    var h = '';
                    for (var type of ['image', 'text']) {
                        h += `<a data-action="folder_style,${type}" href="#" class="badge badge-${type == g_config.folder_style ? 'primary' : 'secondary'} mr-2">${type == 'image' ? '背景图' : '文本'}</a>`;
                    }
                    return h;

                case '排序':
                    var h = '';
                    var sort = g_config.folder_sort || '名称';
                    for (var type of ['名称', '时长', '片段数', '替换文本', '自定义']) {
                        h += `<a data-action="folder_sort,${type}" href="#" class="badge badge-${type == sort ? 'primary' : 'secondary'} mr-2">${type}</a>`;
                    }
                    h += '<hr class="border-bottom">';
                    for (var k of [0, 1]) {
                        h += `<a data-action="folder_sort_reverse,${k}" href="#" class="badge badge-${k == g_config.folder_sort_reverse ? 'primary' : 'secondary'} mr-2">${k == 0 ? '正序' : '反序'}</a>`;
                    }
                    return h;
            }
            return ` `;
        }
    });

    $(window).on('DOMContentLoaded', event => {
            if (g_config.sidebar) {
                const sidebarToggle = document.body.querySelector('#sidebarToggle');
                if (sidebarToggle) {
                    if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
                        document.body.classList.toggle('sb-sidenav-toggled');
                    }
                }
            }
        })
        .on('blur', event => {
            if(getConfig('autoStopPlay')){
                g_player.tryStop();
            }
            hidePreview(false);
        })
        .on('focus', event => {
            if(getConfig('autoStopPlay')){
                console.log('start');
                g_player.tryStart();
            }
        });

    // bug 位置错误
    //     $('#myTab').on('shown.bs.tab', function(e){
    //      if(e.target.id == '_list-tab'){
    //         g_video.initedCliplist = true;
    //         var d = $('#_list');
    //         var top = d.position().top;
    //         g_select.register('_list', {
    //             childrens: 'li',
    //             activeClass: 'seled',
    //             onEnd: () => {},
    //             top: top,
    //             bottom: top + d[0].offsetHeight,
    //             scrollEl: d[0],
    //         });
    //      }
    // });

    $(document)
        .on('dragstart', '[data-file]', function(e) {
            g_cache.draging = true;
            dragFile(e, $(this).find('img').attr('src') || this.dataset.icon);
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
            var file = self.attr('data-file');
            var target;
            if(file){
                target = self;
            }else{
                target = file = self.parents('[data-file]');
                file = target.attr('data-file');
            }
            var offset = target.offset();
            file = nodejs.files.getPath(file);
            clearTimeout(g_cache.previewClip);
            switch (pos) {
                case 'self': // todo
                    fun = () => {
                        popup.css({
                            left: (event.pageX - popup.width() / 2) + 'px',
                            top: (event.pageY - popup.height() / 2) + 'px',
                            display: 'unset',
                        })
                    }
                    break;

                case 'right-bottom':
                    fun = () => {
                        popup.css({
                            bottom: '10px',
                            right: '10px',
                            top: 'unset',
                            left: 'unset',
                            display: 'unset',
                        })
                    }
                    break;

                default:
                    fun = () => {
                        popup.css({
                            left: (offset.left - 10 - popup.width()) + 'px',
                            top: Math.max(0, offset.top - popup.height() / 2) + 'px',
                            display: 'unset',
                        })
                    };
            }
            g_cache.previewClip = setTimeout(() => {
                g_player.tryStop();
                // 如果video全屏，则插入到video内部 反之插入body内部
                popup.prependTo(g_cache.fullScreen ? '#player' : 'body');
                fun();
                popup.find('video').attr('src', file + '?t=' + new Date().getTime());
            }, parseInt(self.data('time')) || 250);
        })
        .on('mouseout', '[data-preview]', function(event) {
            //if (this.dataset.pos == 'self') return;
            hidePreview();
        })
        .on('mouseout', '#preview_video_popup', function(event) {
            hidePreview();
        })
        .on('shown.bs.modal', function(event) {
            g_player.tryStop();
            var i = 4;
            for (var modal of $('.modal.show')) {
                modal.style.backgroundColor = 'rgba(0, 0, 0, ' + (++i / 10) + ')';
            }
        })
        .on('hidden.bs.modal', function(event) {
            g_player.tryStart();
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
        })
        .on('keyup', function(e) {
            // e.code.toLowerCase()
            // case 'browserback':
            //     window.history.back();
            //     return;
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
        .on('dblclick', '[data-dbaction]', function(event) {
            if (this.classList.contains('disabled')) return;
            doAction(this, this.dataset.dbaction, event);
        })
        .on('change', '[data-change]', function(event){
            if (this.classList.contains('disabled')) return;
            doAction(this, this.dataset.change, event);
        })
        .on('contextmenu', '[data-contenx]', function(event) {
            if (this.classList.contains('disabled')) return;
            doAction(this, this.dataset.contenx, event);
            clearEventBubble(event);
        });

    $('#wrapper').removeClass('hide');

});

function checkUpdate() {
    fetch(`https://api.github.com/repos/hunmer/videoManager/releases/latest`)
        .then(response => {
            return response.ok ? response.json() : { "tag_name": "none" };
        })
        .then(data => {
            // console.log(data);
            if(data.tag_name == 'none'){
                toast('检查更新失败,请去首页查看', 'alert-danger');
            }else
            if (data.tag_name != APP_VERSION) {
                ipc_send('url', data.html_url);
            }else{
                toast('已经是最新版本', 'alert-success');
            }
        });
}

function doAction(dom, action, event) {
    var action = action.split(',');
    if (g_actions[action[0]]) {
        g_actions[action[0]](dom, action, event);
    }
    switch (action[0]) {
        case 'addfiles':
            ipc_send('openFileDialog', { multi: true });
            break;
        case 'pin':
            ipc_send('pin');
            break;
        case 'aboutMe':
            confirm(`
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <img src="res/payment.jpg" draggable="false" style="width: 100%;">
                    </div>
                    <div class="col-md-6 text-center">
                        <img src="favicon.png" style="width: 100px">
                        <h4><a class="badge badge-primary" style="font-size: 2rem">${APP_VERSION}</a></h4>
                        <div  style="margin-top: 20px">
                            <h6 class="text-right">2022年5月9日 00点04分</h6>
                            <h6 class="text-right">by <a href="javascript: ipc_send('url', 'https://github.com/hunmer/')">@hunmer</a></h6>
                            
                        </div>
                    </div>
                </div>
            `, {
                title: '关于',
                btns: [{
                    id: 'checkUpdate',
                    text: '<i class="bi bi-github mr-2"></i>大版本更新',
                    class: 'btn-primary',
                },{
                    id: 'checkUpdate1',
                    text: '<i class="bi bi-code mr-2"></i>小版本更新',
                    class: 'btn-primary',
                }, {
                    id: 'bbs',
                    text: '52pojie@neysummer',
                    class: 'btn-danger',
                }],
                onShow: () => {
                    var arr = g_cache.needUpdate || [];
                    if(arr.length){
                        g_cache.needUpdate = [];
                        showUpdateFiles(UPDATE_SCRIPT_URL, arr);
                    }
                },
                callback: btn => {
                    if(btn == 'checkUpdate'){
                        toast('检查更新中...', 'alert-info');
                        checkUpdate();
                    }else
                    if(btn == 'checkUpdate1'){
                        toast('检查更新中...', 'alert-info');
                        ipc_send('checkUpdate', UPDATE_SCRIPT_URL);
                    }else{
                        ipc_send('url', 'https://www.52pojie.cn/thread-1628845-1-1.html');
                    }
                  return false;
                }
            });
            break;
        case 'config':
            setConfig(action[1], action[2]);
            break;
        case 'folder_sort':
        case 'folder_style':
        case 'folder_sort_reverse':
            const fun = () => {
                setConfig(action[0], action[1]);
                g_video.initVideos();
            }
            if (action[0] == 'folder_sort') {
                switch (action[1]) {
                    case '替换文本':
                        return prompt(g_config.folder_sort_replace || '', {
                            title: '替换文件名(用,分开)',
                            placeholder: '请输入',
                            html: `%html%
                            <p>如: 文件名为 [mp4.com]天道20集.mp4, 可以设置值为 [mp4.com]天道,.mp4 </br>取出来的就是 20</p>
                            `,
                            callback: str => {
                                setConfig('folder_sort_replace', str);
                                fun();
                            }
                        })
                    case '自定义':
                        return prompt(g_config.folder_sort_fun || `
                            var last_a = a1.last || 0;
                            var last_b = b1.last || 0;
                            last_b - last_a;
                            `, {
                            title: '自定义排序代码',
                            placeholder: '请输入',
                            html: `%html%
                            <p>a=前者键值(md5) b=后者键值(md5) a1=前者影片数据(object) b1=后者影片数据(object)</p>
                            `,
                            callback: code => {
                                setConfig('folder_sort_fun', code);
                                fun();
                            }
                        });

                }
            }
            fun();
            break;
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
            ipc_send('deleteFile', [`*path*/cover/${k}.jpg`]);
            g_video.videoCover(k, true, g_player.getCurrentTime());
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

        case 'tag_add':
            if (!$(dom).hasClass('badge-success')) { // 排除最近的已被添加的标签
                g_tag.addTag($(dom).attr('data-tag'));
            }
            break;
        case 'jumpClip':
            g_player.setCurrentTime(dom.dataset.start);
            break;
        case 'loadClip':
            var d = $(dom);
            if (d.hasClass('card_active')) {
                return doAction(null, 'resetPos');
            }
            g_video.loadClip(d.data('clip'));
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
            g_tag.removeTag($(dom).attr('data-tag'));
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