/*global AudioContext */

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
