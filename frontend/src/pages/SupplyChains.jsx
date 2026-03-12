import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Shield, Database, 
  TrendingUp, Activity, AlertCircle 
} from 'lucide-react';

// --- DATA ---
const TRADE_SCENARIOS = {
  'Semiconductors': {
    nodes: [
      { id: 'Taiwan', flag: 'tw', pos: [100, 300] },
      { id: 'USA', flag: 'us', pos: [400, 100] },
      { id: 'China', flag: 'cn', pos: [400, 250] },
      { id: 'Germany', flag: 'de', pos: [400, 400] },
      { id: 'Japan', flag: 'jp', pos: [400, 550] },
      { id: 'Netherlands', flag: 'nl', pos: [700, 300] }
    ],
    links: [
      { from: 'Taiwan', to: 'USA', val: 84, corridor: 'TSMC ➔ Apple/Intel' },
      { from: 'Taiwan', to: 'China', val: 120, corridor: 'Consumer Electronics' },
      { from: 'Taiwan', to: 'Germany', val: 56, corridor: 'Automotive Chips' },
      { from: 'Taiwan', to: 'Japan', val: 45, corridor: 'High-Precision Robotics' },
      { from: 'USA', to: 'Netherlands', val: 32, corridor: 'ASML Systems' },
      { from: 'Japan', to: 'Netherlands', val: 28, corridor: 'Chemical Resists' }
    ]
  },
  'Energy': {
    nodes: [
      { id: 'Saudi Arabia', flag: 'sa', pos: [100, 300] },
      { id: 'Norway', flag: 'no', pos: [100, 450] },
      { id: 'Russia', flag: 'ru', pos: [100, 150] },
      { id: 'Germany', flag: 'de', pos: [600, 150] },
      { id: 'China', flag: 'cn', pos: [600, 350] },
      { id: 'India', flag: 'in', pos: [600, 550] }
    ],
    links: [
      { from: 'Saudi Arabia', to: 'China', val: 180, corridor: 'Oil Exports' },
      { from: 'Saudi Arabia', to: 'India', val: 95, corridor: 'Petroleum Logistics' },
      { from: 'Norway', to: 'Germany', val: 110, corridor: 'Natural Gas' },
      { from: 'Russia', to: 'China', val: 140, corridor: 'Siberia Pipelines' },
      { from: 'Russia', to: 'India', val: 85, corridor: 'Urals Crude' }
    ]
  },
  'Food & Spices': {
    nodes: [
      { id: 'India', flag: 'in', pos: [100, 310] },
      { id: 'Brazil', flag: 'br', pos: [100, 160] },
      { id: 'Indonesia', flag: 'id', pos: [100, 460] },
      { id: 'USA', flag: 'us', pos: [550, 120] },
      { id: 'Spain', flag: 'es', pos: [550, 260] },
      { id: 'UAE', flag: 'ae', pos: [550, 420] },
      { id: 'Bangladesh', flag: 'bd', pos: [550, 570] }
    ],
    links: [
      { from: 'India', to: 'USA', val: 84, corridor: 'Organic Exports' },
      { from: 'India', to: 'UAE', val: 86, corridor: 'Spice Trade' },
      { from: 'India', to: 'Bangladesh', val: 87, corridor: 'Rice Grains' },
      { from: 'Brazil', to: 'USA', val: 92, corridor: 'Soy/Coffee' },
      { from: 'Indonesia', to: 'Spain', val: 51, corridor: 'Palm Oil' }
    ]
  }
};

const SupplyChains = () => {
  const [activeScenario, setActiveScenario] = useState('Semiconductors');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);

  const scenario = TRADE_SCENARIOS[activeScenario];
  const getFlagUrl = (code) => `https://flagcdn.com/w80/${code.toLowerCase()}.png`;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0f1e', 
      color: '#fff', 
      display: 'flex',
      overflow: 'hidden',
      margin: '-2rem -4rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* ── Main Canvas (Left) ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* Dynamic Background */}
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'radial-gradient(circle at 30% 50%, #151a2e 0%, #0a0f1e 100%)',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />

        {/* Tactical Header */}
        <div style={{ position: 'absolute', top: '3rem', left: '4rem', zIndex: 10 }}>
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
           >
              <div style={{ padding: '10px', background: 'rgba(52, 152, 219, 0.2)', borderRadius: '12px', border: '1px solid rgba(52, 152, 219, 0.4)' }}>
                 <Database size={24} color="#3498db" />
              </div>
              <div>
                 <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '2px' }}>{activeScenario.toUpperCase()}</h1>
                 <p style={{ margin: 0, color: '#5a7a9a', fontSize: '13px', fontWeight: '700' }}>REAL-TIME SUPPLY CHAIN INGRESS/EGRESS MONITOR</p>
              </div>
           </motion.div>
        </div>

        {/* SVG Flow Map */}
        <svg width="100%" height="100%" viewBox="0 0 1000 800" style={{ pointerEvents: 'all' }}>
          <defs>
            <filter id="glow">
               <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
               <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Paths */}
          {scenario.links.map((link, i) => {
            const start = scenario.nodes.find(n => n.id === link.from);
            const end = scenario.nodes.find(n => n.id === link.to);
            if (!start || !end) return null;

            const [x1, y1] = start.pos;
            const [x2, y2] = end.pos;
            const isHovered = (hoveredLink === i) || (hoveredNode === link.from) || (hoveredNode === link.to);

            return (
              <g key={`l-${i}`} onMouseEnter={() => setHoveredLink(i)} onMouseLeave={() => setHoveredLink(null)}>
                {/* Visual Path (Outer) */}
                <path 
                  d={`M ${x1} ${y1} C ${x1 + (x2-x1)*0.5} ${y1}, ${x1 + (x2-x1)*0.5} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={isHovered ? 'rgba(52, 152, 219, 0.4)' : 'rgba(255,255,255,0.03)'}
                  strokeWidth={link.val / 6 + 10}
                  style={{ transition: 'all 0.4s ease' }}
                />
                
                {/* Interaction / Animated Path */}
                <motion.path 
                  d={`M ${x1} ${y1} C ${x1 + (x2-x1)*0.5} ${y1}, ${x1 + (x2-x1)*0.5} ${y2}, ${x2} ${y2}`}
                  fill="none" 
                  stroke={isHovered ? '#fff' : '#3498db'} 
                  strokeWidth="2"
                  strokeDasharray={isHovered ? '6,3' : 'none'}
                  filter={isHovered ? 'url(#glow)' : 'none'}
                  animate={{ strokeDashoffset: isHovered ? [0, -48] : 0 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  style={{ opacity: isHovered ? 1 : 0.4 }}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {scenario.nodes.map((node, i) => (
            <g 
              key={`n-${i}`} 
              transform={`translate(${node.pos[0]}, ${node.pos[1]})`}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              <motion.circle 
                r="38" 
                fill="#0d111d" 
                stroke={hoveredNode === node.id ? '#3498db' : 'rgba(255,255,255,0.1)'} 
                strokeWidth="2"
                animate={{ scale: hoveredNode === node.id ? 1.15 : 1 }}
                style={{ filter: hoveredNode === node.id ? 'drop-shadow(0 0 15px rgba(52,152,219,0.5))' : 'none' }}
              />
              <image 
                href={getFlagUrl(node.flag)} 
                x="-18" y="-12" 
                width="36" height="24" 
                style={{ borderRadius: '4px' }}
              />
              <text y="58" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900" style={{ letterSpacing: '1px' }}>
                {node.id.toUpperCase()}
              </text>
            </g>
          ))}
        </svg>

        {/* Global Summary Ticker (Bottom) */}
        <div style={{ 
          position: 'absolute', bottom: '2rem', left: '4rem', right: '4rem',
          background: 'rgba(10, 15, 30, 0.9)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '20px', padding: '1rem 2rem', display: 'flex', gap: '40px', overflowX: 'auto',
          backdropFilter: 'blur(20px)', zIndex: 20
        }}>
           {scenario.links.map((link, i) => (
             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', whiteSpace: 'nowrap' }}>
               <img src={getFlagUrl(scenario.nodes.find(n => n.id === link.from).flag)} width="16" height="10" />
               <span style={{ fontSize: '10px', fontWeight: '800' }}>{link.from} ➔ {link.to}</span>
               <span style={{ fontSize: '10px', fontWeight: '900', color: '#3498db' }}>${link.val}M</span>
               <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)' }} />
             </div>
           ))}
        </div>
      </div>

      {/* ── Side Scenarios (Right) ── */}
      <div style={{ 
        width: '420px', 
        background: '#0d111d', 
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 30
      }}>
        <div style={{ padding: '3rem 2rem' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>TRADE STORIES</h2>
          <p style={{ color: '#5a7a9a', fontSize: '13px', lineHeight: '1.5' }}>Select a corridor scenario to trace specialized commodity movements across global hubs.</p>
        </div>

        <div style={{ flex: 1, padding: '0 1.5rem', overflowY: 'auto' }}>
          {Object.keys(TRADE_SCENARIOS).map(s => (
            <motion.div 
              key={s}
              whileHover={{ x: -5 }}
              onClick={() => setActiveScenario(s)}
              style={{ 
                padding: '1.5rem', 
                borderRadius: '20px', 
                marginBottom: '1rem',
                cursor: 'pointer',
                background: activeScenario === s ? 'rgba(52, 152, 219, 0.1)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${activeScenario === s ? '#3498db' : 'transparent'}`,
                transition: 'all 0.3s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                 <span style={{ fontWeight: '900', fontSize: '13px', color: activeScenario === s ? '#3498db' : '#fff', letterSpacing: '1px' }}>{s.toUpperCase()} FLOW</span>
                 <ArrowRight size={14} color={activeScenario === s ? '#3498db' : '#5a7a9a'} />
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: activeScenario === s ? '#8aa' : '#5a7a9a', lineHeight: '1.6' }}>
                {s === 'Semiconductors' && 'Strategic tech nodes tracing the path of advanced lithography and sub-strate logistics.'}
                {s === 'Energy' && 'Monitoring global hydrocarbon stability across pipeline and ocean tanker corridors.'}
                {s === 'Food & Spices' && 'Agricultural grain streams tracked from major exporters to developing market hubs.'}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Global Alert Monitor */}
        <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ padding: '1.5rem', background: 'rgba(231,76,60,0.05)', borderRadius: '16px', border: '1px solid rgba(231,76,60,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e74c3c', marginBottom: '10px' }}>
                <Shield size={16} />
                <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '1px' }}>SECURITY OVERVIEW</span>
              </div>
              <p style={{ fontSize: '11px', color: '#8aa', lineHeight: '1.6', margin: 0 }}>
                Reality Engine indicates a +22% increase in regional maritime insurance premiums for active {activeScenario} corridors.
              </p>
           </div>
        </div>
      </div>

      <style>{`
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(52, 152, 219, 0.3); borderRadius: 2px; }
      `}</style>
    </div>
  );
};

export default SupplyChains;
