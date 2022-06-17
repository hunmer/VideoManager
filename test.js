setInterval(() => console.log(new Date().getTime()), 1000);
var files = require('./file.js');
var path = require('path');
for (var file of ['1653392023764', '1653355177436', '1653449305972', '1653542850961', '1653096186964', '1653097363435', '1653354809524', '1653532915683', '1653110399355']) {
    files.copyWithCallback(`I:\\videoManager\\resources\\app\\cuts\\${file}.mp4`, 'I:\\a\\' + path.basename(file) + '.mp4', file, (err, file) => {
        console.log(err, file);
    });
}