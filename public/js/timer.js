var g_timer = {
    list: {},
    addTimer: function(id, time, callback, type = '') {
        if (this.list[id]) clearTimeout(this.list[id].timer);
        this.list[name] = {
            timer: setTimeout(() => {
                delete g_timer.list[name];
                callback();
            }, time)
        }
    },
}

