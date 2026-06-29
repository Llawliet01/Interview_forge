const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const User = require('./models/User');

const test = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI environment variable is missing.");
    process.exit(1);
  }

  console.log("Connecting to database to clear previous test users...");
  await mongoose.connect(uri);
  await User.deleteOne({ email: 'testverify123@example.com' });
  console.log("Cleared test user 'testverify123@example.com'");
  await mongoose.connection.close();

  const PORT = process.env.PORT || 5000;
  const API_URL = `http://localhost:${PORT}/api`;

  // 1. Submit signup
  console.log("\n1. Simulating signup request...");
  try {
    const signupRes = await axios.post(`${API_URL}/auth/signup`, {
      name: 'Test User',
      email: 'testverify123@example.com',
      password: 'Password123!'
    });

    console.log("Signup response:", signupRes.data);
    if (!signupRes.data.verifyRequired) {
      throw new Error("verifyRequired is missing or false in signup response!");
    }
  } catch (err) {
    console.error("Signup request failed:", err.response?.data || err.message);
    process.exit(1);
  }

  // 2. Fetch OTP from DB
  console.log("\n2. Fetching generated OTP from database...");
  await mongoose.connect(uri);
  const user = await User.findOne({ email: 'testverify123@example.com' });
  if (!user) {
    throw new Error("User was not saved in DB!");
  }
  const otp = user.otp;
  console.log(`Successfully fetched OTP code: ${otp}`);
  await mongoose.connection.close();

  // 3. Verify OTP
  console.log("\n3. Simulating verification request with OTP code...");
  try {
    const verifyRes = await axios.post(`${API_URL}/auth/verify-otp`, {
      email: 'testverify123@example.com',
      otp: otp
    });

    console.log("Verification response:", verifyRes.data);
    if (!verifyRes.data.token) {
      throw new Error("No token returned on verification success!");
    }
    console.log("Token verified successfully!");
  } catch (err) {
    console.error("Verification failed:", err.response?.data || err.message);
    process.exit(1);
  }

  // 4. Verify login works
  console.log("\n4. Simulating login request...");
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'testverify123@example.com',
      password: 'Password123!'
    });

    console.log("Login response:", loginRes.data);
    if (!loginRes.data.token) {
      throw new Error("No token returned on login!");
    }
    console.log("Login succeeded!");
  } catch (err) {
    console.error("Login failed:", err.response?.data || err.message);
    process.exit(1);
  }

  console.log("\n=============================================");
  console.log("SUCCESS: OTP Signup Integration Flow verified!");
  console.log("=============================================");
};

test().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
