import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import Globe from "react-globe.gl";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Layers,
  Radio,
  CreditCard,
  Box,
  Activity,
  Shield,
  Zap,
  Wind,
  Thermometer,
  Eye,
  LayoutGrid,
  Map as MapIcon,
  Globe as GlobeIcon,
  AlertTriangle,
  TrendingUp,
  Cpu,
  Droplet,
  Fuel,
  Anchor,
  Ship,
  Plane,
  ChevronRight,
  Maximize2,
  Crosshair,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import HISTORICAL_DATA from "../data/historicalConflicts.json";
import TRADE_DATA from "../data/trade.json";
import GLOBAL_INTEL from "../data/globalIntel.json";
import API_BASE_URL from "../api/config";
import { AiInsightsCard } from "./AiInsightsCard";
import WidgetPanel from "./WidgetPanel";
import GlobalStabilityPanel from "./GlobalStabilityPanel";

// --- DATA DEFINITIONS ---

const MODES = {
  CONFLICT: { label: "WORLD", icon: <Shield size={14} />, color: "#e74c3c" },
  FINANCE: { label: "FINANCE", icon: <TrendingUp size={14} />, color: "#2ecc71" },
  SUPPLY_CHAIN: {
    label: "SUPPLY CHAIN",
    icon: <Box size={14} />,
    color: "#f1c40f",
  },
};

const COUNTRY_COORDS = {
  "Russia": [61.5, 105.3],
  "China": [35.8, 104.1],
  "India": [20.5, 78.9],
  "USA": [37.0, -95.7],
  "Saudi Arabia": [23.8, 45.0],
  "Australia": [-25.2, 133.7],
  "Brazil": [-14.2, -51.9],
  "Canada": [56.1, -106.3],
  "Norway": [60.4, 8.4],
  "European Union": [50.0, 10.0],
  "Qatar": [25.3, 51.1],
  "Japan": [36.2, 138.2],
  "South Korea": [35.9, 127.7],
  "Indonesia": [-0.7, 113.9],
  "Malaysia": [4.2, 101.9],
  "Vietnam": [14.0, 108.2],
  "Germany": [51.1, 10.4],
  "Taiwan": [23.6, 120.9],
  "United Arab Emirates": [23.4, 53.8],
  "Nigeria": [9.0, 8.6],
  "Angola": [-11.2, 17.8],
  "Chile": [-35.6, -71.5],
  "Peru": [-9.1, -75.0],
  "Kazakhstan": [48.0, 66.9],
  "Turkmenistan": [38.9, 59.5],
  "Mongolia": [46.8, 103.8],
  "Mexico": [23.6, -102.5],
  "France": [46.2, 2.2],
  "Italy": [41.8, 12.5],
  "Netherlands": [52.1, 5.2],
  "Belgium": [50.5, 4.4],
  "Poland": [51.9, 19.1],
  "Spain": [40.4, -3.7],
  "Turkey": [38.9, 35.2],
  "Egypt": [26.8, 30.8],
  "South Africa": [-30.5, 22.9],
  "United Kingdom": [55.3, -3.4]
};

const LAYER_GROUPS = {
  CONFLICT: [
    { id: "Iran Attacks", label: "IRAN ATTACKS", icon: <Zap size={12} />, active: false },
    { id: "Intel Hotspots", label: "INTEL HOTSPOTS", icon: <Eye size={12} />, active: false },
    { id: "Conflict Zones", label: "CONFLICT ZONES", icon: <AlertTriangle size={12} />, active: false },
    { id: "Military Bases", label: "MILITARY BASES", icon: <Shield size={12} />, active: false },
    { id: "Nuclear Sites", label: "NUCLEAR SITES", icon: <Activity size={12} />, active: false },
    { id: "Gamma Irradiators", label: "GAMMA IRRADIATORS", icon: <Wind size={12} />, active: false },
    { id: "Spaceports", label: "SPACEPORTS", icon: <Zap size={12} />, active: false },
    { id: "Undersea Cables", label: "UNDERSEA CABLES", icon: <Zap size={12} />, active: false },
    { id: "Pipelines", label: "PIPELINES", icon: <Fuel size={12} />, active: false },
    { id: "AI Data Centers", label: "AI DATA CENTERS", icon: <Cpu size={12} />, active: false },
    { id: "Military Activity", label: "MILITARY ACTIVITY", icon: <Plane size={12} />, active: false },
    { id: "Ship Traffic", label: "SHIP TRAFFIC", icon: <Anchor size={12} />, active: false },
    { id: "Trade Routes", label: "TRADE ROUTES", icon: <Ship size={12} />, active: false },
    { id: "Aviation", label: "AVIATION", icon: <Plane size={12} />, active: false },
    { id: "Protests", label: "PROTESTS", icon: <Radio size={12} />, active: false },
    { id: "Armed Conflict Events", label: "ARMED CONFLICT", icon: <Shield size={12} />, active: false },
    { id: "Displacement Flows", label: "DISPLACEMENT", icon: <Activity size={12} />, active: false },
    { id: "Climate Anomalies", label: "CLIMATE ANOMALY", icon: <Thermometer size={12} />, active: false },
    { id: "Weather Alerts", label: "WEATHER ALERTS", icon: <Wind size={12} />, active: false },
    { id: "Internet Outages", label: "INTERNET OUTAGES", icon: <Radio size={12} />, active: false },
    { id: "Cyber Threats", label: "CYBER THREATS", icon: <Zap size={12} />, active: false },
    { id: "Natural Events", label: "NATURAL EVENTS", icon: <Activity size={12} />, active: false },
    { id: "Fires", label: "FIRES", icon: <Zap size={12} />, active: false },
    { id: "Strategic Waterways", label: "WATERWAYS", icon: <Anchor size={12} />, active: false },
    { id: "Economic Centers", label: "ECON CENTERS", icon: <Activity size={12} />, active: false },
    { id: "Critical Minerals", label: "CRITICAL MINS", icon: <Cpu size={12} />, active: false },
    { id: "GPS JAMMING", label: "GPS JAMMING", icon: <Radio size={12} />, active: false },
    { id: "Orbital Surveillance", label: "ORBITAL SURV", icon: <Eye size={12} />, active: false }
  ],
  FINANCE: [
    { id: "stock_exchange", label: "STOCK EXCHANGES", icon: <TrendingUp size={12} />, active: false },
    { id: "central_bank", label: "CENTRAL BANKS", icon: <CreditCard size={12} />, active: false },
    { id: "cyber_threats", label: "CYBER THREATS", icon: <Zap size={12} />, active: false },
    { id: "economic_centers", label: "ECONOMIC CENTERS", icon: <Activity size={12} />, active: false }
  ],
  SUPPLY_CHAIN: [
    { id: "Ship Traffic", label: "MARITIME VESSELS", icon: <Anchor size={12} />, active: false },
    { id: "Trade Routes", label: "SHIPPING LANES", icon: <Ship size={12} />, active: false },
    { id: "Pipelines", label: "ENERGY PIPELINES", icon: <Fuel size={12} />, active: false },
    { id: "Aviation", label: "AIR CARGO ROUTES", icon: <Plane size={12} />, active: false },
    { id: "Strategic Waterways", label: "CHOKEPOINTS", icon: <Layers size={12} />, active: false }
  ]
};

// --- MARKER DATA (Synthesized for high fidelity) ---

const CONFLICT_ZONES_POLY = [
  { country: "Russia", coords: [61.5, 105.3], level: "CRITICAL" },
  { country: "Ukraine", coords: [48.3, 31.1], level: "CRITICAL" },
  { country: "Israel", coords: [31.4, 34.4], level: "CRITICAL" },
  { country: "Iran", coords: [32.4, 53.6], level: "HIGH" },
  { country: "Sudan", coords: [12.8, 30.2], level: "CRITICAL" },
];

const FINANCE_POINTS = [
  {
    lat: 40.7128,
    lng: -74.006,
    label: "NYSE",
    type: "stock_exchange",
    text: "Volume: $22.4T | High Volatility detected",
  },
  {
    lat: 51.5074,
    lng: -0.1278,
    label: "LSE",
    type: "stock_exchange",
    text: "Market sentiment: Bearish",
  },
  {
    lat: 35.6762,
    lng: 139.6503,
    label: "TSE",
    type: "stock_exchange",
    text: "Nikkei 225 up +1.2%",
  },
  {
    lat: 22.3193,
    lng: 114.1694,
    label: "HKEX",
    type: "stock_exchange",
    text: "Hang Seng index stable",
  },
  {
    lat: 50.1109,
    lng: 8.6821,
    label: "ECB",
    type: "central_bank",
    text: "Interest rate decision pending",
  },
  {
    lat: 38.8977,
    lng: -77.0365,
    label: "FED",
    type: "central_bank",
    text: "Hawkish stance maintained",
  },
  {
    lat: 31.2304,
    lng: 121.4737,
    label: "SSE",
    type: "stock_exchange",
    text: "Shanghai Composite active",
  },
  {
    lat: 1.3521,
    lng: 103.8198,
    label: "SGX",
    type: "stock_exchange",
    text: "Commodity futures surging",
  },
];

const COMMODITY_LINES = [
  // Nord Stream
  {
    name: "NORD STREAM 1",
    startLat: 54.0,
    startLng: 12.0,
    endLat: 59.0,
    endLng: 25.0,
    type: "pipeline",
    color: "#f39c12",
  },
  // Southern Gas Corridor
  {
    name: "TANAP",
    startLat: 39.0,
    startLng: 32.0,
    endLat: 40.0,
    endLng: 48.0,
    type: "pipeline",
    color: "#f39c12",
  },
  // Malacca
  {
    name: "MALACCA STRAIT",
    startLat: 5.0,
    startLng: 98.0,
    endLat: 1.5,
    endLng: 103.0,
    type: "strategic_waterway",
    color: "#1abc9c",
  },
  // Suez
  {
    name: "SUEZ CANAL",
    startLat: 29.9,
    startLng: 32.5,
    endLat: 27.0,
    endLng: 34.0,
    type: "strategic_waterway",
    color: "#1abc9c",
  },
  // Panama
  {
    name: "PANAMA CANAL",
    startLat: 9.0,
    startLng: -79.5,
    endLat: 9.5,
    endLng: -79.0,
    type: "strategic_waterway",
    color: "#1abc9c",
  },
];

const EVENT_TYPES = {
  military: { color: "#e74c3c", label: "Military Strike" },
  missile: { color: "#c0392b", label: "Missile Launch" },
  nuclear: { color: "#f39c12", label: "Nuclear Alert" },
  economic: { color: "#2ecc71", label: "Economic Hub" },
  political: { color: "#3498db", label: "Cyber/Political" },
  fire: { color: "#e67e22", label: "Natural/Climate" },
  blockade: { color: "#9b59b6", label: "Trade Blockade" },
  stock_exchange: { color: "#27ae60", label: "Stock Exchange" },
  central_bank: { color: "#3498db", label: "Central Bank" },
  pipeline: { color: "#f39c12", label: "Gas Pipeline" },
  strategic_waterway: { color: "#1abc9c", label: "Waterway" },
};

export default function ConflictGlobe() {
  const globeRef = useRef();
  const navigate = useNavigate();

  // -- UI STATE --
  const [viewMode, setViewMode] = useState("CONFLICT");
  const [projection, setProjection] = useState("3d"); // '3d' | '2d'
  const [activeLayers, setActiveLayers] = useState(
    new Set(LAYER_GROUPS.CONFLICT.filter((l) => l.active).map((l) => l.id)),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("Global");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // -- DATA STATE --
  const [countries, setCountries] = useState({ features: [] });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [newsFeed, setNewsFeed] = useState([]);
  const [trackingData, setTrackingData] = useState({
    flights: [],
    vessels: [],
  });
  const [gti, setGti] = useState(71.4);
  const [hoveredMarker, setHoveredMarker] = useState(null);

  // Constants
  const NAVBAR_H = 58;
  const DASHBOARD_H = 48;
  const BOTTOM_PANEL_H = 220;
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Handle mode change: reset layers
  const handleModeChange = (mode) => {
    setViewMode(mode);
    setActiveLayers(
      new Set(LAYER_GROUPS[mode].filter((l) => l.active).map((l) => l.id)),
    );
  };

  const toggleLayer = (id) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // FETCHING
  const fetchLiveFeed = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/live/feed`);
      if (!res.ok) throw new Error("Feed fetch failed");
      const data = await res.json();
      setNewsFeed(data.news || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchTracking = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tracking/live`);
      if (!res.ok) throw new Error("Tracking fetch failed");
      const data = await res.json();
      setTrackingData(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchLiveFeed();
    fetchTracking();
    const feedInterval = setInterval(fetchLiveFeed, 300000);
    const trackInterval = setInterval(fetchTracking, 10000);
    return () => {
      clearInterval(feedInterval);
      clearInterval(trackInterval);
    };
  }, [fetchLiveFeed, fetchTracking]);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson",
    )
      .then((r) => r.json())
      .then((data) => setCountries(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedIndicator, setSelectedIndicator] = useState(null);

  // --- TACTICAL WAYPOINTS (For proper shipping routes) ---
  const WAYPOINTS = {
    SUEZ: [29.9, 32.5],
    PANAMA: [9.1, -79.9],
    MALACCA: [1.3, 103.0],
    HORMUZ: [26.5, 56.3],
    CAPE: [-34.3, 18.5],
    GIBSON: [35.9, -5.6]
  };

  const getShippingPath = useCallback((route) => {
    const s = COUNTRY_COORDS[route.source];
    const t = COUNTRY_COORDS[route.target];
    if (!s || !t) return null;

    let path = [s];

    // Simple heuristic-based waypoint insertion for 'proper' paths
    if (route.corridor.includes('Suez')) path.push(WAYPOINTS.SUEZ);
    if (route.corridor.includes('Hormuz')) path.push(WAYPOINTS.HORMUZ);
    if (route.corridor.includes('Malacca')) path.push(WAYPOINTS.MALACCA);
    if (route.corridor.includes('Panama')) path.push(WAYPOINTS.PANAMA);
    if (route.corridor.includes('Arctic') || route.corridor.includes('Atlantic')) {
      // Add middle-of-ocean safety points
      if (s[1] > 0 && t[1] < -50) path.push([40, -40]);
    }

    path.push(t);
    return path;
  }, []);

  const supplyChainData = useMemo(() => {
    if (viewMode !== 'SUPPLY_CHAIN') return { arcs: [], paths: [] };

    const arcs = [];
    const paths = [];

    TRADE_DATA.forEach(t => {
      const sCoords = COUNTRY_COORDS[t.source];
      const tCoords = COUNTRY_COORDS[t.target];
      if (!sCoords || !tCoords) return;

      if (activeLayers.has('Aviation') && t.goods.some(g => g.includes('Electronics') || g.includes('Aircraft'))) {
        arcs.push({
          startLat: sCoords[0], startLng: sCoords[1],
          endLat: tCoords[0], endLng: tCoords[1],
          color: ['#f1c40f22', '#f1c40fcc', '#f1c40f22'],
          data: t,
          type: 'Aviation'
        });
      }

      if (activeLayers.has('Trade Routes')) {
        const sPath = getShippingPath(t);
        if (sPath) {
          paths.push({
            path: sPath,
            color: '#1abc9c',
            data: t,
            type: 'Maritime'
          });
        }
      }
    });

    return { arcs, paths };
  }, [viewMode, activeLayers, getShippingPath]);

  // Animation for GTI
  useEffect(() => {
    const id = setInterval(
      () =>
        setGti((g) =>
          parseFloat((g + (Math.random() - 0.48) * 0.4).toFixed(1)),
        ),
      2500,
    );
    return () => clearInterval(id);
  }, []);

  // FILTERS
  const visibleLayers = useMemo(() => {
    const layers = LAYER_GROUPS[viewMode].filter((l) =>
      l.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    return layers;
  }, [viewMode, searchQuery]);

  const markers = useMemo(() => {
    let baseMarkers = [];

    // 1. Master Intel Data (Plotting globalIntel.json)
    const intelMarkers = GLOBAL_INTEL.filter(item => activeLayers.has(item.category)).map(item => ({
      ...item,
      label: item.title,
      text: item.news,
      type: item.type
    }));
    baseMarkers = [...intelMarkers];

    // 2. Mode-Specific Intelligence
    if (viewMode === "CONFLICT") {
      const newsMarkers = newsFeed.map((n) => ({
        lat: n.lat,
        lng: n.lng,
        label: n.country,
        text: n.text,
        type: n.type || "military",
      }));
      baseMarkers = [...baseMarkers, ...newsMarkers];
    } else if (viewMode === "FINANCE") {
      const financeMarkers = FINANCE_POINTS.filter(
        (p) => activeLayers.has(p.type + "s") || activeLayers.has(p.type),
      );
      baseMarkers = [...baseMarkers, ...financeMarkers];
    }

    // 3. Live Universal Telemetry (Flights & Vessels)
    if (activeLayers.has("Aviation") || activeLayers.has("Military Activity") || activeLayers.has("AIR CARGO ROUTES") || activeLayers.has("AVIATION")) {
      trackingData.flights.forEach(f => {
        baseMarkers.push({
          ...f,
          label: f.callsign,
          text: `${f.airline || 'Flight'} | Alt: ${f.alt}ft | Speed: ${f.speed}${f.isAPI ? 'kt (Live)' : 'kt'}`,
          type: f.isMilitary ? 'military' : 'political',
          iconType: 'plane'
        });
      });
    }

    if (activeLayers.has("Trade Routes") || activeLayers.has("MARITIME VESSELS") || activeLayers.has("Ship Traffic")) {
      trackingData.vessels.forEach(v => {
        baseMarkers.push({
          ...v,
          label: v.name,
          text: `Status: ${v.status} | Speed: ${v.speed}kn | Chokepoint: ${v.chokepoint}`,
          type: 'strategic_waterway',
          iconType: 'ship'
        });
      });
    }

    return baseMarkers;
  }, [viewMode, newsFeed, activeLayers, trackingData]);

  // RENDER HELPERS
  const GLOBE_WIDTH = windowSize.width - (isSidebarOpen ? 320 : 0);
  const GLOBE_HEIGHT = windowSize.height - 380;

  return (
    <div
      style={{
        width: "100%",
        height: "calc(100vh - 60px)",
        background: "#060a14",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* --- MAIN MONITOR HEADER --- */}
      <div
        style={{
          height: "60px",
          background: "#0d1527",
          borderBottom: "1px solid #1e2d4a",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          position: "relative",
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flex: 1,
            zIndex: 1,
          }}
        >
          {/* LEFT: Branding & Modes */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flex: 1,
            }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
              {Object.entries(MODES).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleModeChange(key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${viewMode === key ? cfg.color : "rgba(255,255,255,0.1)"}`,
                    background:
                      viewMode === key ? `${cfg.color}22` : "transparent",
                    color: viewMode === key ? cfg.color : "#5a7a9a",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "10px",
                    fontWeight: "900",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>

            <div
              style={{ width: "1px", height: "24px", background: "#1e2d4a" }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span className="live-dot" />
                <span
                  style={{
                    fontSize: "10px",
                    color: "#2ecc71",
                    fontWeight: "900",
                  }}
                >
                  LIVE
                </span>
              </div>



            </div>
          </div>

          {/* CENTER: Time & 2D/3D Toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "24px",
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#5a7a9a",
                fontWeight: "800",
                letterSpacing: "1.5px",
                background: "rgba(255,255,255,0.03)",
                padding: "6px 16px",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).toUpperCase()} IST
            </div>

            <div
              style={{
                display: "flex",
                background: "rgba(10,15,30,0.8)",
                padding: "4px",
                borderRadius: "8px",
                border: "1px solid #1e2d4a",
                gap: "4px",
              }}
            >
              <button
                onClick={() => setProjection("2d")}
                style={{
                  background: projection === "2d" ? "#2ecc71" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  color: projection === "2d" ? "#000" : "#5a7a9a",
                  padding: "4px 12px",
                  fontSize: "10px",
                  fontWeight: "900",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  zIndex: 10,
                }}
              >
                2D
              </button>
              <button
                onClick={() => setProjection("3d")}
                style={{
                  background: projection === "3d" ? "#2ecc71" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  color: projection === "3d" ? "#000" : "#5a7a9a",
                  padding: "4px 12px",
                  fontSize: "10px",
                  fontWeight: "900",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  zIndex: 10,
                }}
              >
                3D
              </button>
            </div>
          </div>

          {/* RIGHT: Search & System Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(10,15,30,0.5)",
                padding: "6px 12px",
                borderRadius: "12px",
                border: "1px solid #1e2d4a",
              }}
            >
              <Search size={14} color="#5a7a9a" />
              <input
                placeholder="Search..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: "12px",
                  width: "120px",
                }}
              />
            </div>
            <Maximize2
              size={18}
              color="#5a7a9a"
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* LEFT AI INSIGHTS SIDEBAR */}
        <motion.div
          animate={{
            x: isSidebarOpen ? 0 : -340,
            width: isSidebarOpen ? 340 : 0,
          }}
          style={{
            background: "rgba(6,11,24,0.92)",
            backdropFilter: "blur(25px)",
            borderRight: "1px solid #1e2d4a",
            display: "flex",
            flexDirection: "column",
            zIndex: 100,
            overflow: "hidden",
            position: "relative",
            flexShrink: 0,
            boxShadow: "10px 0 30px rgba(0,0,0,0.5)"
          }}
        >
          <div
            style={{
              padding: "24px 20px",
              borderBottom: "1px solid #1e2d4a",
              width: "340px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(255,255,255,0.02)"
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GlobeIcon size={16} color="#2ecc71" />
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: "900",
                  letterSpacing: "2px",
                  color: "#fff",
                  margin: 0,
                }}
              >
                DAILY INTELLIGENCE
              </h3>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "none",
                borderRadius: "4px",
                padding: "4px",
                cursor: "pointer",
              }}
            >
              <X size={16} color="#5a7a9a" />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              width: "340px",
            }}
          >
            <AiInsightsCard sidebar={true} />
          </div>

          {/* Footer Info */}
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid #1e2d4a",
              width: "340px",
              background: "rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#2ecc71",
                  boxShadow: "0 0 8px #2ecc71"
                }}
              />
              <span
                style={{ fontSize: "11px", fontWeight: "800", color: "#8aa" }}
              >
                Reality AI Engine Active
              </span>
            </div>
          </div>
        </motion.div>

        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              zIndex: 101,
              background: "#0d1527",
              border: "1px solid #1e2d4a",
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
            }}
          >
            <Menu size={20} color="#fff" />
          </button>
        )}

        {/* --- DUAL ENGINE VIEWPORT (2D/3D) --- */}
        <div
          style={{
            flex: 1,
            position: "relative",
            background: "#060a14",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {/* High-level stability & impact dashboard overlay */}
          <GlobalStabilityPanel />
          <AnimatePresence mode="wait">
            {projection === "3d" ? (
              <motion.div
                key="3d-globe"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Globe
                  ref={globeRef}
                  width={GLOBE_WIDTH}
                  height={GLOBE_HEIGHT}
                  backgroundColor="#060a1400"
                  atmosphereColor="#1a4a8a"
                  atmosphereAltitude={0.15}
                  globeImageUrl="https://unpkg.com/three-globe@2.30.0/example/img/earth-night.jpg"
                  bumpImageUrl="https://unpkg.com/three-globe@2.30.0/example/img/earth-topology.png"
                  // --- POLYGONS (Heatmap/Conflict Zones) ---
                  polygonsData={countries.features}
                  polygonCapColor={(d) => {
                    const name = d.properties.ADMIN || d.properties.NAME;
                    const conflict = CONFLICT_ZONES_POLY.find(
                      (c) => c.country === name,
                    );
                    if (
                      viewMode === "CONFLICT" &&
                      conflict &&
                      activeLayers.has("conflict_zones")
                    ) {
                      return conflict.level === "CRITICAL"
                        ? "rgba(231,76,60,0.4)"
                        : "rgba(230,126,34,0.3)";
                    }
                    return "rgba(255,255,255,0.03)";
                  }}
                  polygonSideColor={() => "rgba(0,0,0,0.1)"}
                  polygonStrokeColor={() => "rgba(255,255,255,0.08)"}
                  polygonAltitude={0.01}
                  // --- HTML MARKERS (Tactical Symbology) ---
                  htmlElementsData={markers}
                  htmlElement={(d) => {
                    const el = document.createElement('div');
                    const color = EVENT_TYPES[d.type]?.color || "#fff";

                    // Choose icon based on iconType
                    let iconSVG = '';
                    if (d.iconType === 'plane') {
                      iconSVG = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="${color}" stroke-width="3" fill="none" style="transform: rotate(${(d.direction || 0) - 45}deg); filter: drop-shadow(0 0 4px ${color})"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-1.1-.3-2.2.4-2.2 1.5l0 0c0 .6.3 1.2.8 1.5l7.3 3.3-3.3 3.3-3-.4c-.5-.1-1.1.1-1.4.5l-.3.3c-.4.4-.4 1.1 0 1.5l1.6 1.6c.4.4 1.1.4 1.5 0l.3-.3c.4-.3.6-.9.5-1.4l-.4-3 3.3-3.3 3.3 7.3c.3.5.9.8 1.5.8l0 0c1.1 0 1.8-1.1 1.5-2.2z"/></svg>`;
                    } else if (d.iconType === 'ship') {
                      iconSVG = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="${color}" stroke-width="3" fill="none" style="filter: drop-shadow(0 0 4px ${color})"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M9 12h6"/></svg>`;
                    } else {
                      iconSVG = `<div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; box-shadow: 0 0 8px ${color}"></div>`;
                    }

                    el.innerHTML = `
                      <div class="tactical-marker" style="display:flex; flex-direction:column; align-items:center; cursor:pointer">
                         ${iconSVG}
                         <div style="font-size:7px; color:#fff; font-weight:900; margin-top:2px; white-space:nowrap; text-shadow:0 1px 2px #000; background:rgba(0,0,0,0.4); padding: 1px 4px; border-radius:2px">${d.label?.toUpperCase()}</div>
                      </div>
                    `;
                    el.onclick = () => {
                      // High-fidelity tooltip logic
                      const tooltip = document.createElement('div');
                      tooltip.style.cssText = `background:#0d1527; padding:12px; border:1px solid ${color}; border-radius:8px; pointer-events:none; z-index:1000; color:#fff; font-size:11px`;
                      tooltip.innerHTML = `<strong>${d.label}</strong><br/>${d.text}`;
                      // Simple click to show detail panel if applicable
                      if (d.data) setSelectedRoute(d.data);
                    };
                    return el;
                  }}
                  htmlLat="lat"
                  htmlLng="lng"
                  htmlAltitude={0.02}

                  // --- ARCS (Aviation / Trade) ---
                  arcsData={[
                    ...(viewMode === "SUPPLY_CHAIN" ? supplyChainData.arcs : []),
                    ...(viewMode === "COMMODITIES" && activeLayers.has("trade_routes")
                      ? TRADE_DATA.slice(0, 30).map((t) => {
                        const sCoords = FINANCE_POINTS[Math.floor(Math.random() * FINANCE_POINTS.length)];
                        return {
                          startLat: sCoords.lat,
                          startLng: sCoords.lng,
                          endLat: 35 + Math.random() * 10,
                          endLng: 104 + Math.random() * 10,
                          color: ["#f1c40f22", "#f1c40fcc", "#f1c40f22"]
                        };
                      })
                      : [])
                  ]}
                  arcColor={(d) => d.color}
                  arcDashLength={0.4}
                  arcDashGap={0.2}
                  arcDashAnimateTime={2000}
                  arcStroke={0.5}
                  onArcClick={(d) => d.data && setSelectedRoute(d.data)}

                  // --- PATHS (Pipelines / Maritime) ---
                  pathsData={[
                    ...(viewMode === "SUPPLY_CHAIN" ? supplyChainData.paths : []),
                    ...(viewMode === "SUPPLY_CHAIN" && activeLayers.has("Pipelines")
                      ? COMMODITY_LINES.filter((l) => l.type === "pipeline").map((l) => ({
                        path: [[l.startLat, l.startLng], [l.endLat, l.endLng]],
                        color: l.color,
                        name: l.name,
                      }))
                      : [])
                  ]}
                  pathColor={(d) => d.color}
                  pathStroke={2}
                  pathDashArray={[1, 1]}
                  pathDashAnimateTime={4000}
                  onPathClick={(d) => d.data && setSelectedRoute(d.data)}
                  pathLabel={(d) =>
                    `<div style="color:${d.color};font-weight:900;background:rgba(0,0,0,0.8);padding:4px 8px;border-radius:4px">${d.name || d.data?.corridor}</div>`
                  }
                  onPolygonClick={(d) => setSelectedCountry(d.properties)}
                />

                {/* --- SELECTED ROUTE INTEL PANEL --- */}
                <AnimatePresence>
                  {selectedRoute && (
                    <motion.div
                      initial={{ x: 400, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 400, opacity: 0 }}
                      style={{
                        position: 'absolute',
                        right: '20px',
                        top: '100px',
                        width: '300px',
                        background: 'rgba(13,21,39,0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid #1e2d4a',
                        borderRadius: '16px',
                        padding: '20px',
                        zIndex: 200,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '10px', color: '#f1c40f', fontWeight: '900', letterSpacing: '1px' }}>SUPPLY CHAIN INTEL</div>
                        <X size={16} color="#5a7a9a" onClick={() => setSelectedRoute(null)} style={{ cursor: 'pointer' }} />
                      </div>

                      <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '900', color: '#fff' }}>
                        {selectedRoute.source} → {selectedRoute.target}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#5a7a9a', marginBottom: '16px', fontWeight: '800' }}>{selectedRoute.corridor}</div>

                      <div style={{ display: 'grid', gap: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px' }}>
                          <div style={{ fontSize: '10px', color: '#5a7a9a', marginBottom: '4px' }}>CARGO SPECIFICATIONS</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {selectedRoute.goods.map(g => (
                              <span key={g} style={{ background: '#f1c40f22', color: '#f1c40f', padding: '2px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '900' }}>{g}</span>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px' }}>
                            <div style={{ fontSize: '10px', color: '#5a7a9a', marginBottom: '4px' }}>VALUE</div>
                            <div style={{ fontSize: '13px', fontWeight: '900', color: '#2ecc71' }}>{selectedRoute.value}</div>
                          </div>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px' }}>
                            <div style={{ fontSize: '10px', color: '#5a7a9a', marginBottom: '4px' }}>VOLUME</div>
                            <div style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>{selectedRoute.volume}</div>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)', padding: '10px', borderRadius: '10px' }}>
                          <div style={{ fontSize: '10px', color: '#e74c3c', marginBottom: '4px' }}>RISC COEFFICIENT</div>
                          <div style={{ fontSize: '11px', color: '#fff', fontWeight: '800' }}>{selectedRoute.risk_factors}</div>
                        </div>
                      </div>

                      <button
                        style={{ width: '100%', marginTop: '20px', background: '#f1c40f', color: '#000', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '900', fontSize: '11px', cursor: 'pointer' }}
                        onClick={() => navigate('/analysis')}
                      >
                        GENERATE SUPPLY CHAIN REPORT
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="2d-map"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  cursor: "grab",
                }}
              >
                <TransformWrapper
                  initialScale={1}
                  initialPositionX={0}
                  initialPositionY={0}
                  minScale={0.5}
                  maxScale={8}
                >
                  <TransformComponent
                    wrapperStyle={{ width: "100%", height: "100%" }}
                  >
                    <div
                      style={{
                        width: GLOBE_WIDTH,
                        height: GLOBE_HEIGHT,
                        position: "relative",
                      }}
                    >
                      {/* Tactical 2D Background */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundImage: `url('https://unpkg.com/three-globe@2.30.0/example/img/earth-night.jpg')`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          opacity: 0.2,
                          filter: "grayscale(100%) brightness(30%)",
                        }}
                      />

                      {/* 2D Projection Grid */}
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 1000 500"
                        preserveAspectRatio="xMidYMid slice"
                        style={{ position: "relative", zIndex: 1 }}
                      >
                        <defs>
                          <pattern
                            id="grid"
                            width="50"
                            height="50"
                            patternUnits="userSpaceOnUse"
                          >
                            <path
                              d="M 50 0 L 0 0 0 50"
                              fill="none"
                              stroke="rgba(255,255,255,0.05)"
                              strokeWidth="0.5"
                            />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* 2D Country Outlines */}
                        {countries.features.map((f, i) => {
                          const drawFeature = (coords, type) => {
                            const project = (c) =>
                              `${(c[0] + 180) * (1000 / 360)},${(90 - c[1]) * (500 / 180)}`;
                            if (type === "Polygon") {
                              return `M ${coords[0].map(project).join(" L ")} Z`;
                            } else if (type === "MultiPolygon") {
                              return coords
                                .map(
                                  (poly) =>
                                    `M ${poly[0].map(project).join(" L ")} Z`,
                                )
                                .join(" ");
                            }
                            return "";
                          };

                          const name = f.properties.ADMIN || f.properties.NAME;
                          const conflict = CONFLICT_ZONES_POLY.find(
                            (c) => c.country === name,
                          );
                          let fill = "rgba(255,255,255,0.03)";
                          if (
                            viewMode === "CONFLICT" &&
                            conflict &&
                            activeLayers.has("conflict_zones")
                          ) {
                            fill =
                              conflict.level === "CRITICAL"
                                ? "rgba(231,76,60,0.3)"
                                : "rgba(230,126,34,0.2)";
                          }

                          return (
                            <path
                              key={i}
                              d={drawFeature(
                                f.geometry.coordinates,
                                f.geometry.type,
                              )}
                              fill={fill}
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="0.5"
                              style={{ transition: "fill 0.3s" }}
                            />
                          );
                        })}

                        {/* 2D Supply Chain Routes (Maritime & Aviation) */}
                        {viewMode === "SUPPLY_CHAIN" && (
                          <>
                            {/* Aviation Arcs (2D) */}
                            {activeLayers.has("Aviation") &&
                              supplyChainData.arcs.map((arc, i) => {
                                const x1 = (arc.startLng + 180) * (1000 / 360);
                                const y1 = (90 - arc.startLat) * (500 / 180);
                                const x2 = (arc.endLng + 180) * (1000 / 360);
                                const y2 = (90 - arc.endLat) * (500 / 180);
                                // Draw a simple curve for aviation in 2D
                                const cx = (x1 + x2) / 2;
                                const cy = Math.min(y1, y2) - 30; // Control point for curve
                                return (
                                  <path
                                    key={`arc-2d-${i}`}
                                    d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                                    stroke="#f1c40f"
                                    strokeWidth="1"
                                    fill="none"
                                    strokeDasharray="2,1"
                                    style={{ cursor: 'pointer', opacity: 0.6 }}
                                    onClick={() => setSelectedRoute(arc.data)}
                                  />
                                );
                              })}

                            {/* Maritime Paths (2D) */}
                            {activeLayers.has("Trade Routes") &&
                              supplyChainData.paths.map((p, i) => {
                                const pathPoints = p.path.map((coord) => {
                                  const x = (coord[1] + 180) * (1000 / 360);
                                  const y = (90 - coord[0]) * (500 / 180);
                                  return `${x},${y}`;
                                }).join(" L ");
                                return (
                                  <path
                                    key={`path-2d-${i}`}
                                    d={`M ${pathPoints}`}
                                    stroke="#1abc9c"
                                    strokeWidth="1.5"
                                    fill="none"
                                    style={{ cursor: 'pointer', opacity: 0.8 }}
                                    onClick={() => setSelectedRoute(p.data)}
                                  >
                                    <title>{p.data?.corridor}</title>
                                  </path>
                                );
                              })}
                          </>
                        )}

                        {/* 2D Paths (Pipelines / Energy) */}
                        {(viewMode === "SUPPLY_CHAIN" || viewMode === "COMMODITIES") &&
                          activeLayers.has("Pipelines") &&
                          COMMODITY_LINES.map((l, i) => {
                            const x1 = (l.startLng + 180) * (1000 / 360);
                            const y1 = (90 - l.startLat) * (500 / 180);
                            const x2 = (l.endLng + 180) * (1000 / 360);
                            const y2 = (90 - l.endLat) * (500 / 180);
                            return (
                              <line
                                key={`pipe-2d-${i}`}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={l.color}
                                strokeWidth="1.5"
                                strokeDasharray="4,2"
                                style={{ opacity: 0.8 }}
                              />
                            );
                          })}

                        {/* 2D Markers (Tactical Symbology) */}
                        {markers.map((m, i) => {
                          const x = (m.lng + 180) * (1000 / 360);
                          const y = (90 - m.lat) * (500 / 180);
                          const color = EVENT_TYPES[m.type]?.color || "#fff";

                          let symbol = null;
                          if (m.iconType === 'plane') {
                            symbol = (
                              <path
                                d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"
                                fill={color}
                                transform={`translate(${x - 6}, ${y - 6}) scale(0.5) rotate(${(m.direction || 0) + 180}, 12, 12)`}
                                style={{ filter: `drop-shadow(0 0 3px ${color})` }}
                              />
                            );
                          } else if (m.iconType === 'ship') {
                            symbol = (
                              <path
                                d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
                                fill={color}
                                transform={`translate(${x - 5}, ${y - 5}) scale(0.4)`}
                                style={{ filter: `drop-shadow(0 0 3px ${color})` }}
                              />
                            );
                          } else {
                            symbol = (
                              <circle cx={x} cy={y} r="3" fill={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
                                <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                              </circle>
                            );
                          }

                          return (
                            <g key={`marker-2d-${i}`} style={{ cursor: 'pointer' }}>
                              {symbol}
                              <text x={x + 6} y={y + 3} fill="#fff" fontSize="5" fontWeight="900" style={{ letterSpacing: "0.5px", textShadow: '0 1px 2px #000' }}>
                                {m.label?.toUpperCase()}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </TransformComponent>
                </TransformWrapper>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tactical Overlays */}
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              display: "flex",
              gap: "8px",
              zIndex: 10,
            }}
          >
            <button
              style={{
                background: "rgba(13,21,39,0.8)",
                border: "1px solid #1e2d4a",
                borderRadius: "8px",
                padding: "8px",
                cursor: "pointer",
              }}
              onClick={() => {
                if (globeRef.current) {
                  globeRef.current.pointOfView(
                    { lat: 0, lng: 0, altitude: 2.5 },
                    1000,
                  );
                }
              }}
              title="Reset View"
            >
              <TrendingUp size={16} color="#fff" />
            </button>
          </div>

          {/* RIGHT SIDEBAR TRIGGER & TOOLS */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: isRightSidebarOpen ? "340px" : "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              zIndex: 101,
              transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              alignItems: "flex-end"
            }}
          >
            {!isRightSidebarOpen && (
              <button
                onClick={() => setIsRightSidebarOpen(true)}
                style={{
                  width: "40px",
                  height: "40px",
                  background: "rgba(13,21,39,0.9)",
                  border: "1px solid #1e2d4a",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Layers size={20} color="#fff" />
              </button>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                style={{
                  width: "40px",
                  height: "40px",
                  background: "rgba(13,21,39,0.9)",
                  border: "1px solid #1e2d4a",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: "900",
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (globeRef.current) {
                    const pov = globeRef.current.pointOfView();
                    globeRef.current.pointOfView(
                      { altitude: Math.max(0.2, pov.altitude - 0.4) },
                      300,
                    );
                  }
                }}
              >
                +
              </button>
              <button
                style={{
                  width: "40px",
                  height: "40px",
                  background: "rgba(13,21,39,0.9)",
                  border: "1px solid #1e2d4a",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: "900",
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (globeRef.current) {
                    const pov = globeRef.current.pointOfView();
                    globeRef.current.pointOfView(
                      { altitude: Math.min(5, pov.altitude + 0.4) },
                      300,
                    );
                  }
                }}
              >
                -
              </button>
              <button
                style={{
                  width: "40px",
                  height: "40px",
                  background: "rgba(13,21,39,0.9)",
                  border: "1px solid #1e2d4a",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (globeRef.current) {
                    globeRef.current.pointOfView(
                      { lat: 0, lng: 0, altitude: 2.5 },
                      1000,
                    );
                  }
                }}
              >
                <Crosshair size={18} color="#fff" />
              </button>
            </div>
          </div>

          {/* RIGHT LAYERS SIDEBAR */}
          <motion.div
            animate={{
              x: isRightSidebarOpen ? 0 : 320,
              width: isRightSidebarOpen ? 320 : 0,
            }}
            initial={{ x: 320, width: 0 }}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              background: "rgba(6,11,24,0.9)",
              backdropFilter: "blur(20px)",
              borderLeft: "1px solid #1e2d4a",
              display: "flex",
              flexDirection: "column",
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "24px 20px",
                borderBottom: "1px solid #1e2d4a",
                width: "320px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <h3
                style={{
                  fontSize: "12px",
                  fontWeight: "900",
                  letterSpacing: "2px",
                  color: "#5a7a9a",
                  margin: 0,
                }}
              >
                MAP LAYERS
              </h3>
              <button
                onClick={() => setIsRightSidebarOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={16} color="#5a7a9a" />
              </button>
            </div>

            <div style={{ padding: "16px 20px" }}>
              <div
                style={{
                  background: "#0a1020",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  border: "1px solid #1e2d4a",
                }}
              >
                <Search size={14} color="#5a7a9a" />
                <input
                  placeholder="Search layers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#fff",
                    fontSize: "12px",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 10px 20px",
                width: "320px",
              }}
            >
              {visibleLayers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: activeLayers.has(layer.id)
                      ? "rgba(46, 204, 113, 0.1)"
                      : "transparent",
                    marginBottom: "4px"
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "4px",
                      border: "1px solid #1e2d4a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: activeLayers.has(layer.id)
                        ? "#2ecc71"
                        : "transparent",
                    }}
                  >
                    {activeLayers.has(layer.id) && (
                      <Check size={10} color="#000" strokeWidth={4} />
                    )}
                  </div>
                  <div
                    style={{
                      color: activeLayers.has(layer.id) ? "#fff" : "#5a7a9a",
                      fontSize: "11px",
                      fontWeight: "700",
                      flex: 1,
                    }}
                  >
                    {layer.label}
                  </div>
                  <div style={{ color: "#5a7a9a" }}>{layer.icon}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- BOTTOM DASHBOARDS --- */}
      <WidgetPanel viewMode={viewMode} newsFeed={newsFeed} />

      <style>{`
        .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #2ecc71; animation: livePulse 1.5s infinite; }
        @keyframes livePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2d4a; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// Sub-component help
function Check({ size, color, strokeWidth }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
