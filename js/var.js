var g_localKey = 'vm_';
const APP_VERSION = 'v1.2.5';
const SUPPORTED_FORMAT = ['mp4', 'ts', 'm3u8', 'mdp', 'mkv'];
// const UPDATE_SCRIPT_URL = 'https://raw.githubusercontent.com/hunmer/videoManager/main/';
const UPDATE_SCRIPT_URL = 'https://gitee.com/neysummer2000/VideoManager/raw/main/';
var g_config = local_readJson('config', {
    tags_rent: [],
    previewMs_clip: 500,
    previewMs_search: 2000,
});

var g_cache = {
            searchedClip: {},
            previewClip: -1,
            searchTags: [],
            filters: [],
            fullScreen: false,
            clipBadges: {},
            zIndex: 1050,
        }


var g_cache = {
    setting_html: `<div class="row">
              <div class="col-2">
                <div class="nav flex-column nav-pills text-center" id="v-pills-tab" role="tablist" aria-orientation="vertical">
                  <a class="nav-link active" id="setting-pills-general-tab" data-toggle="pill" href="#setting-pills-general" role="tab" aria-controls="setting-pills-general" aria-selected="true">常规</a>
                  <a class="nav-link" id="setting-pills-output-tab" data-toggle="pill" href="#setting-pills-output" role="tab"  data-action="ffmpeg_formats"  aria-controls="setting-pills-output" aria-selected="false">输出</a>
                  <a class="nav-link" id="setting-pills-other-tab" data-toggle="pill" href="#setting-pills-other" role="tab" aria-controls="setting-pills-other" aria-selected="false">其他</a>
                  <a class="nav-link" id="setting-pills-adven-tab" data-toggle="pill" href="#setting-pills-adven" role="tab" aria-controls="setting-pills-adven" aria-selected="false">高级</a>
                </div>
              </div>
              <div class="col-10">
                <div class="tab-content" id="v-pills-tabContent">
                  <div class="tab-pane fade show active" id="setting-pills-general" role="tabpanel" aria-labelledby="setting-pills-general-tab">
                   <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_switchAutoRun" data-change="switch_option,autoRun">
                      <label class="custom-control-label" for="check_switchAutoRun">开机自启</label>
                    </div>
                  <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_autoStopPlay" data-change="switch_option,autoStopPlay">
                      <label class="custom-control-label" for="check_autoStopPlay">失去焦点暂停播放</label>
                    </div>
                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_autoPlayVideo" data-change="switch_option,autoPlayVideo" data-default="true">
                      <label class="custom-control-label" for="check_autoPlayVideo">视频自动播放</label>
                    </div>
                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_autoPlayVideoCliped" data-change="switch_option,autoPlayVideoCliped" data-default="true">
                      <label class="custom-control-label" for="check_autoPlayVideoCliped">添加片段后恢复播放</label>
                    </div>
                     <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_autoPlay" data-change="switch_option,autoPlay" data-default="true">
                      <label class="custom-control-label" for="check_autoPlay">启动时继续播放</label>
                    </div>
                     <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_notificationWhenDone" data-change="switch_option,notificationWhenDone">
                      <label class="custom-control-label" for="check_notificationWhenDone">后台完成裁剪后提示</label>
                    </div>

                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_pyAsFirste" data-change="switch_option,pyAsFirst">
                      <label class="custom-control-label" for="check_pyAsFirste">拼音标签自动选中第一个结果</label>
                    </div>

                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_toggleFrame" data-change="switch_option,toggleFrame">
                      <label class="custom-control-label" for="check_toggleFrame" data-default="true">隐藏边框</label>
                    </div>
                    <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input"  id="check_autoTheme" data-change="switch_option,darkTheme">
                      <label class="custom-control-label" for="check_autoTheme">黑暗模式</label>
                    </div>

                  </div>

                   <div class="tab-pane fade" id="setting-pills-output" role="tabpanel" aria-labelledby="setting-pills-output-tab">
                        <div class="form-group col-md-6">
                          <label for="select_codec_video">导出视频编码</label>
                          <select id="select_codec_video" class="form-control" data-change="select_option,outputVideo">
                          
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
                                  <input type="checkbox" data-change="select_option,enable_customCmd">
                                </div>
                              </div>
                              <input type="text" class="form-control" id="input_customCmd" placeholder="自定义FFMPEG命令" value="-ss {start} -t {time}">
                            </div>
                      </div>

                    <div class="tab-pane fade" id="setting-pills-other" role="tabpanel" aria-labelledby="setting-pills-other-tab">
                      <div class="form-row">
                        <div class="form-group col-md-4">
                          <label for="input_previewTime_clip">延迟预览</label>
                          <input type="number" class="form-control" id="input_previewTime_clip"  data-input="input_option,previewMs_clip">
                        </div>
                        <div class="form-group col-md-4">
                          <label for="input_previewTime_search">延迟预览(搜索)</label>
                          <input type="number" class="form-control" id="input_previewTime_search" data-input="input_option,previewMs_search">
                        </div>
                      </div>
                  </div>

                   <div class="tab-pane fade" id="setting-pills-adven" role="tabpanel" aria-labelledby="setting-pills-adven-tab">
                      <button class="btn btn-secondary" data-action="custom_css">自定义CSS样式</button>
                      <button class="btn btn-secondary" data-action="editConfig,disabled_updates">不更新的文件列表</button>
                  </div>
                </div>
              </div>
            </div>
`
}