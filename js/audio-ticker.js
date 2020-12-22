/*global AudioContext */

function absoluteURL(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.href;
}

var FlipClockAudioCurrent = (function () {
    var Klass = function (url) {
        if (url) {
            this.url = absoluteURL(url);
        } else {
            this.url = absoluteURL('sounds/tick2.wav');
        }
        var tempHandler = (function (event) {
            this.playEmpty();
            unregisterTempHandler();
        }.bind(this));
        function registerTempHandler() {
            document.body.addEventListener('click', tempHandler);
            document.body.addEventListener('tap', tempHandler);
            document.body.addEventListener('touchstart', tempHandler);
        }
        function unregisterTempHandler() {
            document.body.removeEventListener('click', tempHandler);
            document.body.removeEventListener('tap', tempHandler);
            document.body.removeEventListener('touchstart', tempHandler);
        }
        registerTempHandler();
    };
    Object.assign(Klass, {
        createContext: function () {
            if (!this.audioContext) {
                this.audioContext = new AudioContext();
            }
        },
    });
    Object.assign(Klass.prototype, {
        createContext: function () {
            this.constructor.createContext();
            if (this.isLoading) {
                return;
            }
            if (!this.audioBuffer) {
                this.isLoading = true;
                var request = new XMLHttpRequest();
                request.open('GET', this.url, true);
                request.responseType = 'arraybuffer';
                request.onload = function () {
                    this.constructor.audioContext.decodeAudioData(request.response, function (buffer) {
                        this.audioBuffer = buffer;
                        this.isLoading = false;
                    }.bind(this));
                }.bind(this);
                request.send();
            }
            if (!this.audioBuffer) {
                return;
            }
        },
        playEmpty: function () {
            this.createContext();
            if (!this.constructor.audioContext) { return; }

            if (!this.emptyAudioBuffer) {
                this.emptyAudioBuffer = this.constructor.audioContext.createBuffer(
                    1 /* channel */,
                    1 /* frame */,
                    44100 /* samples per second */);
            }

            var source = this.constructor.audioContext.createBufferSource();
            source.buffer = this.emptyAudioBuffer;
            source.connect(this.constructor.audioContext.destination);
            source.start(0);
        },
        play: function () {
            this.createContext();
            if (!this.constructor.audioContext) { return; }
            // if (this.constructor.audioContext.state === 'suspended') { return; }
            var source = this.constructor.audioContext.createBufferSource();
            if (this.constructor.audioContext.state === 'suspended') {
                source.buffer = this.emptyAudioBuffer;
            } else {
                source.buffer = this.audioBuffer;
            }
            source.connect(this.constructor.audioContext.destination);
            source.start(0);
        },
    });
    return Klass;
}());

// Fallback that works well in Chrome.
// Does not work in Safari due to delay.
var FlipClockAudioLegacy = (function () {
    function Klass(url) {
        this.audio = new Audio(url);
        this.audio.volume = 1;
    }
    Klass.prototype.play = function () {
        this.audio.currentTime = 0;
        this.audio.play();
    };
    return Klass;
}());

var FlipClockAudio;
(function () {
    var isiOS9  = /\bOS\s+9_/.test(navigator.userAgent);
    var isiOS10 = /\bOS\s+10_/.test(navigator.userAgent);
    var isiOS11 = /\bOS\s+11_/.test(navigator.userAgent);
    var isiOS12 = /\bOS\s+12_/.test(navigator.userAgent);
    if (isiOS9) {
        // no audio object for now
    } else if (window.AudioContext && (location.protocol === 'http:' || location.protocol === 'https:')) {
        FlipClockAudio = FlipClockAudioCurrent;
    } else {
        FlipClockAudio = FlipClockAudioLegacy;
    }
}());
