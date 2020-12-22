/*global AudioContext */

var FlipClockAudio;

function absoluteURL(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.href;
}

if (window.AudioContext && (location.protocol === 'http:' || location.protocol === 'https:')) {
    console.log('using FlipClockAudio object with AudioContext');
    FlipClockAudio = (function () {
        var FlipClockAudio = function (url) {
            if (url) {
                this.url = absoluteURL(url);
            } else {
                this.url = absoluteURL('sounds/tick2.wav');
            }
        };
        Object.assign(FlipClockAudio.prototype, {
            play: function () {
                if (!FlipClockAudio.audioContext || FlipClockAudio.audioContext.state === 'suspended') {
                    FlipClockAudio.audioContext = new AudioContext();
                }
                if (!FlipClockAudio.audioContext) {
                    return;
                }
                if (this.isLoading) {
                    return;
                }
                if (!this.audioBuffer) {
                    this.isLoading = true;
                    var request = new XMLHttpRequest();
                    request.open('GET', this.url, true);
                    request.responseType = 'arraybuffer';
                    request.onload = function () {
                        FlipClockAudio.audioContext.decodeAudioData(request.response, function (buffer) {
                            this.audioBuffer = buffer;
                            this.isLoading = false;
                        }.bind(this));
                    }.bind(this);
                    request.send();
                }
                if (!this.audioBuffer) {
                    return;
                }
                if (FlipClockAudio.audioContext.state === 'suspended') {
                    return;
                }
                var source = FlipClockAudio.audioContext.createBufferSource();
                source.buffer = this.audioBuffer;
                source.connect(FlipClockAudio.audioContext.destination);
                source.start(0);
            }
        });
        return FlipClockAudio;
    }());
} else {
    console.log('using FlipClockAudio object without AudioContext');
    // fallback that works well in Chrome but not Safari.
    FlipClockAudio = (function () {
        function FlipClockAudio(url) {
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
