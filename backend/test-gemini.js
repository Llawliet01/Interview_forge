const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  console.log('Testing Gemini API key...');
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key present:', !!apiKey);
  if (apiKey) {
    console.log('API Key starts with:', apiKey.substring(0, 5) + '...');
  } else {
    console.log('Error: GEMINI_API_KEY is not defined in the backend/.env file!');
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    console.log('Sending test prompt to Gemini...');
    const result = await model.generateContent('Hello, respond with: "Gemini connection active!"');
    console.log('Response status code / ok:', !!result);
    console.log('Response text:', result.response.text());
  } catch (error) {
    console.error('Gemini connection test failed:', error);
  }
}

run();
