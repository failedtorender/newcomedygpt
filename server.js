const express = require('express');
const enforce = require('express-sslify');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
if (process.env.NODE_ENV === 'production') {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

app.use(express.json());
app.use(express.static('static'));

// Request logging middleware
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url, req.body);
  next();
});

const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: 'AKIAV2KDCXAX34VXZ76X',
  secretAccessKey: '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',
  region: 'us-east-2'
});

// Create an S3 instance with the configured AWS credentials
const s3 = new AWS.S3();

// Route for submitting feedback
app.post('/submit_feedback', (req, res) => {
  const { feedback, rating } = req.body;
  console.log('Received feedback:', feedback);
  console.log('Received rating:', rating);

  const feedbackEntry = `Rating: ${rating}, Feedback: ${feedback}\n`;

  const filePath = path.join(process.cwd(), 'feedback.txt');
  fs.writeFile(filePath, feedbackEntry, 'utf8', (err) => {
    if (err) {
      console.error('Error creating feedback file:', err);
      res.sendStatus(500);
      return;
    }

    const params = {
      Bucket: 'comedygptuserfeedback',
      Key: 'newuserfeedback.txt',
      Body: fs.createReadStream(filePath),
    };

    // Upload the feedback file to the S3 bucket using the Access Point
    s3.upload(params, (err, data) => {
      if (err) {
        console.error('Error uploading feedback:', err);
        res.sendStatus(500);
      } else {
        console.log('Feedback entry uploaded:', data);
        res.sendStatus(200);
      }

      // Delete the local text file after uploading
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting feedback file:', err);
        }
      });
    });
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
