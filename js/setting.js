var g_setting = {
    style: {},
    init: function() {
        var self = this;
        // self.modal_show();
        registerAction('setting', (dom, action) => {
            self.modal_show();
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
        if (g_config.bg) self.setBg('./res/bg.jpg');
        self.setTextColor(g_config.textColor);

        var now = new Date().getTime();
        var last = g_config.lastCheckUpdate || 0;
        if (now - last > 86400 * 1000) {
            setConfig('lastCheckUpdate', now);
            checkFileUpdates(UPDATE_SCRIPT_URL, false);
        }
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
        var h = `
            <div class="row">
              <div class="col-2">
                <div class="nav flex-column nav-pills text-center" id="v-pills-tab" role="tablist" aria-orientation="vertical">
                  <a class="nav-link active" id="setting-pills-general-tab" data-toggle="pill" href="#setting-pills-general" role="tab" aria-controls="setting-pills-general" aria-selected="true">常规</a>
                  <a class="nav-link" id="setting-pills-adven-tab" data-toggle="pill" href="#setting-pills-output" role="tab" aria-controls="setting-pills-output" aria-selected="false">输出</a>
                  <a class="nav-link" id="setting-pills-adven-tab" data-toggle="pill" href="#setting-pills-adven" role="tab" aria-controls="setting-pills-adven" aria-selected="false">高级</a>
                </div>
              </div>
              <div class="col-10">
                <div class="tab-content" id="v-pills-tabContent">
                  <div class="tab-pane fade show active" id="setting-pills-general" role="tabpanel" aria-labelledby="setting-pills-general-tab">

                  <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_autoStopPlay" data-change="switch_option,autoStopPlay">
                      <label class="custom-control-label" for="check_autoStopPlay">失去焦点暂停播放</label>
                    </div>
                     <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_autoPlay" data-change="switch_option,autoPlay">
                      <label class="custom-control-label" for="check_autoPlay">启动时自动播放</label>
                    </div>
                     <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_notificationWhenDone" data-change="switch_option,notificationWhenDone">
                      <label class="custom-control-label" for="check_notificationWhenDone">后台完成裁剪后提示</label>
                    </div>
                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input"  id="check_autoTheme" data-change="switch_option,darkTheme">
                      <label class="custom-control-label" for="check_autoTheme">黑暗模式</label>
                    </div>

                  </div>
                  <div class="tab-pane fade" id="setting-pills-adven" role="tabpanel" aria-labelledby="setting-pills-adven-tab">

                  </div>
                   <div class="tab-pane fade" id="setting-pills-output" role="tabpanel" aria-labelledby="setting-pills-output-tab">
                   <form>
                        <div class="form-group col-md-6">
                          <label for="select_codec_video">导出视频编码</label>
                          <select id="select_codec_video" class="form-control" data-change="select_option,outputVideo">
                          <option selected disabled>选择</option>
                            <option value="copy">不转换(秒裁剪,但开头结尾会几秒黑屏，适合长片段裁剪)</option>
                            <option value="libx264">MP4</option>
                          </select>
                        </div>
                        <div class="form-group col-md-6">
                          <label for="select_codec_audio">导出音频编码</label>
                          <select id="select_codec_audio" class="form-control" data-change="select_option,outputAudio">
                           <option selected disabled>选择</option>
                            <option value="copy">不转换</option>
                          </select>
                        </div>

                        <div class="input-group">
                            <label for="select_codec_audio"></label>
                              <div class="input-group-prepend">
                                <div class="input-group-text">
                                  <input type="radio" data-change="select_option,enable_customCmd">
                                </div>
                              </div>
                              <input type="text" class="form-control" id="input_customCmd" placeholder="自定义FFMPEG命令" value="-ss {start} -t {time}">
                            </div>
                      </div>
                    </form>

                  </div>
                </div>
              </div>
            </div>

        `;
        var modal = buildModal(h, {
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
                    var val = getConfig(key, false);
                    if(nodeName == 'input'){
                       d.prop('checked', val);
                    }else
                    if(nodeName == 'select'){
                        d.find('option[value="'+val+'"]').prop('selected', true);
                    }
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

        if (getConfig('darkTheme')) g_setting.toggleDarkMode(true);
        registerAction('switch_option', (dom, action) => {
            var key = action[1];
            setConfig(key, !g_config[key]);
            switch (action[1]) {
                case 'darkTheme':
                    g_setting.toggleDarkMode();
            }
        });
        registerAction('select_option', (dom, action) => {
            var key = action[1];
            var val = $(dom).val();
            if(key == 'enable_customCmd') val = val == 'on';
            setConfig(key, val);
        })

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
            `
        }
        g_style.addStyle('theme', css);
    }

}

g_setting.init();