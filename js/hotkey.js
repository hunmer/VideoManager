var g_hotkey = {
    defaultList: {
        'f5': {
            title: '刷新',
            content: "ipc_send('reload')",
            type: 2,
        },
        'f12': {
            title: '开发者工具',
            content: "ipc_send('devtool')",
            type: 2,
        },
        'ctrl+keyf': {
            title: '搜索',
            content: "doAction(null, 'modal_search')",
            type: 2,
        },
        'f5': {
            title: '刷新',
            content: "ipc_send('reload')",
            type: 2,
        },
        'f11': {
            title: '全屏',
            content: "toggleFullScreen()",
            type: 2,
        },
        'alt+digit1': {
            title: '设置起点',
            content: "g_video.setStart()",
            type: 2,
        },
        'alt+digit2': {
            title: '设置终点',
            content: "g_video.setEnd()",
            type: 2,
        },
        'alt+digit3': {
            title: '输入标签',
            content: "loadTab('tags');inputFocus($('#input_tag')[0]);",
            type: 2,
        },
        'alt+digit4': {
            title: '添加裁剪',
            content: "doAction(null, 'addPos')",
            type: 2,
        },
        'alt+backquote': {
            title: '编辑备注',
            content: "inputFocus($('#clip_note')[0])",
            type: 2,
        },
        'arrowleft': {
            title: '倒退5秒',
            content: "g_player.addTime(-5)",
            type: 1,
        },
        'arrowright': {
            title: '快进5秒',
            content: "g_player.addTime(5)",
            type: 1,
        },
        'alt+arrowleft': {
            title: '倒退1秒',
            content: "g_player.addTime(-1)",
            type: 1,
        },
        'alt+arrowright': {
            title: '快进1秒',
            content: "g_player.addTime(1)",
            type: 1,
        },
        'ctrl+arrowleft': {
            title: '倒退3秒',
            content: "g_player.addTime(-3)",
            type: 1,
        },
        'ctrl+arrowright': {
            title: '快进3秒',
            content: "g_player.addTime(3)",
            type: 1,
        },
        'shift+arrowleft': {
            title: '倒退10秒',
            content: "g_player.addTime(-10)",
            type: 1,
        },
        'shift+arrowright': {
            title: '快进10秒',
            content: "g_player.addTime(10)",
            type: 1,
        },
        'ctrl+shift+arrowleft': {
            title: '倒退5%',
            content: "g_player.addTime('5%')",
            type: 1,
        },
        'ctrl+shift+arrowright': {
            title: '快进5%',
            content: "g_player.addTime('5%')",
            type: 1,
        },
        'space': {
            title: '播放/暂停',
            content: "if(!$('.modal.show').length) g_player.playVideo()",
            type: 1,
        },
    },
    init: function() {
        this.list = g_config.hotkeys || this.defaultList;
        this.initEvent();
        this.initData();
        g_menu.registerMenu({
            name: 'hotkey_item',
            selector: '[data-dbaction="hotkey_edit"]',
            dataKey: 'data-key',
            html: `
                <div class="list-group" style="width: 100%;">
                    <a data-action="hotkey_item_edit" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-pencil mr-2"></i><span>编辑</span>
                      </a>
                      <a data-action="hotkey_item_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
        });
        registerAction('hotkey_item_edit', (dom, action) => {
            g_hotkey.prompt_add(g_menu.key);
            g_menu.hideMenu('hotkey_item');
        });
        registerAction('hotkey_item_delete', (dom, action) => {
            g_hotkey.prompt_delete(g_menu.key);
            g_menu.hideMenu('hotkey_item');
        });
        registerAction('hotkey_edit', (dom, action) => {
            g_hotkey.prompt_add(dom.dataset.key);
        });
        // this.modal_show();
    },
    prompt_delete: function(key) {
        confirm('是否删除快捷键 【' + key + '】 ?', {
            title: '删除快捷键',
            callback: btn => {
                if (btn == 'ok') {
                    $('#modal_hotkey_edit').modal('hide');
                    g_hotkey.removeKey(key);
                    toast('删除成功', 'alert-success');
                }
            }
        });
    },
    prompt_add: function(key = '') {
        var d = this.list[key] || {
            content: '',
            title: '',
            type: '',
        }
        var h = `
			<div class="input-group mb-3">
			  <div class="input-group-prepend">
			    <span class="input-group-text">标题</span>
			  </div>
			  <input type="text" id="input_hotkey_title" class="form-control" placeholder="输入名称" value="${d.title}">
			</div>

			<div class="input-group mb-3">
			  <div class="input-group-prepend">
			    <span class="input-group-text" >热键</span>
			  </div>
			  <input type="text"  id="input_hotkey_key" value="${key}" class="form-control" placeholder="在这里按下要设置的快捷键" onkeydown="this.value=g_hotkey.getInputCode(event);" readonly>
			</div>

			<div class="input-group">
			  <div class="input-group-prepend">
			    <span class="input-group-text">代码</span>
			  </div>
			  <textarea  id="input_hotkey_content" class="form-control">${d.content}</textarea>
			</div>

			<div class="input-group mt-10">
			  <div class="input-group-prepend">
			    <label class="input-group-text" for="select_hotkey_key">作用范围</label>
			  </div>
			  <select class="custom-select" id="select_hotkey_key">
			    <option selected value=''>点击选择</option>
			    <option value="1">普通</option>
			    <option value="2">无视输入框</option>
			    <option value="3">全局</option>
			  </select>
			</div>
			`;
        buildModal(h, {
            id: 'modal_hotkey_edit',
            once: true,
            title: '编辑热键',
            btns: [{
                id: 'ok',
                text: '保存',
                class: 'btn-primary',
            }, {
                id: 'test',
                text: '测试',
                class: 'btn-warning',
            }, {
                id: 'delete',
                text: '删除',
                class: 'btn-danger',
            }],
            onShow: () => {
                if (!key) {
                    $('#modal_hotkey_edit #btn_delete').hide();
                } else {
                    $('#modal_hotkey_edit option[value="' + d.type + '"]').prop('selected', true);
                }
            },
            onBtnClick: (config, btn) => {
                var par = $(btn).parents('.modal');
                var content = $('#input_hotkey_content').val();
                if (content == '') return toast('没有输入执行内容', 'alert-danger');
                if (btn.id == 'btn_ok') {
                    var newKey = $('#input_hotkey_key').val();
                    if (newKey == '') return toast('没有输入按键', 'alert-danger');
                    var type = $('#select_hotkey_key').val();
                    if (!type) return toast('没有选择作用范围', 'alert-danger');
                    var title = $('#input_hotkey_title').val();

                    const fun = () => {
                        g_hotkey.setHotKey(newKey, {
                            content: content,
                            title: title,
                            type: parseInt(type),
                        });
                        toast('保存成功', 'alert-success');
                    }

                    if (newKey != key) {
                        var exists = g_hotkey.getKey(newKey);
                        if (exists) {
                            confirm('此按键已被 ' + exists.title + ' 占用,是否覆盖?', {
                                callback: btn => {
                                    if (btn == 'ok') {
                                        fun();
                                    }
                                }
                            });
                            return;
                        }
                        if (key) {
                            g_hotkey.removeKey(key, false);
                        }
                    }
                    fun();
                } else
                if (btn.id == 'btn_test') {
                    try {
                        eval(content);
                    } catch (e) {
                        alert(e.toString());
                    }
                    return false;
                } else
                if (btn.id == 'btn-delete') {
                    g_hotkey.prompt_delete(key);
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
            g_config.hotkeys = this.list;
            local_saveJson('config', g_config);
        }
        if ($('#modal_hotkey').length) {
            this.rendererList();
        }
        this.initData();
    },
    initData: function() {
        // 正确排序按键
        var self = this;
        var list = [];
        for (var key in self.list) {
            const getPrimary = s => {
                if (s == 'ctrl') return 4;
                if (s == 'alt') return 3;
                if (s == 'shift') return 2;
                return 1;
            }
            list[key.split('+').sort((a, b) => {
                return getPrimary(b) - getPrimary(a);
            }).join('+').toLowerCase()] = self.list[key];
        }
        self.list = list;

    },
    setHotKey: function(key, value, save = true) {
        this.list[key] = value;
        this.saveData(save);
    },
    rendererList: function() {
        var h = '';
        for (var key in this.list) {
            var d = this.list[key];
            h += `
				<tr data-key="${key}" data-dbaction="hotkey_edit">
			      <td>${d.title}</td>
			      <td>${key}</td>
			      <td>${d.content}</td>
			    </tr>
			`;
        }
        $('#modal_hotkey tbody').html(h);
    },
    modal_show: function() {
        var h = `
		 	<table class="table">
			  <thead>
			    <tr>
			      <th scope="col">说明</th>
			      <th scope="col">按键</th>
			      <th scope="col">动作</th>
			    </tr>
			  </thead>
			  <tbody>
			  </tbody>
			</table>
		`;
        this.modal = buildModal(h, {
            id: 'modal_hotkey',
            title: '快捷键列表',
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
            }],

            onBtnClick: (config, btn) => {
                switch (btn.id) {
                    case 'btn_add':
                        g_hotkey.prompt_add();
                        return;

                    case 'btn_reset':
                        if (confirm('确定要重置吗?', {
                                callback: btn => {
                                    if (btn == 'ok') {
                                        g_hotkey.list = g_hotkey.defaultList;
                                        g_hotkey.saveData();
                                        toast('重置成功', 'alert-success');
                                    }
                                }
                            }))
                            return;
                }
                //$(btn).parents('.modal').modal('hide');
            }
        });
        this.rendererList();
    },
    initEvent: function() {
        var self = this;
        window.onkeydown = function(e) {
            if ([16, 17, 18, 91, 9, 27, 13, 8, 20, 93].includes(e.keyCode)) { // 忽略功能按键
                return;
            }
            if($('#modal_hotkey_edit.show').length) return;
            var editing = $('input:focus,textarea:focus').length;
            var d = self.list[self.getInputCode(e, 'key')];
            if (d) {
                if (!(editing && d.type == 1)) {
                    return eval(d.content);
                }
            }
            var d = self.list[self.getInputCode(e, 'code')];
            if (d) {
                if (!(editing && d.type == 1)) {
                    return eval(d.content);
                }
            }
        }
    },
    getInputCode: function(e, type = 'key') {
        var a = [];
        if (e.ctrlKey) a.push('ctrl');
        if (e.altKey) a.push('alt');
        if (e.shiftKey) a.push('shift');
        a.push(e[type].toLowerCase());
        return a.join('+');
    }
}

g_hotkey.init();
// function getSeekValue(e, name){
//           var t = 0;
//           if(e.altKey){
//               t += g_config.seek[name+'_alt'] || 0;
//           }
//           if(e.ctrlKey){
//               t += g_config.seek[name+'_ctrl'] || 0;
//           }
//           if(e.shiftKey){
//               t += g_config.seek[name+'_shift'] || 0;
//           }
//           return t;
//       }