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

// polyfill
window.AudioContext = window.AudioContext || window.webkitAudioContext;

var FlipClockAudio;

if (window.AudioContext && (location.protocol === 'http:' || location.protocol === 'https:')) {
    FlipClockAudio = (function () {
        var context = new AudioContext();
        var audioCollection = {};
        function FlipClockAudio(url) {
            this.audio = audioCollection[url];
            if (!this.audio) {
                this.audio = audioCollection[url] = {};
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                request.responseType = 'arraybuffer';
                request.onload = function () {
                    context.decodeAudioData(request.response, function (buffer) {
                        this.audio.buffer = buffer;
                    }.bind(this));
                }.bind(this);
                request.send();
            }
        }
        FlipClockAudio.prototype.play = function () {
            if (!this.audio.buffer) {
                return;
            }
            var source = context.createBufferSource();
            source.buffer = this.audio.buffer;
            source.connect(context.destination);
            source.start(0);
        };
        return FlipClockAudio;
    }());
} else {
    // fallback that works well in Chrome but not Safari.
    FlipClockAudio = (function () {
        function FlipClockAudio(url) {
            this.url = url = absoluteURL(url);
            this.audio = new Audio(url);
            this.audio.volume = 1;
        }
        FlipClockAudio.prototype.play = function () {
            this.audio.currentTime = 0;
            this.audio.play();
        };
        return FlipClockAudio;
    }());
}

/**
 * requestAnimationFrame polyfill
 */

(function () {
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
}());

// stackoverflow says absolute URLs work in safari
var tickURL = absoluteURL('tick8.wav');

var Segment = (function () {
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

        this.currentStateIndex = -1;
        this.desiredStateIndex = -1;
        this.currentDisplayedStateIndex = -1;
        this.desiredDisplayedStateIndex = -1;
        this.deltaForFun = 0;
        this.autoResetDeltaForFun = true;

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

        this.audio = new FlipClockAudio(tickURL);

        this.callback = [];
        this.addOrRemove12HourClass();
    }
    Segment.prototype.addOrRemove12HourClass = function () {
        var twelveHourClassAddOrRemove = (this.isHour && !this.is24Hour) ? 'add' : 'remove';
        this.element.classList[twelveHourClassAddOrRemove]('flip-clock-segment-twelve-hour');
        this.flipClock.element.classList[twelveHourClassAddOrRemove]('flip-clock-twelve-hour');
    };
    Segment.prototype.setDesiredValue = function (value, delay) {
        if ('startAt' in this) {
            return this.setDesiredState(value - this.startAt, delay);
        }
        return this.setDesiredState(value, delay);
    };
    Segment.prototype.setDesiredState = function (stateIndex, delay) {
        if (delay) {
            setTimeout(function () {
                this.setDesiredState(stateIndex, null);
            }.bind(this), delay);
            return;
        }
        this.desiredStateIndex          = stateIndex;
        this.desiredDisplayedStateIndex = (stateIndex + this.deltaForFun) % this.stateCount;
        this.startMoving();
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
            newText = '<span class="numeric-value" data-numeric-value="' + newText + '">' + newText + '</span>';
            if (stateIndex >= 0 && stateIndex < 12) {
                newText = newText + '<span class="ampm am"></span>';
            } else if (stateIndex >= 12 && stateIndex < 24) {
                newText = newText + '<span class="ampm pm"></span>';
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
        return '<span class="numeric-value" data-numeric-value="' + newText + '">' + newText + '</span>';
    };

    Segment.prototype.startMoving = function () {
        if (this.currentDisplayedStateIndex === this.desiredDisplayedStateIndex) {
            this.moving = false;
            return;
        }
        if (this.moving) {
            return;
        }
        this.moving = true;
        this.move();
    };

    Segment.prototype.keepMoving = function () {
        if (this.currentDisplayedStateIndex === this.desiredDisplayedStateIndex) {
            this.moving = false;
            return;
        }
        this.moving = true;
        this.move();
    };

    Segment.prototype.move = function () {
        var nextStateIndex          = (this.currentStateIndex          + 1) % this.stateCount;
        var nextDisplayedStateIndex = (this.currentDisplayedStateIndex + 1) % this.stateCount;
        var newText     = this.stateText(nextDisplayedStateIndex);
        var currentText = this.topText.innerHTML;
        if (this.animationStyle === 1) {
            this.animate1(currentText, newText, nextStateIndex, nextDisplayedStateIndex);
        } else {
            this.animate0(currentText, newText, nextStateIndex, nextDisplayedStateIndex);
        }
    };

    Segment.prototype.refresh = function () {
        var text = this.stateText(this.currentDisplayedStateIndex);
        this.topText.innerHTML = text;
        this.bottomText.innerHTML = text;
    };

    Segment.prototype.addDeltaForFun = function () {
        this.deltaForFun = (this.deltaForFun + 1) % this.stateCount;
        this.desiredDisplayedStateIndex = (this.desiredStateIndex + this.deltaForFun) % this.stateCount;
        this.startMoving();

        if (this.autoResetDeltaForFun) {
            if (this.resetDeltaForFunTimeout) {
                clearTimeout(this.resetDeltaForFunTimeout);
                delete this.resetDeltaForFunTimeout;
            }
            this.resetDeltaForFunTimeout = setTimeout(function () {
                delete this.resetDeltaForFunTimeout;
                this.resetDeltaForFun();
            }.bind(this), 2000);
        }
    };

    Segment.prototype.resetDeltaForFun = function () {
        this.deltaForFun = 0;
        this.desiredDisplayedStateIndex = this.desiredStateIndex;
        this.startMoving();
    };

    Segment.prototype.animate0 = function (currentText, newText, nextStateIndex, nextDisplayedStateIndex) {
        var promise;
        window.requestAnimationFrame(function () {
            this.topText.innerHTML = newText;
            this.bottomText.innerHTML = newText;
            setTimeout(function () {
                this.currentStateIndex = nextStateIndex;
                this.currentDisplayedStateIndex = nextDisplayedStateIndex;
                this.keepMoving();
            }.bind(this), Segment.transitionTime * 2);
        }.bind(this));
    };

    var isMolasses = document.documentElement.hasAttribute('data-molasses');

    Segment.prototype.tick = function () {
        if (!this.enableAudio) {
            return;
        }
        this.audio.play();
    };

    Segment.prototype.animate1 = function (currentText, newText, nextStateIndex, nextDisplayedStateIndex) {
        window.requestAnimationFrame(function () {
            var isRushed = nextDisplayedStateIndex !== this.desiredDisplayedStateIndex;
            if (isRushed && isMolasses) {
                this.topText.innerHTML = newText;
                this.tick();
                setTimeout(function () {
                    this.bottomText.innerHTML = newText;
                    setTimeout(function () {
                        this.currentStateIndex = nextStateIndex;
                        this.currentDisplayedStateIndex = nextDisplayedStateIndex;
                        this.keepMoving();
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
                    this.currentStateIndex = nextStateIndex;
                    this.currentDisplayedStateIndex = nextDisplayedStateIndex;
                    this.keepMoving();
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

        // for shits and giggles but also so we can plan a thingy on
        // user request
        this.audio = new FlipClockAudio(tickURL);

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

    FlipClock.prototype.resetDeltaForFun = function () {
        var delayMs = 0;
        this.segmentArray.forEach(function (segment) {
            if (delayMs) {
                setTimeout(function () {
                    segment.resetDeltaForFun();
                }, delayMs);
            } else {
                segment.resetDeltaForFun();
            }
            delayMs += FlipClock.segmentDelay / 3;
        }.bind(this));
    };

    FlipClock.prototype.enableAudioByUserRequest = function () {
        this.audio.play();
    };

    return FlipClock;
}());
