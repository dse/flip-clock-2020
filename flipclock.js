var Ticker = (function() {
    function Ticker() {
    }
    Ticker.prototype.start = function() {
        var date = new Date();
        this.callback(date);
        this.timeout = setTimeout(function() {
            this.start();
        }.bind(this), 1000 - date.getTime() % 1000);
    };
    Ticker.prototype.stop = function() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    };
    return Ticker;
}());

var FlipClock = (function() {

    var el = document.createElement("fakeelement");
    var transitionEvent;
    if (el.style.transition !== undefined) {
        transitionEvent = "transitionend";
    } else if (el.style.OTransition !== undefined) {
        transitionEvent = "oTransitionEnd";
    } else if (el.style.MozTransition !== undefined) {
        transitionEvent = "transitionend";
    } else if (el.style.WebkitTransition !== undefined) {
        transitionEvent = "webkitTransitionEnd";
    }
    
    function FlipClock(id) {
        var e = document.getElementById(id);
        if (!e) {
            return;
        }
        this.f1 = new Flipper({
            digits: 2,
            states: 24
        });
        this.f2 = new Flipper({
            digits: 2,
            states: 60
        });
        this.f3 = new Flipper({
            digits: 2,
            states: 60
        });
        e.appendChild(this.f1.flipper);
        e.appendChild(this.f2.flipper);
        e.appendChild(this.f3.flipper);
        if (!e.className) {
            e.className = "flipClock";
        } else {
            e.className += " flipClock";
        }
        this.ticker = new Ticker();
        this.ticker.callback = this.setTime.bind(this);
        this.ticker.start();
    }

    FlipClock.prototype.setTime = function(date) {
        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        this.f1.setDesiredState(h);
        this.f2.setDesiredState(m);
        this.f3.setDesiredState(s);
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

    function Flipper(options) {
        this.digits = options.digits;
        this.states = options.states;

        this.state = -1;
        this.desiredState = -1;
        
        var flipper = E("span", "flipper");
        var inner = E("span", "inner");
        var top = E("span", "top");
        var bottom = E("span", "bottom");

        var topText = T("");
        var bottomText = T("");

        flipper.appendChild(inner);
        inner.appendChild(top);
        inner.appendChild(bottom);
        top.appendChild(topText);
        bottom.appendChild(bottomText);

        this.flipper = flipper;
        this.inner = inner;
        this.top = top;
        this.bottom = bottom;

        this.topText = topText;
        this.bottomText = bottomText;

        this.audio = document.createElement("audio");
        this.audio.src = "tick8.wav";
    }

    Flipper.prototype.setDesiredState = function(state) {
        this.desiredState = state;
        if (!this.moving) {
            this.moving = true;
            this.setNextState();
        }
    };
    
    Flipper.prototype.stateText = function(state) {
        var newText = String(state);
        while (this.digits && newText.length < this.digits) {
            newText = "0" + newText;
        }
        return newText;
    };
    
    Flipper.prototype.setNextState = function() {
        if (this.state === this.desiredState) {
            this.moving = false;
            return;
        }
        var nextState = (this.state + 1) % this.states;
        var newText = this.stateText(nextState);
        var currentText = this.topText.data;
        this.animate1(currentText, newText, nextState);
    };

    Flipper.prototype.animate1 = function(currentText, newText, nextState) {
        var flip11 = E("span", "flip11");
        var flip22 = E("span", "flip22");
        var flip11Text = T("");
        var flip22Text = T("");
        flip11.appendChild(flip11Text);
        flip22.appendChild(flip22Text);
        this.inner.appendChild(flip11);
        this.inner.appendChild(flip22);
        flip11Text.data = currentText;
        flip22Text.data = newText;
        flip11.style.display = "inline-block";
        this.topText.data = newText;
        this.audio.play();
        setTimeout(function() {
            flip11.removeChild(flip11Text);
            this.inner.removeChild(flip11);
            flip22.style.display = "inline-block";
            setTimeout(function() {
                flip22.removeChild(flip22Text);
                this.inner.removeChild(flip22);
                this.bottomText.data = newText;
                this.state = nextState;
                this.setNextState();
            }.bind(this), 50);
        }.bind(this), 50);
    };

    return FlipClock;
}());
