var g_chat = {
	
	init: function(){
		loadRes([{type: 'js', url: './js/team/channels.js'}], i => {
			
		})
		g_menu.registerMenu({
            name: 'chat_msg',
            selector: '.msg',
            dataKey: 'data-key',
            html: g_menu.buildItems([{
                action: 'chat_msg_reply',
                class: 'text-info',
                text: '回复',
                icon: 'bi-at'
            },{
                action: 'chat_video_comp',
                class: 'text-primary',
                text: '对比',
                icon: 'bi-subtract'
            },{
                action: 'chat_video_url',
                class: '',
                text: '抖音',
                icon: 'bi-tiktok'
            },{
                action: 'chat_msg_favorite',
                class: 'text-warning',
                text: '收藏',
                icon: 'bi-star'
            },{
                action: 'chat_msg_delete',
                class: 'text-danger',
                text: '撤回',
                icon: 'bi-trash'
            }]),
        });


        registerAction('video_comp_toggle', (dom, action) => {
        	var video = $('#compVideo_1')[0];
        	if(video.paused){
        		video.play();
        	}else{
        		video.pause();
        	}
        });
        
        registerAction('video_comp_back', (dom, action) => {
        	g_chat.addVideoTime(0 - 1 / 24);
        });
        registerAction('video_comp_front', (dom, action) => {
        	g_chat.addVideoTime(1 / 24);
        });
        registerAction('video_comp_edit', (dom, action) => {
        	var d = $('#video_comment_action');
        	d.find('span').html(getTime($('#compVideo_1')[0].currentTime));
        	d.find('input').focus();
        });
        registerAction('video_comp_addComment', (dom, action) => {
        	var d = $('#video_comment_action');
        	var text = d.find('input').val();
        	if(text != ''){

        	}
        });
        registerAction(['chat_msg_reply', 'chat_video_comp', 'chat_video_url', 'chat_msg_favorite', 'chat_msg_delete'], (dom, action) => {
        	var d = g_chat.getVideo(g_menu.key);
        	if(!d) return;
        	switch(action[0]){
        		case 'chat_video_url':
        			if(!d.link) return toast('没有添加抖音链接!', 'bg-danger');
        			ipc_send('url', d.link);
        			break;

        		case 'chat_video_comp':
        			if(!d.meta) return toast('没有添加抖音链接!', 'bg-danger');
        			g_chat.comparingVideo(d.file, d.meta.url);
        			break;

        		default:
        			toast('待完善!');
        	}
        });
		registerAction('douyin_parseUrl', (dom, action) => {
			var url = $('#input_video_link').val();
			if(url == '') return toast('请输入链接!', 'bg-danger');
			this.douyin_parseUrl(url, data => {
				var modal = $('#modal_channel_video');
				if(!modal.length) return;
				var item = data.item_list[0];
				modal.find('video').prop({
					src: item.video.play_addr.url_list[0],
					poster: item.video.origin_cover[0] 
				});
				var author = item.author;
				var p = $('#input_video_preview');
				p.find('img')[0].src = author.avatar_thumb.url_list[0];
				p.find('span.me-2').html(author.nickname);
				$('#input_video_desc').html(item.desc);
				// 
				// signature aweme_id
				// desc
				// statistics [digg_count 点赞 comment_count share_count]
				//  cover.duration
				// 
			});
		});

		//  g_config.user = 'lyj';
		// if(!g_config.user){
		// 	this.editProfile();
		// 	return;
		// }
		// this.eidtChannel();
		// this.form_video();
		// this.comparingVideo('../cuts/a.mp4', '../cuts/b.mp4');
	},
	addVideoTime: function(t){
		for(var video of $('#modal_video_comp video')){
			video.pause();
			video.currentTime += t;
		}
	},
	comparingVideo: function(url1, url2){
		var d = this.getUserConfig();
		 var h = `
         <div class="row w-full h-full">
            <div class="col h-full">
            	<div class="row" style="height: calc(100% - 70px) !important;">
            		<video id="compVideo_1" class="h-full col-6" src="${url1}" ></video>
            		<video id="compVideo_2" class="h-full col-6" src="${url2}" ></video>
            	</div>
            	<input type="range" value="0" min="0" max="100" class="w-full">
            	<div class="text-end">
            		<button class="btn btn-link" data-action="video_comp_edit">
            			<i class="bi bi-plus-circle-fill fs-3"></i>
              		</button>
            		<button class="btn btn-link" data-action="video_comp_back">
            			<i class="bi bi-arrow-left-circle fs-3"></i>
              		</button>
            		<button class="btn btn-link" data-action="video_comp_toggle">
            			<i class="bi bi-play-circle fs-3"></i>
              		</button>
              		<button class="btn btn-link" data-action="video_comp_front">
            			<i class="bi bi-arrow-right-circle fs-3"></i>
              		</button>
            	</div>
        	</div>
        	<div class="col">
        		<div id="video_comment_list" style="height: calc(100% - 50px) !important;">
	        		<div class="msg d-flex h-auto mb-2" style="max-width: 80%;max-width: 500px;">
	                    <img src="res/user.jpg" alt="" width="32" height="32" class="rounded-circle me-2 ms-2">
	                    <div class="alert alert-info m-0" role="alert">
	                    	sss
	                    </div>
	                </div>
	            </div>
                 <div class="d-flex align-items-center" style="height:  50px;">
                 	<div class="input-group mb-3" id="video_comment_action">
		              <div class="input-group-prepend">
		                <span class="input-group-text">00:00</span>
		              </div>
		               <input class="form-control" placeholder="发送评论..." value="" onkeydown="if(event.keyCode == 13) doAction(null, 'video_comp_addComment')">
		               <button class="btn btn-primary"><i class=" bi bi-send" data-action="video_comp_addComment"></i></button>
		            </div>
                </div>
        	</div>
        </div>`;
        buildModal(h, {
            id: 'modal_video_comp',
            title: '视频比较',
            width: '100%',
            once: true,
            fullHeight: true,
            btns: [],
            onShow: modal => {
        		var v1 = $('#compVideo_1')[0];
        		var v2 = $('#compVideo_2')[0];
            	var range = modal.find('input[type="range"]').on('input', function(e){
            		var pos = this.value / 100;
            		v1.currentTime = pos * v1.duration;
            		v2.currentTime = pos * v2.duration;
            	});
            	const setPlaying = b => {
            		if(b){
            			v2.play();
            		}else{
            			v2.pause();
            		}
            		if(v1.currentTime != v2.currentTime){
            			v2.currentTime = v1.currentTime;
            		}
            		removeClass(domSelector('video_comp_toggle').find('i'), 'bi-').addClass('bi-'+(b ? 'pause' : 'play')+'-circle');
            	}
            	$('#compVideo_1')
            	.on('play', e => setPlaying(true))
            	.on('pause', e => setPlaying(false))
            	.on('timeupdate', function(e){
            		range.val(parseInt(this.currentTime / this.duration * 100));
            	});

            	var timer, holdingTimer;
            	$('[data-action="video_comp_front"],[data-action="video_comp_back"]').on('mousedown', function(e){
            		var dom = this;
            		timer = setTimeout(() => {
            			holdingTimer = setInterval(() => {
            				var t = 1 / 24;
            				if(dom.dataset.action == 'video_comp_back'){
            					t = 0 - t;
            				}
            				g_chat.addVideoTime(t);
            			}, 50);
            		}, 500);
            	}).on('mouseup', e => {
            		timer && clearTimeout(timer);
            		holdingTimer && clearInterval(holdingTimer);
            	})
            },
            onBtnClick: (config, btn) => {
                var par = $(btn).parents('.modal');
                if (btn.id == 'btn_ok') {
                	
                }
                par.modal('hide');
            }
        });
	},

	editProfile: function(){
		var d = this.getUserConfig();
		 var h = `
		 <div class="text-center mb-3">
		 	<img src="res/user.jpg" title="点击上传头像" width="50" height="50" class="rounded-circle">
		 </div>
         <div class="row w-full">
            <div class="col">
	            <div class="input-group mb-3">
	              <div class="input-group-prepend">
	                <span class="input-group-text">用户名</span>
	              </div>
	              <input type="text" id="input_user_username" class="form-control" placeholder="输入用户名" value="${d.user}">
	            </div>

	            <div class="input-group mb-3">
	              <div class="input-group-prepend">
	                <span class="input-group-text">密码</span>
	              </div>
	              <input type="password" id="input_user_password" class="form-control" placeholder="输入密码" value="${d.password}">
	            </div>
	       </div>
        </div>

            `;
        buildModal(h, {
            id: 'modal_user_profile',
            title: '设置账号',
            btns: [{
                id: 'ok',
                text: '保存',
                class: 'btn-primary',
            }, {
                id: 'foreget',
                text: '找回密码',
                class: 'btn-danger',
            }],
            onShow: () => {
                if (!key) {
                    $('#modal_channel_video #btn_delete').hide();
                }
            },
            onBtnClick: (config, btn) => {
                var par = $(btn).parents('.modal');
                if (btn.id == 'btn_ok') {
                	var user = $('#input_user_username').val();
                	var password = $('#input_user_username').val();
                    if (user == '' || password == '') return toast('请填入信息', 'alert-danger');
                    if(d.user != user){
                    	if(g_chat.getUser(user)) return toast('用户名: ' + user+ ' 已经存在!', 'bg-danger');
                    	g_chat.removeProfile(d.user);
                    }
                     g_chat.setProfile(Object.assign(d, {
                        user: user,
                        password: password,
                    }));
                    toast('保存成功', 'alert-success');
                } else
                if (btn.id == 'foreget') {
                	alert('待完善');
                    return false;
                }
                par.modal('hide');
            }
        });
	},

	removeProfile: function(user){

	},

	setProfile: function(data){
		data.user
	},

	getMembersHtml: function(list){
		var h = '';
		for(var name in list){
			var d = list[name];
			h += `
				<img src="${d.icon}" title="${name}" width="32" height="32" class="rounded-circle me-2">
			`;
		}
		return h;
	},

	getVideo: function(key){
		return {}
	},
	// https://www.52pojie.cn/thread-1266439-1-1.html
	douyin_parseID: function(id, callback){
		console.log(id);
		fetch('https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids='+id).then(d => {
			d.json().then(function(data){
				console.log(data);
				callback(data);
			})
		})
	},
	douyin_parseUrl: function(url, callback){
		// "https://www.douyin.com/video/6869223088110849293?previous_page=app_code_link"
		var err = () => toast('解析失败,请检查链接是否正确', 'bg-danger');
		if(url.indexOf('v.douyin.com') == -1){
			var id = cutString(url + '?', 'douyin.com/video/', '?');
			if(id == ''){
				return err();
			}
			this.douyin_parseID(id, callback);
		}else{
			fetch(url).then(d => {
				if(d.status == 200 && d.redirected){
					console.log(d.url);
					this.douyin_parseUrl(d.url, callback);
				}else{
					err();
				}
			})
		}
	},
	form_video: function(key = ''){
		var create = key == undefined;
		 var d = Object.assign( {
            title: '',
            desc: '',
            link: 'https://v.douyin.com/Fs6PWrU/',
        }, this.getVideo(key));
        var h = `
         <div class="row w-full">
            <div class="col">
	            <div class="input-group mb-3">
	              <div class="input-group-prepend">
	                <span class="input-group-text">作品</span>
	              </div>
	              <input type="text" id="input_video_title" class="form-control" placeholder="输入名称" value="${d.title}">
	            </div>

	            <div class="input-group mb-3">
	              <div class="input-group-prepend">
	                <span class="input-group-text">说明</span>
	              </div>
	              <textarea id="input_video_desc" rows="3" class="form-control">${d.desc}</textarea>
	            </div>


	            <div class="input-group mb-3">
	              <div class="input-group-prepend">
	                <span class="input-group-text">原视频</span>
	              </div>
	              <input type="text" id="input_video_link" class="form-control" placeholder="输入抖音链接" value="${d.link}">
	              <button class="btn btn-outline-secondary" type="button" data-action="douyin_parseUrl">获取</button>
	            </div>
	       </div>

            <div class="col" id="input_video_preview">
            	<div style="position: relative;">
        			<video class="w-full" src="../cuts/1653403839029.mp4" poster="../cover/1653403839029.jpg" controls></video>
        			<div style="position: absolute;left: 20px; top: 10px;">
        				<span class="badge rounded-pill bg-dark  p-0"><img src="res/user.jpg" title="" width="20" height="20" class="rounded-circle ms-2 me-2">
        				<span class="me-2">用户</span></span>
        			</div>
        		</div>
        	</div>
            	
        </div>

            `;
        buildModal(h, {
            id: 'modal_channel_video',
            title: '发布视频',
            fullHeight: true,
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
                    $('#modal_channel_video #btn_delete').hide();
                }
            },
            onBtnClick: (config, btn) => {
                var par = $(btn).parents('.modal');
                if (btn.id == 'btn_ok') {
                	var title = $('#input_channel_title').val();
                    if (title == '') return toast('请输入群名', 'alert-danger');
                    if(!key) key = guid();
                     g_chat.saveChannel(key, Object.assign(d, {
                        title: title,
                        desc: $('#input_channel_desc').val(),
                    }));
                    toast('保存成功', 'alert-success');
                } else
                if (btn.id == 'btn_delete') {
                	if(confirm('确定删除频道吗?', {
                		title: '删除频道',
                		callback: btn => {
                			if(btn == 'ok') g_chat.removeChannel(key);
                		}
                	}))
                    return false;
                }
                par.modal('hide');
            }
        });
	},


	getUserConfig: function(){
		return g_config.user || {
			user: '',
			password: ''
		};
	},

	send: function(type, data = {}){
		Object.assign(data, this.getUserConfig())
	},

	show: function(){
		$('#detail').hide();

	},

	connect: function(){

	},


}
g_chat.init();