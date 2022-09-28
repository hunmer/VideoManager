$(function() {
    $(window).resize(function(event) {
        var maxHeight = window.screen.height,
            maxWidth = window.screen.width,
            curHeight = window.innerHeight,
            curWidth = window.innerWidth;
        var fullscreen = maxWidth == curWidth && maxHeight == curHeight;
        //$('#checkbox-fullScreen').prop('checked', fullscreen);
        // $('[data-action="fullScreen"]').find('i').attr('class', 'bi bi-fullscreen' + (fullscreen ? '-exit' : ''));
    }).resize();
});


function toggleFullScreen() {
    if (!document.fullscreenElement && // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        $(window).resize();
        return true;
    }
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
    $(window).resize();
    return false;
}