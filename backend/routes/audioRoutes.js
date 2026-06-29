const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');
const multer = require('multer');

// Configure multer memory storage for receiving webm audio files from frontend
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB limit
  }
});

router.post('/chat', audioController.chat);
router.post('/evaluate', audioController.evaluate);
router.post('/transcribe', upload.single('audio'), audioController.transcribe);

module.exports = router;
