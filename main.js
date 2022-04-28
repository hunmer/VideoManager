// var electron = require('electron')
var fs = require('fs')
var files = require('./file.js')
const { app, session, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron')
const path = require('path');
const iconvLite = require('iconv-lite');
var g_method = {};
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

function runJs(script) {
    win.webContents.executeJavaScript(script).then((result) => {

    })
}

function registerMethod(type, callback) {
    g_method[type] = callback;
}

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1920,
        height: 1080,
        resizable: true,
        show: false,
        title: '',
        // fullscreen: true,
        webPreferences: {
            webSecurity: false,
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            webviewTag: true,
            contextIsolation: false,

        }
    });

    win.webContents.session.on('will-download', (event, item, webContents) => {
        //event.preventDefault();
        var dir = __dirname + '\\download\\';
        if (!files.isDir(dir)) files.mkdir(dir);

        // let prevReceivedBytes = 0;
        // var downloadItem = {};
        var file = item.getFilename();
        item.setSavePath(dir + file);
        item.on('updated', (event, state) => {
            if (state === 'interrupted') {
                //   
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
                webContents.send('toast', { text: `下载成功 <b><a data-action="openFile" data-file="${event.sender.getSavePath()}" href="javascript: void(0);">${fileName}</a></b>`, class: 'alert-success' });
            } else {
                webContents.send('toast', { text: `下载失败 <b><a href="javascript: void(0);">${fileName}</a></b>`, class: 'alert-danger' });
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

    win.maximize();
    win.show();
    win.loadFile('index.html')
    // win.webContents.toggleDevTools();

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
ipcMain.on("method", (event, data) => {
    if (g_method[data.type]) {
        return g_method[data.type](event, data);
    }
    var d = data.msg;
    switch (data.type) {
        case 'url':
            shell.openExternal(d);
            break;
        case 'ondragstart':
            var file = files.getPath(d.file);
            if (files.exists(file)) {
                win.webContents.startDrag({
                    file: file,
                    icon: files.exists(d.icon) ? d.icon : './favicon.png',
                });
            }
            break;
        case 'cmd':
            files.runCmd(d.replace('%path%', __dirname), (output) => {
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