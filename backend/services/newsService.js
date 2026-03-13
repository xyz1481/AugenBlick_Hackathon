const axios = require('axios');

const fetchNews = async (keywords) => {
  const apiKey = process.env.MEDIASTACK_API_KEY;
  if (!apiKey) {
    console.warn("MEDIASTACK_API_KEY is missing. News augmentation disabled.");
    return [];
  }

  try {
    // Encode keywords for URL
    // Improve search relevance by using comma-separated keywords
    // We filter for meaningful words (>= 3 chars, not common stop words)
    const stopWords = new Set(['the', 'and', 'for', 'was', 'with', 'that', 'from', 'this', 'were', 'is', 'of', 'in', 'to', 'at']);
    const processedKeywords = keywords
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.has(w.toLowerCase()))
      .slice(0, 4) // Limit to first 4 meaningful keywords
      .join(',');

    const query = encodeURIComponent(processedKeywords);
    const url = `http://api.mediastack.com/v1/news?access_key=${apiKey}&keywords=${query}&languages=en&limit=3`;

    console.log(`[NewsService] Fetching signals for: ${keywords}`);
    const response = await axios.get(url);

    if (response.data && response.data.data) {
      return response.data.data.map(article => ({
        title: article.title,
        source: article.source,
        published_at: article.published_at
      }));
    }

    return [];
  } catch (error) {
    console.error("News API Error:", error.response?.data || error.message);
    return [];
  }
};

module.exports = { fetchNews };
