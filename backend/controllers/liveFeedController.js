const Parser = require('rss-parser');
const axios = require('axios');

const parser = new Parser({
  customFields: {
    item: [['source', 'sourceData', { keepArray: false }]]
  }
});

// Conflict-focused search terms for Google News RSS
const FEED_QUERIES = [
  'US Iran proxy war drone strike',
  'Israel Iran conflict news',
  'Israel Lebanon Hezbollah IDF strike',
  'Red Sea Houthi US Navy attack',
  'war military strike attack conflict',
  'missile airstrike bombing explosion',
  'Ukraine Russia frontline news',
  'Hamas Gaza Israel military',
  'Sudan civil war news',
  'North Korea military news',
  'Taiwan Strait China military',
];

// Keyword-to-event-type mapping
const TYPE_KEYWORDS = {
  nuclear: ['nuclear', 'iaea', 'uranium', 'enrichment', 'warhead', 'plutonium', 'atomic'],
  missile: ['missile', 'icbm', 'rocket', 'ballistic', 'drone', 'shahed', 'intercept'],
  naval: ['tanker', 'ship', 'naval', 'fleet', 'carrier', 'strait', 'sea', 'port'],
  blockade: ['blockade', 'shipping', 'red sea', 'hormuz', 'suez', 'cargo', 'oil tanker'],
  terrorism: ['terror', 'bombing', 'suicide', 'al-shabaab', 'isis', 'al-qaeda', 'hamas', 'hezbollah'],
  military: ['airstrike', 'strike', 'attack', 'frontline', 'battle', 'offensive', 'troops', 'forces', 'war', 'military', 'armor', 'tank'],
  protest: ['protest', 'riot', 'unrest', 'demonstration', 'rally', 'crackdown', 'crowd'],
  political: ['sanctions', 'summit', 'nato', 'un ', 'security council', 'diplomacy', 'election', 'coup', 'government'],
  economic: ['oil', 'crude', 'brent', 'market', 'ruble', 'sanctions', 'inflation', 'currency', 'gdp'],
  fire: ['fire', 'explosion', 'refinery', 'pipeline', 'infrastructure', 'factory', 'plant'],
};

const detectType = (title, description = '') => {
  const text = (title + ' ' + description).toLowerCase();
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return type;
  }
  return 'military';
};

const detectCountry = (title, desc = '') => {
  const text = (title + ' ' + desc).toLowerCase();
  const COUNTRY_MAP = [
    ['ukraine', '🇺🇦 Ukraine'], ['russia', '🇷🇺 Russia'], ['israel', '🇮🇱 Israel'],
    ['gaza', '🇵🇸 Gaza'], ['iran', '🇮🇷 Iran'], ['yemen', '🇾🇪 Yemen'],
    ['hormuz', '🇮🇷 Strait of Hormuz'], ['bab el-mandeb', '🌊 Bab el-Mandeb'],
    ['houthi', '🇾🇪 Red Sea / Yemen'], ['sudan', '🇸🇩 Sudan'],
    ['myanmar', '🇲🇲 Myanmar'], ['north korea', '🇰🇵 North Korea'],
    ['dprk', '🇰🇵 North Korea'], ['taiwan', '🇹🇼 Taiwan'],
    ['china', '🇨🇳 China'], ['somalia', '🇸🇴 Somalia'],
    ['haiti', '🇭🇹 Haiti'], ['syria', '🇸🇾 Syria'],
    ['lebanon', '🇱🇧 Lebanon'], ['iraq', '🇮🇶 Iraq'],
    ['ethiopia', '🇪🇹 Ethiopia'], ['libya', '🇱🇾 Libya'],
    ['nato', '🌍 NATO'], ['un ', '🌐 United Nations'],
    ['red sea', '🌊 Red Sea'], ['south china sea', '🌊 South China Sea'],
    ['philippines', '🇵🇭 Philippines'], ['kashmir', '🇮🇳 Kashmir'],
    ['kurdistan', '🇮🇶 Kurdistan'], ['guyana', '🇬🇾 Guyana'],
    ['oil', '🛢️ Energy Markets'], ['market', '📊 Economy'],
    ['pakistan', '🇵🇰 Pakistan'], ['afghanistan', '🇦🇫 Afghanistan'],
    ['venezuela', '🇻🇪 Venezuela'], ['sahel', '🌍 Sahel'],
    ['mali', '🇲🇱 Mali'], ['niger', '🇳🇪 Niger'],
    ['baltic', '🌊 Baltic Sea'], ['barents', '🌊 Barents Sea'],
    ['sinai', '🇪🇬 Sinai'], ['malacca', '🌊 Strait of Malacca'],
  ];
  for (const [keyword, label] of COUNTRY_MAP) {
    if (text.includes(keyword)) return label;
  }
  return '🌍 Global';
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const COUNTRY_COORDS = {
  '🇺🇦 Ukraine': { lat: 48.3, lng: 31.1 },
  '🇷🇺 Russia': { lat: 61.5, lng: 105.3 },
  '🇮🇱 Israel': { lat: 31.0, lng: 34.8 },
  '🇵🇸 Gaza': { lat: 31.3, lng: 34.3 },
  '🇮🇷 Iran': { lat: 32.4, lng: 53.6 },
  '🇮🇷 Strait of Hormuz': { lat: 26.6, lng: 56.5 },
  '🌊 Bab el-Mandeb': { lat: 12.6, lng: 43.3 },
  '🇾🇪 Red Sea / Yemen': { lat: 15.5, lng: 43.5 },
  '🇸🇩 Sudan': { lat: 12.8, lng: 30.2 },
  '🇲🇲 Myanmar': { lat: 21.9, lng: 95.9 },
  '🇰🇵 North Korea': { lat: 40.3, lng: 127.5 },
  '🇹🇼 Taiwan': { lat: 23.6, lng: 120.9 },
  '🇨🇳 China': { lat: 35.8, lng: 104.1 },
  '🇸🇴 Somalia': { lat: 5.1, lng: 46.1 },
  '🇭🇹 Haiti': { lat: 18.9, lng: -72.2 },
  '🇸🇾 Syria': { lat: 34.8, lng: 38.9 },
  '🇱🇧 Lebanon': { lat: 33.8, lng: 35.8 },
  '🇮🇶 Iraq': { lat: 33.2, lng: 44.3 },
  '🇮🇶 Kurdistan': { lat: 36.3, lng: 44.0 },
  '🇪🇹 Ethiopia': { lat: 9.1, lng: 40.4 },
  '🇱🇾 Libya': { lat: 26.3, lng: 17.2 },
  '🌊 Red Sea': { lat: 20.0, lng: 38.5 },
  '🌊 South China Sea': { lat: 15.0, lng: 114.0 },
  '🌊 Baltic Sea': { lat: 57.0, lng: 18.0 },
  '🌊 Barents Sea': { lat: 75.0, lng: 40.0 },
  '🌊 Strait of Malacca': { lat: 3.5, lng: 100.0 },
  '🇮🇳 Kashmir': { lat: 34.1, lng: 74.8 },
  '🇪🇬 Sinai': { lat: 29.8, lng: 33.8 },
  '🇬🇾 Guyana': { lat: 6.8, lng: -58.2 },
  '🛢️ Energy Markets': { lat: 25.0, lng: 45.0 },
  '📊 Economy': { lat: 38.0, lng: -77.0 },
  '🇵🇰 Pakistan': { lat: 30.3, lng: 69.3 },
  '🇻🇪 Venezuela': { lat: 6.4, lng: -66.5 },
  '🌍 Sahel': { lat: 14.0, lng: 5.0 },
  '🌍 Global': { lat: 20, lng: 0 }
};

const { generateLiveInsights } = require('../services/groqService');

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

const getLiveFeed = async (req, res) => {
  try {
    const queries = ['war', 'conflict', 'geopolitics', 'military'];
    const query = queries.join(' OR ');
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=50&apikey=${GNEWS_API_KEY}`;

    const response = await axios.get(url, { timeout: 8000 });
    const articles = response.data.articles || [];

    const news = articles.map((item, idx) => {
      const title = item.title || '';
      const source = item.source?.name || 'News';
      const pubDate = item.publishedAt;
      const type = detectType(title, item.description);
      const country = detectCountry(title, item.description);
      const coords = COUNTRY_COORDS[country] || { lat: 20, lng: 0 };

      return {
        id: `gn-${idx}`,
        time: pubDate ? new Date(pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        ago: pubDate ? timeAgo(pubDate) : '',
        pubDate,
        type,
        country,
        source,
        text: title,
        link: item.url || '#',
        lat: coords.lat,
        lng: coords.lng,
      };
    });

    const seen = new Set();
    const unique = news.filter(item => {
      const key = item.text.slice(0, 70).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    console.log(`[LiveFeed] Serving ${unique.length} articles from GNews`);
    return res.json({ news: unique.slice(0, 30) });

  } catch (err) {
    console.error('[LiveFeed] GNews Error (Falling back to RSS):', err.message);

    // RSS FALLBACK
    try {
      const rssNews = [];
      for (const q of FEED_QUERIES.slice(0, 3)) { // Use first few queries to keep it fast
        const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
        const feed = await parser.parseURL(feedUrl);

        feed.items.forEach((item, idx) => {
          const country = detectCountry(item.title, item.content);
          const coords = COUNTRY_COORDS[country] || { lat: 20, lng: 0 };
          rssNews.push({
            id: `rss-${q}-${idx}`,
            time: item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            ago: item.pubDate ? timeAgo(item.pubDate) : '',
            pubDate: item.pubDate,
            type: detectType(item.title, item.content),
            country,
            source: item.source || 'RSS Feed',
            text: item.title,
            link: item.link,
            lat: coords.lat,
            lng: coords.lng,
          });
        });
      }

      // Deduplicate and sort RSS
      const seen = new Set();
      const uniqueRss = rssNews.filter(item => {
        const key = item.text.slice(0, 70).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

      console.log(`[LiveFeed] Serving ${uniqueRss.length} articles from RSS Fallback`);
      return res.json({ news: uniqueRss.slice(0, 30) });
    } catch (rssErr) {
      console.error('[LiveFeed] RSS Fallback Failed:', rssErr.message);
      res.status(500).json({ error: 'All news sources failed', news: [] });
    }
  }
};

const getLiveInsights = async (req, res) => {
  let newsItems = [];
  try {
    const url = `https://gnews.io/api/v4/search?q=geopolitics%20OR%20war&lang=en&max=20&apikey=${GNEWS_API_KEY}`;
    const response = await axios.get(url, { timeout: 8000 });
    const articles = response.data.articles || [];
    newsItems = articles.map(a => ({ text: a.title, country: detectCountry(a.title, a.description) }));
  } catch (err) {
    console.warn('[LiveInsights] GNews failed, attempting RSS extraction for insights:', err.message);
    try {
      const q = 'geopolitical war conflict major events';
      const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
      const feed = await parser.parseURL(feedUrl);
      newsItems = feed.items.slice(0, 15).map(item => ({
        text: item.title,
        country: detectCountry(item.title, item.content)
      }));
    } catch (rssErr) {
      console.error('[LiveInsights] RSS fallback also failed:', rssErr.message);
    }
  }

  try {
    if (newsItems.length === 0) {
      return res.json({
        briefingTitle: "DAILY GEOPOLITICAL BRIEFING",
        summary: "Analytical engine recalibrating. Live intelligence streams are currently being rerouted due to high volume. Strategic clarity pending.",
        majorEvents: [
          { event: "Monitoring Global Systems", impact: "Systemic stability check in progress." }
        ]
      });
    }

    const insights = await generateLiveInsights(newsItems);
    res.json(insights || {
      briefingTitle: "DAILY GEOPOLITICAL BRIEFING",
      summary: "Analytical engine recalibrating. Critical signals being synthesized from available intelligence streams.",
      majorEvents: [{ event: "Data synthesis in progress", impact: "Strategic clarity pending further processing." }]
    });
  } catch (err) {
    console.error("Insights Generation Error:", err);
    res.status(500).json({ error: "Failed to generate insights" });
  }
};

const getCurrencyRates = async (req, res) => {
  const apiKey = process.env.EXCHANGE_RATES_API_KEY;
  try {
    // If we have an API key, we use a real service (e.g., exchangerate-api.com)
    // Otherwise, we provide simulated live-feeling data for the hackathon
    if (apiKey) {
      const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
      const response = await axios.get(url, { timeout: 5000 });
      const rates = response.data.conversion_rates;

      const selection = [
        { sym: "EUR/USD", val: (1 / rates.EUR).toFixed(4), chg: "+0.12%", up: true },
        { sym: "GBP/USD", val: (1 / rates.GBP).toFixed(4), chg: "-0.05%", up: false },
        { sym: "USD/JPY", val: rates.JPY.toFixed(2), chg: "+0.31%", up: true },
        { sym: "USD/CNY", val: rates.CNY.toFixed(4), chg: "+0.08%", up: true },
        { sym: "USD/INR", val: rates.INR.toFixed(2), chg: "-0.15%", up: false },
        { sym: "USD/RUB", val: rates.RUB.toFixed(2), chg: "+1.42%", up: true },
      ];
      return res.json({ rates: selection });
    }

    // Fallback/Demo data
    const demoRates = [
      { sym: "EUR/USD", val: "1.0842", chg: "+0.12%", up: true },
      { sym: "GBP/USD", val: "1.2654", chg: "-0.05%", up: false },
      { sym: "USD/JPY", val: "151.42", chg: "+0.31%", up: true },
      { sym: "USD/CNY", val: "7.2341", chg: "+0.08%", up: true },
      { sym: "USD/INR", val: "83.32", chg: "-0.15%", up: false },
      { sym: "USD/RUB", val: "92.45", chg: "+1.42%", up: true },
    ];
    res.json({ rates: demoRates });
  } catch (error) {
    console.error("Currency API Error:", error.message);
    res.status(500).json({ error: "Failed to fetch currency rates" });
  }
};

module.exports = { getLiveFeed, getLiveInsights, getCurrencyRates };
