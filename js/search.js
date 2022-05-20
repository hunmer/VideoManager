g_cache.hideAdded = false;

(() => {
    const getCards = () => $('[data-action="card_active"]')
    const getSelected = () => $('[data-action="card_active"].card_active');
    const updateBadge = () => {
        var cnt = getSelected().length;
        $('#selected_cnt').html(cnt);
        $('[data-action="collection_add"]').toggleClass('disabled', cnt == 0);
    }

    registerAction('filter_addFolder', (dom, action) => {
        if (g_filter.filter_get('local', 'folder').length) {
            return toast('目录过滤器已经存在!', 'alert-danger');
        }
        g_video.modal_folder('', folder => {
            g_filter.filter_add('local', '目录: ' + folder[0], (folder[0] == '未分组' ? `d.folder == undefined || d.folder == ''` : `d.folder == '${folder[0]}'`), 'folder');
        });
    });

    registerAction('filter_currentVideo', (dom, action) => {
        if (g_filter.filter_get('local', 'currentVideo').length) {
            return toast('此过滤器已经存在!', 'alert-danger');
        }
        var key = g_video.key;
        if (!key) {
            return toast('当前没有播放视频!', 'alert-danger');
        }
        g_filter.filter_add('local', '当前视频: ' + getFileName(g_video.key.file, true), `key == '${key}'`, 'currentVideo');
    });
    registerAction('filter_addTag', (dom, action) => {
        g_video.modal_tag(g_cache.searchTags, tags => {
            for (var tag of tags) {
                g_filter.filter_add('local', '标签: ' + tag, `clip.tags.includes('${tag}')`, 'tag');
            }
        });
    });
    registerAction('filter_addNote', (dom, action) => {
        prompt('', {
            title: '输入要包含的备注',
            callback: text => {
                g_filter.filter_add('local', '备注: ' + text, `typeof(clip.note) == 'string' && clip.note.indexOf('${text}') != -1`, 'note');
            }
        })
    });
    registerAction('filter_addTime', (dom, action) => {
        g_video.modal_time(res => {
            var t = res.date.getTime();
            g_filter.filter_add('local', `创建日期: ${res.symbol}${res.date.format('yyyy/MM/dd'), 'date'}`, `time ${res.symbol} ${t}`);
        });
    });

    registerAction('filter_addSize', (dom, action) => {
        g_video.modal_size(res => {
            var w1 = unescapeHTML(res.w1);
            var h1 = unescapeHTML(res.h1);
            g_filter.filter_add('local', `尺寸: 宽 ${w1} ${res.w} & 高 ${h1} ${res.h}`, `d.meta && d.meta.width ${w1} ${res.w} && d.meta.height ${h1} ${res.h}`, 'size');
        });
    });
    registerAction('filter_reset', (dom, action) => {
        g_filter.filter_reset('local');
        updateBadge();
    });

    registerAction('view_fullSearch', (dom, action) => {
        //var fulled = g_style.hasStyle('modal');
        fullModal($('#modal_search'), true, () => {
            ipc_send('setBounds'); // 不带参数还原
            ipc_send('pin', false);
            domSelector('view_fullSearch').show();
        });
        ipc_send('setBounds', { width: 400, height: 800 });
        ipc_send('pin', true);
        toast('窗口已置顶,按Esc可退出.', 'alert-warning');
        $(dom).hide();
        //$(dom).attr('class', 'ml-2 bi bi-box-arrow-' + (fulled ? 'in-down-left' : 'up-right'));
    });

    registerAction('card_active', (dom, action) => {
        $(dom).toggleClass('card_active');
        updateBadge();
    });

    registerAction('search_selectAll', (dom, action) => {
        var cards = $('[data-action="card_active"]');
        var hasSelected = Array.from(cards).some(d => d.classList.contains('card_active'));
        for (var card of cards) {
            if (hasSelected) {
                card.classList.remove('card_active')
            } else {
                card.classList.add('card_active')
            }
        }
        updateBadge();
    });
    registerAction('collection_add', (dom, action) => {
        var a = getSelected();
        for (var d of a) {
            var key = d.dataset.key;
            g_list.addToList('clips', key, $(d).find('.card-text').html());
        }
        toast('成功添加了 ' + a.length + ' 个视频', 'alert-success');
        a.remove();
        updateBadge();
    });
    registerAction('modal_search', (dom, action) => {
        g_player.playVideo(false);

        if (!g_video.search_modal) {
            g_filter.filter_add('local', '今日新增', 'time >= ' + new Date().setHours(0, 0, 0, 0), 'default');
            g_video.search_modal = buildModal(`
        <div class="card mb-2">
            <div class="card-header">
                <button class="btn btn-outline-secondary dropdown-toggle float-right" type="button" data-toggle="dropdown" aria-expanded="false">过滤</button>
                <div class="dropdown-menu">
                    <a class="dropdown-item" data-action="filter_currentVideo">当前视频</a>
                    <a class="dropdown-item" data-action="filter_addTag">标签</a>
                    <a class="dropdown-item" data-action="filter_addFolder">目录</a>
                    <a class="dropdown-item" data-action="filter_addSize">尺寸</a>
                    <a class="dropdown-item" data-action="filter_addNote">备注</a>
                    <a class="dropdown-item" data-action="filter_addTime">时间</a>
                    <div role="separator" class="dropdown-divider"></div>
                    <a class="dropdown-item" data-action="filter_reset">重置</a>
                </div>
            </div>
            <div class="card-body " id="search_fliters">
            </div>
        </div>
        <div class="container-fluid"  style="min-height: 300px;">
            <div class="row" id="search_result">
            </div>
        </div>
    `, {
                id: 'modal_search',
                title: `搜索片段
                <i tabindex="0" title="搜索视图" class="ml-2 bi bi-grid-1x2" data-toggle="popover" data-placement="bottom" data-content="">
                </i>
                <i data-action="view_fullSearch" class="ml-2 bi bi-box-arrow-up-right"></i>`,
                width: '80%',
                footer: `
                 <b id="skipAdded_text" class="mr-2"></b>
                    <div class="custom-control custom-checkbox mr-2">
                      <input type="checkbox" class="custom-control-input" id="search_hideAdded"${ g_cache.hideAdded ? ' checked' : ''}>
                      <label class="custom-control-label" for="search_hideAdded">不显示已添加</label>
                    </div>
                    <button type="button" class="btn btn-secondary" data-action="search_selectAll">全选/全不选</button>
                    <button type="button" class="btn btn-primary disabled" data-action="collection_add"><span class="badge badge-success mr-2" id="selected_cnt">0</span>添加到列表</button>
            `,
                btns: [],
            });
            bindModalEvent($('#modal_search'), {
                onShow: modal => {
                    g_player.tryStop();
                    g_select.register('modal_search', {
                        childrens: '.search_item',
                        activeClass: 'card_active',
                        onEnd: () => updateBadge(),
                        top: $('#modal_search').position().top,
                        bottom: $('#modal_search .modal-footer').position().top,
                        scrollEl: $('#modal_search .modal-body')[0],
                    });
                },
                onClose: modal => {
                    g_player.tryStart()
                },
            });
        }
        $('#modal_search').modal('show');
        g_filter.filter_init('local');
    });

    $('#search_hideAdded').on('change', function(e) {
        g_cache.hideAdded = this.checked;
        var cnt = 0;
        for (var card of getCards()) {
            var exists = g_list.isInList('clips', card.dataset.key);
            if (exists) {
                if (this.checked) {
                    card.classList.add('hide');
                    cnt++;
                } else {
                    card.classList.remove('hide');
                }
            }
        }
        $('#skipAdded_text').html(cnt ? `${cnt}个结果已被隐藏` : '');
    });

})();

g_video.searchVideo = function(s) {
    var py = PinYinTranslate.start(s);
    var sz = PinYinTranslate.sz(s);
    var h = ``;
    var i = 0;
    for (var md5 in _videos) {
        var t = getFileName(_videos[md5].file, true);
        var b = t.indexOf(s) != -1 || PinYinTranslate.start(t).indexOf(py) != -1 || PinYinTranslate.sz(t).indexOf(sz) != -1;
        if (b) {
            h += `<li data-action="search_result_item" data-video="${md5}" class="list-group-item${md5 == g_video.key ? ' active' : ''}">${t}</li>`;
            i++;
        }
    }
    if (!i) {
        h = `<h6 class="text-center mt-10">没有结果</h6>`;
    } else {
        h = `<ul class="list-group" >${h}</ul>`;
    }
    var searching = s != '';
    $('#searchResults').html(h).toggleClass('hide', !searching);
    $('#videoList').toggleClass('hide', searching);
}

g_video.searchClip = function(filters) {
    var r = {};
    if (filters && filters.length) {
        for (var key in _videos) {
            var d = _videos[key];
            for (var time in d.clips) {
                var clip = d.clips[time];
                var b = true;
                for (var filter of filters) {
                    b = eval(filter.content);
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
    }
    return r;
}

g_video.onSearchClip = function() {
    var h = ``;
    var skip = 0;
    var r = this.searchClip(g_filter.filter_list('local'));
    for (var time in r) {
        var classes = '';
        if (g_cache.hideAdded && g_list.isInList('clips', time)) {
            skip++;
            classes = 'hide';
        }
        var d = r[time];
        var n = getFileName(d.file);
        h += `
            <div class="card col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 mb-10 search_item ${classes}" data-action="card_active" data-key="${time}"  data-file="*path*/cuts/${time}.mp4" draggable="true">
              <img draggable="false" src="./res/loading.gif" data-src="./cover/${time}.jpg" class="card-img-top lazyload" data-preview data-pos='right-bottom' data-time="1000">
                <div class="card-body">
                   <h6 class="card-title scrollableText">${d.tags.join(' , ')}</h6>
                   <h6 class="card-title scrollableText"><small>${d.note || ''}</small>
                  </h6>
                </div>
              </div>

        `;
    }
    $('#search_result').html(h).find('.lazyload').lazyload();
    $('#skipAdded_text').html(skip ? `${skip}个结果已被隐藏` : '');
}

g_video.modal_tag = function(selected, callback) {
    modal_listSelector({
        title: '选择标签',
        source: g_tag.all,
        selected: selected,
        callback: tags => callback(tags)
    });

   
}

function modal_listSelector(opts){
    var h = `
    <div class="input-group mb-3">
      <div class="input-group-prepend">
        <span class="input-group-text">搜索</span>
      </div>
      <input type="text" class="form-control" placeholder="搜索(支持【首字/全拼】拼音" aria-label="" id="input_searchTag">
    </div>

    <ul class="list-group">`;
    for (var tag in opts.source) {
        h += `
            <li onclick="this.classList.toggle('active')" class="list-group-item d-flex justify-content-between align-items-center${opts.selected.includes(tag) ? ' active' : ''}"  data-value="${tag}">
                ${tag}
                <span class="badge badge-warning badge-pill">${opts.source[tag]}</span>
              </li>
            `;
    }
    h += '</ul>';
    confirm(h, {
        id: 'modal_tags',
        title: opts.title,
        callback: (id) => {
            if (id == 'ok') {
                var tags = [];
                for (var d of $('#modal_tags .list-group-item.active')) {
                    tags.push(d.dataset.value);
                }
                var s = $('#modal_tags input').val();
                if (s != '') tags.push(s);
                opts.callback(tags);
            }
            return true;
        },
        onShow: () => {
            $('#input_searchTag').on('input', function(e) {
                var s = this.value;
                var py = PinYinTranslate.start(s);
                var sz = PinYinTranslate.sz(s);
                for (var d of $('#modal_tags .list-group-item')) {
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
                if (!selected.length) {
                    var s = $('#modal_folders input').val();
                    if (s == '') return false;
                    tags.push(s)
                } else {
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
        <div class="form-group" style="min-height: 300px;">
            <div class="input-group">
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
            </div>
            <div id="datetimepicker4">
            </div>
        </div>
    `;
    confirm(h, {
        title: '选择时间',
        callback: (id) => {
            if (id == 'ok') {
                var date = new Date($('#input_time_filter').val());
                if (isNaN(date.getTime())) {
                    toast('错误的时间!', 'alert-danger');
                    return false;
                }
                callback({
                    date: date,
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
            $('#input_time_filter').val(e.date._d.format('yyyy/MM/dd hh:mm:ss'));
        })
        .datetimepicker({
            locale: 'zh-cn',
            inline: true,
            // format: 'yyyy/MM/DD',
            // allowMultidate: isMulti,
            // format: 'L', // 只选择日期会自动关闭窗口
        });
}