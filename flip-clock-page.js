var FlipClockPage = {
    fakeItalic: false,
    fontStyle: 'normal',
    init: function () {
        this.flipClock = new FlipClock('flip-clock');
        this.flipClock.setAnimationStyle(1);
        this.setPropertiesFromStorage();
        this.setFormValues();
        this.addEvents();
    },
    addEvents: function () {
        var flipWrapHandler = (event) => {
            var element = event.target.closest('.flip-clock-segment');
            if (!element) {
                return;
            }
            var id = element.getAttribute('data-segment-id');
            if (!id) {
                return;
            }
            var segment = Segment.segmentsById[id];
            if (!segment) {
                return;
            }
            segment.flipWrap();
            event.preventDefault();
        };
        var formChangeHandler = (event) => {
            var style = document.documentElement.style;
            if (event.target.hasAttribute('data-flip-clock-segment-foreground-color')) {
                style.setProperty('--segment-foreground-color', event.target.value);
                localStorage.setItem('flip-clock--segment-foreground-color', event.target.value);
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-segment-background-color')) {
                style.setProperty('--segment-background-color', event.target.value);
                localStorage.setItem('flip-clock--segment-background-color', event.target.value);
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-background-color')) {
                style.setProperty('--background-color', event.target.value);
                localStorage.setItem('flip-clock--background-color', event.target.value);
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-font-family')) {
                var value = event.target.options[event.target.selectedIndex].value;
                this.fakeItalic = event.target.options[event.target.selectedIndex].hasAttribute('data-fake-italic');
                this.addOrRemoveFakeItalicClass();
                style.setProperty('--font-family', value);
                localStorage.setItem('flip-clock--font-family', value);
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-font-weight')) {
                var value = event.target.options[event.target.selectedIndex].value;
                style.setProperty('--font-weight', value);
                localStorage.setItem('flip-clock--font-weight', value);
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-font-style')) {
                var value = event.target.options[event.target.selectedIndex].value;
                style.setProperty('--font-style', value);
                localStorage.setItem('flip-clock--font-style', value);
                this.fontStyle = value;
                this.addOrRemoveItalicClass();
                event.preventDefault();
            }
        };
        var formCheckboxHandler = (event) => {
            if (event.target.hasAttribute('data-flip-clock-twenty-four-hour')) {
                var checked = event.target.checked; // is twenty-four hour?
                console.log('SET ITEM flip-clock--twenty-four-hour => ' + JSON.stringify(checked));
                localStorage.setItem('flip-clock--twenty-four-hour', JSON.stringify(checked));
                this.flipClock.set24Hour(checked);
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-flip-clock-enable-audio')) {
                var checked = event.target.checked; // is twenty-four hour?
                localStorage.setItem('flip-clock--enable-audio', JSON.stringify(checked));
                this.flipClock.setEnableAudio(checked);
                event.preventDefault();
            }
        };
        var setDefaultsHandler = (event) => {
            if (!event.target.closest('[data-flip-clock-set-defaults]')) {
                return;
            }
            this.setDefaults();
            event.preventDefault();
        };
        var happyHandler = (event) => {
            if (!event.target.closest('[data-flip-clock-happy]')) {
                return;
            }
            this.flipClock.flipWrap();
            event.preventDefault();
        };
        document.addEventListener('click', flipWrapHandler);
        document.addEventListener('change', formChangeHandler);
        document.addEventListener('input', formCheckboxHandler);
        document.addEventListener('change', formCheckboxHandler);
        document.addEventListener('click', setDefaultsHandler);
        document.addEventListener('click', happyHandler);
    },
    setPropertiesFromStorage: function () {
        var style = document.documentElement.style;
        var value;
        if ((value = localStorage.getItem('flip-clock--segment-foreground-color'))) {
            style.setProperty('--segment-foreground-color', value);
        }
        if ((value = localStorage.getItem('flip-clock--segment-background-color'))) {
            style.setProperty('--segment-background-color', value);
        }
        if ((value = localStorage.getItem('flip-clock--background-color'))) {
            style.setProperty('--background-color', value);
        }
        if ((value = localStorage.getItem('flip-clock--font-family'))) {
            style.setProperty('--font-family', value);
        }
        if ((value = localStorage.getItem('flip-clock--font-weight'))) {
            style.setProperty('--font-weight', value);
        }
        if ((value = localStorage.getItem('flip-clock--font-style'))) {
            style.setProperty('--font-style', value);
        }
        if ((value = localStorage.getItem('flip-clock--twenty-four-hour')) !== null) {
            console.log('GET ITEM flip-clock--twenty-four-hour => ' + JSON.stringify(value));
            try {
                value = !!JSON.parse(value);
            } catch (e) {
                value = false;
            }
            this.flipClock.set24Hour(value);
        }
        if ((value = localStorage.getItem('flip-clock--enable-audio')) !== null) {
            try {
                value = !!JSON.parse(value);
            } catch (e) {
                value = false;
            }
            this.flipClock.setEnableAudio(value);
        }
    },
    setFormValues: function () {
        var cs  = getComputedStyle(document.documentElement);
        Array.from(document.querySelectorAll('[data-flip-clock-segment-foreground-color]')).forEach(function (input) {
            var value = cs.getPropertyValue('--segment-foreground-color').trim();
            this.setInputValue(input, value);
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flip-clock-segment-background-color]')).forEach(function (input) {
            var value = cs.getPropertyValue('--segment-background-color').trim();
            this.setInputValue(input, value);
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flip-clock-background-color]')).forEach(function (input) {
            var value = cs.getPropertyValue('--background-color').trim();
            this.setInputValue(input, value);
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flip-clock-font-family]')).forEach(function (input) {
            var value = cs.getPropertyValue('--font-family').trim();
            var option;
            if (input.tagName.toLowerCase() === 'select') {
                option = this.setSelectValue(input, value);
                this.fakeItalic = option.hasAttribute('data-fake-italic');
                this.addOrRemoveFakeItalicClass();
            } else {
                this.setInputValue(input, value);
            }
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flip-clock-font-weight]')).forEach(function (input) {
            var value = cs.getPropertyValue('--font-weight').trim();
            if (input.tagName.toLowerCase() === 'select') {
                this.setSelectValue(input, value);
            } else {
                this.setInputValue(input, value);
            }
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flip-clock-font-style]')).forEach(function (input) {
            var value = cs.getPropertyValue('--font-style').trim();
            if (input.tagName.toLowerCase() === 'select') {
                this.setSelectValue(input, value);
                this.fontStyle = value;
                this.addOrRemoveItalicClass();
            } else {
                this.setInputValue(input, value);
            }
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flip-clock-twenty-four-hour]')).forEach(function (input) {
            var flag = this.flipClock.is24Hour;
            input.checked = !!flag;
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flip-clock-enable-audio]')).forEach(function (input) {
            var flag = this.flipClock.enableAudio;
            input.checked = !!flag;
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
        style.removeProperty('--segment-foreground-color');
        style.removeProperty('--segment-background-color');
        style.removeProperty('--background-color');
        style.removeProperty('--font-family');
        style.removeProperty('--font-weight');
        style.removeProperty('--font-style');
        this.fakeItalic = false;
        this.fontStyle = 'normal';
        this.addOrRemoveFakeItalicClass();
        this.addOrRemoveItalicClass();
        this.flipClock.set24Hour(false);
        this.flipClock.setEnableAudio(false);
        this.setFormValues();
        localStorage.removeItem('flip-clock--segment-foreground-color');
        localStorage.removeItem('flip-clock--segment-background-color');
        localStorage.removeItem('flip-clock--background-color');
        localStorage.removeItem('flip-clock--font-family');
        localStorage.removeItem('flip-clock--font-weight');
        localStorage.removeItem('flip-clock--font-style');
        localStorage.removeItem('flip-clock--twenty-four-hour');
    }
};

FlipClockPage.init();
