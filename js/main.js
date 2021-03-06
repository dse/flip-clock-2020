/*jshint -W126 */

function loadScriptSync(url, options) {
    "use strict";
    var xhr = new window.XMLHttpRequest();
    xhr.open('GET', url, Boolean(options && options.async));
    if (!(options && options.noAcceptHeader)) {
        xhr.setRequestHeader('Accept', 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01');
    }
    if (!(options && options.crossDomain)) {
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); // not for cross-domain
    }
    var callback = options && options.onload;
    xhr.onload = function () {
        if (!(xhr.status === 0 || xhr.status === 200)) {
            return;
        }
        var script = document.createElement('script');
        script.text = xhr.responseText;
        document.head.appendChild(script).parentNode.removeChild(script);
        if (callback) {
            callback();
        }
    };
    xhr.send(null);
}

var cacheBuster = window.hasCacheBuster ? ('?cacheBuster=' + new Date().getTime()) : '';

loadScriptSync('/c/js/polyfills.js' + cacheBuster);
loadScriptSync('/c/js/timer.js' + cacheBuster);
loadScriptSync('/c/js/jfont-checker.js' + cacheBuster);
loadScriptSync('/c/js/which-font-family.js' + cacheBuster);
loadScriptSync('/c/js/audio-ticker.js' + cacheBuster);
loadScriptSync('/c/js/flip-clock.js' + cacheBuster);
loadScriptSync('/c/js/flip-clock-page.js' + cacheBuster);
