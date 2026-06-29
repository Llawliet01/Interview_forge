const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    enum: [
      'Frontend', 'Backend', 'Full Stack', 'SDE', 'ML Engineer',
      'Embedded Systems', 'Game Programmer', 'C++ Systems Engineer', 'Rust Engineer', 'Compiler Engineer',
      'iOS Developer', 'Android Developer', 'React Native Developer', 'UI/UX Engineer',
      'DevOps Engineer', 'Cloud Architect', 'Database Admin', 'Security Engineer', 'SRE',
      'Data Scientist', 'Data Engineer', 'Computer Vision', 'NLP Engineer', 'AI Research Scientist'
    ]
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  questionCount: {
    type: Number,
    required: true,
    default: 10
  },
  questions: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['DSA', 'OS', 'DBMS', 'CN', 'Projects']
    },
    problemStatement: {
      type: String,
      required: true
    },
    constraints: [String],
    examples: [{
      input: String,
      output: String,
      explanation: String
    }],
    templates: {
      cpp: String,
      python: String,
      java: String,
      javascript: String
    },
    answerExplanation: String,
    testCases: [{
      input: String,
      output: String,
      isPublic: {
        type: Boolean,
        default: false
      }
    }],
    hints: [String]
  }],
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Interview', InterviewSchema);
