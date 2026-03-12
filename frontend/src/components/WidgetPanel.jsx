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

// Instability bases — boosted by live news mention counts
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

// Intel feed seeded from globalIntel.json — real events, not fake
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

const INTEL_ITEMS = [
  {
    time: "02:14",
    tag: "SIGINT",
    text: "Unusual comm traffic near DMZ — N.Korea border units active",
    color: "#3498db",
  },
  {
    time: "01:47",
    tag: "HUMINT",
    text: "Wagner elements redeployed to Sahel — Mali/Niger border",
    color: "#9b59b6",
  },
  {
    time: "00:33",
    tag: "OSINT",
    text: "Satellite shows new fortifications NE Ukraine frontline",
    color: "#2ecc71",
  },
  {
    time: "23:58",
    tag: "CYBER",
    text: "DDoS surge targeting critical infrastructure in Baltic states",
    color: "#e74c3c",
  },
];

const INFRA_CASCADE = [
  {
    system: "POWER GRID — UKRAINE",
    status: "DEGRADED",
    pct: 34,
    color: "#e74c3c",
  },
  {
    system: "INTERNET — MYANMAR",
    status: "DISRUPTED",
    pct: 21,
    color: "#e74c3c",
  },
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
  {
    route: "SUEZ CANAL",
    vol: "12% global trade",
    risk: "HIGH",
    color: "#e74c3c",
  },
  {
    route: "STRAIT OF MALACCA",
    vol: "25% oil transit",
    risk: "MED",
    color: "#f1c40f",
  },
  {
    route: "PANAMA CANAL",
    vol: "6% global trade",
    risk: "LOW",
    color: "#2ecc71",
  },
  {
    route: "STRAIT OF HORMUZ",
    vol: "20% oil transit",
    risk: "CRIT",
    color: "#e74c3c",
  },
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
  {
    name: "NORDSTREAM ALT.",
    status: "OFFLINE",
    from: "Russia",
    to: "Germany",
    flow: 0,
  },
  {
    name: "TURK STREAM",
    status: "ACTIVE",
    from: "Russia",
    to: "Turkey",
    flow: 87,
  },
  { name: "DRUZHBA", status: "PARTIAL", from: "Russia", to: "EU", flow: 42 },
  {
    name: "BTC PIPELINE",
    status: "ACTIVE",
    from: "Azerbaijan",
    to: "Turkey",
    flow: 94,
  },
  {
    name: "SUMED PIPELINE",
    status: "ACTIVE",
    from: "Saudi Arabia",
    to: "Egypt",
    flow: 78,
  },
];

// Real YouTube live news channels (channel-based live stream embed)
const LIVE_CHANNELS = [
  {
    label: "AL JAZEERA",
    region: "GLOBAL",
    // Al Jazeera English Live
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UCNye-wNBqNL5ZzHSJj3l8Bg&autoplay=1&mute=1",
  },
  {
    label: "DW NEWS",
    region: "EUROPE",
    // DW English Live
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UCknLrEdhRCp1aegoMqRaCZg&autoplay=1&mute=1",
  },
  {
    label: "FRANCE 24",
    region: "MIDEAST",
    // France 24 English Live
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UCQfwfsi5VrQ8yKZ-UGuIB8w&autoplay=1&mute=1",
  },
  {
    label: "SKY NEWS",
    region: "UK",
    // Sky News Live
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UCHaHIX0f5-tFE8v2YRBLRJQ&autoplay=1&mute=1",
  },
  {
    label: "WION",
    region: "ASIA",
    // WION Live
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UCkDZ4HjEI5UCHM0VBYgY9NA&autoplay=1&mute=1",
  },
  {
    label: "BLOOMBERG",
    region: "FINANCE",
    // Bloomberg Television Live
    embedUrl:
      "https://www.youtube.com/embed/live_stream?channel=UCIALMKvObZNtJ6AmdCLP7Lg&autoplay=1&mute=1",
  },
];

const NEWS_SOURCES = [
  "ALL",
  "BLOOMBERG",
  "SKYNEWS",
  "EURONEWS",
  "DW",
  "CNBC",
  "CNN",
  "BBC",
  "AL JAZEERA",
];

const ECON_INDICATORS = [
  { label: "US CPI YoY", val: "3.4%", trend: "↑" },
  { label: "EU GDP QoQ", val: "+0.3%", trend: "→" },
  { label: "FED FUNDS", val: "5.25–5.5%", trend: "→" },
  { label: "ECB RATE", val: "4.50%", trend: "↓" },
  { label: "US UNEMP", val: "3.9%", trend: "↑" },
  { label: "GLOBAL PMI", val: "50.3", trend: "↑" },
];

const TRADE_POLICY_ITEMS = [
  {
    event: "US tariffs on Chinese EVs raised to 100%",
    date: "Jun 2024",
    impact: "HIGH",
  },
  {
    event: "EU carbon border adjustment mechanism active",
    date: "Oct 2023",
    impact: "MED",
  },
  { event: "India wheat export ban extended", date: "May 2024", impact: "MED" },
  {
    event: "ASEAN-GCC FTA negotiations restart",
    date: "Apr 2024",
    impact: "LOW",
  },
];

const WIDGETS_BY_MODE = {
  CONFLICT: [
    "liveNews",
    "webcams",
    "aiInsights",
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
    "aiInsights",
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

// ─── BASE CARD ────────────────────────────────────────────────────────────────

function PanelCard({
  title,
  badge,
  badgeColor,
  children,
  width = 340,
  live = false,
}) {
  return (
    <div
      style={{
        width,
        minWidth: width,
        background: "#05090f",
        border: "1px solid #1e2d4a",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Card header */}
      <div
        style={{
          height: "36px",
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #1e2d4a",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {live && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#e74c3c",
                display: "inline-block",
                animation: "livePulse 1.5s infinite",
              }}
            />
          )}
          <span
            style={{
              fontSize: "10px",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "0.08em",
            }}
          >
            {title}
          </span>
          {badge != null && (
            <span
              style={{
                fontSize: "10px",
                color: badgeColor || "#e74c3c",
                fontWeight: 800,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {live && (
          <span
            style={{
              fontSize: "9px",
              background: "#1e2d4a",
              color: "#2ecc71",
              padding: "1px 6px",
              borderRadius: "4px",
              fontWeight: 900,
            }}
          >
            LIVE
          </span>
        )}
      </div>

      {/* Card body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
        {children}
      </div>
    </div>
  );
}

// ─── LIVE NEWS ────────────────────────────────────────────────────────────────

function LiveNewsCard({ newsFeed }) {
  const [src, setSrc] = useState("ALL");

  const filtered =
    src === "ALL"
      ? newsFeed
      : newsFeed.filter((n) => n.source?.toUpperCase().includes(src));

  return (
    <PanelCard
      title="LIVE NEWS"
      badge={newsFeed.length || 0}
      badgeColor="#e74c3c"
      width={400}
      live
    >
      {/* Source filter pills */}
      <div
        style={{
          display: "flex",
          gap: "5px",
          marginBottom: "10px",
          flexWrap: "wrap",
        }}
      >
        {NEWS_SOURCES.map((s) => (
          <button
            key={s}
            onClick={() => setSrc(s)}
            style={{
              background: s === src ? "#e74c3c" : "#1e2d4a",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "2px 8px",
              fontSize: "8px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Articles */}
      {filtered.slice(0, 6).map((n, i) => (
        <a
          key={i}
          href={n.link && n.link !== "#" ? n.link : undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!n.link || n.link === "#") e.preventDefault();
          }}
          style={{
            display: "block",
            marginBottom: "10px",
            paddingBottom: "10px",
            borderBottom:
              i < filtered.slice(0, 6).length - 1
                ? "1px solid #1e2d4a"
                : "none",
            textDecoration: "none",
            cursor: n.link && n.link !== "#" ? "pointer" : "default",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "3px",
            }}
          >
            <span style={{ fontSize: "9px", color: "#5a7a9a" }}>{n.ago}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {n.link && n.link !== "#" && (
                <span style={{ fontSize: "8px", color: "#3498db" }}>↗</span>
              )}
              <span style={{ fontSize: "9px", color: "#3498db" }}>
                {n.source}
              </span>
            </div>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: n.link && n.link !== "#" ? "#d0e4ff" : "#fff",
              fontWeight: 700,
              lineHeight: "1.4",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (n.link && n.link !== "#")
                e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              if (n.link && n.link !== "#")
                e.currentTarget.style.color = "#d0e4ff";
            }}
          >
            {n.text}
          </div>
          {n.country && (
            <div
              style={{ fontSize: "9px", color: "#5a7a9a", marginTop: "3px" }}
            >
              {n.country}
            </div>
          )}
        </a>
      ))}

      {filtered.length === 0 && (
        <div
          style={{
            fontSize: "11px",
            color: "#5a7a9a",
            textAlign: "center",
            paddingTop: "20px",
          }}
        >
          No articles for this source
        </div>
      )}
    </PanelCard>
  );
}

// ─── LIVE WEBCAMS (YouTube embeds) ────────────────────────────────────────────

function WebcamsCard() {
  const [active, setActive] = useState(0);

  return (
    <div
      style={{
        width: 520,
        minWidth: 520,
        background: "#05090f",
        border: "1px solid #1e2d4a",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: "36px",
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #1e2d4a",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#e74c3c",
              animation: "livePulse 1.5s infinite",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "0.08em",
            }}
          >
            LIVE BROADCAST
          </span>
        </div>
        <span
          style={{
            fontSize: "9px",
            background: "#1e2d4a",
            color: "#2ecc71",
            padding: "1px 6px",
            borderRadius: "4px",
            fontWeight: 900,
          }}
        >
          LIVE
        </span>
      </div>

      {/* Channel selector tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "8px 14px 6px",
          borderBottom: "1px solid #1e2d4a",
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        {LIVE_CHANNELS.map((ch, i) => (
          <button
            key={ch.label}
            onClick={() => setActive(i)}
            style={{
              background: i === active ? "#e74c3c" : "#1e2d4a",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "3px 10px",
              fontSize: "8px",
              fontWeight: 900,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {ch.label}
          </button>
        ))}
      </div>

      {/* YouTube iframe */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          borderRadius: "0 0 8px 8px",
        }}
      >
        <iframe
          key={active}
          src={LIVE_CHANNELS[active].embedUrl}
          title={LIVE_CHANNELS[active].label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
        />
        {/* Region badge overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            background: "rgba(0,0,0,0.75)",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "8px",
            color: "#fff",
            fontWeight: 900,
            pointerEvents: "none",
          }}
        >
          {LIVE_CHANNELS[active].region}
        </div>
      </div>
    </div>
  );
}

// ─── AI INSIGHTS ─────────────────────────────────────────────────────────────

function AiInsightsCard() {
  return (
    <PanelCard title="AI INSIGHTS" width={340} live>
      <div
        style={{
          background: "rgba(52,152,219,0.07)",
          borderRadius: "8px",
          border: "1px solid rgba(52,152,219,0.2)",
          padding: "12px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <GlobeIcon size={12} color="#3498db" />
          <span style={{ fontSize: "10px", fontWeight: 900, color: "#fff" }}>
            WORLD BRIEF
          </span>
        </div>
        <p
          style={{
            fontSize: "11px",
            color: "#8aa",
            lineHeight: "1.6",
            margin: 0,
          }}
        >
          Iranian drone strike near Dubai Airport escalated regional tensions.
          Brent crude surged to $100/bbl amid supply disruption fears.
        </p>
      </div>
      <div
        style={{
          background: "rgba(231,76,60,0.07)",
          borderRadius: "8px",
          border: "1px solid rgba(231,76,60,0.2)",
          padding: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <AlertTriangle size={12} color="#e74c3c" />
          <span style={{ fontSize: "10px", fontWeight: 900, color: "#fff" }}>
            THREAT FORECAST
          </span>
        </div>
        <p
          style={{
            fontSize: "11px",
            color: "#8aa",
            lineHeight: "1.6",
            margin: 0,
          }}
        >
          72h escalation probability: MIDEAST 68% · KOREA 31% · SAHEL 44%.
          Wagner movements suggest imminent push in central Sudan.
        </p>
      </div>
    </PanelCard>
  );
}

// ─── COUNTRY INSTABILITY ──────────────────────────────────────────────────────

function InstabilityCard({ instabilityData }) {
  const data =
    instabilityData && instabilityData.length
      ? instabilityData
      : INSTABILITY_BASE.map((b) => ({
        country: b.country,
        score: b.base,
        color: b.base > 85 ? "#e74c3c" : b.base > 72 ? "#e67e22" : "#f1c40f",
      }));
  return (
    <PanelCard
      title="COUNTRY INSTABILITY"
      badge="NEWS-WEIGHTED"
      badgeColor="#3498db"
      width={300}
    >
      {data.map((d) => (
        <div key={d.country} style={{ marginBottom: "9px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "3px",
            }}
          >
            <span style={{ fontSize: "9px", fontWeight: 900, color: "#fff" }}>
              {d.country}
            </span>
            <span style={{ fontSize: "9px", color: d.color, fontWeight: 900 }}>
              {d.score}
            </span>
          </div>
          <div
            style={{
              height: "4px",
              background: "#1e2d4a",
              borderRadius: "2px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${d.score}%`,
                background: d.color,
                borderRadius: "2px",
              }}
            />
          </div>
        </div>
      ))}
    </PanelCard>
  );
}

// ─── STRATEGIC RISK ───────────────────────────────────────────────────────────

function StrategicRiskCard() {
  return (
    <PanelCard title="STRATEGIC RISK OVERVIEW" width={300}>
      {STRATEGIC_RISKS.map((r) => (
        <div
          key={r.label}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "9px",
          }}
        >
          <span style={{ fontSize: "10px", color: "#ccc" }}>{r.label}</span>
          <span
            style={{
              fontSize: "8px",
              fontWeight: 900,
              color: r.color,
              background: `${r.color}22`,
              padding: "2px 7px",
              borderRadius: "4px",
              letterSpacing: "0.06em",
            }}
          >
            {r.level}
          </span>
        </div>
      ))}
    </PanelCard>
  );
}

// ─── INTEL FEED ───────────────────────────────────────────────────────────────

function IntelFeedCard({ intelItems }) {
  const items = intelItems && intelItems.length ? intelItems : [];
  return (
    <PanelCard
      title="INTEL FEED"
      badge="GLOBALINTEL"
      badgeColor="#3498db"
      width={400}
      live
    >
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "10px",
            paddingBottom: "10px",
            borderBottom: i < items.length - 1 ? "1px solid #1e2d4a" : "none",
          }}
        >
          <div style={{ minWidth: 36, paddingTop: 2 }}>
            <div style={{ fontSize: "9px", color: "#5a7a9a" }}>{it.time}</div>
            {it.country && (
              <div style={{ fontSize: "8px", color: "#3a5a7a", marginTop: 1 }}>
                {it.country}
              </div>
            )}
          </div>
          <div>
            <span
              style={{
                fontSize: "8px",
                fontWeight: 900,
                color: it.color,
                background: `${it.color}22`,
                padding: "1px 6px",
                borderRadius: "3px",
                marginBottom: "4px",
                display: "inline-block",
              }}
            >
              {it.tag}
            </span>
            <div style={{ fontSize: "11px", color: "#ccc", lineHeight: "1.4" }}>
              {it.text}
            </div>
          </div>
        </div>
      ))}
    </PanelCard>
  );
}

// ─── INFRASTRUCTURE CASCADE ───────────────────────────────────────────────────

function InfraCard() {
  return (
    <PanelCard title="INFRASTRUCTURE CASCADE" width={320}>
      {INFRA_CASCADE.map((d) => (
        <div key={d.system} style={{ marginBottom: "11px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <span style={{ fontSize: "9px", fontWeight: 900, color: "#ccc" }}>
              {d.system}
            </span>
            <span style={{ fontSize: "8px", color: d.color, fontWeight: 900 }}>
              {d.status}
            </span>
          </div>
          <div
            style={{
              height: "4px",
              background: "#1e2d4a",
              borderRadius: "2px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${d.pct}%`,
                background: d.color,
                borderRadius: "2px",
              }}
            />
          </div>
          <div style={{ fontSize: "8px", color: "#5a7a9a", marginTop: "2px" }}>
            {d.pct}% operational
          </div>
        </div>
      ))}
    </PanelCard>
  );
}

// ─── WORLD CLOCK ─────────────────────────────────────────────────────────────

function WorldClockCard() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <PanelCard title="WORLD CLOCK" width={280}>
      {WORLD_CLOCKS.map((c) => {
        const time = now.toLocaleTimeString("en-US", {
          timeZone: c.tz,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        return (
          <div
            key={c.city}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "9px",
            }}
          >
            <span
              style={{ fontSize: "9px", fontWeight: 900, color: "#7a9ab8" }}
            >
              {c.city}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 900,
                color: "#fff",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {time}
            </span>
          </div>
        );
      })}
    </PanelCard>
  );
}

// ─── MARKETS ─────────────────────────────────────────────────────────────────

function MarketsCard({ liveMarkets }) {
  const tickers =
    liveMarkets && liveMarkets.length ? liveMarkets : MARKET_TICKERS;
  return (
    <PanelCard
      title="MARKETS"
      badge={liveMarkets ? "● LIVE" : "CACHED"}
      badgeColor={liveMarkets ? "#2ecc71" : "#5a7a9a"}
      width={300}
    >
      {tickers.map((t) => (
        <div
          key={t.sym}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "9px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 900,
              color: "#7a9ab8",
              minWidth: 45,
            }}
          >
            {t.sym}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 900,
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {t.val}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 900,
              color: t.up ? "#2ecc71" : "#e74c3c",
            }}
          >
            {t.chg}
          </span>
        </div>
      ))}
    </PanelCard>
  );
}

// ─── COMMODITIES ──────────────────────────────────────────────────────────────

function CommoditiesCard({ liveCommodities }) {
  const tickers =
    liveCommodities && liveCommodities.length
      ? liveCommodities
      : COMMODITY_TICKERS;
  return (
    <PanelCard
      title="COMMODITIES"
      badge={liveCommodities ? "● LIVE" : "CACHED"}
      badgeColor={liveCommodities ? "#2ecc71" : "#5a7a9a"}
      width={300}
    >
      {tickers.map((t) => (
        <div
          key={t.sym}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "9px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 900,
              color: "#7a9ab8",
              minWidth: 55,
            }}
          >
            {t.sym}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 900,
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {t.val}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 900,
              color: t.up ? "#2ecc71" : "#e74c3c",
            }}
          >
            {t.chg}
          </span>
        </div>
      ))}
    </PanelCard>
  );
}

// ─── ECONOMIC INDICATORS ─────────────────────────────────────────────────────

function EconIndicatorsCard({ liveEcon }) {
  const indicators = liveEcon && liveEcon.length ? liveEcon : ECON_INDICATORS;
  return (
    <PanelCard
      title="ECONOMIC INDICATORS"
      badge={liveEcon ? "● LIVE" : "CACHED"}
      badgeColor={liveEcon ? "#2ecc71" : "#5a7a9a"}
      width={300}
    >
      {indicators.map((d) => (
        <div
          key={d.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "9px",
          }}
        >
          <span style={{ fontSize: "9px", color: "#7a9ab8" }}>{d.label}</span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 900,
                color: "#fff",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {d.val}
            </span>
            <span
              style={{
                fontSize: "13px",
                color:
                  d.trend === "↑"
                    ? "#2ecc71"
                    : d.trend === "↓"
                      ? "#e74c3c"
                      : "#f1c40f",
              }}
            >
              {d.trend}
            </span>
          </div>
        </div>
      ))}
    </PanelCard>
  );
}

// ─── TRADE POLICY ────────────────────────────────────────────────────────────

function TradePolicyCard() {
  return (
    <PanelCard title="TRADE POLICY" width={360}>
      {TRADE_POLICY_ITEMS.map((it, i) => (
        <div
          key={i}
          style={{
            marginBottom: "10px",
            paddingBottom: "10px",
            borderBottom:
              i < TRADE_POLICY_ITEMS.length - 1 ? "1px solid #1e2d4a" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "3px",
            }}
          >
            <span style={{ fontSize: "9px", color: "#5a7a9a" }}>{it.date}</span>
            <span
              style={{
                fontSize: "8px",
                fontWeight: 900,
                color:
                  it.impact === "HIGH"
                    ? "#e74c3c"
                    : it.impact === "MED"
                      ? "#f1c40f"
                      : "#2ecc71",
                background: "rgba(255,255,255,0.06)",
                padding: "1px 6px",
                borderRadius: "3px",
              }}
            >
              {it.impact}
            </span>
          </div>
          <div style={{ fontSize: "10px", color: "#ccc" }}>{it.event}</div>
        </div>
      ))}
    </PanelCard>
  );
}

// ─── BTC ETF ─────────────────────────────────────────────────────────────────

function BtcEtfCard({ liveBtc }) {
  const price = liveBtc?.price ?? 67842;
  const change = liveBtc?.change ?? 2.14;
  const fmtPrice = price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const fmtChg = (change >= 0 ? "+" : "") + change.toFixed(2) + "% 24h";
  return (
    <PanelCard
      title="BTC ETF TRACKER"
      badge={liveBtc ? "● LIVE" : "CACHED"}
      badgeColor={liveBtc ? "#f7931a" : "#5a7a9a"}
      width={280}
    >
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "9px", color: "#5a7a9a", marginBottom: "2px" }}>
          BTC SPOT
        </div>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 900,
            color: "#f7931a",
            lineHeight: "1.2",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${fmtPrice}
        </div>
        <span
          style={{
            fontSize: "10px",
            color: change >= 0 ? "#2ecc71" : "#e74c3c",
          }}
        >
          {fmtChg}
        </span>
      </div>
      {BTC_ETF.map((e) => (
        <div
          key={e.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: 900, color: "#f7931a" }}>
            {e.name}
          </span>
          <span style={{ fontSize: "10px", color: "#7a9ab8" }}>{e.aum}</span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 900,
              color: e.up ? "#2ecc71" : "#e74c3c",
            }}
          >
            {e.chg}
          </span>
        </div>
      ))}
    </PanelCard>
  );
}

// ─── STABLECOINS ─────────────────────────────────────────────────────────────

function StablecoinsCard({ liveStables }) {
  const coins = liveStables && liveStables.length ? liveStables : STABLECOINS;
  return (
    <PanelCard
      title="STABLECOINS"
      badge={liveStables ? "● LIVE" : "CACHED"}
      badgeColor={liveStables ? "#2ecc71" : "#5a7a9a"}
      width={260}
    >
      {coins.map((s) => {
        const pegOff = s.peg
          ? Math.abs(parseFloat(s.peg.replace("$", "")) - 1) > 0.001
          : false;
        const statusColor = pegOff ? "#e74c3c" : "#2ecc71";
        return (
          <div key={s.name} style={{ marginBottom: "13px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "3px",
              }}
            >
              <span
                style={{ fontSize: "11px", fontWeight: 900, color: "#fff" }}
              >
                {s.name}
              </span>
              <span
                style={{
                  fontSize: "8px",
                  color: statusColor,
                  background: `${statusColor}18`,
                  padding: "1px 6px",
                  borderRadius: "3px",
                  fontWeight: 900,
                }}
              >
                {s.status}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "9px", color: "#7a9ab8" }}>
                Peg: {s.peg}
              </span>
              <span style={{ fontSize: "9px", color: "#7a9ab8" }}>
                MCap: {s.mcap}
              </span>
            </div>
          </div>
        );
      })}
    </PanelCard>
  );
}

// ─── TRADE ROUTES ────────────────────────────────────────────────────────────

function TradeRoutesCard() {
  return (
    <PanelCard title="TRADE ROUTES" width={340}>
      {TRADE_ROUTES.map((r) => (
        <div
          key={r.route}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div>
            <div style={{ fontSize: "10px", fontWeight: 900, color: "#fff" }}>
              {r.route}
            </div>
            <div style={{ fontSize: "9px", color: "#5a7a9a" }}>{r.vol}</div>
          </div>
          <span
            style={{
              fontSize: "8px",
              fontWeight: 900,
              color: r.color,
              background: `${r.color}22`,
              padding: "2px 7px",
              borderRadius: "4px",
            }}
          >
            {r.risk}
          </span>
        </div>
      ))}
    </PanelCard>
  );
}

// ─── SUPPLY CHAINS ───────────────────────────────────────────────────────────

function SupplyChainsCard() {
  return (
    <PanelCard title="SUPPLY CHAIN DISRUPTION" width={340}>
      {SUPPLY_CHAINS.map((d) => (
        <div key={d.sector} style={{ marginBottom: "11px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "3px",
            }}
          >
            <span style={{ fontSize: "9px", fontWeight: 900, color: "#fff" }}>
              {d.sector}
            </span>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 900,
                color:
                  d.disruption > 75
                    ? "#e74c3c"
                    : d.disruption > 50
                      ? "#e67e22"
                      : "#f1c40f",
              }}
            >
              {d.disruption}%
            </span>
          </div>
          <div
            style={{
              height: "4px",
              background: "#1e2d4a",
              borderRadius: "2px",
              marginBottom: "2px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${d.disruption}%`,
                background:
                  d.disruption > 75
                    ? "#e74c3c"
                    : d.disruption > 50
                      ? "#e67e22"
                      : "#f1c40f",
                borderRadius: "2px",
              }}
            />
          </div>
          <div style={{ fontSize: "8px", color: "#5a7a9a" }}>{d.note}</div>
        </div>
      ))}
    </PanelCard>
  );
}

// ─── PIPELINE STATUS ─────────────────────────────────────────────────────────

function PipelineCard() {
  return (
    <PanelCard title="PIPELINE STATUS" width={340}>
      {PIPELINES.map((p) => (
        <div key={p.name} style={{ marginBottom: "10px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "3px",
            }}
          >
            <span style={{ fontSize: "9px", fontWeight: 900, color: "#fff" }}>
              {p.name}
            </span>
            <span
              style={{
                fontSize: "8px",
                fontWeight: 900,
                color:
                  p.status === "ACTIVE"
                    ? "#2ecc71"
                    : p.status === "PARTIAL"
                      ? "#f1c40f"
                      : "#e74c3c",
                background:
                  p.status === "ACTIVE"
                    ? "rgba(46,204,113,0.12)"
                    : p.status === "PARTIAL"
                      ? "rgba(241,196,15,0.12)"
                      : "rgba(231,76,60,0.12)",
                padding: "1px 6px",
                borderRadius: "3px",
              }}
            >
              {p.status}
            </span>
          </div>
          <div
            style={{
              height: "3px",
              background: "#1e2d4a",
              borderRadius: "2px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${p.flow}%`,
                background:
                  p.status === "ACTIVE"
                    ? "#2ecc71"
                    : p.status === "PARTIAL"
                      ? "#f1c40f"
                      : "#e74c3c",
                borderRadius: "2px",
              }}
            />
          </div>
          <div style={{ fontSize: "8px", color: "#5a7a9a", marginTop: "2px" }}>
            {p.from} → {p.to} · {p.flow}% capacity
          </div>
        </div>
      ))}
    </PanelCard>
  );
}

// ─── WIDGET RENDERER ─────────────────────────────────────────────────────────

function renderWidget(
  key,
  {
    newsFeed,
    liveMarkets,
    liveCommodities,
    liveBtc,
    liveStables,
    liveEcon,
    instabilityData,
    intelItems,
  },
) {
  switch (key) {
    case "liveNews":
      return <LiveNewsCard key={key} newsFeed={newsFeed} />;
    case "webcams":
      return <WebcamsCard key={key} />;
    case "aiInsights":
      return <AiInsightsCard key={key} />;
    case "instability":
      return <InstabilityCard key={key} instabilityData={instabilityData} />;
    case "strategicRisk":
      return <StrategicRiskCard key={key} />;
    case "intel":
      return <IntelFeedCard key={key} intelItems={intelItems} />;
    case "infra":
      return <InfraCard key={key} />;
    case "markets":
      return <MarketsCard key={key} liveMarkets={liveMarkets} />;
    case "commodities":
      return <CommoditiesCard key={key} liveCommodities={liveCommodities} />;
    case "clock":
      return <WorldClockCard key={key} />;
    case "econIndicators":
      return <EconIndicatorsCard key={key} liveEcon={liveEcon} />;
    case "tradePolicy":
      return <TradePolicyCard key={key} />;
    case "btcEtf":
      return <BtcEtfCard key={key} liveBtc={liveBtc} />;
    case "stablecoins":
      return <StablecoinsCard key={key} liveStables={liveStables} />;
    case "tradeRoutes":
      return <TradeRoutesCard key={key} />;
    case "supplyChains":
      return <SupplyChainsCard key={key} />;
    case "pipelines":
      return <PipelineCard key={key} />;
    default:
      return null;
  }
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export default function WidgetPanel({ viewMode, newsFeed = [] }) {
  const [panelHeight, setPanelHeight] = useState(230);
  const dragState = useRef(null); // { startY, startHeight }

  const onDragStart = useCallback(
    (e) => {
      e.preventDefault();
      dragState.current = { startY: e.clientY, startHeight: panelHeight };

      const onMove = (mv) => {
        if (!dragState.current) return;
        const delta = dragState.current.startY - mv.clientY; // drag UP = bigger
        const next = Math.min(
          520,
          Math.max(110, dragState.current.startHeight + delta),
        );
        setPanelHeight(next);
      };
      const onUp = () => {
        dragState.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [panelHeight],
  );

  // ── Live market / commodity / BTC data from backend (Yahoo Finance)
  const [liveMarkets, setLiveMarkets] = useState(null);
  const [liveCommodities, setLiveCommodities] = useState(null);
  const [liveBtc, setLiveBtc] = useState(null);

  // ── Stablecoin pegs from CoinGecko (CORS-friendly, no API key)
  const [liveStables, setLiveStables] = useState(null);

  // ── Economic indicators from World Bank API (annual, real data)
  const [liveEcon, setLiveEcon] = useState(null);

  // ── Country instability — computed from live news feed
  const instabilityData = useMemo(
    () => computeInstability(newsFeed),
    [newsFeed],
  );

  // ── Intel feed seeded from globalIntel.json (real events)
  const intelItems = useMemo(() => SEEDED_INTEL, []);

  // Fetch market/commodity/BTC from backend
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/market/widgets`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.markets) setLiveMarkets(data.markets);
        if (data.commodities) setLiveCommodities(data.commodities);
        if (data.btc) setLiveBtc(data.btc);
      } catch (e) {
        console.warn("[WidgetPanel] Market fetch failed:", e.message);
      }
    };
    load();
    const t = setInterval(load, 60_000); // refresh every 60s
    return () => clearInterval(t);
  }, []);

  // Fetch stablecoin pegs from CoinGecko
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price" +
          "?ids=tether,usd-coin,dai" +
          "&vs_currencies=usd&include_market_cap=true&include_24hr_change=true",
        );
        if (!res.ok) return;
        const d = await res.json();
        const fmt = (id, name) => ({
          name,
          peg: "$" + (d[id]?.usd?.toFixed(4) ?? "1.0000"),
          mcap: d[id]?.usd_market_cap
            ? "$" + (d[id].usd_market_cap / 1e9).toFixed(1) + "B"
            : "N/A",
          status:
            Math.abs((d[id]?.usd ?? 1) - 1) < 0.005 ? "STABLE" : "DE-PEG ⚠",
        });
        setLiveStables([
          fmt("tether", "USDT"),
          fmt("usd-coin", "USDC"),
          fmt("dai", "DAI"),
        ]);
      } catch (e) {
        console.warn("[WidgetPanel] CoinGecko fetch failed:", e.message);
      }
    };
    load();
    const t = setInterval(load, 120_000);
    return () => clearInterval(t);
  }, []);

  // Fetch key economic indicators from World Bank API
  useEffect(() => {
    const load = async () => {
      try {
        const [cpiRes, gdpRes, unempRes] = await Promise.all([
          fetch(
            "https://api.worldbank.org/v2/country/US/indicator/FP.CPI.TOTL.ZG?format=json&mrv=1",
          ),
          fetch(
            "https://api.worldbank.org/v2/country/1W/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrv=1",
          ),
          fetch(
            "https://api.worldbank.org/v2/country/US/indicator/SL.UEM.TOTL.ZS?format=json&mrv=1",
          ),
        ]);
        const [cpiData, gdpData, unempData] = await Promise.all([
          cpiRes.json(),
          gdpRes.json(),
          unempRes.json(),
        ]);
        const getVal = (d) => d?.[1]?.[0]?.value;
        const cpi = getVal(cpiData);
        const gdp = getVal(gdpData);
        const unemp = getVal(unempData);
        setLiveEcon([
          {
            label: "US CPI YoY",
            val: cpi ? cpi.toFixed(1) + "%" : "N/A",
            trend: cpi > 3 ? "↑" : "→",
          },
          {
            label: "GLOBAL GDP",
            val: gdp ? "+" + gdp.toFixed(1) + "%" : "N/A",
            trend: gdp > 2 ? "↑" : "↓",
          },
          {
            label: "US UNEMP",
            val: unemp ? unemp.toFixed(1) + "%" : "N/A",
            trend: unemp > 4 ? "↑" : "→",
          },
          { label: "FED FUNDS", val: "5.25–5.5%", trend: "→" },
          { label: "ECB RATE", val: "4.50%", trend: "↓" },
          { label: "GLOBAL PMI", val: "50.3", trend: "↑" },
        ]);
      } catch (e) {
        console.warn("[WidgetPanel] World Bank fetch failed:", e.message);
      }
    };
    load();
    const t = setInterval(load, 3_600_000); // hourly (annual data)
    return () => clearInterval(t);
  }, []);

  const liveCtx = {
    newsFeed,
    liveMarkets,
    liveCommodities,
    liveBtc,
    liveStables,
    liveEcon,
    instabilityData,
    intelItems,
  };

  const widgets = WIDGETS_BY_MODE[viewMode] || WIDGETS_BY_MODE.CONFLICT;
  const modeColor =
    viewMode === "CONFLICT"
      ? "#e74c3c"
      : viewMode === "FINANCE"
        ? "#3498db"
        : "#f1c40f";

  const modeLabel =
    viewMode === "CONFLICT"
      ? "WORLD INTELLIGENCE"
      : viewMode === "FINANCE"
        ? "FINANCIAL INTELLIGENCE"
        : "COMMODITY & SUPPLY CHAIN";

  return (
    <div
      style={{
        background: "#000",
        borderTop: `1px solid ${modeColor}44`,
        flexShrink: 0,
      }}
    >
      {/* ── Drag-to-resize handle ── */}
      <div
        onMouseDown={onDragStart}
        style={{
          height: "10px",
          cursor: "ns-resize",
          background: "#03060e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTop: `1px solid ${modeColor}33`,
          userSelect: "none",
        }}
      >
        {/* grip dots */}
        <div style={{ display: "flex", gap: "3px" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: "#2a4060",
              }}
            />
          ))}
        </div>
      </div>

      {/* Panel header bar */}
      <div
        style={{
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid #1e2d4a",
          background: "#03060e",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontSize: "9px",
              fontWeight: 900,
              color: modeColor,
              letterSpacing: "0.12em",
            }}
          >
            {modeLabel} PANEL
          </span>
          <span style={{ fontSize: "9px", color: "#5a7a9a" }}>
            {widgets.length} widgets active
          </span>
        </div>
        <span style={{ fontSize: "9px", color: "#2a4060" }}>← scroll →</span>
      </div>

      {/* Scrollable widget row */}
      <div
        style={{
          height: `${panelHeight}px`,
          overflowX: "auto",
          overflowY: "hidden",
          display: "flex",
          gap: "10px",
          alignItems: "stretch",
          padding: "10px 14px",
          scrollbarWidth: "thin",
          scrollbarColor: "#1e2d4a #000",
        }}
      >
        {widgets.map((key) => renderWidget(key, liveCtx))}
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
