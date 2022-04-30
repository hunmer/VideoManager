var g_filter = {
	list: {
		local: [],
		share: [],
	},
	filters: {},
	addFilter: function(name, opts){
		this.filters[name] = opts;
		return this;	
	},
	getFilter: function(name){
		return this.filters[name];
	},
	init: function(){
		var self = this;
		registerAction('filter_click', (dom, action) => {
			self.filter_remove(dom);
		});
		self.addFilter('local', {
			callback: html => {
			    $('#search_fliters').html(html);
    			g_video.onSearchClip();
			}
		}).addFilter('share', {
			callback: html => {
			    $('#share_fliters').html(html);
    			g_share.showSearch();
			}
		})
	},
    filter_list: function(name) {
        return this.list[name];
    },

    filter_getContent: function(name, type, def = ''){
    	var list = this.filter_list(name);
    	 if (list.some((d) => d.type == type)) {
            return d.content;
        }
        return def;
    },
    filter_init: function(name) {
        var h = '';
        for (var filter of this.filter_list(name)) {
            h += `<a class="badge badge-primary mr-2 badge_filter" data-action="filter_click" data-name="${name}" data-filter="${filter.content}" data-type="${filter.type}">${filter.text}</a>`
        }
        if (h == '') h = `<h6 class="text-center">右上角添加搜索条件</h6>`;
        this.getFilter(name).callback(h);

    },
    filter_get: function(name, type) {
        return domSelector({name: name, type: type }, '.badge_filter');
    },
    filter_save: function(name, vals) {
        this.list[name] = vals;
        this.filter_init(name);
    },
    filter_add: function(name, text, content, type) {
        var list = this.filter_list(name);
        if (list.some((d) => d.content == content)) {
            return alert('已存在!');
        }
        list.push({ text: text, content: content, type: type });
        this.filter_save(name, list);
    },
    filter_remove: function(dom) {
        var name = dom.dataset.name;
        var filter = dom.dataset.filter;
        dom.remove();

        var list = this.filter_list(name);
        var i = list.findIndex((d) => {
            return d.content == filter;
        });
        if (i != -1) {
            list.splice(i, 1);
        	this.filter_save(name, list);
        }
    }

}
g_filter.init();