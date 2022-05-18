// var electron = require('electron')
var fs = require('fs')
var files = require('./file.js')
const { app, session, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');

if (!app.requestSingleInstanceLock()) {
    dialog.showErrorBox('错误', '暂时不支持多开,如果没有多开请检查是否在后台运行(任务管理器)');
    app.exit(0);
}

const path = require('path');
const iconvLite = require('iconv-lite');
var g_method = {};
const config = './config.json';

var g_config = {
    devTool: false,
    hideFrame: true,
    fullScreen: true,
}

try {
    fs.accessSync(config, fs.R_OK);
    g_config = JSON.parse(files.read(config, JSON.stringify(g_config)));
} catch (err) {

}

var g_cache = {};

function saveConfig() {
    try {
        fs.accessSync(config, fs.W_OK);
        files.write(config, JSON.stringify(g_config));
    } catch (err) {

    }
}

//定义菜单
// var template = [{
//     label: '操作',
//     submenu: [{
//         label: '搜索',
//         accelerator: 'ctrl+f',
//         click: function() {
//             runJs('g_site.dialog_search()');
//         }
//     }]
// }];
// var m = Menu.buildFromTemplate(template);
// Menu.setApplicationMenu(m);
Menu.setApplicationMenu(null)

var win;
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
app.commandLine.appendSwitch('--ignore-certificate-errors', 'true');
app.commandLine.appendSwitch("disable-features", 'PreloadMediaEngagementData, MediaEngagementBypassAutoplayPolicies');
// app.commandLine.appendSwitch('disable-renderer-backgrounding')
// app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch("disable-http-cache");
app.commandLine.appendSwitch('wm-window-animations-disabled');

var dataPath = getLunchParam('--dataPath');
if (dataPath != '') app.setPath('userData', files.getPath(dataPath));

function getLunchParam(param) {
    var args = process.argv;
    args.splice();
    var i = args.findIndex((s, i) => s == param);
    return i != -1 && i + 1 <= args.length ? args[i + 1] : ''
}

function runJs(script) {
    win.webContents.executeJavaScript(script).then((result) => {

    })
}


function registerMethod(type, callback) {
    g_method[type] = callback;
}


function createWindow() {
    var opts = {
        width: 1920,
        height: 1080,
        resizable: true,
        show: false,
        title: 'loading...',
        hasShadow: true,
        frame: !g_config.hideFrame,
        // nativeWindowOpen: true,
        webPreferences: {
            webSecurity: false,
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            webviewTag: true,
            contextIsolation: false,
        }
    }
    win = new BrowserWindow(opts);
    win.webContents.on('dom-ready', (event) => {
        send('toggleFrame', opts.frame);
    });
    win.webContents.session.on('will-download', (event, item, webContents) => {
        //event.preventDefault();
        var dir = __dirname + '\\download\\';
        if (!files.isDir(dir)) files.mkdir(dir);

        // let prevReceivedBytes = 0;
        // var downloadItem = {};
        var file = '(' + new Date().getTime() + ')' + item.getFilename();
        item.setSavePath(dir + file);
        item.on('updated', (event, state) => {
            if (state === 'interrupted') {
            } else if (state === 'progressing') {
                if (item.isPaused()) {
                } else {
                    // const receivedBytes = item.getReceivedBytes()
                    // // 计算每秒下载的速度
                    // downloadItem.speed = receivedBytes - prevReceivedBytes
                    // prevReceivedBytes = receivedBytes;

                    const progress = parseInt(item.getReceivedBytes() / item.getTotalBytes() * 100);

                    if (process.platform == 'darwin') {
                        win.setProgressBar(progress)
                    }
                }
            }
        })
        item.once('done', (event, state) => {
            //console.log(event);
            var fileName = event.sender.getFilename();
            if (state === 'completed') {
                send('toast', [`下载成功 <b><a data-action="openFile" data-file="${event.sender.getSavePath()}" href="javascript: void(0);">${fileName}</a></b>`, 'alert-success']);
            } else {
                send('toast', [`下载失败 <b><a href="javascript: void(0);">${fileName}</a></b>`, 'alert-danger']);
            }
        })
    });
    // 处理 window.open 跳转
    win.webContents.setWindowOpenHandler((data) => {
        shell.openExternal(data.url)
        return {
            action: 'deny'
        }
    });
    win.show();
    if (g_config.bounds) {
        win.setBounds(g_config.bounds)
    } else
    if (g_config.fullScreen) {
        win.maximize();
    }
    const savePos = () => {
        g_config.bounds = win.getBounds();
        if (g_cache.savePos) clearTimeout(g_cache.savePos);
        g_cache.savePos = setTimeout(() => {
            delete g_cache.savePos;
            saveConfig();
        }, 1000);
    }
    win.on('move', (event) => {
        savePos();
    });
    win.on('resize', (event) => {
        savePos();
    });
    win.on('always-on-top-changed', (event, onTop) => {
        send('onTop', onTop);
    });
    win.loadFile('index.html');
    if (g_config.devTool) win.webContents.toggleDevTools();

}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function() {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit()
});

function saveDialog(callback, opts) {
    dialog.showSaveDialog(win, Object.assign({}, opts)).then(res => callback(res.filePath));
}

function openFileDialog(callback, opts) {
    dialog.showOpenDialog(win, Object.assign({}, opts)).then(res => callback(res.filePaths || res.filePath));
}

function send(type, params) {
    switch (type) {
        case 'toast':
            params = {
                text: params[0],
                class: params[1],
            }
            break;
    }
    win.webContents.send(type, params);
}
// win.showInactive() 展示窗口但是不获得焦点.
ipcMain.on("method", async function(event, data) {
    if (g_method[data.type]) {
        return g_method[data.type](event, data);
    }
    var d = data.msg;
    switch (data.type) {
        case 'switchAutoRun':
            if (app.getLoginItemSettings('openAtLogin') != d) {
                app.setLoginItemSettings({
                    openAtLogin: d, // Boolean 在登录时启动应用
                    // openAsHidden: d, // Boolean (可选) mac 表示以隐藏的方式启动应用。~~~~
                    // path: '', String (可选) Windows - 在登录时启动的可执行文件。默认为 process.execPath.
                    // args: [] String Windows - 要传递给可执行文件的命令行参数。默认为空数组。注意用引号将路径换行。
                });
            }
            break;
        case 'toggleFrame':
            g_config.hideFrame = d;
            saveConfig();
            dialog.showMessageBoxSync(win, { message: '请手动重启' });
            app.exit(0);
            break;
        case 'switchAccount':
            var params = d ? ['--dataPath', d] : [];
            // todo 只替换datapath 参数 
            // process.argv.slice(1).concat()
            app.relaunch({ args: params })
            app.exit(0)
            break;
        case 'getResult':
            send('getResult', { name: d.name, ret: eval(d.code) })
            break;
        case 'show':
            win.restore();
            win.show();
            break;
        case 'setBounds':
            var bounds;
            if (!d) {
                if (!g_cache.beforeSetBounds) return;
                d = g_cache.beforeSetBounds;
                delete g_cache.beforeSetBounds;
            } else {
                bounds = win.getBounds();
                g_cache.beforeSetBounds = Object.assign({}, bounds);
                d = Object.assign(bounds, d);
            }
            if (win.isMaximized()) win.unmaximize();
            win.setBounds(d);
            break;
        case 'pin':
            if (d == undefined) d = !win.isAlwaysOnTop();
            win.setAlwaysOnTop(d, 'screen');
            break;
        case 'openImageDialog':
            openFileDialog(file => {
                if (file.length) {
                    send('openImage', file[0]);
                }
            }, {
                title: '选择图片',
                filters: [{
                    name: '图片',
                    extensions: ['jpg', 'png', 'webp', 'gif'],
                }],
                properties: ['openFile'],
            });
            break;

        case 'openFileDialog':
            openFileDialog(files => {
                if (files.length) send('openFiles', files);
            }, {
                title: '添加文件(长按ctrl可多选)',
                filters: [{
                    name: '视频文件',
                    extensions: ['mp4', 'ts', 'm3u8', 'flv', 'mdp', 'mkv'], // , 'rar'
                }],
                properties: ['openFile', 'multiSelections'],
            });
            break;

        case 'openFolderDialog':
            openFileDialog(folders => {
                if (folders.length) send('openFolders', folders);
            }, {
                title: '同步本地目录(长按ctrl可多选)',
                properties: ['openDirectory', 'multiSelections'],
            });
            break;
        case 'saveAsZip':
            saveDialog(saveTo => {
                if (typeof(saveTo) == 'string' && saveTo.length) {
                    const archiver = require('archiver');
                    const output = fs.createWriteStream(saveTo);
                    const archive = archiver('zip', {
                        zlib: { level: 9 }
                    });

                    output.on('close', function() {
                        send('toast', [`[${files.renderSize(archive.pointer())}]保存成功 <b><a data-action="openFile" data-file="${saveTo}" href="#">${files.getFileName(saveTo)}</a></b>`, 'alert-success']);
                    });
                    const showErr = err => {
                        dialog.showErrorBox('下载失败', err.toString());
                    }
                    archive.on('warning', err => showErr(err));
                    archive.on('error', err => showErr(err));
                    archive.pipe(output);
                    for (var file in d.files) {
                        if (files.exists(file)) {
                            //var name = files.safePath(d.files[file]);
                            var name = d.files[file];
                            archive.file(file, { name: name + path.extname(file) });
                        }
                    }
                    archive.finalize();
                }
            }, {
                title: d.title || '选择保存位置',
                defaultPath: d.fileName,
                filters: [{
                    name: '压缩文件',
                    extensions: ['zip'], // , 'rar'
                }, ],
            });
            break;
        case 'url':
            shell.openExternal(d);
            break;
        case 'ondragstart':
            var list = [];
            for (var file of d.files) {
                file = files.getPath(file);
                if (files.exists(file)) {
                    list.push(file);
                }
            }
            var icon = files.getPath(d.icon);
            win.webContents.startDrag({
                files: list,
                icon: files.exists(icon) ? icon : __dirname + '/favicon.png',
            });
            break;
        case 'cmd':
            files.runCmd(d.replace('*path*', __dirname), (output) => {
                console.log(output)
            }, () => {
                // console.log('done');
            });
            break;
        case 'clearCache':
            // webview.clearCache(true);
            // loadUrl();
            break;
        case 'history_back':
            win.webContents.goBack();
            break;
        case 'history_forward':
            win.webContents.goForward();
            break;
        case 'reload':
            win.webContents.reload();
            break;
        case 'devtool':
            win.webContents.toggleDevTools()
            break;
        case 'min':
            win.minimize();
            break;
        case 'max':
            win.isMaximized() ? win.restore() : win.maximize();
            break;
        case 'close':
            win.close();
            break;
    }
});