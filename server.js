const express = require('express');
const enforce = require('express-sslify');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const app = express();

// Middleware
if (process.env.NODE_ENV === 'production') {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

app.use(express.json());
app.use(express.static('static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url, req.body);
  next();
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.post('/submit_feedback', async (req, res) => {
  const { feedback, rating } = req.body;
  console.log('Received feedback:', feedback);
  console.log('Received rating:', rating);

  try {
    const client = await pool.connect();
    const result = await client.query('INSERT INTO feedback(rating, feedback) VALUES($1, $2)', [rating, feedback]);
    client.release();
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.get('/get_feedback', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM feedback');
    client.release();
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
