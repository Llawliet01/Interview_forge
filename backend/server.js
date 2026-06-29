const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

// Initialize Express App
const app = express();

// Connect to MongoDB Atlas
connectDB();

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for development, can lock down to specific domains later
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'InterviewForge AI API is running smoothly.' });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/resume'));
app.use('/api', require('./routes/interview'));
app.use('/api/report', require('./routes/report'));
app.use('/api/audio-interview', require('./routes/audioRoutes'));

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Server error stack:', err.stack);
  res.status(err.status || 500).json({
    msg: err.message || 'An internal server error occurred.'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
