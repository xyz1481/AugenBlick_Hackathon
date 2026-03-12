const axios = require("axios");

const FINNHUB_KEY = process.env.FINNHUB_KEY || "";

// ── Static fallbacks for futures & indices Finnhub doesn't serve (free tier) ──
const STATIC_FALLBACKS = {
  "^VIX": { name: "CBOE Volatility Index", price: 18.4, change: -3.1 },
  "^TNX": { name: "US 10-Year Treasury", price: 4.32, change: 0.5 },
  "DX-Y.NYB": { name: "US Dollar Index", price: 104.1, change: -0.2 },
  "GC=F": { name: "Gold Futures", price: 2340.5, change: 0.8 },
  "CL=F": { name: "Crude Oil WTI", price: 79.3, change: 1.1 },
  "BZ=F": { name: "Brent Crude", price: 83.2, change: 0.9 },
  "NG=F": { name: "Natural Gas", price: 1.87, change: -2.3 },
  "ZW=F": { name: "Wheat Futures", price: 542.0, change: -0.4 },
  "ZC=F": { name: "Corn Futures", price: 438.5, change: 0.2 },
};

/**
 * Map Yahoo Finance symbol → Finnhub symbol.
 * Returns null for futures/indices that Finnhub free doesn't support.
 */
function toFinnhub(sym) {
  // Plain US stock tickers work directly
  if (/^[A-Z]{1,5}$/.test(sym)) return sym;
  return null; // futures (=F, ^) not on free tier
}

/**
 * Fetch real-time quote from Finnhub for a stock symbol.
 * Returns { name, price, change, trend, timestamp, raw } or null.
 */
async function fetchFinnhubQuote(symbol) {
  if (!FINNHUB_KEY) return null;
  const fhSym = toFinnhub(symbol);
  if (!fhSym) return null;
  try {
    const [quoteRes, profileRes] = await Promise.allSettled([
      axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${fhSym}&token=${FINNHUB_KEY}`,
      ),
      axios.get(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${fhSym}&token=${FINNHUB_KEY}`,
      ),
    ]);

    const q = quoteRes.status === "fulfilled" ? quoteRes.value.data : null;
    const p = profileRes.status === "fulfilled" ? profileRes.value.data : null;

    if (!q || !q.c || q.c === 0) return null;

    const changePercent = q.pc > 0 ? ((q.c - q.pc) / q.pc) * 100 : 0;
    return {
      name: p?.name || symbol,
      price: q.c,
      change: +changePercent.toFixed(2),
      trend: changePercent >= 0 ? "Up" : "Down",
      timestamp: new Date(),
      raw: {
        symbol,
        regularMarketPrice: q.c,
        regularMarketChangePercent: changePercent,
        regularMarketDayHigh: q.h,
        regularMarketDayLow: q.l,
        regularMarketOpen: q.o,
        previousClose: q.pc,
        regularMarketVolume: null,
        // Expose raw Finnhub OHLC for the frontend
        finnhub: q,
      },
    };
  } catch (err) {
    console.error(`[Finnhub] Error for ${symbol}:`, err.message);
    return null;
  }
}

/**
 * Primary entry point used by marketRoutes.
 * Strategy: Finnhub first (stocks) → static fallback (indices/futures)
 */
const getIndicatorData = async (symbol) => {
  // 1. Try Finnhub for plain stocks
  const fhData = await fetchFinnhubQuote(symbol);
  if (fhData) return fhData;

  // 2. Static fallback for indices / futures
  if (STATIC_FALLBACKS[symbol]) {
    const fb = STATIC_FALLBACKS[symbol];
    return {
      name: fb.name,
      price: fb.price,
      change: fb.change,
      trend: fb.change >= 0 ? "Up" : "Down",
      timestamp: new Date(),
      raw: {
        symbol,
        regularMarketPrice: fb.price,
        regularMarketChangePercent: fb.change,
        regularMarketDayHigh: +(fb.price * 1.005).toFixed(2),
        regularMarketDayLow: +(fb.price * 0.995).toFixed(2),
        _isFallback: true,
      },
    };
  }

  // 3. Last resort: Yahoo Finance (kept as safety net)
  try {
    const yf = require("yahoo-finance2").default;
    const result = await yf.quote(symbol);
    const changePercent = result.regularMarketChangePercent || 0;
    return {
      name: result.shortName || result.longName || symbol,
      price: result.regularMarketPrice,
      change: changePercent,
      trend: changePercent >= 0 ? "Up" : "Down",
      timestamp: new Date(),
      raw: result,
    };
  } catch (_) {
    return null;
  }
};

const getHistoricalData = async (symbol) => {
  try {
    const yf = require("yahoo-finance2").default;
    const period2 = new Date();
    const period1 = new Date();
    period1.setFullYear(period2.getFullYear() - 1);

    const result = await yf.historical(symbol, {
      period1: period1.toISOString().split("T")[0],
      period2: period2.toISOString().split("T")[0],
      interval: "1d",
    });

    if (!result || result.length === 0) throw new Error("No data");

    return result
      .map((q) => ({
        date: q.date,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume,
      }))
      .filter((q) => q.close !== null);
  } catch (error) {
    console.error(`[Historical] Error for ${symbol}:`, error.message);
    // Mock fallback so chart is never blank
    const mockData = [];
    const now = new Date();
    for (let i = 100; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const base = 100 + Math.random() * 20;
      mockData.push({
        date: date.toISOString(),
        open: base,
        high: base + 2,
        low: base - 2,
        close: base + (Math.random() - 0.5) * 4,
        volume: 1_000_000,
      });
    }
    return mockData;
  }
};

module.exports = { getIndicatorData, getHistoricalData };
