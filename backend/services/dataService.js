const axios = require('axios');
const Groq = require('groq-sdk');

const ALPHA_VANTAGE_KEY = '3N3G2FM01JNYUZOX';
const GNEWS_KEY = '862ebdd18708db12d056aa26c8a91e55';
const GROQ_API_KEY = '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';

const groq = new Groq({ apiKey: GROQ_API_KEY });

// Simple in-memory cache to prevent destroying rate limits during hackathon testing
const cache = {
  commodities: { data: null, timestamp: 0 },
  news: {},
  trade: {},
  llmImpacts: {}
};

const CACHE_TTL = 1000 * 60 * 60; // 1 hour caching

exports.fetchCommodities = async () => {
  if (cache.commodities.data && (Date.now() - cache.commodities.timestamp < CACHE_TTL)) {
    return cache.commodities.data;
  }

  try {
    // Fetch WTI crude oil prices as our global baseline
    const res = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'WTI',
        interval: 'monthly',
        apikey: ALPHA_VANTAGE_KEY
      }
    });

    const oilData = res.data.data;
    const currentOilPrice = oilData && oilData.length > 0 ? parseFloat(oilData[0].value) : 80.0;

    const data = { oil: currentOilPrice };
    
    cache.commodities = { data, timestamp: Date.now() };
    return data;
  } catch (error) {
    console.warn("AlphaVantage API Error (falling back to static global baselines):", error.message);
    return { oil: 78.5 }; // Realistic fallback
  }
};

exports.fetchNewsEscalation = async (attacker, target) => {
  const cacheKey = `${attacker}-${target}`;
  if (cache.news[cacheKey] && (Date.now() - cache.news[cacheKey].timestamp < CACHE_TTL)) {
    return cache.news[cacheKey].data;
  }

  try {
    const res = await axios.get(`https://gnews.io/api/v4/search`, {
      params: {
        q: `${attacker} AND ${target} AND (conflict OR war OR sanctions OR tension)`,
        lang: 'en',
        max: 5,
        apikey: GNEWS_KEY
      }
    });

    // Escalation multiplier based on news volume (MVP heuristic)
    const newsVolume = res.data.totalArticles || 0;
    
    // Base 1.0 multiplier. If massive news volume (e.g. > 10,000 articles on US/China conflict), it scales up by up to 20%
    let escalationFactor = 1.0 + Math.min((newsVolume / 50000), 0.20); 

    cache.news[cacheKey] = { data: escalationFactor, timestamp: Date.now() };
    return escalationFactor;

  } catch (error) {
    console.warn("GNews API Error (falling back to normal logic):", error.message);
    return 1.0;
  }
};

// Hardcoded prominent relationships for the MVP since World Bank bilateral HTTP endpoints are complex to query raw
// This simulates fetching complex bilateral GDP/Trade overlap.
// Values represent % of global shock / dependency metric (0-1)
const TRADE_DEPENDENCIES = {
  'US-CN': 0.85, 'CN-US': 0.85, 
  'RU-UA': 0.60, 'UA-RU': 0.60,
  'US-RU': 0.20, 'RU-US': 0.20,
  'CN-TW': 0.90, 'TW-CN': 0.90,
  'IL-IR': 0.10, 'IR-IL': 0.10,
  // Fallback defaults
};

exports.fetchDependencyMetric = async (attacker, target) => {
  const pair1 = `${attacker}-${target}`;
  const pair2 = `${target}-${attacker}`;
  
  if (TRADE_DEPENDENCIES[pair1]) return TRADE_DEPENDENCIES[pair1];
  if (TRADE_DEPENDENCIES[pair2]) return TRADE_DEPENDENCIES[pair2];
  
  // Default dependency metric if not specifically mapped
  return 0.35; 
};

exports.fetchLLMIndustryImpacts = async (attacker, target, conflictType, intensity, oilPrice) => {
  const cacheKey = `${attacker}-${target}-${conflictType}-${intensity}`;
  if (cache.llmImpacts[cacheKey] && (Date.now() - cache.llmImpacts[cacheKey].timestamp < CACHE_TTL)) {
    return cache.llmImpacts[cacheKey].data;
  }

  try {
    const prompt = `You are a geopolitical intelligence engine. Analyze this scenario:
    A "${conflictType}" at intensity OP-LVL ${intensity} is initiated by ${attacker} targeting ${target}. 
    The current WTI oil baseline is $${oilPrice}.
    
    Task: Identify exactly the 4 most critical global economic or supply chain sectors structurally devastated by this specific conflict. 
    Examples: "European Natural Gas Imports", "Semiconductor Manufacturing", "Global Grain Logistics", etc.
    
    CRITICAL INSTRUCTION: Return ONLY a raw JSON array of 4 strings. No markdown formatting, no backticks, no explanation. Just the array.
    Example output format: ["Industry A", "Industry B", "Industry C", "Industry D"]`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You output only raw, valid JSON arrays." },
        { role: "user", content: prompt }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 150,
    });

    const rawResponse = chatCompletion.choices[0]?.message?.content?.trim() || "[]";
    let parsedArray = [];
    try {
        parsedArray = JSON.parse(rawResponse);
    } catch (parseError) {
        console.warn("Groq JSON parsing failed. Formatting fallback.");
        // Basic fallback extraction if LLM didn't listen and used markdown
        const match = rawResponse.match(/\[(.*?)\]/s);
        if (match) parsedArray = JSON.parse(`[${match[1]}]`);
        else throw new Error("Could not salvage LLM response");
    }

    if (!Array.isArray(parsedArray) || parsedArray.length === 0) {
        parsedArray = ['Energy Markets', 'Aerospace Logistics', 'Global Agriculture', 'Tech Supply Chain']; // final fallback
    }

    cache.llmImpacts[cacheKey] = { data: parsedArray, timestamp: Date.now() };
    return parsedArray;

  } catch (error) {
    console.error("Groq API Error (falling back to generic industries):", error.message);
    const fallbacks = ['Energy Infrastructure', 'Maritime Shipping', 'Technology Manufacturing', 'Financial Services'];
    cache.llmImpacts[cacheKey] = { data: fallbacks, timestamp: Date.now() };
    return fallbacks;
  }
};
