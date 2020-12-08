/*global checkfont */

function getFontFamily(element) {
    var fontFamily;
    if (element.currentStyle) {
        return element.currentStyle.fontFamily;
    } else if (document.defaultView) {
        return document.defaultView.getComputedStyle(element, null).getPropertyValue("font-family");
    }
    return null;
}

function splitFontFamily(fontFamily) {
    var rx = /^\s*(?:'([^']*)'|"([^"]*)"|([^'",\s]*))(?:\s*,\s*|\s*$)?/;
    var result = [];
    var matches;
    var fontFamilyName;
    /*jshint -W126 */
    while (/\S/.test(fontFamily) && (matches = rx.exec(fontFamily))) {
        if (matches[1] !== null && matches[1] !== undefined) {
            result.push(matches[1]);
        } else if (matches[2] !== null && matches[2] !== undefined) {
            result.push(matches[2]);
        } else if (matches[3] !== null && matches[3] !== undefined) {
            result.push(matches[3]);
        } else {
            break;
        }
        fontFamily = String(fontFamily).substring(matches.index + matches[0].length);
    }
    return result;
}

function getWhichFontFamily(element) {
    var families = splitFontFamily(getFontFamily(element));
    var result;
    families.forEach(function (family) {
        if (result !== null && result !== undefined) {
            return;
        }
        if (checkfont(family)) {
            result = family;
        }
    });
    return result;
}
