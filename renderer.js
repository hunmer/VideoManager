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
const https = require('https');

// ffmpeg.getAvailableFormats(function(err, codecs) {
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

function httpRequest(opts) {
    return new Promise(function(resolve, reject) {
        https.get(opts.url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                resolve(data);
            });
        }).on("error", (err) => {
            opts.onError && opts.onError(err.message);
        });
    });
}

function downloadFile(opts) {
    httpRequest({
        url: opts.url,
    }).then(data => {
        files.write(opts.saveTo, data);
        opts.callback(opts.saveTo);
    })
}

function checkFileUpdates(url, tip = true) {
    httpRequest({
        url: url + 'listFile.json',
    }).then(data => {
        try {
            var i = 0;
            var updated = [];
            var json = JSON.parse(data);
            for (var name in json) {
                var md5 = json[name];
                name = name.replace(/\\/g, "/");
                var saveTo = __dirname + '/' + name;
                if (files.exists(saveTo) && md5 == files.getFileMd5(saveTo)) continue;
                updated.push(name);
                i++;
            }
            if (tip) {
                if (!i) return toast('没有更新', 'alert-success');
                showUpdateFiles(url, updated);
            } else {
                g_cache.needUpdate = updated;
                domSelector('aboutMe').find('.badge').toggleClass('hide', i == 0).html('New');
            }
        } catch (e) {
            toast('请求错误', 'alert-danger');
        }
    })
}

function showUpdateFiles(url, updated) {
    var h = '<ul class="list-group">';
    for (var name of updated) h += `<li class="list-group-item">${name}</li>`;
    h += '</ul>';
    confirm(h, {
        id: 'modal_update',
        title: '有 ' + updated.length + ' 个文件可以更新!',
        btns: [{
            id: 'ok',
            text: '更新',
            class: 'btn-primary',
        }, {
            id: 'cancel',
            text: '取消',
            class: 'btn-secondary',
        }, {
            id: 'pack',
            text: '打包改动文件',
            class: 'btn-danger',
        }],
        callback: btn => {
            if (btn == 'ok') {
                $('#modal_update #btn_ok').addClass('disabled').html('更新中');
                updateFiles(url, updated);
                return false;
            } else
            if (btn == 'pack') {
                confirm('此功能用于打包自己改动过的代码，并不适用于所有人.你确定要继续操作吗?', {
                    callback: btn => {
                        if (btn == 'ok') {
                            var paths = {};
                            for (var name of updated) paths[__dirname + '\\' + name] = getFileName(name);
                            ipc_send('saveAsZip', {
                                fileName: 'scripts.zip',
                                files: paths,
                            });
                        }
                    }
                });
            }
        }
    })
}

function updateFiles(url, fileList) {
    var max = fileList.length;
    if (max == 0) return;
    var err = 0;
    var now = -1;
    var done = 0;
    var progress = 0;
    var next = () => {
        if (++now >= max) return;
        var name = fileList[now];
        downloadFile({
            url: url + name,
            saveTo: __dirname + '\\' + name,
            onError: () => ++err,
            callback: saveTo => {
                var newProgress = parseInt(++done / max * 100);
                if (newProgress != progress) {
                    progress = newProgress;
                    $('#modal_update #btn_ok').html(newProgress + '%');
                    if (progress == 100) {
                        $('#modal_update').modal('hide');
                        confirm(`成功更新 ${max - err} 个文件!${err ? err + '个文件处理失败!' : ''}是否重载页面?`, {
                            title: '更新成功',
                            callback: btn => {
                                if (btn == 'ok') location.reload();
                            }
                        });
                    }
                }
                next();
            }
        });
    }
    next();
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
g_cache.waitFor = {};

function waitForRespone(name, script, callback) {
    g_cache.waitFor[name] = callback;
    ipc_send('getResult', {
        name: name,
        code: script
    })
}
ipcRenderer.on('getResult', (event, arg) => {
    if (g_cache.waitFor[arg.name]) {
        g_cache.waitFor[arg.name](arg.ret);
        delete g_cache.waitFor[arg.name];
    }
});

var g_taskList = []; // todo 放在主线程 避免刷新丢失

g_cache.cutList = [];

function doFFMPEG(opts, callback) {
    switch (opts.type) {
        case 'cut':
            if (!files.isDir(__dirname + '/cuts/')) files.mkdir(__dirname + '/cuts/')
            if (!g_taskList.includes(opts.key)) g_taskList.push(opts.key);
            const setText = (text, style = 'badge-secondary') => g_video.setClipStatus(opts.key, text, style);
            setText('队列中');

            var custom = typeof(opts.params) == 'string';
            if (custom) {
                opts.params = opts.params.replace('{start}', opts.start).replace('{time}', opts.duration).split(' ');
            }
            var run = ffmpeg(files.getPath(opts.input))
                .outputOptions(opts.params);
            if (!custom) {
                run
                    .videoCodec(getConfig('outputVideo', 'libx264'))
                    .audioCodec(getConfig('outputAudio', 'copy'));
            }

            run.on('start', function(cmd) {
                    setText('准备中');
                    console.log(cmd);
                })
                .on('progress', function(progress) {
                    setText(parseInt(toTime(progress.timemark) / opts.duration * 100) + '%', 'badge-primary');
                })
                .on('error', function(e) {
                    toast(e, 'alert-danger');
                    console.error(e);
                    setText('错误', 'badge-danger');
                })
                .on('end', function(str) {
                    var i = g_taskList.indexOf(opts.key);
                    if (i != -1) {
                        g_taskList.splice(i, 1);
                        if (g_taskList.length == 0 && getConfig('notificationWhenDone')) {
                            waitForRespone('clipTask', 'win.isFocused()', focus => {
                                if (!focus) {
                                    showMessage('任务完成', '已完成所有裁剪');
                                }
                            });
                        }
                    }
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
            case 'supportedFormats':
                return ffmpeg.getAvailableCodecs(function(err, formats) {
                    d(formats);
                });
            case 'checkUpdate':
                checkFileUpdates(d);
                break;
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

            default:
                ipcRenderer.send('method', data);
        }
    }
}


function notifiMsg(title, opts) {
    var o = new Notification(title, {
        body: opts.text || '',
        icon: opts.icon || './favicon.png',
        silent: opts.slient,
    });
    o.onclick = function(e) {
        opts.onclick && opts.onclick(e);
    }
    o.onclose = function(e) {
        opts.onclose && opts.onclose(e);
    }
    o.onshow = function(e) {
        opts.onshow && opts.onshow(e);
    }
    return o;
}
// win.isMinimized()
function showMessage(title, text) {
    notifiMsg(title, {
        text: text,
        onclick: () => {
            ipc_send('show');
        }
    });
}

// module.exports = {
//     window,
// };