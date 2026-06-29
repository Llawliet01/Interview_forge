const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI;
    if (!connUri) {
      console.error('CRITICAL: MONGODB_URI is not defined in your environment variables.');
      process.exit(1);
    }
    
    const conn = await mongoose.connect(connUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
