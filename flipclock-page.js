var fakeItalic = false;
var fontStyle = 'normal';

function main () {
    setPropertiesFromStorage();
    setFormValues();
    addEvents();
}

function addEvents() {
    document.addEventListener('change', function (event) {
        if (event.target.hasAttribute('data-flipclock-segment-foreground-color')) {
            document.documentElement.style.setProperty('--segment-foreground-color', event.target.value);
            localStorage.setItem('flipclock--segment-foreground-color', event.target.value);
        }
        if (event.target.hasAttribute('data-flipclock-segment-background-color')) {
            document.documentElement.style.setProperty('--segment-background-color', event.target.value);
            localStorage.setItem('flipclock--segment-background-color', event.target.value);
        }
        if (event.target.hasAttribute('data-flipclock-background-color')) {
            document.documentElement.style.setProperty('--background-color', event.target.value);
            localStorage.setItem('flipclock--background-color', event.target.value);
        }
        if (event.target.hasAttribute('data-flipclock-font-family')) {
            var value = event.target.options[event.target.selectedIndex].value;
            fakeItalic = event.target.options[event.target.selectedIndex].hasAttribute('data-fake-italic');
            addOrRemoveFakeItalicClass();
            document.documentElement.style.setProperty('--font-family', value);
            localStorage.setItem('flipclock--font-family', value);
        }
        if (event.target.hasAttribute('data-flipclock-font-weight')) {
            var value = event.target.options[event.target.selectedIndex].value;
            document.documentElement.style.setProperty('--font-weight', value);
            localStorage.setItem('flipclock--font-weight', value);
        }
        if (event.target.hasAttribute('data-flipclock-font-style')) {
            var value = event.target.options[event.target.selectedIndex].value;
            document.documentElement.style.setProperty('--font-style', value);
            localStorage.setItem('flipclock--font-style', value);
            fontStyle = value;
            addOrRemoveItalicClass();
        }
    });
}

function setPropertiesFromStorage() {
    if (localStorage.getItem('flipclock--segment-foreground-color')) {
        document.documentElement.style.setProperty('--segment-foreground-color', localStorage.getItem('flipclock--segment-foreground-color'));
    }
    if (localStorage.getItem('flipclock--segment-background-color')) {
        document.documentElement.style.setProperty('--segment-background-color', localStorage.getItem('flipclock--segment-background-color'));
    }
    if (localStorage.getItem('flipclock--background-color')) {
        document.documentElement.style.setProperty('--background-color', localStorage.getItem('flipclock--background-color'));
    }
    if (localStorage.getItem('flipclock--font-family')) {
        document.documentElement.style.setProperty('--font-family', localStorage.getItem('flipclock--font-family'));
    }
    if (localStorage.getItem('flipclock--font-weight')) {
        document.documentElement.style.setProperty('--font-weight', localStorage.getItem('flipclock--font-weight'));
    }
    if (localStorage.getItem('flipclock--font-style')) {
        document.documentElement.style.setProperty('--font-style', localStorage.getItem('flipclock--font-style'));
    }
}

function setFormValues() {
    var cs  = getComputedStyle(document.documentElement);
    Array.from(document.querySelectorAll('[data-flipclock-segment-foreground-color]')).forEach(function (input) {
        var value = cs.getPropertyValue('--segment-foreground-color').trim();
        input.value = value;
    });
    Array.from(document.querySelectorAll('[data-flipclock-segment-background-color]')).forEach(function (input) {
        var value = cs.getPropertyValue('--segment-background-color').trim();
        input.value = value;
    });
    Array.from(document.querySelectorAll('[data-flipclock-background-color]')).forEach(function (input) {
        var value = cs.getPropertyValue('--background-color').trim();
        input.value = value;
    });
    Array.from(document.querySelectorAll('[data-flipclock-font-family]')).forEach(function (input) {
        var value = cs.getPropertyValue('--font-family').trim();
        var option;
        if (input.tagName.toLowerCase() === 'select') {
            option = setSelectValue(input, value);
            fakeItalic = option.hasAttribute('data-fake-italic');
            addOrRemoveFakeItalicClass();
        } else {
            input.value = value;
        }
    });
    Array.from(document.querySelectorAll('[data-flipclock-font-weight]')).forEach(function (input) {
        var value = cs.getPropertyValue('--font-weight').trim();
        if (input.tagName.toLowerCase() === 'select') {
            setSelectValue(input, value);
        } else {
            input.value = value;
        }
    });
    Array.from(document.querySelectorAll('[data-flipclock-font-style]')).forEach(function (input) {
        var value = cs.getPropertyValue('--font-style').trim();
        if (input.tagName.toLowerCase() === 'select') {
            setSelectValue(input, value);
            fontStyle = value;
            addOrRemoveItalicClass();
        } else {
            input.value = value;
        }
    });
}

function setSelectValue(input, value) {
    var options;
    var option;
    options = Array.from(input.options).filter(function (option) {
        return option.value === value;
    });
    if (options.length) {
        input.selectedIndex = options[0].index;
        return options[0];
    } else {
        option = document.createElement('option');
        option.setAttribute('value', value);
        option.appendChild(document.createTextNode(value));/* label */
        input.add(option);
        input.selectedIndex = option.index;
        return option;
    }
}

function addOrRemoveFakeItalicClass() {
    Array.from(document.querySelectorAll('.flip-clock')).forEach(function (element) {
        element.classList[fakeItalic    ? 'add' : 'remove']('with-fake-italic');
        element.classList[(!fakeItalic) ? 'add' : 'remove']('without-fake-italic');
    });
}

function addOrRemoveItalicClass() {
    Array.from(document.querySelectorAll('.flip-clock')).forEach(function (element) {
        element.classList[fontStyle === 'normal'  ? 'add' : 'remove']('with-font-style--normal');
        element.classList[fontStyle === 'italic'  ? 'add' : 'remove']('with-font-style--italic');
        element.classList[fontStyle === 'oblique' ? 'add' : 'remove']('with-font-style--oblique');
    });
}

main();
