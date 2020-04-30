var TimeTicker = (function () {
    function TimeTicker(options) {
        this.testRollover = options && options.testRollover;
    }
    TimeTicker.prototype.start = function () {
        var date = new Date();
        if (this.testRollover) {
            this.msOffset = this.testRollover.getTime() - 20000 - date.getTime();
            delete this.testRollover;
        }
        if (this.msOffset) {
            date.setTime(date.getTime() + this.msOffset);
        }
        this.callback(date);
        this.timeout = setTimeout(function () {
            this.start();
        }.bind(this), 1000 - date.getTime() % 1000);
    };
    TimeTicker.prototype.stop = function () {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    };
    return TimeTicker;
}());

function absoluteURL(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.href;
}

var Segment = (function () {

    /**
     * transition event name polyfill
     */

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

    /**
     * requestAnimationFrame polyfill
     */

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

    /**
     * Audio
     */

    // stackoverflow says absolute URLs work in safari
    var tickURL = absoluteURL('tick8.wav');

    var supportsAudioContext = typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined';
    var needsAudioContext = /\bSafari\//.test(navigator.userAgent) && !/\bChrome\//.test(navigator.userAgent);
    // Safari needs it:
    //     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.5 Safari/605.1.15" = $1
    // Chrome doesn't:
    //     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36"

    var useAudioContext = false; // supportsAudioContext && needsAudioContext;

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

    /**
     * Flip clock segment
     */

    function Segment(options) {
        this.animationStyle = 1;
        this.digitCount = options.digitCount;
        this.flipClock = options.flipClock;
        this.isHour = options.isHour;

        this.enableAudio = false;
        if (options.enableAudio) {
            this.enableAudio = true;
        }
        console.debug("Segment: enableAudio initialized to " + JSON.stringify(this.enableAudio));

        this.is24Hour = false;
        if (options.is24Hour) {
            this.is24Hour = true;
        }
        console.debug("Segment: is24Hour initialized to " + JSON.stringify(this.is24Hour));

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

        var top         = E('span', 'flip-clock-segment-piece flip-clock-segment-piece-top');
        var bottom      = E('span', 'flip-clock-segment-piece flip-clock-segment-piece-bottom');
        var topInner    = E('span', 'flip-clock-segment-piece-inner flip-clock-segment-piece-top-inner');
        var bottomInner = E('span', 'flip-clock-segment-piece-inner flip-clock-segment-piece-bottom-inner');

        var topText    = E('span');
        var bottomText = E('span');

        var flipTop         = E('span', 'flip-clock-segment-piece flip-clock-segment-piece-flip-top');
        var flipBottom      = E('span', 'flip-clock-segment-piece flip-clock-segment-piece-flip-bottom');
        var flipTopInner    = E('span', 'flip-clock-segment-piece-inner flip-clock-segment-piece-flip-top-inner');
        var flipBottomInner = E('span', 'flip-clock-segment-piece-inner flip-clock-segment-piece-flip-bottom-inner');

        var flipTopText     = E('span');
        var flipBottomText  = E('span');

        element.appendChild(top);
        element.appendChild(bottom);
        top.appendChild(topInner);
        bottom.appendChild(bottomInner);
        topInner.appendChild(topText);
        bottomInner.appendChild(bottomText);

        element.appendChild(flipTop);
        element.appendChild(flipBottom);
        flipTop.appendChild(flipTopInner);
        flipBottom.appendChild(flipBottomInner);
        flipTopInner.appendChild(flipTopText);
        flipBottomInner.appendChild(flipBottomText);

        this.element         = element;
        this.top             = top;
        this.bottom          = bottom;
        this.topInner        = topInner;
        this.bottomInner     = bottomInner;
        this.topText         = topText;
        this.bottomText      = bottomText;
        this.flipTop         = flipTop;
        this.flipBottom      = flipBottom;
        this.flipTopInner    = flipTopInner;
        this.flipBottomInner = flipBottomInner;
        this.flipTopText     = flipTopText;
        this.flipBottomText  = flipBottomText;

        if (useAudioContext) {
            // ...
        } else {
            this.audio = new Audio(tickURL);
            this.audio.preload = 'auto';
            this.audio.volume = 1;
        }

        this.callback = [];
        this.addOrRemove12HourClass();
    }
    Segment.prototype.addOrRemove12HourClass = function () {
        var twelveHourClassAddOrRemove = (this.isHour && !this.is24Hour) ? 'add' : 'remove';
        this.element.classList[twelveHourClassAddOrRemove]('flip-clock-segment-twelve-hour');
        this.flipClock.element.classList[twelveHourClassAddOrRemove]('flip-clock-twelve-hour');
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
        if (this.isHour && !this.is24Hour) {
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
        var promise;
        window.requestAnimationFrame(function () {
            this.topText.innerHTML = newText;
            this.bottomText.innerHTML = newText;
            setTimeout(function () {
                this.stateIndex = nextStateIndex;
                this.setNextState(callback);
            }.bind(this), Segment.transitionTime * 2);
        }.bind(this));
    };

    var isMolasses = document.documentElement.hasAttribute('data-molasses');

    Segment.prototype.tick = function () {
        if (this.enableAudio) {
            if (useAudioContext) {
                // ...
            } else {
                this.audio.currentTime = 0;
                this.audio.play();
            }
        }
    };

    Segment.prototype.animate1 = function (currentText, newText, nextStateIndex, callback) {
        window.requestAnimationFrame(function () {
            var isRushed = nextStateIndex !== this.desiredState;
            if (isRushed && isMolasses) {
                this.topText.innerHTML = newText;
                this.tick();
                setTimeout(function () {
                    this.bottomText.innerHTML = newText;
                    setTimeout(function () {
                        this.stateIndex = nextStateIndex;
                        this.setNextState(callback);
                    }.bind(this), Segment.transitionTime * 0.35);
                }.bind(this), Segment.transitionTime * 0.15);
                return;
            }
            this.flipTopText.innerHTML = currentText;
            this.flipBottomText.innerHTML = newText;
            this.topText.innerHTML = newText;
            this.element.setAttribute('data-animation-frame', 1);
            this.tick();
            setTimeout(function () {
                this.element.setAttribute('data-animation-frame', 2);
                setTimeout(function () {
                    this.bottomText.innerHTML = newText;
                    this.element.removeAttribute('data-animation-frame');
                    this.stateIndex = nextStateIndex;
                    this.setNextState(callback);
                }.bind(this), Segment.transitionTime / 2);
            }.bind(this), Segment.transitionTime / 2);
        }.bind(this));
    };

    var a = 0;
    var b = 0;

    Segment.prototype.setIs24Hour = function (flag) {
        flag = !!flag;
        console.debug("Segment: setting is24Hour to " + JSON.stringify(flag));
        this.is24Hour = !!flag;
        this.addOrRemove12HourClass();
        this.refresh();
    };
    Segment.prototype.setEnableAudio = function (flag) {
        flag = !!flag;
        console.debug("Segment: setting enableAudio to " + JSON.stringify(flag));
        this.enableAudio = flag;
    };
    Segment.prototype.setAnimationStyle = function (index) {
        this.animationStyle = index;
    };

    Segment.transitionTime = 100;

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
    function FlipClock(options) {
        this.is24Hour = false;
        var testRollover;

        this.enableThemeConfiguration = options && options.enableThemeConfiguration;
        this.enableGoodies            = options && options.enableGoodies;

        if (options) {
            if (!this.element && options.elementId) {
                this.element = document.getElementById(options.elementId);
            }
            if (!this.element && options.element) {
                this.element = options.element;
            }
            testRollover = options.testRollover;
        }
        if (!this.element) {
            return;
        }

        this.elements = {};
        this.segments = {};
        this.segmentArray = [];

        this.elements.year   = this.element.querySelector('[data-flip-clock-year]');
        this.elements.month  = this.element.querySelector('[data-flip-clock-month]');
        this.elements.date   = this.element.querySelector('[data-flip-clock-date]');
        this.elements.day    = this.element.querySelector('[data-flip-clock-day]');
        this.elements.hour   = this.element.querySelector('[data-flip-clock-hour]');
        this.elements.minute = this.element.querySelector('[data-flip-clock-minute]');
        this.elements.second = this.element.querySelector('[data-flip-clock-second]');
        this.elements.epoch  = Array.from(this.element.querySelectorAll('[data-flip-clock-epoch]'));

        var date = testRollover || new Date();
        console.debug(date);

        if (this.elements.year) {
            this.segmentArray.push(
                this.segments.year = new Segment({
                    digitCount: 4,
                    startAt: date.getFullYear() - 20,
                    endAt: date.getFullYear() + 29,
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
                    isHour: true,
                    is24Hour: !this.is24Hour,
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
        var epochWindow = this.element.querySelector('[data-flip-clock-epoch-window]');
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

        if (this.segments.epoch) {
            this.segments.epoch.reverse();
        }

        ['year', 'month', 'date', 'day', 'hour', 'minute', 'second'].forEach(function (unit) {
            var element = this.elements[unit];
            var segment = this.segments[unit];
            // parentNode tests are intended to test if in document's hierarchy
            if (segment && !element.parentNode) {
                element.appendChild(segment);
            }
        }.bind(this));

        if (this.segments.epoch) {
            this.segments.epoch.forEach(function (segment) {
                var element = segment.element;
                if (!element.parentNode) {
                    element.appendChild(segment);
                }
            });
        }

        this.element.classList.add('flip-clock');
        this.ticker = new TimeTicker({
            testRollover: testRollover
        });
        this.ticker.callback = this.setTime.bind(this);
        this.ticker.start();
    }

    FlipClock.segmentDelay = 50;

    FlipClock.prototype.refresh = function () {
        this.segmentArray.forEach(function (segment) {
            segment.refresh();
        }.bind(this));
    };

    FlipClock.prototype.setEnableAudio = function (flag) {
        flag = !!flag;
        console.debug("FlipClock: setting enableAudio to " + JSON.stringify(flag));
        this.enableAudio = flag;
        this.segmentArray.forEach(function (segment) {
            segment.setEnableAudio(flag);
        }.bind(this));
    };

    FlipClock.prototype.setAnimationStyle = function (flag) {
        this.segmentArray.forEach(function (segment) {
            segment.setAnimationStyle(flag);
        }.bind(this));
    };

    FlipClock.prototype.setIs24Hour = function (flag) {
        flag = !!flag;
        console.debug("FlipClock: setting is24Hour to " + JSON.stringify(flag));
        this.is24Hour = flag;
        if (this.segments.hour) {
            this.segments.hour.setIs24Hour(flag);
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
        if (this.segments.epoch) {
            this.segments.epoch.forEach(function (segment) {
                segment.setDesiredValue(ms % 10, delay);
                ms = Math.floor(ms / 10);
                delay += FlipClock.segmentDelay / 4;
            }.bind(this));
        }
    };

    FlipClock.prototype.flipWrap = function () {
        this.segmentArray.forEach(function (segment) {
            segment.flipWrap();
        }.bind(this));
    };

    return FlipClock;
}());
