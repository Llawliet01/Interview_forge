const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

/**
 * Helper to send email containing OTP code.
 * Falls back to logging the OTP directly to the terminal console if SMTP is not configured.
 */
const sendOtpEmail = async (email, otp) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass || emailUser === '' || emailPass === '') {
    console.log(`\n==================================================`);
    console.log(`[OTP Verification Fallback]`);
    console.log(`Email SMTP credentials not configured in backend/.env.`);
    console.log(`Generated OTP code for ${email} is: ${otp}`);
    console.log(`==================================================\n`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    await transporter.sendMail({
      from: '"InterviewForge" <noreply@interviewforge.com>',
      to: email,
      subject: 'Verify your InterviewForge Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #43bccd; text-align: center;">Verify Your Email Address</h2>
          <p>Thank you for registering on <strong>InterviewForge AI</strong>. To complete your signup and log in, please enter the following 6-digit verification code:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 10px 20px; background-color: #f1f5f9; border-radius: 4px; border: 1px dashed #43bccd; color: #150a21;">${otp}</span>
          </div>
          <p>This verification code is valid for <strong>10 minutes</strong>. If you did not request this code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 11px; color: #64748b; text-align: center;">InterviewForge AI © 2026. All rights reserved.</p>
        </div>
      `
    });
    console.log(`[OTP Verification] Successfully sent email to ${email}`);
  } catch (err) {
    console.error(`[OTP Verification] Failed to send email to ${email}:`, err.message);
    // Fallback print to terminal so the flow doesn't break
    console.log(`\n==================================================`);
    console.log(`[OTP Verification Fallback due to Email Delivery Error]`);
    console.log(`Generated OTP code for ${email} is: ${otp}`);
    console.log(`==================================================\n`);
  }
};

// @route   POST api/auth/signup
// @desc    Register a user (triggers OTP generation and verification step)
// @access  Public
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ msg: 'User already exists' });
      }
      // User exists but is not verified, let's update password and resend OTP
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      user.name = name;
    } else {
      user = new User({
        name,
        email,
        password
      });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    user.isVerified = false;

    await user.save();

    // Send OTP email (async in background)
    sendOtpEmail(email, otp);

    res.json({
      msg: 'Verification OTP code sent to your email.',
      verifyRequired: true,
      email: user.email
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if account is verified
    if (!user.isVerified) {
      // Generate fresh OTP code and resend it
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      
      // Send OTP email
      sendOtpEmail(email, otp);

      return res.status(401).json({
        msg: 'Your account is not verified. A verification code has been sent to your email.',
        verifyRequired: true,
        email: user.email
      });
    }

    const payload = {
      user: {
        id: user.id,
        name: user.name
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_me_in_production',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST api/auth/verify-otp
// @desc    Verify OTP code and complete user registration
// @access  Public
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User does not exist.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'User is already verified.' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ msg: 'Incorrect verification code. Please check again.' });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ msg: 'Verification code has expired. Please request a new one.' });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // Sign JWT
    const payload = {
      user: {
        id: user.id,
        name: user.name
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_me_in_production',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error('OTP Verification error:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   POST api/auth/resend-otp
// @desc    Resend a fresh OTP code to user's email
// @access  Public
exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User does not exist.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'User is already verified.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendOtpEmail(email, otp);

    res.json({ msg: 'A new verification code has been sent to your email.' });
  } catch (err) {
    console.error('OTP Resend error:', err.message);
    res.status(500).send('Server error');
  }
};

// @route   GET api/auth/profile
// @desc    Get current user profile
// @access  Private
exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err.message);
    res.status(500).send('Server error');
  }
};
