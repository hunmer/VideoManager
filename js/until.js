

var MODAL_HTML = (id, opts) => {
    opts = Object.assign({
        autoDestroy: false,
        title: '',
        html: '',
        scrollable: true,
    }, opts);
    return `<div class="modal fade" id="${id}" tabindex="-1" aria-labelledby="modal_${id}_lable" aria-hidden="true"${opts.autoDestroy ? ' data-destroy=1' : ''}>
        <div class="modal-dialog ${opts.scrollable ? 'modal-dialog-scrollable' : ''}">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modal_${id}_lable">${opts.title}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">${opts.html}</div>
                <div class="modal-footer">
                </div>
            </div>
        </div>
    </div>
 `
}


function replaceAll_once(str, search, replace, start = 0) {
    if (typeof(str) != 'string') return ''
    while (true) {
        var i = str.indexOf(search, start);
        if (i == -1) break;
        start = i + search.length;
        str = str.substr(0, i) + replace + str.substr(start, str.length - start);
        start += replace.length - search.length;
    }
    return str;
}


function nextScrollTime(e) {
    var d = domSelector({ action: 'setScrollAddTime' }, '.active');
    if (!d.length) {
        return setScrollAddTime(1);
    }
    var n = e.deltaY > 0 ? d.prev() : d.next();
    if (n.length) {
        return n[0].click();
    }
}
function setScrollAddTime(time, save = true) {
    if (save) {
        g_config.scrollAdd = time;
        local_saveJson('config', g_config);
    }
    $('#scrollAddTime').html(time);
    domSelector({ action: 'setScrollAddTime' }, '.active').removeClass('active');
    domSelector({ action: 'setScrollAddTime', time: time }).addClass('active');
}

function loadConfig() {
    setScrollAddTime(g_config.scrollAdd || 1, false);
}

function hidePreview(playVideo = true) {
    delete g_cache.previewFile;
    clearTimeout(g_cache.previewClip);
    $('#preview_video_popup').css({
        display: 'none',
        position: 'fixed',
    }).find('video').attr('src', '');
    playVideo && g_player.tryStart();
}

function loadTab(id) {
    $('#_' + id + '-tab').click();
}


function toast(msg, style = 'alert-info', time = 3000) {
     triggerEvent('onToastMessage', {
        msg: msg,
        style: style,
        time: time,
     }, data => {
        var {msg, style, time} = data;
        var dom = $('.alert');
        dom.removeClass(dom.attr('data-style')).addClass(style).attr('data-style', style);
        dom.removeClass('hide').find('.text').html(msg);
        if (g_cache.toastTimer) clearInterval(g_cache.toastTimer);
        g_cache.toastTimer = setInterval(() => {
            dom.addClass('hide');
        }, time);
     });
}