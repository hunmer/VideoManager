var path = require('path');
var fs = require('fs');
var express = require('express');
var http = require('http');
var files = require('./file.js');
var app = express();

function getIP() {
    return new Promise(function(resolve, reject) {
        var ifaces = os.networkInterfaces();
        Object.keys(ifaces).forEach(function(ifname) {
            ifaces[ifname].forEach(function(iface) {
                if ('IPv4' == iface.family && iface.internal == false && iface.address.substr(0, 8) == '192.168.') {
                    resolve(iface.address);
                }
            });
            reject();
        });
    });
}

module.exports = {
    startServer: function(opts) {
        var g_infomation = Object.assign({
            ip: '',
            path: 'D:\\a\\'
        }, opts);
        console.log(g_infomation);
        var g_cache = {}
        getIP().then(ip => g_infomation.ip = ip)

        app.use(function(req, res, next) {
            res.header('Access-Control-Allow-Origin', '*')
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
            res.header(
                'Access-Control-Allow-Headers',
                'Content-Type, Authorization, access_token'
            )
            if ('OPTIONS' === req.method) {
                res.send(200)
            } else {
                next()
            }
        })


        function echoJson(res, data) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        }

        // app.use(express.static(path.join(__dirname, `../../chat`)));
        app.use(express.static(g_infomation.path));
        app.get('/api/status', function(req, res) {
            echoJson(res, g_infomation);
        });
        app.get('/api/icons', function(req, res) {
            var user = req.query.user;
            var filePath = g_infomation.path + 'icons/' + user + '.jpg';
            if (!files.exists(filePath)) {
                filePath = 'manager/res/user.jpg';
            }
            const cs = fs.createReadStream(filePath);
            cs.on("data", chunk => {
                res.write(chunk);
            })
            cs.on("end", () => {
                res.status(200);
                res.end();
            })
        });

        var server = http.createServer(app);
        var WebSocketServer = require('ws').Server;
        var wss = new WebSocketServer({ port: 41595 });
        wss.on('connection', function connection(ws) {
            // console.log(ws);
            ws.on('message', function incoming(msg) {
                try {
                    onData(JSON.parse(msg), ws)
                } catch (e) {

                }
            })
            ws.on('close', function close() {
                if (ws._user) {
                    console.log(ws._user + '断开连接');
                    if (ws._channel) g_channels.channel_broadcast(ws._channel, { type: 'player_channel_quit', user: ws._user });
                }
            });
        });

        server.listen(8000, function listening() {
            console.log('server start at port: 8000');
        });

        function send(client, type, data = {}) {
            var r = { data: data, type: type };
            client && client.send(JSON.stringify(r));
        }

        function broadcast(type, data = {}, targets) {
            if (typeof(type) == 'string') {
                switch (type) {
                    case 'channel_list':
                        data = g_channels.channel_list();
                        break;
                }
            } else
            if (typeof(type) == 'object') {
                data = JSON.parse(JSON.stringify(type));
                type = data.type;
                delete data.type;
            }
            var text = JSON.stringify({
                type: type,
                data: data
            });
            for (var client of (targets || wss.clients)) {
                client.send(text);
            }
        }

        var g_cache = {};

        function getConfig(file, def) {
            try {
                if (files.exists(file)) {
                    return JSON.parse(files.read(file));
                }
            } catch (err) {

            }
            return def;
        }


        function saveConfig(file, data) {
            try {
                files.write(file, JSON.stringify(data));
            } catch (err) {

            }
        }

        function loadDB(dbFile, readonly = true, def) {
            files.mkdir(path.dirname(dbFile));
            var exists = files.exists(dbFile);
            if (!exists && readonly) return false;
            var db = require('better-sqlite3')(dbFile, {
                readonly: readonly,
            });
            if (!exists) {
                db.exec(def);
            }
            return db;
        }

        function log(msg, user, table = 'logs') {
            if (typeof(msg) == 'object') msg = JSON.stringify(msg);
            g_log.prepare(`INSERT INTO ${table} (msg, user, date) VALUES (@msg, @user, @date)`).run({
                msg: msg,
                user: user,
                date: new Date().getTime(),
            });
        }

        function guid() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        var g_channels = {
            file: './channels.json',
            dbs: {},
            list: {},
            init: function() {
                this.list = getConfig(this.file, {
                    123: {
                        name: '总群',
                        desc: '说明',
                    }
                });
            },

            channel_get: function(id, withId = true) {
                return Object.assign(this.list[id], {
                    channel: id
                });
            },
            channel_remove: function(id) {
                if (this.list[id]) {
                    delete this.list[id];
                    this.save();
                    return true;
                }
            },

            channel_getByName: function(name) {
                for (var id in this.list) {
                    if (this.list[id].name == name) {
                        return this.channel_get(id);
                    }
                }
            },

            channel_list: function() {
                return this.list;
            },

            channel_getDB: function(id) {
                if (!this.dbs[id]) this.dbs[id] = loadDB(`${g_infomation.path}chat/${id}/logs.db`, false, `
            CREATE TABLE IF NOT EXISTS logs(
                 id    INTEGER PRIMARY KEY AUTOINCREMENT,
                 msg   TEXT,
                 user   TEXT,
                 date   INTEGER
           );
            CREATE TABLE IF NOT EXISTS msgs(
                 id    INTEGER PRIMARY KEY AUTOINCREMENT,
                 msg   TEXT,
                 user   TEXT,
                 msgType   INTEGER,
                 date   INTEGER
           );
        `);
                return this.dbs[id];
            },

            msg_delete: function(id, msg) {
                var db = this.channel_getDB(id);
                return db.prepare(`DELETE FROM msgs WHERE id = ?;`).run(msg).changes;
            },

            channel_getData: function(table, d, filter = '') {
                var db = this.channel_getDB(d.channel);
                var r = {
                    max: db.prepare(`SELECT COUNT(*) FROM ${table} ${filter};`).get()['COUNT(*)'],
                }
                if (d.start != undefined) {
                    r.list = db.prepare().all([d.start, d.end || new Date().getTime()]) || {};
                } else
                if (d.index != undefined) {
                    r.list = db.prepare(`SELECT * FROM ${table} ${filter} order by date desc LIMIT ${d.count || 20} OFFSET ${d.index};`).all() || {};
                }
                return r;
            },

            channel_history: function(d) {
                return this.channel_getData('msgs', d)
            },

            channel_videos: function(d) {
                return this.channel_getData('msgs', d, 'WHERE msgType=1');
            },

            setData: function(md5, data) {
                var keys = Object.keys(data);
                var s = '';
                keys.every((key, i) => {
                    s += key + ' = ?';
                    if (i != keys.length - 1) {
                        s += ','
                    }
                    return true;
                });
                var handle = this.db.prepare(_d(`UPDATE videos SET ${s} WHERE md5=?`));
                return handle.run(Object.values(data).concat(md5)).changes;
            },

            channel_video_comment: function(action, id, d) {
                var db = this.channel_getDB(id);
                var row = db.prepare(`SELECT * FROM msgs WHERE id=? and msgType = 1;`).get(d.id);
                if (row) {
                    var json = JSON.parse(row.msg);
                    console.log(json);
                    var r = { action: action, list: {}, id: d.id };
                    switch (action) {
                        case 'set':
                        case 'add':
                            if (!d.cid) d.cid = guid();
                            if (!json.comments) json.comments = {};
                            var c = {
                                date: new Date().getTime(),
                                text: d.text,
                                user: d.user
                            }
                            json.comments[d.cid] = c;
                            r.list[d.cid] = Object.assign(c, { id: d.id });
                            break;

                        case 'delete':
                            if (d.cid && json.comments && json.comments[d.cid]) {
                                delete json.comments[d.cid];
                            }
                            r.list[d.cid] = {
                                user: d.user
                            }
                            break;
                    }
                    if (db.prepare(`UPDATE msgs SET msg = ? WHERE id = ?;`).run([JSON.stringify(json), d.id]).changes) {
                        this.channel_broadcast(id, 'channel_video_comment', r);
                        console.log(json);
                    }
                }
            },

            channel_set: function(id, vals) {
                this.list[id] = vals;
                this.save();
            },
            save: function() {
                saveConfig(this.file, this.list)
            },
            event: function(id, data) {
                if (typeof(data.msg) == 'object') {
                    data.msg = JSON.stringify(data.msg);
                }
                var self = this;
                const log1 = (table, d) => {
                    console.log(table, d);
                    return self.channel_getDB(id).prepare(`INSERT INTO ${table} (msg, user, date,msgType) VALUES (@msg, @user, @date, @msgType)`).run(Object.assign(d, {
                        date: new Date().getTime(),
                    }));
                }
                switch (data.type) {
                    case 'channel_video_upload':
                    case 'channel_msg':
                        var insert = log1('msgs', data);
                        console.log(insert);
                        if (insert.changes) {
                            data.id = insert.lastInsertRowid;
                        }
                        break;
                    case 'channel_edit':
                    case 'channel_remove':
                        log1('logs', data)
                        break;
                }
            },
            channel_players: function(id, opts, object = false) {
                var r = [];
                wss.clients.forEach(function each(client) {
                    if (client._channel == id) {
                        r.push(object ? client : client._user);
                    }
                });
                return r;
            },
            channel_broadcast: function(id, type, data) {
                if (typeof(type) == 'object') {
                    data = type;
                    type = data.type;
                    delete data.type;
                }
                var pls = this.channel_players(id, {}, true);
                data.players = pls.length;
                broadcast(type, data, pls);
            }
        }
        g_channels.init();


        function saveBase64Image(file, data) {
            files.write(file, new Buffer.from(data.replace(/^data:image\/\w+;base64,/, ""), 'base64'));
        }


        var g_profiles = {
            file: './profiles.json',
            init: function() {
                this.list = getConfig(this.file, {

                });
            },
            profile_get: function(id, withId = true) {
                return this.list[id];
            },
            profile_remove: function(id) {
                if (this.list[id]) {
                    delete this.list[id];
                    this.save();
                    return true;
                }
            },
            profile_list: function() {
                return this.list;
            },
            profile_set: function(id, vals) {
                this.list[id] = vals;
                this.save();
            },
            profile_login(o) {
                var d = this.profile_get(o.user);
                return d && d.password == o.password;
            },
            save: function() {
                saveConfig(this.file, this.list)
            },
        }
        g_profiles.init();


        function onData(data, ws) {
            // console.log(data);

            var u = data.user;
            if (!u) return;

            var d = data.data;
            if (['channel_remove', 'channel_edit', 'channel_join', 'channel_history', 'channel_msg', 'channel_msg_delete', 'channel_video_upload', 'channel_video_comment_add'].includes(data.type)) {
                if (d.channel == undefined) return;
                c = g_channels.channel_get(d.channel);
                if (!c) {
                    return send(ws, 'toast', { text: '频道不存在!', class: 'bg-danger' });
                }
            }

            var r;
            switch (data.type) {

                // Channel
                case 'channel_video_comment_add':
                case 'channel_video_comment_delete':
                    // if(!d.cid) d.cid = '';
                    r = g_channels.channel_video_comment(data.type.split('_').pop(), d.channel, Object.assign(d, { user: u.user }));
                    break;

                case 'channel_videos':
                    r = g_channels.channel_videos(d);
                    break;

                case 'channel_players':
                    r = g_channels.channel_players(d.channel, d);
                    break;
                case 'channel_video_upload':
                    // delete d.user;
                    onData({
                        type: "channel_msg",
                        data: {
                            msg: d,
                            channel: d.channel,
                            msgType: 1, // video
                        },
                        user: u
                    });
                    break;
                case 'channel_msg_delete':
                    if (g_channels.msg_delete(d.channel, d.id)) {
                        broadcast({ type: 'channel_msg_delete', msg: d.id, user: u.user, date: new Date().getTime() });
                    }
                    break;

                case 'channel_msg':
                    if (typeof(d.msg) == 'string' && d.msg.startsWith('data:image/')) {
                        var md5 = files.getMd5(d.msg);
                        var file = `chat/${d.channel}/imgs/${md5}.jpg`;
                        saveBase64Image(g_infomation.path + file, d.msg);
                        d.msg = '@image,' + file;
                    }
                    var d1 = { type: 'channel_msg', msg: d.msg, user: u.user, date: new Date().getTime(), msgType: d.msgType || 0 }
                    g_channels.event(d.channel, d1); // 插入数据并返回id
                    broadcast(d1);
                    break;

                case 'channel_edit':
                    r = { type: 'channel_edit', msg: data.props, user: u.user, date: new Date().getTime() }
                    g_channels.channel_set(d.channel, Object.assign(c, data.props));
                    send(ws, 'toast', { text: '保存频道设置成功!', class: 'bg-success' });
                    g_channels.event(d.channel, r);
                    break;

                case 'channel_remove':
                    if (g_channels.channel_remove(d.channel)) {
                        r = { type: 'channel_remove', msg: '', user: u.user, date: new Date().getTime() }
                        send(ws, 'toast', { text: '删除频道成功!', class: 'bg-success' });
                        g_channels.event(d.channel, r);
                    }
                    break;

                case 'channel_create':
                    if (g_channels.channel_get(d.channel)) {
                        return send(ws, 'toast', { text: '频道已经存在!', class: 'bg-danger' });
                    }
                    g_channels.channel_set(d.channel, Object.assign(data.props, {
                        creator: u.user,
                    }));
                    send(ws, 'toast', { text: '创建频道成功!', class: 'bg-success' });
                    broadcast('channel_list');
                    break;

                case 'channel_get':
                case 'channel_join':
                    if (!g_profiles.profile_login(u)) {
                        return send(ws, 'profile_confirm');
                    }
                    if (data.type == 'channel_join') ws._channel = d.channel;

                    g_channels.channel_broadcast(d.channel, { type: 'player_channel_join', user: u.user });
                    r = g_channels.channel_get(d.channel)
                    break;

                case 'channel_list':
                    r = g_channels.channel_list();
                    break;

                case 'channel_history':
                    r = g_channels.channel_history(d);
                    break;

                    // Profile
                case 'profile_set':
                    p = g_profiles.profile_get(d.user);
                    if (p) {
                        if (!d.create) {
                            var password = d.oldPassword || d.password;
                            if (password != p.password) return send(ws, 'toast', { text: '密码错误!', class: 'bg-danger' });
                        } else {
                            return send(ws, 'toast', { text: '用户名已存在!', class: 'bg-danger' });
                        }
                    } else {
                        // 新建
                        p = {};
                    }
                    if (d.icon.startsWith('data:image/')) {
                        saveBase64Image(g_infomation.path + 'icons/' + d.user + '.jpg', d.icon);
                    }
                    g_profiles.profile_set(d.user, {
                        password: d.password,
                        last: new Date().getTime(),
                    });
                    if (d.create) {
                        log({
                            type: 'profile_create',
                        }, u.user);
                    }
                    send(ws, 'toast', { text: d.create ? '创建用户成功!' : '保存成功', class: 'bg-success' });
                    r = d.user;
                    break;

                case 'profile_remove':
                    if (!g_profiles.profile_login(u)) return;
                    g_profiles.profile_remove(u.user);
                    send(ws, 'toast', { text: '注销账号成功!', class: 'bg-success' });
                    log({
                        type: 'profile_remove',
                    }, u.user);
                    break;

                case 'login':
                    ws._user = u.user;
                    send(ws, 'channel_list', g_channels.channel_list());
                    break;
                case 'log_add':
                    break;

                case 'log_get':
                    r = g_log.prepare(`SELECT *  FROM logs WHERE date >= ? and date <= ? order by date desc;`).all([d.time, new Date().getTime()]) || {

                    };
                    break;



                default:
                    return;
            }
            if (r) send(ws, data.type, r);
        }
    }
}