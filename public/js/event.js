$(function() {
    $(window).resize(function(event) {
        var maxHeight = window.screen.height,
            maxWidth = window.screen.width,
            curHeight = window.innerHeight,
            curWidth = window.innerWidth;
        var fullscreen = maxWidth == curWidth && maxHeight == curHeight;
        //$('#checkbox-fullScreen').prop('checked', fullscreen);
        // $('[data-action="fullScreen"]').find('i').attr('class', 'bi bi-fullscreen' + (fullscreen ? '-exit' : ''));
    }).resize();

    const inArea = (event, target) => {
        var point = { x: event.pageX, y: event.pageY }

        var area = $(target).offset();
        area = {
            l: area.left,
            t: area.top,
            w: $(target).width(),
            h: $(target).height(),
        }

        return point.x > area.l && point.x < area.l + area.w && point.y > area.t && point.y < area.t + area.h;
    }

    const fileDragHover = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if(!g_cache.draging){ // 过滤从浏览器拖动的文件
            $('#file-drop').toggleClass('hide1', !inArea(e, 'body'));
        }
    }
    $('body').on('dragleave', e => {
        fileDragHover(e)
    }).on('dragover', e => fileDragHover(e)).on('drop', function(e) {
        e = e.originalEvent;
        var files = e.target.files || e.dataTransfer.files;
        parseFiles(files);
        e.stopPropagation();
        e.preventDefault();
        delete g_cache.dragFile;
    });

});

function parseFiles(files) {
     var base = nodejs.files.getPath('*path*/cuts/');
    var cnt = 0;
    g_cache.files = [];
    g_cache.paths = [];
    for (var i = 0, f; f = files[i]; i++) {
        if (f.path) { // 从electron接受文件
            if (f.type == '') { // 目录
                //if (!confirm('你确定要导入目录: ' + f.path)) continue;
                g_cache.paths.push(f.path);
                ipc_send('getPath', f.path);
                cnt++;
                continue;
            }
            if(f.path == g_cache.dragFile) return;
            var ext = f.name.split('.').pop().toLowerCase();
            if(SUPPORTED_FORMAT.includes(ext)){
                    if(f.path.indexOf(base) == 0){ // 忽略裁剪过的文件
                        cnt++;
                        continue;
                    }
                g_cache.files.push(f.path);
            }
        }
    }
    if (cnt == 0) {
        if(g_cache.files.length > 0){
            g_video.reviceFiles(g_cache.files);
        }else{
            toast('不支持的文件', 'bg-danger');
             $('#file-drop').addClass('hide1');
        }
    }
}

function revicePath(path, files, title = '') {
    var i = g_cache.paths.indexOf(path);
    if (i != -1) {
        g_cache.paths.splice(i, 1);
        for (var file of files) {
            if (!g_cache.files.includes(file)) {
                g_cache.files.push(file);
            }
        }
        if (g_cache.paths.length == 0) {
            g_video.reviceFiles(g_cache.files, title);
        }
    }
}


function toggleFullScreen() {
    if (!document.fullscreenElement && // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        $(window).resize();
        return true;
    }
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
    $(window).resize();
    return false;
}