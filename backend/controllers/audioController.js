const modelapi = require('../services/modelapi');
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

    const aiRes = await modelapi.getAudioInterviewResponse(conversationHistory, topic);
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

    const evalRes = await modelapi.evaluateAudioInterview(history || [], topic);
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

    // 1. Prepare FormData for Groq Whisper
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en');
    // Request verbose_json to get the exact duration of the clip
    formData.append('response_format', 'verbose_json');

    console.log('[Audio Controller] Sending recording blob to Groq Whisper...');
    const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      timeout: 10000 // 10s timeout
    });

    if (!response.data || !response.data.text) {
      throw new Error('Invalid transcription payload from Groq.');
    }

    const transcriptionText = response.data.text;
    const audioDuration = response.data.duration || 0.0;
    
    console.log(`[Audio Controller] Groq Whisper Success. Duration: ${audioDuration}s`);

    // 2. Compute Pacing Metrics (Words Per Minute)
    const wordCount = transcriptionText.trim().split(/\s+/).filter(w => w.length > 0).length;
    let wpm = 0;
    let pacingLabel = 'N/A';
    
    if (audioDuration > 0 && wordCount > 0) {
      wpm = Math.round((wordCount / audioDuration) * 60);
      if (wpm < 110) {
        pacingLabel = 'Slow Pace';
      } else if (wpm <= 160) {
        pacingLabel = 'Steady & Calm Pace';
      } else {
        pacingLabel = 'Fast Pace';
      }
    }

    // 3. Request Speech Emotion Analysis from Hugging Face Space (if configured)
    let acousticAnalysis = null;
    const hfUrl = process.env.SPEECH_CLASSIFIER_URL;

    if (hfUrl) {
      try {
        console.log('[Audio Controller] Forwarding audio buffer to Hugging Face Dual Classifier...');
        const hfFormData = new FormData();
        const hfBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
        hfFormData.append('file', hfBlob, 'audio.webm');

        const hfResponse = await axios.post(hfUrl, hfFormData, {
          timeout: 10000 // 10s timeout
        });

        if (hfResponse.data) {
          acousticAnalysis = hfResponse.data;
          console.log('[Audio Controller] Hugging Face Classification Success');
        }
      } catch (hfError) {
        console.warn('[Audio Controller] Hugging Face Classifier failed (falling back):', hfError.message);
      }
    } else {
      console.log('[Audio Controller] SPEECH_CLASSIFIER_URL not configured. Skipping acoustic check.');
    }

    // 4. Return aggregated response
    return res.json({
      text: transcriptionText,
      pacing: {
        wpm: wpm,
        label: pacingLabel,
        wordCount: wordCount,
        duration: audioDuration
      },
      acoustic_analysis: acousticAnalysis
    });

  } catch (error) {
    console.error('audioController.transcribe error:', error.response ? JSON.stringify(error.response.data) : error.message);
    res.status(500).json({ msg: 'Failed to transcribe audio. Please try again.' });
  }
};
