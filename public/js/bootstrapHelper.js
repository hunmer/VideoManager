window.prompt = function(text, opts) {
    return buildModal(`<textarea class="form-control" placeholder="${opts.placeholder || ''}" rows="10">${text}</textarea>`, Object.assign({
        id: 'modal_prompt',
        title: '请输入',
        onBtnClick: (config, btn) => {
            var par = $(btn).parents('.modal');
            if (config.callback(par.find('textarea').val()) === false) return;
            par.modal('hide');
        }
    }, opts));
}

window.confirm = function(text, opts) {
    return buildModal(text, Object.assign({
        id: 'modal_confirm',
        title: '询问',
        onBtnClick: (config, btn) => {
            if (config.callback(btn.id.substring(4)) === false) return;
            $(btn).parents('.modal').modal('hide');
        }
    }, opts));
}

function fullModal(modal, show = true, onClose) {
    modal.modal(show ? 'show' : 'hide');
    modal.one('hidden.bs.modal', function(event) {
        fullModal($(event.currentTarget), false);
        onClose && onClose();
    });
    var id = '#' + modal[0].id;
    var css = '';
    if (show) {
        css = `
        ${id} {
            padding: 0;
        }

        ${id} .modal-dialog {
            height: 100%;
            margin: 0;
            max-height: unset;
            max-width: unset;
        }

        ${id} .modal-content {
            height: 100%;
            max-height: unset;
        }
    `;
    }
    g_style.addStyle('modal', css);
}



function bindModalEvent(modal, opts) {
    modal
        .on('shown.bs.modal', function(event) {
            if (opts.autoFocus) {
                $(this).find('textarea').focus()
                $(this).find('input').focus()
            }
            opts.onShow && opts.onShow(modal);
        })
        .on('hidden.bs.modal', function(event) {
            opts.onClose && opts.onClose(modal);
            opts.once && modal.remove();
        });
    return modal;
}

function toggleSidebar(hide) {
    var c = 'sb-sidenav-toggled';
    localStorage.setItem('sb|sidebar-toggle', $('body').toggleClass(c, hide).hasClass(c));
}

function buildModal(text, opts) {
    opts = Object.assign({
        id: 'modal_confirm',
        title: '弹出窗口',
        autoFocus: true,
        width: 'unset',
        btns: [{
            id: 'ok',
            text: '确定',
            class: 'btn-primary',
        }, {
            id: 'cancel',
            text: '取消',
            class: 'btn-secondary',
        }],
        html: '%html%',
        scrollable: true,
        onShow: () => {},
        fullHeight: false,
        callback: (id) => {},
        onBtnClick: (config, btn) => {},
    }, opts);
    var modal = $('#' + opts.id);
    if (!modal.length) {
        // 临时modal
        modal = $(MODAL_HTML(opts.id, '')).appendTo('body');
    }
    modal.find('.modal-dialog').css({
        maxWidth:  opts.width == 'unset' ? '80%' : 'unset',
        minWidth: opts.width,
        width: opts.width,
    }).toggleClass('modal-dialog-scrollable', opts.scrollable);
    modal.find('.modal-content').toggleClass('h-full', opts.fullHeight);
    modal.find('.modal-title').html(opts.title);
    modal.find('.modal-body').html(opts.html.replace('%html%', text));
    var footer = modal.find('.modal-footer').html(opts.footer || '');
    for (var btn of opts.btns) {
        $(`<button id="btn_${btn.id}" type="button" class="btn ${btn.class}">${btn.text}</button>`)
            .prependTo(footer)
            .on('click', function() {
                opts.onBtnClick(opts, this);
            });
    }
    if(!opts.btns.length) footer.hide();
    bindModalEvent(modal, opts);
    if(typeof(modal.modal) == 'function'){
        modal.modal('show');
    }else{
        bootstrap.Modal.getOrCreateInstance(modal[0]).show();
    }
    return modal;
}