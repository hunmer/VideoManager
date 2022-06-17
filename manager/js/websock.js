var g_socket = {
    // defaultUrl: 'ws://127.0.0.1:41595',
    init: function() {
        this.server = getConfig('server', {});
        registerAction('channel_findServer', () => {
            g_socket.tryFind(true);
        });
        registerAction('channel_startServer', () => {
            confirm(`
                <div class="form-floating mb-3">
                  <input class="form-control" id="input_server_password" placeholder="开启密码" value="${getConfig('server_password', '')}">
                  <label for="input_server_password">密码</label>
                </div>
                <div class="form-floating mb-3">
                  <input class="form-control" id="input_server_path" placeholder="可填局域网网络" value="${getConfig('server_path', '')}">
                  <label for="input_server_path">储存地址</label>
                </div>
            `
            , {
                title: '开启服务器',
                 onBtnClick: (config, btn) => {
                    var par = $(btn).parents('.modal');
                    if (btn.id == 'btn_ok') {
                         var s = $('#input_server_password').val();
                        setConfig('server_password', s);

                         if (s != '2324'){
                            toast('密码错误', 'bg-danger');
                            return false;
                        }
                        var path = $('#input_server_path').val();
                        if(!nodejs.files.exists(path)){
                            toast('目录不存在', 'bg-danger');
                            return false;
                        }
                        g_socket.startServer({
                            path: path
                        });
                    }
                    par.modal('hide');
                },
            });
        });
        // this.tryFind();
    },
    startServer: function(opts) {
        this.findServer().then(data => {
            toast('不可以开启两个服务器!', 'bg-danger')
        }, err => {
            toast('开启服务器中...', 'bg-info');
            startServer(opts);
            setTimeout(() => g_socket.tryFind(), 1500);
        })
    },
    tryFind: function(input = false) {
        // var ip = this.server;
        // if(ip) return this.connect(ip);
        this.findServer(input).then(data => {
            g_socket.server = data;
            setConfig('server', data.ip);
            g_socket.connect('ws://'+data.ip+':41595');
        }, err => {
            // toast('没有发现服务器!', 'bg-danger')
            // setTimeout(() => g_socket.tryFind(), 20000);
        });
    },
    findServer: function(input = false) {
        return new Promise(function(resolve, reject) {
            var fun = () => getIP().then(ip => {
                ip = ip.split('.');
                ip.pop();
                ip = ip.join('.');
                var sockets = [];
                var err = 0;
                for (var i = 0; i <= 255; i++) {
                    $.ajax({
                        url: `http://${ip}.${i}:8000/api/status`,
                        type: 'get',
                        timeout: 2000,
                        dataType: 'json',
                        success: function(data) {
                            resolve(data);
                        },
                        complete: function(XHR, textStatus) {
                            if (textStatus != 'success') {
                                if (++err == 256) {
                                    reject();
                                }
                            }
                        }
                    })

                }
            }, err => {
                toast('没有连接网络!', 'bg-danger')
            })

             if(input){
                 prompt(getConfig('server', ''), {
                    title: '设置目标服务器',
                    placeholder: '非必填',
                    callback: s => {
                        if(s) return resolve(s);
                        fun();
                    }
                });
            }else{
                fun();
            }
        });

    },
    setConnected: function(b) {
        domSelector('channel_startServer').toggleClass('hide', b);
        var div = removeClass($('#badge_team_status'), 'bg-')
            .addClass('bg-' + (b ? 'success' : 'danger'))
            .find('b').html(b ? '连接成功' : '连接失败');
    },
    recon: function(b = true) {
        var self = this;
        self.reconnect && clearTimeout(self.reconnect);
        if (b && this.reconable) {
            self.reconnect = setTimeout(() => self.connect(), 1000 * 3)
        }
    },
    reconable: true,
    disconnect: function() {
        if (this.isConnected()) {
            this.reconable = false;
            this.connection.close();
        }
    },
    connect: function(url) {
        var self = this;
        if (self.connection) self.connection.close();
        var socket = self.connection = new WebSocket(url);
        socket.onopen = () => {
            self.reconable = true;
            self.setConnected(true);
            self.recon(false);
            self.send('login');
            g_chat.profile.profile_update();
            if (self.ping) clearInterval(self.ping);
            self.ping = setInterval(() => socket.send('ping'), 1000 * 30);
        }

        socket.onmessage = e => {
            self.onRevice(JSON.parse(e.data));
        }

        const onError = e => {
            self.setConnected(false);
            self.recon();
        }

        socket.onclose = e => onError(e);
    },
    revices: {},
    registerRevice: function(type, callback){
        this.revices[type] = callback;
        return this;
    },

    onRevice: function(data) {
        console.log('revice', data);
        d = data.data;
        if(this.revices[data.type]) return this.revices[data.type](d);
        switch (data.type) {
            
            case 'channel_video_comment':
                 if(d.id == g_chat.video.current_compID){ // 当前正在预览的视频
                    // 更新评论列表
                    g_chat.video.comments_load(d);
                }
                switch(d.action){
                    case 'add':
                         // 有人新评论视频
                        this.onRevice({

                        }); // 消息
                        break;
                    case 'delete':
                        break;
                }
              
                break;
            case 'channel_videos':
                g_channels.channel_videos(d);
                break;
            case 'player_channel_join':
            case 'player_channel_quit':
                $('#chat_name').find('.badge').html(d.players + '在线');
                break;
            case 'channel_players':
                g_channels.channel_listPlayers(d);
                break;
            case 'profile_confirm':
                toast('请先完成账号设置', 'bg-info');
                g_chat.profile.profile_edit();
                break;
            case 'profile_set':
                setConfig('user', Object.assign(g_config.user, { user: d, password: g_cache.password }));
                $('#modal_user_profile').modal('hide');
                delete g_cache.password;
                break;
            case 'channel_msg_delete':
                domSelector({ id: d.msg }, '.msg').remove();
                $(`<h6 class="text-center mt-2">${d.user}撤回了一条消息</h6>`).appendTo('#msg_list');
                break;

            case 'channel_history':
                // <h4 class="mt-4 text-center">快开始聊天吧!</h4>
                var cnt = g_channels.msg_getCount();
                $('#msg_list')[cnt > 0 ? 'prepend' : 'html'](g_channels.channel_msg_parse(d.list, true));
                if (cnt < d.max) {
                    setTimeout(() => {
                        if (!isScroll($('#msg_list')[0]).scrollY) {
                            g_channels.channel_prevPage();
                        }
                    }, 500);
                }
                $(window).resize();
                if (cnt == 0) {
                    g_chat.chat_toBottom();
                }
                break;

            case 'channel_msg':
                $(g_channels.channel_msg_parse(d)).appendTo('#msg_list');
                if (d.user == g_config.user.user) { // 自己发送消息自动滚动到底部
                    g_chat.chat_toBottom();
                }
                $(window).resize();
                break;
            case 'channel_join':
                g_channels.channel_join(d)
                break;
            case 'channel_list':
                g_channels.channel_list(d);
                break;
            case 'toast':
                toast(d.text, d.class);
                break;
            case 'msg':
                break;
        }
    },

    isConnected: function() {
        return this.connection && this.connection.readyState == 1;
    },

    send: function(type, data = {}) {
        if (typeof(type) == 'object') {
            data = type;
            type = data.type;
            delete data.type;
        }
        var u = g_config.user;
        var r = {
            type: type,
            data: data,
            user: {
                user: u.user,
                password: files.getMd5(u.password),
            }
        }
        console.log('send', r);
        if (this.isConnected()) {
            this.connection.send(JSON.stringify(r));
        } else {
            g_room.connect();
        }
    },
}

g_socket.init();