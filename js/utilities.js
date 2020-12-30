function alterURL(url) {
    if (window.hasCacheBuster) {
        if (/\?/.test(url)) {
            url += '&cachebuster=' + new Date().getTime();
        } else {
            url += '?cachebuster=' + new Date().getTime();
        }
    }
    return url;
}
function appendCSS(url, options) {
    url = alterURL(url);
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
}
function appendJS(url, options) {
    url = alterURL(url);
    var script = document.createElement('script');
    script.src = url;
    script.defer = !!(options && options.defer);
    document.head.appendChild(script);
}
function removeElement(element) {
    element.parentNode.removeChild(element);
}
function forEachSearchParam(callback) {
    location.search.replace(/^\?/, '').replace(/\+/g, ' ').split(/&/).forEach(function (nv) {
        if (nv === '') {
            return;
        }
        var n, v, matches = /=/.exec(nv);
        if (matches) {
            n = decodeURIComponent(nv.slice(0, matches[0].start));
            v = decodeURIComponent(nv.slice(matches[0].start + 1));
        } else {
            n = decodeURIComponent(nv);
            v = '';
        }
        callback(n, v);
    });
}

