var FlipClockPage = {
    fakeItalic: false,
    fontStyle: 'normal',
    init: function () {
        this.flipClock = new FlipClock('flip-clock');
        this.setPropertiesFromStorage();
        this.setFormValues();
        this.addEvents();
    },
    addEvents: function () {
        document.addEventListener('click', function (event) {
            var element = event.target.closest('.segment');
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
        }.bind(this));
        document.addEventListener('change', function (event) {
            var style = document.documentElement.style;
            if (event.target.hasAttribute('data-flipclock-segment-foreground-color')) {
                style.setProperty('--segment-foreground-color', event.target.value);
                localStorage.setItem('flipclock--segment-foreground-color', event.target.value);
            }
            if (event.target.hasAttribute('data-flipclock-segment-background-color')) {
                style.setProperty('--segment-background-color', event.target.value);
                localStorage.setItem('flipclock--segment-background-color', event.target.value);
            }
            if (event.target.hasAttribute('data-flipclock-background-color')) {
                style.setProperty('--background-color', event.target.value);
                localStorage.setItem('flipclock--background-color', event.target.value);
            }
            if (event.target.hasAttribute('data-flipclock-font-family')) {
                var value = event.target.options[event.target.selectedIndex].value;
                this.fakeItalic = event.target.options[event.target.selectedIndex].hasAttribute('data-fake-italic');
                this.addOrRemoveFakeItalicClass();
                style.setProperty('--font-family', value);
                localStorage.setItem('flipclock--font-family', value);
            }
            if (event.target.hasAttribute('data-flipclock-font-weight')) {
                var value = event.target.options[event.target.selectedIndex].value;
                style.setProperty('--font-weight', value);
                localStorage.setItem('flipclock--font-weight', value);
            }
            if (event.target.hasAttribute('data-flipclock-font-style')) {
                var value = event.target.options[event.target.selectedIndex].value;
                style.setProperty('--font-style', value);
                localStorage.setItem('flipclock--font-style', value);
                this.fontStyle = value;
                this.addOrRemoveItalicClass();
            }
        }.bind(this));
        document.addEventListener('input', function (event) {
            if (event.target.hasAttribute('data-flipclock-twenty-four-hour')) {
                var checked = event.target.checked; // is twenty-four hour?
                console.log('SET ITEM flipclock--twenty-four-hour => ' + JSON.stringify(checked));
                localStorage.setItem('flipclock--twenty-four-hour', JSON.stringify(checked));
                this.flipClock.set24Hour(checked);
            }
            if (event.target.hasAttribute('data-flipclock-enable-audio')) {
                var checked = event.target.checked; // is twenty-four hour?
                localStorage.setItem('flipclock--enable-audio', JSON.stringify(checked));
                this.flipClock.setEnableAudio(checked);
            }
        }.bind(this));
        document.addEventListener('click', function (event) {
            if (!event.target.closest('[data-flipclock-set-defaults]')) {
                return;
            }
            this.setDefaults();
            event.preventDefault();
        }.bind(this));
    },
    setPropertiesFromStorage: function () {
        var style = document.documentElement.style;
        var value;
        if ((value = localStorage.getItem('flipclock--segment-foreground-color'))) {
            style.setProperty('--segment-foreground-color', value);
        }
        if ((value = localStorage.getItem('flipclock--segment-background-color'))) {
            style.setProperty('--segment-background-color', value);
        }
        if ((value = localStorage.getItem('flipclock--background-color'))) {
            style.setProperty('--background-color', value);
        }
        if ((value = localStorage.getItem('flipclock--font-family'))) {
            style.setProperty('--font-family', value);
        }
        if ((value = localStorage.getItem('flipclock--font-weight'))) {
            style.setProperty('--font-weight', value);
        }
        if ((value = localStorage.getItem('flipclock--font-style'))) {
            style.setProperty('--font-style', value);
        }
        if ((value = localStorage.getItem('flipclock--twenty-four-hour')) !== null) {
            console.log('GET ITEM flipclock--twenty-four-hour => ' + JSON.stringify(value));
            try {
                value = !!JSON.parse(value);
            } catch (e) {
                value = false;
            }
            this.flipClock.set24Hour(value);
        }
        if ((value = localStorage.getItem('flipclock--enable-audio')) !== null) {
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
        Array.from(document.querySelectorAll('[data-flipclock-segment-foreground-color]')).forEach(function (input) {
            var value = cs.getPropertyValue('--segment-foreground-color').trim();
            this.setInputValue(input, value);
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flipclock-segment-background-color]')).forEach(function (input) {
            var value = cs.getPropertyValue('--segment-background-color').trim();
            this.setInputValue(input, value);
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flipclock-background-color]')).forEach(function (input) {
            var value = cs.getPropertyValue('--background-color').trim();
            this.setInputValue(input, value);
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flipclock-font-family]')).forEach(function (input) {
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
        Array.from(document.querySelectorAll('[data-flipclock-font-weight]')).forEach(function (input) {
            var value = cs.getPropertyValue('--font-weight').trim();
            if (input.tagName.toLowerCase() === 'select') {
                this.setSelectValue(input, value);
            } else {
                this.setInputValue(input, value);
            }
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flipclock-font-style]')).forEach(function (input) {
            var value = cs.getPropertyValue('--font-style').trim();
            if (input.tagName.toLowerCase() === 'select') {
                this.setSelectValue(input, value);
                this.fontStyle = value;
                this.addOrRemoveItalicClass();
            } else {
                this.setInputValue(input, value);
            }
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flipclock-twenty-four-hour]')).forEach(function (input) {
            var flag = this.flipClock.is24Hour;
            input.checked = !!flag;
        }.bind(this));
        Array.from(document.querySelectorAll('[data-flipclock-enable-audio]')).forEach(function (input) {
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
        localStorage.removeItem('flipclock--segment-foreground-color');
        localStorage.removeItem('flipclock--segment-background-color');
        localStorage.removeItem('flipclock--background-color');
        localStorage.removeItem('flipclock--font-family');
        localStorage.removeItem('flipclock--font-weight');
        localStorage.removeItem('flipclock--font-style');
        localStorage.removeItem('flipclock--twenty-four-hour');
    }
};

FlipClockPage.init();
