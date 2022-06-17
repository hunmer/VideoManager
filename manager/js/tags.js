var g_tags = {
	list: [],
	getSelected: function(){
		return this.list;
	},
	toggleTag: function(tag, dom){
		var list = this.getSelected();
		var i = list.indexOf(tag);
		var add = i == -1;
		if(add){
			list.push(tag);
		}else{
			list.splice(i, 1);
		}
		g_data.setData(g_cache.currentMd5, {tags: ','+list.join(',')+','})
		this.setTags(list);
		return add;
	},
    getTagsHtml: function(){
        var r = {};
        var tags = ['啊啊', '版本', '尺寸', '哦哦'];
        for(var tag of tags){
            var sz = PinYinTranslate.sz(tag);
            if(!r[sz]) r[sz] = [];
            r[sz].push(tag);
        }
        var h = '';
        for(var sz in r){
            h += `
            <div class="mb-3 border-bottom">
                <h6 >${sz}<span class="text-mute float-end">${r[sz].length}</span></h6>
            `;
            for(var tag of r[sz]){
                h+=`<span  data-action="tags_toggleTag" data-tag="${tag}" class="badge bg-secondary me-2 mb-2">${tag}</span>`
            }
            h += '</div>';
        }
        return h;
    },

	init: function(){
		registerAction('tags_removeTag', (dom, action) => {
			g_tags.toggleTag(dom.parentElement.dataset.tag);
		});
		registerAction('tags_toggleTag', (dom, action) => {
			g_tags.toggleTag(dom.dataset.tag);
		})
	},
	setTags: function(tags){
		this.list = tags;
		var r = '';
		for(var tag of tags){
		 	r += `<a class="badge bg-primary me-2" data-tag="${tag}">${tag}<i class="ms-2 bi bi-x" data-action="tags_removeTag"></i></a>`;
		 }
		 $('#tags').html(r);
	},
}

g_tags.init();