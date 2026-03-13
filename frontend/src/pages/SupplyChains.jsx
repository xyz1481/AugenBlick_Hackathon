import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Shield, Database, 
  TrendingUp, Activity, AlertCircle,
  Anchor, Ship, Truck, Box, Globe,
  Maximize2, MousePointer2, Info, Plane, Train
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const COUNTRY_COORDS = {
  'Taiwan': [23.6, 120.9, 'tw'],
  'USA': [37.0, -95.7, 'us'],
  'China': [35.8, 104.1, 'cn'],
  'Germany': [51.1, 10.4, 'de'],
  'Japan': [36.2, 138.2, 'jp'],
  'Netherlands': [52.1, 5.2, 'nl'],
  'Saudi Arabia': [23.8, 45.0, 'sa'],
  'Norway': [60.4, 8.4, 'no'],
  'Russia': [61.5, 105.3, 'ru'],
  'India': [20.5, 78.9, 'in'],
  'Brazil': [-14.2, -51.9, 'br'],
  'Indonesia': [-0.7, 113.9, 'id'],
  'Spain': [40.4, -3.7, 'es'],
  'UAE': [23.4, 53.8, 'ae'],
  'Bangladesh': [23.6, 90.3, 'bd'],
  'South Korea': [35.9, 127.7, 'kr'],
  'Singapore': [1.3, 103.8, 'sg'],
  'Australia': [-25.2, 133.7, 'au'],
  'Qatar': [25.3, 51.1, 'qa'],
  'Canada': [56.1, -106.3, 'ca'],
  'Vietnam': [14.0, 108.2, 'vn'],
  'Malaysia': [4.2, 101.9, 'my'],
  'UK': [55.3, -3.4, 'gb'],
  'Mexico': [23.6, -102.5, 'mx']
};

const TRADE_SCENARIOS = {
  'Semiconductors': {
    links: [
      { from: 'Taiwan', to: 'India', value: '$22.5B', type: 'AIR', status: 'GROWING', color: '#6366f1', routeInfo: 'Advanced Chip Ingress (Dholera Hub)', path: [[23.6, 120.9], [15.0, 110.0], [20.5, 78.9]] },
      { from: 'South Korea', to: 'India', value: '$12.4B', type: 'AIR', status: 'STABLE', color: '#6366f1', routeInfo: 'Memory Module Flow (NCR Hub)', path: [[35.9, 127.7], [25.0, 100.0], [20.5, 78.9]] },
      { from: 'Japan', to: 'India', value: '$18.8B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'SME Tooling Link (Chennai Port)', path: [[36.2, 138.2], [20.0, 120.0], [10.0, 100.0], [13.0, 80.2]] },
      { from: 'USA', to: 'India', value: '$15.2B', type: 'AIR', status: 'STABLE', color: '#6366f1', routeInfo: 'Design-IP Strategic Bridge', path: [[37.0, -95.7], [50.0, -40.0], [45.0, 20.0], [20.5, 78.9]] },
      { from: 'Netherlands', to: 'India', value: '$8.2B', type: 'AIR', status: 'STABLE', color: '#8b5cf6', routeInfo: 'EUV Lithography Logistics', path: [[52.1, 5.2], [45.0, 40.0], [20.5, 78.9]] },
      { from: 'Israel', to: 'India', value: '$4.5B', type: 'AIR', status: 'STABLE', color: '#6366f1', routeInfo: 'R&D Silicon Pathway', path: [[31.0, 34.8], [25.0, 55.0], [20.5, 78.9]] },
      { from: 'Singapore', to: 'India', value: '$9.8B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'Assembly-Testing Link', path: [[1.3, 103.8], [5.0, 90.0], [20.5, 78.9]] },
      { from: 'Malaysia', to: 'India', value: '$7.4B', type: 'AIR', status: 'STABLE', color: '#6366f1', routeInfo: 'Backend Packaging Flow', path: [[4.2, 101.9], [15.0, 90.0], [20.5, 78.9]] },
      { from: 'Germany', to: 'India', value: '$11.2B', type: 'RAIL', status: 'STABLE', color: '#f59e0b', routeInfo: 'Industrial Chipset Rail', path: [[51.1, 10.4], [52.3, 76.9], [43.8, 87.6], [20.5, 78.9]] },
      { from: 'Vietnam', to: 'India', value: '$5.6B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'Emerging Ecosystem Feed', path: [[14.0, 108.2], [5.0, 95.0], [13.0, 80.2]] }
    ],
    summary: 'High-density tracking of logic, memory, and fabrication tooling feeding India\'s emerging global semiconductor hub.'
  },
  'Energy': {
    links: [
      { from: 'Saudi Arabia', to: 'India', value: '$142.2B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'Jamnagar Strategic Reserve Link', path: [[23.8, 45.0], [20.0, 60.0], [22.5, 70.0]] },
      { from: 'UAE', to: 'India', value: '$88.5B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'Mundra Refinery Feed', path: [[23.4, 53.8], [22.0, 65.0], [22.8, 69.7]] },
      { from: 'Qatar', to: 'India', value: '$32.5B', type: 'SEA', status: 'HIGH TRAFFIC', color: '#60a5fa', routeInfo: 'Dahej LNG Gateway', path: [[25.3, 51.1], [22.0, 60.0], [21.7, 72.6]] },
      { from: 'Russia', to: 'India', value: '$95.1B', type: 'SEA', status: 'REDIRECTED', color: '#2dd4bf', routeInfo: 'Arctic-Indian Urals Stream', path: [[61.5, 105.3], [70.0, 40.0], [60.0, -5.0], [20.0, -15.0], [-34.0, 18.0], [0.0, 60.0], [18.9, 72.8]] },
      { from: 'Australia', to: 'India', value: '$42.1B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'Coal & LNG Resource Arc', path: [[-25.2, 133.7], [-10.0, 110.0], [5.0, 90.0], [17.7, 83.3]] },
      { from: 'Iraq', to: 'India', value: '$38.4B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'Basra-Paradip Crude Path', path: [[33.3, 44.4], [15.0, 55.0], [10.0, 75.0], [20.3, 86.7]] },
      { from: 'Oman', to: 'India', value: '$12.5B', type: 'PIPE', status: 'PROPOSED', color: '#ef4444', routeInfo: 'Deep-Sea Gas Interconnect', path: [[23.6, 58.5], [22.0, 65.0], [21.0, 70.0]] },
      { from: 'USA', to: 'India', value: '$22.1B', type: 'SEA', status: 'STABLE', color: '#60a5fa', routeInfo: 'Shale LNG Trans-Atlantic', path: [[30.0, -90.0], [20.0, -40.0], [0.0, -10.0], [-34.0, 18.0], [15.0, 73.0]] },
      { from: 'Nigeria', to: 'India', value: '$18.4B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'West African Sweet Crude', path: [[9.0, 8.6], [0.0, 10.0], [-34.0, 18.0], [10.0, 75.0]] },
      { from: 'Kuwait', to: 'India', value: '$15.2B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'Persian Gulf Logistics Arc', path: [[29.3, 47.9], [25.0, 55.0], [20.0, 65.0], [19.0, 72.8]] }
    ],
    summary: 'Tracking India\'s critical energy dependency through a dense network of tanker streams and future pipelines.'
  },
  'India Strategic Network': {
    links: [
      { from: 'India', to: 'USA', value: '$110.4B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'Trans-Suez American Export Arc', path: [[20.5, 78.9], [15.0, 60.0], [12.6, 43.3], [25.0, 35.0], [30.5, 32.3], [36.0, -5.5], [40.0, -40.0], [37.0, -95.7]] },
      { from: 'India', to: 'UAE', value: '$85.2B', type: 'SEA', status: 'STABLE', color: '#60a5fa', routeInfo: 'IMEC (India-Middle East Corridor)', path: [[20.5, 78.9], [22.0, 65.0], [23.4, 53.8]] },
      { from: 'India', to: 'Bangladesh', value: '$18.1B', type: 'RAIL', status: 'HIGH TRAFFIC', color: '#f59e0b', routeInfo: 'Trans-Border Rail Network', path: [[20.5, 78.9], [23.0, 85.0], [23.6, 90.3]] },
      { from: 'India', to: 'Russia', value: '$45.3B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'INSTC (International North-South Corridor)', path: [[20.5, 78.9], [25.0, 60.0], [35.0, 52.0], [45.0, 50.0], [61.5, 105.3]] },
      { from: 'India', to: 'Vietnam', value: '$14.3B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'ASEAN Look-East Pathway', path: [[20.5, 78.9], [10.0, 90.0], [2.2, 102.2], [14.0, 108.2]] },
      { from: 'India', to: 'UK', value: '$32.1B', type: 'SEA', status: 'STABLE', color: '#60a5fa', routeInfo: 'Trans-Atlantic Freight Arc', path: [[20.5, 78.9], [15.0, 60.0], [30.0, 32.0], [35.0, -5.0], [55.3, -3.4]] },
      { from: 'India', to: 'Germany', value: '$28.4B', type: 'SEA', status: 'STABLE', color: '#60a5fa', routeInfo: 'Euro-Indian Industrial Bridge', path: [[20.5, 78.9], [15.0, 60.0], [30.0, 32.0], [35.0, 15.0], [45.0, 10.0], [51.1, 10.4]] },
      { from: 'India', to: 'Australia', value: '$24.5B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'Indian Ocean Resource Loop', path: [[20.5, 78.9], [5.0, 90.0], [-10.0, 110.0], [-25.2, 133.7]] },
      { from: 'India', to: 'South Africa', value: '$15.2B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'BRICS Southern Maritime Arc', path: [[20.5, 78.9], [0.0, 60.0], [-15.0, 50.0], [-30.0, 30.0]] },
      { from: 'India', to: 'Brazil', value: '$12.8B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'South-South Global Trade Arc', path: [[20.5, 78.9], [0.0, 60.0], [-34.0, 18.0], [-25.0, -20.0], [-14.2, -51.9]] },
      { from: 'India', to: 'Japan', value: '$20.1B', type: 'AIR', status: 'STABLE', color: '#6366f1', routeInfo: 'Indo-Pacific Tech Air-Bridge', path: [[20.5, 78.9], [25.0, 100.0], [30.0, 120.0], [36.2, 138.2]] },
      { from: 'India', to: 'Saudi Arabia', value: '$42.5B', type: 'SEA', status: 'STABLE', color: '#2dd4bf', routeInfo: 'West Asian Logistics Link', path: [[20.5, 78.9], [20.0, 65.0], [23.8, 45.0]] }
    ],
    summary: 'Global tactical monitoring of India\'s dense trade ecosystem, featuring multi-modal corridors across all continents.'
  }
};

const CustomMarker = ({ country, coord }) => {
  const icon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="width: 12px; height: 12px; background: rgba(99, 102, 241, 0.6); border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 10px rgba(99, 102, 241, 0.8);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  return (
    <Marker position={[coord[0], coord[1]]} icon={icon}>
      <Popup className="tactical-popup">
        <div style={{ background: '#0d111d', color: '#fff', padding: '8px', border: '1px solid #1e2d4a', borderRadius: '4px' }}>
          <div style={{ fontSize: '12px', fontWeight: 900, marginBottom: '4px' }}>{country.toUpperCase()}</div>
          <div style={{ fontSize: '10px', color: '#5a7a9a' }}>GEOPOLITICAL HUB ACTIVE</div>
        </div>
      </Popup>
    </Marker>
  );
};

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 3, { duration: 2 });
    }
  }, [center, map]);
  return null;
};

const SupplyChains = () => {
  const [activeScenario, setActiveScenario] = useState('Semiconductors');
  const [hoveredLink, setHoveredLink] = useState(null);
  const [mapCenter, setMapCenter] = useState([20, 0]);

  const scenario = TRADE_SCENARIOS[activeScenario];
  const getFlagUrl = (code) => `https://flagcdn.com/w80/${code?.toLowerCase()}.png`;

  const processedLinks = useMemo(() => {
    return scenario.links.map(link => {
      const positions = link.path;
      
      const dashArray = link.type === 'AIR' ? '10, 10' : 
                        link.type === 'RAIL' ? '15, 5' : 
                        link.type === 'PIPE' ? '5, 2' : null;

      return { ...link, positions, dashArray };
    }).filter(Boolean);
  }, [scenario]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#060a14', 
      color: '#fff', 
      display: 'flex',
      flexDirection: 'column',
      margin: '-2rem -4rem',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* ── TOP NAV ── */}
      <div style={{ 
        height: '60px', 
        background: 'rgba(13, 17, 29, 0.95)', 
        borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem',
        gap: '30px',
        backdropFilter: 'blur(10px)',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <Globe size={18} color="#6366f1" />
          </div>
          <span style={{ fontWeight: 900, letterSpacing: '2px', fontSize: '14px' }}>REALITY MAP PRO</span>
        </div>
        
        <div style={{ display: 'flex', gap: '5px' }}>
          {Object.keys(TRADE_SCENARIOS).map(s => (
            <button
              key={s}
              onClick={() => setActiveScenario(s)}
              style={{
                background: activeScenario === s ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeScenario === s ? '#6366f1' : '#5a7a9a',
                border: activeScenario === s ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 900,
                cursor: 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.5px'
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '11px', color: '#5a7a9a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px #6366f1' }} />
            OSM ACTIVE
          </div>
          <div style={{ fontWeight: 900, color: '#fff', padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>v4.2.0</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── LEFT: LEAFLET MAP ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#080c18' }}>
          <MapContainer 
            center={mapCenter} 
            zoom={3} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Tactical Dark">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Street View">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satellite">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Railway Map">
                <TileLayer
                  url="https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <MapController center={mapCenter} />

            {/* Routes */}
            {processedLinks.map((link, i) => (
              <Polyline
                key={`${link.from}-${link.to}-${i}`}
                positions={link.positions}
                color={hoveredLink === i ? '#fff' : link.color}
                weight={hoveredLink === i ? 4 : 2}
                opacity={hoveredLink === i ? 1 : 0.6}
                dashArray={link.dashArray}
                eventHandlers={{
                  mouseover: () => setHoveredLink(i),
                  mouseout: () => setHoveredLink(null)
                }}
              >
                <Popup>
                  <div style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'Inter, sans-serif' }}>
                    <div style={{ color: '#6366f1', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '4px', marginBottom: '4px' }}>
                      {link.from} ➔ {link.to}
                    </div>
                    <div style={{ color: '#fff', background: '#6366f1', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', display: 'inline-block', marginBottom: '6px' }}>
                      {link.routeInfo}
                    </div>
                    <div style={{ margin: '4px 0', fontSize: '11px' }}>Value: {link.value}</div>
                    <div style={{ fontSize: '10px', color: '#555' }}>Mode: {link.type}NET</div>
                  </div>
                </Popup>
              </Polyline>
            ))}

            {/* Nodes */}
            {Object.entries(COUNTRY_COORDS).map(([name, coord]) => (
              <CustomMarker key={name} country={name} coord={coord} />
            ))}
          </MapContainer>

          {/* Map Legend */}
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(13,17,29,0.9)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: 900, color: '#5a7a9a', marginBottom: '5px' }}>ROUTE CLASSIFICATION</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px' }}>
              <Plane size={12} color="#6366f1" /> <span style={{ color: '#fff' }}>AIR (Strategic/High-Value)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px' }}>
              <Ship size={12} color="#2dd4bf" /> <span style={{ color: '#fff' }}>SEA (Mass/Commodity)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px' }}>
              <Train size={12} color="#f59e0b" /> <span style={{ color: '#fff' }}>RAIL (Trans-Continental)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px' }}>
              <Truck size={12} color="#94a3b8" /> <span style={{ color: '#fff' }}>ROAD (Regional Logistics)</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: ROUTE INTELLIGENCE ── */}
        <div style={{ 
          width: '400px', 
          background: '#0a0e17', 
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
              <h2 style={{ fontSize: '15px', fontWeight: 900, margin: 0, letterSpacing: '1px' }}>SYSTEM OVERVIEW</h2>
            </div>
            <p style={{ fontSize: '12px', color: '#7a9ab8', lineHeight: '1.7', margin: 0 }}>
              {scenario.summary}
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', height: 'calc(100vh - 180px)' }}>
            <div style={{ fontSize: '10px', fontWeight: 900, color: '#475569', marginBottom: '16px', padding: '0 8px', letterSpacing: '1px' }}>ACTIVE TRADE CORRIDORS</div>
            <AnimatePresence mode='wait'>
              {processedLinks.map((link, i) => (
                <motion.div 
                  key={`${activeScenario}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onMouseEnter={() => {
                    setHoveredLink(i);
                    setMapCenter([link.positions[0][0], link.positions[0][1]]);
                  }}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={{ 
                    padding: '20px', 
                    background: hoveredLink === i ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${hoveredLink === i ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.03)'}`,
                    borderRadius: '16px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {COUNTRY_COORDS[link.from] && <img src={getFlagUrl(COUNTRY_COORDS[link.from][2])} width="16" alt="flag" />}
                      <ArrowRight size={10} color="#5a7a9a" />
                      {COUNTRY_COORDS[link.to] && <img src={getFlagUrl(COUNTRY_COORDS[link.to][2])} width="16" alt="flag" />}
                    </div>
                    <div style={{ 
                      fontSize: '9px', 
                      fontWeight: 900, 
                      padding: '3px 10px', 
                      borderRadius: '6px',
                      background: link.status === 'STABLE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: link.status === 'STABLE' ? '#22c55e' : '#ef4444',
                      border: `1px solid ${link.status === 'STABLE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}>
                      {link.status}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>
                    {link.from} ➔ {link.to}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    {link.type === 'AIR' && <Plane size={12} color="#6366f1" />}
                    {link.type === 'SEA' && <Ship size={12} color="#2dd4bf" />}
                    {link.type === 'RAIL' && <Train size={12} color="#f59e0b" />}
                    {link.type === 'ROAD' && <Truck size={12} color="#94a3b8" />}
                    <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: 900, background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{link.routeInfo}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '8px', color: '#475569', fontWeight: 900, marginBottom: '2px' }}>VALUE CAP</div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#6366f1' }}>{link.value}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '8px', color: '#475569', fontWeight: 900, marginBottom: '2px' }}>NETWORK TYPE</div>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: '#fff' }}>{link.type}NET</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Tactical Feedback */}
          <div style={{ padding: '24px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '12px' }}>
              <Activity size={14} />
              <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '1px' }}>LIVE NETWORK PULSE</span>
            </div>
            <p style={{ fontSize: '11px', color: '#5a7a9a', lineHeight: '1.6', margin: 0 }}>
              System synchronizing with **OpenStreetMap v4.2** nodes. All rail, maritime, and terrestrial corridors are currently operating under standard protocol.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .leaflet-container {
          background: #080c18 !important;
        }
        .leaflet-bar { border: none !important; }
        .leaflet-bar a { background: #0d111d !important; color: #fff !important; border-bottom: 1px solid #1e2d4a !important; }
        .tactical-popup .leaflet-popup-content-wrapper {
          background: #0d111d !important;
          color: #fff !important;
          border: 1px solid #1e2d4a !important;
          border-radius: 8px !important;
        }
        .tactical-popup .leaflet-popup-tip { background: #0d111d !important; }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); borderRadius: 2px; }
      `}</style>
    </div>
  );
};

export default SupplyChains;
