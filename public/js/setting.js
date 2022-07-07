var g_setting = {
    style: {},
    init: function() {
        var self = this;
        // self.modal_show();
        registerAction('setting', (dom, action) => {
            self.modal_show();
        });
        registerAction('ffmpeg_formats', () => {
            console.log('a');
                ipc_send('supportedFormats', data => {
                    let h = '';
                    for (let [key, val] of Object.entries(data.V)) {
                        h += `<option value="${key}">[${key}]${val}</option>`;
                    }
                    $('#select_codec_video').html(`
                        <option selected disabled>选择</option>
                        <option value="copy">不转换(秒裁剪,但开头结尾会几秒黑屏，适合长片段裁剪)</option>
                        ${h}
                    `).find('option[value="'+getConfig('outputVideo')+'"]').prop('selected', true);

                    h = '';
                    for (let [key, val] of Object.entries(data.A)) {
                        h += `<option value="${key}">[${key}]${val}</option>`;
                    }
                    $('#select_codec_audio').html(`
                        <option selected disabled>选择</option>
                        <option value="copy">不转换</option>
                        ${h}
                    `).find('option[value="'+getConfig('outputAudio')+'"]').prop('selected', true)
                });
            });
        registerAction('bg', (dom, action) => {
            if (g_config.bg) {
                return self.setBg('', true);
            }
            ipc_send('openImageDialog')
        });
        registerAction('textColor', (dom, action) => {
            self.setTextColor(!g_config.textColor);
        });

         registerAction('editConfig', (dom, action) => {
            var title;
            var def = '';
            switch(action[1]){
                case 'disabled_updates':
                    title = '禁止更新文件列表';
                    def = 'css/user.css';
                    break;

                default: 
                    title = '更改配置';
            }
            prompt(getConfig(action[1], def), {
                title: title,
                callback: text => {
                    setConfig(action[1], text);
                    toast('保存成功!', 'alert-success');
                }
            })
        });
        registerAction('custom_css', (dom, action) => {
            nodejs.files.openFile(nodejs.files.getPath('*path*/css/user.css'));
        });
        registerAction('switch_option', (dom, action) => {
            var key = action[1];
            var val = !g_config[key];
            setConfig(key, val);
            switch (action[1]) {
                case 'darkTheme':
                    g_setting.toggleDarkMode();
                    break;
                case 'autoRun':
                case 'toggleFrame':
                    ipc_send(action[1], val);
                    break;
            }
        });
        registerAction('select_option', (dom, action) => {
            var key = action[1];
            var val = ['SELECT', 'INPUT'].includes(dom.nodeName) ? dom.value : dom.checked;
            setConfig(key, val);
        });
        registerAction('input_option', (dom, action) => {
            var key = action[1];
            var val = $(dom).val();
            setConfig(key, val);
        })
        
        if (g_config.bg) self.setBg('./res/bg.jpg');
        self.setTextColor(g_config.textColor);
        ipc_send('checkAutoRun', g_config.autoRun);
        if (getConfig('darkTheme')) g_setting.toggleDarkMode(true);

        var now = new Date().getTime();
        var last = g_config.lastCheckUpdate || 0;
        if (now - last > 86400 * 1000) {
            setConfig('lastCheckUpdate', now);
            if(typeof(checkFileUpdates) == 'function') checkFileUpdates(UPDATE_SCRIPT_URL, false);
        }
        // g_setting.modal_show();

    },
    setTextColor: function(b) {
        setConfig('textColor', b);
        var css = '';
        if (b) {
            var s = '#page-content-wrapper';
            css = `
                 ${s} i,${s} a[href="#"],${s} button,${s} .tab-pane{
                    color: white !important;
                }
            `;
        }
        g_style.addStyle('text', css);
    },
    setBg: function(url, save = false) {
        var empty = url == '';
        domSelector({ action: 'bg' }).html((empty ? '设置' : '清除') + '背景图');
        if (save) {
            setConfig('bg', !empty);
            if (!empty) {
                var saveTo = nodejs.files.getPath('*path*/res/bg.jpg');
                nodejs.files.copy(url, saveTo);
                url = saveTo + '?t=' + new Date().getTime();
            }
        }
        var css = '';
        if (!empty) {
            var s = '#page-content-wrapper';
            css = `
            #wrapper {
                 backdrop-filter: blur(2px);
            }
            .dplayer-video-wrap {
                background-color: unset;
            }
            ${s} .bg-light,
            ${s} .card,
            ${s} .list-group-item,
            ${s} .form-control {
                background-color: rgba(255, 255, 255, .3) !important;
            }

            ${s} .form-control {
                color: rgba(0, 0, 0, .8) !important;
            }

            .dplayer-controller-mask {
                display: none;
            }

            body {
                margin: 0;
                padding: 0;
                background-image: url('${url}');
                background-size:100% 100%;
            }

            .dplayer-web-fullscreen-fix .dplayer-video-wrap {
                background-color: #000;
            }

        `;
        } else
        if (g_config.textColor) { // 重置文字颜色
            g_setting.setTextColor(false);
        }
        g_style.addStyle('bg', css);
    },
    modal_show: function() {
        var modal = buildModal(g_cache.setting_html, {
            id: 'modal_setting',
            title: '设置',
            width: '80%',
            btns: [/*{
                id: 'ok',
                text: '保存',
                class: 'btn-primary',
            }, */{
                id: 'reset',
                text: '重置',
                class: 'btn-secondary',
            }],
            onShow: () => {
                $('#input_customCmd').val(getConfig('customCmd'));
                for (var d of modal.find('[data-change]')) {
                    var nodeName = d.nodeName.toLowerCase();
                    d = $(d);
                    var key = d.attr('data-change').replace('switch_option,', '').replace('select_option,', '');
                    var val = getConfig(key, d.data('default') || false);
                    if(nodeName == 'input'){
                       d.prop('checked', val);
                    }else
                    if(nodeName == 'select'){
                        d.find('option[value="'+val+'"]').prop('selected', true);
                    }
                }

                for (var d of modal.find('[data-input]')) {
                    var key = d.dataset.input.replace('input_option,', '');
                    d.value = getConfig(key, '');
                }

            },
            onClose: () => {
                setConfig('customCmd', $('#input_customCmd').val());
            },
            onBtnClick: (config, btn) => {
                if (btn.id == 'btn_reset') {
                    toast('待完善');
                    return false;
                }
                var par = $(btn).parents('.modal');
                par.modal('hide');
            }
        });
        this.modal = modal;
        


    },

    toggleDarkMode: function(enable) {
        var id = '#page-content-wrapper';
        var classes = 'dark-theme';
        var s = id + '.' + classes;
        var css = '';
        if (enable == undefined) {
            $(id).toggleClass(classes);
        } else {
            $(id).toggleClass(classes, enable);
        }
        enable = $(id).hasClass(classes);
        if (enable) {
            css = `
                ${s} {
                  color: #eee;
                  background: #121212;
                }

                ${s} a {
                  color: #809fff;
                }
                ${s} .form-control {
                  background: #121212 !important;
                }
                ${s} .card {
                  background: #121212 !important;
                }
                ${s} .list-group-item {
                  background: #121212 !important;
                }

                input[type="text"],textarea {
                    color: #afafaf !important;
                }
            `
        }
        g_style.addStyle('theme', css);
    }

}

g_setting.init();