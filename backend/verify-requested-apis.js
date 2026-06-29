const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const tests = [
  // Gemini Models
  { provider: 'gemini', model: 'gemini-3.1-flash-lite' },
  { provider: 'gemini', model: 'gemini-3.5-flash' },
  { provider: 'gemini', model: 'gemini-2.5-flash' },
  { provider: 'gemini', model: 'gemini-3-flash' },

  // Groq Models
  { provider: 'groq', model: 'openai/gpt-oss-120b' },
  { provider: 'groq', model: 'llama-3.1-8b-instant' },
  { provider: 'groq', model: 'llama-3.3-70b-versatile' },

  // OpenRouter Models
  { provider: 'openrouter', model: 'openai/gpt-oss-120b:free' },
  { provider: 'openrouter', model: 'qwen/qwen3-coder:free' },
  { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free' },
  { provider: 'openrouter', model: 'cohere/north-mini-code:free' },
  { provider: 'openrouter', model: 'nousresearch/hermes-3-llama-3.1-405b:free' },
  { provider: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free' }
];

async function runTest(test) {
  const { provider, model } = test;
  const result = { provider, model, status: 'UNKNOWN', details: '' };

  if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      result.status = 'SKIPPED';
      result.details = 'GEMINI_API_KEY not configured';
      return result;
    }
    try {
      const genAI = new GoogleGenerativeAI(key);
      const modelInstance = genAI.getGenerativeModel({ model });
      const response = await modelInstance.generateContent('Say: "Active"');
      result.status = 'WORKING';
      result.details = response.response.text().trim();
    } catch (error) {
      result.status = 'FAILED';
      result.details = error.message;
    }
  }

  if (provider === 'groq') {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      result.status = 'SKIPPED';
      result.details = 'GROQ_API_KEY not configured';
      return result;
    }
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model,
          messages: [{ role: 'user', content: 'Say: "Active"' }]
        },
        {
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      if (response.data && response.data.choices && response.data.choices[0]) {
        result.status = 'WORKING';
        result.details = response.data.choices[0].message.content.trim();
      } else {
        result.status = 'FAILED';
        result.details = 'Unexpected API response structure';
      }
    } catch (error) {
      result.status = 'FAILED';
      result.details = error.response ? JSON.stringify(error.response.data.error || error.response.data) : error.message;
    }
  }

  if (provider === 'openrouter') {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      result.status = 'SKIPPED';
      result.details = 'OPENROUTER_API_KEY not configured';
      return result;
    }
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [{ role: 'user', content: 'Say: "Active"' }]
        },
        {
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'InterviewForge Verification'
          },
          timeout: 15000
        }
      );
      if (response.data && response.data.choices && response.data.choices[0]) {
        result.status = 'WORKING';
        result.details = response.data.choices[0].message.content.trim();
      } else {
        result.status = 'FAILED';
        result.details = 'Unexpected API response structure';
      }
    } catch (error) {
      result.status = 'FAILED';
      result.details = error.response ? JSON.stringify(error.response.data.error || error.response.data) : error.message;
    }
  }

  return result;
}

async function run() {
  console.log(`Starting connection test for ${tests.length} models...`);
  console.log('===========================================================');
  const results = [];
  for (const t of tests) {
    process.stdout.write(`Testing [${t.provider.toUpperCase()}] ${t.model}... `);
    const res = await runTest(t);
    results.push(res);
    console.log(res.status === 'WORKING' ? '\x1b[32mWORKING\x1b[0m' : res.status === 'SKIPPED' ? '\x1b[33mSKIPPED\x1b[0m' : `\x1b[31mFAILED\x1b[0m (${res.details.substring(0, 60)}...)`);
    await new Promise(resolve => setTimeout(resolve, 800)); // Rate limit buffer
  }
  
  console.log('\n====================== FINAL STATUS REPORT ======================');
  console.table(results.map(r => ({
    Provider: r.provider.toUpperCase(),
    Model: r.model,
    Status: r.status,
    Response: r.status === 'WORKING' ? r.details : r.details.substring(0, 80)
  })));
}

run().catch(console.error);
