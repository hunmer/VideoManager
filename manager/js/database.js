var g_data = {
    page: -1,
    pagePre: 10,
    rule: '',
    queryParam: 'SELECT *  FROM videos {rule} LIMIT {limit} OFFSET {start};',
    getLengths: function() {
        return this.db.prepare('SELECT COUNT(*) FROM videos').get()['COUNT(*)'];
    },
    data_remove: function(md5){
        return this.db.prepare(`DELETE FROM videos WHERE md5=?`).run(md5).changes;
    },
    setData: function(md5, data){
        var keys = Object.keys(data);
        var s = '';
        keys.every((key, i) => {
            s += key + ' = ?';
            if(i != keys.length - 1){
                s+=','
            }
            return true;
        });
        var handle = this.db.prepare(_d(`UPDATE videos SET ${s} WHERE md5=?`));
        return handle.run(Object.values(data).concat(md5)).changes;
    },
    nextPage: function() {
        var start = ++this.page * this.pagePre;
        var s = this.queryParam.replace('{rule}', this.rule).replace('{limit}', this.pagePre).replace('{start}', start);
        var items = g_data.db.prepare(_d(s)).all();
        var hasMore = false;
        console.log(items);
        if (items) {
            hasMore = items.length >= this.pagePre
            this.loadItems(items);
        }
        this.hasMore = hasMore;
        // g_data.resetPage(`order by date desc`);
        // g_data.db.prepare(`UPDATE videos SET tags = 'tag1,tag2,tag3' WHERE id=5`).run().changes
        // g_data.resetPage(`WHERE tags LIKE '%,tag2,%' and tags LIKE '%,tag2,%' order by date desc`)
    },
    cnt: -1,
    resetPage: function(rule){
        $('#gallery .row').html('');
        this.page = -1;
        this.cnt = -1;
        this.rule = rule;
        this.nextPage();
    },
    getVideo: function(md5) {
        return this.db.prepare('select * from videos where md5=?').get(md5);
    },

    init: function() {
        if (_api) {
            g_data.db = _api.loadDB(false);
        }
        // var i = 0;
        // var d = {};
        // var file = [];
        // for (var id of ['1652978309053', '1652978353774', '1652978368848', '1652978398102', '1652978467451', '1652978487295', '1652978583767']) {
        //     file.push('I:\\videoManager\\resources\\app\\cuts\\' + id + '.mp4');
        // }
        // g_video.reviceFiles(file);
        var last = getConfig('lastFilter');
        if(typeof(last) == 'objcet'){
            this.loadFilter(last);
        }else{
            this.nextPage();
        }

    },
    getPathWithMd5: function(md5) {
        return nodejs.dir + '/database/' + md5.substr(0, 2) + '/' + md5.substr(2, 2) + '/' + md5 + '/';
    },

    markCover: function(key, time, file, saveTo, tip = true) {
        var self = this;
        ipc_send('cmd', {
            input: file,
            key: key,
            output: saveTo,
            params: [time],
            type: 'cover',
            size: '240x180',
            callback: (k, saveFile, success) => {
              if(success){
                    domSelector({id: k}, '.media-item').find('.lazyload').attr('src', saveFile);
                }
            }
        });
    },
    setMediaCover: function(md5, url) {
        domSelector({ id: md5 }, '.media-item').find('.lazyload').attr('data-src', url).lazyload();
    },
    insertData: function(data) {
        var self = this;
        var cnt = 0;
        var exists = [];
        var added = [];
        var max = Object.keys(data).length;
        const progress = () => {
            var p = $('#gallery-bottom .progress-bar').css('width', cnt / max + '%').show();
            console.log(cnt);
            if(++cnt == max){
                p.hide();
                var i = added.length;
                // if (i) {
                //     self.loadItems(added);
                // }
                toast(`${i ? `成功导入${i}个文件 ` : ''}${exists.length ? `${exists.length}个文件已经存在!` : ''}`, 'bg-info');
            }
        }
        for(var md5 in data){
            var d = data[md5];
            var saveTo = self.getPathWithMd5(md5) + d.name + '.mp4';
            if (nodejs.files.exists(saveTo)) {
                exists.push(md5);
                delete data[md5];
                progress();
            } else {
                nodejs.files.copyWithCallback(d.file, saveTo, md5, (err, md5) => {
                    var d = data[md5];
                    // 先插入元素 然后在适应图片加载
                    self.loadItems([d], false, true);
                    var path =  self.getPathWithMd5(md5);
                    self.markCover(md5, 1,  path + d.name + '.mp4', path + 'cover.jpg', false);
                    self.db.prepare('INSERT INTO videos (tags, name, folders, uploader, json, desc, md5, date) VALUES (@tags, @name, @folders, @uploader, @json, @desc, @md5, @date)').run(d);
                    added.push(d);
                    progress();
                });
            }
        }
    },
    loadItems: function(items, clear = false, isNew = false) {
        var h = ``;
        for (var d of items) {
            console.log(d);
            var path = this.getPathWithMd5(d.md5);
            h += `
				<div data-index="${++this.cnt}" class="media-item col-4 p-2 text-center" data-dbaction="fullPreview" style="position: relative;" data-action="video_item_click" data-file="${path+d.name+'.mp4'}" data-id="${d.md5}">
					<img src="${isNew ? './res/loading.gif' : path+'cover.jpg'}" title="" class="lazyload w-full" data-preview>
					<span class="text-mute">${d.name}</span>
				</div>
			`
        }
        if (clear) {
            $('#gallery .row').html(h)
        } else {
            $(h).appendTo('#gallery .row');
        }
        $('#gallery').find('.lazyload').lazyload()
        setTimeout(() => {
        	if(g_data.hasMore && !isScroll( $('#gallery')[0]).scrollY){
	        	this.nextPage();
	        }
        }, 100);
    }
}

g_data.init();