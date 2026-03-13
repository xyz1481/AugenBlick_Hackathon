const axios = require('axios');
const dataService = require('./dataService');
const trackingService = require('./trackingService');

// Cache to avoid hammering external APIs
let cachedSystems = null;
let lastSystemsFetch = 0;
const SYSTEMS_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchCommodityPanel() {
  // We already have oil via Alpha Vantage. For other assets, use open endpoints where possible,
  // and fall back to static-but-realistic baselines if blocked.
  const assets = [
    { id: 'oil', symbol: 'OIL', label: 'Crude Oil (WTI)' },
    { id: 'gas', symbol: 'NATGAS', label: 'Natural Gas' },
    { id: 'gold', symbol: 'GOLD', label: 'Gold' },
    { id: 'silver', symbol: 'SILVER', label: 'Silver' },
    { id: 'wheat', symbol: 'WHEAT', label: 'Wheat' },
  ];

  const commodities = [];

  // Oil using existing Alpha Vantage helper
  try {
    const base = await dataService.fetchCommodities();
    commodities.push({
      id: 'oil',
      symbol: 'OIL',
      label: 'Crude Oil (WTI)',
      price: base.oil,
      changePct: null,
      volatility: null,
      source: 'AlphaVantage',
    });
  } catch (err) {
    commodities.push({
      id: 'oil',
      symbol: 'OIL',
      label: 'Crude Oil (WTI)',
      price: 78.5,
      changePct: null,
      volatility: null,
      source: 'Fallback',
    });
  }

  // Other commodities via Yahoo Finance open-ish endpoints or realistic fallbacks
  const yahooSymbols = {
    gas: 'NG=F',
    gold: 'GC=F',
    silver: 'SI=F',
    wheat: 'ZW=F',
  };

  try {
    const res = await axios.get(
      'https://query1.finance.yahoo.com/v7/finance/quote',
      {
        params: { symbols: Object.values(yahooSymbols).join(',') },
        timeout: 7000,
      },
    );
    const quotes = res.data?.quoteResponse?.result || [];
    const bySymbol = {};
    quotes.forEach((q) => {
      bySymbol[q.symbol] = q;
    });

    assets.slice(1).forEach((a) => {
      const q = bySymbol[yahooSymbols[a.id]];
      if (q) {
        const price = q.regularMarketPrice;
        const changePct = q.regularMarketChangePercent;
        const vol = q.regularMarketDayHigh && q.regularMarketDayLow
          ? Math.abs(q.regularMarketDayHigh - q.regularMarketDayLow) / price
          : null;
        commodities.push({
          id: a.id,
          symbol: a.symbol,
          label: a.label,
          price,
          changePct,
          volatility: vol,
          source: 'YahooFinance',
        });
      }
    });
  } catch (err) {
    console.warn('[SystemsService] Yahoo Finance commodity fetch failed:', err.message);
    // Fallback baselines
    commodities.push(
      { id: 'gas', symbol: 'NATGAS', label: 'Natural Gas', price: 2.7, changePct: -0.8, volatility: 0.03, source: 'Fallback' },
      { id: 'gold', symbol: 'GOLD', label: 'Gold', price: 2340, changePct: 0.4, volatility: 0.01, source: 'Fallback' },
      { id: 'silver', symbol: 'SILVER', label: 'Silver', price: 29.4, changePct: 0.6, volatility: 0.015, source: 'Fallback' },
      { id: 'wheat', symbol: 'WHEAT', label: 'Wheat', price: 520, changePct: 1.0, volatility: 0.02, source: 'Fallback' },
    );
  }

  return commodities;
}

async function fetchLogisticsStress() {
  try {
    const tracking = await trackingService.getLiveTrackingData();
    const vessels = tracking.vessels || [];

    const total = vessels.length;
    const chokepointNames = ['Suez Canal', 'Strait of Hormuz', 'Malacca Strait', 'Bab el-Mandeb', 'Panama Canal'];
    const atChokepoints = vessels.filter(
      (v) => v.chokepoint && chokepointNames.includes(v.chokepoint),
    );
    const delayed = atChokepoints.filter(
      (v) =>
        (v.status && v.status.toLowerCase().includes('delay')) ||
        (v.speed !== undefined && v.speed < 1),
    );

    const portCongestionIndex =
      atChokepoints.length && total
        ? Math.round((atChokepoints.length / total) * 100)
        : 20;
    const shippingDelayIndex =
      atChokepoints.length
        ? Math.round((delayed.length / atChokepoints.length) * 100)
        : 15;

    return {
      summary: {
        vesselsTotal: total,
        chokepointVessels: atChokepoints.length,
        delayedAtChokepoints: delayed.length,
      },
      indices: {
        portCongestion: portCongestionIndex,
        shippingDelay: shippingDelayIndex,
      },
    };
  } catch (err) {
    console.warn('[SystemsService] Logistics stress fallback:', err.message);
    return {
      summary: { vesselsTotal: 0, chokepointVessels: 0, delayedAtChokepoints: 0 },
      indices: { portCongestion: 25, shippingDelay: 20 },
    };
  }
}

async function getSystemsOverview() {
  const now = Date.now();
  if (cachedSystems && now - lastSystemsFetch < SYSTEMS_TTL_MS) {
    return cachedSystems;
  }

  const [commodities, logistics] = await Promise.all([
    fetchCommodityPanel(),
    fetchLogisticsStress(),
  ]);

  const payload = {
    commodities,
    logistics,
    updatedAt: new Date().toISOString(),
  };

  cachedSystems = payload;
  lastSystemsFetch = now;
  return payload;
}

module.exports = {
  getSystemsOverview,
};

