from flask import Flask, render_template, request, jsonify, send_from_directory
import openai
import speech_recognition as sr
from pydub import AudioSegment
import io
import re
import numpy as np
import librosa
import tempfile
import os
from flask import redirect
import spacy

# Load the spacy language model
nlp = spacy.load("en_core_web_sm")

# Use the API key from the environment variable
openai.api_key = os.environ["OPENAI_API_KEY"]

# Get the current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# Other function definitions remain the same

app = Flask(__name__, static_url_path='/static')

@app.route('/')
def index():
    return render_template('frontcomedygpt.html')

def process_joke(audio_data):
    audio_text = convert_audio_to_text(audio_data)
    gpt_analyze_response = api_analyze_joke(audio_text)
    gpt_joke_rating_response = api_joke_rating(audio_data, audio_text)
    
    return {"audio_text": audio_text, "gpt_analyze_response": gpt_analyze_response, "gpt_joke_rating_response": gpt_joke_rating_response}


# Add a new route to handle feedback submission
@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    feedback_text = data.get('feedback')
    rating = data.get('rating')

    # Save the feedback and rating to a database or a file, or send it via email, etc.
    print(f"Feedback: {feedback_text}, Rating: {rating}")

    # Save the feedback and rating to the 'enduserfeedback.txt' file
    try:
        with open(os.path.join("enduserfeedback.txt"), 'a') as feedback_file:
            feedback_file.write(f"Feedback: {feedback_text}, Rating: {rating}\n")
        print("Feedback written to file")
    except Exception as e:
        print("Error writing feedback to file:", e)

    return jsonify({"status": "success"})





@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)




def convert_audio_to_text(audio_data):
    # Load the audio data into a PyDub audio segment
    audio = AudioSegment.from_file(io.BytesIO(audio_data))

    # Convert the audio to a WAV file
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        audio.export(f.name, format='wav')

        # Load the audio file using the librosa library
        audio, _ = librosa.load(f.name)

    # Transcribe the audio to text using the Google Speech Recognition API
    recognizer = sr.Recognizer()
    with sr.AudioFile(f.name) as source:
        audio_data = recognizer.record(source)

    # Remove the temporary file after processing
    os.remove(f.name)

    # Convert the audio text to lowercase and remove any punctuation
    try:
        audio_text = recognizer.recognize_google(audio_data).lower()
        audio_text = re.sub(r'[^\w\s]', '', audio_text)
    except sr.UnknownValueError:
        audio_text = "Could not understand the audio."

    return audio_text

def call_gpt3_api(prompt, max_tokens, presence_penalty=2.0):

    try:
        response = openai.Completion.create(
            engine="text-davinci-002",
            prompt=prompt,
            max_tokens=max_tokens,
            n=1,
            stop=None,
            temperature=0.7,
            presence_penalty=presence_penalty,  # add this line
        )
    except Exception as e:
        print(f"GPT-3 API call failed with exception: {e}")
        raise e

    response_text = response.choices[0].text.strip()



    return response_text



@app.route('/joke_rating', methods=['POST'])
def api_joke_rating():
    print("Request received at /joke_rating")
    average_rms = float(request.args.get('average_rms'))
    average_zcr = float(request.args.get('average_zcr'))
    print(f"Received average_rms: {average_rms}, average_zcr: {average_zcr}")
    
    audio_data = request.files['audio_data'].read()
    audio_text = convert_audio_to_text(audio_data)

    print(f"Audio text: {audio_text}")

    new_prompt = f"""Please provide feedback for my joke recording, e.g., \"{audio_text}\". Take into consideration the voice meter measurements attached, 
average RMS ({average_rms}), and average ZCR ({average_zcr}). You will analyze the performance and provide constructive feedback on the following aspects:

1. Delivery: Evaluate the overall delivery style, including energy, engagement, and comedic timing.
2. Cadence: Assess the rhythm, pace, and variation in speech to create comedic impact.
3. Content: Comment on the humor, originality, and relevance of the jokes presented.
4. Voice Quality: Consider the clarity, tone, and modulation of the voice.

Please provide specific feedback on both strengths and areas for improvement. Your rating should reflect the overall effectiveness of the performance, taking into account the factors mentioned above. Please provide the rating in the format '֎ X/10', along with your detailed feedback (maximum 400 characters).

Note: Your feedback should be honest and constructive, aiming to help enhance the stand-up comedy delivery. Your evaluation will play a crucial role in improving future performances. Thank you for your valuable input!"""



    gpt_response = call_gpt3_api(new_prompt, 300)

    # Add this line to print the raw GPT response
    print(f"GPT response: {gpt_response}")

    rating_match = re.search(r'(\d+(\.\d+)?)/10', gpt_response) or re.search(r'(\d+(\.\d+)?)', gpt_response)


    if rating_match:
        rating = float(rating_match.group(1))
    else:
        rating = "0"


    return jsonify({"audio_text": audio_text, "rating": rating, "gpt_response": gpt_response})






@app.route('/analyze_joke', methods=['POST'])
def api_analyze_joke():
    print("Request received at /analyze_joke")
    audio_data = request.files['audio_data'].read()
    audio_text = convert_audio_to_text(audio_data)

    print(f"Audio text: {audio_text}")

    # Create the path to the favorite_punchlines.txt file in the static folder
    script_dir = os.path.dirname(os.path.abspath(__file__))
    punchlines_file_path = os.path.join(script_dir, 'static', 'favorite_punchlines.txt')

    # Read the favorite punchlines from the file
    with open(punchlines_file_path, 'r') as f:
        favorite_punchlines = f.read()

    favorite_punchlines_list = [
        "Twist",
        "Irony",
        "Exaggeration",
        "Wordplay",
        "Self-deprecating",
        "Dark-Humor",
        "Situational",
        "Deadpan",




    ]

    styles = ', '.join(favorite_punchlines_list[:-1]) + ', and ' + favorite_punchlines_list[-1]

    prompt = f"""Given the joke premise: \"{audio_text}\", generate eight original punchlines that are related to the premise and are side splitting funny. Use the following styles: {styles}. Please do not directly use or slightly modify the punchlines from the provided favorite punchlines list. Instead, use them just for inspiration:

{favorite_punchlines}

Make sure each punchline is unique, hilarious, well-formatted, and corresponds to a different style. Experiment with different endings and ensure a variety of amazing punchlines. Do not repeat any punchlines from the favorite punchlines list.

1. (Twist):

2. (Irony):

3. (Exaggeration):

4. (Wordplay):

5. (Self-deprecating):

6. (Dark-Humor):

7. (Situational):

8. (Deadpan):

"""


    gpt_response = call_gpt3_api(prompt, 500)

    return jsonify({"audio_text": audio_text, "gpt_response": gpt_response})
