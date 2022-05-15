var g_list = {
	list: {
		videos: {
			// a: 'ddd',
			// b: 'www',
		},
		clips: {
			// a: './cover/93e4e84d99f3b19ca0666531c888c06d.jpg',
			// b: './cover/2272d9f860baafc87a04bd93da86f625.jpg',
		},
	},
	init: function(){
		var self = this;
		var modal = $(`<div class="modal fade" id="modal_list" tabindex="-1" aria-labelledby="modal_listLable" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modal_listLable">列表</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                     <ul class="nav nav-tabs" id="_list_tab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <a class="nav-link active" id="_videolist-tab" data-toggle="tab" href="#_videolist" role="tab" aria-controls="_videolist" aria-selected="true">视频<span class="badge badge-primary ml-1">0</span></a>
                        </li>
                        <li class="nav-item" role="presentation">
                            <a class="nav-link" id="_cliplist-tab" data-toggle="tab" href="#_cliplist" role="tab" aria-controls="_cliplist" aria-selected="false">片段<span class="badge badge-primary ml-1">0</span></a>
                        </li>
                    </ul>
                    <div class="tab-content" id="myTabContent">
                        <div class="tab-pane fade show active p-2" id="_videolist" role="tabpanel" aria-labelledby="_videolist-tab">
                            <ul class="list-group" >
                            </ul>

                        </div>
                        <div class="tab-pane fade p-2" id="_cliplist" role="tabpanel" aria-labelledby="_cliplist-tab">
                            <div class="row">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                	<div class="ts _videolist_show hide">
                		<button type="button" class="btn btn-primary" data-action="collection_toSRT">批量字幕</button>
                	</div>

                	<div class="ts _cliplist_show hide">
                		<button type="button" class="btn btn-primary" data-action="collection_zip">另存压缩包</button>
                	</div>

                    <button type="button" class="btn btn-danger" data-action="collection_clear">全部清空</button>
                </div>
            </div>
        </div>
    </div>`).appendTo('body');

		modal.find('a[data-toggle="tab"]').on('shown.bs.tab', function (event) {
		  var classes = event.target.id.replace('-tab', '_show');
		  for(var d of modal.find('.ts')){
		  	if(d.classList.contains(classes)){
		  		d.classList.remove('hide'); 
		  	}else{
		  		d.classList.add('hide'); 
		  	}
		  }
		})
		this.initList();
		
		registerAction('collection_toSRT', (dom, action) => {
			alert('敬请期待!');
		});
		registerAction('collection_clear', (dom, action) => {
			for(var k in self.list){
				self.list[k] = {};
			}
			self.initList();
		});
		registerAction('collection_zip', (dom, action) => {
			var cnt = 0;
			var old = g_list.list.clips;
			var paths = {};
			var names = {};
			for(file of Object.keys(old)){
				// todo 其他目录文件判断
				var name = old[file];
				if(!names[name]) names[name] = 0;
				var i = ++names[name];
				if(i > 1){
					name = '('+(i - 1)+'),' + name;;
				}
				paths[nodejs.files.getPath(`*path*/cuts/${file}.mp4`)] = name;
				cnt++;
			}
			cnt && ipc_send('saveAsZip', {
				fileName: 'videos_'+(new Date().format('yyyy_MM_dd_hh_mm_ss'))+'.zip',
				files: paths,
			});
		});
	},
	initList: function(){
		var h = '';
		var v = this.list.videos;
		var i1 = 0;
		for(var key in v){
			h += `
			 <li class="list-group-item" data-key="${key}">
                    ${++i1}. ${v[key]}
                    <span class="float-right" onclick="g_list.remove('videos', '${key}')">x</span>
             </li>
			`;
		}
		$('#_videolist ul').html(h);
       	$('#_videolist-tab .badge').html(i1);

		h = '';
		var i2 = 0;
		v = this.list.clips;
		for(var key in v){
			h += `
				<div class="col-4" style="position: relative;margin-top: 20px;" data-key="${key}" data-file="*path*/cuts/${key}.mp4" draggable="true">
					<img style="width: 100%;" src="./cover/${key}.jpg" alt="${v[key]}" draggable="false" data-pos="right-bottom" data-time=1000 data-preview>
					<i class="bi bi-dash-circle" onclick="g_list.remove('clips', '${key}')" style="position: absolute;top: 0px;right: 20px;"></i>
				</div>
			`;
			i2++;
		}
		$('#_cliplist .row').html(h);
       	$('#_cliplist-tab .badge').html(i2);
       	$('#ftb .badge').html(i1 + i2);
	},
	remove: function(type, key){
		delete this.list[type][key];
		this.initList();
	},
	addToList: function(type, key, value, toggle = true){
		if(this.list[type][key] && toggle){
			delete this.list[type][key];
			toast('移除成功!', 'alert-warning');
		}else{
			this.list[type][key] = value;
			toast('添加成功!', 'alert-success');
		}
		this.initList();
	},

	isInList: function(type, key){
		return this.list[type][key] != undefined;
	}
}



g_list.init();