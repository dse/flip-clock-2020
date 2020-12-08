/*global FlipClock */

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
        this.enableGoodies            = options && options.enableGoodies;
        this.flipClock = new FlipClock({
            elementId:                'flip-clock',
            testRollover:             this.testRollover,
            enableGoodies:            this.enableGoodies
        });
        this.flipClock.setAnimationStyle(1);
        this.setPropertiesFromStorage();
        this.setFormValues();
        this.addEvents();
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
    },

    setPropertiesFromStorage: function () {
        var style = document.documentElement.style;
        var value;

        this.computeAndSetZoomValue();

        value = localStorage.getItem('flip-clock--twenty-four-hour');
        if (value !== null) {
            try {
                value = !!JSON.parse(value);
            } catch (e) {
                value = false;
            }
        } else {
            value = false;
        }
        this.flipClock.setIs24Hour(value);
    },

    setFormValues: function () {
        var cs = getComputedStyle(document.documentElement);

        Array.from(document.querySelectorAll('[data-flip-clock-twenty-four-hour]')).forEach(function (input) {
            var flag = this.flipClock.is24Hour;
            flag = !!flag;
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

        this.computeAndSetZoomValue();

        this.flipClock.setIs24Hour(false);
        this.setFormValues();

        try {
            localStorage.removeItem('flip-clock--twenty-four-hour');
        } catch (e) { }
    }
};
