const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    default: 'Anonymous Analyst'
  },
  country: {
    type: String,
    default: 'Global'
  },
  content: {
    type: String,
    required: true
  },
  moderationStatus: {
    type: String,
    enum: ['SAFE', 'HATE_SPEECH', 'ABUSIVE', 'THREAT'],
    default: 'SAFE'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  aiResponse: {
    credibility: String,
    supportingSignals: [String],
    contradictions: [String],
    analysisSummary: String
  },
  aiSources: [
    {
      sourceName: String,
      headline: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', postSchema);
