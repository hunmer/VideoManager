var _player;
var g_player = {
    url: '',
    video: undefined,
    init: function(){
        this.reset();
    },
    reset: function(){
        $('#player').html(`
             <div class="card text-center rounded" data-action="addfiles" style="width: 18rem;margin: 0 auto;top: 25%;">
                <i class="bi bi-plus" style="font-size: 4rem;"></i>
                <div class="card-body">
                    <p class="card-text">拖放视频文件到此完成导入</p>
                    <p style="font-size: 12px;">支持 mp4 flv ts m3u8 mdp 等文件</p>
                </div>
            </div>
        `);
    },
    getUrl: function() {
        return this.url;
    },
    destrory: function(){
        if(_player){
            _player.destroy();
            _player = undefined;
        }
        g_video.clearInput();
        this.reset();

    },
    load: function(opts, key, start = 0) {
        if (typeof(opts) == 'string') opts = {
            url: opts
        }
        this.url = opts.url;
        var thumbnails = '';

        if (key != undefined) {
            thumbnails = nodejs.files.getPath('*path*/thumbnails/' + key + '.jpg');
            if (!nodejs.files.exists(thumbnails)) thumbnails = '';
            opts.url = 'file://' + encodeURI(opts.url.replaceAll('\\', '/')).replaceAll('#', '%23');
        }

        var ext = popString(opts.url, '.').toLowerCase();
        if (ext == 'ts') {
            //opts.type = 'ts';
            var file = nodejs.files.getPath('*path*/cache/'+key+'.m3u8');
            nodejs.files.write(file, `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-TARGETDURATION:19\n#EXT-X-PLAYLIST-TYPE:VOD\n${opts.url}\n#EXT-X-ENDLIST`);
            opts.url = file;
        }

        opts.thumbnails = thumbnails;
        const fun = () => {
            g_player.destrory();
            var config = {
                hotkey: false,
                autoplay: false,
                volume: 1,
                container: $('#player')[0],
                screenshot: true,
                video: Object.assign({
                    customType: {
                        /*ts: function(video, player) {
                            loadRes([
                                { url: './plugins/mux.min.js', type: 'js' },
                            ], () => {
                                // Create array of TS files to play
                                segments = [opts.url];

                                // Replace this value with your files codec info
                                mime = 'video/mp4; codecs="mp4a.40.2,avc1.64001f"';

                                let mediaSource = new MediaSource();
                                let transmuxer = new muxjs.mp4.Transmuxer();

                                video.src = URL.createObjectURL(mediaSource);
                                mediaSource.addEventListener("sourceopen", appendFirstSegment);

                                function appendFirstSegment() {
                                    // if (segments.length == 0) return;
                                    URL.revokeObjectURL(video.src);
                                    sourceBuffer = mediaSource.addSourceBuffer(mime);
                                    sourceBuffer.addEventListener('updateend', appendNextSegment);

                                    transmuxer.on('data', (segment) => {
                                        let data = new Uint8Array(segment.initSegment.byteLength + segment.data.byteLength);
                                        data.set(segment.initSegment, 0);
                                        data.set(segment.data, segment.initSegment.byteLength);
                                        console.log(muxjs.mp4.tools.inspect(data));
                                        sourceBuffer.appendBuffer(data);
                                    })

                                    fetch(segments.shift()).then((response) => {
                                        return response.arrayBuffer();
                                    }).then((response) => {
                                        transmuxer.push(new Uint8Array(response));
                                        transmuxer.flush();
                                    })
                                }

                                function appendNextSegment() {
                                    // reset the 'data' event listener to just append (moof/mdat) boxes to the Source Buffer
                                    transmuxer.off('data');
                                    transmuxer.on('data', (segment) => {
                                        sourceBuffer.appendBuffer(new Uint8Array(segment.data));
                                    })

                                    if (segments.length == 0) {
                                        // notify MSE that we have no more segments to append.
                                        mediaSource.endOfStream();
                                    }

                                    segments.forEach((segment) => {
                                        // fetch the next segment from the segments array and pass it into the transmuxer.push method
                                        fetch(segments.shift()).then((response) => {
                                            return response.arrayBuffer();
                                        }).then((response) => {
                                            transmuxer.push(new Uint8Array(response));
                                            transmuxer.flush();
                                        })
                                    })
                                }
                            })
                        }*/
                    }
                }, opts),
                contextmenu: [{
                        text: '设为封面',
                        click: player => {
                            doAction(null, 'setVideoCover');
                        },
                    },
                    {
                        text: '生成进度条预览图',
                        click: player => {
                            doAction(null, 'videoThumb');
                        },
                    },
                     {
                        text: '关闭文件',
                        click: player => {
                            g_player.destrory();
                        },
                    },
                ],
            }


            var sub = nodejs.files.getPath('*path*/subs/' + key + '.vtt');
            if (nodejs.files.exists(sub)) {
                config.subtitle = {
                    url: sub,
                }
            }
            _player = new DPlayer(config)
            _player.on('loadeddata', function(e) {
                g_sub.loadSub(key);
<<<<<<< HEAD
                g_player.setCurrentTime(start, getConfig('autoPlayVideo', true));
=======
                if (start) _player.video.currentTime = start;
>>>>>>> a44b4bfbf8a7864186f647daef0a7bdf219a2e1a
                if(!g_cache.firstLoaded){
                    g_cache.firstLoaded = true;
                    _player.video.play();
                }
                // var self.autoSave = setInterval(() => {
                // })
            });
            _player.on('fullscreen', function(e) {
                g_player.onFullscreen(true);
            });
            _player.on('webfullscreen', function(e) {
                g_player.onFullscreen(true);
            });
            _player.on('fullscreen_cancel', function(e) {
                g_player.onFullscreen(false);
            });
            _player.on('webfullscreen_cancel', function(e) {
                g_player.onFullscreen(false);
            });

            /*
             <div class="dropup">
                    <button type="button" class="btn btn-outline-light  dropdown-toggle mr-2" style="height: 15px;padding: 2.5px;line-height: 15px;" data-action="clipList">
                    </button>
                    
                </div>
            */
            $(`
                    <div id="layout_video_range" class="hide" style="display: inline-flex;">
                    <div class="dropup" data-dropdown="clipList">
                        <button type="button" class="btn btn-outline-light mr-2" style="height: 15px;padding: 2.5px;line-height: 15px;" data-toggle="dropdown" aria-expanded="false" data-offset="0,30">
                            <i class="bi bi-list"></i>
                      </button>
                      <div class="dropdown-menu text-muted" style="max-width: 200px;max-height: 300px;overflow-y: auto;">
                        </div>
                    </div>

                     <input class="text-light bg-transparent time_start" type="text" value="" placeholder="起点" style="width: 65px;"></input>
                     <input class="text-light bg-transparent time_end mr-1" type="text" value="" placeholder="终点" style="width: 65px;" ></input>
                    <button type="button" class="btn btn-outline-light" style="height: 15px;padding: 2.5px;line-height: 15px;" data-action="addPos" data-contenx="resetPos"><i class="bi bi-check"></i></button>
                    </div>
                `).prependTo('.dplayer-icons-right');
        }
        var load;
        var ext = popString(opts.url, '.').toLowerCase();
        if (ext == 'm3u8') {
            load = ['hls.min.js', 'hls'];
        } else
        if (ext == 'flv') {
            load = ['flv.min.js', 'flv'];
        } else
        if (ext == 'mpd') {
            load = ['dash.all.min.js', 'dash'];
        } else
        if (ext == 'torrent') {
            load = ['webtorrent.min.js', 'webtorrent'];
        } else {
            fun();
            return;
        }
        loadRes([
            { url: './plugins/dplayer/' + load[0], type: 'js' },
        ], () => {
            opts.type = load[1];
            fun();
        })
    },
    tryStop: function() {
        this.playing_old = this.isPlaying();
        this.playVideo(false);
    },
    tryStart: function() {
        if (this.playing_old) {
            this.playing_old = false;
            this.playVideo(true);
        }
    },
    onFullscreen: function(full) {
        g_cache.fullScreen = full;
        domSelector({action: 'showlist'}).toggleClass('hide', full);
        var div = $('#layout_video_range').toggleClass('hide', !full);
        if (full) {
            if (!$('#alert_video').length) {
                $(`<div id="alert_video" data-style="alert-warning" class="alert alert-warning alert-dismissible hide" role="alert" style="height: fit-content;
                    position: absolute;
                    right: 10px;
                    top: 20px;
                    z-index: 99999;">
                      <span class="text">sdsd</span>
                      <button type="button" class="close" data-dismiss="alert" aria-label="Close" style="padding: 7px;">
                        <span aria-hidden="true">&times;</span>
                      </button>
                    </div>
                    `).appendTo('#player');
            }
        } else {
            $('#alert_video').remove();
        }
    },
    setVideothumbnails: function(url) {
        toast('成功生成视频时间线缩略图,可以在进度条查看效果', 'alert-success');
        g_video.reloadVideo();
        //$('.dplayer-bar-preview').css('backgroundImage', '').css('backgroundImage', 'url("' + url + '")')
        // _player && !_player.video.paused;
    },
    isPlaying: function() {
        return _player && !_player.video.paused;
    },
    playVideo: function(play) {
        if(!_player) return;
        var video = _player.video;
        if (video) {
            if (play == undefined) play = video.paused;
            if (play) {
                video.play();
            } else {
                video.pause();
            }
        }
    },
    getDuration: function() {
        return _player.video.duration || -1;
    },
    getCurrentTime: function() {
        return _player.video.currentTime || -1;
    },
    addTime: function(time){
        var t = this.getCurrentTime();
        if(t != -1){
            var duration =  this.getDuration();
            if(typeof(time) == 'string' && time.substr(-1) ==  '%'){
                time = time.replace('%', '') / 100 * duration;
            }
            t += time;
            if(t < 0) t = 0;
            t = Math.min(t, duration);
            _player.seek(t);
        }
    },
    setCurrentTime: function(time, play = false) {
        if(!_player) return;
        var video = _player.video;
        if (video) {
            video.currentTime = time;
            play && video.play();
        }
    }

}
g_player.init();