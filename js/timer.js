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
