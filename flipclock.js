var now = new Date();
var testRollover;

// testRollover = 2000000000000;
// testRollover = 1609477200000;
var nowMS;
var incrMS;

if (testRollover) {
    nowMS = now.getTime();
    incrMS = testRollover - 20000 - nowMS;
}

var Ticker = (function () {
    function Ticker() {
    }
    Ticker.prototype.start = function () {
        var date = new Date();
        if (testRollover) {
            date.setTime(date.getTime() + incrMS);
        }
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
        var element;
        if (typeof what === 'string') {
            element = document.getElementById(what);
            if (!element) {
                return;
            }
        }
        if (what instanceof HTMLElement) {
            element = what;
        }

        this.elements = {};
        this.segments = {};

        this.elements.year   = element.querySelector('[data-flip-clock-year]');
        this.elements.month  = element.querySelector('[data-flip-clock-month]');
        this.elements.date   = element.querySelector('[data-flip-clock-date]');
        this.elements.day    = element.querySelector('[data-flip-clock-day]');
        this.elements.hour   = element.querySelector('[data-flip-clock-hour]');
        this.elements.minute = element.querySelector('[data-flip-clock-minute]');
        this.elements.second = element.querySelector('[data-flip-clock-second]');
        this.elements.epoch  = Array.from(element.querySelectorAll('[data-flip-clock-epoch]'));

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

        var i;
        var epochWindow = element.querySelector('[data-flip-clock-epoch-window]');
        if (epochWindow) {
            this.segments.epoch = [];
            this.elements.epoch.forEach(function (element) {
                this.segments.epoch.push(new Segment({
                    digitCount: 1,
                    stateCount: 10,
                    element: element,
                    flipClock: this
                }));
            }.bind(this));
        }

        this.segments.epoch.reverse();

        ['year', 'month', 'date', 'day', 'hour', 'minute', 'second'].forEach(function (unit) {
            var element = this.elements[unit];
            var segment = this.segments[unit];
            // parentNode tests are intended to test if in document's hierarchy
            if (segment && !element.parentNode) {
                element.appendChild(segment);
            }
        }.bind(this));

        this.segments.epoch.forEach(function (segment) {
            var element = segment.element;
            if (!element.parentNode) {
                element.appendChild(segment);
            }
        });

        element.classList.add('flip-clock');
        this.ticker = new Ticker();
        this.ticker.callback = this.setTime.bind(this);
        this.ticker.start();
        this.element = element;
    }

    FlipClock.segmentDelay = 50;

    FlipClock.prototype.setTime = function (date) {
        if (this.segments.year) {
            this.segments.year.setDesiredValue(date.getFullYear(), 11/3 * FlipClock.segmentDelay);
        }
        if (this.segments.month) {
            this.segments.month.setDesiredValue(date.getMonth(), 8/3 * FlipClock.segmentDelay);
        }
        if (this.segments.date) {
            this.segments.date.setDesiredValue(date.getDate(), 5/3 * FlipClock.segmentDelay);
        }
        if (this.segments.day) {
            this.segments.day.setDesiredValue(date.getDay(), 2/3 * FlipClock.segmentDelay);
        }
        if (this.segments.hour) {
            this.segments.hour.setDesiredValue(date.getHours(), 6/3 * FlipClock.segmentDelay);
        }
        if (this.segments.minute) {
            this.segments.minute.setDesiredValue(date.getMinutes(), 3/3 * FlipClock.segmentDelay);
        }
        if (this.segments.second) {
            this.segments.second.setDesiredValue(date.getSeconds(), 0/3 * FlipClock.segmentDelay);
        }

        var ms = Math.floor(date.getTime() / 1000);
        var delay = 1/3 * FlipClock.segmentDelay;
        this.segments.epoch.forEach(function (segment) {
            segment.setDesiredValue(ms % 10, delay);
            ms = Math.floor(ms / 10);
            delay += FlipClock.segmentDelay / 4;
        });
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
        var element;
        if (options.dataAttribute) {
            parent = this.flipClock ? (this.flipClock.element || document) : document;
            element = parent.querySelector('[' + options.dataAttribute + ']');
        } else if (options.element) {
            parent = this.flipClock ? (this.flipClock.element || document) : document;
            element = options.element;
        }

        if (element) {
            element.classList.add('segment');
        } else {
            element = E('span', 'segment');
        }

        var inner       = E('span', 'segment-inner');
        var top         = E('span', 'segment-piece segment-top');
        var bottom      = E('span', 'segment-piece segment-bottom');
        var topInner    = E('span', 'segment-piece-inner segment-top-inner');
        var bottomInner = E('span', 'segment-piece-inner segment-bottom-inner');

        var topText    = T('');
        var bottomText = T('');

        element.appendChild(inner);
        inner.appendChild(top);
        inner.appendChild(bottom);
        top.appendChild(topInner);
        bottom.appendChild(bottomInner);
        topInner.appendChild(topText);
        bottomInner.appendChild(bottomText);

        this.element = element;
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
        var flipTop         = E('span', 'segment-piece segment-fliptop');
        var flipBottom      = E('span', 'segment-piece segment-flipbottom');
        var flipTopInner    = E('span', 'segment-piece-inner segment-fliptop-inner');
        var flipBottomInner = E('span', 'segment-piece-inner segment-flipbottom-inner');
        var flipTopText     = T('');
        var flipBottomText  = T('');
        flipTop.appendChild(flipTopInner);
        flipBottom.appendChild(flipBottomInner);
        flipTopInner.appendChild(flipTopText);
        flipBottomInner.appendChild(flipBottomText);
        this.inner.appendChild(flipTop);
        this.inner.appendChild(flipBottom);
        flipTopText.data = currentText;
        flipBottomText.data = newText;
        flipTop.style.display = 'inline-block';
        this.topText.data = newText;
        this.audio.play();
        setTimeout(function () {
            flipTopInner.removeChild(flipTopText);
            this.inner.removeChild(flipTop);
            flipBottom.style.display = 'inline-block';
            setTimeout(function () {
                flipBottomInner.removeChild(flipBottomText);
                this.inner.removeChild(flipBottom);
                this.bottomText.data = newText;
                this.stateIndex = nextStateIndex;
                this.setNextState();
            }.bind(this), Segment.transitionTime);
        }.bind(this), Segment.transitionTime);
    };

    Segment.transitionTime = 50;

    return FlipClock;
}());
