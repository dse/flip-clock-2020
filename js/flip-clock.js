/*global Symbol, AudioContext, console, checkfont */

/**
 * requestAnimationFrame polyfill
 * https://gist.github.com/paulirish/1579671
 */
(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(
                function () { callback(currTime + timeToCall); },
                timeToCall
            );
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());

/**
 * Array.from polyfill
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
 */
if (!Array.from) {
    Array.from = (function () {
        var symbolIterator;
        try {
            symbolIterator = Symbol.iterator ? Symbol.iterator : 'Symbol(Symbol.iterator)';
        } catch (e) {
            symbolIterator = 'Symbol(Symbol.iterator)';
        }
        var toStr = Object.prototype.toString;
        var isCallable = function (fn) {
            return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
        };
        var toInteger = function (value) {
            var number = Number(value);
            if (isNaN(number)) {
                return 0;
            }
            if (number === 0 || !isFinite(number)) {
                return number;
            }
            return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
        };
        var maxSafeInteger = Math.pow(2, 53) - 1;
        var toLength = function (value) {
            var len = toInteger(value);
            return Math.min(Math.max(len, 0), maxSafeInteger);
        };
        var setGetItemHandler = function setGetItemHandler(isIterator, items) {
            var iterator = isIterator && items[symbolIterator]();
            return function getItem(k) {
                return isIterator ? iterator.next() : items[k];
            };
        };
        var getArray = function getArray(T, A, len, getItem, isIterator, mapFn) {
            var k = 0;
            while (k < len || isIterator) {
                var item = getItem(k);
                var kValue = isIterator ? item.value : item;
                if (isIterator && item.done) {
                    return A;
                } else {
                    if (mapFn) {
                        A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                    } else {
                        A[k] = kValue;
                    }
                }
                k += 1;
            }
            if (isIterator) {
                throw new TypeError('Array.from: provided arrayLike or iterator has length more then 2 ** 52 - 1');
            } else {
                A.length = len;
            }
            return A;
        };
        return function from(arrayLikeOrIterator /*, mapFn, thisArg */) {
            var C = this;
            var items = Object(arrayLikeOrIterator);
            var isIterator = isCallable(items[symbolIterator]);
            if ((arrayLikeOrIterator === null || arrayLikeOrIterator === undefined) && !isIterator) {
                throw new TypeError('Array.from requires an array-like object or iterator - not null or undefined');
            }
            var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
            var T;
            if (typeof mapFn !== 'undefined') {
                if (!isCallable(mapFn)) {
                    throw new TypeError('Array.from: when provided, the second argument must be a function');
                }
                if (arguments.length > 2) {
                    T = arguments[2];
                }
            }
            var len = toLength(items.length);
            var A = isCallable(C) ? Object(new C(len)) : new Array(len);
            return getArray(T, A, len, setGetItemHandler(isIterator, items), isIterator, mapFn);
        };
    })();
}

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

// stackoverflow says absolute URLs work in safari
var tickURL = absoluteURL('sounds/tick2.wav');

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
        /*jshint -W126 */
        if (options.dataAttribute) {
            parent = this.flipClock ? (this.flipClock.element || document) : document;
            element = parent.querySelector('[' + options.dataAttribute + ']');
        } else if (options.element) {
            parent = this.flipClock ? (this.flipClock.element || document) : document;
            element = options.element;
        }
        /*jshint +W126 */

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
        if (this.isHour) {
            if (this.is24Hour) {
                this.element.classList.add('flip-clock-segment-24-hour');
                this.element.classList.remove('flip-clock-segment-12-hour');
            } else {
                this.element.classList.add('flip-clock-segment-12-hour');
                this.element.classList.remove('flip-clock-segment-24-hour');
            }
        } else {
            this.element.classList.remove('flip-clock-segment-12-hour');
            this.element.classList.remove('flip-clock-segment-24-hour');
        }
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
            this.animate2(currentText, newText, nextStateIndex, nextDisplayedStateIndex);
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

    Segment.prototype.animate2 = function (currentText, newText, nextStateIndex, nextDisplayedStateIndex) {
        var isRushed = nextDisplayedStateIndex !== this.desiredDisplayedStateIndex;
        var transitionTime = Segment.transitionTime;
        var v0 = 0.125;
        if (isRushed) {
            transitionTime = transitionTime / 2;
            v0 = v0 * 2;
        }
        this.tick();
        window.requestAnimationFrame(function (startMs) {
            // if (isRushed && isMolasses) {
            //     this.topText.innerHTML = newText;
            //     this.tick();
            //     setTimeout(function () {
            //         this.bottomText.innerHTML = newText;
            //         setTimeout(function () {
            //             this.currentStateIndex = nextStateIndex;
            //             this.currentDisplayedStateIndex = nextDisplayedStateIndex;
            //             this.keepMoving();
            //         }.bind(this), transitionTime * 0.7);
            //     }.bind(this), transitionTime * 0.3);
            //     return;
            // }
            var topFlag = false;
            var bottomFlag = false;
            var frame = function (ms) {
                var state = (ms - startMs) / transitionTime; // from 0 to 1
                if (state >= 1) {
                    // animation is complete
                    if (!topFlag) {
                        this.topText.innerHTML = newText;
                    }
                    this.bottomText.innerHTML = newText;
                    this.element.removeAttribute('data-animation-frame');
                    this.currentStateIndex = nextStateIndex;
                    this.currentDisplayedStateIndex = nextDisplayedStateIndex;
                    this.keepMoving();
                    return;
                }
                var theta = Math.PI * (Math.sin(Math.PI / 2 * state) * (1 - v0) + state * v0); // from 0 to Math.PI
                var cosine = Math.cos(theta); // from 1 to -1
                if (cosine >= 0) {
                    if (!topFlag) {
                        this.topText.innerHTML = newText;
                        this.flipTopText.innerHTML = currentText;
                        topFlag = true;
                    }
                    this.element.setAttribute('data-animation-frame', 1);
                    this.flipTop.style.transform = 'scaleY(' + Math.abs(cosine) + ')';
                } else {
                    if (!topFlag) {
                        this.topText.innerHTML = newText;
                        topFlag = true;
                    }
                    if (!bottomFlag) {
                        this.flipBottomText.innerHTML = newText;
                        bottomFlag = true;
                    }
                    this.element.setAttribute('data-animation-frame', 2);
                    this.flipBottom.style.transform = 'scaleY(' + Math.abs(cosine) + ')';
                }
                window.requestAnimationFrame(frame);
            }.bind(this);
            window.requestAnimationFrame(frame);

        }.bind(this));
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

    Segment.transitionTime = 150;

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
            this.segments.second.isSeconds = true;
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
        this.addOrRemove12HourClass();
    }

    FlipClock.segmentDelay = 50;

    FlipClock.prototype.refresh = function () {
        this.segmentArray.forEach(function (segment) {
            segment.refresh();
        }.bind(this));
    };

    FlipClock.prototype.setEnableTicks = function (flag) {
        flag = !!flag;
        this.enableTicks = flag;
        var segments = this.segmentArray.filter(function (segment) {
            return !segment.isSeconds;
        });
        segments.forEach(function (segment) {
            segment.setEnableAudio(flag);
        });
    };

    FlipClock.prototype.setEnableSecondsTicks = function (flag) {
        flag = !!flag;
        this.enableSecondsTicks = flag;
        var segments = this.segmentArray.filter(function (segment) {
            return segment.isSeconds;
        });
        segments.forEach(function (segment) {
            segment.setEnableAudio(flag);
        });
    };

    FlipClock.prototype.setEnableAudio = function (flag) {
        flag = !!flag;
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
        this.addOrRemove12HourClass();
    };

    FlipClock.prototype.addOrRemove12HourClass = function () {
        if (this.is24Hour) {
            this.element.classList.remove('flip-clock-12-hour');
            this.element.classList.add('flip-clock-24-hour');
        } else {
            this.element.classList.remove('flip-clock-24-hour');
            this.element.classList.add('flip-clock-12-hour');
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
        if (this.enabledAudioByUserRequest) {
            return;
        }
        this.enabledAudioByUserRequest = true;
        this.audio.play();
    };

    return FlipClock;
}());

function getFontFamily(element) {
    var fontFamily;
    if (element.currentStyle) {
        return element.currentStyle.fontFamily;
    } else if (document.defaultView) {
        return document.defaultView.getComputedStyle(element, null).getPropertyValue("font-family");
    }
    return null;
}

function splitFontFamily(fontFamily) {
    var rx = /^\s*(?:'([^']*)'|"([^"]*)"|([^'",\s]*))(?:\s*,\s*|\s*$)?/;
    var result = [];
    var matches;
    var fontFamilyName;
    /*jshint -W126 */
    while (/\S/.test(fontFamily) && (matches = rx.exec(fontFamily))) {
        if (matches[1] !== null && matches[1] !== undefined) {
            result.push(matches[1]);
        } else if (matches[2] !== null && matches[2] !== undefined) {
            result.push(matches[2]);
        } else if (matches[3] !== null && matches[3] !== undefined) {
            result.push(matches[3]);
        } else {
            break;
        }
        fontFamily = String(fontFamily).substring(matches.index + matches[0].length);
    }
    return result;
}

function getWhichFontFamily(element) {
    var families = splitFontFamily(getFontFamily(element));
    var result;
    families.forEach(function (family) {
        if (result !== null && result !== undefined) {
            return;
        }
        console.log(JSON.stringify(family));
        if (checkfont(family)) {
            console.log(':-)');
            result = family;
        }
    });
    return result;
}

window.addEventListener('load', function () {
    document.querySelectorAll('.flip-clock').forEach(function (flipClock) {
        var family = getWhichFontFamily(flipClock);
        if (family && /\S/.test(family)) {
            flipClock.setAttribute('data-font-family', family);
        }
    });
});
