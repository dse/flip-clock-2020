var TimeTicker = (function () {
    function TimeTicker() {
    }
    TimeTicker.prototype.start = function () {
        this.callback();
        this.timeout = setTimeout(function () {
            this.start();
        }.bind(this), 1000 - new Date().getTime() % 1000);
    };
    TimeTicker.prototype.stop = function () {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    };
    return TimeTicker;
}());
