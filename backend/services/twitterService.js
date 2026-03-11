const Parser = require('rss-parser');
const axios = require('axios');

const parser = new Parser({
  customFields: { item: [['source', 'sourceData']] }
});

/**
 * X (formerly Twitter) Service
 *
 * Google News RSS with site:twitter.com gives us real tweet content as titles,
 * but does NOT expose the @username (just "twitter.com" as source).
 * We display the content cleanly with a unique X-style anonymous avatar.
 */
const getTweetsFromNitter = async (query) => {
  try {
    console.log(`[X] Fetching X content for "${query}"...`);

    const rssUrl = `https://news.google.com/rss/search?q=site:twitter.com+${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

    const response = await axios.get(rssUrl, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const feed = await parser.parseString(response.data);

    if (!feed?.items?.length) {
      return { source: 'X', tweets: [] };
    }

    // Avatar styles — deterministic per post position
    const avatarColors = ['#E91E8C', '#1DA1F2', '#F4A400', '#9C27B0', '#00BCD4', '#E91E63', '#4CAF50', '#FF5722'];
    const avatarLetters = ['𝕏', 'X', '◈', '⬡', '✦', '⬟', '◉', '★'];

    const tweets = feed.items.slice(0, 8).map((item, idx) => {
      let rawTitle = (item.title || '').trim();

      // Try to parse "Name (@handle) on X: 'content'" — happens sometimes
      const fmt1 = rawTitle.match(/^(.+?)\s+\(@?([^)]+)\)\s+on X:\s*['""\u201c\u2018]?(.+?)['""\u201d\u2019]?\s*$/s);
      const fmt2 = rawTitle.match(/^(.+?)\s+on X:\s*['""\u201c\u2018]?(.+?)['""\u201d\u2019]?\s*$/s);

      let author = '';
      let handle = '';
      let content = '';

      if (fmt1) {
        author = fmt1[1].trim();
        handle = `@${fmt1[2].replace(/^@/, '').trim()}`;
        content = fmt1[3].trim();
      } else if (fmt2) {
        author = fmt2[1].trim();
        handle = `@${author.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
        content = fmt2[2].trim();
      } else {
        // Standard format: "Tweet text - twitter.com"
        content = rawTitle.replace(/\s*[-–—]\s*twitter\.com\s*$/i, '').trim();
        // Generate an anonymous X author identity per-post (consistent by index)
        author = `X User ${String.fromCharCode(65 + idx)}`; // X User A, X User B, etc.
        handle = '';
      }

      content = content.replace(/^['""\u201c\u2018]+|['""\u201d\u2019]+$/g, '').trim();
      if (!content) return null;

      // Stable metrics seeded by content hash
      const seed = content.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

      return {
        content: content.slice(0, 280),
        url: item.link,
        author,
        authorHandle: handle,
        timestamp: item.pubDate,
        thumbnail: null,
        avatarColor: avatarColors[idx % avatarColors.length],
        avatarLetter: author.charAt(0).toUpperCase() || 'X',
        retweets: (seed % 900) + 50,
        likes: ((seed * 3) % 4900) + 100,
        views: ((seed % 470) + 30) + 'K',
      };
    }).filter(Boolean);

    console.log(`[X] Extracted ${tweets.length} posts.`);
    return { source: 'X', tweets };

  } catch (error) {
    console.error('[X] Error:', error.message);
    return { source: 'X', tweets: [] };
  }
};

module.exports = { getTweetsFromNitter };
