const Post = require('../models/Post');
const { moderateContent, verifyClaim } = require('../services/groqService');
const { fetchNews } = require('../services/newsService');

const createPost = async (req, res) => {
  try {
    const { content, country } = req.body;
    const { id: userId } = req.user;

    if (!content) {
      return res.status(400).json({ message: "Content is required." });
    }

    // 1. Moderation
    const category = await moderateContent(content);
    if (['HATE_SPEECH', 'ABUSIVE', 'THREAT'].includes(category)) {
      return res.status(400).json({
        message: "This post violates community safety rules.",
        category
      });
    }

    // 2. Check for @Reality or @reality mention
    let aiResponse = null;
    let isVerified = false;
    let aiSources = [];

    // Support both "@Reality verify:" and "@reality:"
    const verifyPatterns = [/@Reality verify:/i, /@reality:/i];
    let matchedPattern = verifyPatterns.find(p => p.test(content));

    if (matchedPattern) {
      const claimParts = content.split(matchedPattern);
      const claim = claimParts[1]?.trim();

      if (claim) {
        // Fetch external signals
        const newsSignals = await fetchNews(claim);

        // AI Verification with news signals
        aiResponse = await verifyClaim(claim, newsSignals);
        isVerified = true;

        // Map signals to sources schema
        aiSources = newsSignals.map(s => ({
          sourceName: s.source,
          headline: s.title
        }));
      }
    }

    const newPost = new Post({
      userId,
      username: 'Anonymous Analyst',
      country: country || 'India', // Default to India if not provided
      content,
      moderationStatus: category,
      isVerified,
      aiResponse,
      aiSources
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Post Creation Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error("Get Posts Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const seedPosts = async (req, res) => {
  try {
    const dummyPosts = [
      {
        userId: req.user.id,
        username: 'Anonymous Analyst',
        country: 'Singapore',
        content: "Significant buildup of container ships detected at the Port of Singapore. Possible throughput disruption in the next 72 hours.",
        moderationStatus: 'SAFE'
      },
      {
        userId: req.user.id,
        username: 'Anonymous Analyst',
        country: 'Germany',
        content: "Industrial energy quotas in the Rhine-Ruhr area might be adjusted. Monitoring sovereign yield volatility.",
        moderationStatus: 'SAFE'
      },
      {
        userId: req.user.id,
        username: 'Anonymous Analyst',
        country: 'UAE',
        content: "@Reality verify: Saudi Arabia is planning to increase crude output by 1M barrels per day despite OPEC+ caps.",
        moderationStatus: 'SAFE',
        isVerified: true,
        aiResponse: {
          credibility: "Medium",
          supportingSignals: ["Internal policy shifts in Riyadh", "Infrastructure expansion in Safaniya field"],
          contradictions: ["Official OPEC+ compliance statements", "Absence of official Aramco press release"],
          analysisSummary: "The claim aligns with long-term capacity goals but contradicts immediate fiscal pacts."
        }
      }
    ];

    await Post.insertMany(dummyPosts);
    res.json({ message: "Database seeded with anonymous insights." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPost, getPosts, seedPosts };
