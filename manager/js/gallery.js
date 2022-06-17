var g_gallery = {
    init: function() {
        registerAction('change_desc', (dom, action) => {
             g_data.setData(g_cache.currentMd5, {desc: dom.value})
        });
    	 g_menu.registerMenu({
            name: 'media-item',
            selector: '.media-item',
            dataKey: 'data-id',
            html: `
                <div class="list-group list-group-flush p-0" style="width: 100%;">
                    <a data-action="hotkey_item_edit" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-pencil me-2"></i><span>编辑</span>
                      </a>
                      <a data-action="hotkey_item_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash me-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
        });
        registerAction('unsetAll', (dom, action, event) => {
        	 $('.video_item_active').removeClass('video_item_active');
        	 $('#detail').html('');
        });
        registerAction('video_item_click', (dom, action, event) => {
            dom = $(dom);
            if (!event.ctrlKey){
            	$('.video_item_active').removeClass('video_item_active');
            	dom.addClass('video_item_active');
            }else{
            	dom.toggleClass('video_item_active');
           	}
            g_gallery.loadVideoDetail(dom.attr('data-id'));
        });
        registerAction('fullPreview', (dom, action) => {
        	return;
            var file = dom.dataset.file;
            if (!file.startsWith('http')) {
                file = 'file://' + file;
            }
            var d = $(`
			 <div id="fullPreview" class="p-4 w-max h-max d-flex flex-wrap" style="z-index: 10;position: fixed;top: 0;left: 0;background-color: rgba(0, 0, 0, .7);">
		        <div id="player" class="w-full"></div>
		    </div>
				`).appendTo('body');
            g_player = new DPlayer({
                autoplay: true,
                container: $('#player')[0],
                volume: 1,
                video: {
                    url: file,
                    // pic: 'demo.jpg',
                    // thumbnails: 'thumbnails.jpg',
                },
                screenshot: true,
                contextmenu: [{
                    text: '关闭文件',
                    click: player => {

                    },
                }, ],
            });

            g_player.on('loadeddata', function(e) {

            })
            g_player.on('timeupdate', function(e) {
                $('#video_range').val(this.currentTime / this.duration * 100);
            })
            g_player.on('play', function(e) {})
            g_player.on('pause', function(e) {});
        });
    },

    loadVideoDetail: function(id) {
        g_cache.currentMd5 = id;
        var d = g_data.getVideo(id);
        d.tags = d.tags.split(',').filter(s => s != '');
        var h = ``;
        var items = $('.video_item_active');
        if (items.length > 1) {
            h += `
			<ul class="list-unstyled ps-0">
				<li class="mb-1">
                    <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed" data-bs-toggle="collapse" data-bs-target="#selcted-collapse" aria-expanded="true">
                        选中文件(${items.length})
                    </button>
                    <div class="collapse show" id="selcted-collapse">
                    ${(() => {
                    	var r = '';
                    	for(var item of items){
                    		r += `<li>${item.dataset.id}</li>`;
                    	}
                    	return r;
                    })()}
                    </div>
                </li>
             </ul>
             <div class="text-end">
	             <button class="btn btn-secondary" data-action="unsetAll">取消</button>
	             <button class="btn btn-primary" data-action="importMedia">导出</button>
	          </div>
             `;
        } else {
            h += `
			<ul class="list-unstyled ps-0">
				<li class="mb-1">
                    <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed" data-bs-toggle="collapse" data-bs-target="#desc-collapse" aria-expanded="true">
                        备注
                    </button>
                    <div class="collapse show" id="desc-collapse">
                        <textarea class="form-control" rows="3" placeholder="输入备注..." data-change="change_desc">${d.desc}</textarea>
                    </div>
                </li>

                <li class="mb-1">
                    <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed" data-bs-toggle="collapse" data-bs-target="#tags-collapse" aria-expanded="true">
                        标签<span class="ms-2 badge bg-danger">${d.tags.length}</span>
                    </button>
                    <div class="collapse show" id="tags-collapse">
                        <div class="card">
                            <div class="card-body">
                                <div class="btn-group dropstart">
                                   <a data-bs-offset="0,20" data-bs-toggle="dropdown" class="badge bg-secondary me-2"><i class="bi bi-plus"></i></a>
                                  <div class="dropdown-menu p-3">
                                    ${g_tags.getTagsHtml()}
                                  </div>
                                </div>
                                <div id="tags"></div>
                            </div>
                        </div>
                    </div>
                </li>

                <li class="mb-1">
                    <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed" data-bs-toggle="collapse" data-bs-target="#info-collapse" aria-expanded="true">
                        信息
                    </button>
                    <div class="collapse show" id="info-collapse">
                        <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                            <li>评分: </li>
                            <li>尺寸: </li>
                            <li>大小: </li>
                            <li>创建日期: </li>
                            <li>来源: </li>
                        </ul>
                    </div>
                </li>
              </ul>

			`
        }
        $('#detail').html(h);
        g_tags.setTags(d.tags);
    },

}

g_gallery.init();