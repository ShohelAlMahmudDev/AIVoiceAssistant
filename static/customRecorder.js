// recorder.js
// This file provides functions to initialize the audio recorder, start, and stop recording,
// then export the audio as a WAV Blob.

let audioContext, recorder;

async function initAudio() {
  // Request audio stream from the user
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  // Create an AudioContext instance
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  // Create a media stream source from the audio stream
  const input = audioContext.createMediaStreamSource(stream);
  // Initialize Recorder.js with the audio input; using 1 channel (mono)
  recorder = new Recorder(input, { numChannels: 1 });
}

async function startRecording() {
  if (!recorder) {
    await initAudio();
  }
  recorder.record();
  console.log("Recording started...");
}

async function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!recorder) {
      return reject("Recorder not initialized");
    }
    recorder.stop();
    // Export the recorded audio as a WAV Blob
    recorder.exportWAV(function(blob) {
      recorder.clear(); // Clear the recorder for the next recording
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      // Return an object with the Blob, URL, a play function, and a forced MIME type of WAV.
      resolve({ audioBlob: blob, audioUrl, play: () => audio.play(), mimeType: "audio/wav" });
    });
  });
}
