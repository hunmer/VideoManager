var g_localKey = 'vm1_';

var g_config = local_readJson('config', {
  user: {
    user: '',
    password: '',
  }
});

const SUPPORTED_FORMAT = ['mp4'];
var g_cache = {
  openFile_type: '',
    setting_html: `
            <div class="row">
              <div class="col-2">
                <div class="nav flex-column nav-pills text-center" id="v-pills-tab" role="tablist" aria-orientation="vertical">
                  <a class="nav-link active" id="setting-pills-general-tab" data-toggle="pill" href="#setting-pills-general" role="tab" aria-controls="setting-pills-general" aria-selected="true">常规</a>
                  <a class="nav-link" id="setting-pills-output-tab" data-toggle="pill" href="#setting-pills-output" role="tab" aria-controls="setting-pills-output" aria-selected="false">输出</a>
                  <a class="nav-link" id="setting-pills-other-tab" data-toggle="pill" href="#setting-pills-other" role="tab" aria-controls="setting-pills-other" aria-selected="false">其他</a>
                  <a class="nav-link" id="setting-pills-adven-tab" data-toggle="pill" href="#setting-pills-adven" role="tab" aria-controls="setting-pills-adven" aria-selected="false">高级</a>
                </div>
              </div>
              <div class="col-10">
                <div class="tab-content" id="v-pills-tabContent">
                  <div class="tab-pane fade show active" id="setting-pills-general" role="tabpanel" aria-labelledby="setting-pills-general-tab">
                   <div class="custom-control custom-switch">
                      <input type="checkbox" class="custom-control-input" id="check_switchAutoRun" data-change="switch_option,autoRun">
                      <label class="custom-control-label" for="check_switchAutoRun">test</label>
                    </div>
                  </div>

                   <div class="tab-pane fade" id="setting-pills-output" role="tabpanel" aria-labelledby="setting-pills-output-tab">
                     
                    </div>

                    <div class="tab-pane fade" id="setting-pills-other" role="tabpanel" aria-labelledby="setting-pills-other-tab">
                      
                  </div>

                   <div class="tab-pane fade" id="setting-pills-adven" role="tabpanel" aria-labelledby="setting-pills-adven-tab">
                  </div>
                </div>
              </div>
            </div>
`
}