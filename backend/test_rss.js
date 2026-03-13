const Parser = require('rss-parser');
const parser = new Parser();

const testRSSFallback = async () => {
  const query = 'geopolitics OR war';
  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  console.log(`Testing Google News RSS: ${feedUrl}`);
  try {
    const feed = await parser.parseURL(feedUrl);
    console.log(`Feed Title: ${feed.title}`);
    console.log(`Articles found: ${feed.items.length}`);

    feed.items.slice(0, 5).forEach((item, i) => {
      console.log(`${i + 1}. ${item.title}`);
      console.log(`   Source: ${item.source || 'N/A'}`);
      console.log(`   Link: ${item.link}`);
    });

  } catch (error) {
    console.error("RSS Error:", error.message);
  }
};

testRSSFallback();
