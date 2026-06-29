const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true,
    unique: true,
    index: true
  },
  overallScore: {
    type: Number,
    required: true
  },
  technicalScore: {
    type: Number,
    required: true
  },
  communicationScore: {
    type: Number,
    required: true
  },
  scoresBreakdown: {
    dsa: Number,
    os: Number,
    dbms: Number,
    cn: Number,
    projects: Number
  },
  strengths: [String],
  weakAreas: [String],
  aiFeedback: {
    wellDone: String,
    needsImprovement: String,
    nextSteps: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', ReportSchema);
