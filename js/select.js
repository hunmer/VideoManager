var g_select = {
    list: {},
    init: function() {
        $(`<div id="selectDiv" style="position:absolute;width:0px;height:0px;font-size:0px;margin:0px;padding:0px;border:1px dashed #0099FF;background-color:#C3D5ED;z-index:999999;filter:alpha(opacity:60);opacity:0.6;display:none;">`).appendTo('body');
    },
    register: function(selector, opts) {
        var self = this;
        self.list[selector] = opts;
        
        var isSelect = false;
        var selList = [];
        var startX, startY, selectDiv, _x, _y;
        var active = opts.activeClass;
        $(document)
        // .on('click', opts.childrens, function(evt) {
        //   if(evt.ctrlKey){
        //     $(evt.currentTarget).toggleClass(active);
        //     clearEventBubble(evt);
        //   }
        // })
        .on('mousedown', function(evt) {
                var evt = evt.originalEvent;
                 if(evt.ctrlKey || !evt.altKey) return;
                var target = $(evt.target);
                for (var s in self.list) {
                    for (var p of evt.path) {
                        if (p.id != '' && p.id == s) {
                            var d = self.list[s];
                            isSelect = s;
                            selList = $(p).find(d.childrens);
                            startX = (evt.x || evt.clientX);
                            startY = (evt.y || evt.clientY);
                            selectDiv = $('#selectDiv').css({
                                left: startX + 'px',
                                top: startY + 'px',
                                display: 'unset'
                            })[0];
                            _x = null;
                            _y = null;
                            //clearEventBubble(evt);
                        }
                    }
                }
            }).on('mousemove', function(evt) {
                if (!isSelect) return;
                _x = (evt.x || evt.clientX);
                _y = (evt.y || evt.clientY);
                var opts = self.list[isSelect];
                var par = opts.scrollEl;
                if(_y <= opts.top){
                    par.scrollBy(0, -10)
                }else
                if(_y >= opts.bottom){
                    par.scrollBy(0, 10)
                }
                var selDiv = $('#selectDiv').css({
                    left: Math.min(_x, startX) + "px",
                    top: Math.min(_y, startY) + "px",
                    width: Math.abs(_x - startX) + "px",
                    height: Math.abs(_y - startY) + "px",
                })[0];
                var _l = selDiv.offsetLeft,
                    _t = selDiv.offsetTop;
                var _w = selDiv.offsetWidth,
                    _h = selDiv.offsetHeight;
                for (var i = 0; i < selList.length; i++) {
                  var child = $(selList[i]);
                  var left = child.offset().left;
                  var top = child.offset().top;
                  var width = child.width();
                  var height = child.width();
                    var sl = width + left;
                    var st = height + top;
                    var inArea = sl > _l && st > _t && left < _l + _w && top < _t + _h;
                    child.toggleClass(active, inArea);
                }
                clearEventBubble(evt)
            })
            .on('mouseup', function(evt) {
                if (!isSelect) return;
                var opts = self.list[isSelect];
                isSelect = false;
                $('#selectDiv').css({
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                    display: 'none'
                })[0];

                var count = 0;
                var selected = [];
                for (var i = 0; i < selList.length; i++) {
                    if (selList[i].className.indexOf("seled") != -1) {
                        count++;
                        selected.push(selList[i]);
                    }
                }
                //  && opts.onSelect
                if (count > 0) {
                    //console.log(selected);
                }
                opts.onEnd && opts.onEnd();
                selList = null,
                    _x = null,
                    _y = null,
                    selDiv = null,
                    startX = null,
                    startY = null,
                    evt = null
            });
    }
}

g_select.init();
// g_select.register('content', {
//     childrens: '.fileDiv',
// })

