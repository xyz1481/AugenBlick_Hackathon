const Parser = require('rss-parser');

// Custom parser configured to capture media/image fields from RSS
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure', 'enclosure', { keepArray: false }],
      ['media:group', 'mediaGroup', { keepArray: false }],
    ]
  }
});

/**
 * News outlets with RSS feeds that include images via media:content or enclosure.
 * These are queried in parallel and merged for a rich multi-source feed.
 */
const NEWS_FEEDS = [
  { name: 'Reuters',     url: (q) => `https://feeds.reuters.com/reuters/worldNews` },
  { name: 'Al Jazeera',  url: (q) => `https://www.aljazeera.com/xml/rss/all.xml` },
  { name: 'BBC News',    url: (q) => `https://feeds.bbci.co.uk/news/world/rss.xml` },
  { name: 'NPR',         url: (q) => `https://feeds.npr.org/1004/rss.xml` },
];

/**
 * Try to extract an image URL from various RSS item fields.
 */
const extractImage = (item) => {
  // 1. media:content with url attribute
  if (item.mediaContent?.$.url) return item.mediaContent.$.url;
  if (item.mediaContent?.url)   return item.mediaContent.url;

  // 2. media:thumbnail
  if (item.mediaThumbnail?.$.url) return item.mediaThumbnail.$.url;
  if (item.mediaThumbnail?.url)   return item.mediaThumbnail.url;
  if (typeof item.mediaThumbnail === 'string') return item.mediaThumbnail;

  // 3. enclosure (audio/video/image attached file)
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) {
    return item.enclosure.url;
  }

  // 4. Scan content/summary for <img> tags
  const content = item.content || item['content:encoded'] || item.summary || '';
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
  if (imgMatch?.[1]?.startsWith('http')) return imgMatch[1];

  return null;
};

/**
 * Fetch one RSS feed and filter items matching the query.
 */
const fetchFeed = async (feedCfg, query) => {
  try {
    const feed = await Promise.race([
      parser.parseURL(feedCfg.url(query)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
    ]);

    return (feed.items || []).map(item => {
      const thumbnail = extractImage(item);
      let sourceDomain = '';
      try { sourceDomain = new URL(item.link).hostname.replace('www.', ''); } catch {}

      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        source: feedCfg.name,
        sourceDomain,
        thumbnail,
        description: item.contentSnippet?.slice(0, 200) || null,
      };
    });
  } catch {
    return [];
  }
};

const getNarrativeFromNews = async (query) => {
  try {
    // Fetch all feeds in parallel
    const feedResults = await Promise.all(NEWS_FEEDS.map(f => fetchFeed(f, query)));
    const allArticles = feedResults.flat();

    if (!allArticles.length) {
      console.warn('[News] No articles fetched from any feed.');
      return { topNarratives: [] };
    }

    // Filter articles that are relevant to the query (case-insensitive keyword match)
    const keywords = query.toLowerCase().split(/\s+/);
    const relevant = allArticles.filter(a =>
      keywords.some(kw =>
        a.title?.toLowerCase().includes(kw) ||
        a.description?.toLowerCase().includes(kw)
      )
    );

    // If we have enough relevant ones, use them; otherwise fall back to all articles
    const pool = relevant.length >= 4 ? relevant : allArticles;

    // Shuffle slightly (prefer ones with images) and take top 6
    const sorted = pool.sort((a, b) => (b.thumbnail ? 1 : 0) - (a.thumbnail ? 1 : 0));
    const narratives = sorted.slice(0, 6);

    const withImages = narratives.filter(n => n.thumbnail).length;
    console.log(`[News] ${narratives.length} articles (${withImages} with images) | Sources: ${[...new Set(narratives.map(n => n.sourceDomain))].join(', ')}`);

    return { query, topNarratives: narratives, timestamp: new Date() };

  } catch (error) {
    console.error(`[News] Error for "${query}":`, error.message);
    return { topNarratives: [] };
  }
};

module.exports = { getNarrativeFromNews };
