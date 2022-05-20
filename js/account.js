var g_account = {

	
    init: function() {
        this.list = local_readFile('*path*/accounts.json', {});
        if(Object.keys(this.list) == 0) this.list = {
        	 默认: {
                path: '',
            }
        }
		var dataPath = getLunchParam('--user-data-dir=');
		if(dataPath != ''){
		    g_account.setCurrentPath(dataPath.replace(nodejs.path, '*path*'));
		}

        // this.modal_show();
        g_menu.registerMenu({
            name: 'account_item',
            selector: '#modal_accounts tr[data-key]',
            dataKey: 'data-key',
            html: `
                <div class="list-group" style="width: 100%;">
                      <a data-action="account_item_edit" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-pencil mr-2"></i><span>编辑</span>
                      </a>
                      <a data-action="account_item_setDefault" class="list-group-item list-group-item-action text-info" aria-current="true">
                        <i class="bi bi-flag-fill mr-2"></i><span>设为默认</span>
                      </a>
                      <a data-action="account_item_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
             onShow: key => {
               

            }
            
        });
        
        registerAction('account_list', (dom, action) => {
            this.modal_show();
        });
        registerAction('account_item_setDefault', (dom, action) => {
            g_account.switchAccount(g_menu.key, true)
        });
        registerAction('account_item_edit', (dom, action) => {
            g_account.prompt_add(g_menu.key);
            g_menu.hideMenu('account_item');
        });
        registerAction('account_item_delete', (dom, action) => {
            g_account.prompt_delete(g_menu.key);
            g_menu.hideMenu('account_item');
        });
        registerAction('account_edit', (dom, action) => {
            g_account.prompt_add(dom.dataset.key);
        });
        registerAction('account_switch', (dom, action) => {
            var account = dom.dataset.key;
            confirm('确定切换到账号: 【' + account + '】 吗?', {
                title: '切换账号',
                callback: btn => {
                    if (btn == 'ok') g_account.switchAccount(account);
                }
            })
        });
    },
    getAccountName: function(path) {
        return Object.keys(this.list).find(v => {
        	var p = this.list[v].path;
        	if(p == '') p = '*path*/accounts/'+v;
        	return p == path
        })
    },
    setCurrentPath: function(path) {
        var name = this.getAccountName(path);
        if (name != undefined) {
            domSelector('account_list').append('<span class="badge badge-info">' + name + '</span>');
        }
    },
    switchAccount: function(key, asDefault = false) {
        var path;
    	if(key == '默认'){
            path = '';
    	}else{
             var d = this.getItem(key);
             path = d.path == '' ? '*path*/accounts/' + key : d.path;
        }
        ipc_send('switchAccount', {dataPath: path, default: asDefault})
    },
    prompt_delete: function(key) {
        // todo 只删除指定文件和目录
        if (key == '默认') return toast('默认账号不能删除!', 'alert-danger');

        confirm('确定账号 【' + key + '】 吗?此账号的数据将会消失且不可恢复(暂时不会)', {
            title: '删除账号',
            callback: btn => {
                if (btn == 'ok') {
                    $('#modal_accounts_edit').modal('hide');
                    g_account.removeItem(key);
                    toast('删除成功', 'alert-success');
                }
            }
        });
    },
    prompt_add: function(key = '') {
        var d = key ? this.getItem(key) : {
            path: ''
        }
        var h = `
            <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text">用户名</span>
              </div>
              <input type="text" id="input_account_name" class="form-control" placeholder="输入名称" value="${key}" ${key == '默认' ? 'disabled' : ''}>
            </div>

            <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text">数据目录</span>
              </div>
              <textarea placeholder="可不填" id="input_account_path" rows="20" class="form-control">${d.path}</textarea>
            </div>
            `;
        buildModal(h, {
            id: 'modal_accounts_edit',
            once: true,
            title: '编辑账号',
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
                if (!key || key == '默认') {
                    $('#modal_accounts_edit #btn_delete').hide();
                }
            },
            onBtnClick: (config, btn) => {
                var par = $(btn).parents('.modal');
                if (btn.id == 'btn_ok') {
                    var name = $('#input_account_name').val();
                    if (name == '') return toast('请输入名称', 'alert-danger');
                    if (name != key) {
                        if (g_account.getItem(name)) return toast('此名称已经存在', 'alert-danger');
                        if (key != '') g_account.removeItem(key);
                    }
                    g_account.setItem(name, {
                        path: $('#input_account_path').val(),
                    });
                    toast('保存成功', 'alert-success');
                } else
                if (btn.id == 'btn_delete') {
                    g_account.prompt_delete(key);
                    return false;
                }
                par.modal('hide');
            }
        });
    },
    getItem: function(key) {
        return this.list[key];
    },
    removeItem: function(key, save = true) {
        delete this.list[key];
        this.saveData(save);
    },
    saveData: function(save = true) {
        if (save) {
        	local_saveFile('*path*/accounts.json', this.list);
        }
        if ($('#modal_accounts').length) this.rendererList();
    },
    setItem: function(key, value, save = true) {
        this.list[key] = value;
        this.saveData(save);
    },
    rendererList: function() {
        var h = '';
        for (var key in this.list) {
            var d = this.list[key];
            var id = 'check_account_' + key;
            h += `
                <tr data-key="${key}" data-dbaction="account_switch">
                  <td>${key}</td>
                  <td>${d.path}</td>
                </tr>
            `;
        }
        $('#modal_accounts tbody').html(h);
    },
    modal_show: function() {
        var h = `
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">账号</th>
                  <th scope="col">目录</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
            </table>
        `;
        this.modal = buildModal(h, {
            id: 'modal_accounts',
            title: '账号列表',
            once: true,
            width: '80%',
            btns: [{
                id: 'add',
                text: '新增',
                class: 'btn-warning',
            }],
            onClose: () => {
                if (g_account.changed) {
                    g_account.changed = 0;
                    g_account.saveData();
                }
            },
            onBtnClick: (config, btn) => {
                switch (btn.id) {
                    case 'btn_add':
                        g_account.prompt_add();
                        return;
                }
                //$(btn).parents('.modal').modal('hide');
            }
        });
        this.rendererList();
    }
}
g_account.init();