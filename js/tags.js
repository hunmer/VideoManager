var g_tag = {
    selectedGroups: [],
    data: local_readJson('tags', {
        groups: {
            // group1: ['tag1', 'tag2', 'tag3'],
            // group2: ['tag3', 'tag2', 'tag4'],
        }
    }),
    renameTag: function(tag, newName) {
        var isEmpty = newName == '';
        var cnt = 0;
        for (var key in _videos) {
            var d = _videos[key];
            for (var clip in d.clips) {
                var i = d.clips[clip].tags.indexOf(tag);
                if (i != -1) {
                    if (isEmpty) {
                        d.clips[clip].tags.splice(i, 1);
                    } else {
                        if (d.clips[clip].tags.indexOf(newName) == -1) { // 确保新的标签没有存在
                            d.clips[clip].tags[i] = newName;
                        }
                    }
                    cnt++;
                }
            }
        }

        // 更新最近标签
        var i = g_config.tags_rent.indexOf(tag);
        if (i != -1) {
            if (isEmpty) {
                g_config.tags_rent.splice(i, 1);
            } else {
                if (g_config.tags_rent.indexOf(newName) == -1) {
                    g_config.tags_rent[i] = newName;
                }
            }
            local_saveJson('config', g_config);
            g_tag.initRentTags();
            g_tag.initAll();
            if (g_video.clip) g_video.loadClip(g_video.clip);
        }

        // 更新标签组
        for (var group of this.getTagGroup(tag)) {
            if (isEmpty) {
                this.group_removeTag(group, tag, false);
            } else {
                this.group_renameTag(group, tag, newName, false);
            }
        }
        this.removeEmptyGroups();

        if (cnt > 0) {
            toast('成功应用于 ' + cnt + ' 个视频', 'alert-success');
            g_video.saveVideos(false);
            g_video.initPos();
        } else {
            toast('没有视频生效', 'alert-warning');
        }
    },
    initGroups: function() {
        var h = '';
        for (var group in this.data.groups) {
            h += `<option value="${group}">(${this.data.groups[group].length}) ${group}</option>`
        }
        var selecter = $('#select_tag_folder').html(h)
        if (this.selecter) this.selecter.multiselect('destroy');
            const getTitle = (options, select) => {
            	var cnt = options.length;
                if (cnt === 0 || cnt == select.find('option').length) {
                    return '所有';
                }
                var labels = [];
                options.each(function() {
                    labels.push($(this).attr('value'));
                });
                return labels.join(', ') + '';
            }
            this.selecter = selecter.multiselect({
                enableFiltering: true,
                nonSelectedText: '所有',
            	allSelectedText: '所有',
                filterBehavior: 'value',
                buttonClass: 'btn btn-link',
                buttonWidth: '100px',
                onChange: function(option, checked, select) {
                    var selected = [];
                    $('#select_tag_folder option:selected').each(function() {
                        selected.push($(this).val());
                    });
                    g_tag.switchGroup(selected);
                },
                buttonText: function(options, select) {
                    return getTitle(options, select);
                },
                buttonTitle: function(options, select) {
                    return getTitle(options, select);
                },
                numberDisplayed: 1,
                // buttonContainer: '<div class="btn-group" id="example-selectedClass-container"></div>',
                // selectedClass: 'bg-primary text-light',
            });
    },
    getGroup: function(group) {
        return this.data.groups[group];
    },
    switchGroup: function(groups) {
        this.selectedGroups = Array.isArray(groups) ? groups : [groups];
        this.initAll();
    },

    listGroups: function() {
        return this.data.groups;
    },
    getTagGroup: function(tag) {
        var list = [];
        var all = this.listGroups();
        for (var group in all) {
            if (all[group].includes(tag)) {
                list.push(group);
            }
        }
        return list;
    },
    group_setTags: function(group, tags, save = true) {
        this.data.groups[group] = tags;
        if (save) local_saveJson('tags', this.data);
    },
    group_removeTag: function(group, tag, save = true) {
        var tags = this.getGroup(group);
        if (tags) {
            var i = tags.indexOf(tag);
            if (i != -1) {
                tags.splice(i, 1);
                this.group_setTags(group, tags, save);
                return true;
            }
        }
    },
    group_renameTag: function(group, tag, newName, save = true) {
        var tags = this.getGroup(group);
        if (tags) {
            var i = tags.indexOf(tag);
            if (i != -1) {
                tags[i] = newName;
                this.group_setTags(group, tags, save);
                return true;
            }
        }
    },
    group_renameGroup: function(group, newName, save = true) {
        var tags = this.getGroup(group);
        if (tags) {
        	delete this.data.groups[group];
            this.group_setTags(newName, uniqueArr(tags, this.getGroup(newName) || []), false);
            this.updateGroup(save);
            return true;
        }
    },
    updateGroup: function(save = true){
    	this.initGroups();
        if (save) local_saveJson('tags', this.data);
    },
    group_addTag: function(group, tag, save = true) {
        var tags = this.getGroup(group) || [];
        var i = tags.indexOf(tag);
        if (i == -1) {
            tags.push(tag);
            this.group_setTags(group, tags, save);
        }
    },
    group_remove: function(group, save = true){
    	if(this.getGroup(group)){
    		 delete this.data.groups[group];
            this.updateGroup(save);
    	}
    },
    removeEmptyGroups: function(save = false) {
        for (var name in this.data.groups) {
            if (this.data.groups[name].length == 0) {
                delete this.data.groups[name];
            }
        }
     	 this.updateGroup(save);
    },

    init: function() {
        registerAction('tag_resetSelected', (dom, action) => {
            g_tag.update([]);
        });

        registerAction('tag_item_setGroup', (dom, action) => {
            var tag = g_menu.key;
            var group = g_tag.getTagGroup(tag).join(',');
            var title = '设置标签分组,多个用逗号分开';
            prompt(group, {
                title: title,
                placeholder: title,
                callback: s => {
                    if (s != group) {
                        for (var g of group.split(',')) {
                            g_tag.group_removeTag(g, tag, false);
                        }
                        for (var g of s.replaceAll('，', ',').split(',')) {
                            g_tag.group_addTag(g, tag, false);
                        }
                        g_tag.removeEmptyGroups(false);
                        local_saveJson('tags', g_tag.data);
                        toast('设置成功!', 'alert-success');
                        g_tag.initGroups();
                    }
                }
            })
            g_menu.hideMenu('tag_item');

        });

        registerAction('tag_item_rename', (dom, action) => {
            var tag = g_menu.key;
            var title = '更改标签名称';
            prompt(tag, {
                title: title,
                placeholder: title,
                callback: newTag => {
                    if (newTag != tag && newTag != '') {
                        g_tag.renameTag(tag, newTag);
                    }
                }
            });
            g_menu.hideMenu('tag_item');
        });

        registerAction('tag_item_delete', (dom, action) => {
            var tag = g_menu.key;
            confirm(`确定删除标签 【${tag}】 吗? 此操作将会从所有包含此标签的片段中消失`, {
                title: '删除标签',
                callback: btn => {
                    if (btn == 'ok') {
                        g_tag.renameTag(tag, '');
                    }
                }
            })
            g_menu.hideMenu('tag_item');
        });
        registerAction('tag_group_rename', (dom, action) => {
            var group = g_menu.key;
            prompt(group, {
                title: '重命名分组',
                callback: newName => {
                    if ( group != newName) {
                        g_tag.group_renameGroup(group, newName);
                        toast('重命名成功', 'alert-success');
                    }
                }
            });
            g_menu.hideMenu('tagGroup');
        });

         registerAction('tag_group_delete', (dom, action) => {
            var group = g_menu.key;
            confirm('<b class="text-danger">你确定要删除分组 【<span class="text-warning">' + group + '</span>】 吗?', {
                title: '删除分组',
                callback: btn => {
                    if (btn == 'ok') {
                    	var i = g_tag.selectedGroups.indexOf(group);
                    	if(i != -1){
                    		g_tag.selectedGroups.splice(i, 1);
                    		g_tag.initAll();
                    	}
                        g_tag.group_remove(group);
                        toast('删除分组成功', 'alert-success');
                    }
                }
            })
            g_menu.hideMenu('tagGroup');
        });


        $(function() {
            g_menu.registerMenu({
                name: 'tag_item',
                selector: '.tag',
                dataKey: 'data-tag',
                html: `
                <div class="list-group" style="width: 100%;">
                    <a data-action="tag_item_rename" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-input-cursor mr-2"></i><span>重命名</span>
                      </a>
                      <a data-action="tag_item_setGroup" class="list-group-item list-group-item-action text-primary" aria-current="true">
                        <i class="bi bi-folder mr-2"></i><span>设置分组</span>
                      </a>
                      <a data-action="tag_item_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
            });
            g_menu.registerMenu({
                name: 'tagGroup',
                selector: '#tag_search .multiselect-option',
                dataKey: dom => $(dom).find('input').val(),
                html: `
                <div class="list-group" style="width: 100%;">
                    <a data-action="tag_group_rename" class="list-group-item list-group-item-action text-warning" aria-current="true">
                        <i class="bi bi-arrow-repeat mr-2"></i><span>重命名</span>
                      </a>
                      <a data-action="tag_group_delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
            });
            g_tag.initGroups();
        });
    },
    all: {},
    list: [],
    preInit: function() {
        this.update();
    },
    addTag: function(tag) {
        $('#input_tag').val('');
        if (!this.list.includes(tag)) {
            this.list.push(tag);
            if (!this.all[tag]) this.all[tag] = 1;
        }
        var rent = g_config.tags_rent || [];
        var i = rent.indexOf(tag);
        if (i != -1) rent.splice(i, 1);
        rent.unshift(tag);
        g_config.tags_rent = rent.slice(0, 8);
        local_saveJson('config', g_config);
        this.update(this.list);
    },

    getAllTags: function() {
        return Object.keys(this.all);
    },

    searchTag: function(search) {
        var h = '';
        var py = PinYinTranslate.start(search);
        var sz = PinYinTranslate.sz(search);
        for (var tag of this.getAllTags().filter((t) => {
                return t.indexOf(search) != -1 || PinYinTranslate.start(t).indexOf(py) != -1 || PinYinTranslate.sz(t).indexOf(sz) != -1
            })) {
            h += this.getHtml(tag, 'tag_add', 'badge-primary');

        }
        $('#tags_all .tags_content').html(h);
    },

    initRentTags: function(tags) {
        if (!tags) tags = g_config.tags_rent || [];
        var h = '';
        for (var tag of tags) {
            h += this.getHtml(tag, 'tag_add', this.list.includes(tag) ? 'badge-success' : 'badge-primary');
        }
        $('#tags_rent').html(h);
    },

    update: function(list) {
        if (list) {
            this.list = list;
            this.initTags(list);
        }
        this.initRentTags();
        this.initAll();
    },
    removeTag: function(tag) {
        var i = this.list.indexOf(tag);
        if (i != -1) {
            this.list.splice(i, 1);
            this.update(this.list);
            // todo 从all中移除？
        }
        $('#tags .tag[data-tag="' + tag + '"]').remove();
    },

    getHtml: function(tag, action, classes) {
        return `<a class="tag badge ${classes} m-2" data-tag="${tag}" data-action="${action}">${tag}</a>`
    },

    initTags: function() {
        var h = '';
        for (var tag of this.list) {
            h += this.getHtml(tag, 'tag_remove', 'badge-dark');
        }
        $('#tags .tags_content').html(h);
    },
    initAll: function(action = 'tag_add') {
        var h = '';
        var tags;
        if (this.selectedGroups.length) {
            tags = new Set();
            for (var group of this.selectedGroups) {
                for (var tag of this.getGroup(group)) {
                    tags.add(tag);
                }
            }
            tags = Array.from(tags);
        } else {
            tags = this.getAllTags();
        }
        for (var tag of tags) {
            if (!this.list.includes(tag)) {
                h += this.getHtml(tag, action, 'badge-dark');
            }
        }
        $('#tags_all .tags_content').html(h);
    }

}

g_tag.init();
// g_tag.preInit();