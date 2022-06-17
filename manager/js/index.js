function loadTooltips(doms){
    for(var dom of doms){
        new bootstrap.Tooltip(dom)
    }
}

(function() {
    loadTooltips($('[data-bs-toggle="tooltip"]'));
    var toastElList = [].slice.call(document.querySelectorAll('.toast'))
    var toastList = toastElList.map(function(toastEl) {
        return new bootstrap.Toast(toastEl, {})
    });
    var dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'))
    var dropdownList = dropdownElementList.map(function(dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl)
    });

    $(window).on('DOMContentLoaded', event => {

        })
        .on('blur', event => {
            hidePreview();
        })
        .on('focus', event => {
            hidePreview();
        })
        .on('resize', e => {
            for(var d of $('.p-relative-center')){
                var par = $(d.parentElement);
                d = $(d);

                d.css({
                    display: par.hasClass('p-hover') ? 'none' : 'unset', // 悬浮才显示
                    position: 'absolute',
                    left: par.width() / 2 - d.width() / 2 + 'px',
                    top: par.height() / 2 - d.height() / 2 + 'px',
                })
              
            }
        })

       
    $(document)
        .on('dragstart', '[data-file]', function(e) {
            g_cache.draging = true;
            dragFile(e, $(this).find('img').attr('src') || this.dataset.icon);
        })
        .on('dragend', '[data-file]', function(e) {
            g_cache.draging = false;
        })
        .on('click', '[data-action]', function(event) {
            if (this.classList.contains('disabled')) return;
            doAction(this, this.dataset.action, event);
        })
        .on('dblclick', '[data-dbaction]', function(event) {
            if (this.classList.contains('disabled')) return;
            doAction(this, this.dataset.dbaction, event);
        })
         .on('change', '[data-change]', function(event){
            if (this.classList.contains('disabled')) return;
            doAction(this, this.dataset.change, event);
        })
         .on('input', '[data-input]', function(event){
            if (this.classList.contains('disabled')) return;
            doAction(this, this.dataset.input, event);
        })
        .on('contextmenu', '[data-contenx]', function(event) {
            if (this.classList.contains('disabled')) return;
            doAction(this, this.dataset.contenx, event);
            clearEventBubble(event);
        })
        .on('mousewheel', 'video', function(event) {
            srcollVideo(event, this)
        })
        .on('mousemove', '[data-preview]', function(event) {
            var self = $(this);
            var par = self.parents('[data-file]');
            var file = par.attr('data-file');
            if (file != g_cache.previewing) {
                g_cache.previewing = file;
                hidePreview();
                g_cache.previewClip = setTimeout(() => {
                    $(`<video id="previewVideo" src="${file}" class="p-2 w-full" style="width: ${self.width()}px; height: ${self.height()+self.position().top * 2}px;position: absolute;top: 0;left: 0;z-index: 2;object-fit: cover;" onmouseout="hidePreview()" onmouseleave="hidePreview()" autoplay loop mute></video>`).appendTo(par);
                }, 100);
            }
        })
})();


function doAction(dom, action, event) {
    var action = action.split(',');
    if (g_actions[action[0]]) {
        g_actions[action[0]](dom, action, event);
    }
    switch (action[0]) {
         case 'pin':
            ipc_send('pin');
            break;
         case 'minSize':
            ipc_send('min');
            break;
        case 'maxSize':
            ipc_send('max');
            break;
        case 'close':
            ipc_send('close');
            break;
        case 'toggleSideBar':
            $('#sidebar_left').toggleClass('hideSide');
            break;
        case 'resetData':
            local_clearAll();
            location.reload();
            break;
    }

}