const { win, ipcRenderer } = require('electron');
const files = require('./file.js')
var spawn = require("child_process").spawn;
const iconvLite = require('iconv-lite');
const path = require('path');
const { execFile } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(path.join(__dirname, 'bin/ffmpeg.exe'));
var rm = require('rimraf');
var nsg = require('node-sprite-generator');
var Jimp = require('jimp');
var os = require('os');


window.nodejs = {
    files: files,
    env: process.env,
}


function videoThumb(file, output) {
    return new Promise(function(resolve, reject) {
        if (files.exists(output)) {
            return resolve(output);
        }
        var tmp = __dirname+'/cache/'+files.getMd5(file)+'/';
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
                         rm(tmp, function () {
                            resolve(output);
                        });
                    });
                });
            })
    });
}



// ffmpeg('C:\\Users\\31540\\Downloads\\Video\\天道\\20.mp4').outputOptions([
//         '-y',
//         '-ss 2.9',
//         '-vcodec mjpeg',
//         '-vframes 1',
//         '-an',
//         '-f rawvideo',
//         '-s 240x180',
//     ]).on('start', function(cmd) {})
//     .on('progress', function(progress) { console.log(progress) })
//     .on('end', function(str) {

//     })
//     .save("C:\\AppServ\\www\\videoManager\\cover\\1650382810074.jpg");

ipcRenderer.on('toast', (event, arg) => {
    toast(arg.text, arg.class);
});


// registerAction('openFile', (dom, action, event) => {

// });

function doFFMPEG(opts, callback) {
    switch (opts.type) {
        case 'cut':
             if (!files.isDir(__dirname+'/cuts/')) files.mkdir(__dirname+'/cuts/')
            const setText = (text) => g_video.setClipStatus(opts.key, text);
            ffmpeg(files.getPath(opts.input)).outputOptions(opts.params)
                .videoCodec('libx264')
                // .audioCodec('libmp3lame')
                .on('start', function(cmd) {
                    setText('准备中');
                })
                .on('progress', function(progress) {
                    setText(parseInt(toTime(progress.timemark) / opts.duration * 100 )+'%');
                })
                .on('end', function(str) {
                    setText('');
                    callback();
                })
                .save(files.getPath(opts.output));
            break;

        case 'cover':
             if (!files.isDir(__dirname+'/cover/')) files.mkdir(__dirname+'/cover/')
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
            case 'videoThumb':
                videoThumb(d.file, __dirname+'/thumbnails/' + d.key + '.jpg').then(img => g_player.setVideothumbnails(img));
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
                if (files.exists(d.output)) return; // todo
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