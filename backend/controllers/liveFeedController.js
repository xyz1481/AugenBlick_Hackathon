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
  nuclear:   ['nuclear', 'iaea', 'uranium', 'enrichment', 'warhead', 'plutonium', 'atomic'],
  missile:   ['missile', 'icbm', 'rocket', 'ballistic', 'drone', 'shahed', 'intercept'],
  naval:     ['tanker', 'ship', 'naval', 'fleet', 'carrier', 'strait', 'sea', 'port'],
  blockade:  ['blockade', 'shipping', 'red sea', 'hormuz', 'suez', 'cargo', 'oil tanker'],
  terrorism: ['terror', 'bombing', 'suicide', 'al-shabaab', 'isis', 'al-qaeda', 'hamas', 'hezbollah'],
  military:  ['airstrike', 'strike', 'attack', 'frontline', 'battle', 'offensive', 'troops', 'forces', 'war', 'military', 'armor', 'tank'],
  protest:   ['protest', 'riot', 'unrest', 'demonstration', 'rally', 'crackdown', 'crowd'],
  political: ['sanctions', 'summit', 'nato', 'un ', 'security council', 'diplomacy', 'election', 'coup', 'government'],
  economic:  ['oil', 'crude', 'brent', 'market', 'ruble', 'sanctions', 'inflation', 'currency', 'gdp'],
  fire:      ['fire', 'explosion', 'refinery', 'pipeline', 'infrastructure', 'factory', 'plant'],
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

const getLiveFeed = async (req, res) => {
  try {
    // Pick 5 random queries to increase diversity
    const shuffled = FEED_QUERIES.sort(() => Math.random() - 0.5).slice(0, 5);

    const feedPromises = shuffled.map(async (query) => {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      try {
        const response = await axios.get(url, {
          timeout: 6000,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AugenBlick/1.0)' }
        });
        const feed = await parser.parseString(response.data);
        return feed.items || [];
      } catch {
        return [];
      }
    });

    const allItemArrays = await Promise.all(feedPromises);
    
    // Balanced selection: take top 5 from each query array to ensure diversity
    const balancedItems = [];
    const maxPerQuery = 10;
    for (let i = 0; i < maxPerQuery; i++) {
      for (const arr of allItemArrays) {
        if (arr[i]) balancedItems.push(arr[i]);
      }
    }

    // Deduplicate by title
    const seen = new Set();
    const unique = balancedItems.filter(item => {
      const key = (item.title || '').slice(0, 70).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by date descending
    unique.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

    // Format for frontend
    const news = unique.slice(0, 25).map((item, idx) => {
      const title = (item.title || '').replace(/\s*-\s*[A-Z][^-]+$/, '').trim(); // strip source suffix
      const source = (() => {
        const s = item.sourceData;
        if (typeof s === 'string') return s;
        if (s && typeof s === 'object') return s._ || '';
        // Try extracting from title suffix "... - Reuters"
        const m = (item.title || '').match(/\s*-\s*([A-Za-z ]+)$/);
        return m ? m[1].trim() : 'News';
      })();
      const pubDate = item.pubDate || item.isoDate;
      const type = detectType(title, item.contentSnippet);
      const country = detectCountry(title, item.contentSnippet);
      const coords = COUNTRY_COORDS[country] || { lat: 20, lng: 0 };

      return {
        id: idx,
        time: pubDate ? new Date(pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        ago: pubDate ? timeAgo(pubDate) : '',
        type,
        country,
        source,
        text: title,
        link: item.link || '#',
        lat: coords.lat,
        lng: coords.lng,
      };
    });

    console.log(`[LiveFeed] Serving ${news.length} real news items`);
    res.json({ news });

  } catch (err) {
    console.error('[LiveFeed] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch live feed', news: [] });
  }
};

module.exports = { getLiveFeed };
