const geminiService = require('../services/geminiService');
const axios = require('axios');

exports.chat = async (req, res) => {
  try {
    const { history, text, topic } = req.body;
    if (!topic) {
      return res.status(400).json({ msg: 'Interview topic is required.' });
    }

    // Build the full discussion array
    const conversationHistory = [...(history || [])];
    if (text) {
      conversationHistory.push({ role: 'user', text });
    }

    const aiRes = await geminiService.getAudioInterviewResponse(conversationHistory, topic);
    res.json({ 
      message: aiRes.message,
      history: [...conversationHistory, { role: 'model', text: aiRes.message }]
    });
  } catch (error) {
    console.error('audioController.chat error:', error);
    res.status(500).json({ msg: 'Server error during voice chat generation.' });
  }
};

exports.evaluate = async (req, res) => {
  try {
    const { history, topic } = req.body;
    if (!topic) {
      return res.status(400).json({ msg: 'Interview topic is required.' });
    }

    const evalRes = await geminiService.evaluateAudioInterview(history || [], topic);
    res.json(evalRes);
  } catch (error) {
    console.error('audioController.evaluate error:', error);
    res.status(500).json({ msg: 'Server error during voice interview evaluation.' });
  }
};

exports.transcribe = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No audio file uploaded.' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ msg: 'Groq API Key is not configured on server.' });
    }

    // Use native FormData and Blobs (globally supported in Node 18+)
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en');

    console.log('[Audio Controller] Sending recording blob to Groq Whisper...');
    const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      timeout: 10000 // 10s timeout
    });

    if (response.data && response.data.text) {
      console.log('[Audio Controller] Whisper Transcription Success:', response.data.text);
      return res.json({ text: response.data.text });
    } else {
      throw new Error('Invalid transcription payload from Groq.');
    }
  } catch (error) {
    console.error('audioController.transcribe error:', error.response ? JSON.stringify(error.response.data) : error.message);
    res.status(500).json({ msg: 'Failed to transcribe audio. Please try again.' });
  }
};
