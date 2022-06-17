$(function() {
    //  $('#modal_search').modal({
    //   keyboard: false
    // });
    // $('#modal_addFiles').modal({
    //   keyboard: false
    // });
    //                         g_video.modal_search();
    // g_video.onSearchClip();
    // g_video.modal_time((tags) => {
    //            console.log(tags);
    //        })

    /* */
    // C:\Users\31540\AppData\Local\JianyingPro\User Data\Projects\com.lveditor.draft\

    // nodejs.files.getAppData()
    // 'C:\\Users\\31540\\AppData\\Roaming'
    // g_sub.setTarget('ss', 'C:/Users/31540/AppData/Local/JianyingPro/User Data/Projects/com.lveditor.draft/202204171257-副本/');


    // g_video.modal_folder('11', folder => {
    //                 console.log(folder);
    //             });

    // g_video.reviceFiles([])
    // doAction(null, 'view_fullSearch');
    // var modal = $('#modal_search');
    // fullModal(modal);
    test();
});

function test() {
    // ipc_send('checkUpdate', 'http://127.0.0.1/halfmoon/');


}


// const _ipc_send = ipc_send;
// ipc_send = (type, data) => {
//     nodejs.files.removeDir(nodejs.files.getPath('*path*/cache/')); // 删除缓存目录,不要修改

//     if (type == 'ondragstart') {
//         var r = [];
//         data.files.filter(f => f.startsWith('*path*/cuts/'))
//             .forEach(file => {
//                 let id = file.split('/').at(-1).split('.')[0];
//                 let div = domSelector({ key: id });
//                 if (!div.length) div = domSelector({ clip: id })
//                 if (div.length) {

//                     let format = '[{id}]{tag}_{note}.mp4'; // [自定义文件名格式(可修改)] id 表唯一ID, tag表标签, note表备注

//                     let spans = div.find('.card-title');
//                     let file_new = '*path*/cache/' + nodejs.files.safePath(format.replace('{tag}', spans[0].outerText).replace('{note}', spans[1].outerText).replace('{id}', id));

//                     if (nodejs.files.copy(nodejs.files.getPath(file), nodejs.files.getPath(file_new))) {
//                         r.push(file_new);
//                     }
//                 }

//             })
//         data.files = r;
//     }
//     _ipc_send(type, data);
// }

// const _parseFiles = parseFiles;
// parseFiles = files => {
//     let path = nodejs.files.getPath('*path*/cache/');
//     for (let file of files) {
//         if (file.path.startsWith(path)) return;
//     }
//     _parseFiles(files);
// }

// $('#rm_video_item .list-group').append(`
//     <a data-action="video_rename" class="list-group-item list-group-item-action " aria-current="true">
//         <i class="bi bi-input-cursor-text mr-2 me-2"></i><span>重命名</span>
//     </a>
// `);

// registerAction('video_rename', dom => {
//     let old = g_menu.target.attr('data-file');
//     prompt(old, {
//         title: '重命名文件',
//         callback: file => {
//             let v = g_video.getVideo(g_menu.key);
//             if (!v || isEmpty(file) || file == old) return;
//             nodejs.files.rename(old, file)
//             if(nodejs.files.exists(file)){
//                 v.file = file;
//                 g_video.saveVideos();
//                 toast('更改路径成功', 'alert-success')
//             }
//         }
//     })
// })