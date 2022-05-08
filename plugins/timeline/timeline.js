var g_timeline = {
    paused: true,
    init: function() {
        if (this.inited) return;
        this.inited = true;

        // this.show();
        g_menu.registerMenu({
            name: 'editor_track',
            selector: '[data-action="editor_track"]',
            dataKey: 'data-track',
            html: `
                <div class="list-group" style="width: 100%;">
                	 <a data-action="editor_track,disabled" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-eye-slash-fill mr-2"></i><span>隐藏</span>
                      </a>
                      <a data-action="editor_track,delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
            onShow: key => {
               var btn = domSelector({ action: 'editor_track,disabled' });
               var track = g_timeline.timeline.getTrack(key);
               var disabled = track.disabled || false;
               	 btn.find('span').html(disabled ? '显示' : '隐藏');
               	btn.find('i').attr(`bi bi-eye${disabled ? '-slash' : ''}-fill mr-2`);
            }
        });
        g_menu.registerMenu({
            name: 'editor_clip',
            selector: '____',
            dataKey: () => {},
            html: `
                <div class="list-group" style="width: 100%;">
                	 <a data-action="editor_clip,replace" class="list-group-item list-group-item-action" aria-current="true">
                        <i class="bi bi-eye-slash-fill mr-2"></i><span>替换</span>
                      </a>
                      <a data-action="editor_clip,delete" class="list-group-item list-group-item-action text-danger" aria-current="true">
                        <i class="bi bi-trash mr-2"></i><span>删除</span>
                      </a>
                    </div>
            `,
            onShow: key => {
            }
        });

        
    },
    show: function() {
        var modal = $('#modal_editor');
        if (modal.length) {
            return modal.modal('show');
        }
        g_filter.addFilter('timeline', {
			callback: html => {
			    // $('#search_fliters').html(html);
    			// g_video.onSearchClip();
			}
		})
         registerAction('editor_modal_tags', (dom, action) => {
         	g_video.modal_tag([], tags => {
	            for (var tag of tags) {
	                //g_filter.filter_add('timeline', '标签: ' + tag, `clip.tags.includes('${tag}')`, 'tag');
	            }
	        });
         });

         registerAction('editor_clip', (dom, action) => {
         	var v = g_timeline.doubleTarget;
         	if(!v) return;
        	switch(action[1]){
        		case 'delete':
        			g_timeline.timeline.removeRows(v.track.title, v.keyframes);
        			break;

        		case 'replace':
        			g_timeline.timeline.HideTrack(g_menu.key);
        			break;
        	}
        	g_menu.hideMenu('editor_clip');
        });
        
        registerAction('editor_track', (dom, action) => {
        	switch(action[1]){
        		case 'delete':
        			g_timeline.timeline.removeTrack(g_menu.key);
        			break;

        		case 'disabled':
        			g_timeline.timeline.HideTrack(g_menu.key);
        			break;
        	}
        	g_menu.hideMenu('editor_track');
        });

        registerAction('editor_togglePlay', (dom, action) => {
            var paused = g_timeline.paused = !g_timeline.paused;
            $(dom).find('i').attr('class', `bi bi-${paused ? 'play' : 'pause'}`);
            var video = g_timeline.getPlayingVideo();
            if(video.length){
            	if(paused){
            		video[0].pause();
            	}else{
            		video[0].play();
            	}
            }
        });
        registerAction('editor_mode', (dom, action) => {
            $('#editor_toolbar button.text-primary').removeClass('text-primary');
            g_timeline.timeline.setInteractionMode(action[1]);
            $(dom).addClass('text-primary');
        });
        loadRes([{ type: 'js', url: './plugins/timeline/animation-timeline.min.js' }], () => {
            var h = `
		 	<div class="row" style="min-height: 600px;">
		 		<div id="editor_frame" class="p-2 text-center col-12 bg-dark" style="height: 300px;">
		 		</div>
		 		<div id="editor_toolbar" class="bg-light col-12" style="height: 50px;">
		 			<div class="d-flex bd-highlight mb-3">
					  <div class="mr-auto p-2 ">
					  	<div class="btn-group" role="group">
						  <button type="button" class="btn" data-action="editor_togglePlay"><i class="bi bi-play"></i></button>
						  <button type="button" class="btn"><i class="bi bi-zoom-in" data-action="editor_mode,zoom"></i></button>
						  <button type="button" class="btn"><i class="bi bi-hand-index" data-action="editor_mode,select"></i></button>
						  <button type="button" class="btn"><i class="bi bi-arrows-move" data-action="editor_mode,pan"></i></button>

						  <div class="btn-group" role="group">
						    <button id="btnGroupDrop1" type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
						    </button>
						    <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
						      <a class="dropdown-item" href="#" data-action="editor_modal_tags">随机</a>
						      <a class="dropdown-item" href="#" data-action="editor_reset">清空</a>
						    </div>
						  </div>
						</div>

					  </div>
					  <div class="p-2 bd-highlight" id="editor_timeStamp"></div>
					</div>
		 		</div>
		 		<div id="editor_tracks" class="bg-light col-3" style="height: 300px;">


		 		</div>
		 		<div id="editor_timeline" class="col-9 bg-light" style="height: 300px;">

		 		</div>
		 	</div>
		`;
            this.modal = buildModal(h, {
                id: 'modal_editor',
                title: '简易时间线',
                once: true,
                width: '80%',
                btns: [{
                    id: 'export',
                    text: '导出',
                    class: 'btn-primary',
                }, {
                    id: 'drag',
                    text: '拖拽',
                    class: 'btn-warning',
                }],
                onBtnClick: (config, btn) => {
                    switch (btn.id) {
                        case 'drag':
                            return;

                        case 'export':
                            return;
                    }
                    //$(btn).parents('.modal').modal('hide');
                },
                onShow: () => {
                    g_cache.groups = {
                        a: {
                            file: 'cuts/1651988218751.mp4',
                        },
                        b: {
                            file: 'cuts/1651988230013.mp4',
                        },
                    }
                    g_timeline.preloadVideos(g_cache.groups, [{
                        title: 'Track1',
                        keyframes: [{
                                val: 40,
                                // max: 850,
                                group: 'a',
                            },
                            {
                                val: 800,
                                // max: 900,
                                group: 'a',
                            },
                            {

                                val: 1900, // min: 1000,
                                // max: 3400,
                                group: 'b',
                            },
                            {
                                val: 3000,
                                // max: 3500,
                                group: 'b',
                            }
                        ],
                    }, {
                        title: 'Audio',
                        keyframes: [],
                    }]);

                }
            });
        })

    },
    hide: function() {

    },

    preloadVideos: function(list, rows) {
        var done = 0;
        for (var group in list) {
            var file = list[group].file;
            var xhrReq = new XMLHttpRequest();
            xhrReq.open('GET', file, true);
            xhrReq.responseType = 'blob';
            xhrReq.group = group;
            xhrReq.onload = function() {
                var group = this.group;
                if (this.status === 200) {
                    var url = URL.createObjectURL(this.response);
                    $(`<video data-group="${group}" style="height: 100%;display: none;" src="${url}">`).appendTo('#editor_frame').one('canplay', function(e) {
                        if (++done == Object.keys(g_cache.groups).length) {
                            console.log('视频预加载完毕');
                            g_cache.groups[group].duration = this.duration;
                            if (!g_timeline.timeline) {
                                return g_timeline.initTimeline(rows);
                            }
                            // todo
                        }
                    })
                }
            }
            xhrReq.onerror = function() {
                console.log('err', arguments);
            }
            xhrReq.onprogress = function(e) {
                if (e.lengthComputable) {
                    var percentComplete = ((e.loaded / e.total) * 100 | 0) + '%';
                    //console.log('progress: ', percentComplete);

                }
            }
            xhrReq.send();
        }
    },

    tryStop: function(){
    	this.stoped = this.paused;
    },

    tryStart: function(){
    	if(!this.stoped){
    		this.paused = false;
    	}
    },

    getPlayingVideo: function(){
    	return $('#editor_frame video.show')
    },

    initTimeline: function(rows) {
        var timeline = new timelineModule.Timeline();
        this.timeline = timeline;
        timeline.initialize({ id: 'editor_timeline', headerHeight: 45 });

        timeline.initFrames = function() {
            var keyframes = {};
            var rows = timeline.getModel().rows;
            if(Object.keys(rows).length){
            	 for (var row of rows) {
	                for (var keyframe of row.keyframes) {
	                    if (keyframes[keyframe.group] == undefined) {
	                        keyframes[keyframe.group] = keyframe.val;
	                    } else {
	                        keyframes[keyframe.group] = [
	                            Math.min(keyframe.val, keyframes[keyframe.group]),
	                            Math.max(keyframe.val, keyframes[keyframe.group]),
	                        ]
	                    }
	                }
	            }
            }
            var sorted = {};
            for (var group of Object.keys(keyframes).sort((a, b) => {
                    return keyframes[a][0] - keyframes[b][0]
                })) {
                sorted[group] = keyframes[group];
            }
            timeline.keyframes = sorted;
        }

        timeline.initTrackList = function() {
            var options = timeline.getOptions();
            var h = `
            <div class="text-center" id="editor_tracks_header" style="
            	max-height: ${options.headerHeight}px;
            	min-height: ${options.headerHeight}px;
            ">Tracks
            	<span class="badge badge-primary badge-pill ml-2">${rows.length}</span>
            </div>
            <ul class="list-group">`;
            rows.forEach(function(row, index) {
                var height = (row.height || options.rowsStyle.height) + 'px';
                var style = `
            	max-height: ${height};
            	min-height: ${height};
            	margin-bottom: ${options.rowsStyle.marginBottom}px;
            	`;
                h += `
            <li data-action="editor_track" data-track="${index}" class="list-group-item p-0 text-center" style="${style}">
            	<span style="text-decoration: ${row.disabled ? 'line-through' : 'unset'};">${row.title || 'Track ' + index}</span>
            	<span class="badge badge-danger badge-pill ml-2" >${row.keyframes.length}</span>
            </li>`;
            });

            h += '</ul>';
            $('#editor_tracks').html(h);
        }

        timeline.setModel1 = timeline.setModel;
        timeline.setModel = function(opts) {
            timeline.setModel1(opts);
            timeline.initFrames();
            timeline.initTrackList();
        }
        var timestamp = $('#editor_timeStamp');
        timeline.setModel({ rows: rows });
        timeline.onTimeChanged(function(event) {
            var current = event.val;
            timestamp.html(getTime(current / 1000));
            var r = timeline.getRowByTime(current);
            if (!r) r = { group: 'empty' };

            var changed = r.group != g_cache.lastGroup; // 片段发生更改
            if (changed) {
                var showed = g_timeline.getPlayingVideo();
                if (showed.length) {
                    var video = showed.removeClass('show')[0];
                    video.pause();
                }
                g_cache.lastGroup = r.group;
            }
            var d = g_cache.groups[r.group];
            if (d) {
                var video = $(`#editor_frame video[data-group="${r.group}"]`).addClass('show')[0];
                //video.playbackRate = 1 + ((r.range[1] - r.range[0]) / video.duration / 1000);
                if (event.source == 'user') {
                    // 用户手动调整时间
                    video.currentTime = (current - r.range[0]) / 1000;
                    video.pause(); // 确保暂停
                } else {
                    if (changed) {
                        // 移到片头并自动播放
                        video.currentTime = 0;
                        video.play();
                    }
                }
            }

            // console.log(event.val + 'ms source:' + event.source);
        });
        timeline.getTrackIdWithName = function(name) {
            return timeline.getModel().rows.findIndex((row, index) => {
            	return row.title == name
            });
        }
        timeline.removeTrack = function(trackIndex){
            var source = timeline.getModel().rows;
        	 if (source[trackIndex]) {
                delete source[trackIndex];
            	timeline.setModel({ rows: source });
            }
        }

        timeline.HideTrack = function(trackIndex){
        	var track = timeline.getTrack(trackIndex);
        	 if (track) {
                track.disabled = !track.disabled;
                timeline.initTrackList();
            }
        }

        timeline.getTrack = function(trackIndex){
        	var source = timeline.getModel().rows;
        	 if (source[trackIndex]) {
                return source[trackIndex];
            }
        }

        timeline.addRows = function(trackIndex, rows) {
            var source = timeline.getModel().rows;
            if (!source[trackIndex]) {
                source[trackIndex] = [];
            }
            timeline.setModel({ rows: source[trackIndex].concat(rows) });
        }
        timeline.removeRows = function(trackIndex, rows) {
        	if(typeof(trackIndex) == 'string') trackIndex = timeline.getTrackIdWithName(trackIndex);
            var source = timeline.getModel().rows;
            if (!source[trackIndex]) return;

            for (var row of rows) {
                var find = source[trackIndex].keyframes.findIndex((v, i) => JSON.stringify(v) == JSON.stringify(row));
                if (find != -1) {
                    source[trackIndex].keyframes.splice(find, 1);
                }
            }
            timeline.setModel({ rows: source });
        }

        timeline.getRowByTime = function(time) {
            if (!timeline.keyframes) return;
            for (var group in timeline.keyframes) {
                var range = timeline.keyframes[group];
                if (time >= range[0] && time <= range[1]) {
                    return {
                        group: group,
                        range: range
                    }
                }
            }
        }
        timeline.getEndTime = function() {
            if (timeline.keyframes) {
                var keys = Object.keys(timeline.keyframes);
                return timeline.keyframes[keys[keys.length - 1]][1]
            }
            return -1;
        }

        // Select all elements on key down
        document.addEventListener('keydown', function(args) {
            if (args.which === 65 && timeline._controlKeyPressed(args)) {
                timeline.selectAllKeyframes();
                args.preventDefault();
            }
        });

        var tick = 50;
        setInterval(() => {
            if (g_timeline.paused) return;
            var time = timeline.getTime() + tick;
            if (time >= timeline.getEndTime()) {
                time = 0;
            }
            timeline.setTime(time);
        }, tick);

        var outlineContainer = document.getElementById('outline-container');

        var logMessage = function(message, log = 1) {
            if (message) {
                console.log(message);
            }
        };

        var logDraggingMessage = function(object, eventName) {
            if (object.elements) {
                logMessage('Keyframe value: ' + object.elements[0].val + '. Selected (' + object.elements.length + ').' + eventName);
            }
        };

        // timeline.onSelected(function(obj) {
        //     logMessage('selected :' + obj.selected.length + '. changed :' + obj.changed.length, 2);
        // });
        timeline.onDragStarted(function(obj) {
        	g_timeline.tryStop();
        });
        // timeline.onDrag(function(obj) {
        //     logDraggingMessage(obj, 'drag');
        // });
        // timeline.onKeyframeChanged(function(obj) {
        //     console.log(obj);
        //    	var target = obj.target;
        // });
        timeline.onDragFinished(function(obj) {
           	timeline.initFrames();
        	g_timeline.tryStart();
        });
        // timeline.onMouseDown(function(obj) {
        //     var type = obj.target ? obj.target.type : '';
        //     logMessage('mousedown:' + obj.val + '.  elements:' + type, 2);
        // });
        timeline.onDoubleClick(function(obj) {
    		delete g_timeline.doubleTarget;
    		var target = obj.target;
            var type = obj.target ? obj.target.type : '';
    		if(type == 'group'){
    			g_timeline.doubleTarget = {
    				track: target.row,
    				keyframes: target.keyframes
    			}
    			g_menu.showMenu('editor_clip', null, obj.args);
    		}
            // logMessage('doubleclick:' + obj.val + '.  elements:' + type, 2);
        });
        timeline.onScroll(function(obj) {
            // var options = timeline.getOptions();
            // if (options) {
            //     if (outlineContainer) {
            //         outlineContainer.style.minHeight = obj.scrollHeight + 'px';
            //         document.getElementById('outline-scroll-container').scrollTop = obj.scrollTop;
            //     }
            // }
        });


        // Set scroll back to timeline when mouse scroll over the outline
        function outlineMouseWheel(event) {
            if (timeline) {
                this.timeline._handleWheelEvent(event);
            }
        }
    }
}
g_timeline.init();