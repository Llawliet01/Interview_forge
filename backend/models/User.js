const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  otp: {
    type: String
  },
  otpExpiresAt: {
    type: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('User', UserSchema);
