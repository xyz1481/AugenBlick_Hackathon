/**
 * Market.jsx — Full market intelligence terminal
 * Data sources:
 *  - TradingView widgets: Advanced Chart, Technical Analysis, Market Overview, Economic Calendar, Ticker Tape
 *  - Yahoo Finance via backend (/api/market/war-watch): category watchlist
 *  - CoinGecko (free, no key): top 6 crypto by market cap
 *  - alternative.me (free, no key): Crypto Fear & Greed index
 *  - open.er-api.com (free, no key): Live forex rates
 */

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Activity,
  Shield,
  Zap,
  ShoppingCart,
  Globe,
  Search,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api/config";

// ─── Finnhub config ──────────────────────────────────────────────────────────────
const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_KEY || "";

// Finnhub WebSocket / REST compatible symbols (stocks + select crypto)
const FH_SYM_MAP = {
  "BTC-USD": "BINANCE:BTCUSDT",
  "ETH-USD": "BINANCE:ETHUSDT",
  LMT: "LMT",
  RTX: "RTX",
  NOC: "NOC",
  ITA: "ITA",
  NVDA: "NVDA",
  PLTR: "PLTR",
  CRWD: "CRWD",
  CIBR: "CIBR",
  MOS: "MOS",
  NTR: "NTR",
  CCJ: "CCJ",
};

/** Convert Yahoo Finance symbol → Finnhub symbol (null if unsupported) */
const toFH = (s) => {
  if (!s) return null;
  if (FH_SYM_MAP[s]) return FH_SYM_MAP[s];
  if (/^[A-Z]{1,5}$/.test(s)) return s; // plain stock tickers
  return null;
};

// ─── Yahoo Finance → TradingView symbol map ───────────────────────────────────
const TV_SYM_MAP = {
  "^GSPC": "FOREXCOM:SPXUSD",
  "^IXIC": "NASDAQ:NDX",
  "^DJI": "DJ:DJI",
  "^VIX": "CBOE:VIX",
  "DX-Y.NYB": "TVC:DXY",
  "^TNX": "TVC:US10Y",
  "GC=F": "COMEX:GC1!",
  "CL=F": "NYMEX:CL1!",
  "BZ=F": "NYMEX:BB1!",
  "NG=F": "NYMEX:NG1!",
  "ZW=F": "CBOT:ZW1!",
  "ZC=F": "CBOT:ZC1!",
  "SI=F": "COMEX:SI1!",
  "HG=F": "COMEX:HG1!",
  "BTC-USD": "BINANCE:BTCUSDT",
  "ETH-USD": "BINANCE:ETHUSDT",
  LMT: "NYSE:LMT",
  RTX: "NYSE:RTX",
  NOC: "NYSE:NOC",
  ITA: "AMEX:ITA",
  NVDA: "NASDAQ:NVDA",
  PLTR: "NYSE:PLTR",
  CRWD: "NASDAQ:CRWD",
  CIBR: "NASDAQ:CIBR",
  MOS: "NYSE:MOS",
  NTR: "NYSE:NTR",
  CCJ: "NYSE:CCJ",
};
const toTV = (s) => TV_SYM_MAP[s] || s;

const CATEGORIES = [
  { id: "macro", label: "Macro & Risk", icon: <Globe size={13} /> },
  { id: "energy", label: "Energy", icon: <Zap size={13} /> },
  { id: "defense", label: "Defense", icon: <Shield size={13} /> },
  { id: "food", label: "Food Security", icon: <ShoppingCart size={13} /> },
  { id: "tech", label: "Combat Tech", icon: <Activity size={13} /> },
];

const CENTER_TABS = ["CHART", "GLOBAL MARKETS", "ECO CALENDAR"];

const FOREX_PAIRS = [
  { label: "EUR/USD", from: "EUR", invert: false },
  { label: "GBP/USD", from: "GBP", invert: false },
  { label: "USD/JPY", from: "JPY", invert: true },
  { label: "USD/CNY", from: "CNY", invert: true },
  { label: "AUD/USD", from: "AUD", invert: false },
  { label: "USD/CHF", from: "CHF", invert: true },
  { label: "USD/INR", from: "INR", invert: true },
  { label: "USD/CAD", from: "CAD", invert: true },
];

// ─── Finnhub: WebSocket + REST + News ────────────────────────────────────────

/** Streams real-time last-trade prices from Finnhub WebSocket.
 *  symbolKey: comma-separated Yahoo Finance symbols (memoized in Market) */
function useFinnhubWS(symbolKey) {
  const [liveQuotes, setLiveQuotes] = useState({});
  const wsRef = useRef(null);

  useEffect(() => {
    if (!FINNHUB_KEY || !symbolKey) return;
    const fhSyms = symbolKey.split(",").map(toFH).filter(Boolean);
    if (fhSyms.length === 0) return;

    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_KEY}`);
    wsRef.current = ws;

    ws.onopen = () =>
      fhSyms.forEach((sym) =>
        ws.send(JSON.stringify({ type: "subscribe", symbol: sym })),
      );

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "trade" && Array.isArray(msg.data)) {
          setLiveQuotes((prev) => {
            const next = { ...prev };
            msg.data.forEach((t) => {
              next[t.s] = { price: t.p, volume: t.v, ts: t.t };
            });
            return next;
          });
        }
      } catch (e) {
        void e;
      }
    };

    ws.onerror = () => {};

    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      )
        ws.close();
    };
  }, [symbolKey]);

  return liveQuotes;
}

/** Fetches Finnhub /quote for a stock symbol → { c, d, dp, h, l, o, pc, t } */
function useFinnhubQuote(yahoosym) {
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    if (!FINNHUB_KEY || !yahoosym) return;
    const fhSym = toFH(yahoosym);
    if (!fhSym || fhSym.includes(":")) return; // skip crypto/forex
    fetch(
      `https://finnhub.io/api/v1/quote?symbol=${fhSym}&token=${FINNHUB_KEY}`,
    )
      .then((r) => r.json())
      .then((d) => {
        setQuote(d?.c ? d : null);
      })
      .catch(() => {
        setQuote(null);
      });
  }, [yahoosym]);

  return quote;
}

/** Latest company news for a ticker via Finnhub REST */
function FinnhubNews({ symbol }) {
  const [news, setNews] = useState([]);

  useEffect(() => {
    if (!FINNHUB_KEY || !symbol) return;
    const fhSym = toFH(symbol);
    if (!fhSym || fhSym.includes(":")) return;
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 7 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${fhSym}&from=${from}&to=${to}&token=${FINNHUB_KEY}`,
    )
      .then((r) => r.json())
      .then((d) => setNews(Array.isArray(d) ? d.slice(0, 5) : []))
      .catch(() => {});
  }, [symbol]);

  if (!FINNHUB_KEY || news.length === 0) return null;

  return (
    <div
      style={{
        padding: "12px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          fontWeight: 900,
          color: "#5a7a9a",
          letterSpacing: "0.1em",
          marginBottom: 8,
        }}
      >
        COMPANY NEWS <span style={{ color: "#f59e0b" }}>● FINNHUB</span>
      </div>
      {news.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          style={{ display: "block", marginBottom: 10, textDecoration: "none" }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#b0c8d8",
              lineHeight: 1.5,
              marginBottom: 2,
            }}
          >
            {item.headline?.slice(0, 90)}
            {(item.headline?.length ?? 0) > 90 ? "…" : ""}
          </div>
          <div style={{ fontSize: "8px", color: "#3a5a7a" }}>
            {item.source} ·{" "}
            {new Date(item.datetime * 1000).toLocaleDateString()}
          </div>
        </a>
      ))}
    </div>
  );
}

// ─── TradingView helpers ──────────────────────────────────────────────────────
function useTVWidget(src, config, deps = []) {
  const ref = useRef();
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Clear previous content
    node.innerHTML = "";
    // TradingView requires an inner widget div to render into
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    node.appendChild(inner);
    // Script content must use textContent (not innerHTML) for <script> tags
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.type = "text/javascript";
    s.textContent = JSON.stringify(config);
    node.appendChild(s);
    return () => {
      node.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

// ─── TradingView: Ticker Tape ─────────────────────────────────────────────────
function TVTickerTape() {
  const ref = useTVWidget(
    "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js",
    {
      symbols: [
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
        { proName: "NASDAQ:NDX", title: "Nasdaq 100" },
        { proName: "DJ:DJI", title: "Dow Jones" },
        { proName: "CBOE:VIX", title: "VIX" },
        { proName: "TVC:DXY", title: "USD Index" },
        { proName: "TVC:US10Y", title: "10Y Yield" },
        { proName: "COMEX:GC1!", title: "Gold" },
        { proName: "NYMEX:CL1!", title: "WTI Oil" },
        { proName: "NYMEX:NG1!", title: "Nat Gas" },
        { proName: "COMEX:SI1!", title: "Silver" },
        { proName: "CBOT:ZW1!", title: "Wheat" },
        { proName: "BINANCE:BTCUSDT", title: "Bitcoin" },
        { proName: "BINANCE:ETHUSDT", title: "Ethereum" },
        { proName: "BINANCE:SOLUSDT", title: "Solana" },
        { proName: "FX:EURUSD", title: "EUR/USD" },
        { proName: "FX:USDJPY", title: "USD/JPY" },
        { proName: "FX:GBPUSD", title: "GBP/USD" },
        { proName: "FX:USDCNH", title: "USD/CNH" },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "compact",
      colorTheme: "dark",
      locale: "en",
    },
    [],
  );
  return (
    <div
      ref={ref}
      className="tradingview-widget-container"
      style={{ width: "100%" }}
    />
  );
}

// ─── TradingView: Advanced Chart ─────────────────────────────────────────────
function TVAdvancedChart({ tvSymbol }) {
  const ref = useTVWidget(
    "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
    {
      autosize: true,
      symbol: tvSymbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      backgroundColor: "rgba(6,10,20,1)",
      gridColor: "rgba(30,45,74,0.4)",
      studies: ["STD;RSI", "STD;MACD"],
    },
    [tvSymbol],
  );
  return (
    <div
      ref={ref}
      className="tradingview-widget-container"
      style={{ height: "100%", width: "100%" }}
    />
  );
}

// ─── TradingView: Technical Analysis ─────────────────────────────────────────
function TVTechnicalAnalysis({ tvSymbol }) {
  const ref = useTVWidget(
    "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
    {
      interval: "1D",
      width: "100%",
      isTransparent: true,
      height: 290,
      symbol: tvSymbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale: "en",
      colorTheme: "dark",
    },
    [tvSymbol],
  );
  return (
    <div
      ref={ref}
      className="tradingview-widget-container"
      style={{ width: "100%", minHeight: 290 }}
    />
  );
}

// ─── TradingView: Market Overview ─────────────────────────────────────────────
function TVMarketOverview() {
  const ref = useTVWidget(
    "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js",
    {
      colorTheme: "dark",
      dateRange: "3M",
      showChart: true,
      locale: "en",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: "100%",
      height: "100%",
      tabs: [
        {
          title: "Indices",
          originalTitle: "Indices",
          symbols: [
            { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
            { s: "NASDAQ:NDX", d: "Nasdaq 100" },
            { s: "DJ:DJI", d: "Dow Jones" },
            { s: "INDEX:DAX", d: "DAX" },
            { s: "INDEX:FTSE", d: "FTSE 100" },
            { s: "INDEX:NI225", d: "Nikkei 225" },
            { s: "INDEX:HSI", d: "Hang Seng" },
            { s: "BSE:SENSEX", d: "Sensex" },
          ],
        },
        {
          title: "Commodities",
          originalTitle: "Commodities",
          symbols: [
            { s: "COMEX:GC1!", d: "Gold" },
            { s: "NYMEX:CL1!", d: "WTI Oil" },
            { s: "NYMEX:BB1!", d: "Brent" },
            { s: "NYMEX:NG1!", d: "Natural Gas" },
            { s: "COMEX:SI1!", d: "Silver" },
            { s: "COMEX:HG1!", d: "Copper" },
            { s: "CBOT:ZW1!", d: "Wheat" },
            { s: "CBOT:ZC1!", d: "Corn" },
          ],
        },
        {
          title: "Crypto",
          originalTitle: "Crypto",
          symbols: [
            { s: "BINANCE:BTCUSDT", d: "Bitcoin" },
            { s: "BINANCE:ETHUSDT", d: "Ethereum" },
            { s: "BINANCE:SOLUSDT", d: "Solana" },
            { s: "BINANCE:XRPUSDT", d: "XRP" },
            { s: "BINANCE:BNBUSDT", d: "BNB" },
            { s: "BINANCE:ADAUSDT", d: "Cardano" },
          ],
        },
        {
          title: "Forex",
          originalTitle: "Forex",
          symbols: [
            { s: "FX:EURUSD", d: "EUR/USD" },
            { s: "FX:GBPUSD", d: "GBP/USD" },
            { s: "FX:USDJPY", d: "USD/JPY" },
            { s: "FX:USDCNH", d: "USD/CNH" },
            { s: "FX:USDCHF", d: "USD/CHF" },
            { s: "FX:AUDUSD", d: "AUD/USD" },
            { s: "FX:USDCAD", d: "USD/CAD" },
            { s: "TVC:DXY", d: "DXY" },
          ],
        },
      ],
    },
    [],
  );
  return (
    <div
      ref={ref}
      className="tradingview-widget-container"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

// ─── TradingView: Economic Calendar ──────────────────────────────────────────
function TVEconomicCalendar() {
  const ref = useTVWidget(
    "https://s3.tradingview.com/external-embedding/embed-widget-events.js",
    {
      colorTheme: "dark",
      isTransparent: true,
      locale: "en",
      width: "100%",
      height: "100%",
      importanceFilter: "0,1",
      countryFilter: "us,eu,gb,jp,cn,au,ca,ch",
    },
    [],
  );
  return (
    <div
      ref={ref}
      className="tradingview-widget-container"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

// ─── Fear & Greed Gauge ───────────────────────────────────────────────────────
function FearGreedGauge({ value, label }) {
  if (value === null || value === undefined) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "18px 0",
          color: "#3a5a7a",
          fontSize: "10px",
        }}
      >
        Loading Fear &amp; Greed…
      </div>
    );
  }
  const v = Math.max(0, Math.min(100, value));
  const getColor = (n) =>
    n < 25
      ? "#e74c3c"
      : n < 45
        ? "#e67e22"
        : n < 55
          ? "#f1c40f"
          : n < 75
            ? "#2ecc71"
            : "#27ae60";
  const color = getColor(v);
  const angleDeg = (v / 100) * 180 - 90;
  const rad = (angleDeg * Math.PI) / 180;
  const nx = (50 + 36 * Math.sin(rad)).toFixed(1);
  const ny = (55 - 36 * Math.cos(rad)).toFixed(1);

  const zones = [
    ["#e74c3c", 0, 25],
    ["#e67e22", 25, 45],
    ["#f1c40f", 45, 55],
    ["#2ecc71", 55, 75],
    ["#27ae60", 75, 100],
  ];

  return (
    <div style={{ textAlign: "center", padding: "6px 0 4px" }}>
      <div
        style={{
          fontSize: "8px",
          fontWeight: 900,
          color: "#5a7a9a",
          letterSpacing: "0.1em",
          marginBottom: 4,
        }}
      >
        FEAR &amp; GREED INDEX
      </div>
      <svg
        viewBox="0 0 100 68"
        style={{
          width: "100%",
          maxWidth: 160,
          margin: "0 auto",
          display: "block",
        }}
      >
        {/* Track */}
        <path
          d="M 8 56 A 42 42 0 0 1 92 56"
          fill="none"
          stroke="#1e2d4a"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Colored zones */}
        {zones.map(([c, lo, hi]) => {
          const a1 = ((lo / 100) * 180 - 90) * (Math.PI / 180);
          const a2 = ((hi / 100) * 180 - 90) * (Math.PI / 180);
          const x1 = (50 + 42 * Math.sin(a1)).toFixed(1),
            y1 = (56 - 42 * Math.cos(a1)).toFixed(1);
          const x2 = (50 + 42 * Math.sin(a2)).toFixed(1),
            y2 = (56 - 42 * Math.cos(a2)).toFixed(1);
          return (
            <path
              key={c}
              d={`M ${x1} ${y1} A 42 42 0 0 1 ${x2} ${y2}`}
              fill="none"
              stroke={c}
              strokeWidth="7"
              opacity="0.4"
            />
          );
        })}
        {/* Needle */}
        <line
          x1="50"
          y1="56"
          x2={nx}
          y2={ny}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="50" cy="56" r="3.5" fill={color} />
        {/* Value text */}
        <text
          x="50"
          y="74"
          textAnchor="middle"
          fill={color}
          fontSize="14"
          fontWeight="900"
        >
          {v}
        </text>
      </svg>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 900,
          color,
          letterSpacing: "0.08em",
          marginTop: -6,
        }}
      >
        {label?.toUpperCase() || ""}
      </div>
    </div>
  );
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────
function StatBox({ label, value, color = "#fff" }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        padding: "5px 7px",
        borderRadius: 5,
      }}
    >
      <div
        style={{
          fontSize: "8px",
          color: "#5a7a9a",
          fontWeight: 900,
          letterSpacing: "0.08em",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 800,
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

// ─── Main Market Component ─────────────────────────────────────────────────────
const Market = () => {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("macro");
  const [marketData, setMarketData] = useState({});
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [centerTab, setCenterTab] = useState("CHART");

  const [fearGreed, setFearGreed] = useState({ value: null, label: "" });
  const [forexRates, setForexRates] = useState(null);
  const [crypto, setCrypto] = useState([]);

  // ── Backend: Yahoo Finance war-watch ─────────────────────────────────────
  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/market/war-watch`);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      setMarketData(data);
      setSelectedTicker((prev) => prev ?? (data.macro?.[0] || null));
    } catch (err) {
      console.error("[Market] war-watch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── alternative.me: Fear & Greed ─────────────────────────────────────────
  useEffect(() => {
    fetch("https://api.alternative.me/fng/?limit=1")
      .then((r) => r.json())
      .then((d) =>
        setFearGreed({
          value: +d.data[0].value,
          label: d.data[0].value_classification,
        }),
      )
      .catch(() => setFearGreed({ value: 42, label: "Fear" }));
  }, []);

  // ── open.er-api.com: Forex rates ─────────────────────────────────────────
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((d) => setForexRates(d.rates))
      .catch(() => {});
  }, []);

  // ── CoinGecko: Top 6 crypto ───────────────────────────────────────────────
  useEffect(() => {
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets" +
        "?vs_currency=usd&order=market_cap_desc&per_page=6&page=1&sparkline=false",
    )
      .then((r) => r.json())
      .then((d) => setCrypto(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMarketData();
    const t = setInterval(fetchMarketData, 60_000);
    return () => clearInterval(t);
  }, [fetchMarketData]);

  const filteredAssets = useMemo(() => {
    const assets = marketData[activeCategory] || [];
    if (!searchQuery) return assets;
    const q = searchQuery.toLowerCase();
    return assets.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.raw?.symbol?.toLowerCase().includes(q),
    );
  }, [marketData, activeCategory, searchQuery]);

  const sel = selectedTicker;
  const selSym = sel?.raw?.symbol;
  const tvSym = selSym ? toTV(selSym) : null;

  // ── Finnhub: WebSocket live prices + REST OHLC quote ─────────────────────
  const watchlistSymKey = useMemo(
    () =>
      Object.values(marketData)
        .flat()
        .map((a) => a.raw?.symbol)
        .filter(Boolean)
        .join(","),
    [marketData],
  );
  const liveQuotes = useFinnhubWS(watchlistSymKey);
  const fhQuote = useFinnhubQuote(selSym);

  if (loading && Object.keys(marketData).length === 0) {
    return (
      <div
        style={{
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#060a14",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 900,
            letterSpacing: "4px",
            color: "#6366f1",
            marginBottom: 12,
          }}
        >
          CONNECTING TO TERMINAL
        </div>
        <div
          style={{ fontSize: "9px", color: "#5a7a9a", letterSpacing: "2px" }}
        >
          Syncing Market Intelligence…
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#060a14",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {/* ── TOP BAR ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 34,
          background: "#0d111d",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 8px",
          flexShrink: 0,
          gap: 6,
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            paddingRight: 10,
            borderRight: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <BarChart3 size={15} color="#6366f1" />
          <span
            style={{ fontWeight: 900, letterSpacing: "1px", fontSize: "12px" }}
          >
            MARKET TERMINAL
          </span>
        </div>

        {/* Category tabs */}
        <div style={{ display: "flex", gap: 3 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              style={{
                background:
                  activeCategory === c.id
                    ? "rgba(99,102,241,0.12)"
                    : "transparent",
                color: activeCategory === c.id ? "#6366f1" : "#5a7a9a",
                border: "none",
                padding: "3px 8px",
                borderRadius: 5,
                fontSize: "10px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 6,
            padding: "0 10px",
            height: 30,
          }}
        >
          <Search size={12} color="#5a7a9a" />
          <input
            placeholder="Search ticker…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: "11px",
              paddingLeft: 8,
              width: 130,
            }}
          />
        </div>

        <button
          onClick={fetchMarketData}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#5a7a9a",
            borderRadius: 4,
            padding: "4px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "10px",
            fontWeight: 800,
          }}
        >
          <RefreshCw size={11} /> SYNC
        </button>
      </div>

      {/* ── TICKER TAPE ───────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#08101f",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          flexShrink: 0,
          height: 30,
          overflow: "hidden",
        }}
      >
        <TVTickerTape />
      </div>

      {/* ── MAIN WORKSPACE ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ═══ LEFT: WATCHLIST ══════════════════════════════════════════════ */}
        <div
          style={{
            width: 210,
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            background: "#0a0e17",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "5px 8px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 900,
                color: "#5a7a9a",
                letterSpacing: "1px",
              }}
            >
              WATCHLIST
            </span>
            <span style={{ fontSize: "9px", color: "#6366f1" }}>
              {filteredAssets.length} ASSETS
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "2px 4px" }}>
            {filteredAssets.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "#3a5a7a",
                  fontSize: "10px",
                }}
              >
                No assets
              </div>
            )}
            {filteredAssets.map((ticker, i) => {
              const isSel = selSym === ticker.raw?.symbol;
              const fhSym = toFH(ticker.raw?.symbol);
              const liveQ = fhSym ? liveQuotes[fhSym] : null;
              const displayPrice = liveQ?.price ?? ticker.price;
              const up = (ticker.change ?? 0) >= 0;
              return (
                <div
                  key={`${ticker.raw?.symbol}-${i}`}
                  onClick={() => setSelectedTicker(ticker)}
                  style={{
                    padding: "5px 8px",
                    borderRadius: 5,
                    marginBottom: 1,
                    cursor: "pointer",
                    background: isSel ? "rgba(99,102,241,0.1)" : "transparent",
                    border: `1px solid ${isSel ? "rgba(99,102,241,0.25)" : "transparent"}` ,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#fff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {ticker.name}
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          color: "#5a7a9a",
                          fontWeight: 700,
                          marginTop: 1,
                        }}
                      >
                        {ticker.raw?.symbol}
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        flexShrink: 0,
                        paddingLeft: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          fontVariantNumeric: "tabular-nums",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        {displayPrice?.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                        {liveQ && (
                          <span
                            style={{
                              fontSize: "7px",
                              color: "#f59e0b",
                              lineHeight: 1,
                            }}
                            title="Finnhub real-time"
                          >
                            ●
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: 800,
                          color: up ? "#10b981" : "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 2,
                          marginTop: 1,
                        }}
                      >
                        {up ? (
                          <ArrowUpRight size={9} />
                        ) : (
                          <ArrowDownRight size={9} />
                        )}
                        {ticker.change >= 0 ? "+" : ""}
                        {ticker.change?.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fear & Greed */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "4px 8px 6px",
              background: "#070911",
            }}
          >
            <FearGreedGauge value={fearGreed.value} label={fearGreed.label} />
          </div>
        </div>

        {/* ═══ CENTER: CHART / OVERVIEW / CALENDAR ══════════════════════════ */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#060a14",
            minWidth: 0,
          }}
        >
          {/* Asset info + tabs */}
          <div
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "#0a0e17",
              flexShrink: 0,
            }}
          >
            {/* Asset header */}
            {sel && (
              <div
                style={{
                  padding: "4px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 900 }}>
                    {selSym}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#5a7a9a",
                      marginLeft: 6,
                    }}
                  >
                    {sel.name}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    borderLeft: "1px solid rgba(255,255,255,0.08)",
                    paddingLeft: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "8px",
                        color: "#5a7a9a",
                        fontWeight: 900,
                      }}
                    >
                      PRICE
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        fontVariantNumeric: "tabular-nums",
                        color: (sel.change ?? 0) >= 0 ? "#10b981" : "#ef4444",
                      }}
                    >
                      {sel.price?.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "8px",
                        color: "#5a7a9a",
                        fontWeight: 900,
                      }}
                    >
                      CHG%
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: (sel.change ?? 0) >= 0 ? "#10b981" : "#ef4444",
                      }}
                    >
                      {sel.change >= 0 ? "+" : ""}
                      {sel.change?.toFixed(2)}%
                    </div>
                  </div>
                  {sel.raw?.regularMarketVolume != null && (
                    <div>
                      <div
                        style={{
                          fontSize: "8px",
                          color: "#5a7a9a",
                          fontWeight: 900,
                        }}
                      >
                        VOLUME
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 800 }}>
                        {(sel.raw.regularMarketVolume / 1_000_000).toFixed(1)}M
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }} />
                {tvSym && (
                  <a
                    href={`https://www.tradingview.com/symbols/${tvSym}/`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "9px",
                      color: "#6366f1",
                      textDecoration: "none",
                      border: "1px solid rgba(99,102,241,0.3)",
                      padding: "3px 10px",
                      borderRadius: 4,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    OPEN IN TV ↗
                  </a>
                )}
              </div>
            )}

            {/* Tab bar */}
            <div style={{ display: "flex", gap: 2, padding: "3px 8px" }}>
              {CENTER_TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setCenterTab(t)}
                  style={{
                    background:
                      centerTab === t ? "rgba(99,102,241,0.15)" : "transparent",
                    color: centerTab === t ? "#6366f1" : "#5a7a9a",
                    border: "none",
                    padding: "2px 10px",
                    borderRadius: 4,
                    fontSize: "9px",
                    fontWeight: 900,
                    cursor: "pointer",
                    letterSpacing: "0.06em",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            {centerTab === "CHART" && tvSym && (
              <TVAdvancedChart tvSymbol={tvSym} />
            )}
            {centerTab === "CHART" && !tvSym && (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3a5a7a",
                  fontSize: "11px",
                }}
              >
                Select a ticker from the watchlist
              </div>
            )}
            {centerTab === "GLOBAL MARKETS" && <TVMarketOverview />}
            {centerTab === "ECO CALENDAR" && <TVEconomicCalendar />}
          </div>
        </div>

        {/* ═══ RIGHT: ANALYSIS PANEL ════════════════════════════════════════ */}
        <div
          style={{
            width: 260,
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            background: "#0d111d",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {/* TradingView Technical Analysis */}
          {tvSym && (
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div
                style={{
                  padding: "5px 8px 0",
                  fontSize: "8px",
                  fontWeight: 900,
                  color: "#5a7a9a",
                  letterSpacing: "0.1em",
                }}
              >
                TECHNICAL ANALYSIS
              </div>
              <TVTechnicalAnalysis tvSymbol={tvSym} />
            </div>
          )}

          {/* Asset Stats */}
          {sel && (
            <div
              style={{
                padding: "6px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: 900,
                  color: "#5a7a9a",
                  letterSpacing: "0.1em",
                  marginBottom: 5,
                }}
              >
                ASSET STATS
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 7,
                }}
              >
                <StatBox
                  label="52W HIGH"
                  value={
                    sel.raw?.fiftyTwoWeekHigh != null
                      ? "$" + sel.raw.fiftyTwoWeekHigh.toFixed(2)
                      : "—"
                  }
                  color="#10b981"
                />
                <StatBox
                  label="52W LOW"
                  value={
                    sel.raw?.fiftyTwoWeekLow != null
                      ? "$" + sel.raw.fiftyTwoWeekLow.toFixed(2)
                      : "—"
                  }
                  color="#ef4444"
                />
                <StatBox
                  label="MKT CAP"
                  value={
                    sel.raw?.marketCap != null
                      ? "$" + (sel.raw.marketCap / 1e9).toFixed(1) + "B"
                      : "—"
                  }
                />
                <StatBox
                  label="P/E"
                  value={
                    sel.raw?.trailingPE != null
                      ? sel.raw.trailingPE.toFixed(1)
                      : "—"
                  }
                />
                <StatBox
                  label="AVG VOL"
                  value={
                    sel.raw?.averageVolume != null
                      ? (sel.raw.averageVolume / 1e6).toFixed(1) + "M"
                      : "—"
                  }
                />
                <StatBox
                  label="BETA"
                  value={sel.raw?.beta != null ? sel.raw.beta.toFixed(2) : "—"}
                />
              </div>
              {/* Finnhub OHLC — open · day high/low · prev close */}
              {fhQuote && (
                <div
                  style={{
                    marginTop: 7,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 7,
                  }}
                >
                  <StatBox label="OPEN" value={`$${fhQuote.o?.toFixed(2)}`} />
                  <StatBox
                    label="PREV CLOSE"
                    value={`$${fhQuote.pc?.toFixed(2)}`}
                  />
                  <StatBox
                    label="DAY HIGH"
                    value={`$${fhQuote.h?.toFixed(2)}`}
                    color="#10b981"
                  />
                  <StatBox
                    label="DAY LOW"
                    value={`$${fhQuote.l?.toFixed(2)}`}
                    color="#ef4444"
                  />
                </div>
              )}
            </div>
          )}

          {/* Geopolitical risk + Narrative CTA */}
          {sel && (
            <div
              style={{
                padding: "6px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 900,
                  color: "#ef4444",
                  letterSpacing: "0.1em",
                  marginBottom: 7,
                }}
              >
                GEOPOLITICAL RISK
              </div>
              <div
                style={{
                  background: "rgba(231,76,60,0.06)",
                  borderLeft: "3px solid #ef4444",
                  padding: "9px 11px",
                  borderRadius: 4,
                  fontSize: "10px",
                  color: "#b0c8d8",
                  lineHeight: 1.6,
                  marginBottom: 10,
                }}
              >
                <strong style={{ color: "#ef4444" }}>{selSym}</strong> shows
                elevated sensitivity to supply corridor disruptions.
                Intelligence models flag heightened volatility probability over
                the next 72h.
              </div>
              <button
                onClick={() =>
                  navigate(
                    `/narrative?topic=${encodeURIComponent(sel?.name || "")}&symbol=${selSym}`,
                  )
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 6,
                  border: "none",
                  background: "#6366f1",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                DEEP NARRATIVE SCAN ↗
              </button>
            </div>
          )}

          {/* Finnhub: Company news for selected ticker */}
          <FinnhubNews symbol={selSym} />

          {/* Top Crypto (CoinGecko) */}
          {crypto.length > 0 && (
            <div
              style={{
                padding: "6px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 900,
                  color: "#5a7a9a",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
              >
                TOP CRYPTO <span style={{ color: "#2ecc71" }}>● LIVE</span>
              </div>
              {crypto.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 7,
                  }}
                >
                  <img
                    src={c.image}
                    alt={c.symbol}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#fff",
                      width: 36,
                    }}
                  >
                    {c.symbol?.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#7a9ab8",
                      flex: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    $
                    {c.current_price?.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      color:
                        (c.price_change_percentage_24h ?? 0) >= 0
                          ? "#10b981"
                          : "#ef4444",
                      flexShrink: 0,
                    }}
                  >
                    {(c.price_change_percentage_24h ?? 0) >= 0 ? "+" : ""}
                    {c.price_change_percentage_24h?.toFixed(2)}%
                  </span>
                  <span
                    style={{ fontSize: "8px", color: "#3a5a7a", flexShrink: 0 }}
                  >
                    ${(c.market_cap / 1e9).toFixed(0)}B
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Forex rates (ExchangeRate API) */}
          {forexRates && (
            <div
              style={{
                padding: "6px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 900,
                  color: "#5a7a9a",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
              >
                FOREX RATES <span style={{ color: "#2ecc71" }}>● LIVE</span>
              </div>
              {FOREX_PAIRS.map(({ label, from, invert }) => {
                const rate = forexRates[from];
                if (!rate) return null;
                const decimals =
                  from === "JPY" || from === "INR" || from === "CNY" ? 2 : 4;
                const display = invert
                  ? rate.toFixed(decimals)
                  : (1 / rate).toFixed(decimals);
                return (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#7a9ab8",
                        fontWeight: 700,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        color: "#fff",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {display}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Data sources */}
          <div style={{ padding: "5px 8px", marginTop: "auto" }}>
            <div style={{ fontSize: "8px", color: "#2a4060", lineHeight: 1.9 }}>
              <div>● TradingView — Chart · Technicals · Calendar · Tape</div>
              <div>● Yahoo Finance (backend) — Watchlist prices</div>
              <div>● Finnhub — Live WS prices · OHLC · Company news</div>
              <div>● CoinGecko API — Crypto market caps</div>
              <div>● alternative.me — Fear &amp; Greed index</div>
              <div>● open.er-api.com — Forex exchange rates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Market;
