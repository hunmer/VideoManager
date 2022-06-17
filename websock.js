var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 41595 });
wss.on('connection', function connection(ws) {
    // console.log(ws);
    send(ws, { type: 'msg', msg: 'welcome' });
    ws.on('message', function incoming(msg) {
        try {
            onData(JSON.parse(msg))
        } catch (e) {

        }
    })
});


function send(client, type, data = {}) {
    data.type = type;
    client && client.send(JSON.stringify(data));
    console.log(data);
}

var g_cache = {};

function getConfig(file, def) {
    try {
        if(files.exists(file)){
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

const FILE_CHANNELS = './channels.json';
const FILE_PROFILES = './profiles.json';

var g_channels = getConfig(FILE_CHANNELS, {

});

function channel_get(id) {
    return g_channels[id];
}

function channel_set(id, vals) {
    g_channels[id] = vals;
    saveConfig(FILE_CHANNELS, g_channels)
}

function channel_remove(id) {
    delete g_channels[id];
    saveConfig(FILE_CHANNELS, g_channels)
}

var g_profiles = getConfig(FILE_PROFILES, {

});

console.log(g_profiles);

function profile_get(id) {
    return g_profiles[id];
}

function profile_set(id, vals) {
    g_profiles[id] = vals;
    saveConfig(FILE_PROFILES, g_profiles)
}

function profile_remove(id) {
    delete g_profiles[id];
    saveConfig(FILE_PROFILES, g_profiles)
}

function profile_login(o) {
    var d = profile_get(o.user);
    return d && d.password == o.password;
}


function loadDB(dbFile, readonly = true, def) {
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

var g_log = loadDB('./logs.db', false, `
    CREATE TABLE IF NOT EXISTS logs(
     id    INTEGER PRIMARY KEY AUTOINCREMENT,
     msg   TEXT,
     user   TEXT,
     date   INTEGER
 );

`);

function log(msg, user) {
    if(typeof(msg) == 'object') msg = JSON.stringify(msg);
    g_log.prepare('INSERT INTO logs (msg, user, date) VALUES (@msg, @user, @date)').run({
        msg: msg,
        user: user,
        date: new Date().getTime(),
    });
}

// onData({
//     type: 'profile_create',
//     user: {
//         user: 'maki',
//         password: '123',
//     },
//     id: 'www',
// });

// onData({
//     type: 'profile_remove',
//     user: {
//         user: 'maki',
//         password: '123',
//     },
//     id: 'www',
// });

function onData(data, ws) {
    console.log(data);
    var r = {};
    var u = data.user;
    if (!u) return;

    if(['channel_remove', 'channel_edit'].includes(data.type)){
        c = channel_get(data.channel);
        if (!r) {
            return send(ws, 'toast', { text: '频道不存在!', class: 'bg-danger' });
        }
    }

    switch (data.type) {
        case 'channel_edit':
            channel_set(data.channel, Object.assign(r, data.props));
            send(ws, 'toast', { text: '保存频道设置成功!', class: 'bg-success' });
            log({
                type: 'channel_edit',
                channel: r.title
            }, u.user);
            break;
        case 'channel_remove':
            channel_remove(data.id);
            send(ws, 'toast', { text: '删除频道成功!', class: 'bg-success' });
            log({
                type: 'channel_remove',
                channel: r.title
            }, u.user);
            break;

        case 'channel_create':
            r = channel_get(data.channel);
            if (r) {
                return send(ws, 'toast', { text: '频道已经存在!', class: 'bg-danger' });
            }
            channel_set(data.channel, Object.assign(data.props, {
                creator: u.user,
            }));
            send(ws, 'toast', { text: '创建频道成功!', class: 'bg-success' });
            log({
                type: 'channel_create',
                channel: r.title
            }, u.user);
            break;

        case 'channel_get':
            r = channel_get(data.channel)
            break;

        case 'channel_list':
            r = g_channels;
            // for(var id in g_channels){
            //     var d = g_channels[id];
            //     // r[id] = {name} = d;
            //     r[id] = d;
            // }
            break;

            // user
        case 'profile_create':
            r = profile_get(u.user);
            if (r) {
                return send(ws, 'toast', { text: '用户名已存在!', class: 'bg-danger' });
            }
            profile_set(u.user, Object.assign(u, {
                date: new Date().getTime()
            }));
            send(ws, 'toast', { text: '创建用户成功!', class: 'bg-success' });
            log({
                type: 'profile_create',
            }, u.user);
            break;
        case 'profile_remove':
            if (!profile_login(u)) return;
            profile_remove(u.user);
            send(ws, 'toast', { text: '注销账号成功!', class: 'bg-success' });
            log({
                type: 'profile_remove',
            }, u.user);
            break;
        case 'login':

            break;
        case 'log_add':

            break;

        case 'log_get':
            r = g_log.prepare(`SELECT *  FROM logs WHERE date >= ? and date <= ? order by date desc;`).all([date.time, new Date().getTime()]) || {

            };
            break;

        default:
            return;
    }
    send(ws, data.type, r);
}