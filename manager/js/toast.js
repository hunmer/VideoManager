var g_toast = {
    init: function() {

    },

    show: function(id, opts) {
        id = 'toast_' + id;
        icon = opts.icon;
        opts = Object.assign({
            icon: 'favicon.ico',
            title: '提示',
            class: '',
            small: '',
            allowClose: true,
            text: '',
            animation: true,
            autohide: true,
            delay: 5000
        }, opts || {});

        $(icon ? `
			<div class="position-fixed p-3" style="z-index: 999999;width: 200px;top: 50px;right: 10px;">
			    <div id="${id}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
			      <div class="toast-header bg-dark text-light">
			        <img src="${opts.icon}" class="rounded me-2" style="width: 15px;height: 15px;">
			        <strong class="me-auto">${opts.title}</strong>
			        <small>${opts.small}</small>
			        ${opts.allowClose ? `<button type="button" class="btn-close bg-light" data-bs-dismiss="toast" aria-label="Close"></button>` : ''}
			      </div>
			      <div class="toast-body border">
			        ${opts.text}
			      </div>
			    </div>
			  </div>
		` : `
        <div class="toast position-fixed mt-2 me-2 align-items-center w-auto text-white ${opts.class} border-0" id="${id}" role="alert" aria-live="assertive" aria-atomic="true" style="z-index: 999999;top: 50px;right: 10px;">
              <div class="d-flex">
                <div class="toast-body">
                 ${opts.text}
                </div>
                ${opts.allowClose ? `<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>` : ''}
              </div>
            </div>

        `).prependTo('body')
            .on('shown.bs.toast', function(e) {
                //soundTip();
            })
            .on('hidden.bs.toast', function(e) {
                this.remove();
            });
        new bootstrap.Toast(document.querySelector('#' + id), opts).show();
    },

}

g_toast.init();
// $(function() {
//     g_toast.show('test', {
//         text: '123',
//         class: 'bg-success',
//         delay: 2000000
//     });
// });