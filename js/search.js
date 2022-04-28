/*
    tagName: [clip, clip]
*/


g_video.searchVideo = function(s) {
    var py = PinYinTranslate.start(s);
    var sz = PinYinTranslate.sz(s);
    var f;
    for (var d of domSelector({ action: "loadVideo", video: "" })) {
        d = $(d);
        var t = d.find('.card-title').text();
        var b = t.indexOf(s) != -1 || PinYinTranslate.start(t).indexOf(py) != -1 || PinYinTranslate.sz(t).indexOf(sz) != -1;
        d.toggleClass('hide', !b);
        if (b && !f) {
            if (s == '' && !d.hasClass('card_active')) continue; // 默认展示正在播放的视频
            var folder = $(d).parents('.card').data('folder');
            g_video.openFolder(folder);
            f = true;
        }
    }
}

g_video.searchClip = function(filters) {
    var r = {};
    if (!filters || filters.length == 0) {
        var today = new Date().setHours(0, 0, 0, 0);
        filters = ['time >= ' + today]; // 默认展示条件
    }
    for (var key in _videos) {
        var d = _videos[key];
        for (var time in d.clips) {
            var clip = d.clips[time];
            var b = true;
            for (var filter of filters) {
                b = eval(filter);
                if (!b) break;
            }
            if (b) {
                r[time] = Object.assign({
                    file: d.file,
                    key: key
                }, clip);
            }
        }
    }
    return r;
}

g_video.clearSearchClip = function(query) {
    $('#input_search_clip').val('');
    $('#search_result').html('');
    $('#selected_cnt').html('0');

}


g_video.onSearchClip = function() {
    var h = '';
    var a = [];
    for (var d of $('[data-filter]')) {
        a.push(unescapeHTML(d.dataset.filter));
    }
    var r = this.searchClip(a);
    g_cache.searchedClip = r;
    for (var time in r) {
        var d = r[time];
        var n = getFileName(d.file);
        h += `
            <div class="card search_item" data-action="card_selected" data-key="${time}"  data-file="%path%/cuts/${time}.mp4" draggable="true">
              <img draggable="false" src="./res/loading.gif" data-src="./cover/${time}.jpg" class="card-img-top lazyload" data-preview data-pos='bottom'>
                <div class="card-body">
                  <b class="card-title d-inline-block text-truncate" style="max-width: -webkit-fill-available;" title="${n}">${n}</b>
                  <p class="card-text">${d.tags.join(',')}</p>
                </div>
              </div>

        `;
    }
    $('#search_result').html(h).find('.lazyload').lazyload();
}

// 
g_video.filter_init = function() {
    var h = '';
    for (var filter of g_cache.filters) {
        h += `<a class="badge badge-primary mr-2 badge_filter" onclick="g_video.filter_remove(this)" data-filter="${filter.content}" data-type="${filter.type}">${filter.text}</a>`
    }
    if (h == '') h = `<h6 class="text-center">右上角添加搜索条件</h6>`
    $('#search_fliters').html(h);
    g_video.onSearchClip();
}
g_video.filter_get = function(type) {
    return domSelector({ type: type }, '.badge_filter');
}
g_video.filter_add = function(text, content, type) {
    if (g_cache.filters.some((d) => d.content == content)) {
        return alert('已存在!');
    }
    g_cache.filters.push({ text: text, content: content, type: type });
    g_video.filter_init();
}

g_video.filter_remove = function(dom) {
    var i = g_cache.filters.findIndex((d) => {
        return d.content == dom.dataset.filter
    });
    if (i != -1) {
        g_cache.filters.splice(i, 1);
        g_video.filter_init();
    }
    dom.remove();
}

g_video.modal_tag = function(selected, callback) {
    var h = `
    <div class="input-group mb-3">
      <div class="input-group-prepend">
        <span class="input-group-text">搜索</span>
      </div>
      <input type="text" class="form-control" placeholder="搜索标签(支持【首字/全拼】拼音" aria-label="" id="input_searchTag">
    </div>

    <ul class="list-group">`;
    for (var tag in g_video.tags.all) {
        h += `
                <li onclick="this.classList.toggle('active')" class="list-group-item d-flex justify-content-between align-items-center${selected.includes(tag) ? ' active' : ''}"  data-value="${tag}">
                    ${tag}
                    <span class="badge badge-warning badge-pill">${g_video.tags.all[tag]}</span>
                  </li>
                `;
    }
    h += '</ul>';
    confirm(h, {
        title: '选择标签',
        callback: (id) => {
            if (id == 'ok') {
                var tags = [];
                for (var d of $('#modal_confirm .list-group-item.active')) {
                    tags.push(d.dataset.value);
                }
                callback(tags);
            }
            return true;
        },
        onShow: () => {
            $('#input_searchTag').on('input', function(e) {
                var s = this.value;
                var py = PinYinTranslate.start(s);
                var sz = PinYinTranslate.sz(s);
                for (var d of $('#modal_confirm .list-group-item')) {
                    var t = d.dataset.value;
                    var b = t.indexOf(s) != -1 || PinYinTranslate.start(t).indexOf(py) != -1 || PinYinTranslate.sz(t).indexOf(sz) != -1;
                    $(d).removeClass('active').toggleClass('hide', !b);
                }
            }).focus();
        }
    });
}

g_video.modal_folder = function(selected, callback) {
    var h = `
    <div class="input-group mb-3">
      <div class="input-group-prepend">
        <span class="input-group-text">搜索</span>
      </div>
      <input type="text" class="form-control" placeholder="搜索目录(支持【首字/全拼】拼音" aria-label="" value="${selected}" id="input_searchFolder">
    </div>

    <ul class="list-group">`;
    var list = g_video.getFolders();
    for (var folder in list) {
        h += `
                <li data-action="singleSelect,#modal_folders li,active" class="list-group-item d-flex justify-content-between align-items-center${selected == folder ? ' active' : ''}"  data-value="${folder}">
                    ${folder}
                    <span class="badge badge-warning badge-pill">${Object.keys(list[folder]).length}</span>
                  </li>
                `;
    }
    h += '</ul>';
    confirm(h, {
        title: '选择目录',
        id: 'modal_folders',
        callback: (id) => {
            if (id == 'ok') {
                var tags = [];
                var selected = $('#modal_folders .list-group-item.active');
                if(!selected.length){
                    var s = $('#modal_folders input').val();
                    if(s == '') return false;
                    tags.push(s)
                }else{
                    for (var d of selected) {
                        tags.push(d.dataset.value);
                    }
                }
                callback(tags);
            }
            return true;
        },
        onShow: () => {
            $('#input_searchFolder').on('input', function(e) {
                var s = this.value;
                var py = PinYinTranslate.start(s);
                var sz = PinYinTranslate.sz(s);
                for (var d of $('#modal_folders .list-group-item')) {
                    var t = d.dataset.value;
                    var b = t.indexOf(s) != -1 || PinYinTranslate.start(t).indexOf(py) != -1 || PinYinTranslate.sz(t).indexOf(sz) != -1;
                    $(d).removeClass('active').toggleClass('hide', !b);
                }
            }).focus();
        }
    });
}

g_video.modal_size = function(callback) {
    var h = `
            <div class="row">
                <div class="form-group col-md-6">
                  <label for="input_width">宽度</label>
                    <div class="btn-group btn-group-sm mb-2 float-right" role="group" id="btnGroup_width">
                          <button type="button" class="btn" data-action="btnGroup_select">>=</button>
                          <button type="button" class="btn btn-primary" data-action="btnGroup_select">=</button>
                          <button type="button" class="btn" data-action="btnGroup_select"><=</button>
                        </div>
                      <input type="number" class="form-control" id="input_width">
                </div>
                <div class="form-group col-md-6">
                  <label for="input_height">高度</label>
                    <div class="btn-group btn-group-sm mb-2 float-right" role="group" id="btnGroup_height">
                          <button type="button" class="btn" data-action="btnGroup_select">>=</button>
                          <button type="button" class="btn btn-primary" data-action="btnGroup_select">=</button>
                          <button type="button" class="btn" data-action="btnGroup_select"><=</button>
                        </div>
                      <input type="number" class="form-control" id="input_height">
                    </div>
                </div>
              </div>
            `;
    for (var item of ['480x320', '1280x720', '1920x1080']) {
        var id = 'option_' + item;
        var a = item.split('x');
        h += `<div class="form-check">
                  <input onchange="$('#input_width').val(${a[0]});$('#input_height').val(${a[1]});" class="form-check-input" type="radio" id="${id}" value="option1">
                  <label class="form-check-label" for="${id}">
                    ${item}
                  </label>
                </div>`
    }
    h += '';
    confirm(h, {
        title: '选择分辨率',
        callback: (id) => {
            if (id == 'ok') {
                var opt = {
                    w: $('#input_width').val(),
                    w1: $('#btnGroup_width .btn-primary').html(),
                    h: $('#input_height').val(),
                    h1: $('#btnGroup_height .btn-primary').html(),
                }
                g_config.lastSize = opt;
                local_saveJson('config', g_config);
                callback(opt);
            }
            return true;
        },
        onShow: () => {
            var opt = g_config.lastSize;
            if (opt) {
                $('#input_width').val(opt['w']);
                $('#input_height').val(opt['h']);
                $(`#btnGroup_width button:contains('${unescapeHTML(opt['w1'])}')`).click();
                $(`#btnGroup_height button:contains('${unescapeHTML(opt['h1'])}')`).click();
            }
        }
    });

}


g_video.modal_time = function(callback) {
    var h = `
        <div class="form-group">
            <div class="input-group date" id="datetimepicker4" data-target-input="nearest">
             <div class="input-group-prepend">
                <select class="form-control" id="select_filter_time" onchange="return;
                if(this.value == '多选' || g_cache.isDatePickerMulti) initDatePicker();
                ">
                          <option>等于</option>
                          <option>之前</option>
                          <option>之后</option>
                 </select>
                </div>
                <input type="text" id="input_time_filter" class="form-control datetimepicker-input" data-target="#datetimepicker4"/>
                <div class="input-group-append" data-target="#datetimepicker4" data-toggle="datetimepicker">
                    <div class="input-group-text"><i class="bi bi-calendar"></i></div>
                </div>
            </div>
        </div>
    `;
    confirm(h, {
        title: '选择时间',
        callback: (id) => {
            if (id == 'ok') {
                if ($('#input_time_filter').val() == '') return false;
                callback({
                    date: $('#datetimepicker4').datetimepicker('viewDate')._d,
                    symbol: (() => {
                        switch ($('#select_filter_time').val()) {
                            case '等于':
                                return '=';

                            case '之前':
                                return '<=';

                            case '之后':
                                return '>=';
                        }
                    })()
                });
            }
            return true;
        },
        onShow: () => {
            initDatePicker();
        }
    });
}

function initDatePicker() {
    //const isMulti = $('#select_filter_time').val() == '多选';
    // g_cache.isDatePickerMulti = isMulti;
    var picker = $('#datetimepicker4');
    picker.on('change.datetimepicker', e => {
            // if(!g_cache.isDatePickerMulti) $(this).datetimepicker('hide')
        })
        .datetimepicker({
            locale: 'zh-cn',
            // format: 'yyyy/MM/DD',
            // allowMultidate: isMulti,
            format: 'L', // 只选择日期会自动关闭窗口
        });
}