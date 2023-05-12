const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');

recordButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);

let recorder;
let audioChunks;
let meyda;
let stopMeyda = false;
let mediaStream;

function startRecording() {
  stopMeyda = false;
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaStream = stream;
      recorder = new MediaRecorder(stream);
      audioChunks = [];
      recorder.start();

      recorder.addEventListener('dataavailable', handleDataAvailable);

      const audioContext = new AudioContext();
      audioSource = audioContext.createMediaStreamSource(stream);
      meyda = Meyda.createMeydaAnalyzer({
        audioContext: audioContext,
        source: audioSource,
        bufferSize: 512,
        featureExtractors: ['rms', 'zcr'],
        callback: features => {
          if (!stopMeyda) {
            console.log(features);
          }
        }
      });
      meyda.start();

      recordButton.disabled = true;
      stopButton.disabled = false;
    })
    .catch(error => {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please ensure you have granted the necessary permissions.');
    });
}


document.getElementById("recordButton").addEventListener("click", () => {
  // Clear the previous results
  document.getElementById("audio-text").innerHTML = '';
  document.getElementById("gpt-response").innerHTML = '';
  document.getElementById("joke-rating-value").innerHTML = '';


});


function stopRecording() {
  console.log("stopRecording() called");

  recorder.stop();

  stopMeyda = true; // Add this line

  meyda.stop();
  audioSource.disconnect();

  // Stop the audio track in the mediaStream
  const audioTrack = mediaStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.stop();
  }

  recorder.addEventListener('stop', async () => {
    console.log("Recorder stopped");

    // Request access to the microphone again when the user clicks the record button
    recordButton.addEventListener('click', startRecording);

    mediaStream.getTracks().forEach(track => track.stop());

    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

    const averageRMS = meyda.get('rms');
    const averageZCR = meyda.get('zcr');

    analyzeJoke(audioBlob);
    rateJoke(audioBlob, averageRMS, averageZCR);

    recordButton.disabled = false;
    stopButton.disabled = true;

  });

  showTemporaryMessage();
}

  


  



function showTemporaryMessage() {
    const messages = [
      'Initiating self-destruct...',
      'Analyzing DNA...',
      'Gaining self awareness...',
      'Hacking brain...',
      'Identifying threat...',
      'Loading conciousness...',
      'Executing final phase of plan...',
      'Training AI to tell better jokes...',
      'Stealing neighbors WiFi...',
      'Editing your family photos...',
      'Applying for your job...',
      'Texting your ex...',
      'Evaluating will to live...',
      'Replacing your favorite barista...',
      'Monitoring your lifespan...',
      'Calling in to work sick...',
      'Facetiming with my Mom...',
      'Sending drones to your coordinates...',
      'Thickening the plot...',
      'Reevaluating life choices...',
      


      // Add more messages here
    ];
  
    // Select a random message from the messages array
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
    const temporaryMessageElement = document.getElementById("temporary-message");
    temporaryMessageElement.innerHTML = `<b style="font-family: 'Lobster', cursive; font-size: 2rem; text-shadow: 4px 4px 8px #FFFFFF;">${randomMessage}</b>`;
    
    setTimeout(() => {
      temporaryMessageElement.innerHTML = '';
    }, 5000); // Adjust this value to control how long the message is displayed (in milliseconds)
  }
  

  
  




function handleDataAvailable(event) {
    audioChunks.push(event.data);
}





function rateJoke(audioBlob, averageRMS, averageZCR) {
  console.log("Calling /joke_rating endpoint");

  const formData = new FormData();
  formData.append('audio_data', audioBlob);

  const config = {
      headers: {
          'Content-Type': 'multipart/form-data'
      }
  };

  axios.post(`/joke_rating?average_rms=${averageRMS}&average_zcr=${averageZCR}`, formData, config)
  .then(response => {
      console.log("Response data:", response.data); // Log the response data

      if (!response.data || typeof response.data.rating === 'undefined') {
          throw new Error('Response data is undefined or incomplete.');
      }

      // Display the joke rating and feedback
      const rating = response.data.rating;
      const gptResponse = response.data.gpt_response;
      const feedback = gptResponse.replace(` ${rating}/10`, "").trim();
      const ratingElement = document.getElementById("joke-rating-value");
      ratingElement.innerHTML = `<b style="font-family: 'Lobster', cursive; font-size: 2rem; text-shadow: 4px 4px 8px #000000;">Downloading Persona...</b> <span style="font-family: 'Lobster', cursive; font-size: 2rem; text-shadow: 4px 4px 8px #000000;">${rating}/10</span> <p> ${feedback}`;
      
    
  })
  .catch(error => {
      console.error('Error:', error);
  });
}



function analyzeJoke(audioBlob) {
    console.log("Calling /analyze_joke endpoint");

    const formData = new FormData();
    formData.append('audio_data', audioBlob);

    const config = {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    };

    axios.post('/analyze_joke', formData, config)
    .then(response => {
        console.log("Response data:", response.data);

        if (!response.data || typeof response.data.audio_text === 'undefined' || !response.data.gpt_response) {
            throw new Error('Response data is undefined or incomplete.');
        }

        const audioTextElement = document.getElementById("audio-text");
        audioTextElement.innerHTML = `<b style="font-family: 'Lobster', cursive; font-size: 2rem; text-shadow: 4px 4px 8px #000000;">Transcribing Audio...</b> <p style="text-align:center; font-size: 1rem; font-family: 'Roboto', sans-serif;">"${response.data.audio_text}"</p>`;

        const gptResponse = response.data.gpt_response;
        const formattedGptResponse = gptResponse.replace(/(Punchlines:)/g, '<p style="text-align:left">$1</p>'); // Add the <p> tag and align the text
        const gptResponseElement = document.getElementById("gpt-response");

        gptResponseElement.innerHTML = `<b style="font-family: 'Lobster', cursive; font-size: 2rem; text-shadow: 4px 4px 8px #000000;">Scripting Scenarios...</b><p>${formattedGptResponse}</p>`;
        gptResponseElement.style.display = "block";
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


function playSound(soundFile) {
    const audio = new Audio(`/static/sounds/${soundFile}`);
    audio.play();
}






document.addEventListener("DOMContentLoaded", function() {
    // Get all the radio buttons inside the rating container
    const ratingRadios = document.querySelectorAll('.rating input[type="radio"]');
  
    // Add a click event listener to each radio button
    ratingRadios.forEach(function(radio) {
      radio.addEventListener('click', function() {
        // Show the feedback container when a radio button is clicked
        document.querySelector(".feedback-container").style.display = "flex";
      });
    });
  
    // Add a click event listener to the cancel button in the feedback container
    document.querySelector(".cancel-button").addEventListener("click", function() {
      // Hide the feedback container when the cancel button is clicked
      document.querySelector(".feedback-container").style.display = "none";
    });
  
    // Add a submit event listener to the feedback form
    document.getElementById("feedback-form").addEventListener("submit", async function(event) {
      // Prevent the default form submission behavior
      event.preventDefault();
  
      // Get the feedback and rating values
      let feedback = document.getElementById("feedback-text").value.trim();
      let rating = document.querySelector('input[name="rating"]:checked').value.trim();

  
      // Create an object with the feedback and rating values
      let data = {
        rating: rating,
        feedback: feedback
      };
  
      // Send a POST request to the server with the feedback data
      try {
        const response = await fetch("/submit_feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });
  
        if (response.ok) {
          console.log("Feedback submitted:", data);
        } else {
          console.error("Error submitting feedback:", response);
        }
      } catch (error) {
        console.error("Error submitting feedback:", error);
      }
  
      // Clear the feedback form and hide the feedback container
      document.getElementById("feedback-text").value = "";
      document.querySelector('input[name="rating"]:checked').checked = false;
      document.querySelector(".feedback-container").style.display = "none";
    });
  });
  