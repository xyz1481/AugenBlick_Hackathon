import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { useNavigate } from 'react-router-dom';
import HISTORICAL_DATA from '../data/historicalConflicts.json';
import TRADE_DATA from '../data/trade.json';
import API_BASE_URL from '../api/config';

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
const TRADE_COUNTRY_COORDS = {
  'Russia': { lat: 61.5, lng: 105.3 }, 'China': { lat: 35.8, lng: 104.1 }, 'India': { lat: 20.5, lng: 78.9 },
  'Saudi Arabia': { lat: 23.8, lng: 45.0 }, 'United States': { lat: 37.0, lng: -95.7 }, 'Australia': { lat: -25.2, lng: 133.7 },
  'Brazil': { lat: -14.2, lng: -51.9 }, 'Canada': { lat: 56.1, lng: -106.3 }, 'Norway': { lat: 60.4, lng: 8.4 },
  'European Union': { lat: 48.0, lng: 10.0 }, 'Japan': { lat: 36.2, lng: 138.2 }, 'South Korea': { lat: 35.9, lng: 127.7 },
  'Indonesia': { lat: -0.7, lng: 113.9 }, 'Malaysia': { lat: 4.2, lng: 101.9 }, 'Vietnam': { lat: 14.0, lng: 108.2 },
  'Germany': { lat: 51.1, lng: 10.4 }, 'Taiwan': { lat: 23.6, lng: 120.9 }, 'United Arab Emirates': { lat: 23.4, lng: 53.8 },
  'Nigeria': { lat: 9.0, lng: 8.6 }, 'Angola': { lat: -11.2, lng: 17.8 }, 'Chile': { lat: -35.6, lng: -71.5 },
  'Peru': { lat: -9.1, lng: -75.0 }, 'Kazakhstan': { lat: 48.0, lng: 66.9 }, 'Turkmenistan': { lat: 38.9, lng: 59.5 },
  'Mongolia': { lat: 46.8, lng: 103.8 }, 'Mexico': { lat: 23.6, lng: -102.5 }, 'France': { lat: 46.2, lng: 2.2 },
  'Italy': { lat: 41.8, lng: 12.5 }, 'Netherlands': { lat: 52.1, lng: 5.2 }, 'Belgium': { lat: 50.5, lng: 4.4 },
  'Poland': { lat: 51.9, lng: 19.1 }, 'Spain': { lat: 40.4, lng: -3.7 }, 'Turkey': { lat: 38.9, lng: 35.2 },
  'Egypt': { lat: 26.8, lng: 30.8 }, 'South Africa': { lat: -30.5, lng: 22.9 },
  'Strait of Hormuz': { lat: 26.6, lng: 56.5 }, 'Red Sea': { lat: 15.5, lng: 43.5 }, 'Suez Canal': { lat: 29.9, lng: 32.5 },
  'Gaza': { lat: 31.4, lng: 34.4 }, 'Lebanon': { lat: 33.8, lng: 35.8 }, 'Iran': { lat: 32.4, lng: 53.6 },
  'Ukraine': { lat: 48.3, lng: 31.1 }, 'Black Sea': { lat: 43.4, lng: 34.4 }, 'Baltic Sea': { lat: 55.0, lng: 15.0 },
  'Bab el-Mandeb Strait': { lat: 12.6, lng: 43.3 }, 'Korean Peninsula': { lat: 37.6, lng: 127.5 },
  'Sahel Region': { lat: 15.0, lng: 10.0 }, 'Sudan': { lat: 12.8, lng: 30.2 }, 'Niger': { lat: 17.6, lng: 8.0 },
  'Central African Republic': { lat: 6.6, lng: 20.9 }, 'DR Congo': { lat: -4.0, lng: 21.7 }
};

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
  const [selectedYear, setSelectedYear] = useState('Live'); 
  const [isTradeMode, setIsTradeMode] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [trackingData, setTrackingData] = useState({ flights: [], vessels: [] });
  // activeOverlays: Set of 'shipping' | 'flights' | 'liveFlights' | 'liveShips'
  const [activeOverlays, setActiveOverlays] = useState(new Set(['liveFlights', 'liveShips']));

  const toggleOverlay = (key) => {
    setActiveOverlays(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const visibleArcs = useMemo(() => [
    ...(isTradeMode ? [] : activeOverlays.has('shipping') ? SHIPPING_ROUTES.map(r => ({ ...r, kind: 'shipping' })) : []),
    ...(isTradeMode ? [] : activeOverlays.has('flights')  ? FLIGHT_ROUTES.map(r => ({ ...r, kind: 'flights' }))   : []),
    ...(isTradeMode ? TRADE_DATA.map(t => {
      const s = TRADE_COUNTRY_COORDS[t.source];
      const e = TRADE_COUNTRY_COORDS[t.target];
      if (!s || !e) return null;
      return {
        ...t,
        kind: 'trade',
        startLat: s.lat, startLng: s.lng,
        endLat: e.lat, endLng: e.lng,
        name: `${t.source} → ${t.target}: ${t.goods[0]}`
      };
    }).filter(Boolean) : [])
  ], [activeOverlays, isTradeMode]);

  const [newsFeed, setNewsFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);

  // Fetch live news feed
  const fetchLiveFeed = useCallback(async () => {
    try {
      setFeedLoading(true);
      setFeedError(false);
      const res = await fetch(`${API_BASE_URL}/api/live/feed`);
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

  // Fetch live tracking (Aircraft/Ships)
  const fetchTracking = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tracking/live`);
      if (!res.ok) throw new Error('Tracking fetch failed');
      const data = await res.json();
      setTrackingData(data);
    } catch (e) {
      console.error('[Tracking] Error:', e.message);
    }
  }, []);

  useEffect(() => {
    fetchLiveFeed();
    fetchTracking();
    const feedInterval = setInterval(fetchLiveFeed, 300000); // 5 mins
    const trackInterval = setInterval(fetchTracking, 10000); // 10 secs
    return () => {
      clearInterval(feedInterval);
      clearInterval(trackInterval);
    };
  }, [fetchLiveFeed, fetchTracking]);


  // Fetch GeoJSON (Low resolution for performance)
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(r => r.json())
      .then(data => {
        // Pre-process: Inject conflict data into properties so we don't look it up 200x per frame
        const enrichedFeatures = (data.features || []).map(feat => {
          const name = feat.properties.ADMIN || feat.properties.NAME || feat.properties.name || '';
          return {
            ...feat,
            properties: {
              ...feat.properties,
              conflictData: CONFLICT_ZONES[name] || null
            }
          };
        });
        setCountries({ ...data, features: enrichedFeatures });
      })
      .catch(err => console.error('GeoJSON Load Error:', err));
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

  // Pre-processed data accessors

  // Merge static markers with live news markers (Memoized to prevent lag)
  const filteredMarkers = useMemo(() => {
    // 1. If Historical Year is selected, only show that year's data
    if (selectedYear !== 'Live') {
      return HISTORICAL_DATA
        .filter(d => d.year === parseInt(selectedYear))
        .map(n => ({
          ...n,
          cleanedCountry: n.country.replace(/[\u{1F1E0}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim(),
          isHistorical: true
        }))
        .filter(m => {
          if (activeTab === 'All') return true;
          return MARKER_REGION[activeTab]?.includes(m.cleanedCountry);
        });
    }

    // 2. Otherwise show Live + Static
    const staticFiltered = CONFLICT_MARKERS.filter(m => {
      if (activeTab === 'All') return true;
      return MARKER_REGION[activeTab]?.includes(m.country);
    });

    const newsMarkers = newsFeed
      .filter(n => n.lat !== 20 || n.lng !== 0)
      .map(n => ({
        lat: n.lat,
        lng: n.lng,
        type: n.type,
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
  }, [selectedYear, activeTab, newsFeed]);

  const handlePolygonClick = (d) => {
    const data = d.properties.conflictData;
    const name = d.properties.ADMIN || d.properties.NAME || d.properties.name || '';
    
    if (isTradeMode) {
      // Find trade connections for this country
      const connections = TRADE_DATA.filter(t => t.source === name || t.target === name);
      if (connections.length > 0) {
         setSelectedTrade({ country: name, connections });
      }
    }

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
      <div style={{ display: 'flex', alignItems: 'center', height: '48px', background: '#0d1527', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, padding: '0 16px' }}>
        {/* GTI + LIVE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingRight: '16px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ecc71', display: 'inline-block', boxShadow: '0 0 8px #2ecc71', animation: 'livePulse 1.5s infinite' }} />
            <span style={{ color: '#2ecc71', fontWeight: '700', fontSize: '11px', letterSpacing: '2px' }}>LIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#5a7a9a' }}>GTI</span>
            <span style={{ color: gti > 72 ? '#e74c3c' : '#f1c40f', fontWeight: '900', fontSize: '20px', fontFamily: 'monospace' }}>{gti}</span>
          </div>
        </div>

        {/* Time Travel Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '16px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: '10px', color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '16px' }}>Time Axis</span>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ 
              background: '#0a0f1e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '4px', fontSize: '11px', padding: '2px 6px', outline: 'none', cursor: 'pointer',
              fontWeight: '700'
            }}
          >
            <option value="Live">LIVE (2025/26)</option>
            <option value="2024">History: 2024</option>
            <option value="2023">History: 2023</option>
            <option value="2022">History: 2022</option>
            <option value="2021">History: 2021</option>
            <option value="2020">History: 2020</option>
          </select>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: '10px', color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: '1px', marginRight: '4px' }}>Overlay</span>
          {[
            { key: 'shipping', label: 'Route: Sea', color: '#1abc9c' }, 
            { key: 'flights', label: 'Route: Air', color: '#a29bfe' },
            { key: 'liveFlights', label: 'Live Air', color: '#a29bfe' },
            { key: 'liveShips', label: 'Live Sea', color: '#1abc9c' }
          ].map(({ key, label, color }) => (
            <button key={key} onClick={() => toggleOverlay(key)} style={{
              padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: '800',
              background: activeOverlays.has(key) ? color : 'transparent',
              color: activeOverlays.has(key) ? '#000' : '#5a7a9a',
              border: `1px solid ${activeOverlays.has(key) ? color : 'rgba(255,255,255,0.1)'}`,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap'
            }}>
              {activeOverlays.has(key) ? '☑' : '☐'} {label}
            </button>
          ))}
        </div>

        {/* Trade Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => { setIsTradeMode(!isTradeMode); setSelectedTrade(null); }} style={{
            padding: '5px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '800',
            background: isTradeMode ? '#27ae60' : 'transparent',
            color: isTradeMode ? '#fff' : '#5a7a9a',
            border: `1px solid ${isTradeMode ? '#27ae60' : 'rgba(255,255,255,0.1)'}`,
            transition: 'all 0.15s',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap'
          }}>
            {isTradeMode ? 'Trade Mode Active' : 'Trade Intel'}
          </button>
        </div>

        {/* Tracking Summary Integration */}
        {(activeOverlays.has('liveFlights') || activeOverlays.has('liveShips')) && (
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginLeft: 'auto', marginRight: '20px', padding: '4px 12px', background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: '6px' }}>
             {activeOverlays.has('liveFlights') && (
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="live-pulse" style={{ background: '#a29bfe' }}></span>
                  <span style={{ fontSize: '10px', color: '#a29bfe', fontWeight: '800' }}>SIGINT: {trackingData.flights?.length || 0}</span>
               </div>
             )}
             {activeOverlays.has('liveShips') && (
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="live-pulse" style={{ background: '#1abc9c' }}></span>
                  <span style={{ fontSize: '10px', color: '#1abc9c', fontWeight: '800' }}>MARINE: {trackingData.vessels?.length || 0}</span>
               </div>
             )}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.08)', fontSize: '10px', color: '#5a7a9a' }}>
          {['CRITICAL','HIGH','MEDIUM','LOW'].map(l => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: LEVEL_COLOR[l], display: 'inline-block' }} />
              <span style={{ fontSize: '9px', fontWeight: '700' }}>{l}</span>
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
              const data = d.properties.conflictData;
              return data ? LEVEL_FILL[data.level] : 'rgba(255,255,255,0.04)';
            }}
            polygonSideColor={() => 'rgba(0,0,0,0.5)'}
            polygonStrokeColor={() => 'rgba(255,255,255,0.06)'}
            polygonAltitude={(d) => {
              const data = d.properties.conflictData;
              if (!data) return 0.002;
              return { CRITICAL: 0.02, HIGH: 0.012, MEDIUM: 0.006, LOW: 0.003 }[data.level] || 0.002;
            }}
            polygonLabel={(d) => {
              const data = d.properties.conflictData;
              const name = d.properties.ADMIN || d.properties.NAME || d.properties.name || '';
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
            arcColor={(d) => {
              if (d.kind === 'trade') return ['rgba(39,174,96,0)', 'rgba(39,174,96,0.9)', 'rgba(39,174,96,0)'];
              return d.kind === 'shipping'
                ? ['rgba(26,188,156,0)', 'rgba(26,188,156,0.9)', 'rgba(26,188,156,0)']
                : ['rgba(162,155,254,0)', 'rgba(162,155,254,0.9)', 'rgba(162,155,254,0)'];
            }}
            arcDashLength={0.3}
            arcDashGap={0.15}
            arcDashAnimateTime={(d) => {
              if (d.kind === 'trade') return 3000;
              return d.kind === 'shipping' ? 4000 : 2500;
            }}
            arcStroke={(d) => d.kind === 'trade' ? 0.6 : d.kind === 'shipping' ? 0.5 : 0.35}
            arcLabel={(d) => {
              if (d.kind === 'trade') return `<div style="background:#0a1020;padding:8px 12px;border-radius:10px;border:1px solid #27ae6044;min-width:180px">
                <div style="font-weight:800;color:#27ae60;margin-bottom:4px">Trade: ${d.source} → ${d.target}</div>
                <div style="font-size:11px;color:#fff;margin-bottom:4px"><b>Goods:</b> ${d.goods.join(', ')}</div>
                <div style="font-size:11px;color:#8aa"><b>Value:</b> ${d.value}</div>
                <div style="font-size:11px;color:#8aa"><b>Corridor:</b> ${d.corridor}</div>
              </div>`;
              return `<div style="background:#0a1020;padding:6px 10px;border-radius:6px;color:#fff;font-size:12px;border:1px solid ${
                d.kind === 'shipping' ? '#1abc9c' : '#a29bfe'}44">${d.name}</div>`;
            }}
            onArcClick={(d) => {
              if (d.kind === 'trade') {
                setSelectedTrade({ country: d.source, connections: [d] });
              }
            }}
            // ── Live Tracking ──
            htmlElementsData={[
              ...(activeOverlays.has('liveFlights') ? (trackingData.flights || []) : []),
              ...(activeOverlays.has('liveShips') ? (trackingData.vessels || []) : [])
            ]}
            htmlLat="lat"
            htmlLng="lng"
            htmlElement={(d) => {
              const el = document.createElement('div');
              const isFlight = d.type === 'aircraft';
              const color = isFlight ? '#a29bfe' : '#1abc9c';
              const rotation = isFlight ? (d.direction > 0 ? 90 : 270) : 0;
              
              const planeSvg = `
                <svg viewBox="0 0 24 24" fill="${color}" width="14" height="14" style="transform: rotate(${rotation}deg); filter: drop-shadow(0 0 4px ${color}); transition: transform 0.2s;">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              `;

              const shipSvg = `
                <svg viewBox="0 0 24 24" fill="${color}" width="18" height="18" style="filter: drop-shadow(0 0 4px ${color}); transition: transform 0.2s;">
                  <path d="M19.14,12.94L17.58,16.59C17.03,17.9 15.75,18.75 14.34,18.75H11.66C10.25,18.75 8.97,17.9 8.42,16.59L6.86,12.94C6.55,12.21 6.64,11.39 7.1,10.74L8.75,8.4L8.71,3H15.29L15.25,8.4L16.9,10.74C17.36,11.39 17.45,12.21 19.14,12.94M12,1.5C10.62,1.5 9.5,2.62 9.5,4V5H14.5V4C14.5,2.62 13.38,1.5 12,1.5Z"/>
                </svg>
              `;

              el.innerHTML = `
                <div class="tracking-container" style="cursor: pointer; position: relative; pointer-events: auto;">
                  <div class="icon-wrapper">
                    ${isFlight ? planeSvg : shipSvg}
                  </div>
                  <div class="tracking-label" style="
                    position: absolute;
                    top: -32px;
                    left: 50%;
                    transform: translateX(-50%) translateY(5px);
                    background: rgba(6,11,24,0.98);
                    padding: 5px 10px;
                    border-radius: 6px;
                    font-size: 10px;
                    color: ${color};
                    font-weight: 800;
                    white-space: nowrap;
                    border: 1px solid ${color}88;
                    pointer-events: none;
                    opacity: 0;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.8);
                    z-index: 1000;
                  ">
                    <div style="font-size: 8px; opacity: 0.8; margin-bottom: 2px; color: #fff;">${isFlight ? 'SIGINT' : 'MARINE'}</div>
                    <div style="color: ${color}">${isFlight ? d.callsign : d.name}</div>
                    <div style="font-size: 8px; color: #7a9aaa; margin-top: 2px;">
                       ${Math.round(d.speed)} ${isFlight ? 'KTS' : 'KN'} | ${d.type.toUpperCase()}
                    </div>
                  </div>
                </div>
              `;
              
              if (!isFlight && d.status === 'Delayed') {
                el.children[0].children[0].style.fill = '#ff4757';
                el.children[0].children[0].style.filter = 'drop-shadow(0 0 8px #ff4757)';
                el.children[0].children[0].style.animation = 'livePulse 1.5s infinite';
              }

              return el;
            }}
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
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>{selectedCountry.name}</div>
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
                Launch Intelligence Analysis
              </button>
            </div>
          )}

          {/* News Items / Trade Items */}
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#1e2d4a #0d1527' }}>
            
            {isTradeMode && (
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#27ae60', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                   Global Trade Hub
                </div>
                {selectedTrade ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'rgba(39,174,96,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(39,174,96,0.2)' }}>
                       <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{selectedTrade.country} Links</span>
                       <button onClick={() => setSelectedTrade(null)} style={{ background: 'none', border: 'none', color: '#5a7a9a', cursor: 'pointer' }}>✕</button>
                    </div>
                    {selectedTrade.connections.map((t, i) => (
                      <div key={i} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#27ae60', fontWeight: '700', marginBottom: '4px' }}>{t.source} ➔ {t.target}</div>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: '700', marginBottom: '8px' }}>{t.corridor}</div>
                        <div style={{ fontSize: '12px', color: '#b0c8d8', marginBottom: '4px' }}><b>Trade Value:</b> {t.value}</div>
                        <div style={{ fontSize: '12px', color: '#b0c8d8', marginBottom: '4px' }}><b>Volume:</b> {t.volume}</div>
                        <div style={{ fontSize: '12px', color: '#b0c8d8', marginBottom: '8px' }}><b>Main Goods:</b> {t.goods.join(', ')}</div>
                        <div style={{ padding: '8px', background: 'rgba(231,76,60,0.1)', borderRadius: '4px', fontSize: '11px', color: '#e74c3c' }}>
                           <b>Risk Factors:</b> {t.risk_factors}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#5a7a9a' }}>
                    <div style={{ fontSize: '13px', lineHeight: '1.5', marginTop: '20px' }}>Click any <b>Trade Arc</b> on the globe or <b>Select a Country</b> to view deep-dive economic links and risk analysis.</div>
                  </div>
                )}
              </div>
            )}

            {!isTradeMode && (() => {
              if (selectedYear !== 'Live') {
                const histFiltered = HISTORICAL_DATA
                  .filter(d => d.year === parseInt(selectedYear))
                  .filter(item => {
                    if (activeTab === 'All') return true;
                    const clean = item.country.replace(/[\u{1F1E0}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
                    return MARKER_REGION[activeTab]?.includes(clean);
                  });

                return histFiltered.map((item, idx) => {
                  const evType = EVENT_TYPES[item.type] || EVENT_TYPES.military;
                  return (
                    <div key={`hist-${idx}`} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'default', transition: 'background 0.15s' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: evType.color, flexShrink: 0, marginTop: '5px' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#5a7a9a' }}>{item.date}</span>
                            <span style={{ fontSize: '10px', color: evType.color, fontWeight: '700' }}>{evType.label}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#7a9aaa', marginBottom: '4px', fontWeight: '600' }}>{item.country}</div>
                          <div style={{ fontSize: '12.5px', color: '#fff', fontWeight: '700', marginBottom: '4px' }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: '#b0c8d8', lineHeight: '1.5' }}>{item.news}</div>
                        </div>
                      </div>
                    </div>
                  );
                });
              }

              // Normal Live Feed logic
              if (feedLoading) return (
                <div style={{ padding: '24px', textAlign: 'center', color: '#5a7a9a' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⟳</div>
                  <div style={{ fontSize: '12px' }}>Fetching live intelligence...</div>
                </div>
              );

              if (feedError) return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ color: '#e74c3c', fontSize: '12px', marginBottom: '10px' }}>⚠ Failed to load live feed</div>
                  <button onClick={fetchLiveFeed} style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #e74c3c', background: 'transparent', color: '#e74c3c', cursor: 'pointer', fontSize: '12px' }}>
                    ↺ Retry
                  </button>
                </div>
              );

              const liveFiltered = newsFeed.filter(item => {
                if (activeTab === 'All') return true;
                const cleanCountry = item.country.replace(/[\u{1F1E0}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
                return MARKER_REGION[activeTab]?.includes(cleanCountry);
              });

              if (liveFiltered.length === 0) return (
                <div style={{ padding: '24px', textAlign: 'center', color: '#5a7a9a', fontSize: '12px' }}>
                  No conflict news found at this time.
                </div>
              );

              return liveFiltered.map(item => {
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
              });
            })()}
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
        .live-pulse { width: 6px; height: 6px; border-radius: 50%; display: inline-block; animation: livePulse 1.5s infinite; }
        .tracking-container:hover .tracking-label { opacity: 1 !important; transform: translateX(-50%) translateY(0) !important; }
        .tracking-container:hover svg { transform: scale(1.6) !important; filter: drop-shadow(0 0 8px currentColor); }
        
        @keyframes livePulse { 0%,100%{opacity:1; filter: brightness(1.2); } 50%{opacity:0.4; filter: brightness(0.8); } }
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
