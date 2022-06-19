var g_parse = {
    init: function() {
        let self = this;
        g_cache.ytdl_url = {};
        $(`
		<a type="button" data-action="parse_url" title="解析链接" class="btn">
          <i class="bi bi-link"></i>
        </a>`).appendTo('.sidebar-heading .d-flex');
        registerAction('parse_url', () => {
            self.show('');
        })
        registerAction('ytdl_parse', dom => {
            let url = $('#input_ytdl_url').val();
            if (url) {
                $(dom).addClass('disabled');
                self.parse(url);
            }
        });

        registerAction('ytrl_url_test', dom => {
            let url = $('#select_ytdl_urls').val();
            if (url) {
                self.player_load({
                    video: {
                        url: url,
                        poster: $('#img_ytdl_cover').attr('src'),
                    }
                });
            }
        });

        registerAction('ytdl_proxy_test', () => {
            let url = $('#input_ytdl_proxy').val();
            if (url == '') return;
            $.ajax({
                url: url,
            }).always(function(e) {
                let success = e.readyState == 4;
                toast(success ? '有效连接' : '无效连接', 'alert-' + (success ? 'success' : 'danger'))
            });
        });
    },

    player_destroy: function() {
        if (!this.player) return;
        $('#ytdl_player').html('');
        this.player.destroy();
        delete this.player;
    },

    player_load: function(opts) {
        this.player_destroy();
        var config = Object.assign({
            autoplay: true,
            volume: 1,
            container: $('#ytdl_player')[0],
            screenshot: false,
            contextmenu: [{
                    text: '浏览器打开',
                    click: player => {

                    },
                },
                {
                    text: '关闭文件',
                    click: player => {
                        g_parse.player_destroy();
                    },
                },
            ],
        }, opts);
        this.player = new DPlayer(config);
    },
    parse: function(url) {
        $('#input_ytdl_url').prop('readOnly', true);
        domSelector('ytdl_parse').html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`)
        this.ytdl_parseUrl(url, data => {
            g_parse.parse_result(data);
        });

    },

    ytdl_parseUrl: function(url, callback) {

        let showError = msg => alert('解析失败\n' + msg);
        let opts = {};
        if (true) {
            opts = { env: { proxy: 'http://127.0.0.1:1080', http_proxy: 'http://127.0.0.1:1080', https_proxy: 'http://127.0.0.1:1080' } };
        }
        nodejs.exec.ytdl_parse(url, opts).then(data => {
            domSelector('ytdl_parse').removeClass('disabled').html('解析');
            try {
                let json = JSON.parse(data);
                console.log(json);
                g_parse.data = json;
                let r = {
                    uploader: json.uploader,
                    desc: json.description,
                    duration: json.duration,
                    thumbnail: json.thumbnail,
                    title: json.title,
                    size: json.filesize_approx,
                    date: json.upload_date,
                    formats: [],
                }

                for (let format of json.formats) {
                    // if (['mp4', 'flv', 'webm'].includes(format.ext)) {
                    if (format.asr && format.resolution) {
                        r.formats.push(format);
                    }
                }
                callback(r);
            } catch (e) {
                showError(e);
            }

        }).then(err => {
            err && showError(err);
        });
    },

    show: function(url) {
        // 代理访问 支持站点
        let proxy = 'http://127.0.0.1:1080';
        this.modal = confirm(`
        	<div class="input-group mb-3">
			  <input type="text" class="form-control" value="${url}" id="input_ytdl_url">
			  <button class="btn btn-primary" data-action="ytdl_parse" type="button">解析</button>
			</div>

			<div class="input-group mb-3">
			  <div class="input-group-prepend">
			    <div class="input-group-text">
			      <input type="checkbox" id="checkbox_ytdl_proxy" ${proxy ? 'checked' : ''}>
			       <label class="form-check-label ml-2" for="checkbox_ytdl_proxy">代理</label>
			    </div>
			  </div>
			  <input type="text" id="input_ytdl_proxy" class="form-control" placeholder="http://ip:port" value="${proxy || ''}">
			  <button type="button" data-action="ytdl_proxy_test" class="btn btn-outline-secondary">测试</button>
			</div>

			<hr class="p-20">

			<div class="row p-10 hide" id="ytdl_result"></div>

        `, {
            id: 'modal_ytdl',
            title: '添加链接',
            once: true,
            btns: [{
                id: 'add',
                text: '添加',
                class: 'btn-primary',
            }, {
                id: 'help',
                text: '支持的站点',
                class: 'btn-secondary',
            }],
            onBtnClick: (modal, btn) => {
                var par = $(btn).parents('.modal');
                if (btn.id == 'btn_add') {
                    let data = g_parse.data;
                    let key = data.extractor + '_' + data.id
                    if (_videos[key]) {
                        return toast('已被添加过', 'alert-danger');
                    }
                    let addr = $('#select_ytdl_urls').val();
                    let title = $('#input_ytdl_title').val();

                    if (title == '') return toast('请输入标题', 'alert-danger');
                    if (!addr.startsWith('http')) return toast('请选择格式', 'alert-danger');

                    _videos[key] = {
                        file: addr,
                        title: title,
                        url: data.webpage_url,
                        tags: [],
                        cover: data.thumbnail,
                        folder: '',
                        add: new Date().getTime(),
                        clips: {},
                    }
                    g_video.saveVideos();
                    g_parse.video_setURL(key, addr);
                    toast(`<a href="javascript: g_video.loadVideo('${key}')">添加成功!点击播放</a>`, 'alert-success');
                    par.modal('hide');
                } else
                if (btn.id == 'btn_help') {
                    ipc_send('url', 'https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md');
                    return false;
                }
            }
        });
    },

    parse_result: function(r) {
        console.log(r);
        $('#ytdl_result').html(`
        	<div class="col-4 border-right" >
				<img id="img_ytdl_cover" src="${r.thumbnail}" class="w-full mb-10 border border-bottom">
				<div style="max-height: 300px;overflow-y: auto;">
					<p>上传者: ${r.uploader}</p>
					<p>上传日期: ${r.date}</p>
					<p>文件大小: ${nodejs.files.renderSize(r.size)}</p>
					<p>视频长度: ${getTime(r.duration)}</p>
					<p>说明: ${r.desc}</p>
				</div>
			</div>

			<div class="col-8">
				 <div class="form-group mb-2">
				    <label for="exampleFormControlInput1">标题</label>
				    <input type="text" class="form-control" id="input_ytdl_title" placeholder="输入标题" value="${r.title}">
				  </div>

				  <div class="form-group mb-2">
				    <label for="exampleFormControlInput1">视频</label>
				     <div class="input-group">
					  <select class="custom-select" id="select_ytdl_urls">
					    <option selected>选择格式</option>
					    ` + (() => {
            let h = '';
            for (let f of r.formats) h += `
									    		<option value="${f.url}">
									    		[${nodejs.files.renderSize(f.filesize)}]${f.audio_ext} ${f.resolution}
									    		</option>
									    	`;
            return h;
        })() + `
					  </select>
					  <div class="input-group-append">
					    <button data-action="ytrl_url_test" class="btn btn-outline-secondary" type="button">测试</button>
					  </div>
					</div>
					</div>

					<div id="ytdl_player">

					</div>
				  </div>
			</div>

        `).removeClass('hide');
        // g_player.load(r.formats[0].url);
    },

    loadUrl: function(key, url) {
        if (!g_cache.ytdl_url[key] && url) {
            toast('获取播放地址中...', 'alert-info');
            this.ytdl_parseUrl(url, data => {
                confirm(`
                	<div class="d-flex justify-content-center">
					  <div class="spinner-grow text-primary" role="status"></div>
					</div>

					<div class="row p-10 hide" id="ytdl_result"></div>
                 	`, {
                    id: 'modal_ytdl_select',
                    title: '播放',
                    btns: [{
                        id: 'play',
                        text: '播放',
                        class: 'btn-primary',
                    }],
                    onBtnClick: (modal, btn) => {
                        if (btn.id == 'btn_play') {
                            let u = $('#select_ytdl_urls').val();
                            if (u == '') return toast('请选择画质', 'alert-danger');
                            g_parse.video_setURL(key, u);
                            g_video.loadVideo(key);

                            $(btn).parents('.modal').modal('hide');
                        }
                    },
                    onShow: () => {
                        $('#modal_ytdl_select .d-flex').remove();
                        g_parse.parse_result(data);
                    }
                });
            });
            return true;
        }

    },

    video_setURL: function(key, u) {
        g_cache.ytdl_url[key] = u;
        _videos[key].file = u;
        g_video.saveVideos(false);
    }

}

g_parse.init();
// g_parse.show('https://www.youtube.com/watch?v=h-KuoHHjGRs');
// g_parse.parse('');
// g_parse.parse('https://www.douyin.com/video/6869223088110849293');