var g_menu = {


    init: function() {
        this.registerMenu({
            name: 'clip_item',
            selector: '[data-action="loadClip"]',
            dataKey: 'data-clip',
            html: `
                <div class="list-group" style="width: 100%;">
                    <a data-action="clip_addToList" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-plus mr-2"></i><span>加入列表</span>
                      </a>

                    <a data-action="clip_openFolder" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-folder mr-2"></i><span>定位</span>
                      </a>
                    <a data-action="clip_cut" class="list-group-item list-group-item-action text-secondary" aria-current="true">
                        <i class="bi bi-scissors mr-2"></i><span>裁剪</span>
                      </a>

                     <a data-action="clip_cover" class="list-group-item list-group-item-action text-success" aria-current="true">
                        <i class="bi bi-scissors mr-2"></i><span>封面</span>
                      </a>

                      <a data-action="clip_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
             onShow: key => {
                domSelector({ action: 'clip_addToList' }).find('span').html(g_list.isInList('clips', key) ? '从列表移除' : '加入列表');
            }
        });

        this.registerMenu({
            name: 'share_item',
            selector: '[data-action="share_item"]',
            dataKey: 'data-file',
            html: `
                <div class="list-group" style="width: 100%;">
                    <a data-action="share_item_openFolder" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-folder mr-2"></i><span>定位</span>
                      </a>
                      <a data-action="share_item_deleteFile" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                    </div>
            `,

        });



        this.registerMenu({
            name: 'video_item',
            selector: '[data-action="loadVideo"]',
            dataKey: 'data-video',
            html: `
                <div class="list-group" style="width: 100%;">
                    <a data-action="video_addToList" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-plus mr-2"></i><span>加入列表</span>
                      </a>

                     <a data-action="video_addClipsToList" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-list-nested mr-2"></i><span>所有片段</span>
                      </a>

                    <a data-action="video_openFolder" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-folder mr-2"></i><span>定位</span>
                      </a>
                    <a data-action="video_setFolder" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-inbox mr-2"></i><span>分类</span>
                      </a>
                     <a data-action="video_cover" class="list-group-item list-group-item-action text-success" aria-current="true">
                        <i class="bi bi-scissors mr-2"></i><span>封面</span>
                      </a>
                      <a data-action="video_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
            onShow: key => {
                domSelector({ action: 'video_addToList' }).find('span').html(g_list.isInList('videos', key) ? '从列表移除' : '加入列表');
                domSelector({ action: 'video_addClipsToList' }).toggleClass('hide', Object.keys(g_video.getVideo(key).clips).length == 0);


            }
        });

        this.registerMenu({
            name: 'folder_item',
            selector: '#sidebar-wrapper .accordion .card-header',
            dataKey: 'id',
            html: `
                <div class="list-group" style="width: 100%;">
                    <a data-action="folder_rename" class="list-group-item list-group-item-action text-primary" aria-current="true">
                        <i class="bi bi-folder mr-2"></i><span>重命名</span>
                     </a>
                     <a data-action="folder_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                     </a>
                 </div>
            `,
        });
        registerAction('showlist', (dom, action) => {
            $('#modal_list').modal('show');

        });

        registerAction(['clip_delete', 'clip_cover', 'clip_cut', 'clip_openFolder', 'clip_addToList'], (dom, action) => {
            var p = $(dom).parents('[data-key]');
            var k = p.attr('data-key');
            var d = g_video.data.clips[k];

            switch (action[0]) {
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
                        local_saveJson('_videos', g_video);
                        g_video.initVideos();
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
                    local_saveJson('_videos', g_video);
                    g_video.initVideos();
                }
            });
            g_menu.hideMenu('folder_item');
        });

        registerAction(['video_cover', 'video_addClipsToList', 'video_delete', 'video_openFolder', 'video_setFolder', 'video_addToList'], (dom, action) => {
            var p = $(dom).parents('[data-key]');
            var k = p.attr('data-key');
            var d = g_video.getVideo(k);
            switch (action[0]) {
                case 'video_addClipsToList':
                    var i = 0
                    for(var k in d.clips){
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
                    confirm('是否同时删除文件?', {
                        title: '<b class="text-danger">删除文件</b>',
                        callback: id => {
                            if (id == 'ok') ipc_send('deleteFile', [d.file]);
                        }
                    });
                    break;
            }
            g_menu.hideMenu('video_item');
        });
    },

    hideMenu: function(key) {
        $('#rm_' + key).hide();
    },

    registerMenu: function(opts) {
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
            g_menu.target = dom;
            var key = dom.attr(opts.dataKey);
            g_menu.key = key;
            opts.onShow && opts.onShow(key);
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