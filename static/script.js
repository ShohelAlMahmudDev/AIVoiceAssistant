// script.js

let lightMode = true;
let recording = false;
let voiceOption = ""; // Default voice
const responses = [];
const botRepeatButtonIDToIndexMap = {};
const userRepeatButtonIDToRecordingMap = {};
const baseUrl = window.location.origin;

// Animation functions
async function showBotLoadingAnimation() {
  await sleep(500);
  $(".loading-animation")[1].style.display = "inline-block";
}

function hideBotLoadingAnimation() {
  $(".loading-animation")[1].style.display = "none";
}

async function showUserLoadingAnimation() {
  await sleep(100);
  $(".loading-animation")[0].style.display = "flex";
}

function hideUserLoadingAnimation() {
  $(".loading-animation")[0].style.display = "none";
}

// Send audio blob to server for speech-to-text conversion
const getSpeechToText = async (userRecording) => {
  try {
    // Pass the MIME type in the header so the server knows the audio format
    let response = await fetch(baseUrl + "/speech-to-text", {
      method: "POST",
      headers: {
        "Content-Type": userRecording.mimeType,
      },
      body: userRecording.audioBlob,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    response = await response.json();
    return response.text; // Expected response format: { text: "recognized text" }
  } catch (error) {
    console.error("Error in getSpeechToText:", error);
    return null;
  }
};

// Process user text message by sending it to your backend
const processUserMessage = async (userMessage) => {
  try {
    let response = await fetch(baseUrl + "/process-message", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: userMessage, voice: voiceOption }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    response = await response.json();
    return response; // Expected response format: { response: "response text" }
  } catch (error) {
    console.error("Error in processUserMessage:", error);
    return null;
  }
};

const cleanTextInput = (value) => {
  return value
    .trim()
    .replace(/[\n\t]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>&;]/g, "");
};

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

// toggleRecording uses the Recorder.js functions defined in recorder.js
const toggleRecording = async () => {
  if (!recording) {
    await startRecording(); // from recorder.js
    recording = true;
  } else {
    const audio = await stopRecording(); // from recorder.js
    recording = false;
    return audio;
  }
};

const getRandomID = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const scrollToBottom = () => {
  $("#chat-window").animate({
    scrollTop: $("#chat-window")[0].scrollHeight,
  });
};

const populateUserMessage = (userMessage, userRecording) => {
  $("#message-input").val("");

  if (userRecording) {
    const userRepeatButtonID = getRandomID();
    userRepeatButtonIDToRecordingMap[userRepeatButtonID] = userRecording;
    hideUserLoadingAnimation();
    $("#message-list").append(
      `<div class='message-line my-text'>
          <div class='message-box my-text${!lightMode ? " dark" : ""}'>
              <div class='me'>${userMessage}</div>
          </div>
          <button id='${userRepeatButtonID}' class='btn volume repeat-button' onclick='userRepeatButtonIDToRecordingMap[this.id].play()'>
              <i class='fa fa-volume-up'></i>
          </button>
       </div>`
    );
  } else {
    $("#message-list").append(
      `<div class='message-line my-text'>
          <div class='message-box my-text${!lightMode ? " dark" : ""}'>
              <div class='me'>${userMessage}</div>
          </div>
       </div>`
    );
  }
  scrollToBottom();
};

const populateBotResponse = async (userMessage) => {
  await showBotLoadingAnimation();
  const response = await processUserMessage(userMessage);
  if (!response) {
    hideBotLoadingAnimation();
    return; // Exit if there's an error
  }
  responses.push(response);
  const repeatButtonID = getRandomID();
  botRepeatButtonIDToIndexMap[repeatButtonID] = responses.length - 1;
  hideBotLoadingAnimation();

  $("#message-list").append(
    `<div class='message-line'>
        <div class='message-box${!lightMode ? " dark" : ""}'>
          ${response.response}
        </div>
        <button id='${repeatButtonID}' class='btn volume repeat-button' onclick='textToSpeech(responses[botRepeatButtonIDToIndexMap[this.id]].response, voiceOption)'>
          <i class='fa fa-volume-up'></i>
        </button>
     </div>`
  );

  // Use Web Speech API to speak the bot's response
  textToSpeech(response.response, voiceOption);
  scrollToBottom();
};

$(document).ready(function () {
  // Listen for the "Enter" key in the input field
  $("#message-input").keyup(function (event) {
    let inputVal = cleanTextInput($("#message-input").val());
    if (event.keyCode === 13 && inputVal !== "") {
      const message = inputVal;
      populateUserMessage(message, null);
      populateBotResponse(message);
    }
    // Toggle send button icon based on input presence
    inputVal = $("#message-input").val();
    if (!inputVal) {
      $("#send-button").removeClass("send").addClass("microphone").html("<i class='fa fa-microphone'></i>");
    } else {
      $("#send-button").removeClass("microphone").addClass("send").html("<i class='fa fa-paper-plane'></i>");
    }
  });

  // When the user clicks the "Send" button
  $("#send-button").click(async function () {
    if ($("#send-button").hasClass("microphone") && !recording) {
      // Start recording
      toggleRecording();
      $(".fa-microphone").css("color", "#f44336");
      console.log("start recording");
      recording = true;
    } else if (recording) {
      // Stop recording and process the audio
      toggleRecording().then(async (userRecording) => {
        console.log("stop recording"); 
        await showUserLoadingAnimation();
        const userMessage = await getSpeechToText(userRecording);
        if (!userMessage) {
          console.error("No transcription returned; skipping message processing.");
          hideUserLoadingAnimation();
          return;
        }
        populateUserMessage(userMessage, userRecording);
        populateBotResponse(userMessage);
      });
      $(".fa-microphone").css("color", "#125ee5");
      recording = false;
    } else {
      // Handle text message input case
      const message = cleanTextInput($("#message-input").val());
      populateUserMessage(message, null);
      populateBotResponse(message);
      $("#send-button").removeClass("send").addClass("microphone").html("<i class='fa fa-microphone'></i>");
    }
  });

  // Handle light/dark mode switch
  $("#light-dark-mode-switch").change(function () {
    $("body").toggleClass("dark-mode");
    $(".message-box").toggleClass("dark");
    $(".loading-dots").toggleClass("dark");
    $(".dot").toggleClass("dark-dot");
    lightMode = !lightMode;
  });

  // Populate voice options dynamically
  const populateVoiceOptions = () => {
    const voices = window.speechSynthesis.getVoices();
    const voiceOptions = $("#voice-options");
    voiceOptions.empty();
    if (voices.length === 0) {
      console.warn("No voices available.");
      return;
    }
    voices.forEach((voice) => {
      voiceOptions.append(`<option value="${voice.name}">${voice.name} (${voice.lang})</option>`);
    });
    if (!voiceOption && voices.length > 0) {
      voiceOption = voices[0].name;
      voiceOptions.val(voiceOption);
    }
  };

  $("#voice-options").change(function () {
    voiceOption = $(this).val();
    console.log("Selected voice:", voiceOption);
  });

  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = populateVoiceOptions;
  } else {
    console.warn("onvoiceschanged event not supported. Falling back to setTimeout.");
    setTimeout(populateVoiceOptions, 1000);
  }
  populateVoiceOptions();
});

// Text-to-speech using Web Speech API
function textToSpeech(text, voiceName = "") {
  if (!("speechSynthesis" in window)) {
    console.error("Your browser does not support the Web Speech API.");
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find((voice) => voice.name === voiceName);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  } else {
    console.warn(`Voice "${voiceName}" not found. Using default voice.`);
  }
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
  utterance.onend = () => {
    console.log("Text-to-speech finished.");
  };
  utterance.onerror = (event) => {
    console.error("Error during text-to-speech:", event.error);
  };
}
