import base64
import json
from flask import Flask, render_template, request,send_from_directory
from worker import speech_to_text, text_to_speech, process_message
from flask_cors import CORS
import os

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/speech-to-text', methods=['POST'])
def speech_to_text_route():
    print("processing speech-to-text")
    audio_binary = request.data # Get the user's speech from their request
    text = speech_to_text(audio_binary) # Call speech_to_text function to transcribe the speech

    # Return the response back to the user in JSON format
    response = app.response_class(
        response=json.dumps({'text': text}),
        status=200,
        mimetype='application/json'
    )
    print(response)
    print(response.data)
    return response


@app.route('/process-message', methods=['POST'])
def process_message_route():
    user_message = request.json['userMessage'] # Get user's message from their request
    print('user_message', user_message)

    voice = request.json['voice'] # Get user's preferred voice from their request
    print('voice', voice)

    # Call process_message function to process the user's message and get a response back
    response_text = process_message(user_message)

    # Clean the response to remove any emptylines
    response_text = os.linesep.join([s for s in response_text.splitlines() if s])

    # Call our text_to_speech function to convert OpenAI Api's reponse to speech
    response_speech = text_to_speech(response_text, voice)

    # convert response_speech to base64 string so it can be sent back in the JSON response
    response_speech = base64.b64encode(response_speech).decode('utf-8')

    # Send a JSON response back to the user containing their message's response both in text and speech formats
    response = app.response_class(
        response=json.dumps({"ResponseText": response_text, "ResponseSpeech": response_speech}),
        status=200,
        mimetype='application/json'
    )

    print(response)
    return response

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('static', 'favicon.ico', mimetype='image/vnd.microsoft.icon')
if __name__ == "__main__":
    app.run(port=8000, host='0.0.0.0')
