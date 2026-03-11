import React, { useEffect, useRef, useState, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { useNavigate } from 'react-router-dom';

// ── Event Types ─────────────────────────────────────────────────────────────
const EVENT_TYPES = {
  military:   { color: '#e74c3c', label: 'Military Strike' },
  naval:      { color: '#3498db', label: 'Naval Incident' },
  protest:    { color: '#e67e22', label: 'Civil Unrest' },
  missile:    { color: '#c0392b', label: 'Missile Launch' },
  terrorism:  { color: '#8e1c1c', label: 'Terrorism' },
  political:  { color: '#9b59b6', label: 'Political Crisis' },
  economic:   { color: '#27ae60', label: 'Economic Shock' },
  nuclear:    { color: '#f39c12', label: 'Nuclear Alert' },
  fire:       { color: '#e67e22', label: 'Infrastructure Attack' },
  blockade:   { color: '#1abc9c', label: 'Shipping Disruption' },
};

// ── Conflict Markers (with types) ─────────────────────────────────────────────
const CONFLICT_MARKERS = [
  { lat: 48.5,  lng: 31.2,  type: 'military',  country: 'Ukraine',      title: 'Ukraine Frontline', news: 'Russian missile barrage hits Ukrainian energy grid in overnight attack. Power outages affect 3M+ residents.' },
  { lat: 50.4,  lng: 30.5,  type: 'missile',   country: 'Ukraine',      title: 'Kyiv Strike Alert', news: 'Air defense intercepts 14 Shahed drones targeting Kyiv. Debris causes minor damage in suburbs.' },
  { lat: 31.5,  lng: 34.5,  type: 'military',  country: 'Israel',       title: 'Gaza Operations', news: 'IDF reports operations ongoing in northern Gaza. Ceasefire talks in Cairo remain stalled.' },
  { lat: 32.0,  lng: 34.8,  type: 'missile',   country: 'Israel',       title: 'Tel Aviv Alert', news: 'Iron Dome intercepts ballistic missile fired from Yemen. No casualties reported.' },
  { lat: 32.5,  lng: 51.7,  type: 'nuclear',   country: 'Iran',         title: 'Iran Nuclear', news: 'IAEA reports Iran enriching uranium to 83.7% purity at Fordow — near weapons-grade threshold.' },
  { lat: 14.5,  lng: 48.5,  type: 'blockade',  country: 'Yemen',        title: 'Red Sea Attack', news: 'Houthi forces claim responsibility for drone attack on US-flagged tanker near Bab el-Mandeb.' },
  { lat: 15.5,  lng: 44.3,  type: 'military',  country: 'Yemen',        title: 'Yemen Airstrike', news: 'Coalition airstrikes hit Houthi weapons depot in Sanaa. Secondary explosions visible.' },
  { lat: 15.5,  lng: 32.5,  type: 'military',  country: 'Sudan',        title: 'Sudan Civil War', news: 'RSF captures key district of El Fasher. UN warns of catastrophic famine risk for 750K civilians.' },
  { lat: 16.8,  lng: 96.1,  type: 'military',  country: 'Myanmar',      title: 'Myanmar Offensive', news: 'PDF resistance captures military airbase near Mandalay. Junta responds with airstrikes on civilian areas.' },
  { lat: 40.3,  lng: 127.5, type: 'missile',   country: 'North Korea',  title: 'DPRK ICBM Test', news: 'North Korea fires ICBM capable of striking US mainland. Joint US-South Korea exercises announced.' },
  { lat: 25.0,  lng: 121.5, type: 'military',  country: 'Taiwan',       title: 'Taiwan Strait', news: 'PLA conducts live-fire exercises in Taiwan Strait. USS Roosevelt carrier group dispatched.' },
  { lat: 9.0,   lng: 38.7,  type: 'protest',   country: 'Ethiopia',     title: 'Ethiopia Unrest', news: 'Mass protests erupt in Addis Ababa amid Amhara conflict expansion. Internet shutdown detected.' },
  { lat: 5.0,   lng: 46.3,  type: 'terrorism', country: 'Somalia',      title: 'Al-Shabaab Attack', news: 'Al-Shabaab suicide bombing at Mogadishu hotel kills 12. AU peacekeeping mission on alert.' },
  { lat: 18.9,  lng: -72.3, type: 'protest',   country: 'Haiti',        title: 'Port-au-Prince', news: 'Gang coalition deploys armored vehicles in Haiti capital. US evacuates embassy personnel.' },
  { lat: 34.8,  lng: 38.9,  type: 'political', country: 'Syria',        title: 'Syria Transition', news: 'New Syrian government signs reconstruction deal with Gulf states worth $50B over 5 years.' },
  { lat: 32.6,  lng: 57.6,  type: 'political', country: 'Iran',         title: 'Tehran Protests', news: 'Anti-government demonstrations in Tehran for 3rd consecutive day. Security forces deploy.' },
  { lat: -15.0, lng: 40.5,  type: 'terrorism', country: 'Mozambique',   title: 'Cabo Delgado', news: 'ISIS-linked rebels attack natural gas facility. TotalEnergies suspends operations indefinitely.' },
  { lat: 51.5,  lng: 31.3,  type: 'military',  country: 'Russia',       title: 'Russia Advance', news: 'Russian forces advance 8km on Zaporizhzhia axis. Ukraine requests emergency NATO resupply.' },
  { lat: 60.0,  lng: 50.0,  type: 'economic',  country: 'Russia',       title: 'Ruble Crisis', news: 'Russian ruble hits 6-month low vs USD as SWIFT restrictions expanded to 12 more banks.' },
  { lat: 24.7,  lng: 46.7,  type: 'economic',  country: 'Saudi Arabia', title: 'OPEC Decision', news: 'Saudi Arabia extends unilateral 1M bpd production cut through Q2 2026. Oil jumps 4%.' },
  { lat: 28.6,  lng: 77.2,  type: 'political', country: 'India',        title: 'India-Pakistan LOC', news: 'India-Pakistan Line of Control exchanges escalate. Both sides on heightened military alert.' },
  { lat: 50.8,  lng: 4.4,   type: 'political', country: 'Europe',       title: 'NATO Emergency', news: 'NATO emergency session called in Brussels following Baltic Sea infrastructure sabotage incidents.' },
  { lat: 35.7,  lng: 51.4,  type: 'fire',      country: 'Iran',         title: 'Iran Oil Infrastructure', news: 'Major fire at Abadan refinery following Israeli strike. Output reduced by 800K bpd.' },
  { lat: 23.7,  lng: 90.3,  type: 'protest',   country: 'Bangladesh',   title: 'Dhaka Protests', news: 'Mass protests in Dhaka over economic austerity measures. Markets halted amid unrest.' },
];



// Country conflict data
const CONFLICT_ZONES = {
  'Russia':      { level: 'CRITICAL', score: 95, emoji: '🇷🇺', events: ['Active war in Ukraine','Western sanctions','Arctic buildup'], economy: { GDP: '$1.8T', Oil: '10.5M bpd', Currency: 'RUB' }, symbol: 'RUB=X' },
  'Ukraine':     { level: 'CRITICAL', score: 92, emoji: '🇺🇦', events: ['Active frontline war','Energy grid attacks','NATO resupply ongoing'], economy: { GDP: '$160B', Exports: 'Grain/Steel/IT', Currency: 'UAH' }, symbol: 'UAH=X' },
  'Israel':      { level: 'CRITICAL', score: 90, emoji: '🇮🇱', events: ['Gaza operations','Lebanon strikes','Iran retaliation risk'], economy: { GDP: '$521B', Sector: 'Defense Tech', Currency: 'ILS' }, symbol: 'ILS=X' },
  'Iran':        { level: 'HIGH',     score: 78, emoji: '🇮🇷', events: ['Nuclear escalation','Proxy warfare','Oil sanctions'], economy: { GDP: '$413B', Oil: '3.8M bpd', Currency: 'IRR' }, symbol: 'CL=F' },
  'Sudan':       { level: 'CRITICAL', score: 88, emoji: '🇸🇩', events: ['SAF vs RSF civil war','Famine crisis','725K displaced'], economy: { GDP: '$50B', Exports: 'Gold/Cotton', Currency: 'SDG' }, symbol: 'GC=F' },
  'Yemen':       { level: 'HIGH',     score: 72, emoji: '🇾🇪', events: ['Red Sea shipping attacks','Civil war','Chokepoint risk'], economy: { GDP: '$18B', Impact: 'Red Sea trade', Currency: 'YER' }, symbol: 'CL=F' },
  'Myanmar':     { level: 'HIGH',     score: 68, emoji: '🇲🇲', events: ['Junta vs PDF resistance','60% territory lost','Exodus'], economy: { GDP: '$65B', Exports: 'Gas/Gems/Rice', Currency: 'MMK' }, symbol: 'SGX' },
  'North Korea': { level: 'HIGH',     score: 75, emoji: '🇰🇵', events: ['ICBM tests','Troops in Russia','Nuclear buildup'], economy: { GDP: '$18B', Exports: 'Arms/Coal', Currency: 'KPW' }, symbol: 'JPY=X' },
  'China':       { level: 'MEDIUM',   score: 50, emoji: '🇨🇳', events: ['Taiwan pressure','South China Sea','Trade war ongoing'], economy: { GDP: '$17.7T', Exports: 'Electronics', Currency: 'CNY' }, symbol: 'CNY=X' },
  'Taiwan':      { level: 'MEDIUM',   score: 52, emoji: '🇹🇼', events: ['PLA military pressure','Semiconductor risk','Blockade drills'], economy: { GDP: '$790B', Sector: 'Semiconductors (TSMC)', Currency: 'TWD' }, symbol: 'TWD=X' },
  'Somalia':     { level: 'HIGH',     score: 70, emoji: '🇸🇴', events: ['Al-Shabaab insurgency','Horn of Africa piracy','Famine risk'], economy: { GDP: '$8B', Exports: 'Livestock', Currency: 'SOS' }, symbol: 'CL=F' },
  'Syria':       { level: 'HIGH',     score: 65, emoji: '🇸🇾', events: ['Post-Assad transition','Reconstruction phase','ISIS remnants'], economy: { GDP: '$25B', Exports: 'Oil (pre-war)', Currency: 'SYP' }, symbol: 'CL=F' },
  'Haiti':       { level: 'HIGH',     score: 69, emoji: '🇭🇹', events: ['Gang governance','Failed state risk','UN mission'], economy: { GDP: '$20B', Income: 'Remittances 37%', Currency: 'HTG' }, symbol: 'CL=F' },
  'Ethiopia':    { level: 'HIGH',     score: 65, emoji: '🇪🇹', events: ['Amhara insurgency','Oromia conflict','Economic strain'], economy: { GDP: '$111B', Exports: 'Coffee/Gold/Flowers', Currency: 'ETB' }, symbol: 'GC=F' },
  'Libya':       { level: 'MEDIUM',   score: 56, emoji: '🇱🇾', events: ['Dual government','Wagner presence','Oil blockades'], economy: { GDP: '$38B', Oil: '1.2M bpd', Currency: 'LYD' }, symbol: 'CL=F' },
  'Venezuela':   { level: 'MEDIUM',   score: 52, emoji: '🇻🇪', events: ['US sanctions','Mass emigration 7M+','Opposition crackdown'], economy: { GDP: '$69B', Oil: '0.8M bpd (collapsed)', Currency: 'VES' }, symbol: 'CL=F' },
  'Pakistan':    { level: 'MEDIUM',   score: 55, emoji: '🇵🇰', events: ['TTP border terrorism','IMF bailout','India-Pakistan LOC'], economy: { GDP: '$370B', Exports: 'Textiles/Rice', Currency: 'PKR' }, symbol: 'PKR=X' },
  'Mozambique':  { level: 'MEDIUM',   score: 50, emoji: '🇲🇿', events: ['ISIS-linked insurgency','Cabo Delgado attacks','Gas suspension'], economy: { GDP: '$15B', Reserves: 'Nat. gas/Coal', Currency: 'MZN' }, symbol: 'CL=F' },
};

const LEVEL_COLOR = { CRITICAL: '#e74c3c', HIGH: '#e67e22', MEDIUM: '#f1c40f', LOW: '#3498db' };
const LEVEL_FILL  = { CRITICAL: 'rgba(231,76,60,0.75)', HIGH: 'rgba(230,126,34,0.65)', MEDIUM: 'rgba(241,196,15,0.50)', LOW: 'rgba(52,152,219,0.25)' };

// Active filter tabs (regions)
const REGION_TABS = ['All', 'Ukraine', 'Middle East', 'Africa', 'Asia Pacific', 'Americas'];

const MARKER_REGION = {
  Ukraine: ['Ukraine','Russia'], 'Middle East': ['Israel','Iran','Yemen','Syria','Saudi Arabia'],
  Africa: ['Sudan','Ethiopia','Somalia','Mozambique','Libya'], 'Asia Pacific': ['Myanmar','North Korea','China','Taiwan','India','Bangladesh'],
  Americas: ['Haiti','Venezuela'],
};

// ── Major Shipping Lanes ─────────────────────────────────────────────────────
const SHIPPING_ROUTES = [
  // Transpacific — Asia to US West Coast
  { name: 'Transpacific (Shanghai → Los Angeles)', startLat: 31.2, startLng: 121.5, endLat: 33.7, endLng: -118.2 },
  { name: 'Transpacific (Tokyo → Seattle)', startLat: 35.7, startLng: 139.7, endLat: 47.6, endLng: -122.3 },
  // Transatlantic — Europe to US East Coast
  { name: 'Transatlantic (Rotterdam → New York)', startLat: 51.9, startLng: 4.5, endLat: 40.7, endLng: -74.0 },
  { name: 'Transatlantic (Hamburg → Halifax)', startLat: 53.5, startLng: 10.0, endLat: 44.6, endLng: -63.6 },
  // Suez Canal route — Asia to Europe
  { name: 'Suez Route (Singapore → Rotterdam)', startLat: 1.3, startLng: 103.8, endLat: 29.9, endLng: 32.6 },
  { name: 'Suez Route (Suez → Rotterdam)', startLat: 29.9, startLng: 32.6, endLat: 51.9, endLng: 4.5 },
  // Cape of Good Hope — Africa bypass
  { name: 'Cape Route (Shanghai → London via Cape)', startLat: 31.2, startLng: 121.5, endLat: -34.0, endLng: 18.5 },
  { name: 'Cape Route (Cape → Rotterdam)', startLat: -34.0, startLng: 18.5, endLat: 51.9, endLng: 4.5 },
  // Persian Gulf oil routes
  { name: 'Persian Gulf → Malacca (Oil)', startLat: 26.2, startLng: 56.3, endLat: 1.3, endLng: 104.0 },
  { name: 'Persian Gulf → Suez (Oil)', startLat: 26.2, startLng: 56.3, endLat: 29.9, endLng: 32.6 },
  { name: 'Persian Gulf → Cape (Oil)', startLat: 26.2, startLng: 56.3, endLat: -34.0, endLng: 18.5 },
  // Red Sea / Bab el-Mandeb
  { name: 'Red Sea (Aden → Suez)', startLat: 11.8, startLng: 43.1, endLat: 29.9, endLng: 32.6 },
  // Panama Canal
  { name: 'Panama Canal (Pacific → Atlantic)', startLat: 8.9, startLng: -79.6, endLat: 40.7, endLng: -74.0 },
  { name: 'Panama Canal (Asia → US East)', startLat: 22.3, startLng: 114.2, endLat: 8.9, endLng: -79.6 },
  // Strait of Malacca
  { name: 'Malacca (India → Singapore)', startLat: 7.1, startLng: 79.9, endLat: 1.3, endLng: 103.8 },
  // Australia routes
  { name: 'Australia → Asia (Iron ore)', startLat: -32.0, startLng: 115.8, endLat: 31.2, endLng: 121.5 },
  // China → Europe Northern Sea Route
  { name: 'N. Sea Route (Shanghai → Rotterdam)', startLat: 31.2, startLng: 121.5, endLat: 51.9, endLng: 4.5 },
  // South America
  { name: 'Brazil → China (Soy/Iron)', startLat: -23.5, startLng: -46.6, endLat: 31.2, endLng: 121.5 },
  { name: 'Brazil → Rotterdam', startLat: -23.5, startLng: -46.6, endLat: 51.9, endLng: 4.5 },
  // Africa coastal
  { name: 'West Africa → Europe (Oil)', startLat: 4.0, startLng: 9.7, endLat: 51.5, endLng: -0.1 },
];

// ── Major Flight Corridors ────────────────────────────────────────────────────
const FLIGHT_ROUTES = [
  // Transatlantic
  { name: 'London ↔ New York', startLat: 51.5, startLng: -0.1, endLat: 40.7, endLng: -74.0 },
  { name: 'Paris ↔ New York', startLat: 48.9, startLng: 2.5, endLat: 40.7, endLng: -74.0 },
  { name: 'Frankfurt ↔ New York', startLat: 50.0, startLng: 8.6, endLat: 40.7, endLng: -74.0 },
  { name: 'London ↔ Los Angeles', startLat: 51.5, startLng: -0.1, endLat: 34.0, endLng: -118.2 },
  // Transpacific
  { name: 'Los Angeles ↔ Tokyo', startLat: 34.0, startLng: -118.2, endLat: 35.7, endLng: 139.7 },
  { name: 'Los Angeles ↔ Shanghai', startLat: 34.0, startLng: -118.2, endLat: 31.2, endLng: 121.5 },
  { name: 'San Francisco ↔ Seoul', startLat: 37.6, startLng: -122.4, endLat: 37.6, endLng: 127.0 },
  { name: 'Seattle ↔ Tokyo', startLat: 47.6, startLng: -122.3, endLat: 35.7, endLng: 139.7 },
  // Dubai hub
  { name: 'Dubai ↔ London', startLat: 25.3, startLng: 55.4, endLat: 51.5, endLng: -0.1 },
  { name: 'Dubai ↔ New York', startLat: 25.3, startLng: 55.4, endLat: 40.7, endLng: -74.0 },
  { name: 'Dubai ↔ Singapore', startLat: 25.3, startLng: 55.4, endLat: 1.4, endLng: 104.0 },
  { name: 'Dubai ↔ Melbourne', startLat: 25.3, startLng: 55.4, endLat: -37.8, endLng: 144.9 },
  // Europe ↔ Asia
  { name: 'Frankfurt ↔ Singapore', startLat: 50.0, startLng: 8.6, endLat: 1.4, endLng: 104.0 },
  { name: 'London ↔ Hong Kong', startLat: 51.5, startLng: -0.1, endLat: 22.3, endLng: 114.2 },
  { name: 'Amsterdam ↔ Kuala Lumpur', startLat: 52.3, startLng: 4.8, endLat: 3.1, endLng: 101.7 },
  // North America ↔ Asia
  { name: 'Toronto ↔ Tokyo', startLat: 43.7, startLng: -79.4, endLat: 35.7, endLng: 139.7 },
  // Australia
  { name: 'Sydney ↔ London', startLat: -33.9, startLng: 151.2, endLat: 51.5, endLng: -0.1 },
  { name: 'Sydney ↔ Hong Kong', startLat: -33.9, startLng: 151.2, endLat: 22.3, endLng: 114.2 },
  // Polar routes
  { name: 'New York ↔ Beijing (polar)', startLat: 40.7, startLng: -74.0, endLat: 40.0, endLng: 116.4 },
  { name: 'Chicago ↔ Tokyo (polar)', startLat: 41.9, startLng: -87.6, endLat: 35.7, endLng: 139.7 },
  // South America
  { name: 'São Paulo ↔ Lisbon', startLat: -23.5, startLng: -46.6, endLat: 38.7, endLng: -9.1 },
  { name: 'New York ↔ Buenos Aires', startLat: 40.7, startLng: -74.0, endLat: -34.6, endLng: -58.4 },
];

export default function ConflictGlobe() {
  const globeRef = useRef();
  const navigate = useNavigate();
  const [countries, setCountries] = useState({ features: [] });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const NAVBAR_H = 58; // px height of the AugenBlick navbar
  const TOP_BAR_H = 48; // px height of globe's own tab bar
  const GLOBE_H = height - NAVBAR_H - TOP_BAR_H;
  const [gti, setGti] = useState(71.4);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  // activeOverlays: Set of 'shipping' | 'flights'
  const [activeOverlays, setActiveOverlays] = useState(new Set());

  const toggleOverlay = (key) => {
    setActiveOverlays(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const visibleArcs = [
    ...(activeOverlays.has('shipping') ? SHIPPING_ROUTES.map(r => ({ ...r, kind: 'shipping' })) : []),
    ...(activeOverlays.has('flights')  ? FLIGHT_ROUTES.map(r => ({ ...r, kind: 'flights' }))   : []),
  ];

  const [newsFeed, setNewsFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);

  // Fetch live news feed
  const fetchLiveFeed = useCallback(async () => {
    try {
      setFeedLoading(true);
      setFeedError(false);
      const res = await fetch('http://localhost:5000/api/live/feed');
      if (!res.ok) throw new Error('Feed fetch failed');
      const data = await res.json();
      setNewsFeed(data.news || []);
    } catch (e) {
      console.error('[LiveFeed] Error:', e.message);
      setFeedError(true);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveFeed();
    // Auto-refresh every 5 minutes
    const id = setInterval(fetchLiveFeed, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchLiveFeed]);


  // Fetch GeoJSON
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/country-polygons/ne_110m_admin_0_countries.geojson')
      .then(r => r.json())
      .then(setCountries);
  }, []);

  useEffect(() => {
    if (globeRef.current && countries.features?.length) {
      const globe = globeRef.current;
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.5;
      globe.controls().enableZoom = true;
      globe.pointOfView({ lat: 20, lng: 20, altitude: 2.0 }, 1000);
    }
  }, [countries]);

  useEffect(() => {
    const onResize = () => { setWidth(window.innerWidth); setHeight(window.innerHeight); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setGti(g => parseFloat((g + (Math.random() - 0.48) * 0.4).toFixed(1))), 2500);
    return () => clearInterval(id);
  }, []);

  const getCountryData = (d) => {
    const name = d?.properties?.ADMIN || d?.properties?.NAME || d?.properties?.name || '';
    return CONFLICT_ZONES[name] || null;
  };

  // Merge static markers with live news markers
  const filteredMarkers = (() => {
    const staticFiltered = CONFLICT_MARKERS.filter(m => {
      if (activeTab === 'All') return true;
      return MARKER_REGION[activeTab]?.includes(m.country);
    });

    const newsMarkers = newsFeed
      .filter(n => n.lat !== 20 || n.lng !== 0) // Only plot if we have a specific country match
      .map(n => ({
        lat: n.lat,
        lng: n.lng,
        type: n.type,
        // Strip emoji for internal filtering logic match
        country: n.country.replace(/[\u{1F1E0}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim(),
        title: `${n.source}: ${n.country}`,
        news: n.text,
        isLive: true
      }))
      .filter(m => {
        if (activeTab === 'All') return true;
        return MARKER_REGION[activeTab]?.includes(m.country);
      });

    return [...staticFiltered, ...newsMarkers];
  })();

  const handlePolygonClick = (d) => {
    const data = getCountryData(d);
    const name = d?.properties?.ADMIN || d?.properties?.NAME || d?.properties?.name || '';
    if (data) {
      setSelectedCountry({ name, ...data });
      globeRef.current?.controls()?.autoRotate && (globeRef.current.controls().autoRotate = false);
    }
  };

  const handleMarkerClick = (marker) => {
    // Focus globe on marker
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = false;
      globeRef.current.pointOfView({ lat: marker.lat, lng: marker.lng, altitude: 1.5 }, 800);
    }
    const countryData = CONFLICT_ZONES[marker.country];
    if (countryData) setSelectedCountry({ name: marker.country, ...countryData });
  };



  const SIDEBAR_W = 320;
  const GLOBE_W = width - SIDEBAR_W;

  return (
    <div style={{ width: '100vw', height: `${height - NAVBAR_H}px`, display: 'flex', flexDirection: 'column', background: '#0a0f1e', fontFamily: '"Inter", sans-serif', position: 'relative' }}>

      {/* ── Top Navigation Bar ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', height: '48px', background: '#0d1527', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, paddingLeft: '16px' }}>
        {/* GTI + LIVE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingRight: '24px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ecc71', display: 'inline-block', boxShadow: '0 0 8px #2ecc71', animation: 'livePulse 1.5s infinite' }} />
            <span style={{ color: '#2ecc71', fontWeight: '700', fontSize: '11px', letterSpacing: '2px' }}>LIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#5a7a9a' }}>GTI</span>
            <span style={{ color: gti > 72 ? '#e74c3c' : '#f1c40f', fontWeight: '900', fontSize: '20px', fontFamily: 'monospace' }}>{gti}</span>
          </div>
        </div>

        {/* Region Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '16px', flex: 1 }}>
          {REGION_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
              background: activeTab === tab ? '#e74c3c' : 'transparent',
              color: activeTab === tab ? '#fff' : '#5a7a9a',
              transition: 'all 0.15s',
            }}>{tab}</button>
          ))}
        </div>

        {/* Overlay Toggles — Shipping & Flights */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: '10px', color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: '1px', marginRight: '2px' }}>Overlay</span>
          {[{ key: 'shipping', label: 'Shipping', color: '#1abc9c' }, { key: 'flights', label: 'Flights', color: '#a29bfe' }].map(({ key, label, color }) => (
            <button key={key} onClick={() => toggleOverlay(key)} style={{
              padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700',
              background: activeOverlays.has(key) ? color : 'transparent',
              color: activeOverlays.has(key) ? '#000' : '#5a7a9a',
              border: `1px solid ${activeOverlays.has(key) ? color : 'rgba(255,255,255,0.1)'}`,
              transition: 'all 0.15s',
            }}>
              {activeOverlays.has(key) ? '◉' : '○'} {label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px', paddingRight: '16px', fontSize: '10px', color: '#5a7a9a' }}>
          {['CRITICAL','HIGH','MEDIUM','LOW'].map(l => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: LEVEL_COLOR[l], display: 'inline-block' }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Globe + Event Type Legend */}
        <div style={{ width: GLOBE_W, position: 'relative' }}>
          <Globe
            ref={globeRef}
            width={GLOBE_W}
            height={GLOBE_H}
            backgroundColor="#0a0f1e"
            atmosphereColor="#1a4a8a"
            atmosphereAltitude={0.15}
            globeImageUrl="https://unpkg.com/three-globe@2.30.0/example/img/earth-night.jpg"
            bumpImageUrl="https://unpkg.com/three-globe@2.30.0/example/img/earth-topology.png"
            polygonsData={countries.features || []}
            polygonCapColor={(d) => {
              const data = getCountryData(d);
              return data ? LEVEL_FILL[data.level] : 'rgba(255,255,255,0.04)';
            }}
            polygonSideColor={() => 'rgba(0,0,0,0.5)'}
            polygonStrokeColor={() => 'rgba(255,255,255,0.06)'}
            polygonAltitude={(d) => {
              const data = getCountryData(d);
              if (!data) return 0.002;
              return { CRITICAL: 0.02, HIGH: 0.012, MEDIUM: 0.006, LOW: 0.003 }[data.level] || 0.002;
            }}
            polygonLabel={(d) => {
              const data = getCountryData(d);
              const name = d?.properties?.ADMIN || d?.properties?.NAME || d?.properties?.name || '';
              if (!data) return `<div style="background:#0d1527;padding:6px 10px;border-radius:6px;color:#5a7a9a;font-size:12px;border:1px solid #1e2d4a">${name}</div>`;
              return `<div style="background:#0a1020;padding:10px 14px;border-radius:10px;border:1px solid ${LEVEL_COLOR[data.level]}44;min-width:200px">
                <div style="font-weight:800;font-size:14px;color:#fff;margin-bottom:6px">${name}</div>
                <div style="background:${LEVEL_COLOR[data.level]};color:#fff;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;display:inline-block;margin-bottom:8px">${data.level} — ${data.score}/100</div>
                <div style="font-size:11px;color:#8aa;line-height:1.5">${data.events[0]}</div>
              </div>`;
            }}
            onPolygonClick={handlePolygonClick}
            // ── Incident markers ──
            pointsData={filteredMarkers}
            pointLat="lat"
            pointLng="lng"
            pointColor={(d) => (EVENT_TYPES[d.type] || EVENT_TYPES.military).color}
            pointRadius={(d) => (hoveredMarker?.title === d.title ? 0.6 : 0.4)}
            pointAltitude={0.01}
            pointLabel={() => ''}
            onPointHover={(d) => setHoveredMarker(d || null)}
            onPointClick={(d) => handleMarkerClick(d)}
            // ── Shipping & Flight arcs ──
            arcsData={visibleArcs}
            arcStartLat="startLat"
            arcStartLng="startLng"
            arcEndLat="endLat"
            arcEndLng="endLng"
            arcColor={(d) => d.kind === 'shipping'
              ? ['rgba(26,188,156,0)', 'rgba(26,188,156,0.9)', 'rgba(26,188,156,0)']
              : ['rgba(162,155,254,0)', 'rgba(162,155,254,0.9)', 'rgba(162,155,254,0)']
            }
            arcDashLength={0.3}
            arcDashGap={0.15}
            arcDashAnimateTime={(d) => d.kind === 'shipping' ? 4000 : 2500}
            arcStroke={(d) => d.kind === 'shipping' ? 0.5 : 0.35}
            arcLabel={(d) => `<div style="background:#0a1020;padding:6px 10px;border-radius:6px;color:#fff;font-size:12px;border:1px solid ${
              d.kind === 'shipping' ? '#1abc9c' : '#a29bfe'}44">${d.name}</div>`}
          />

          {/* Event Type Legend */}
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(10,15,30,0.88)', backdropFilter: 'blur(10px)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 14px', fontSize: '11px', zIndex: 5 }}>
            {Object.entries(EVENT_TYPES).map(([key, { color, label }]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8aa', whiteSpace: 'nowrap' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                <span>{label}</span>
              </div>
            ))}
          </div>


        </div>

        {/* ── Right News Feed Panel ────────────────────────── */}
        <div style={{ width: SIDEBAR_W, background: '#0d1527', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Panel Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '800', color: '#fff', fontSize: '15px' }}>
                <span style={{ color: '#e74c3c' }}>⬤</span> Intelligence Feed
              </div>
              <div style={{ fontSize: '10px', color: '#5a7a9a', marginTop: '2px' }}>Updated {new Date().toLocaleTimeString()}</div>
            </div>
            <span style={{ fontSize: '11px', color: '#3498db', cursor: 'pointer' }}>{filteredMarkers.length} events</span>
          </div>

          {/* Country Info (when selected) */}
          {selectedCountry && (
            <div style={{ padding: '14px', background: 'rgba(231,76,60,0.06)', borderBottom: `1px solid ${LEVEL_COLOR[selectedCountry.level]}33`, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>{selectedCountry.emoji} {selectedCountry.name}</div>
                  <span style={{ background: LEVEL_COLOR[selectedCountry.level], color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                    {selectedCountry.level} {selectedCountry.score}/100
                  </span>
                </div>
                <button onClick={() => setSelectedCountry(null)} style={{ background: 'none', border: 'none', color: '#5a7a9a', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                {Object.entries(selectedCountry.economy || {}).map(([k, v]) => (
                  <div key={k} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '6px 8px' }}>
                    <div style={{ fontSize: '9px', color: '#5a7a9a', textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ fontSize: '11px', color: '#fff', fontWeight: '700' }}>{v}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate(`/narrative?topic=${encodeURIComponent(selectedCountry.name)}&symbol=${selectedCountry.symbol || 'CL=F'}`)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: LEVEL_COLOR[selectedCountry.level], color: '#fff', fontWeight: '800', fontSize: '12px', letterSpacing: '0.5px' }}
              >
                ⚡ Launch Intelligence Analysis
              </button>
            </div>
          )}

          {/* News Items */}
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#1e2d4a #0d1527' }}>

            {/* Loading */}
            {feedLoading && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#5a7a9a' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⟳</div>
                <div style={{ fontSize: '12px' }}>Fetching live intelligence...</div>
              </div>
            )}

            {/* Error */}
            {!feedLoading && feedError && (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ color: '#e74c3c', fontSize: '12px', marginBottom: '10px' }}>⚠ Failed to load live feed</div>
                <button onClick={fetchLiveFeed} style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #e74c3c', background: 'transparent', color: '#e74c3c', cursor: 'pointer', fontSize: '12px' }}>
                  ↺ Retry
                </button>
              </div>
            )}

            {/* News items */}
            {!feedLoading && !feedError && newsFeed.filter(item => {
              if (activeTab === 'All') return true;
              const cleanCountry = item.country.replace(/[\u{1F1E0}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
              return MARKER_REGION[activeTab]?.includes(cleanCountry);
            }).map(item => {
              const evType = EVENT_TYPES[item.type] || EVENT_TYPES.military;
              return (
                <a
                  key={item.id}
                  href={item.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', textDecoration: 'none', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    {/* Colored dot indicator */}
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: evType.color, flexShrink: 0, marginTop: '5px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#5a7a9a' }}>{item.ago}</span>
                        <span style={{ fontSize: '10px', color: '#3498db' }}>↗ {item.source}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#7a9aaa', marginBottom: '4px', fontWeight: '600' }}>
                        {item.country.replace(/[\u{1F1E0}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()}
                      </div>
                      <div style={{ fontSize: '12px', color: '#b0c8d8', lineHeight: '1.5' }}>{item.text}</div>
                    </div>
                  </div>
                </a>
              );
            })}

            {/* Empty */}
            {!feedLoading && !feedError && newsFeed.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#5a7a9a', fontSize: '12px' }}>
                No conflict news found at this time.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Hover Tooltip (fixed — escapes canvas stacking context) ── */}
      {hoveredMarker && (() => {
        const evType = EVENT_TYPES[hoveredMarker.type] || EVENT_TYPES.military;
        return (
          <div style={{
            position: 'fixed',
            bottom: '80px',
            left: `${GLOBE_W / 2}px`,
            transform: 'translateX(-50%)',
            background: 'rgba(6,11,24,0.97)',
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
            border: `1px solid ${evType.color}88`,
            padding: '14px 18px',
            maxWidth: '440px',
            minWidth: '280px',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: `0 4px 32px ${evType.color}33, 0 0 0 1px ${evType.color}22`,
            fontFamily: '"Inter", sans-serif',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                background: evType.color,
                display: 'inline-block', flexShrink: 0,
                boxShadow: `0 0 8px ${evType.color}`,
              }} />
              <span style={{ fontWeight: '800', color: '#fff', fontSize: '14px', flex: 1 }}>
                {hoveredMarker.title}
              </span>
              <span style={{
                fontSize: '10px', color: evType.color,
                background: `${evType.color}20`,
                border: `1px solid ${evType.color}44`,
                padding: '2px 8px', borderRadius: '4px',
                fontWeight: '700', whiteSpace: 'nowrap',
              }}>
                {evType.label}
              </span>
            </div>
            <div style={{ color: '#7a9aaa', fontSize: '12.5px', lineHeight: '1.65' }}>
              {hoveredMarker.news}
            </div>
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#3a5a7a' }}>
              {hoveredMarker.country} — click to open intelligence panel
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1;box-shadow:0 0 8px #2ecc71} 50%{opacity:0.4;box-shadow:none} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes markerRing {
          0%   { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d1527; }
        ::-webkit-scrollbar-thumb { background: #1e2d4a; border-radius: 2px; }
      `}</style>
    </div>
  );
}
