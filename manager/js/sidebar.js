var g_sidebar = {
	// 过滤结果
	loadFilter: function(opts){
		$('.filter_active').removeClass('filter_active');
		domSelector(Object.assign({action: 'setFilter'}, opts)).addClass('filter_active');
		var rule;
		switch(opts.type){
			case '文件夹':
				rule = `WHERE folders LIKE '%,${opts.name},%' order by date desc`;
				break;
			default:
				var d = g_sidebar.list[opts.type].find(d => d.name == opts.name);
				if(!d) return;
				rule = d.rule;
				break;
		}
		g_data.resetPage(rule);
	},
	init: function(){
		registerAction('toggleRight', (dom, action) => {
			$('#detail').toggleClass('hide');
		});
		registerAction('setFilter', (dom, action, event) => {
			dom = $(dom);
			var opts = {
				type: dom.attr('data-type'),
				name: dom.attr('data-name')
			}
			g_sidebar.loadFilter(opts);
			setConfig('lastFilter', opts);
		});
		g_menu.registerMenu({
            name: 'filter-item-folder',
            selector: '#文件夹-collapse li',
            dataKey: 'data-name',
            html: `
                <div class="list-group list-group-flush p-0" style="width: 100%;">
                   	 <a data-action="folder_item_edit" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-pencil me-2"></i><span>编辑</span>
                      </a>
                      <a data-action="folder_item_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash me-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
        });
		this.list = {
			'常用': [{
				name: '全部',
				rule: '',
			},{
				name: '最近',
				rule: "order by date desc",
			},{
				name: '未分类',
				rule: "WHERE folders='' order by date desc",
			},{
				name: '无标签',
				rule: "WHERE tags='' order by date desc",
			}],
			'文件夹': [{
				name: '文件夹1',
			},{
				name: '文件夹2',
			}],
		}
		this.initList();
	},
	
	addType: function(name, vals){
		this.list[name] = vals || [];
		if(vals){
			this.initList(name);
		}
	},

	initList: function(names){
		if(names == undefined) $('#sidebar_left #filters').html('');
		names = getParamsArray(names, Object.keys(this.list));
		for(var type of names){
			var id = `sidebar_type_${type}`;
			var h = `
				<li class="mb-1" id="${id}">
                    <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 collapsed" data-bs-toggle="collapse" data-bs-target="#${type}-collapse" aria-expanded="true">
                        ${type}
                    </button>
					  	${(() => {
					  		var r = '';
					  		var a = [];
					  		switch(type){
					  			case '文件夹':
					  				a.push(['新增', 'folder_add']);
					  				break;
					  		}
					  		if(a.length){
					  			 r += `
					  			 <div class="dropdown  float-end">
								  <button class="btn" style="line-height: 8px;" type="button" id="dropdown_${type}" data-bs-toggle="dropdown" aria-expanded="false">
								    <i class="ms-2 bi bi-three-dots"></i>
								  </button>
								  <ul class="dropdown-menu" aria-labelledby="dropdown_${type}">`;
								  for(var item of a){
								  	r += `<li><a class="dropdown-item" href="#" data-action="${item[1]}">${item[0]}</a></li>`;
								  }
								  r+='</ul></div>'
					  		}
					  		return r;
					  	})()}
					  </ul>
					</div>
                    <div class="collapse show" id="${type}-collapse">
                        <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">

             `;
             for(var item of this.list[type]){
             	h += `<li><a href="#" data-action="setFilter" data-type="${type}" data-name="${item.name}" data-filter="" class="d-inline-flex text-decoration-none rounded text-dark">${item.name}</a></li>`;
             }
             h+= `</ul>
                    </div>
                </li>`;

             if($('#'+id).length){
             	$('#'+id).replaceWith(h);
             }else{
             	$('#sidebar_left #filters').append(h);
             }
		}
	}

}

g_sidebar.init();