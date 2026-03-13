const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },

  // Public Narrative Data (Social Media/News)
  narrative: {
    source: String,
    sentimentScore: Number,
    newsSources: [
      {
        title: String,
        link: String,
        source: String,
        pubDate: String,
        thumbnail: String, // og:image fetched from article
        description: String, // og:description
        sourceDomain: String, // e.g. bbc.com
      },
    ],
    redditSources: [
      {
        title: String,
        url: String,
        embedUrl: String,
        thumbnail: String,
        videoUrl: String, // for reddit hosted videos
        author: String,
        ups: String,
        upvotes: Number, // real upvote count
        num_comments: Number, // real comment count
      },
    ],
    twitterSources: [
      {
        content: String,
        url: String,
        author: String,
        authorHandle: String,
        timestamp: String,
        thumbnail: String,
        avatarColor: String,
        avatarLetter: String,
        retweets: Number,
        likes: Number,
        views: String,
      },
    ],
    instagramSources: [
      {
        platform: String,
        id: String,
        title: String,
        url: String,
        thumbnail: String,
        videoUrl: String,
        author: String,
        authorFull: String,
        likes: Number,
        comments: Number,
        views: Number,
        hashtags: [String],
        type: String,
        timestamp: String,
      },
    ],
  },

  // Real-world Indicator Data
  reality: {
    indicatorName: String,
    currentValue: Number,
    trend: String,
    changePercent: Number,
    marketData: Object,
  },

  // AI Comparison Verdict
  verdict: {
    panicIndex: Number,
    conclusion: String,
    confidence: Number,
    isMisinformation: Boolean,
  },
});

module.exports = mongoose.model("Analysis", AnalysisSchema);
