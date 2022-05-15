var g_folders = {
    list: {},
    init: function() {
        var self = this;
        self.list = local_readJson('folders', {
            // 1111: {
            //     path: 'F:/html5/bootstrap-5.1.3-dist',
            //     name: 'test',
            // }
        })
        registerAction('folders_show', (dom, action) => {
            self.show(true);
        })
         registerAction('folders_toHome', (dom, action) => {
            self.show();
        })
        registerAction('folders_toPath', (dom, action, event) => {
        	var file = dom.dataset.file;
        	if(file){
                g_folders.addToList(file);
        		return;
        	}
        	var path = dom.dataset.path;
        	if(!path) return self.show(true);
            this.parsePath(path);
        });

        registerAction('folders_delete', (dom, action) => {
        	var folder = g_menu.key;
        	switch(action[0]){
        		case 'folders_delete':
        			confirm('确定移除同步目录: ' + folder+ '吗?(不会删除本地文件)', {
        				callback: btn => {
        					if(btn == 'ok'){
        						g_folders.removeFolder(folder);
        					}
        				}
        			})
        			break;
        	}
        	g_menu.hideMenu('folders_item');
        })
        
         g_menu.registerMenu({
            name: 'folders_item',
            selector: '[data-action="folders_toPath"]',
            dataKey: dom => {
            	return dom.data('file') || dom.data('path');
            },
            html: `
                <div class="list-group" style="width: 100%;">
                      <a data-action="folders_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                 </div>
            `,
            onShow: (key, dom) => {
            	if(this.modal.find('.breadcrumb-item').length != 1){ // 非首页
            		return false;
            	}
            }
        });

        // g_folders.show();
    },
    addToList: function(file){
         var key = SparkMD5.hash(file);
         if (!_videos[key]) {
            g_video.reviceFiles([file]);
         }else{
            g_video.loadVideo(key);
            g_folders.hide();
         }
    },
    addFolders: function(folders){
    	if(!Array.isArray(folders)) folders = [folders];
    	var time = new Date().getTime();
    	for(var folder of folders){
    		this.list[time++] = {
    			path: folder,
    			title: ''
    		}
    	}
    	this.saveData();
    },
    saveData: function(refresh = true){
    	local_saveJson('folders', this.list);
    	refresh && this.show(true);
    },
    removeFolder: function(folder){
    	var key = Object.keys(this.list).find(time => {
    		return this.list[time].path == folder;
    	});
    	if(key){
    		delete this.list[key];
    		this.saveData();
    	}
    },
    hide: function(){
        $('#modal_folders').modal('hide');
    },
    show: function(reset = false) {
        if ($('#modal_folders').length && !reset) return $('#modal_folders').modal('show');

        var folders = [];
        var h = ``;
        for (var time in this.list) {
            var d = this.list[time];
            h += this.getItemHtml('folder', time, d.path);
            folders.push(d.path);
        }
        h += `</ul>`;
        this.modal = confirm(`
        	<div class="breadcrumb">
        		<li class="breadcrumb-item"><a href="#">...</a></li>
        	</div>
        	<div>
	        	<ul class="list-group">
	        	${h}
	        	</ul>
	        </div>
        `, {
        	id: 'modal_folders',
            title: '本地目录',
             btns: [{
                id: 'add',
                text: '添加目录',
                class: 'btn-primary',
            }],
            callback: id => {
                switch(id){
                    case 'add':
                        doAction(null, 'addfolders');
                        return false;
                }
            }
        });
        this.folders = folders;
    },
    folders: [],
    parsePath: function(path) {
        var base = this.folders.find(folder => path.startsWith(folder)); // 替换前缀
        if (!base) return;

        var h = `<li class="breadcrumb-item" data-action="folders_toHome"><a href="#">...</a></li>`;
        var a = [base].concat(path.replace(base, '').replaceAll('\\', '/').split('/').filter(s => s != ''));

        var p = '';
        var i = 0;
        for (var s of a) {
            i++;
            p += s;
            if (i != a.length) p += '/';
            h += `<li class="breadcrumb-item${i == a.length ? ' active' : ''}" ><a href="#" data-action="folders_toPath" data-path="${p}">${i == 1 ? base : s}</a></li>`;
        }
        this.modal.find('.breadcrumb').html(h);

        a.pop();
        h = `<li data-action="folders_toPath" class="list-group-item" data-path="${a.join('/')}">...</li>`;
        var d = nodejs.files.items(path);
        for (var dir of d.paths) {
            h += this.getItemHtml('folder', 'check_' + dir, base+'\\'+dir)
        }
        for (var file of d.files) {
            var ext = popString(file, '.').toLowerCase();
            if (SUPPORTED_FORMAT.includes(ext)) {
           		 h += this.getItemHtml('video', 'check_' + file, d.base+'\\'+file);
            }
        }
        this.modal.find('ul').html(h);
    },

    getItemHtml: function(icon, id, path) {
        const isFolder = icon == 'folder';
        var h = `<li class="list-group-item" data-action="folders_toPath" data-${isFolder ? 'path' : 'file'}="${path}" ${!isFolder ? `data-pos='right-bottom' draggable="true" data-preview` : ''}>
                <i class="bi bi-${icon} mr-2"></i>`;
        if(!isFolder){
            var v = g_video.getVideo(SparkMD5.hash(path));
            if(v){
                var i = Object.keys(v.clips).length;
                if(i > 0) h += `<span class="badge badge-danger mr-2">${i}个片段</span>`
            }
        }
        h += `${getFileName(path, true)}</li>`;
        return h;
    },
}

g_folders.init();