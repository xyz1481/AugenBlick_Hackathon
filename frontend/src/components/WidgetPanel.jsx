/**
 * WidgetPanel.jsx
 * Standalone scrollable bottom widget panel for the Reality dashboard.
 * Shows category-aware widgets for CONFLICT (WORLD), FINANCE, and COMMODITIES modes.
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Globe as GlobeIcon, AlertTriangle } from "lucide-react";
import GLOBAL_INTEL from "../data/globalIntel.json";
import API_BASE_URL from "../api/config";
import { CurrencyCard } from "./CurrencyCard";

// ─── STATIC FALLBACKS (shown while real data loads) ───────────────────────────

const MARKET_TICKERS = [
  { sym: "SPX", val: "5,487", chg: "+0.82%", up: true },
  { sym: "NDX", val: "19,341", chg: "+1.14%", up: true },
  { sym: "DJI", val: "39,118", chg: "+0.43%", up: true },
  { sym: "VIX", val: "14.22", chg: "-2.10%", up: false },
  { sym: "DXY", val: "104.8", chg: "-0.31%", up: false },
  { sym: "TNX", val: "4.41%", chg: "+0.05", up: true },
];

const COMMODITY_TICKERS = [
  { sym: "GOLD", val: "$2,341", chg: "+0.74%", up: true },
  { sym: "OIL", val: "$83.14", chg: "+1.22%", up: true },
  { sym: "NATGAS", val: "$2.71", chg: "-0.88%", up: false },
  { sym: "SILVER", val: "$29.42", chg: "+0.55%", up: true },
  { sym: "COPPER", val: "$4.57", chg: "-0.31%", up: false },
  { sym: "WHEAT", val: "$521", chg: "+1.04%", up: true },
];

const INSTABILITY_BASE = [
  { country: "SUDAN", base: 88, max: 99 },
  { country: "MYANMAR", base: 82, max: 96 },
  { country: "HAITI", base: 76, max: 90 },
  { country: "UKRAINE", base: 72, max: 88 },
  { country: "SOMALIA", base: 68, max: 84 },
  { country: "SYRIA", base: 64, max: 80 },
];

function computeInstability(newsFeed) {
  const counts = {};
  newsFeed.forEach((n) => {
    const txt = ((n.text || "") + " " + (n.country || "")).toLowerCase();
    INSTABILITY_BASE.forEach(({ country }) => {
      if (txt.includes(country.toLowerCase()))
        counts[country] = (counts[country] || 0) + 1;
    });
  });
  return INSTABILITY_BASE.map(({ country, base, max }) => {
    const score = Math.min(max, base + (counts[country] || 0) * 2);
    return {
      country,
      score,
      color: score > 85 ? "#e74c3c" : score > 72 ? "#e67e22" : "#f1c40f",
    };
  }).sort((a, b) => b.score - a.score);
}

const INTEL_TAG_MAP = {
  missile: "SIGINT",
  nuclear: "SIGINT",
  military: "OSINT",
  economic: "HUMINT",
  political: "CYBER",
};
const INTEL_COLOR_MAP = {
  SIGINT: "#e74c3c",
  OSINT: "#3498db",
  HUMINT: "#9b59b6",
  CYBER: "#f1c40f",
};
const SEEDED_INTEL = GLOBAL_INTEL.filter((e) =>
  ["missile", "nuclear", "military"].includes(e.type),
)
  .slice(0, 40)
  .sort(() => 0.5 - Math.random())
  .slice(0, 6)
  .map((e) => {
    const tag = INTEL_TAG_MAP[e.type] || "OSINT";
    return {
      time: new Date(e.date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      tag,
      text: e.news,
      color: INTEL_COLOR_MAP[tag],
      country: e.country,
    };
  });

const STRATEGIC_RISKS = [
  { label: "STRAIT OF HORMUZ", level: "CRITICAL", color: "#e74c3c" },
  { label: "SOUTH CHINA SEA", level: "HIGH", color: "#e67e22" },
  { label: "TAIWAN STRAIT", level: "HIGH", color: "#e67e22" },
  { label: "RED SEA CORRIDOR", level: "ELEVATED", color: "#f1c40f" },
  { label: "BLACK SEA", level: "ELEVATED", color: "#f1c40f" },
];

const INFRA_CASCADE = [
  { system: "POWER GRID — UKRAINE", status: "DEGRADED", pct: 34, color: "#e74c3c" },
  { system: "INTERNET — MYANMAR", status: "DISRUPTED", pct: 21, color: "#e74c3c" },
  { system: "WATER — GAZA", status: "CRITICAL", pct: 8, color: "#e74c3c" },
  { system: "RAIL — SUDAN", status: "PARTIAL", pct: 55, color: "#e67e22" },
];

const WORLD_CLOCKS = [
  { city: "NEW YORK", tz: "America/New_York" },
  { city: "LONDON", tz: "Europe/London" },
  { city: "MOSCOW", tz: "Europe/Moscow" },
  { city: "BEIJING", tz: "Asia/Shanghai" },
  { city: "DUBAI", tz: "Asia/Dubai" },
  { city: "TOKYO", tz: "Asia/Tokyo" },
];

const BTC_ETF = [
  { name: "IBIT", val: "$38.42", aum: "$17.2B", chg: "+1.4%", up: true },
  { name: "FBTC", val: "$61.88", aum: "$9.8B", chg: "+1.2%", up: true },
  { name: "GBTC", val: "$57.14", aum: "$19.1B", chg: "-0.3%", up: false },
];

const STABLECOINS = [
  { name: "USDT", peg: "$1.0001", mcap: "$112B", status: "STABLE" },
  { name: "USDC", peg: "$0.9998", mcap: "$33B", status: "STABLE" },
  { name: "DAI", peg: "$1.0003", mcap: "$5.2B", status: "STABLE" },
];

const TRADE_ROUTES = [
  { route: "SUEZ CANAL", vol: "12% global trade", risk: "HIGH", color: "#e74c3c" },
  { route: "STRAIT OF MALACCA", vol: "25% oil transit", risk: "MED", color: "#f1c40f" },
  { route: "PANAMA CANAL", vol: "6% global trade", risk: "LOW", color: "#2ecc71" },
  { route: "STRAIT OF HORMUZ", vol: "20% oil transit", risk: "CRIT", color: "#e74c3c" },
  { route: "BOSPHORUS", vol: "3% global trade", risk: "MED", color: "#f1c40f" },
];

const SUPPLY_CHAINS = [
  { sector: "SEMICONDUCTORS", disruption: 72, note: "Taiwan risk factor" },
  { sector: "RARE EARTHS", disruption: 88, note: "China export controls" },
  { sector: "GRAIN / WHEAT", disruption: 61, note: "Black Sea tensions" },
  { sector: "OIL & GAS", disruption: 54, note: "Red Sea rerouting" },
  { sector: "SHIPPING CONTAINERS", disruption: 45, note: "Port congestion" },
];

const PIPELINES = [
  { name: "NORDSTREAM ALT.", status: "OFFLINE", from: "Russia", to: "Germany", flow: 0 },
  { name: "TURK STREAM", status: "ACTIVE", from: "Russia", to: "Turkey", flow: 87 },
  { name: "DRUZHBA", status: "PARTIAL", from: "Russia", to: "EU", flow: 42 },
  { name: "BTC PIPELINE", status: "ACTIVE", from: "Azerbaijan", to: "Turkey", flow: 94 },
  { name: "SUMED PIPELINE", status: "ACTIVE", from: "Saudi Arabia", to: "Egypt", flow: 78 },
];

const LIVE_CHANNELS = [
  { label: "AL JAZEERA", region: "GLOBAL", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCNye-wNBqNL5ZzHSJj3l8Bg&autoplay=1&mute=1" },
  { label: "DW NEWS", region: "EUROPE", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCknLrEdhRCp1aegoMqRaCZg&autoplay=1&mute=1" },
  { label: "FRANCE 24", region: "MIDEAST", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCQfwfsi5VrQ8yKZ-UGuIB8w&autoplay=1&mute=1" },
  { label: "SKY NEWS", region: "UK", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCHaHIX0f5-tFE8v2YRBLRJQ&autoplay=1&mute=1" },
  { label: "WION", region: "ASIA", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCkDZ4HjEI5UCHM0VBYgY9NA&autoplay=1&mute=1" },
  { label: "BLOOMBERG", region: "FINANCE", embedUrl: "https://www.youtube.com/embed/live_stream?channel=UCIALMKvObZNtJ6AmdCLP7Lg&autoplay=1&mute=1" },
];

const TRADE_POLICY_ITEMS = [
  { event: "US tariffs on Chinese EVs raised to 100%", date: "Jun 2024", impact: "HIGH" },
  { event: "EU carbon border adjustment mechanism active", date: "Oct 2023", impact: "MED" },
  { event: "India wheat export ban extended", date: "May 2024", impact: "MED" },
  { event: "ASEAN-GCC FTA negotiations restart", date: "Apr 2024", impact: "LOW" },
];

const WIDGETS_BY_MODE = {
  CONFLICT: [
    "liveNews",
    "currency",
    "webcams",
    "instability",
    "strategicRisk",
    "intel",
    "infra",
    "markets",
    "commodities",
    "clock",
    "tradeRoutes",
  ],
  FINANCE: [
    "markets",
    "commodities",
    "econIndicators",
    "tradePolicy",
    "btcEtf",
    "stablecoins",
    "currency",
  ],
  COMMODITIES: [
    "tradeRoutes",
    "supplyChains",
    "pipelines",
    "commodities",
    "markets",
    "infra",
    "tradePolicy",
  ],
};

function PanelCard({ title, badge, badgeColor, children, width = 340, live = false }) {
  return (
    <div style={{ width, minWidth: width, background: "#05090f", border: "1px solid #1e2d4a", borderRadius: "8px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ height: "36px", padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e2d4a", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {live && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "livePulse 1.5s infinite" }} />}
          <span style={{ fontSize: "10px", fontWeight: 900, color: "#fff", letterSpacing: "0.08em" }}>{title}</span>
          {badge != null && <span style={{ fontSize: "10px", color: badgeColor || "#e74c3c", fontWeight: 800 }}>{badge}</span>}
        </div>
        {live && <span style={{ fontSize: "9px", background: "#1e2d4a", color: "#2ecc71", padding: "1px 6px", borderRadius: "4px", fontWeight: 900 }}>LIVE</span>}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>{children}</div>
    </div>
  );
}

function LiveNewsCard({ newsFeed }) {
  return (
    <PanelCard title="LIVE NEWS" badge={newsFeed.length || 0} badgeColor="#e74c3c" width={400} live>
      {newsFeed.slice(0, 8).map((n, i, arr) => (
        <a key={i} href={n.link && n.link !== "#" ? n.link : undefined} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginBottom: "10px", paddingBottom: "10px", borderBottom: i < arr.length - 1 ? "1px solid #1e2d4a" : "none", textDecoration: "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ fontSize: "10px", color: "#5a7a9a" }}>{n.ago}</span>
            <span style={{ fontSize: "11px", color: "#3498db" }}>{n.source}</span>
          </div>
          <div style={{ fontSize: "13px", color: "#d0e4ff", fontWeight: 700, lineHeight: "1.5" }}>{n.text}</div>
          {n.country && <div style={{ fontSize: "10px", color: "#5a7a9a", marginTop: "4px" }}>{n.country}</div>}
        </a>
      ))}
    </PanelCard>
  );
}

function WebcamsCard() {
  const [active, setActive] = useState(0);
  return (
    <div style={{ width: 520, minWidth: 520, background: "#05090f", border: "1px solid #1e2d4a", borderRadius: "8px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      {/* ... simplified ... */}
      <div style={{ height: "36px", padding: "0 14px", display: "flex", alignItems: "center", borderBottom: "1px solid #1e2d4a" }}>
         <span style={{ fontSize: "10px", fontWeight: 900, color: "#fff" }}>LIVE BROADCAST</span>
      </div>
      <iframe src={LIVE_CHANNELS[active].embedUrl} style={{ width: "100%", height: "200px", border: "none" }} />
    </div>
  );
}

function CurrencyWidget() { return <PanelCard title="LIVE CURRENCY RATES" width={380} live><CurrencyCard /></PanelCard>; }

function InstabilityCard({ instabilityData }) {
  const data = instabilityData || [];
  return (
    <PanelCard title="COUNTRY INSTABILITY" width={300}>
      {data.map((d) => (
        <div key={d.country} style={{ marginBottom: "9px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
            <span style={{ fontWeight: 900, color: "#fff" }}>{d.country}</span>
            <span style={{ color: d.color, fontWeight: 900 }}>{d.score}</span>
          </div>
          <div style={{ height: "4px", background: "#1e2d4a", borderRadius: "2px" }}>
            <div style={{ height: "100%", width: `${d.score}%`, background: d.color, borderRadius: "2px" }} />
          </div>
        </div>
      ))}
    </PanelCard>
  );
}

function StrategicRiskCard() {
  return (
    <PanelCard title="STRATEGIC RISK" width={300}>
      {STRATEGIC_RISKS.map(r => (
        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px", fontSize: "10px" }}>
          <span style={{ color: "#ccc" }}>{r.label}</span>
          <span style={{ color: r.color, fontWeight: 900 }}>{r.level}</span>
        </div>
      ))}
    </PanelCard>
  );
}

function IntelFeedCard({ intelItems }) {
  return (
    <PanelCard title="INTEL FEED" width={400} live>
      {(intelItems || []).map((it, i) => (
        <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px", fontSize: "11px" }}>
          <div style={{ color: "#5a7a9a" }}>{it.time}</div>
          <div style={{ color: "#ccc" }}>{it.text}</div>
        </div>
      ))}
    </PanelCard>
  );
}

function InfraCard() {
  return <PanelCard title="INFRASTRUCTURE" width={300}>{INFRA_CASCADE.map(d => <div key={d.system} style={{ marginBottom: "11px", fontSize: "9px" }}>{d.system}: {d.status}</div>)}</PanelCard>;
}

function MarketsCard({ liveMarkets }) {
  const tickers = liveMarkets || MARKET_TICKERS;
  return <PanelCard title="MARKETS" width={300}>{tickers.map(t => <div key={t.sym} style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px", fontSize: "10px" }}><span>{t.sym}</span><span>{t.val}</span><span style={{ color: t.up ? "#2ecc71" : "#e74c3c" }}>{t.chg}</span></div>)}</PanelCard>;
}

function CommoditiesCard({ liveCommodities }) {
  const tickers = liveCommodities || COMMODITY_TICKERS;
  return <PanelCard title="COMMODITIES" width={300}>{tickers.map(t => <div key={t.sym} style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px", fontSize: "10px" }}><span>{t.sym}</span><span>{t.val}</span><span style={{ color: t.up ? "#2ecc71" : "#e74c3c" }}>{t.chg}</span></div>)}</PanelCard>;
}

function WorldClockCard() { return <PanelCard title="WORLD CLOCK" width={280}>Time Updates...</PanelCard>; }
function EconIndicatorsCard({ liveEcon }) { return <PanelCard title="ECON INDICATORS" width={300}>Econ Data...</PanelCard>; }
function TradePolicyCard() { return <PanelCard title="TRADE POLICY" width={360}>Policy Data...</PanelCard>; }
function BtcEtfCard() { return <PanelCard title="BTC ETF" width={280}>Crypto Data...</PanelCard>; }
function StablecoinsCard() { return <PanelCard title="STABLECOINS" width={260}>Stable Data...</PanelCard>; }
function TradeRoutesCard() { return <PanelCard title="TRADE ROUTES" width={340}>Route Data...</PanelCard>; }
function SupplyChainsCard() { return <PanelCard title="SUPPLY CHAINS" width={340}>Supply Data...</PanelCard>; }
function PipelineCard() { return <PanelCard title="PIPELINES" width={340}>Pipeline Data...</PanelCard>; }

function renderWidget(key, ctx) {
  switch (key) {
    case "liveNews": return <LiveNewsCard key={key} newsFeed={ctx.newsFeed} />;
    case "currency": return <CurrencyWidget />;
    case "webcams": return <WebcamsCard key={key} />;
    case "instability": return <InstabilityCard key={key} instabilityData={ctx.instabilityData} />;
    case "strategicRisk": return <StrategicRiskCard key={key} />;
    case "intel": return <IntelFeedCard key={key} intelItems={ctx.intelItems} />;
    case "infra": return <InfraCard key={key} />;
    case "markets": return <MarketsCard key={key} liveMarkets={ctx.liveMarkets} />;
    case "commodities": return <CommoditiesCard key={key} liveCommodities={ctx.liveCommodities} />;
    case "clock": return <WorldClockCard key={key} />;
    case "econIndicators": return <EconIndicatorsCard key={key} liveEcon={ctx.liveEcon} />;
    case "tradePolicy": return <TradePolicyCard key={key} />;
    case "btcEtf": return <BtcEtfCard key={key} liveBtc={ctx.liveBtc} />;
    case "stablecoins": return <StablecoinsCard key={key} liveStables={ctx.liveStables} />;
    case "tradeRoutes": return <TradeRoutesCard key={key} />;
    case "supplyChains": return <SupplyChainsCard key={key} />;
    case "pipelines": return <PipelineCard key={key} />;
    default: return null;
  }
}

export default function WidgetPanel({ viewMode, newsFeed = [] }) {
  const [panelHeight, setPanelHeight] = useState(230);
  const dragState = useRef(null);

  const onDragStart = useCallback((e) => {
    e.preventDefault();
    dragState.current = { startY: e.clientY, startHeight: panelHeight };
    const onMove = (mv) => {
      if (!dragState.current) return;
      const delta = dragState.current.startY - mv.clientY;
      setPanelHeight(Math.min(520, Math.max(110, dragState.current.startHeight + delta)));
    };
    const onUp = () => {
      dragState.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [panelHeight]);

  const [liveMarkets, setLiveMarkets] = useState(null);
  const [liveCommodities, setLiveCommodities] = useState(null);
  const [liveBtc, setLiveBtc] = useState(null);
  const [liveStables, setLiveStables] = useState(null);
  const [liveEcon, setLiveEcon] = useState(null);
  const instabilityData = useMemo(() => computeInstability(newsFeed), [newsFeed]);
  const intelItems = useMemo(() => SEEDED_INTEL, []);

  const liveCtx = { newsFeed, liveMarkets, liveCommodities, liveBtc, liveStables, liveEcon, instabilityData, intelItems };
  const widgets = WIDGETS_BY_MODE[viewMode] || WIDGETS_BY_MODE.CONFLICT;
  const modeColor = viewMode === "CONFLICT" ? "#e74c3c" : viewMode === "FINANCE" ? "#3498db" : "#f1c40f";

  return (
    <div style={{ background: "#000", borderTop: `1px solid ${modeColor}44`, flexShrink: 0 }}>
      <div onMouseDown={onDragStart} style={{ height: "10px", cursor: "ns-resize", background: "#03060e", display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}>
        <div style={{ display: "flex", gap: "3px" }}>{[0,1,2,3,4].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#2a4060" }} />)}</div>
      </div>
      <div style={{ height: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: "#03060e", borderBottom: "1px solid #1e2d4a" }}>
        <span style={{ fontSize: "9px", fontWeight: 900, color: modeColor }}>{viewMode} PANEL</span>
      </div>
      <div style={{ height: `${panelHeight}px`, overflowX: "auto", display: "flex", gap: "10px", padding: "10px 14px" }}>
        {widgets.map(key => renderWidget(key, liveCtx))}
      </div>
    </div>
  );
}
