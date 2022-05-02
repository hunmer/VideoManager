var spawn = require("child_process").spawn;
function runCmd(cmd, callback, onClose) {
    console.log(cmd);
    return new Promise(function(resolve, reject) {
        var result = spawn('cmd.exe ', ['/s', '/c', cmd], { shell: true });
        result.on('close', function(code) {
            if (typeof(onClose) == 'function') onClose(code);
        });
        result.stdout.on('data', function(data) {
            callback(iconvLite.decode(data, 'cp936'));
        });
        resolve();
    });
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

function getPath(p) {
    return replaceAll_once(p, '*path*', replaceAll_once(__dirname, '\\', '\/'));
}

module.exports = {
	runCmd,
    getPath,
    replaceAll_once
}