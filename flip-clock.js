var now = new Date();
var testRollover;

// testRollover = 2000000000000; // uncomment to test a time_t rollover.
// testRollover = 1609477200000; // uncomment to test a 2020 to 2021 rollover, Eastern Time.
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

var Segment = (function () {

    var transitionEndEventName;
    var transitionCancelEventName;
    var e = document.createElement('div');
    if (e.style.transition !== undefined) {
        transitionEndEventName = 'transitionend';
        transitionCancelEventName = 'transitioncancel';
    } else if (e.style.OTransition !== undefined) {
        transitionEndEventName = 'oTransitionEnd';
        transitionCancelEventName = 'oTransitionCancel';
    } else if (e.style.MozTransition !== undefined) {
        transitionEndEventName = 'transitionend';
        transitionCancelEventName = 'transitioncancel';
    } else if (e.style.WebkitTransition !== undefined) {
        transitionEndEventName = 'webkitTransitionEnd';
        transitionCancelEventName = 'webkitTransitionCancel';
    }

    var raf = window.requestAnimationFrame;
    raf = raf || window.mozRequestAnimationFrame;
    raf = raf || window.webkitRequestAnimationFrame;
    raf = raf || window.msRequestAnimationFrame;
    raf = raf || window.oRequestAnimationFrame;
    window.requestAnimationFrame = raf;

    var caf = window.cancelAnimationFrame;
    caf = caf || window.mozCancelAnimationFrame;
    caf = caf || window.webkitCancelAnimationFrame;
    caf = caf || window.msCancelAnimationFrame;
    caf = caf || window.oCancelAnimationFrame;
    caf = caf || window.mozCancelRequestAnimationFrame;
    caf = caf || window.webkitCancelRequestAnimationFrame;
    caf = caf || window.msCancelRequestAnimationFrame;
    caf = caf || window.oCancelRequestAnimationFrame;
    window.cancelAnimationFrame = caf;

    if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }

    function Segment(options) {
        this.animationStyle = 1;
        this.digitCount = options.digitCount;
        this.flipClock = options.flipClock;
        this.enableAudio = false;

        this.isTwelveHour = false;
        if (options.isTwelveHour) {
            this.isTwelveHour = true;
        }

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
            element.classList.add('flip-clock-segment');
        } else {
            element = E('span', 'flip-clock-segment');
        }

        if (!("idCounter" in Segment)) {
            Segment.idCounter = 0;
            Segment.segmentsById = {};
        }

        Segment.idCounter += 1;
        element.setAttribute('data-segment-id', Segment.idCounter);
        Segment.segmentsById[Segment.idCounter] = this;

        var inner       = E('span', 'flip-clock-segment-inner');
        var top         = E('span', 'flip-clock-segment-piece flip-clock-segment-piece-top');
        var bottom      = E('span', 'flip-clock-segment-piece flip-clock-segment-piece-bottom');
        var topInner    = E('span', 'flip-clock-segment-piece-inner flip-clock-segment-piece-top-inner');
        var bottomInner = E('span', 'flip-clock-segment-piece-inner flip-clock-segment-piece-bottom-inner');

        var topText    = E('span');
        var bottomText = E('span');

        window.requestAnimationFrame(function () {
            element.appendChild(inner);
            inner.appendChild(top);
            inner.appendChild(bottom);
            top.appendChild(topInner);
            bottom.appendChild(bottomInner);
            topInner.appendChild(topText);
            bottomInner.appendChild(bottomText);
        }.bind(this));

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

        this.callback = [];
        this.addOrRemove12HourClass();
    }
    Segment.prototype.addOrRemove12HourClass = function () {
        this.element.classList[this.isTwelveHour ? 'add' : 'remove']('flip-clock-segment-twelve-hour');
    };
    Segment.prototype.setDesiredValue = function (value, delay, callback) {
        if ('startAt' in this) {
            return this.setDesiredState(value - this.startAt, delay, callback);
        }
        return this.setDesiredState(value, delay, callback);
    };
    Segment.prototype.setDesiredState = function (stateIndex, delay, callback) {
        if (delay) {
            setTimeout(function () {
                this.setDesiredState(stateIndex, null, callback);
            }.bind(this), delay);
            return;
        }
        this.desiredState = stateIndex;
        if (!this.moving) {
            this.moving = true;
            this.setNextState(callback);
        }
    };
    Segment.prototype.valueText = function (value) {
        if ('startAt' in this) {
            return this.stateText(value - this.startAt);
        }
        return this.stateText(value);
    };
    Segment.prototype.stateText = function (stateIndex) {
        if (stateIndex < 0) {
            return '';
        }
        if (this.states) {
            return this.states[stateIndex];
        }
        var newText;
        if (this.isTwelveHour) {
            newText = String((stateIndex + 11) % 12 + 1);
            if (stateIndex >= 0 && stateIndex < 12) {
                newText = newText + '<span class="ampm">am</span>';
            } else if (stateIndex >= 12 && stateIndex < 24) {
                newText = newText + '<span class="ampm">pm</span>';
            }
            return newText;
        }
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
    Segment.prototype.setNextState = function (callback) {
        if (this.stateIndex === this.desiredState) {
            this.moving = false;
            if (callback) {
                callback();
            }
            return;
        }
        var nextStateIndex;
        nextStateIndex = (this.stateIndex + 1) % this.stateCount;
        var newText = this.stateText(nextStateIndex);
        var currentText = this.topText.innerHTML;
        if (this.animationStyle === 1) {
            this.animate1(currentText, newText, nextStateIndex, callback);
        } else if (this.animationStyle === 2) {
            this.animate2(currentText, newText, nextStateIndex, callback);
        } else {
            this.animate0(currentText, newText, nextStateIndex, callback);
        }
    };
    Segment.prototype.flipWrap = function () {
        var thisState = this.stateIndex;
        this.setNextState(function () {
            this.setDesiredState(this.state);
        }.bind(this));
    };
    Segment.prototype.refresh = function () {
        var text = this.stateText(this.stateIndex);
        this.topText.innerHTML = text;
        this.bottomText.innerHTML = text;
    };

    Segment.prototype.animate0 = function (currentText, newText, nextStateIndex, callback) {
        if (this.enableAudio) {
            this.audio.play();
        }
        window.requestAnimationFrame(function () {
            this.topText.innerHTML = newText;
            this.bottomText.innerHTML = newText;
            setTimeout(function () {
                this.stateIndex = nextStateIndex;
                this.setNextState(callback);
            }.bind(this), Segment.transitionTime * 2);
        }.bind(this));
    };

    Segment.prototype.animate1 = function (currentText, newText, nextStateIndex, callback) {
        var flipTop         = E('span', 'flip-clock-segment-piece flip-clock-segment-piece-flip-top');
        var flipBottom      = E('span', 'flip-clock-segment-piece flip-clock-segment-piece-flip-bottom');
        var flipTopInner    = E('span', 'flip-clock-segment-piece-inner flip-clock-segment-piece-flip-top-inner');
        var flipBottomInner = E('span', 'flip-clock-segment-piece-inner flip-clock-segment-piece-flip-bottom-inner');
        var flipTopText     = E('span');
        var flipBottomText  = E('span');
        window.requestAnimationFrame(function () {
            flipTop.appendChild(flipTopInner);
            flipBottom.appendChild(flipBottomInner);
            flipTopInner.appendChild(flipTopText);
            flipBottomInner.appendChild(flipBottomText);
            this.inner.appendChild(flipTop);
            this.inner.appendChild(flipBottom);
            flipTopText.innerHTML = currentText;
            flipBottomText.innerHTML = newText;
            flipTop.style.display = 'inline-block';
            this.topText.innerHTML = newText;
            if (this.enableAudio) {
                this.audio.play();
            }
            setTimeout(function () {
                flipTopInner.removeChild(flipTopText);
                this.inner.removeChild(flipTop);
                flipBottom.style.display = 'inline-block';
                setTimeout(function () {
                    flipBottomInner.removeChild(flipBottomText);
                    this.inner.removeChild(flipBottom);
                    this.bottomText.innerHTML = newText;
                    this.stateIndex = nextStateIndex;
                    this.setNextState(callback);
                }.bind(this), Segment.transitionTime);
            }.bind(this), Segment.transitionTime);
        }.bind(this));
    };

    var a = 0;
    var b = 0;

    Segment.prototype.animate2 = function (currentText, newText, nextStateIndex, callback) {
        if (!this.hasAnimatedPiece) {
            this.hasAnimatedPiece = true;
            this.animatedPiece = E('span', 'flip-clock-segment-animated');
            this.obverse       = E('span', '--obverse');
            this.reverse       = E('span', '--reverse');
            this.obverseInner  = E('span', '--inner');
            this.reverseInner  = E('span', '--inner');
            this.animatedPiece.appendChild(this.obverse);
            this.animatedPiece.appendChild(this.reverse);
            this.obverse.appendChild(this.obverseInner);
            this.reverse.appendChild(this.reverseInner);
            this.inner.appendChild(this.animatedPiece);
        }
        var handler = function () {
            this.animatedPiece.removeEventListener(transitionEndEventName, handler);
            window.requestAnimationFrame(() => {
                this.bottomText.innerHTML = newText;
                this.animatedPiece.classList.remove('--rushed');
                this.animatedPiece.classList.remove('--visible');
                this.animatedPiece.classList.remove('--down');
                this.obverseInner.innerHTML = '';
                this.reverseInner.innerHTML = '';
                this.stateIndex = nextStateIndex;
                window.requestAnimationFrame(() => {
                    this.setNextState(callback);
                });
            });
        }.bind(this);
        this.animatedPiece.addEventListener(transitionEndEventName, handler);
        requestAnimationFrame(function () {
            if (nextStateIndex !== this.desiredState) {
                this.animatedPiece.classList.add('--rushed');
            }
            this.obverseInner.innerHTML = currentText;
            this.reverseInner.innerHTML = newText;
            this.animatedPiece.classList.add('--visible');
            this.topText.innerHTML = newText;
            window.requestAnimationFrame(function () {
                this.animatedPiece.classList.add('--down');
            }.bind(this));
        }.bind(this));
    };

    Segment.prototype.set24Hour = function (flag) {
        this.isTwelveHour = !flag;
        this.addOrRemove12HourClass();
        this.refresh();
    };
    Segment.prototype.setEnableAudio = function (flag) {
        this.enableAudio = !!flag;
    };
    Segment.prototype.setAnimationStyle = function (index) {
        this.animationStyle = index;
    };

    Segment.transitionTime = 50;

    function E(tagName, className) {
        var e = document.createElement(tagName);
        if (className !== null && className !== undefined) {
            e.className = className;
        }
        return e;
    }

    function T(text) {
        var t = document.createTextNode(text);
        return t;
    }

    return Segment;
}());

var FlipClock = (function () {
    function FlipClock(what) {
        this.is24Hour = false;

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
        this.segmentArray = [];

        this.elements.year   = element.querySelector('[data-flip-clock-year]');
        this.elements.month  = element.querySelector('[data-flip-clock-month]');
        this.elements.date   = element.querySelector('[data-flip-clock-date]');
        this.elements.day    = element.querySelector('[data-flip-clock-day]');
        this.elements.hour   = element.querySelector('[data-flip-clock-hour]');
        this.elements.minute = element.querySelector('[data-flip-clock-minute]');
        this.elements.second = element.querySelector('[data-flip-clock-second]');
        this.elements.epoch  = Array.from(element.querySelectorAll('[data-flip-clock-epoch]'));

        if (this.elements.year) {
            this.segmentArray.push(
                this.segments.year = new Segment({
                    digitCount: 4,
                    startAt: 2000,
                    endAt: 2049,
                    element: this.elements.year,
                    flipClock: this
                })
            );
        }
        if (this.elements.month) {
            this.segmentArray.push(
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
                })
            );
        }
        if (this.elements.date) {
            this.segmentArray.push(
                this.segments.date = new Segment({
                    startAt: 1,
                    endAt: 31,
                    element: this.elements.date,
                    flipClock: this
                })
            );
        }
        if (this.elements.day) {
            this.segmentArray.push(
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
                })
            );
        }
        if (this.elements.hour) {
            this.segmentArray.push(
                this.segments.hour = new Segment({
                    isTwelveHour: !this.is24Hour,
                    digitCount: 2,
                    stateCount: 24,
                    element: this.elements.hour,
                    flipClock: this
                })
            );
        }
        if (this.elements.minute) {
            this.segmentArray.push(
                this.segments.minute = new Segment({
                    digitCount: 2,
                    stateCount: 60,
                    element: this.elements.minute,
                    flipClock: this
                })
            );
        }
        if (this.elements.second) {
            this.segmentArray.push(
                this.segments.second = new Segment({
                    digitCount: 2,
                    stateCount: 60,
                    element: this.elements.second,
                    flipClock: this
                })
            );
        }

        var i;
        var epochWindow = element.querySelector('[data-flip-clock-epoch-window]');
        if (epochWindow) {
            this.segments.epoch = [];
            this.elements.epoch.forEach(function (element) {
                var segment = new Segment({
                    digitCount: 1,
                    stateCount: 10,
                    element: element,
                    flipClock: this
                });
                this.segments.epoch.push(segment);
                this.segmentArray.push(segment);
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

    FlipClock.prototype.refresh = function () {
        this.segmentArray.forEach(function (segment) {
            segment.refresh();
        }.bind(this));
    };

    FlipClock.prototype.setEnableAudio = function (flag) {
        this.segmentArray.forEach(function (segment) {
            segment.setEnableAudio(flag);
        }.bind(this));
    };

    FlipClock.prototype.setAnimationStyle = function (flag) {
        this.segmentArray.forEach(function (segment) {
            segment.setAnimationStyle(flag);
        }.bind(this));
    };

    FlipClock.prototype.set24Hour = function (flag) {
        this.is24Hour = flag;
        if (this.segments.hour) {
            this.segments.hour.set24Hour(flag);
        }
    };

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
        }.bind(this));
    };

    FlipClock.prototype.flipWrap = function () {
        this.segmentArray.forEach(function (segment) {
            segment.flipWrap();
        }.bind(this));
    };

    return FlipClock;
}());
