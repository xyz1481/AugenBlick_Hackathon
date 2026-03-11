const YahooFinance = require('yahoo-finance2').default;
// Ensure we have a fresh instance if the default export is the class
const yf = (YahooFinance.prototype && YahooFinance.prototype.quote) 
  ? new YahooFinance() 
  : YahooFinance;



const getIndicatorData = async (symbol) => {
  try {
    const result = await yf.quote(symbol); // Remove invalid timeout option
    const changePercent = result.regularMarketChangePercent || result.raw?.regularMarketChangePercent || 0;
    
    return {
      name: result.shortName || result.longName || symbol,
      price: result.regularMarketPrice,
      change: changePercent,
      trend: changePercent >= 0 ? 'Up' : 'Down',
      timestamp: new Date(),
      raw: result
    };
  } catch (error) {
    console.error(`[Indicator] Error for ${symbol}:`, error.message);
    
    // DEMO FALLBACK: If API fails, provide a realistic fallback for common tickers
    if (symbol === 'CL=F') {
      return {
        name: "Crude Oil (Demo Fallback)",
        price: 86.50,
        change: 1.25,
        trend: 'Up',
        timestamp: new Date(),
        raw: { regularMarketDayLow: 85.10, regularMarketDayHigh: 87.40, regularMarketVolume: 120000 }
      };
    }
    return null;
  }
};

module.exports = { getIndicatorData };
