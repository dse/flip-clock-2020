/*global FlipClockAudio */

var Segment = (function () {
    function Segment(options) {
        this.animationStyle = 1;
        this.digitCount     = options.digitCount;
        this.flipClock      = options.flipClock;
        this.isHour         = !!options.isHour;
        this.enableAudio    = !!(options && options.enableAudio);
        this.is24Hour       = !!(options && options.is24Hour);

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

        if (this.enableAudio && !this.audio && window.FlipClockAudio) {
            this.audio = new FlipClockAudio();
        }

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
        if (!this.audio && window.FlipClockAudio) {
            this.audio = new FlipClockAudio();
        }
        if (this.audio) {
            this.audio.play();
        }
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
        this.is24Hour = !!flag;
        this.addOrRemove12HourClass();
        this.refresh();
    };
    Segment.prototype.setEnableAudio = function (flag) {
        flag = !!flag;
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
