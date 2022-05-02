const { win, ipcRenderer } = require('electron');
const files = require('./file.js')
var spawn = require("child_process").spawn;
const iconvLite = require('iconv-lite');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(path.join(__dirname, 'bin/ffmpeg.exe'));
var rm = require('rimraf');
var nsg = require('node-sprite-generator');
var Jimp = require('jimp');
var os = require('os');

// ffmpeg.getAvailableFormats(function(err, formats) {
//   console.log('Available formats:');
//   console.dir(formats);
// });

// ffmpeg.getAvailableCodecs(function(err, codecs) {
//   console.log('Available codecs:');
//   console.dir(codecs);
// });

// ffmpeg.getAvailableEncoders(function(err, encoders) {
//   console.log('Available encoders:');
//   console.dir(encoders);
// });

// ffmpeg.getAvailableFilters(function(err, filters) {
//   console.log("Available filters:");
//   console.dir(filters);
// });

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

window.nodejs = {
    files: files,
    env: process.env,
    path: replaceAll_once(__dirname, '\\', '\/'),
}

function videoThumb(file, output) {
    return new Promise(function(resolve, reject) {
        if (files.exists(output)) {
            return resolve(output);
        }
        var tmp = __dirname + '/cache/' + files.getMd5(file) + '/';
        files.mkdir(tmp);
        ffmpeg(file)
            .screenshots({
                count: 100,
                folder: tmp,
                filename: 'screenshot%00i.png',
                size: '160x?'
            })
            .on('end', function() {
                nsg({
                    src: [
                        tmp + '/*.png'
                    ],
                    spritePath: tmp + '/sprite.png',
                    stylesheetPath: tmp + '/sprite.css',
                    layout: 'horizontal',
                    compositor: 'jimp'
                }, function(err) {
                    Jimp.read(tmp + '/sprite.png', function(err, lenna) {
                        if (err) throw err;
                        lenna.quality(60).write(output);
                        rm(tmp, function() {
                            resolve(output);
                        });
                    });
                });
            })
    });
}


ipcRenderer.on('toast', (event, arg) => {
    toast(arg.text, arg.class);
});
ipcRenderer.on('onTop', (event, arg) => {
    domSelector({ action: 'pin' }).toggleClass('text-primary', arg);
});
ipcRenderer.on('openFiles', (event, arg) => {
    var r = [];
    for (var file of arg) {
        r.push({
            path: file,
            type: files.isDir(file) ? '' : path.extname(file),
            name: path.basename(file)
        })
    }
    parseFiles(r);
});
ipcRenderer.on('openImage', (event, arg) => {
    g_setting.setBg(arg, true);
});
ipcRenderer.on('log', (event, arg) => {
    console.log(arg);
});


function doFFMPEG(opts, callback) {
    switch (opts.type) {
        case 'cut':
            if (!files.isDir(__dirname + '/cuts/')) files.mkdir(__dirname + '/cuts/')
            const setText = (text, style = 'badge-secondary') => g_video.setClipStatus(opts.key, text, style);
            setText('队列中');
            ffmpeg(files.getPath(opts.input)).outputOptions(opts.params)
                .videoCodec('libx264')
                // .audioCodec('libmp3lame')
                .on('start', function(cmd) {
                    setText('准备中');
                })
                .on('progress', function(progress) {
                    setText(parseInt(toTime(progress.timemark) / opts.duration * 100) + '%', 'badge-primary');
                })
                .on('end', function(str) {
                    setText('任务完成', 'badge-success');
                    callback();
                })
                .save(files.getPath(opts.output));
            break;

        case 'cover':
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


    method: function(data) {
        console.log(data);
        var d = data.msg;
        switch (data.type) {

            case 'share_resetDB':
                return;
                if (g_share.db) {
                    g_share.db.close();
                    files.remove(g_config.sharePath + '/' + 'data.db');
                    ipc_send('share_initDB');
                }
                break;
            case 'share_initDB':
                g_share.getDB = function(readonly = true) {
                    var dbFile = g_config.sharePath + '/' + 'data.db';
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
                             link   TEXT,
                             desc   TEXT,
                             md5    CHAR(32)           NOT NULL
                         );`);
                    }
                    return db;
                }
                break;
            case 'videoThumb':
                videoThumb(d.file, __dirname + '/thumbnails/' + d.key + '.jpg').then(img => g_player.setVideothumbnails(img));
                break;
            case 'openFile':
                files.openFile(files.getPath(d));
                break;
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
                break;
            case 'cmd':
                d.output = files.getPath(d.output);
                //if (files.exists(d.output)) return;
                doFFMPEG(d, () => {
                    d.callback(d.key, d.output, files.exists(d.output))
                })
                return;
            case 'files.getPath':
                var list = [];
                files.searchDirFiles(data.msg, list, ['mp4', 'ts', 'm3u8', 'flv', 'mpd'], 2);
                window.revicePath(data.msg, list);
                return;
        }
        ipcRenderer.send('method', data);
    }
}

// module.exports = {
//     window,
// };