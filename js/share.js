var g_share = {

    init: function() {
        this.modal = $(`<div class="modal fade" id="modal_share" tabindex="-1" aria-labelledby="modal_shareLable" aria-hidden="true">
        <div class="modal-dialog" style="max-width: unset;width: 90%;">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modal_shareLable">共享</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="row">
                      <div class="col-2">
                        <div class="nav flex-column nav-pills" id="v-pills-tab" role="tablist" aria-orientation="vertical">
                          <a class="nav-link active" id="share-pills-home-tab" data-toggle="pill" href="#share-pills-home" role="tab" aria-controls="share-pills-home" aria-selected="true">主页</a>
                          <a class="nav-link" id="share-pills-search-tab" data-toggle="pill" href="#share-pills-search" role="tab" aria-controls="share-pills-search" aria-selected="false">搜索</a>
                          <a class="nav-link" id="share-pills-messages-tab" data-toggle="pill" href="#share-pills-messages" role="tab" aria-controls="share-pills-messages" aria-selected="false">聊天</a>
                          <a class="nav-link" id="share-pills-other-tab" data-toggle="pill" href="#share-pills-other" role="tab" aria-controls="share-pills-other" aria-selected="false">其他</a>
                        </div>
                      </div>
                      <div class="col-10">
                        <div class="tab-content" id="v-pills-tabContent">
                          <div class="tab-pane fade show active" id="share-pills-home" role="tabpanel" aria-labelledby="share-pills-home-tab">
                          </div>
                          <div class="tab-pane fade" id="share-pills-search" role="tabpanel" aria-labelledby="share-pills-search-tab">

                          </div>
                          <div class="tab-pane fade" id="share-pills-messages" role="tabpanel" aria-labelledby="share-pills-messages-tab">
                          </div>
                          <div class="tab-pane fade" id="share-pills-other" role="tabpanel" aria-labelledby="share-pills-other-tab">


                          </div>
                        </div>
                      </div>
                    </div>

                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline-secondary dropdown-toggle float-right" type="button" data-toggle="dropdown" aria-expanded="false"><i class="bi bi-three-dots"></i></button>
                    <div class="dropdown-menu">
                        <a class="dropdown-item" data-action="share_setPath">默认目录</a>
                        <a class="dropdown-item" data-action="share_resetDB">重置数据库</a>
                    </div>

                    <button type="button" class="btn btn-primary disabled" data-action="share_imports"><span class="badge badge-warning mr-2">0</span>导入</button>
                </div>
            </div>
        </div>
    </div>`).appendTo('body');

        $('#share-pills-search').html(`
             <div class="card mb-2">
                        <div class="card-header">
                            <button class="btn btn-outline-secondary dropdown-toggle float-right" type="button" data-toggle="dropdown" aria-expanded="false">过滤</button>
                            <div class="dropdown-menu">
                                <a class="dropdown-item" data-action="share_filter,tag">标签</a>
                                <a class="dropdown-item" data-action="share_filter,uploader">上传人</a>
                                <a class="dropdown-item" data-action="share_filter,source">原视频</a>
                                <a class="dropdown-item" data-action="share_filter,desc">注释</a>
                                <div role="separator" class="dropdown-divider"></div>
                                <a class="dropdown-item" data-action="filter_reset">重置</a>
                            </div>
                        </div>
                        <div class="card-body " id="share_fliters">
                        </div>
                        <div class="card-columns p-2" id="share_search_result">
                            </div>
            `);

        $('#share-pills-other').html(`
            <div class="row">
                <div class="col card p-0">
                    <div class="card-header p-2">
                        <nav aria-label="breadcrumb">
                          <ol class="breadcrumb">
                          </ol>
                        </nav>
                        
                    </div>
                    <div class="card-body p-0" id="share_list" style="height: 300px;overflow-y: auto;">
                        <ul class="list-group none-select">

                        </ul>
                    </div>
                </div>
                <div class="col">
                    ss
                </div>
              </div>
            `);

        this.modal.find('a[data-toggle="pill"]').on('shown.bs.tab', function(event) {
            var id = event.target.href;
            switch (id) {
                case '#share-pills-search':

                    break;
            }
        });

        this.modal.on('shown.bs.modal', function(event) {
            var path = g_config.sharePath;
            if (!path || !nodejs.files.isDir(path)) {
                doAction(null, 'sharePath');
            }
        });
        registerAction('share_filter', (dom, action) => {
            var opts = { title: '', callback: () => {} }
            switch (action[1]) {
                case 'tag':
                    opts = {
                        title: '标签',
                        callback: text => {
                            for (var tag of text.replaceAll('，', ',').split(',')) {
                                g_filter.filter_add('share', `标签: ${tag}`, `r.tags.includes('${tag}')`, 'tag')
                            }
                        }
                    }
                    break;

                case 'uploader':
                    opts = {
                        title: '上传者',
                        callback: text => {
                            g_filter.filter_add('share', `上传者: ${text}`, `r.uploader == '${text}'`, 'uploader')
                        }
                    }
                    break;

                case 'source':
                    opts = {
                        title: '来源',
                        callback: text => g_filter.filter_add('share', `视频来源: ${text}`, `r.link.indexOf('${text}') != -1`, 'source')
                    }
                    break;

                case 'desc':
                    opts = {
                        title: '注释',
                        callback: text => g_filter.filter_add('share', `注释: ${text}`, `r.desc.indexOf('${text}') != -1`, 'desc')
                    }
                    break;
            }
            var val = '';
            if (action[1] != 'tags') {
                val = g_filter.filter_getContent('share', action[1]);
            }
            prompt(val, {
                title: opts.title + ' 过滤',
                callback: text => {
                    if (opts.callback(text) !== false) {
                        g_filter.filter_init('share');
                    }
                },
            })


        });
        registerAction('share_resetDB', (dom, action) => {
            ipc_send('share_resetDB');
        });
        registerAction('share_item_openFolder', (dom, action) => {
            ipc_send('openFile', g_menu.key);
        });
        registerAction('share_item_deleteFile', (dom, action) => {
            ipc_send('deleteFile', [g_menu.key]);
            dom.remove();
            g_share.updateSelected();
        });
        registerAction('share_setPath', (dom, action, event) => {
            prompt(g_config.sharePath || '', {
                title: '根目录',
                placeholder: '支持局域网共享',
                callback: path => {
                    if (!nodejs.files.isDir(path)) {
                        alert('目录不存在!');
                        return false;
                    }
                    g_config.sharePath = path;
                    local_saveJson('config', g_config);
                    g_share.parsePath(path);

                }
            });
        });
        registerAction('share_toFile', (dom, action, event) => {
            var file = dom.dataset.file;
            console.log(file);
        });
        registerAction('share_toPath', (dom, action, event) => {
            this.parsePath(dom.dataset.path || dom.dataset.file);
        });
        // this.modal_show();
        // this.initDB();
        // this.testUpload();
        //this.search();
    },

    initDB: function() {
        ipc_send('share_initDB');
    },

    testUpload: function() {
        this.uploadFiles({
            'C:\\AppServ\\www\\videoManager\\VideoManager\\cuts\\1651286850709.mp4': {
                tags: '标签1,标签2',
                uploader: 'lyj',
                desc: '这是一段注释',
                link: 'http://www.baidu.com',
            }
        });
    },
    search: function(filters) {
        if (!filters) filters = g_filter.filter_list('share');
        if (filters.length == 0) {
            var today = new Date().setHours(0, 0, 0, 0);
            filters = ['r.time >= ' + today]; // 默认展示条件
        }
        var db = this.getDB();
        var res = [];
        if (db) {
            for (var r of db.prepare('SELECT * FROM videos').all()) {
                r.tags = r.tags.split(',');
                for (var filter of filters) {
                    if (eval(filter.content)) {
                        res.push(r);
                    }
                }
            }
        }
        console.log(res);
        return res;
    },

    getFilePath: function(md5){
        return g_config.sharePath+'/'+md5.substr(0, 2) + '/' + md5.substr(2, 2) + '/' + md5 + '.mp4';
    },
    showSearch: function() {
        var h = '';
        var r = this.search(g_filter.filter_list('share'));
        for (var d of r) {
            var f = this.getFilePath(d.md5);
            var n = getFileName(d.source);
            /*
                <img draggable="false" src="./res/loading.gif" data-src="./cover/${time}.jpg" class="card-img-top lazyload" data-preview data-pos='bottom'>

            */
            h += `
            <div class="card search_item" data-action="card_selected" data-md5="${d.md5}"  data-file="${f}" draggable="true">
                <div class="card-body">
                  <b class="card-title d-inline-block text-truncate" style="max-width: -webkit-fill-available;" title="${n}">${n}</b>
                  <p class="card-text">${d.tags.join(',')}</p>
                </div>
              </div>
        `;
        }
        $('#share_search_result').html(h).find('.lazyload').lazyload();
    },
    uploadFiles: function(files) {
        var db = this.getDB(false);
        var i = 0;
        for (var file in files) {
            var md5 = nodejs.files.getMd5(file);
            var saveTo = this.getFilePath(md5);
            var d = Object.assign(files[file], {
                date: new Date().getTime(),
                md5: md5,
            });
            console.log(d);
            db.prepare('INSERT INTO videos (tags, uploader, link, desc, md5) VALUES (@tags, @uploader, @link, @desc, @md5)').run(d);
            i++;
        }
        i > 0 && toast('成功上传 ' + i + '个文件', 'alert-success');
        db.close();
    },

    modal_show: function() {
        if (g_config.sharePath) this.parsePath(g_config.sharePath);
        $('#modal_share').modal('show');
    },

    parsePath: function(path) {
        $('#share_list')[0].scrollTo(0, 0);
        var h = `<li class="breadcrumb-item"><a href="#"><i class="bi bi-pencil" data-action="share_setPath"></i></a></li>`;
        var a = path.replace(g_config.sharePath, '').replaceAll('//', '/').split('/');
        var i = 0;
        var p = g_config.sharePath;
        for (var s of a) {
            i++;
            p += s;
            if (i != a.length) p += '/';
            h += `<li class="breadcrumb-item${i == a.length ? ' active' : ''}" ><a href="#" data-action="share_toPath" data-path="${p}">${i == 1 ? '根目录' : s}</a></li>`;
        }
        this.modal.find('.breadcrumb').html(h);

        a = path.split('/');
        a.pop();
        h = `<li data-action="share_toPath" class="list-group-item" data-path="${a.join('/')}">...</li>`;
        var d = nodejs.files.items(path);

        const getHtml = (icon, id, dir) => {
            const isFolder = icon == 'folder';
            return `
            <li class="share_item list-group-item">
                <div class="custom-control custom-checkbox">
                  <input type="checkbox" class="custom-control-input ml-2" id="${id}" onchange="g_share.updateSelected();">
                  <label class="custom-control-label" for="${id}"><i class="bi bi-${icon} mr-2"></i>${dir}</label>
                </div>
                ${isFolder ? `
                <button data-action="${isFolder ? 'share_toPath' : 'share_toFile'}" draggable="true" data-file="${d.base+'/'+dir}" class="float-right btn"><i class="bi bi-arrow-right"></i></button>
                ` : ''}
            </li>
            `
        }
        for (var dir of d.paths) {
            h += getHtml('folder', 'check_' + dir, dir)
        }
        for (var file of d.files) {
            var ext = popString(file, '.').toLowerCase();
            if (['mp4', 'ts', 'm3u8', 'mdp'].includes(ext)) {
                icon = 'video';
            } else {
                icon = 'file-earmark-text';
            }
            h += getHtml(icon, 'check_' + file, file);
        }
        $('#share_list ul').html(h);

    },
    updateSelected: function() {
        g_share.setSelected(g_share.getSelected().length);
    },
    getSelected: function() {
        return $('#modal_share .custom-control-input:checked');
    },
    setSelected: function(list) {
        if (Array.isArray(list)) {
            cnt = list.length;
        } else {
            cnt = list;
        }
        domSelector({ action: 'share_imports' }).toggleClass('disabled', cnt == 0).find('badge').html(cnt);
    }
}

g_share.init();