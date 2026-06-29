const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
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
    index: true
  },
  questionId: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['cpp', 'python', 'java', 'javascript']
  },
  result: {
    type: String,
    required: true,
    enum: ['Accepted', 'Wrong Answer', 'Runtime Error', 'Compilation Error', 'Time Limit Exceeded', 'Pending'],
    default: 'Pending'
  },
  compileOutput: {
    type: String
  },
  runtimeOutput: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
