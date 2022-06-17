const { ipcRenderer } = require('electron');
const files = require('../file.js')
var spawn = require("child_process").spawn;
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(path.join(__dirname, '../bin/ffmpeg.exe'));
var rm = require('rimraf');
var nsg = require('node-sprite-generator');
var Jimp = require('jimp');
var os = require('os');

window.nodejs = {
    files: files,
    dir: path.join(__dirname, '../../../'),
    env: process.env,
    path: replaceAll_once(__dirname, '\\', '\/'),
}

function startServer(){
     require('../websock.js');
}

startServer();

function getIP(){
    return new Promise(function(resolve, reject) {
        var ifaces = os.networkInterfaces();
        Object.keys(ifaces).forEach(function (ifname) {
            ifaces[ifname].forEach(function (iface) {
                if ('IPv4' == iface.family && iface.internal == false && iface.address.substr(0, 8) == '192.168.') {
                    resolve(iface.address);
                }
            });
            reject();
        });
    });
}

function getLunchParam(param) {
    var args = process.argv;
    args.splice();
    var val = args.find((s, i) => s.startsWith(param));
    return val != undefined ? val.replace(param, '') : '';
}

function replaceAll_once(str, search, replace, start = 0) {
    while (true) {
        var i = str.indexOf(search, start);
        if (i == -1) break;
        start = i + search.length;
        str = str.substr(0, i) + replace + str.substr(start, str.length - start);
        start += replace.length - search.length;
    }
    return str;
}

function doFFMPEG(opts, callback) {
    switch (opts.type) {
        case 'cover':
        console.log(opts.output);
            if (!files.isDir(__dirname + '/cover/')) files.mkdir(__dirname + '/cover/')
            ffmpeg(files.getPath(opts.input))
                .screenshots({
                    timestamps: opts.params,
                    folder: path.dirname(files.getPath(opts.output)),
                    filename: path.basename(opts.output),
                    size: opts.size
                }).on('end', function() {
                    callback();
                });
            break;
        case 'meta':
            ffmpeg.ffprobe(files.getPath(opts.input), function(err, metadata) {
                if (err == null) {
                    callback(metadata);
                }
            });
            break;
    }
}


window._api = {
	loadDB: function(readonly = true){
        var dbFile = window.nodejs.dir + '/data.db';
        var exists = files.exists(dbFile);
        if (!exists && readonly) return false;
        var db = require('better-sqlite3')(dbFile, {
            readonly: readonly,
        });
        if (!exists) {
            db.exec(`CREATE TABLE IF NOT EXISTS videos(
                 id      INTEGER PRIMARY KEY AUTOINCREMENT,
                 tags   TEXT,
                 uploader   TEXT,
                 json   TEXT,
                 date   INTEGER,
                 desc   TEXT,
                 name   TEXT,
                 md5    CHAR(32)           NOT NULL
             );`);
        }
        return db;
	},
	closeDB: function(){
		 // g_share.db.close();
       //      files.remove(g_config.sharePath + '/' + 'data.db');
       //      ipc_send('share_initDB');
	},
    method: function(data) {
        console.log(data);
        var d = data.msg;
        switch (data.type) {
            case 'openFolder':
                files.openFileInFolder(files.getPath(d));
                break;
            case 'deleteFile':
                for (var file of d) {
                    files.remove(files.getPath(file));
                }
                break;
            case 'meta':
                d.type = 'meta';
                d.input = files.getPath(d.input);
                if (!files.exists(d.input)) return;
                doFFMPEG(d, (meta) => {
                    d.callback(d.key, meta)
                });
                return;
            case 'cmd':
                d.output = files.getPath(d.output);
                //if (files.exists(d.output)) return;
                doFFMPEG(d, () => {
                    d.callback(d.key, d.output, files.exists(d.output))
                })
                return;

            default:
                ipcRenderer.send('method', data);
        }

    }
}