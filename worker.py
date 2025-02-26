import requests
import os
from dotenv import load_dotenv

load_dotenv()

WATSON_API_KEY_STT = os.getenv("WATSON_API_KEY_STT")
WATSON_API_SERVICE_URL_STT = os.getenv("WATSON_API_SERVICE_URL_STT")
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
TOGETHER_API_SERVICE_URL = os.getenv("TOGETHER_API_SERVICE_URL")

def speech_to_text(audio_binary, content_type="audio/wav"):
    # Build Watson API URL
    api_url = WATSON_API_SERVICE_URL_STT + '/v1/recognize'
    
    headers = {
        'Content-Type': content_type,  # Use the MIME type passed from the request
        'Accept': 'application/json'
    }
    params = {
        'model': 'en-US_BroadbandModel'
    }

    try:
        response = requests.post(
            api_url,
            params=params,
            data=audio_binary,
            headers=headers,
            auth=('apikey', WATSON_API_KEY_STT)
        )
        response.raise_for_status()
        response_json = response.json()
        print(response_json)
        if response_json.get('results'):
            text = response_json['results'][0]['alternatives'][0]['transcript']
            return text
        else:
            print('No transcription results found.')
            return None
    except requests.exceptions.RequestException as e:
        print('Error during API request:', e)
        return None

def process_message(user_message):
    prompt = "Act like a personal assistant. You can respond to questions, translate sentences, summarize news, and give recommendations. Always try to answer in a single sentence."
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
        # Load your audio file
         
        response = requests.post(TOGETHER_API_SERVICE_URL, json=data, headers=headers)
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
