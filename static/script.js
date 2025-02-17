let lightMode = true;
let recorder = null;
let recording = false;
let voiceOption = "Google US English"; // Default voice
const responses = [];
const botRepeatButtonIDToIndexMap = {};
const userRepeatButtonIDToRecordingMap = {};
const baseUrl = window.location.origin;

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

const getSpeechToText = async (userRecording) => {
  try {
    let response = await fetch(baseUrl + "/speech-to-text", {
      method: "POST",
      body: userRecording.audioBlob,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    response = await response.json();
    return response.text; // Ensure the backend returns { text: "recognized text" }
  } catch (error) {
    console.error("Error in getSpeechToText:", error);
    return null;
  }
};

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
    return response; // Ensure the backend returns { response: "response text" }
  } catch (error) {
    console.error("Error in processUserMessage:", error);
    return null;
  }
};

const cleanTextInput = (value) => {
  return value
    .trim() // remove starting and ending spaces
    .replace(/[\n\t]/g, "") // remove newlines and tabs
    .replace(/<[^>]*>/g, "") // remove HTML tags
    .replace(/[<>&;]/g, ""); // sanitize inputs
};

const recordAudio = () => {
  return new Promise(async (resolve) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", (event) => {
      audioChunks.push(event.data);
    });

    const start = () => mediaRecorder.start();

    const stop = () =>
      new Promise((resolve) => {
        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/mpeg" });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          const play = () => audio.play();
          resolve({ audioBlob, audioUrl, play });
        });

        mediaRecorder.stop();
      });

    resolve({ start, stop });
  });
};

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

const toggleRecording = async () => {
  if (!recording) {
    recorder = await recordAudio();
    recording = true;
    recorder.start();
  } else {
    const audio = await recorder.stop();
    await sleep(1000); // Add a delay to ensure recording stops properly
    recording = false; // Reset recording state
    return audio;
  }
};

const getRandomID = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const scrollToBottom = () => {
  // Scroll the chat window to the bottom
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
      `<div class='message-line my-text'><div class='message-box my-text${
        !lightMode ? " dark" : ""
      }'><div class='me'>${userMessage}</div></div>
            <button id='${userRepeatButtonID}' class='btn volume repeat-button' onclick='userRepeatButtonIDToRecordingMap[this.id].play()'><i class='fa fa-volume-up'></i></button>
            </div>`
    );
  } else {
    $("#message-list").append(
      `<div class='message-line my-text'><div class='message-box my-text${
        !lightMode ? " dark" : ""
      }'><div class='me'>${userMessage}</div></div></div>`
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

  // Append the bot's response to the message list
  $("#message-list").append(
    `<div class='message-line'><div class='message-box${
      !lightMode ? " dark" : ""
    }'>${
      response.response
    }</div><button id='${repeatButtonID}' class='btn volume repeat-button' onclick='textToSpeech(responses[botRepeatButtonIDToIndexMap[this.id]].response, voiceOption)'><i class='fa fa-volume-up'></i></button></div>`
  );

  // Use Web Speech API to speak the bot's response
  textToSpeech(response.response, voiceOption);

  scrollToBottom();
};

$(document).ready(function () {
  // Listen for the "Enter" key being pressed in the input field
  $("#message-input").keyup(function (event) {
    let inputVal = cleanTextInput($("#message-input").val());

    if (event.keyCode === 13 && inputVal != "") {
      const message = inputVal;

      populateUserMessage(message, null);
      populateBotResponse(message);
    }

    inputVal = $("#message-input").val();

    if (inputVal == "" || inputVal == null) {
      $("#send-button")
        .removeClass("send")
        .addClass("microphone")
        .html("<i class='fa fa-microphone'></i>");
    } else {
      $("#send-button")
        .removeClass("microphone")
        .addClass("send")
        .html("<i class='fa fa-paper-plane'></i>");
    }
  });

  // When the user clicks the "Send" button
  $("#send-button").click(async function () {
    if ($("#send-button").hasClass("microphone") && !recording) {
      toggleRecording();
      $(".fa-microphone").css("color", "#f44336");
      console.log("start recording");
      recording = true;
    } else if (recording) {
      toggleRecording().then(async (userRecording) => {
        console.log("stop recording");
        await showUserLoadingAnimation();
        const userMessage = await getSpeechToText(userRecording);
        populateUserMessage(userMessage, userRecording);
        populateBotResponse(userMessage);
      });
      $(".fa-microphone").css("color", "#125ee5");
      recording = false;
    } else {
      // Get the message the user typed in
      const message = cleanTextInput($("#message-input").val());

      populateUserMessage(message, null);
      populateBotResponse(message);

      $("#send-button")
        .removeClass("send")
        .addClass("microphone")
        .html("<i class='fa fa-microphone'></i>");
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
    voices.forEach((voice) => {
      voiceOptions.append(`<option value="${voice.name}">${voice.name} (${voice.lang})</option>`);
    });
  };

  // Update voiceOption when the user selects a new voice
  $("#voice-options").change(function () {
    voiceOption = $(this).val();
    
  });

  // Wait for voices to be loaded
  window.speechSynthesis.onvoiceschanged = populateVoiceOptions;
});

// Text-to-speech method
function textToSpeech(text, voiceName = "") {
  if (!('speechSynthesis' in window)) {
    console.error("Your browser does not support the Web Speech API.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(voice => voice.name === voiceName);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    
  } else {
    console.warn(`Voice "${voiceName}" not found. Using default voice.`);
  }

  utterance.rate = 1; // Speed (0.1 to 10)
  utterance.pitch = 1; // Pitch (0 to 2)
  utterance.volume = 1; // Volume (0 to 1)

  window.speechSynthesis.speak(utterance);

  utterance.onend = () => {
    console.log("Text-to-speech finished.");
  };

  utterance.onerror = (event) => {
    console.error("Error during text-to-speech:", event.error);
  };
}