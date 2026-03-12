const axios = require('axios');

const fetchNews = async (keywords) => {
  const apiKey = process.env.MEDIASTACK_API_KEY;
  if (!apiKey) {
    console.warn("MEDIASTACK_API_KEY is missing. News augmentation disabled.");
    return [];
  }

  try {
    // Encode keywords for URL
    const query = encodeURIComponent(keywords.replace(/[^\w\s]/gi, ''));
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
