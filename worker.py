import requests

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Access the API keys
 
WATSON_API_KEY_STT = os.getenv("WATSON_API_KEY_STT")
#WATSON_API_KEY_TTS = os.getenv("WATSON_API_KEY_TTS")
WATSON_API_SERVICE_URL_STT = os.getenv("WATSON_API_SERVICE_URL_STT")
#WATSON_API_SERVICE_URL_TTS = os.getenv("WATSON_API_SERVICE_URL_TTS")
TOGETHER_API_KEY=os.getenv("TOGETHER_API_KEY")
TOGETHER_API_SERVICE_URL = os.getenv("TOGETHER_API_SERVICE_URL")


def speech_to_text(audio_binary):
    """
    Converts speech to text using IBM Watson Speech-to-Text API.

    Args:
        audio_binary (bytes): Binary audio data to transcribe.
        api_key (str): Your IBM Watson API key.

    Returns:
        str: Transcribed text.
    """
    # Set up Watson Speech-to-Text HTTP API URL
    
    api_url = WATSON_API_SERVICE_URL_STT + '/v1/recognize'

    # Set up headers for the HTTP request
    #headers = {'Content-Type': 'audio/wav',}  # Adjust based on your audio format 
    

    # Set up parameters for the HTTP request
    params = {
        'model': 'en-US_Multimedia',  # Use the appropriate model
    }

    # Send an HTTP POST request
    try:
        response = requests.post(
            api_url,
            params=params,
            data=audio_binary,
            auth=('apikey', WATSON_API_KEY_STT)  # Authenticate using API key
        )
        response.raise_for_status()  # Raise an error for bad status codes
        response_json = response.json()

        # Parse the response to get the transcribed text
        if response_json.get('results'):
            text = response_json['results'][0]['alternatives'][0]['transcript']
            print('Recognized text:', text)
            return text
        else:
            print('No transcription results found.')
            return None

    except requests.exceptions.RequestException as e:
        print('Error during API request:', e)
        return None

 

def process_message(user_message):
    """
    Processes a user message using OpenAI's GPT-3.5 Turbo model.

    Args:
        user_message (str): User's input message.

    Returns:
        str: OpenAI's response.
    """
    # Set the prompt for OpenAI API
    prompt = "Act like a personal assistant. You can respond to questions, translate sentences, summarize news, and give recommendations.Always try to answer in a single sentence."

    # Call the OpenAI API to process the prompt
    try: 
        MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"
        headers = {
            "Authorization": f"Bearer {TOGETHER_API_KEY}",
            "Content-Type": "application/json"
        }

        data = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message}
                ],
        }

        # Debug the request payload and headers
        print("Request Payload:", data)
        print("Request Headers:", headers)
        response = requests.post(TOGETHER_API_SERVICE_URL, json=data, headers=headers)

        # Print the full response for debugging
        print("Status Code:", response.status_code)
        print("Response JSON:", response.json())

        # Parse the response
        response_json = response.json()
        if "choices" in response_json and len(response_json["choices"]) > 0:
            response_text = response_json["choices"][0]["message"]["content"]
            return response_text
        else:
            print("Unexpected response format:", response_json)
            return None

    except requests.exceptions.RequestException as e:
        print("Error during TOGETHER API request:", e)
        return None
           