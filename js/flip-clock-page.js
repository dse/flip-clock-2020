function empty(value) {
    return value !== value || value === undefined || value === null || value === '';
    //     ^^^^^^^^^^^^^^^
    //     is true iff value is NaN
}

var FlipClockPage = {
    fakeItalic: false,
    fontStyle: 'normal',
    testRollover: undefined,

    avoidTextSelection: function () {
        // thanks https://stackoverflow.com/questions/3779534/how-do-i-disable-text-selection-with-css-or-javascript
        var sel = {};
        if (window.getSelection) { // Moz
            sel = window.getSelection();
        } else if (document.selection) { // IE
            sel = document.selection.createRange();
        }
        if (sel.rangeCount) {   // Moz
            sel.removeAllRanges();
            return;
        }
        if (sel.text > '') {    // IE
            document.selection.empty();
            return;
        }
    },

    init: function (options) {
        this.enableThemeConfiguration = options && options.enableThemeConfiguration;
        this.enableGoodies            = options && options.enableGoodies;
        this.flipClock = new FlipClock({
            elementId:                'flip-clock',
            testRollover:             this.testRollover,
            enableThemeConfiguration: this.enableThemeConfiguration,
            enableGoodies:            this.enableGoodies
        });
        this.flipClock.setAnimationStyle(1);
        this.setPropertiesFromStorage();
        this.setFormValues();
        this.addEvents();
    },

    setSegmentForegroundColor: function (color) {
        this.segmentForegroundColor = color;
        var style = document.documentElement.style;
        if (style && style.setProperty) {
            if (!empty(color)) {
                style.setProperty('--segment-foreground-color', color);
            } else {
                style.removeProperty('--segment-foreground-color');
            }
        }
    },

    setSegmentBackgroundColor: function (color) {
        this.segmentBackgroundColor = color;
        var style = document.documentElement.style;
        if (style && style.setProperty) {
            if (!empty(color)) {
                style.setProperty('--segment-background-color', color);
            } else {
                style.removeProperty('--segment-background-color');
            }
        }
    },

    setBackgroundColor: function (color) {
        this.backgroundColor = color;
        var style = document.documentElement.style;
        if (style && style.setProperty) {
            if (!empty(color)) {
                style.setProperty('--background-color', color);
            } else {
                style.removeProperty('--background-color');
            }
        }
    },

    setFontFamily: function (fontFamily) {
        this.fontFamily = fontFamily;
        var style = document.documentElement.style;
        if (style && style.setProperty) {
            if (!empty(fontFamily)) {
                style.setProperty('--font-family', fontFamily);
            } else {
                style.removeProperty('--font-family');
            }
        }
    },

    setFontWeight: function (fontWeight) {
        this.fontWeight = fontWeight;
        var style = document.documentElement.style;
        if (style && style.setProperty) {
            if (!empty(fontWeight)) {
                style.setProperty('--font-weight', fontWeight);
            } else {
                style.removeProperty('--font-weight');
            }
        }
    },

    setFontStyle: function (fontStyle) {
        this.fontStyle = fontStyle;
        var style = document.documentElement.style;
        if (style && style.setProperty) {
            if (!empty(fontStyle)) {
                style.setProperty('--font-style', fontStyle);
            } else {
                style.removeProperty('--font-style');
            }
        }
    },

    clearZoomValue: function () {
        Array.from(document.querySelectorAll('.flip-clock-line-inner')).forEach(function (inner) {
            inner.style.fontSize = '';
        });
    },

    setZoomValue: function (value) {
        Array.from(document.querySelectorAll('.flip-clock-line-inner')).forEach(function (inner) {
            inner.style.fontSize = (value * 100) + '%';
        });
    },

    computeAndSetZoomValue: function () {
        this.clearZoomValue();
        var maxWidth;
        Array.from(document.querySelectorAll('.flip-clock-line-inner')).forEach(function (line) {
            if (maxWidth === undefined || maxWidth < line.clientWidth) {
                maxWidth = line.clientWidth;
            }
        });
        this.setZoomValue(document.body.clientWidth / maxWidth * 0.95);
    },

    addThemeEvents: function () {
        var formChangeHandler = function (event) {
            var style = document.documentElement.style;
            if (event.target.hasAttribute('data-flip-clock-segment-foreground-color')) {
                this.setSegmentForegroundColor(event.target.value);
                this.computeAndSetZoomValue();
                try { localStorage.setItem('flip-clock--segment-foreground-color', event.target.value); } catch (e) { }
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-segment-background-color')) {
                this.setSegmentBackgroundColor(event.target.value);
                this.computeAndSetZoomValue();
                try { localStorage.setItem('flip-clock--segment-background-color', event.target.value); } catch (e) { }
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-background-color')) {
                this.setBackgroundColor(event.target.value);
                this.computeAndSetZoomValue();
                try { localStorage.setItem('flip-clock--background-color', event.target.value); } catch (e) { }
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-font-family')) {
                var value = event.target.options[event.target.selectedIndex].value;
                this.fakeItalic = event.target.options[event.target.selectedIndex].hasAttribute('data-fake-italic');
                this.addOrRemoveFakeItalicClass();
                this.setFontFamily(value);
                this.computeAndSetZoomValue();
                try { localStorage.setItem('flip-clock--font-family', value); } catch (e) { }
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-font-weight')) {
                var value = event.target.options[event.target.selectedIndex].value;
                this.setFontWeight(value);
                this.computeAndSetZoomValue();
                try { localStorage.setItem('flip-clock--font-weight', value); } catch (e) { }
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-font-style')) {
                var value = event.target.options[event.target.selectedIndex].value;
                this.setFontStyle(value);
                this.fontStyle = value;
                this.addOrRemoveItalicClass();
                this.computeAndSetZoomValue();
                try { localStorage.setItem('flip-clock--font-style', value); } catch (e) { }
                event.preventDefault();
            }
        }.bind(this);

        document.addEventListener('change', formChangeHandler);
    },

    addGoodyEvents: function () {
        var addDeltaForFunHandler = function (event) {
            var element = event.target.closest('.flip-clock-segment');
            if (!element) {
                return;
            }
            this.avoidTextSelection();
            var id = element.getAttribute('data-segment-id');
            if (!id) {
                return;
            }
            var segment = Segment.segmentsById[id];
            if (!segment) {
                return;
            }
            segment.addDeltaForFun();
            event.preventDefault();
        }.bind(this);

        document.addEventListener('click', addDeltaForFunHandler);
    },

    addEvents: function () {
        var formCheckboxHandler = function (event) {
            var checked;
            if (event.target.hasAttribute('data-flip-clock-twenty-four-hour')) {
                this.avoidTextSelection();
                checked = event.target.checked;
                this.flipClock.setIs24Hour(checked);
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-enable-ticks')) {
                this.avoidTextSelection();
                this.flipClock.enableAudioByUserRequest();
                checked = event.target.checked;
                this.flipClock.setEnableTicks(checked);
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-enable-seconds-ticks')) {
                this.avoidTextSelection();
                this.flipClock.enableAudioByUserRequest();
                checked = event.target.checked;
                this.flipClock.setEnableSecondsTicks(checked);
                event.preventDefault();
            }
        }.bind(this);

        var setDefaultsHandler = function (event) {
            if (!event.target.closest('[data-flip-clock-set-defaults]')) {
                return;
            }
            this.avoidTextSelection();
            this.setDefaults();
            event.preventDefault();
        }.bind(this);

        var reloadHandler = function (event) {
            if (!event.target.closest('[data-flip-clock-reload]')) {
                return;
            }
            location.reload();
        }.bind(this);

        var resetHandler = function (event) {
            if (!event.target.closest('[data-flip-clock-reset]')) {
                return;
            }
            this.avoidTextSelection();
            this.flipClock.resetDeltaForFun();
        }.bind(this);

        document.addEventListener('input', formCheckboxHandler);
        document.addEventListener('change', formCheckboxHandler);
        document.addEventListener('click', setDefaultsHandler);
        document.addEventListener('click', reloadHandler);
        document.addEventListener('click', resetHandler);

        if (this.enableGoodies) {
            this.addGoodyEvents();
        }
        if (this.enableThemeConfiguration) {
            this.addThemeEvents();
        }
    },

    setPropertiesFromStorage: function () {
        var style = document.documentElement.style;
        var value;

        if (this.enableThemeConfiguration) {
            if ((value = localStorage.getItem('flip-clock--segment-foreground-color'))) {
                this.setSegmentForegroundColor(value);
            }
            if ((value = localStorage.getItem('flip-clock--segment-background-color'))) {
                this.setSegmentBackgroundColor(value);
            }
            if ((value = localStorage.getItem('flip-clock--background-color'))) {
                this.setBackgroundColor(value);
            }
            if ((value = localStorage.getItem('flip-clock--font-family'))) {
                this.setFontFamily(value);
            }
            if ((value = localStorage.getItem('flip-clock--font-weight'))) {
                this.setFontWeight(value);
            }
            if ((value = localStorage.getItem('flip-clock--font-style'))) {
                this.setFontStyle(value);
            }
        }
        this.computeAndSetZoomValue();

        value = localStorage.getItem('flip-clock--twenty-four-hour');
        console.debug("FlipClockPage: localStorage.getItem('flip-clock--twenty-four-hour') returned " + JSON.stringify(value));
        if (value !== null) {
            try {
                value = !!JSON.parse(value);
            } catch (e) {
                value = false;
            }
        } else {
            value = false;
        }
        console.debug("value is now " + JSON.stringify(value) + "; setting is24Hour to it");
        this.flipClock.setIs24Hour(value);
    },

    setFormValues: function () {
        var cs = getComputedStyle(document.documentElement);

        if (this.enableThemeConfiguration) {
            Array.from(document.querySelectorAll('[data-flip-clock-segment-foreground-color]')).forEach(function (input) {
                try {
                    var value = cs.getPropertyValue('--segment-foreground-color').trim();
                    this.setInputValue(input, value);
                } catch (e) { }
            }.bind(this));
            Array.from(document.querySelectorAll('[data-flip-clock-segment-background-color]')).forEach(function (input) {
                try {
                    var value = cs.getPropertyValue('--segment-background-color').trim();
                    this.setInputValue(input, value);
                } catch (e) { }
            }.bind(this));
            Array.from(document.querySelectorAll('[data-flip-clock-background-color]')).forEach(function (input) {
                try {
                    var value = cs.getPropertyValue('--background-color').trim();
                    this.setInputValue(input, value);
                } catch (e) { }
            }.bind(this));
            Array.from(document.querySelectorAll('[data-flip-clock-font-family]')).forEach(function (input) {
                try {
                    var value = cs.getPropertyValue('--font-family').trim();
                    var option;
                    if (input.tagName.toLowerCase() === 'select') {
                        option = this.setSelectValue(input, value);
                        this.fakeItalic = option.hasAttribute('data-fake-italic');
                        this.addOrRemoveFakeItalicClass();
                        this.computeAndSetZoomValue();
                    } else {
                        this.setInputValue(input, value);
                    }
                } catch (e) { }
            }.bind(this));
            Array.from(document.querySelectorAll('[data-flip-clock-font-weight]')).forEach(function (input) {
                try {
                    var value = cs.getPropertyValue('--font-weight').trim();
                    if (input.tagName.toLowerCase() === 'select') {
                        this.setSelectValue(input, value);
                    } else {
                        this.setInputValue(input, value);
                    }
                } catch (e) { }
            }.bind(this));
            Array.from(document.querySelectorAll('[data-flip-clock-font-style]')).forEach(function (input) {
                try {
                    var value = cs.getPropertyValue('--font-style').trim();
                    if (input.tagName.toLowerCase() === 'select') {
                        this.setSelectValue(input, value);
                        this.fontStyle = value;
                        this.addOrRemoveItalicClass();
                    } else {
                        this.setInputValue(input, value);
                    }
                } catch (e) { }
            }.bind(this));
        }
        Array.from(document.querySelectorAll('[data-flip-clock-twenty-four-hour]')).forEach(function (input) {
            var flag = this.flipClock.is24Hour;
            console.debug("FlipClockPage: is24Hour is " + JSON.stringify(flag));
            flag = !!flag;
            console.debug("FlipClockPage: setting checked flag on 24-hour checkbox to " + JSON.stringify(flag));
            input.checked = flag;
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flip-clock-enable-ticks]')).forEach(function (input) {
            input.checked = false;
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flip-clock-enable-seconds-ticks]')).forEach(function (input) {
            input.checked = false;
        }.bind(this));
    },

    setInputValue: function (input, value) {
        if (input.tagName.toLowerCase() === 'select') {
            return this.setSelectValue(input, value);
        }
        if (input.tagName.toLowerCase() === 'input' && input.type === 'checkbox') {
            input.checked = true;
            return input;
        }
        input.value = value;
        return input;
    },

    setSelectValue: function (input, value) {
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
    },

    addOrRemoveFakeItalicClass: function () {
        Array.from(document.querySelectorAll('.flip-clock')).forEach(function (element) {
            element.classList[this.fakeItalic    ? 'add' : 'remove']('with-fake-italic');
            element.classList[(!this.fakeItalic) ? 'add' : 'remove']('without-fake-italic');
        }.bind(this));
    },

    addOrRemoveItalicClass: function () {
        Array.from(document.querySelectorAll('.flip-clock')).forEach(function (element) {
            element.classList[this.fontStyle === 'normal'  ? 'add' : 'remove']('with-font-style--normal');
            element.classList[this.fontStyle === 'italic'  ? 'add' : 'remove']('with-font-style--italic');
            element.classList[this.fontStyle === 'oblique' ? 'add' : 'remove']('with-font-style--oblique');
        }.bind(this));
    },

    setDefaults: function () {
        var style = document.documentElement.style;

        if (this.enableThemeConfiguration) {
            this.setSegmentForegroundColor(undefined);
            this.setSegmentBackgroundColor(undefined);
            this.setBackgroundColor(undefined);
            this.setFontFamily(undefined);
            this.setFontWeight(undefined);
            this.setFontStyle(undefined);
            this.fakeItalic = false;
            this.fontStyle = 'normal';
            this.addOrRemoveFakeItalicClass();
            this.addOrRemoveItalicClass();
        }

        this.computeAndSetZoomValue();

        this.flipClock.setIs24Hour(false);
        this.setFormValues();

        if (this.enableThemeConfiguration) {
            try {
                localStorage.removeItem('flip-clock--segment-foreground-color');
                localStorage.removeItem('flip-clock--segment-background-color');
                localStorage.removeItem('flip-clock--background-color');
                localStorage.removeItem('flip-clock--font-family');
                localStorage.removeItem('flip-clock--font-weight');
                localStorage.removeItem('flip-clock--font-style');
            } catch (e) { }
        }

        try {
            localStorage.removeItem('flip-clock--twenty-four-hour');
        } catch (e) { }
    }
};
