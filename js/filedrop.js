var g_fileDrop = {
    list: {},
    init() {

    },
    register(name, opts) {
        const self = this
        this.list[name] = opts
        const fileDragHover = function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (!g_cache.draging) { // 过滤从浏览器拖动的文件
                // $('#file-drop').toggleClass('hide1', !self._inArea(e, 'body'));
            }
        }
        $(opts.selector).
        on('dragleave', e => {
            fileDragHover(e)
        }).
        on('dragover', e => fileDragHover(e)).
        on('drop', function(e) {
            e = e.originalEvent;
            self.parseFiles(name, e.target.files || e.dataTransfer.files);
            e.stopPropagation();
            e.preventDefault();
            delete g_cache.dragFile;
        });
    },
    remove(name) {
        delete this.list[name]
    },
    get(name) {
        return this.list[name]
    },
    _inArea(event, target) {
        var point = { x: event.pageX, y: event.pageY }
        var area = $(target).offset();
        area = {
            l: area.left,
            t: area.top,
            w: $(target).width(),
            h: $(target).height(),
        }

        return point.x > area.l && point.x < area.l + area.w && point.y > area.t && point.y < area.t + area.h;
    },
    parseFiles(name, files) {
        let d = this.get(name)
        let r = { dirs: [], files: [] }
        for (var i = 0, f; f = files[i]; i++) {
            if (f.path) { // 从electron接受文件
                if (nodejs.files.isDir(f.path)) { // 目录
                    r.dirs.push(f.path)
                    continue;
                }
                f.file = f.path
            }
            let ext = f.name.split('.').pop().toLowerCase();
            if (d.exts.includes(ext) && !(g_cache.dragFile && g_cache.dragFile.includes(f.path))) {
                r.files.push(f.file)
            }
        }
        d.onParse && d.onParse(r)
    },

    revicePath(path, files) {
        var i = g_cache.paths.indexOf(path);
        if (i != -1) {
            g_cache.paths.splice(i, 1);
            for (var file of files) {
                if (!g_cache.files.includes(file)) {
                    g_cache.files.push(file);
                }
            }
            if (g_cache.paths.length == 0) {
                g_video.reviceFiles(g_cache.files, popString(path, '\\'));
            }
        }
    },


}
// doAction(null, 'addfiles')
g_fileDrop.init()
g_fileDrop.register('video', {
    selector: 'body',
    exts: ['mp4', 'ts', 'm3u8', 'flv', 'mdp'],
    onParse: function(r){
    	let base = nodejs.files.getPath('*path*/cuts/');
    	for(let dir of r.dirs){
    		nodejs.files.dirFiles(dir, this.exts, files => {
    			r.files = r.files.concat(files)
    		})
    	}
    	let files = r.files.filter(file => {
    		 return file.indexOf(base) != 0 // 忽略cuts目录下的文件
    	})
    	console.log(files);
        files.length && g_video.reviceFiles(files);
    }
})