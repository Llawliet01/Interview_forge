const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No API key found in .env');
    return;
  }
  
  try {
    console.log('Fetching available models from Google AI Studio...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.models) {
      console.log('Available Models:');
      data.models.forEach(m => {
        console.log(`- Name: ${m.name}, DisplayName: ${m.displayName}`);
      });
    } else {
      console.log('No models returned. API Response:', data);
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

run();
