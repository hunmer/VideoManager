var g_socket = {
    defaultUrl: 'ws://127.0.0.1:41595',
    init: function() {
        // this.connect();
        this.findServer().then(ip => {
            console.log(ip);
            this.defaultUrl = ip;
            this.connect(ip);
        }, err => {
             toast('没有发现服务器!', 'bg-danger')
        });
    },
    startServer: function(){
        this.findServer().then(ip => {
            toast('不可以开启两个服务器!', 'bg-danger')
        }, err => {
            startServer();
        })
    },
    findServer: function() {
        return new Promise(function(resolve, reject){
        getIP().then(ip => {
            console.log(ip);
            ip = ip.split('.');
            ip.pop();
            ip = ip.join('.');
            var sockets = [];
            var err = 0;
            for (var i = 0; i <= 255; i++) {
                var socket = new WebSocket(`ws://${ip}.${i}:41595`);
                sockets.push(socket)
                socket.onopen = function(e) {
                    for (var socket of sockets) {
                        socket.close();
                    }
                    resolve(this.url);
                }
                socket.onerror = function(e) {
                    if(++err == 256){
                        reject();
                    }
                }
            }
        }, err => {
             toast('没有连接网络!', 'bg-danger')
        })
        });

    },
    setConnected: function(b) {
        var div = removeClass($('#badge_team_status'), 'bg-')
        .addClass('bg-' + (b ? 'success' : 'danger'));

        div.find('span').html(b ? '连接成功' : '连接失败');
        div.find().html(`
           
            `)
        if (!b) {

        }
    },
    recon: function(b = true) {
        self.reconnect && clearTimeout(self.reconnect);
        if (b) {
            self.reconnect = setTimeout(() => self.connect(), 1000 * 3)
        }
    },
    connect: function(url) {
        if (!url) url = this.defaultUrl;
        console.log(url);
        var self = this;
        if (self.connection) self.connection.close();
        var socket = self.connection = new WebSocket(url);
        socket.onopen = () => {
            self.setConnected(true);
            self.recon(false);
            self.send('login');
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

    onRevice: function(data) {
        console.log(data);
        switch (data.type) {
            case 'msg':
                break;
        }
    },

    isConnected: function() {
        return this.connection && this.connection.readyState == 1;
    },

    send: function(data) {
        if (typeof(data) != 'object') data = { type: data };
        Object.assign(data, g_config.user);
        console.log(data);
        if (this.isConnected()) {
            this.connection.send(JSON.stringify(data));
        } else {
            g_room.connect();
        }
    },
}

g_socket.init();