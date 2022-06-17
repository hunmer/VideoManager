var g_plugin = {
    events: {},
    resetAll: function() {
        nodejs.files.removeDir('*path*/scripts/');
        g_plugin.defaultList();
    },
    defaultList: function(reload = true) {
        this.list = {};
        this.setItem(guid(), {
            title: '音效插件',
            desc: '添加音效让剪辑不在无聊',
            enable: false,
            content: `
                // 设置起点
                g_plugin.registerEvent('onSetPosStart', data => {
                    playSound('res/ui1.mp3');
                }, 1);
                // 设置终点
                g_plugin.registerEvent('onSetPosEnd', data => {
                    playSound('res/ui1.mp3');
                }, 1);
                // 加载视频
                g_plugin.registerEvent('onLoadVideo', data => {
                    playSound('res/click1.mp3');
                }, 1);
                // 裁剪完视频
                g_plugin.registerEvent('afterCutVideo', data => {
                    playSound('res/done.mp3');
                }, 1);
                // 消息提示
                g_plugin.registerEvent('onToastMessage', data => {
                    var src;
                    if(data.style == 'alert-danger'){ // 失败
                        src = 'res/error.mp3';
                    }else
                    if(data.style == 'alert-success'){ // 成功
                        src = 'res/succ.mp3';
                    }else{
                        src = 'res/msg.mp3';
                    }
                    playSound(src);
                }, 1);
                // 显示界面
                $(document).on('shown.bs.modal', e => {
                    playSound('res/popup.mp3');
                });
                // 关闭界面
                $(document).on('hiden.bs.modal', e => {
                    //playSound('res/popup.mp3');
                });
            `,
            version: '0.0.1',
            primary: 1,
        }, false)
       this.setItem(guid(), {
            title: '导入eagle',
            desc: '在右下角列表按钮添加片段导入到eagle选项',
            enable: false,
            content: `
                 $('<div class="ts _cliplist_show hide"><button type="button" class="btn btn-info" data-action="sendClipsToEagle">导入Eagle</button></div>').appendTo('#modal_list .modal-footer');

                 registerAction('sendClipsToEagle', (dom, action) => {
                    var data = {
                        "items": [],
                        "folderId": ""
                    }

                $.getJSON('http://localhost:41595/api/folder/list', function(json, textStatus) {
                    if (textStatus == 'success') {
                        if (json.status == 'success') {
                            var source = {};
                            for (var folder of json.data) {
                                source[folder.name] = folder.imageCount;
                            }
                            modal_listSelector({
                                title: '选择导入目录(一个)',
                                source: source,
                                selected: [],
                                callback: folders => {
                                    data.folderId = folders.length ? json.data.find(item => {
                                        return item.name == folders[0]
                                    }).id : '';

                                    var old = g_list.list.clips;
                                    for (file of Object.keys(old)) {
                                        data.items.push({
                                            path: nodejs.files.getPath('*path*/cuts/'+file+'.mp4'),
                                            name: file,
                                            tags: old[file].split(','),
                                        });
                                    }
                                     fetch("http://localhost:41595/api/item/addFromPaths", {
                                        method: 'POST',
                                        body: JSON.stringify(data),
                                        redirect: 'follow'
                                    })
                                    .then(response => response.json())
                                    .then(result => {
                                        if (result.status == 'success') {
                                            toast('导入成功!', 'alert-success');
                                        }
                                    })
                                    .catch(error => toast('导入失败,请确保eagle在后台运行!', 'alert-danger'));

                                }
                            });
                        }
                    }
                });
            });
        `,
            version: '0.0.1',
            primary: 1,
        }, false);
       this.saveData();
    },
    initEvent: function(eventName, callback, overwrite = false) {
        var event = this.getEvent(eventName, true);
        event.finish = callback;
    },
    registerEvent: function(eventName, callback, primary = 1) {
        var event = this.getEvent(eventName);
        if (event) {
            event.listeners.push({
                callback: callback,
                primary: primary
            });
        }
    },
    unregisterEvent: function(eventName) {
        delete this.events[eventName];
    },
    getEvent: function(eventName, create = true) {
        if (create && !this.events[eventName]) {
            this.events[eventName] = {
                listeners: [],
            }
        }
        return this.events[eventName];
    },
    callEvent: function(eventName, data, callback) {
        var event = this.getEvent(eventName);
        if (event) {
            for (var listener of event.listeners.sort((a, b) => {
                    return b.primary - a.primary;
                })) {
                if (listener.callback(data) === false) {
                    return;
                }
            }
            if(callback) return callback(data);
            event.finish && event.finish(data);
        }

       
    },
    initPlugins: function(){
        var load = [];
        for(var uuid in this.list){
            var plugin = this.list[uuid];
            if(plugin.enable){
                load.push({
                    type: 'js',
                    url: 'scripts/'+uuid+'.js',
                })
            }
        }
        loadRes(load, i => {
            g_plugin.initedPlugin = true;
            console.info(`[plugins] 成功加载${i}个插件`);
        });
    },
    init: function() {
        this.list = local_readJson('plugins', {});
        if(Object.keys(this.list).length == 0){
            this.resetAll();
        }
        this.initPlugins();
        // this.modal_show();
        g_menu.registerMenu({
            name: 'plugin_item',
            selector: '#modal_plugins tr[data-key]',
            dataKey: 'data-key',
            html: `
                <div class="list-group" style="width: 100%;">
                    <a data-action="plugin_item_edit" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-pencil mr-2"></i><span>编辑</span>
                      </a>
                      <a data-action="plugin_item_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
        });
        registerAction('modal_plugin', (dom, action) => {
            this.modal_show();
        });
        registerAction('plugin_item_edit', (dom, action) => {
            g_plugin.prompt_add(g_menu.key);
            g_menu.hideMenu('plugin_item');
        });
        registerAction('plugin_item_delete', (dom, action) => {
            g_plugin.prompt_delete(g_menu.key);
            g_menu.hideMenu('plugin_item');
        });
        registerAction('plugin_edit', (dom, action) => {
            g_plugin.prompt_add(dom.dataset.key);
        });
        registerAction('plugin_enable', (dom, action) => {
            var key = $(dom).parents('[data-key]').attr('data-key');
            var plugin = g_plugin.getKey(key);
            if(plugin){
                plugin.enable = dom.checked;
                g_plugin.changed++;
            }
        });
    },
    prompt_delete: function(key) {
        confirm('是否删除插件 【' + this.getKey(key).title + '】 ?', {
            title: '删除插件',
            callback: btn => {
                if (btn == 'ok') {
                    $('#modal_plugins_edit').modal('hide');
                    g_plugin.removeKey(key);
                    toast('删除成功', 'alert-success');
                }
            }
        });
    },
    changed: 0,
    prompt_add: function(key = '') {
        var d = Object.assign(this.getKey(key), {content: nodejs.files.read('*path*/scripts/'+key+'.js')}) || {
            content: '',
            title: '',
            desc: '',
            version: '0.0.1',
            primary: 1,
        }
        
        var h = `
            <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text">标题</span>
              </div>
              <input type="text" id="input_plugin_title" class="form-control" placeholder="输入名称" value="${d.title}">
            </div>

             <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text">优先级</span>
              </div>
              <input type="text" id="input_plugin_primary" class="form-control" placeholder="输入优先级" value="${d.primary}">
            </div>

            <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text">代码</span>
              </div>
              <textarea id="input_plugin_content" rows="20" class="form-control">${d.content}</textarea>
            </div>

             <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text">注释</span>
              </div>
              <input type="text" id="input_plugin_desc" class="form-control" placeholder="注释" value="${d.desc}">
            </div>

            <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text">版本</span>
              </div>
              <input type="text" id="input_plugin_version" class="form-control" placeholder="版本" value="${d.version}">
            </div>
            `;
        buildModal(h, {
            id: 'modal_plugins_edit',
            once: true,
            title: '编辑插件',
            btns: [{
                id: 'ok',
                text: '保存',
                class: 'btn-primary',
            }, {
                id: 'delete',
                text: '删除',
                class: 'btn-danger',
            }],
            onShow: () => {
                if (!key) {
                    $('#modal_plugins_edit #btn_delete').hide();
                }
            },
            onBtnClick: (config, btn) => {
                var par = $(btn).parents('.modal');
                
                if (btn.id == 'btn_ok') {
                    var content = $('#input_plugin_content').val();
                    if (content == '') return toast('没有输入执行内容', 'alert-danger');
                    if(!key) key = guid();
                     g_plugin.setItem(key, {
                        content: content,
                        title: $('#input_plugin_title').val(),
                        version: $('#input_plugin_version').val(),
                        desc: $('#input_plugin_desc').val(),
                        primary: ParseInt($('#input_plugin_primary').val()),
                    });
                    toast('保存成功', 'alert-success');
                } else
                if (btn.id == 'btn_delete') {
                    g_plugin.prompt_delete(key);
                    return false;
                }
                par.modal('hide');
            }
        });
    },
    getKey: function(key) {
        return this.list[key];
    },
    removeKey: function(key, save = true) {
        delete this.list[key];
        this.saveData(save);
    },
    saveData: function(save = true) {
        if (save) {
            local_saveJson('plugins', this.list);
        }
        if ($('#modal_plugins').length) this.rendererList();
        this.initData();
    },
    initData: function() {
        if(this.initedPlugin){
             confirm('插件需要重载才能生效,是否重载页面?', {
                title: '重载页面',
                callback: btn => {
                    if(btn == 'ok') location.reload();
                }
            })
        }else{
            this.initPlugins();
        }
    },
    setItem: function(key, value, save = true) {
        nodejs.files.write('*path*/scripts/'+key+'.js', value.content);
        delete value.content;

        this.list[key] = value;
        this.saveData(save);
    },
    rendererList: function() {
        var h = '';
        for (var key in this.list) {
            var d = this.list[key];
            var id = 'check_plugin_'+key;
            h += `
                <tr data-key="${key}">
                  <td>
                    <div class="form-check">
                      <input class="form-check-input" data-change="plugin_enable" type="checkbox" value="" id="${id}" ${d.enable ? 'checked' : ''}>
                      <label class="form-check-label" for="${id}"></label>
                    </div>
                  </td>
                  <td>${d.title}</td>
                  <td>${d.desc}</td>
                  <td>${d.version}</td>
                </tr>
            `;
        }
        $('#modal_plugins tbody').html(h);
    },
    modal_show: function() {
        var h = `
            <table class="table">
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col">插件名</th>
                  <th scope="col">说明</th>
                  <th scope="col">版本</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
            </table>
        `;
        this.modal = buildModal(h, {
            id: 'modal_plugins',
            title: '插件列表',
            once: true,
            width: '80%',
            btns: [{
                id: 'add',
                text: '新增',
                class: 'btn-warning',
            }, {
                id: 'reset',
                text: '重置',
                class: 'btn-secondary',
            }, {
                id: 'more',
                text: '获取更多',
                class: 'btn-info',
            }],
            onClose: () => {
                if(g_plugin.changed){
                    g_plugin.changed = 0;
                    g_plugin.saveData();
                }
            },
            onBtnClick: (config, btn) => {
                switch (btn.id) {
                    case 'btn_more':
                        ipc_send('url', 'https://github.com/hunmer/VideoManager/issues');
                        return;
                    case 'btn_add':
                        g_plugin.prompt_add();
                        return;
                    case 'btn_reset':
                        if (confirm('确定要重置吗?', {
                                callback: btn => {
                                    if (btn == 'ok') g_plugin.resetAll();
                                }
                            }))
                            return;
                }
                //$(btn).parents('.modal').modal('hide');
            }
        });
        this.rendererList();
    }
}

g_plugin.init();