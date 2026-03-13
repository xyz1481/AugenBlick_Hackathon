const { getIndicatorData } = require("../services/indicatorService");
const { getNarrativeFromNews } = require("../services/narrativeService");
const { getNarrativeFromReddit } = require("../services/redditService");
const { getTweetsFromNitter } = require("../services/twitterService");
const { scrapeInstagramByTopic } = require("../services/instagramService");
const Analysis = require("../models/Analysis");
const natural = require("natural");

const analyzer = new natural.SentimentAnalyzer(
  "English",
  natural.PorterStemmer,
  "afinn",
);
const tokenizer = new natural.WordTokenizer();

const analyzeTopic = async (req, res) => {
  let { topic, symbol } = req.body;
  symbol = symbol ? symbol.trim() : "";

  try {
    // 1. Fetch Narratives from multiple sources
    const [newsData, redditData, twitterData, instaData] = await Promise.all([
      getNarrativeFromNews(topic),
      getNarrativeFromReddit(topic),
      getTweetsFromNitter(topic),
      scrapeInstagramByTopic(topic),
    ]);

    // 2. Fetch Reality Indicators
    const indicatorData = await getIndicatorData(symbol);

    if (!indicatorData) {
      return res
        .status(500)
        .json({
          error:
            "Market Data Source (Yahoo) is currently unreachable. Please try again or use a demo symbol like CL=F.",
        });
    }

    // 3. Combine Narratives and Analyze Sentiment
    const newsSources =
      newsData && newsData.topNarratives ? newsData.topNarratives : [];
    const redditSources =
      redditData && redditData.posts ? redditData.posts : [];
    const twitterSources =
      twitterData && twitterData.tweets ? twitterData.tweets : [];
    const instagramSources =
      instaData && instaData.posts ? instaData.posts : [];

    console.log(
      `[Analysis] Found ${newsSources.length} news, ${redditSources.length} reddit, ${twitterSources.length} tweets, ${instagramSources.length} insta for "${topic}"`,
    );

    const newsText = newsSources.map((n) => n.title).join(" ");
    const redditText = redditSources.map((p) => p.title).join(" ");
    const twitterText = twitterSources.map((t) => t.content).join(" ");
    const instaText = instagramSources.map((i) => i.content).join(" ");
    const combinedText =
      `${newsText} ${redditText} ${twitterText} ${instaText}`.trim();

    const tokens = tokenizer.tokenize(combinedText);
    const sentiment = tokens.length > 0 ? analyzer.getSentiment(tokens) : 0;
    const hasNarrativeData = tokens.length > 5; // Require at least a few words for meaningful sentiment

    // 4. Calculate "Panic vs Reality" Gap
    const change = Number(indicatorData ? indicatorData.change : 0);
    const indicatorPanic = Math.abs(change) > 1.5 ? 1 : 0;
    const narrativePanic = hasNarrativeData && sentiment < -0.05 ? 1 : 0;

    let panicIndex = 0;
    let conclusion = "";
    let confidence = hasNarrativeData ? 0.85 : 0.3; // Drop confidence if no data

    if (!hasNarrativeData) {
      panicIndex = indicatorPanic ? 30 : 5;
      conclusion =
        "Insufficient public narrative data found for a definitive AI verdict. " +
        (indicatorPanic
          ? "However, market data shows high volatility."
          : "Market data appears stable.");
    } else if (narrativePanic && !indicatorPanic) {
      panicIndex = 85;
      conclusion =
        "Narrative warning: Social signals show significant anxiety/panic, but real-world market indicators remain stable. High probability of misinformation or overreaction.";
    } else if (narrativePanic && indicatorPanic) {
      panicIndex = 45;
      conclusion =
        "Systemic Risk: Public anxiety aligns with measurable market volatility. The narrative is backed by hard data.";
    } else if (!narrativePanic && indicatorPanic) {
      panicIndex = 25;
      conclusion =
        "Data Alert: Markets are showing volatility that is not yet reflected in public discourse. Possible brewing crisis.";
    } else {
      panicIndex = 10;
      conclusion =
        "Equilibrium: Both public narrative and market signals are currently within normal stability ranges.";
    }

    const analysisResult = new Analysis({
      topic,
      narrative: {
        source: `Multi-Source (News + Reddit + X)`,
        sentimentScore: sentiment,
        newsSources: newsSources.map((n) => ({
          title: n.title,
          link: n.link,
          source:
            n.source && typeof n.source === "object"
              ? n.source.title
              : n.source || "News",
          pubDate: n.pubDate || new Date().toISOString(),
          thumbnail: n.thumbnail || null,
          description: n.description || null,
          sourceDomain: n.sourceDomain || "",
        })),
        // Explicitly map all fields so Mongoose doesn't strip them
        redditSources: redditSources.map((p) => ({
          title: p.title,
          url: p.url,
          embedUrl: p.embedUrl || null,
          thumbnail: p.thumbnail || null,
          videoUrl: p.videoUrl || null,
          author: p.author,
          upvotes: p.upvotes || 0,
          num_comments: p.num_comments || 0,
          ups: p.ups || "0",
        })),
        twitterSources: twitterSources.map((t) => ({
          content: t.content,
          url: t.url,
          author: t.author,
          authorHandle: t.authorHandle,
          timestamp: t.timestamp,
          thumbnail: t.thumbnail,
          avatarColor: t.avatarColor,
          avatarLetter: t.avatarLetter,
          retweets: t.retweets || 0,
          likes: t.likes || 0,
          views: t.views || "0K",
        })),
        instagramSources: instagramSources.map((i) => ({
          content: i.content,
          url: i.url,
          author: i.author,
          timestamp: i.timestamp,
          thumbnail: i.thumbnail,
          videoUrl: i.videoUrl,
          likes: i.likes || 0,
          comments: i.comments || 0,
        })),
      },
      reality: {
        indicatorName: indicatorData ? indicatorData.name : "Unknown",
        currentValue: indicatorData ? indicatorData.price : 0,
        trend: indicatorData ? indicatorData.trend : "Stable",
        changePercent: isNaN(change) ? 0 : change,
        marketData: indicatorData ? indicatorData.raw : {},
      },
      verdict: {
        panicIndex,
        conclusion,
        confidence,
        isMisinformation: panicIndex > 75 && hasNarrativeData,
      },
    });

    await analysisResult.save();
    console.log(
      `[Analysis] Saved verdict for "${topic}". Panic Index: ${panicIndex}%`,
    );
    res.json(analysisResult);
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { analyzeTopic };
