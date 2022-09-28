g_menu.registerMenu({
    name: 'clip_item',
    selector: '[data-dbaction="loadClip"]',
    dataKey: 'data-clip',
    html: `
                <div class="list-group" style="width: 100%;">
                     <a data-action="clip_selectAll" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-check-square mr-2"></i><span>全选</span>
                      </a>

                    <a data-action="clip_startAtEnd" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-arrow-return-right mr-2"></i><span>从终点开始</span>
                      </a>

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
                        <i class="bi bi-image mr-2"></i><span>封面</span>
                      </a>

                      <a data-action="clip_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
    onShow: key => {
        domSelector({ action: 'clip_addToList' }).find('span').html(g_list.isInList('clips', key) ? '从列表移除' : '加入列表');
        domSelector({ action: 'clip_selectAll' }).find('span').html($('.div_video_side_list .card_selected').length ? '全不选' : '全选');

    }
});

g_menu.registerMenu({
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

g_menu.registerMenu({
    name: 'search_item',
    selector: '.search_item',
    dataKey: 'data-key',
    html: `
                <div class="list-group" style="width: 100%;">
                    <a data-action="search_toPos" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-folder mr-2"></i><span>定位</span>
                      </a>
                    </div>
            `,
});

registerAction(['search_toPos'], (dom, action) => {
    var p = g_menu.target;
    switch (action[0]) {
        case 'search_toPos':
            g_video.loadVideo(p.attr('data-video'), p.attr('data-start'));
            break;
    }
    $('#modal_search').modal('hide');
    g_menu.hideMenu('search_item');
});

g_menu.registerMenu({
    name: 'video_item',
    selector: '[data-action="loadVideo"]',
    dataKey: 'data-video',
    html: `
                <div class="list-group" style="width: 100%;">
                    <a data-action="video_addToList" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-plus mr-2"></i><span>加入列表</span>
                      </a>
                     <a data-action="video_addClipsToList" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-list-nested mr-2"></i><span>片段加入列表</span>
                      </a>
                      
                      <a data-action="video_checkClips" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-bug-fill mr-2"></i><span>检查丢失</span>
                      </a>
                      <a data-action="video_clipsCover" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-file-image mr-2"></i><span>重新生成封面</span>
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
                      <a data-action="video_rename" class="list-group-item list-group-item-action " aria-current="true"><i class="bi bi-input-cursor-text mr-2 me-2"></i><span>重命名</span></a>
                    </div>
            `,
    onShow: key => {
        domSelector({ action: 'video_addToList' }).find('span').html(g_list.isInList('videos', key) ? '从列表移除' : '加入列表');
        domSelector({ action: 'video_addClipsToList' }).toggleClass('hide', Object.keys(g_video.getVideo(key).clips).length == 0);
    }
});

g_menu.registerMenu({
    name: 'folder_item',
    selector: '#sidebar-wrapper .accordion .card-header',
    dataKey: 'id',
    html: `
                <div class="list-group" style="width: 100%;">
                     <a data-action="folder_addClipsToList" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-list-nested mr-2"></i><span>片段加入列表</span>
                      </a>
                    <a data-action="folder_replaceFile" class="list-group-item list-group-item-action text-primary" aria-current="true">
                        <i class="bi bi-input-cursor mr-2"></i><span>替换目录</span>
                    </a>
                    <a data-action="folder_rename" class="list-group-item list-group-item-action text-primary" aria-current="true">
                        <i class="bi bi-pencil mr-2"></i><span>重命名</span>
                     </a>
                     <a data-action="folder_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                     </a>
                     <a data-action="folder_deleteClips" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除所有片段</span>
                     </a>
                 </div>
            `,
});
registerAction('showlist', (dom, action) => {
    $('#modal_list').modal('show');

});

registerAction('clip_selectAll', (dom, action) => {
    var selected = $('.div_video_side_list .card_selected');
    if (selected.length) {
        selected.removeClass('card_selected');
    } else {
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
            if (!d.end) return toast('此片段没有设置终点');
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
            g_video.cover(k, 0, `*path*/cuts/${k}.mp4`, `*path*/cover/${k}.jpg`);
            break;

        case 'clip_delete':
            ipc_send('deleteFile', [`*path*/cover/${k}.jpg`, `*path*/cuts/${k}.mp4`]);
            g_video.removeClip(g_video.key, k);
            break;
    }
    g_menu.hideMenu('clip_item');
});
registerAction(['folder_rename', 'folder_deleteClips', 'folder_delete', 'folder_addClipsToList', 'folder_replaceFile'], (dom, action) => {
    var folder = g_menu.target.parents('[data-folder]').data('folder');
    switch (action[0]) {
        case 'folder_deleteClips':
            confirm('确定删除所有片段吗?', {
                title: '<b class="text-danger">删除片段</b>',
                callback: id => {
                    if (id == 'ok') {
                        var i = 0
                        for (let id in g_video.folders[folder]) {
                            toast('成功删除 ' + g_video.removeVideoClips(id) + ' 个片段!', 'alert-success');
                        }
                    }
                }
            });
            break;
        case 'folder_replaceFile':
            var i = 0;
            prompt('./', {
                title: '替换文件',
                callback: search => {
                    // if(search.at(-1) == '')
                    for (let id in _videos) {
                        let d = _videos[id];
                        if (d.folder == folder) {
                            // search.replace('./', )
                            _videos[id].file = search + '\\' + getFileName(d.file, true);
                            i++;
                        }
                    }
                    g_video.saveVideos();
                    toast('成功替换 ' + i + ' 个文件!', 'alert-success');

                }
            });
            break;
        case 'folder_addClipsToList':
            var i = 0
            for (let id in g_video.folders[folder]) {
                let d = g_video.getVideo(id);
                for (var k in d.clips) {
                    g_list.addToList('clips', k, d.clips[k].tags.join(','));
                    i++;
                }
            }
            toast('成功添加 ' + i + ' 个片段!', 'alert-success');
            break;
        case 'folder_rename':
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
            break;

        case 'folder_delete':
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
                    g_video.saveVideos()
                }
            });
            break;

    }
    g_menu.hideMenu('folder_item');

});

registerAction(['video_cover', 'video_clipsCover', 'video_rename', 'video_addClipsToList', 'video_delete', 'video_openFolder', 'video_setFolder', 'video_addToList', 'video_checkClips'], (dom, action) => {
    var p = $(dom).parents('[data-key]');
    var k = p.attr('data-key');
    var d = g_video.getVideo(k);
    switch (action[0]) {
        case 'video_rename':
            let old = g_menu.target.attr('data-file');
            prompt(old, {
                title: '重命名文件',
                callback: file => {
                    let v = g_video.getVideo(g_menu.key);
                    if(g_player.url == v.file){
                        // 解除播放
                         g_player.destrory();
                    }
                    if (!v || isEmpty(file) || file == old) return;
                    nodejs.files.rename(old, file)
                    if (nodejs.files.exists(file)) {
                        v.file = file;
                        g_video.saveVideos();
                        toast('更改路径成功', 'alert-success')
                    }
                }
            });
            break;
        case 'video_clipsCover':
            for (var time in d.clips) {
                g_video.cover(time, 0, '*path*/cuts/' + time + '.mp4', '*path*/cover/' + time + '.jpg', false);
            }
            toast('请稍后...');
            break;
        case 'video_checkClips':
            for (var time in d.clips) {
                var clip = d.clips[time];
                var img = '*path*/cover/' + time + '.jpg';
                var mp4 = '*path*/cuts/' + time + '.mp4';
                if (!nodejs.files.exists(img)) {
                    i++;
                    g_video.cover(time, 0, mp4, img, false);
                }
                if (!nodejs.files.exists(mp4)) {
                    i++;
                    g_video.cut(time, clip.start, clip.end - clip.start, d.file, mp4, false);
                }
            }
            toast(i ? `有${i}处正在修复` : '没有丢失');
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
            if (d.url) {
                ipc_send('url', d.url)
            } else {
                ipc_send('openFolder', d.file)
            }
            break;
        case 'video_cover':
            g_video.videoCover(k);
            break;

        case 'video_delete':
            confirm(`
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="checkbox_deleteClips">
                  <label class="form-check-label" for="checkbox_deleteClips">
                    删除片段
                  </label>
                </div>
                 <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="checkbox_deleteVideo">
                  <label class="form-check-label" for="checkbox_deleteVideo">
                    删除原视频
                  </label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="checkbox_hideVideo" onchange="$('#checkbox_removeVideo').prop('checked', false)">
                  <label class="form-check-label" for="checkbox_hideVideo">
                    隐藏视频
                  </label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="checkbox_removeVideo"  onchange="$('#checkbox_hideVideo').prop('checked', false)">
                  <label class="form-check-label" for="checkbox_removeVideo">
                    删除数据
                  </label>
                </div>
                `,  {
                title: '<b class="text-danger">删除文件</b>',
                callback: id => {
                    if($('#checkbox_deleteClips').prop('checked')) g_video.removeVideoClips(k, false);
                    if($('#checkbox_removeVideo').prop('checked')){
                       g_video.removeVideo(k);
                    }else
                    if($('#checkbox_hideVideo').prop('checked')){
                        d.enable = false
                        g_video.saveVideos()
                    }
                    if($('#checkbox_deleteVideo').prop('checked')) ipc_send('deleteFile', [d.file]);
                }})
            break;
    }
    g_menu.hideMenu('video_item');
});