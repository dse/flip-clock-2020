/*global getWhichFontFamily, FlipClockAudio, TimeTicker, Segment */

var FlipClock = (function () {
    function FlipClock(options) {
        this.is24Hour = false;
        this.enableGoodies = !!(options && options.enableGoodies);
        this.enableAudio   = !!(options && options.enableAudio);
        console.log('FlipClock: audio ' + this.enableAudio ? 'ENABLED' : 'DISABLED');

        if (options) {
            if (!this.element && options.elementId) {
                this.element = document.getElementById(options.elementId);
            }
            if (!this.element && options.element) {
                this.element = options.element;
            }
        }

        if (!this.element) {
            throw new Error('FlipClock: no element');
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

        var date = new Date();

        if (this.elements.year) {
            this.segmentArray.push(
                this.segments.year = new Segment({
                    digitCount: 4,
                    startAt: date.getFullYear() - 20,
                    endAt: date.getFullYear() + 29,
                    element: this.elements.year,
                    enableAudio: this.enableAudio,
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
                    enableAudio: this.enableAudio,
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
                    enableAudio: this.enableAudio,
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
                    enableAudio: this.enableAudio,
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
                    enableAudio: this.enableAudio,
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
                    enableAudio: this.enableAudio,
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
                    enableAudio: this.enableAudio,
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
                    enableAudio: this.enableAudio,
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
        this.addOrRemove12HourClass();

        this.ticker = new TimeTicker();
        this.ticker.callback = this.setTime.bind(this);
        this.ticker.start();
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
        // segments.forEach(function (segment) {
        //     segment.setEnableAudio(flag);
        // });
    };

    FlipClock.prototype.setEnableSecondsTicks = function (flag) {
        flag = !!flag;
        this.enableSecondsTicks = flag;
        var segments = this.segmentArray.filter(function (segment) {
            return segment.isSeconds;
        });
        // segments.forEach(function (segment) {
        //     segment.setEnableAudio(flag);
        // });
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

    FlipClock.prototype.setTime = function () {
        var date = new Date();
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

    return FlipClock;
}());

window.addEventListener('load', function () {
    document.querySelectorAll('.flip-clock').forEach(function (flipClock) {
        var family = getWhichFontFamily(flipClock);
        if (family && /\S/.test(family)) {
            flipClock.setAttribute('data-font-family', family);
        }
    });
});
