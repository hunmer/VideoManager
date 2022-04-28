var g_menu = {


	init: function(){
		this.registerMenu({
			name: 'clip_item',
			selector: '[data-action="loadClip"]',
            dataKey: 'data-clip',
			html: `
				<div class="list-group" style="width: 100%;">
                    <a data-action="clip_openFolder" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-folder mr-2"></i><span>定位</span>
                      </a>
                    <a data-action="clip_cut" class="list-group-item list-group-item-action text-secondary" aria-current="true">
					  	<i class="bi bi-scissors mr-2"></i><span>裁剪</span>
					  </a>

                     <a data-action="clip_cover" class="list-group-item list-group-item-action text-success" aria-current="true">
                        <i class="bi bi-scissors mr-2"></i><span>封面</span>
                      </a>

					  <a data-action="clip_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
					  	<i class="bi bi-trash mr-2"></i><span>删除</span>
					  </a>
					</div>
			`,
		});

        this.registerMenu({
            name: 'video_item',
            selector: '[data-action="loadVideo"]',
            dataKey: 'data-video',
            html: `
                <div class="list-group" style="width: 100%;">
                    <a data-action="video_openFolder" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-folder mr-2"></i><span>定位</span>
                      </a>
                    <a data-action="video_setFolder" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-inbox mr-2"></i><span>分类</span>
                      </a>
                     <a data-action="video_cover" class="list-group-item list-group-item-action text-success" aria-current="true">
                        <i class="bi bi-scissors mr-2"></i><span>封面</span>
                      </a>
                      <a data-action="video_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
        });

          this.registerMenu({
            name: 'folder_item',
            selector: '#sidebar-wrapper .accordion .card-header',
            dataKey: 'id',
            html: `
                <div class="list-group" style="width: 100%;">
                    <a data-action="folder_rename" class="list-group-item list-group-item-action text-primary" aria-current="true">
                        <i class="bi bi-folder mr-2"></i><span>重命名</span>
                     </a>
                 </div>
            `,
        });
	},

	hideMenu: function(key){
		$('#rm_'+key).hide();
	},

	registerMenu: function(opts){
		var id = 'rm_'+opts.name;
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
            g_menu.target = dom;
            var par = $('#'+id).attr('data-key', dom.attr(opts.dataKey)).show();
            var div = par.find('.menu');
            var i = div.width() / 2;
            var x = event.pageX;
            var mw = $(window).width();
            if (x + i > mw) {
                x = mw - div.width();
            } else {
                x -= i;
                if(x < 0) x = 0;
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