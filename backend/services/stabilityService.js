const axios = require('axios');
const dataService = require('./dataService');
const trackingService = require('./trackingService');

// Simple in-memory cache
let cachedScore = null;
let lastComputed = 0;
const STABILITY_TTL_MS = 10 * 60 * 1000; // 10 minutes

const GDELT_EVENT_API =
  'https://api.gdeltproject.org/api/v2/events/geojson?query=conflict+OR+war+OR+sanctions&mode=PointData&maxrecords=250&format=geojson';

async function fetchEventTensionSignal() {
  try {
    const res = await axios.get(GDELT_EVENT_API, { timeout: 8000 });
    const features = res.data && res.data.features ? res.data.features : [];

    // Basic heuristic: more events -> higher tension (0-1)
    const count = features.length;
    // Normalize with soft cap at 250 events
    const normalized = Math.min(1, count / 250);
    return { count, normalized };
  } catch (err) {
    console.warn('[StabilityService] GDELT fetch failed, defaulting tension to 0.4', err.message);
    return { count: 0, normalized: 0.4 };
  }
}

async function fetchCommodityVolatilitySignal() {
  try {
    // Reuse existing Alpha Vantage integration for oil as proxy
    const commodities = await dataService.fetchCommodities();
    const oil = commodities.oil || 80;

    // Simple heuristic: higher price => more strained markets (0-1)
    const normalized = Math.max(0, Math.min(1, (oil - 60) / 60)); // 60-120 range
    return { oil, normalized };
  } catch (err) {
    console.warn('[StabilityService] Commodity volatility fallback', err.message);
    return { oil: 78.5, normalized: 0.5 };
  }
}

async function fetchLogisticsStressSignal() {
  try {
    const tracking = await trackingService.getLiveTrackingData();
    const vessels = tracking.vessels || [];

    const delayed = vessels.filter(
      (v) =>
        (v.status && v.status.toLowerCase().includes('delay')) ||
        (v.chokepoint && v.chokepoint !== 'Global Waters' && v.speed !== undefined && v.speed < 1)
    );

    const ratio = vessels.length ? delayed.length / vessels.length : 0;
    // Normalize with light amplification
    const normalized = Math.min(1, ratio * 3);
    return { total: vessels.length, delayed: delayed.length, normalized };
  } catch (err) {
    console.warn('[StabilityService] Logistics stress fallback', err.message);
    return { total: 0, delayed: 0, normalized: 0.3 };
  }
}

async function computeGlobalStability() {
  const now = Date.now();
  if (cachedScore && now - lastComputed < STABILITY_TTL_MS) {
    return cachedScore;
  }

  const [eventSignal, commoditySignal, logisticsSignal] = await Promise.all([
    fetchEventTensionSignal(),
    fetchCommodityVolatilitySignal(),
    fetchLogisticsStressSignal(),
  ]);

  // 0 = unstable, 100 = highly stable
  // We treat higher signals as more stress, so invert.
  const weights = {
    events: 0.35,
    commodities: 0.35,
    logistics: 0.30,
  };

  const stressScore =
    eventSignal.normalized * weights.events +
    commoditySignal.normalized * weights.commodities +
    logisticsSignal.normalized * weights.logistics;

  const stabilityScore = Math.round((1 - Math.min(1, stressScore)) * 100);

  let reason = 'Global systems show moderate resilience across markets and logistics.';
  if (stabilityScore < 30) {
    reason = 'High conflict intensity, strained commodities, and elevated logistics stress are undermining global stability.';
  } else if (stabilityScore < 55) {
    reason = 'Persistent conflict activity and tightening commodity markets are pressuring global stability.';
  } else if (stabilityScore > 80) {
    reason = 'Low acute conflict density and relatively stable trade flows are supporting high global stability.';
  }

  const payload = {
    score: stabilityScore,
    reason,
    signals: {
      events: eventSignal,
      commodities: commoditySignal,
      logistics: logisticsSignal,
    },
    updatedAt: new Date().toISOString(),
  };

  cachedScore = payload;
  lastComputed = now;
  return payload;
}

module.exports = {
  computeGlobalStability,
};

