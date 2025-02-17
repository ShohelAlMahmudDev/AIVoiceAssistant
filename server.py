import base64
import json
from flask import Flask, render_template, request, jsonify,send_from_directory
from worker import speech_to_text, process_message
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
    audio_binary = request.data  # Get the user's speech from their request
    text = speech_to_text(audio_binary)  # Call speech_to_text function to transcribe the speech

    # Return the response back to the user in JSON format
    return jsonify({'text': text})

@app.route('/process-message', methods=['POST'])
def process_message_route():
    user_message = request.json['userMessage']  # Get user's message from their request
    print('user_message', user_message)

    voice = request.json['voice']  # Get user's preferred voice from their request
    print('voice', voice)

    # Call process_message function to process the user's message and get a response back
    response_text = process_message(user_message)
    if not response_text:
        return jsonify({"response": "Error: Unable to process the message."}), 500

    # Clean the response to remove any empty lines
    response_text = os.linesep.join([s for s in response_text.splitlines() if s])

    return jsonify({"response": response_text})

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('static', 'favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == "__main__":
    app.run(port=8000)