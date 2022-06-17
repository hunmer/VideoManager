var g_video = {
    reviceFiles: function(files) {
        console.log(files);
        var res = {};
        var now = new Date().getTime();
        var i = 0;
        for (var file of files) {
            var md5 = nodejs.files.getFileMd5(file);
            res[md5] = {
                saveTo: g_data.getPathWithMd5(md5) + getFileName(file, true),
                tags: '',
                file: file,
                name: getFileName(file),
                uploader: '',
                folders: '',
                json: '{}',
                desc: '',
                date: now,
                md5: md5,
            }
        }
        g_data.insertData(res);
    },

}