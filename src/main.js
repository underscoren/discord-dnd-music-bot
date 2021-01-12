import * as $ from "jquery";
import { MusicSource, SFXSource } from "./musicSource"

// setup audioContext and default nodes
const context = new AudioContext({sampleRate: 48000});
const gainElement = context.createGain();
gainElement.gain.value = 0.5;
const outputScriptNode = context.createScriptProcessor(512, 2, 2); // used to take raw audio data and send it via a socket
gainElement.connect(outputScriptNode);

// bug fix - ScriptProcessorNode doesn't emit audioprocess events unless both input and output are connected (chrome only?)
const fakeGain = context.createGain();
fakeGain.gain.value = 0; // 0 gain node will perform no work (apparently)
outputScriptNode.connect(fakeGain);
fakeGain.connect(context.destination);

$("#global-volume").on("input", event => {
    const volume = $(event.target).val()/100;
    gainElement.gain.setValueAtTime(volume, context.currentTime);
});

// load audio
$.getJSON("/audio/music").done(fileList => {
    for (const file of fileList) {
        const fileName = file.split("/").slice(-1)[0];
        const filePath = file.split("/").slice(0,-1).join("/");
        const musicSource = new MusicSource(context, file);
        musicSource.connect(gainElement);

        const playButton = $("<span role='button' class='bi bi-play-fill'>");
        // toggle play / pause
        playButton.on("click", event => {
            if(context.state != "running") context.resume(); // make sure context is actually running
            
            if($(event.target).hasClass("bi-play-fill")) {
                musicSource.play();
                $(event.target).removeClass("bi-play-fill").addClass("bi-pause-fill");
            } else {
                musicSource.pause();
                $(event.target).removeClass("bi-pause-fill").addClass("bi-play-fill");
            }
        });

        const stopButton = $("<span role='button' class='bi bi-stop-fill'>");
        stopButton.on("click", () => {
            musicSource.stop();
            
            // reset play button
            if($(playButton).hasClass("bi-pause-fill"))
                $(playButton).removeClass("bi-pause-fill").addClass("bi-play-fill");
        });

        const loopButton = $("<span role='button' class='text-danger bi bi-arrow-repeat'>");
        // toggle loop
        loopButton.on("click", event => {
            if($(event.target).hasClass("text-danger")) {
                musicSource.setLooping(true);
                $(event.target).removeClass("text-danger").addClass("text-success");
            } else {
                musicSource.setLooping(false);
                $(event.target).removeClass("text-success").addClass("text-danger");
            }
        });
        
        const listElement = $("<li class='list-group-item list-group-item-action d-flex justify-content-between align-items-center py-0'>").append([
            file,
            $("<span style='font-size: 1.5rem'>").append([
                playButton,
                stopButton,
                loopButton,
            ])
        ]);

        // append list element to document
        $("#music-sources").append(listElement);
    }
});


$.getJSON("/audio/sfx").done(fileList => {
    for(const file of fileList) {
        const sfxsource = new SFXSource(context, file);
        sfxsource.connect(gainElement);

        const playButton = $("<span role='button' class='bi bi-play-fill'>");
        // toggle play / pause
        playButton.on("click", () => {
            if(context.state != "running") context.resume(); // make sure context is actually running
            sfxsource.fire();
        });

        const listElement = $("<li class='list-group-item list-group-item-action d-flex justify-content-between align-items-center py-0'>").append([
            file,
            $("<span style='font-size: 1.5rem'>").append([
                playButton
            ])
        ]);

        $("#sfx-sources").append(listElement);
    }
});

// websocket connection
const socket = new WebSocket("ws://" + window.location.hostname + window.location.pathname);

socket.binaryType = "arraybuffer";

socket.addEventListener("open", () => {
    console.log("websocket connected");

    // yes i am aware scriptnodes are deprecated. audio worklets are just too annoying to use
    outputScriptNode.onaudioprocess = audioProcessingEvent => {
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const buffer = new Int16Array(inputBuffer.length * 2);

        // merge both channels
        const leftChannel = inputBuffer.getChannelData(0);
        const rightChannel = inputBuffer.getChannelData(1);
        for(let sample = 0; sample < inputBuffer.length; sample++) {
            buffer[sample*2] = leftChannel[sample] * 0x7FFF; // quantize float32 sample to int16
            buffer[sample*2+1] = rightChannel[sample] * 0x7FFF;
        }

        //console.log("pushing chunk",audioProcessingEvent.playbackTime);
        socket.send(buffer);
    }

    console.log("setup outputScriptNode");
});
