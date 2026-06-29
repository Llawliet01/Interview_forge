const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  projects: [{
    title: String,
    description: String,
    technologies: [String]
  }],
  experience: [{
    role: String,
    company: String,
    duration: String,
    description: String
  }],
  education: [{
    degree: String,
    school: String,
    year: String
  }],
  additionalInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      contact: {
        email: null,
        phone: null,
        location: null,
        links: []
      },
      certifications: [],
      achievements: []
    }
  },
  rawText: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', ResumeSchema);
