require('dotenv').config();
const axios = require('axios');
const { generateLiveInsights } = require('./services/groqService');

const GNEWS_API_KEY = "9f315d7aed8ac8d00d813968a20e9e14";

const testGNews = async () => {
  const query = 'geopolitics OR war';
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5&apikey=${GNEWS_API_KEY}`;

  console.log(`Testing GNews URL: ${url}`);
  try {
    const response = await axios.get(url, { timeout: 8000 });
    const articles = response.data.articles || [];
    console.log(`Articles found: ${articles.length}`);
    articles.forEach((a, i) => console.log(`${i + 1}. ${a.title}`));

    if (articles.length > 0) {
      const newsItems = articles.map(a => ({ text: a.title, country: 'Global' }));
      console.log("\nGenerating AI Insights...");
      const insights = await generateLiveInsights(newsItems);
      console.log("Insights Output:", JSON.stringify(insights, null, 2));
    }
  } catch (error) {
    console.error("GNews Error:", error.response?.data || error.message);
  }
};

testGNews();
