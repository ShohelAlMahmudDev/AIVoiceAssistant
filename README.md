# AI Voice Assistant

An AI-powered voice assistant that utilizes speech recognition and natural language processing to understand and execute user commands. This project is designed to allow users to interact with their computer using voice commands, perform actions, and get verbal feedback.

## Features

- **Speech Recognition**: Converts voice commands into text for processing.
- **Text-to-Speech**: Provides verbal responses using text-to-speech synthesis.
- **Custom Commands**: Allows the addition of custom commands for personalized functionality.
- **Cross-Platform**: Works on Windows, macOS, and Linux.
- **Action Execution**: Perform various tasks such as searching the web, setting reminders, etc.

## Requirements

Ensure you have the following dependencies installed:

  - **Flask**
  - **Flask_Cors**
  - **requests**
  - **python-dotenv**
  - **jsonify**


## Installation

### 1. Clone the repository

git clone https://github.com/ShohelAlMahmudDev/AIVoiceAssistant.git
cd AIVoiceAssistant

### 2. Install required dependencies:

  pip install -r requirements.txt

### 3. Set up your environment variables in the .env file:

  - **WATSON_API_KEY_STT=your_watson_api_key**
  - **WATSON_API_SERVICE_URL_STT=your_watson_api_url**
  - **TOGETHER_API_KEY=your_together_api_key**
  - **TOGETHER_API_SERVICE_URL=your_together_api_url**

## Usage
  Run the server:

  python server.py
  Open the app in your browser at http://localhost:8000.
## If you want to run in docker do the following
  if you have docker running on your machine run
  -**docker-compose up** for attached mode
  -**docker-compose up -d** for detached mode
## If you want to stop and remove the docker run the following command
  -**docker-compose down**
## License
  MIT
