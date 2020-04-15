var Ticker = (function () {
    function Ticker() {
    }
    Ticker.prototype.start = function () {
        var date = new Date();
        this.callback(date);
        this.timeout = setTimeout(function () {
            this.start();
        }.bind(this), 1000 - date.getTime() % 1000);
    };
    Ticker.prototype.stop = function () {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    };
    return Ticker;
}());

var FlipClock = (function () {

    var el = document.createElement('fakeelement');
    var transitionEvent;
    if (el.style.transition !== undefined) {
        transitionEvent = 'transitionend';
    } else if (el.style.OTransition !== undefined) {
        transitionEvent = 'oTransitionEnd';
    } else if (el.style.MozTransition !== undefined) {
        transitionEvent = 'transitionend';
    } else if (el.style.WebkitTransition !== undefined) {
        transitionEvent = 'webkitTransitionEnd';
    }

    function FlipClock(what) {
        var e;
        if (typeof what === 'string') {
            e = document.getElementById(what);
            if (!e) {
                return;
            }
        }
        if (what instanceof HTMLElement) {
            e = what;
        }

        this.elements = {};
        this.segments = {};

        this.elements.year   = e.querySelector('[data-flip-clock-year]');
        this.elements.month  = e.querySelector('[data-flip-clock-month]');
        this.elements.date   = e.querySelector('[data-flip-clock-date]');
        this.elements.day    = e.querySelector('[data-flip-clock-day]');
        this.elements.hour   = e.querySelector('[data-flip-clock-hour]');
        this.elements.minute = e.querySelector('[data-flip-clock-minute]');
        this.elements.second = e.querySelector('[data-flip-clock-second]');

        if (this.elements.year) {
            console.log('year');
            this.segments.year = new Segment({
                digitCount: 4,
                startAt: 2000,
                endAt: 2049,
                element: this.elements.year,
                flipClock: this
            });
        }
        if (this.elements.month) {
            this.segments.month = new Segment({
                states: [
                    'JAN',
                    'FEB',
                    'MAR',
                    'APR',
                    'MAY',
                    'JUN',
                    'JUL',
                    'AUG',
                    'SEP',
                    'OCT',
                    'NOV',
                    'DEC'
                ],
                element: this.elements.month,
                flipClock: this
            });
        }
        if (this.elements.date) {
            this.segments.date = new Segment({
                startAt: 1,
                endAt: 31,
                element: this.elements.date,
                flipClock: this
            });
        }
        if (this.elements.day) {
            this.segments.day = new Segment({
                states: [
                    'SUN',
                    'MON',
                    'TUE',
                    'WED',
                    'THU',
                    'FRI',
                    'SAT'
                ],
                element: this.elements.day,
                flipClock: this
            });
        }
        if (this.elements.hour) {
            this.segments.hour = new Segment({
                digitCount: 2,
                stateCount: 24,
                element: this.elements.hour,
                flipClock: this
            });
        }
        if (this.elements.minute) {
            this.segments.minute = new Segment({
                digitCount: 2,
                stateCount: 60,
                element: this.elements.minute,
                flipClock: this
            });
        }
        if (this.elements.second) {
            this.segments.second = new Segment({
                digitCount: 2,
                stateCount: 60,
                element: this.elements.second,
                flipClock: this
            });
        }

        ['year', 'month', 'date', 'day', 'hour', 'minute', 'second'].forEach(function (unit) {
            var element = this.elements[unit];
            var segment = this.segments[unit];
            // parentNode tests are intended to test if in document's hierarchy
            if (segment && !element.parentNode) {
                e.appendChild(segment);
            }
        }.bind(this));

        e.classList.add('flip-clock');
        this.ticker = new Ticker();
        this.ticker.callback = this.setTime.bind(this);
        this.ticker.start();
        this.element = e;
    }

    FlipClock.segmentDelay = 50;

    FlipClock.prototype.setTime = function (date) {
        if (this.segments.year) {
            this.segments.year.setDesiredValue(date.getFullYear(), 3 * FlipClock.segmentDelay);
        }
        if (this.segments.month) {
            this.segments.month.setDesiredValue(date.getMonth(), 2 * FlipClock.segmentDelay);
        }
        if (this.segments.date) {
            this.segments.date.setDesiredValue(date.getDate(), FlipClock.segmentDelay);
        }
        if (this.segments.day) {
            this.segments.day.setDesiredValue(date.getDay());
        }
        if (this.segments.hour) {
            this.segments.hour.setDesiredValue(date.getHours(), 2 * FlipClock.segmentDelay);
        }
        if (this.segments.minute) {
            this.segments.minute.setDesiredValue(date.getMinutes(), FlipClock.segmentDelay);
        }
        if (this.segments.second) {
            this.segments.second.setDesiredValue(date.getSeconds());
        }
    };

    function E(tagName, className) {
        var e = document.createElement(tagName);
        e.className = className;
        return e;
    }

    function T(text) {
        var t = document.createTextNode(text);
        return t;
    }

    function Segment(options) {
        this.digitCount = options.digitCount;
        this.flipClock = options.flipClock;

        if (options.states && options.states instanceof Array) {
            this.states = options.states;
            this.stateCount = options.states.length;
        } else if (options.stateCount && typeof options.stateCount === 'number') {
            this.stateCount = options.stateCount;
            this.states = null;
        } else if (typeof options.startAt === 'number' &&
                   typeof options.endAt === 'number') {
            this.stateCount = options.endAt - options.startAt + 1;
            this.startAt = options.startAt;
            this.endAt = options.endAt;
        }

        this.stateIndex = -1;
        this.desiredState = -1;

        var parent;
        var segment;
        if (options.dataAttribute) {
            parent = this.flipClock ? (this.flipClock.element || document) : document;
            segment = parent.querySelector('[' + options.dataAttribute + ']');
        } else if (options.element) {
            parent = this.flipClock ? (this.flipClock.element || document) : document;
            segment = options.element;
        }

        if (segment) {
            segment.classList.add('segment');
        } else {
            segment = E('span', 'segment');
        }

        var inner       = E('span', 'segment-inner');
        var top         = E('span', 'segment-top');
        var bottom      = E('span', 'segment-bottom');
        var topInner    = E('span', 'segment-top-inner');
        var bottomInner = E('span', 'segment-bottom-inner');

        var topText    = T('');
        var bottomText = T('');

        segment.appendChild(inner);
        inner.appendChild(top);
        inner.appendChild(bottom);
        top.appendChild(topInner);
        bottom.appendChild(bottomInner);
        topInner.appendChild(topText);
        bottomInner.appendChild(bottomText);

        this.segment = segment;
        this.inner = inner;
        this.top = top;
        this.bottom = bottom;
        this.topInner = topInner;
        this.bottomInner = bottomInner;

        this.topText = topText;
        this.bottomText = bottomText;

        this.audio = document.createElement('audio');
        this.audio.src = 'tick8.wav';
    }

    Segment.prototype.setDesiredValue = function (value, delay) {
        if ('startAt' in this) {
            return this.setDesiredState(value - this.startAt, delay);
        }
        return this.setDesiredState(value, delay);
    };

    Segment.prototype.setDesiredState = function (stateIndex, delay) {
        if (delay) {
            setTimeout(function () {
                this.setDesiredState(stateIndex);
            }.bind(this), delay);
            return;
        }
        this.desiredState = stateIndex;
        if (!this.moving) {
            this.moving = true;
            this.setNextState();
        }
    };

    Segment.prototype.valueText = function (value) {
        if ('startAt' in this) {
            return this.stateText(value - this.startAt);
        }
        return this.stateText(value);
    };

    Segment.prototype.stateText = function (stateIndex) {
        if (this.states) {
            return this.states[stateIndex];
        }
        var newText;
        if ('startAt' in this) {
            newText = String(stateIndex + this.startAt);
        } else {
            newText = String(stateIndex);
        }
        while (this.digitCount && newText.length < this.digitCount) {
            newText = '0' + newText;
        }
        return newText;
    };

    Segment.prototype.setNextState = function () {
        if (this.stateIndex === this.desiredState) {
            this.moving = false;
            return;
        }
        var nextStateIndex;
        nextStateIndex = (this.stateIndex + 1) % this.stateCount;
        var newText = this.stateText(nextStateIndex);
        var currentText = this.topText.data;
        this.animate1(currentText, newText, nextStateIndex);
    };

    Segment.prototype.animate1 = function (currentText, newText, nextStateIndex) {
        var flip11      = E('span', 'segment-flip11');
        var flip22      = E('span', 'segment-flip22');
        var flip11Inner = E('span', 'segment-flip11-inner');
        var flip22Inner = E('span', 'segment-flip22-inner');
        var flip11Text  = T('');
        var flip22Text  = T('');
        flip11.appendChild(flip11Inner);
        flip22.appendChild(flip22Inner);
        flip11Inner.appendChild(flip11Text);
        flip22Inner.appendChild(flip22Text);
        this.inner.appendChild(flip11);
        this.inner.appendChild(flip22);
        flip11Text.data = currentText;
        flip22Text.data = newText;
        flip11.style.display = 'inline-block';
        this.topText.data = newText;
        if (document.hasFocus()) {
            this.audio.play();
        }
        setTimeout(function () {
            flip11Inner.removeChild(flip11Text);
            this.inner.removeChild(flip11);
            flip22.style.display = 'inline-block';
            setTimeout(function () {
                flip22Inner.removeChild(flip22Text);
                this.inner.removeChild(flip22);
                this.bottomText.data = newText;
                this.stateIndex = nextStateIndex;
                this.setNextState();
            }.bind(this), Segment.transitionTime);
        }.bind(this), Segment.transitionTime);
    };

    Segment.transitionTime = 50;

    return FlipClock;
}());
