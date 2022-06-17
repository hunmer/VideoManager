

function doCallback(fn,args){ 
    return fn.apply(this, args);  
}    

function _d(s){
    console.log(s);
    return s;
}

function arrayJoin(arr, end, start){
    var r = '';
    arr.every((s, i) => {
        r += start + s;
        if(i != arr.length - 1){
            r += end;
        }
        return true;
    })
    return r;
}

var MODAL_HTML = (id, opts) => {
    opts = Object.assign({
        autoDestroy: false,
        title: '',
        html: '',
    }, opts);
    return `<div class="modal fade" id="${id}" tabindex="-1" aria-labelledby="modal_${id}_lable" aria-hidden="true"${opts.autoDestroy ? ' data-destroy=1' : ''}>
        <div class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modal_${id}_lable">${opts.title}</h5>
                   <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">${opts.html}</div>
                <div class="modal-footer">
                </div>
            </div>
        </div>
    </div>
 `
}

function onSetConfig(k, v){
    console.log(v);
    switch(k){
        case 'gridCol':
            removeClass($('.media-item'), 'col-').addClass( 'col-'+([1, 2, 3, 4, 6, 12][v]));
            break;
    }
}

function removeClass(dom, list){
    if(!Array.isArray(list)) list = [list];
    for(var className of dom.attr('class').split(' ')){
        for(var s of list){
            if(className.startsWith(s)) dom.removeClass(className);
        }
    }
    return dom;
}

function hidePreview(){
    if(g_cache.previewClip) clearTimeout(g_cache.previewClip);
    if(g_cache.previewing) delete g_cache.previewing;
    $('#previewVideo').remove();
}


function toast(msg, style = 'bg-info', time = 3000) {
     triggerEvent('onToastMessage', {
        msg: msg,
        id: new Date().getTime(),
        style: style,
        time: time,
     }, data => {
      g_toast.show(data.id, {
            text: data.msg,
            class: data.style,
            delay: data.time
        });
     });
}

function isScroll(el) {
     // test targets
     var elems = el ? [el] : [document.documentElement, document.body];
     var scrollX = false, scrollY = false;
     for (var i = 0; i < elems.length; i++) {
         var o = elems[i];
         // test horizontal
         var sl = o.scrollLeft;
         o.scrollLeft += (sl > 0) ? -1 : 1;
         o.scrollLeft !== sl && (scrollX = scrollX || true);
         o.scrollLeft = sl;
         // test vertical
         var st = o.scrollTop;
         o.scrollTop += (st > 0) ? -1 : 1;
         o.scrollTop !== st && (scrollY = scrollY || true);
         o.scrollTop = st;
     }
     // ret
     return {
         scrollX: scrollX,
         scrollY: scrollY
     };
 }
