const axios = require('axios');
require('dotenv').config();

async function run() {
  console.log('Testing Judge0 configuration...');
  const url = process.env.JUDGE0_API_URL;
  const key = process.env.JUDGE0_API_KEY;
  const host = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

  console.log('API URL:', url);
  console.log('API Key present:', !!key);
  console.log('API Host:', host);

  if (!url || !key) {
    console.log('Result: Judge0 is NOT configured. The app will run in local mock mode.');
    return;
  }

  try {
    // Send a simple JS print execution payload
    const payload = {
      source_code: Buffer.from('console.log("Judge0 Connection Active!");').toString('base64'),
      language_id: 63, // Node.js
      stdin: ''
    };

    console.log('Sending compile request to Judge0...');
    const response = await axios.post(
      `${url}/submissions?base64_encoded=true&wait=true`,
      payload,
      {
        headers: {
          'content-type': 'application/json',
          'x-rapidapi-key': key,
          'x-rapidapi-host': host
        }
      }
    );

    const data = response.data;
    console.log('Response status:', data.status.description);
    
    if (data.stdout) {
      const stdout = Buffer.from(data.stdout, 'base64').toString('utf8');
      console.log('Execution Output:', stdout.trim());
    } else {
      console.log('No stdout returned. Compile error:', data.compile_output ? Buffer.from(data.compile_output, 'base64').toString('utf8') : 'None');
    }
  } catch (error) {
    console.error('Judge0 connection failed:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.status, error.response.data);
    }
  }
}

run();
