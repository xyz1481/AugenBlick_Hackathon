/**
 * instagramService.js
 * Scrapes Instagram posts via Apify Instagram Post Scraper.
 * Uses EXACT input schema confirmed working:
 *   { directUrls, resultsType, resultsLimit, searchType, searchLimit, addParentData }
 * Strategy: scrape curated news/intel profiles  filter by topic keywords.
 *
 * ENV: APIFY_TOKEN  (set in backend/.env)
 */

const axios = require("axios");

const APIFY_TOKEN = process.env.APIFY_TOKEN || "";
const APIFY_BASE = "https://api.apify.com/v2/acts/apify~instagram-scraper";

const INTEL_PROFILES = [
  "https://www.instagram.com/reuters/",
  "https://www.instagram.com/bbcnews/",
  "https://www.instagram.com/aljazeera/",
  "https://www.instagram.com/bloombergbusiness/",
  "https://www.instagram.com/theeconomist/",
  "https://www.instagram.com/wsjnews/",
  "https://www.instagram.com/foreignpolicy/",
  "https://www.instagram.com/time/",
];

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "was",
  "one",
  "our",
  "out",
  "day",
  "get",
  "has",
  "him",
  "his",
  "how",
  "its",
  "may",
  "new",
  "now",
  "old",
  "see",
  "two",
  "way",
  "who",
  "did",
  "let",
  "put",
  "say",
  "she",
  "too",
  "use",
  "with",
  "from",
  "that",
  "this",
  "about",
  "will",
  "been",
  "have",
  "they",
  "their",
  "when",
]);

function extractKeywords(topic) {
  return [
    ...new Set(
      topic
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP_WORDS.has(w)),
    ),
  ].slice(0, 6);
}

function normalizePost(post) {
  return {
    platform: "instagram",
    id: post.id || post.shortCode,
    title: post.caption
      ? post.caption.slice(0, 300) + (post.caption.length > 300 ? "..." : "")
      : "(no caption)",
    url: post.url || `https://www.instagram.com/p/${post.shortCode}/`,
    thumbnail: post.displayUrl || null,
    videoUrl: post.type === "Video" ? post.videoUrl || null : null,
    author: post.ownerUsername || "instagram",
    authorFull: post.ownerFullName || null,
    likes:
      typeof post.likesCount === "number" && post.likesCount >= 0
        ? post.likesCount
        : 0,
    comments: typeof post.commentsCount === "number" ? post.commentsCount : 0,
    views: post.videoViewCount || null,
    hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
    type: post.type || "Image",
    timestamp: post.timestamp || new Date().toISOString(),
    date: new Date(post.timestamp || Date.now()),
  };
}

async function runApifyActor(input, pollTimeoutMs = 90000) {
  const runRes = await axios.post(
    `${APIFY_BASE}/runs?token=${APIFY_TOKEN}`,
    input,
    { headers: { "Content-Type": "application/json" }, timeout: 15000 },
  );
  const runId = runRes.data && runRes.data.data && runRes.data.data.id;
  if (!runId) throw new Error("Apify did not return a runId");

  const deadline = Date.now() + pollTimeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 4000));
    const statusRes = await axios.get(
      `${APIFY_BASE}/runs/${runId}?token=${APIFY_TOKEN}`,
      { timeout: 10000 },
    );
    const status =
      statusRes.data && statusRes.data.data && statusRes.data.data.status;
    if (status === "SUCCEEDED") break;
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      throw new Error(`Apify run ${status}`);
    }
  }

  const itemsRes = await axios.get(
    `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}&format=json`,
    { timeout: 15000 },
  );
  return Array.isArray(itemsRes.data) ? itemsRes.data : [];
}

async function getInstagramIntel(topic) {
  if (!APIFY_TOKEN) {
    console.warn("[Instagram] APIFY_TOKEN not set -- skipping.");
    return [];
  }

  const keywords = extractKeywords(topic);
  console.log(
    `[Instagram] Scraping ${INTEL_PROFILES.length} profiles for keywords:`,
    keywords,
  );

  try {
    const rawPosts = await runApifyActor({
      directUrls: INTEL_PROFILES,
      resultsType: "posts",
      resultsLimit: 200,
      searchType: "hashtag",
      searchLimit: 1,
    });

    console.log(`[Instagram] Apify returned ${rawPosts.length} raw posts.`);

    const matched = rawPosts
      .filter((p) => {
        const text = (p.caption || "").toLowerCase();
        return keywords.some((kw) => text.includes(kw));
      })
      .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
      .slice(0, 10);

    console.log(`[Instagram] ${matched.length} posts matched topic.`);
    return matched.map(normalizePost);
  } catch (err) {
    const body = err.response && err.response.data;
    console.error(
      "[Instagram] Apify error:",
      err.message,
      body ? JSON.stringify(body).slice(0, 300) : "",
    );
    return [];
  }
}

module.exports = { getInstagramIntel };
