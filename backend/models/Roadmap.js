const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  weakTopics: [{
    type: String,
    trim: true
  }],
  durationDays: {
    type: Number,
    default: 30
  },
  weeks: [{
    weekNumber: Number,
    topic: String,
    tasks: [String],
    resources: [String]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);
