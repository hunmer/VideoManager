var _player;
var g_player = {
    url: '',
    getUrl: function() {
        return this.url;
    },
    load: function(opts, key, start = 0) {
        if (typeof(opts) == 'string') opts = {
            url: opts
        }
        this.url = opts.url;
        var thumbnails = '';

        if (key != undefined) {
            thumbnails = './thumbnails/' + key + '.jpg';
            if (!nodejs.files.exists(thumbnails)) thumbnails = '';
            opts.url = 'file://' + encodeURI(opts.url.replaceAll('\\', '/')).replaceAll('#', '%23');
        }
        opts.thumbnails = thumbnails;
        const fun = () => {
            if (_player) _player.destroy();
            var config = {
                hotkey: false,
                autoplay: true,
                volume: 1,
                container: $('#player')[0],
                screenshot: true,
                video: opts,
                   contextmenu: [
                    {
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
                ],
            };
            var sub = './subs/' + key + '.vtt';
            if(nodejs.files.exists(sub)){
                config.subtitle = {
                    url: sub,
                }
            }
            _player = new DPlayer(config)
            _player.on('loadeddata', function(e) {
                g_sub.loadSub(key);
                if(start) _player.video.currentTime = start;
                _player.video.play();
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
        $('.dplayer-bar-preview').css('backgroundImage', 'unset').css('backgroundImage', 'url("' + url + '")')
        // _player && !_player.video.paused;
    },
    isPlaying: function() {
        return _player && !_player.video.paused;
    },
    playVideo: function(play) {
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
    getCurrentTime: function() {
        return _player.video.currentTime;
    },
    setCurrentTime: function(time, play = false) {
        var video = _player.video;
        if (video) {
            video.currentTime = time;
            play && video.play();
        }
    }

}