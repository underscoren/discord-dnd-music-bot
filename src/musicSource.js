import * as $ from "jquery";

class MusicSource {
    srcFilePath;
    audioElement;

    audioNodes = [];
    mediaElementNode;
    gainNode;

    looping = false;

    constructor(context, path) {
        this.srcFilePath = path;
        this.audioElement = new Audio(path);

        this.mediaElementNode = context.createMediaElementSource(this.audioElement);
        this.gainNode = context.createGain();
        this.mediaElementNode.connect(this.gainNode);
    }

    play() {
        this.audioElement.play();
    }

    pause() {
        this.audioElement.pause();
    }

    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
    }

    seek(time) {
        this.audioElement.currentTime = time;
    }

    connect(node) {
        this.gainNode.connect(node);
    }

    setLooping(looping) {
        this.looping = looping;
        this.audioElement.loop = this.looping;
    }
}

class SFXSource {
    srcFilePath;
    context;

    audioNodes = [];
    audioBuffer;
    gainNode;

    downloaded = false;

    constructor(context, path) {
        this.srcFilePath = path;
        this.context = context;

        this.gainNode = context.createGain();
        this.audioNodes.push(this.gainNode);
    }

    fire() {
        if(!this.downloaded) {
            this.download()
                .then(() => this.fire())
                .catch(err => console.error(err)); // TODO: fire a toast to tell user something's wrong
        } else {
            const auidoBufferNode = this.context.createBufferSource();
            auidoBufferNode.buffer = this.audioBuffer;
            auidoBufferNode.connect(this.audioNodes[0]);
            auidoBufferNode.start();
        }
    }

    download() {
        return new Promise((resolve, reject) => {
            $.get({
                url: this.srcFilePath,
                xhr: () => { // force jquery to return arraybuffer
                    let xhr = new XMLHttpRequest();
                    xhr.responseType = "arraybuffer";
                    return xhr;
                }
            }).then(data => {
                this.context.decodeAudioData(data).then(bufferData => {
                    this.audioBuffer = bufferData;
                    this.downloaded = true;
                    resolve();
                });
            }).catch(reject);
        });
    }

    connect(node) {
        this.gainNode.connect(node);
    }

}

export { MusicSource, SFXSource };