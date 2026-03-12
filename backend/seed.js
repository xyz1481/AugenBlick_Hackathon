const mongoose = require('mongoose');
const Post = require('./models/Post');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/augenblick';
const USER_ID = '69b2718d512b796e1b461a25';

const dummyPosts = [
  {
    userId: USER_ID,
    username: 'Anonymous Analyst',
    country: 'India',
    content: "Significant buildup of container ships detected at the Port of Singapore. Possible throughput disruption in the next 72 hours.",
    moderationStatus: 'SAFE',
    createdAt: new Date(Date.now() - 3600000)
  },
  {
    userId: USER_ID,
    username: 'Anonymous Analyst',
    country: 'India',
    content: "Industrial energy quotas in the Rhine-Ruhr area might be adjusted. Monitoring sovereign yield volatility.",
    moderationStatus: 'SAFE',
    createdAt: new Date(Date.now() - 7200000)
  },
  {
    userId: USER_ID,
    username: 'Anonymous Analyst',
    country: 'India',
    content: "@Reality verify: Saudi Arabia is planning to increase crude output by 1M barrels per day despite OPEC+ caps.",
    moderationStatus: 'SAFE',
    isVerified: true,
    aiResponse: {
      credibility: "Medium",
      supportingSignals: ["Internal policy shifts in Riyadh", "Infrastructure expansion in Safaniya field"],
      contradictions: ["Official OPEC+ compliance statements", "Absence of official Aramco press release"],
      analysisSummary: "The claim aligns with long-term capacity goals but contradicts immediate fiscal pacts."
    },
    createdAt: new Date(Date.now() - 10800000)
  },
  {
    userId: USER_ID,
    username: 'Anonymous Analyst',
    country: 'India',
    content: "West Coast port negotiations hitting a stalemate. Expect ripple effects in Pacific trade routes.",
    moderationStatus: 'SAFE',
    createdAt: new Date(Date.now() - 14400000)
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing posts for a clean start
    await Post.deleteMany({});
    console.log('Cleared existing posts');

    await Post.insertMany(dummyPosts);
    console.log('Seeded database with anonymous insights');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
