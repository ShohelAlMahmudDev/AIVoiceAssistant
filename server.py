from flask import Flask, render_template, request, jsonify, send_from_directory
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
    audio_binary = request.data  # Get the binary audio data
    # Read the MIME type from the request header; default to "audio/wav" if missing
    content_type = request.headers.get("Content-Type", "audio/wav")
    text = speech_to_text(audio_binary, content_type)
    return jsonify({'text': text})

@app.route('/process-message', methods=['POST'])
def process_message_route():
    user_message = request.json.get('userMessage')
    print('user_message', user_message)
    # Avoid processing if user_message is None
    if user_message is None:
        return jsonify({"response": "Error: No user message provided."}), 400

    response_text = process_message(user_message)
    if not response_text:
        return jsonify({"response": "Error: Unable to process the message."}), 500
    response_text = os.linesep.join([s for s in response_text.splitlines() if s])
    return jsonify({"response": response_text})

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('static', 'favicon.ico', mimetype='image/vnd.microsoft.icon')

# if __name__ == "__main__":
#     app.run(port=8000, host='0.0.0.0')
