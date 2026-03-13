const express = require("express");
const router = express.Router();
const {
  getIndicatorData,
  getHistoricalData,
} = require("../services/indicatorService");
const { generateMarketAnalysis } = require("../services/groqService");


// Define war-time critical watch categories
const WAR_ROOM_TICKERS = {
  macro: ["^VIX", "^TNX", "DX-Y.NYB", "GC=F"],
  energy: ["CL=F", "BZ=F", "NG=F", "CCJ"],
  defense: ["ITA", "LMT", "RTX", "NOC"],
  food: ["ZW=F", "ZC=F", "MOS", "NTR"],
  tech: ["NVDA", "PLTR", "CRWD", "CIBR"],
};

router.get("/war-watch", async (req, res) => {
  try {
    const results = {};
    for (const [category, symbols] of Object.entries(WAR_ROOM_TICKERS)) {
      const data = await Promise.all(symbols.map((s) => getIndicatorData(s)));
      results[category] = data.filter((d) => d !== null);
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch war watch data" });
  }
});

router.get("/history/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const { period } = req.query; // e.g. 1mo, 1y
  try {
    const history = await getHistoricalData(symbol, period || "1mo");
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch historical data" });
  }
});

// Original indices endpoint for backward compatibility
router.get("/indices", async (req, res) => {
  const symbols = ["^GSPC", "^IXIC", "CL=F", "GC=F", "BTC-USD", "EURUSD=X"];
  try {
    const results = await Promise.all(symbols.map((s) => getIndicatorData(s)));
    res.json(results.filter((r) => r !== null));
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
});

// Widget panel endpoint: markets, commodities, BTC — all in one call
const WIDGET_MARKET_SYMS = [
  "^GSPC",
  "^IXIC",
  "^DJI",
  "^VIX",
  "DX-Y.NYB",
  "^TNX",
];
const WIDGET_MARKET_LABELS = ["SPX", "COMP", "DJI", "VIX", "DXY", "TNX"];
const WIDGET_CMDTY_SYMS = ["GC=F", "CL=F", "NG=F", "SI=F", "HG=F", "ZW=F"];
const WIDGET_CMDTY_LABELS = [
  "GOLD",
  "OIL",
  "NATGAS",
  "SILVER",
  "COPPER",
  "WHEAT",
];
const WIDGET_CMDTY_PREFIX = ["$", "$", "$", "$", "$", "$"];

function fmtTicker(r, label, prefix = "") {
  if (!r || r.price == null)
    return { sym: label, val: "N/A", chg: "—", up: true };
  const p = r.price;
  const c = r.change || 0;
  const val =
    p >= 10000
      ? p.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : p >= 100
        ? p.toFixed(2)
        : p.toFixed(2);
  return {
    sym: label,
    val: prefix + val,
    chg: (c >= 0 ? "+" : "") + c.toFixed(2) + "%",
    up: c >= 0,
  };
}

router.get("/widgets", async (req, res) => {
  try {
    const [mktRes, cmdRes, btcRes] = await Promise.all([
      Promise.all(WIDGET_MARKET_SYMS.map((s) => getIndicatorData(s))),
      Promise.all(WIDGET_CMDTY_SYMS.map((s) => getIndicatorData(s))),
      getIndicatorData("BTC-USD"),
    ]);

    res.json({
      markets: mktRes.map((r, i) => fmtTicker(r, WIDGET_MARKET_LABELS[i])),
      commodities: cmdRes.map((r, i) =>
        fmtTicker(r, WIDGET_CMDTY_LABELS[i], WIDGET_CMDTY_PREFIX[i]),
      ),
      btc: btcRes ? { price: btcRes.price, change: btcRes.change } : null,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Widget Market]", err.message);
    res.status(500).json({ error: "Failed to fetch widget market data" });
  }
});

// CoinGecko proxy — avoids CORS + rate-limit on the browser
router.get("/crypto", async (req, res) => {
  try {
    const axios = require("axios");
    const { data } = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: 6,
          page: 1,
          sparkline: false,
        },
        timeout: 10_000,
        headers: { Accept: "application/json" },
      },
    );
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("[CoinGecko proxy]", err.message);
    // Return stale static fallback so the UI never breaks
    res.json([
      {
        id: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        current_price: null,
        price_change_percentage_24h: null,
        market_cap: null,
        image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
      },
      {
        id: "ethereum",
        symbol: "eth",
        name: "Ethereum",
        current_price: null,
        price_change_percentage_24h: null,
        market_cap: null,
        image:
          "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
      },
      {
        id: "solana",
        symbol: "sol",
        name: "Solana",
        current_price: null,
        price_change_percentage_24h: null,
        market_cap: null,
        image:
          "https://assets.coingecko.com/coins/images/4128/small/solana.png",
      },
    ]);
  }
});

router.post("/analysis", async (req, res) => {
  const { marketData } = req.body;
  try {
    const analysis = await generateMarketAnalysis(marketData);
    res.json(analysis);
  } catch (error) {
    console.error("[Market Analysis Route]", error.message);
    res.status(500).json({ error: "Analysis engine failed" });
  }
});

module.exports = router;

