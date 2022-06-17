var g_video = {

    reviceFiles: function(files){
        var res = {};
        var now = new Date().getTime();
        for(var file of files){
            var md5 = nodejs.files.getFileMd5(file);
            res[md5] = {
                 tags: '',
                 file: file,
                    name: getFileName(file),
                    uploader: '',
                    json: '{}',
                    desc: '',
                    date: now,
                    md5: md5,
            }
        }
        g_data.insertData(res);
    },

}