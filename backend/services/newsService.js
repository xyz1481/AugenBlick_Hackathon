const axios = require('axios');

const fetchNews = async (rawQuery) => {
  const mediaStackApiKey = process.env.MEDIASTACK_API_KEY;
  const gnewsApiKey = process.env.GNEWS_API_KEY;
  
  const allSignals = [];

  // Improve search relevance by filtering meaningful words but not aggressively slicing.
  const stopWords = new Set(['the', 'and', 'for', 'was', 'with', 'that', 'from', 'this', 'were', 'is', 'of', 'in', 'to', 'at', 'are', 'a', 'an', 'true', 'false', 'really', 'there']);
  const meaningfulWords = rawQuery
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.has(w.toLowerCase()));

  // 1. Fetch from GNews (more accurate for exact multi-keyword geopolitical events)
  try {
    // GNews accepts a normal query string. We use space-separated keywords for broader matching
    const query = encodeURIComponent(meaningfulWords.join(' '));
    const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&max=4&apikey=${gnewsApiKey}`;
    
    console.log(`[NewsService] Fetching GNews signals for: ${meaningfulWords.join(' ')}`);
    const response = await axios.get(url);
    if (response.data && response.data.articles) {
      response.data.articles.forEach(article => {
        allSignals.push({
          title: article.title,
          source: article.source.name,
          published_at: article.publishedAt
        });
      });
    }
  } catch (error) {
    console.error("GNews API Error in verify:", error.response?.data || error.message);
  }

  // 2. Fetch from MediaStack (original fallback)
  if (mediaStackApiKey) {
    try {
      // MediaStack uses comma-separated keywords
      const mediaStackKeywords = meaningfulWords.slice(0, 5).join(',');
      const url = `http://api.mediastack.com/v1/news?access_key=${mediaStackApiKey}&keywords=${mediaStackKeywords}&languages=en&limit=3`;
      
      console.log(`[NewsService] Fetching MediaStack signals for: ${mediaStackKeywords}`);
      const response = await axios.get(url);
      
      if (response.data && response.data.data) {
        response.data.data.forEach(article => {
          // Avoid exact duplicates if GNews already found it
          if (!allSignals.find(s => s.title === article.title)) {
            allSignals.push({
              title: article.title,
              source: article.source,
              published_at: article.published_at
            });
          }
        });
      }
    } catch (error) {
      console.error("MediaStack API Error:", error.response?.data || error.message);
    }
  }

  // Return the combined array
  return allSignals;
};

module.exports = { fetchNews };
