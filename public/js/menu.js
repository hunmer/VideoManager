var g_menu = {
    buildItems: function(list){
        var h = '';
        for(var d of list){
            h += `
            <a data-action="${d.action}" class="list-group-item list-group-item-action ${d.class || ''}" aria-current="true">
                <i class="bi ${d.icon} mr-2 me-2"></i><span>${d.text}</span>
            </a>`
        }
        return '<div class="list-group p-0" style="width: 100%;">'+h+'</div>';
    },
    init: function() {
        
    },

    hideMenu: function(key) {
        $('#rm_' + key).hide();
    },
    unregisterMenu: function(name) {
        //todo
        delete g_menu.list[name];
    },
    list: {},
    registerMenu: function(opts) {
        g_menu.list[opts.name] = opts;
        var id = 'rm_' + opts.name;
        //background-color: rgba(0, 0, 0, .5);
        $(`
            <div id="${id}" style="position: fixed;top: 0; left: 0;width: 100%;height: 100%;z-index: 99999;display: none;" onclick="
            var child = $(this).find('.menu');
            if(event.target == this){
             var x = event.clientX;
            var y = event.clientY;
            var l = child.offset().left;
            var t = child.offset().top;
            if(!(x >= l && x <= l + child.width() && y >= t && y <= t + child.height())){
                this.style.display = 'none';
            }
        }
            " oncontextmenu="this.style.display = 'none'">
                <div class="menu bg-white row position-absolute border rounded w-auto" style="min-width: 150px;" >
                    ${opts.html}
                </div>
            </div>
        `).appendTo('body');

        registerContextMenu(opts.selector, (dom, event) => {
            g_menu.showMenu(opts.name, dom, event);
        });
    },

    getMenu: function(name) {
        return g_menu.list[name];
    },

    showMenu: function(name, dom, event) {
        var opts = g_menu.getMenu(name);
        var id = 'rm_' + opts.name;
        var key;

        g_menu.target = dom;
        if(typeof(opts.dataKey) == 'function'){
            key = opts.dataKey(dom)
        }else
        if(dom){
            key = dom.attr(opts.dataKey);
        }

        g_menu.key = key;
        if(opts.onShow){
            if(opts.onShow(key, dom) === false) return;
        }
        var par = $('#' + id).attr('data-key', key).show();
        var div = par.find('.menu');
        var i = div.width() / 2;
        var x = event.pageX;
        var mw = $(window).width();
        if (x + i > mw) {
            x = mw - div.width();
        } else {
            x -= i;
            if (x < 0) x = 0;
        }

        // var y = event.pageY + 20;
        var y = event.pageY;
        var h = div.height();
        var mh = $(window).height();
        if (mh - y < h) {
            y -= h;
        }

        div.css({
            left: x + 'px',
            top: y + 'px',
        });
    }

}

g_menu.init();
var g_down = {};

function registerContextMenu(selector, callback) {
    $('body')
        .on('touchstart', selector, function(event) {
            var dom = $(this);
            g_down.start = getNow();
            g_down.element = dom;
            g_down.task = setTimeout(function() {
                if (g_down.start > 0) {
                    g_down.holding = true;
                    event.originalEvent.preventDefault(true);
                    event.originalEvent.stopPropagation();
                    callback(g_down.element, event);
                }
                g_down.start = 0;
                g_down.task = -1;

            }, 1500);
        })
        .on('touchend', selector, function(event) {
            if (g_down.task != -1) {
                clearTimeout(g_down.task);
            }
            g_down.start = 0;
            if (g_down.holding) {
                event.originalEvent.preventDefault(true);
                event.originalEvent.stopPropagation();
            }
            g_down.holding = false;
        })
        .on('contextmenu', selector, function(event) {
            var dom = $(this);
            event.originalEvent.preventDefault(true);
            event.originalEvent.stopPropagation();
            g_down.element = dom;
            callback(g_down.element, event);
        });
}