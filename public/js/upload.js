var g_upload = {
    types: {},
    doms: {},
    init: function() {
        this.dom_add('image', 'image/*');
        this.dom_add('files', '*', true);
    },
    dom_add: function(name, accept, multi = false){
        var self = this;
        this.doms[name] = $(`<input id="input_${name}" class='inputstyle' type="file" accept="${accept}" ${multi ? 'multiple="multiple"' : ''}>`).appendTo('body')
        .on('change', function(e) {
            var type = this.dataset.type;
            console.log(type);
            if (self.types[type]) self.types[type](e);
        })
    },
    dom_get: function(name){
        return this.doms[name];
    },
    type_set: function(name, type, show = false) {
        var dom = this.dom_get(name);
        if(!dom) return;
        dom.attr('data-type', type);
        if (show) {
            dom.click();
        }
    },
    type_register: function(type, callback) {
        this.types[type] = callback;
    },

    cropImage: function(src, opts, callback) {
        buildModal(`
          <img id="cropImage" class="w-full" src="${src}">
        `, {
            id: 'moal_cropImage',
            title: '裁剪图片',
            once: true,

            btns: [{
                id: 'ok',
                text: '保存',
                class: 'btn-primary',
            }, {
                id: 'reset',
                text: '重置',
                class: 'btn-secondary',
            }],
            onShow: modal => {
                loadRes([
                    { url: '../public/js/cropper.min.js', type: 'js' },
                    { url: '../public/css/cropper.min.css', type: 'css' },
                ], () => {
                    g_upload.cropper = new Cropper($('#cropImage')[0], Object.assign({
                        aspectRatio: 1 / 1,
                        viewMode: 3,
                    }, opts));
                })
            },
            onBtnClick: (config, btn) => {
                var par = $(btn).parents('.modal');
                if (btn.id == 'btn_ok') {
                    callback();
                } else
                if (btn.id == 'reset') {
                    g_upload.cropper.reset();
                    return false;
                }
                par.modal('hide');
            }
        }).find('.modal-body').addClass('p-0');
    }

}

g_upload.init();
g_upload.type_register('channel_image', function(e) {
    var input = e.target;
    var reader = new FileReader();
    for (var file of input.files) {
        reader.readAsDataURL(file);
        reader.onload = function(e) {
            g_chat.msg_send(e.target.result)
        }
    }
});
g_upload.type_register('profile_icon', function(e) {
    var input = e.target;
    var reader = new FileReader();
    reader.readAsDataURL(input.files[0]);
    reader.onload = function(e) {
        g_upload.cropImage(e.target.result, {}, () => {
            domSelector('profile_icon_upload').attr('src', g_upload.cropper.getCroppedCanvas({ width: 50, height: 50 }).toDataURL('image/webp'));
        });
        // domSelector('profile_icon_upload').attr('src', e.target.result);
    }
})

g_upload.type_register('friend_msg_file', function(e) {
    g_friends.msg_sendFiles(e.target.files);
 
});


// var _cropper;