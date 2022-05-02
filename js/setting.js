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
        if (now - last > 86400) {
            setConfig('lastCheckUpdate', now);
            checkFileUpdates(UPDATE_SCRIPT_URL, false);
            console.log('checkFileUpdates');
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
                      <input type="checkbox" class="custom-control-input" id="check_autoStopPlay">
                      <label class="custom-control-label" for="check_autoStopPlay">失去焦点暂停播放</label>
                    </div>
                     <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_autoPlay">
                      <label class="custom-control-label" for="check_autoPlay">启动时自动播放</label>
                    </div>
                     <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_notifition">
                      <label class="custom-control-label" for="check_notifition">后台完成裁剪后提示</label>
                    </div>
                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input"  id="check_darkMode">
                      <label class="custom-control-label" for="check_darkMode">黑暗模式</label>
                    </div>

                  </div>
                  <div class="tab-pane fade" id="setting-pills-adven" role="tabpanel" aria-labelledby="setting-pills-adven-tab">

                  </div>
                   <div class="tab-pane fade" id="setting-pills-output" role="tabpanel" aria-labelledby="setting-pills-output-tab">
                   <form>
                        <div class="form-group col-md-6">
                          <label for="inputState">导出视频编码</label>
                          <select id="inputState" class="form-control">
                            <option selected>选择</option>
                            <option value="noVideo">无视频</option>
                            <option value="libx264">MP4</option>
                            <option value="copy">复制</option>
                          </select>
                        </div>
                        <div class="form-group col-md-6">
                          <label for="inputState">导出音频编码</label>
                          <select id="inputState" class="form-control">
                            <option selected>选择</option>
                            <option value="noAudio">无声音</option>
                            <option value="copy">复制</option>
                            <option value="libmp3lame">MP3</option>
                          </select>
                        </div>
                      </div>
                    </form>

                  </div>
                </div>
              </div>
            </div>

        `;
        this.modal = buildModal(h, {
            id: 'modal_setting',
            title: '设置(无效,尚在开发中...)',
            width: '80%',
            btns: [{
                id: 'ok',
                text: '保存',
                class: 'btn-primary',
            }, {
                id: 'cancel',
                text: '重置',
                class: 'btn-secondary',
            }],
            onBtnClick: (config, btn) => {
                if (btn.id == 'btn_ok') {}
                var par = $(btn).parents('.modal');
                par.modal('hide');
            }
        });

    }

}

g_setting.init();