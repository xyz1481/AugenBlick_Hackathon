import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Globe as GlobeIcon, Zap, ArrowRight, TrendingUp, AlertTriangle, 
  BarChart2, Activity, PieChart, Users, ChevronRight, RefreshCcw, HandMetal
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, Cell
} from 'recharts';
import WorldGlobe from 'react-globe.gl';
import API_BASE_URL from '../api/config';

const TARGET_COORDS = {
  'United States': [37.09, -95.71], 'Russia': [61.52, 105.32], 'China': [35.86, 104.19],
  'India': [20.59, 78.96], 'Germany': [51.17, 10.45], 'United Kingdom': [55.38, -3.44],
  'Saudi Arabia': [23.89, 45.08], 'Australia': [-25.27, 133.78], 'Brazil': [-14.24, -51.93],
  'Canada': [56.13, -106.35], 'Norway': [60.47, 8.47], 'Qatar': [25.35, 51.18],
  'Indonesia': [-0.79, 113.92], 'Japan': [36.21, 138.25], 'South Korea': [35.91, 127.77],
  'Taiwan': [23.7, 120.96], 'France': [46.23, 2.21], 'Egypt': [26.82, 30.8], 'Turkey': [38.96, 35.24]
};

const COUNTRIES = [
  'United States', 'Russia', 'China', 'India', 'Germany', 'United Kingdom', 
  'Saudi Arabia', 'Australia', 'Brazil', 'Canada', 'Norway', 'Qatar', 
  'Indonesia', 'Japan', 'South Korea', 'Taiwan', 'France', 'Egypt', 'Turkey'
].sort();

const Simulator = () => {
  const [sideA, setSideA] = useState([]);
  const [sideB, setSideB] = useState([]);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Selection, 2: Simulation, 3: Results
  const [isStrikeMode, setIsStrikeMode] = useState(false);
  const [targetCountry, setTargetCountry] = useState(null);
  const [weapon, setWeapon] = useState('Kinetic');
  const [launching, setLaunching] = useState(false);
  const [impacts, setImpacts] = useState([]);
  const [strikePhase, setStrikePhase] = useState(null); // null | 'countdown' | 'missile' | 'flash' | 'detonation' | 'afterburn'
  const [countdown, setCountdown] = useState(3);
  const globeRef = useRef();
  const countdownRef = useRef();

  const populationStats = useMemo(() => {
    if (!isStrikeMode || !targetCountry) return null;
    const basePop = 8000; // Mock 8B global pop
    const targetPop = 200; // Mock target country pop
    const killed = weapon === 'Nuclear' ? Math.floor(Math.random() * 50) + 80 : Math.floor(Math.random() * 5) + 1;
    return {
      surviving: 100 - (killed / basePop * 100),
      total: '8.03 B',
      casualties: `${killed} M`
    };
  }, [isStrikeMode, targetCountry, weapon, impacts]);

  const addCountry = (name, side) => {
    if (side === 'A') {
      if (!sideB.includes(name)) setSideA([...new Set([...sideA, name])]);
    } else {
      if (!sideA.includes(name)) setSideB([...new Set([...sideB, name])]);
    }
  };

  const removeCountry = (name, side) => {
    if (side === 'A') setSideA(sideA.filter(c => c !== name));
    else setSideB(sideB.filter(c => c !== name));
  };

  const runSimulation = async () => {
    if (!isStrikeMode) {
      if (sideA.length === 0 || sideB.length === 0) return;
    } else {
      if (!targetCountry) return;
    }
    
    setLoading(true);
    setStep(2);

    try {
      const endpoint = isStrikeMode ? '/api/simulator/strike' : '/api/simulator/simulate';
      const body = isStrikeMode 
        ? { targetCountry, weaponType: weapon }
        : { sideA, sideB };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      
      setTimeout(() => {
        setSimResult(data);
        setStep(3);
        setLoading(false);
        setLaunching(false);
      }, 2500);
    } catch (err) {
      console.error('Simulation engine failed:', err);
      setLoading(false);
      setStep(1);
    }
  };

  const handleStrike = () => {
    if (!targetCountry) return;
    const coords = TARGET_COORDS[targetCountry];
    if (!coords) return;

    // Phase 1: Countdown
    setStrikePhase('countdown');
    setLaunching(true);
    setCountdown(3);
    let c = 3;
    countdownRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countdownRef.current);
        startLaunch(coords);
      }
    }, 700);
  };

  const startLaunch = (coords) => {
    // Phase 2: Missile in flight — zoom globe to approach altitude
    setStrikePhase('missile');
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: coords[0], lng: coords[1], altitude: 2.5 }, 800);
    }
    
    setTimeout(() => {
      // Phase 3: Impact flash — close in zoom
      setStrikePhase('flash');
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat: coords[0], lng: coords[1], altitude: 0.8 }, 400);
      }

      setTimeout(() => {
        // Phase 4: Shockwave detonation
        setStrikePhase('detonation');
        const isNuke = weapon === 'Nuclear';
        setImpacts(prev => [
          ...prev,
          { lat: coords[0], lng: coords[1], size: isNuke ? 30 : 14, color: isNuke ? '#f1c40f' : '#e74c3c' },
          { lat: coords[0], lng: coords[1], size: isNuke ? 20 : 9, color: isNuke ? '#ff6b35' : '#ff4757' },
          { lat: coords[0], lng: coords[1], size: isNuke ? 12 : 6, color: '#ffffff' },
        ]);

        setTimeout(() => {
          // Phase 5: Afterburn zoom out
          setStrikePhase('afterburn');
          if (globeRef.current) {
            globeRef.current.pointOfView({ lat: coords[0], lng: coords[1], altitude: 1.5 }, 1200);
          }
          setTimeout(runSimulation, 1000);
        }, 1500);
      }, 400);
    }, 1800);
  };

  const reset = () => {
    setSideA([]);
    setSideB([]);
    setSimResult(null);
    setStep(1);
    setImpacts([]);
    setStrikePhase(null);
    setLaunching(false);
    setCountdown(3);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060a14', color: '#fff', overflowX: 'hidden' }}>
      
      {/* ── Status Header ── */}
      <div style={{ padding: '2rem 4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <ShieldAlert size={24} color={isStrikeMode ? "#f39c12" : "#e74c3c"} />
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '1px' }}>
                {isStrikeMode ? 'WARGAMES: STRIKE SIM' : 'CRISIS SIMULATOR'}
              </h1>
           </div>
           <p style={{ color: '#5a7a9a', fontSize: '13px', margin: 0 }}>Projecting Global Economic Shifts via Reality Engine v2.0</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
           {[1, 2, 3].map(s => (
             <div key={s} style={{ 
                width: '40px', height: '4px', borderRadius: '2px', 
                background: step === s ? 'var(--primary)' : step > s ? '#10b981' : 'rgba(255,255,255,0.05)',
                transition: 'all 0.5s'
             }} />
           ))}
        </div>
      </div>

      <div style={{ padding: '3rem 4rem' }}>
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Centralized Mode Toggle */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '6px', display: 'flex', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                  <button 
                    onClick={() => setIsStrikeMode(false)}
                    style={{ 
                      padding: '14px 32px', borderRadius: '14px', border: 'none', fontSize: '12px', fontWeight: '900', cursor: 'pointer', letterSpacing: '2px',
                      background: !isStrikeMode ? 'linear-gradient(to right, #6366f1, #22d3ee)' : 'transparent',
                      color: !isStrikeMode ? '#fff' : '#5a7a9a',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: !isStrikeMode ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none'
                    }}
                  >MACRO ECONOMICS</button>
                  <button 
                    onClick={() => setIsStrikeMode(true)}
                    style={{ 
                      padding: '14px 32px', borderRadius: '14px', border: 'none', fontSize: '12px', fontWeight: '900', cursor: 'pointer', letterSpacing: '2px',
                      background: isStrikeMode ? 'linear-gradient(to right, #f39c12, #d35400)' : 'transparent',
                      color: isStrikeMode ? '#fff' : '#5a7a9a',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isStrikeMode ? '0 0 20px rgba(243, 156, 18, 0.3)' : 'none'
                    }}
                  >STRATEGIC STRIKE</button>
                </div>
              </div>
              {!isStrikeMode ? (
                /* Original Alliance View */
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3498db' }} />
                      <span style={{ fontWeight: '800', letterSpacing: '2px', fontSize: '14px' }}>ALLIANCE ALPHA</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '120px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '20px' }}>
                      {sideA.length === 0 && <span style={{ color: '#5a7a9a', fontSize: '12px' }}>Click countries to add...</span>}
                      {sideA.map(c => (
                        <button key={c} onClick={() => removeCountry(c, 'A')} style={{ background: 'rgba(52, 152, 219, 0.2)', border: '1px solid #3498db', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>{c} ✕</button>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
                      {COUNTRIES.filter(c => !sideA.includes(c) && !sideB.includes(c)).map(c => (
                        <button key={c} onClick={() => addCountry(c, 'A')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#b0c8d8', padding: '8px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', textAlign: 'left' }}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '100px', gap: '20px' }}>
                    <TrendingUp size={32} color="#5a7a9a" />
                    <span style={{ fontSize: '12px', fontWeight: '900', color: '#e74c3c', letterSpacing: '2px' }}>VS</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e67e22' }} />
                      <span style={{ fontWeight: '800', letterSpacing: '2px', fontSize: '14px' }}>ALLIANCE OMEGA</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '120px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '20px' }}>
                      {sideB.length === 0 && <span style={{ color: '#5a7a9a', fontSize: '12px' }}>Click countries to add...</span>}
                      {sideB.map(c => (
                        <button key={c} onClick={() => removeCountry(c, 'B')} style={{ background: 'rgba(230, 126, 34, 0.2)', border: '1px solid #e67e22', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>{c} ✕</button>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
                      {COUNTRIES.filter(c => !sideA.includes(c) && !sideB.includes(c)).map(c => (
                        <button key={c} onClick={() => addCountry(c, 'B')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#b0c8d8', padding: '8px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', textAlign: 'left' }}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Wargame / Strike View */
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: '2rem', width: '100%', minHeight: '600px' }}>
                  
                  {/* Left Column: Tactical Control */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* HUD: Solar Smash Stats */}
                    <div style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', padding: '24px', borderRadius: '24px', borderLeft: '4px solid #f39c12' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                          <div style={{ color: '#5a7a9a', fontSize: '10px', fontWeight: '900', letterSpacing: '2px' }}>PLANETARY HUD</div>
                          <div style={{ color: '#f39c12', fontSize: '10px', fontWeight: '900' }}>v1.0.0-WAR</div>
                       </div>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                          <div>
                             <div style={{ fontSize: '11px', color: '#8aa', fontWeight: '800' }}>SURVIVAL</div>
                             <div style={{ fontSize: '28px', fontWeight: '900', color: '#2ecc71' }}>{populationStats?.surviving.toFixed(2)}%</div>
                          </div>
                          <div>
                             <div style={{ fontSize: '11px', color: '#8aa', fontWeight: '800' }}>CASUALTIES</div>
                             <div style={{ fontSize: '28px', fontWeight: '900', color: '#e74c3c' }}>{populationStats?.casualties || '0 M'}</div>
                          </div>
                       </div>
                    </div>

                    {/* Targeting List */}
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '32px', border: '1px solid rgba(243, 156, 18, 0.2)', display: 'flex', flexDirection: 'column' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                         <GlobeIcon size={18} color="#f39c12" />
                         <span style={{ fontWeight: '900', letterSpacing: '2px', fontSize: '12px', color: '#f39c12' }}>SEARCH TARGET</span>
                       </div>
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', overflowY: 'auto', paddingRight: '8px' }}>
                         {COUNTRIES.map(c => (
                           <button 
                             key={c} 
                             onClick={() => {
                               setTargetCountry(c);
                               if (globeRef.current && TARGET_COORDS[c]) {
                                 globeRef.current.pointOfView({ lat: TARGET_COORDS[c][0], lng: TARGET_COORDS[c][1], altitude: 2 }, 1000);
                               }
                             }}
                             style={{ 
                               background: targetCountry === c ? 'rgba(243, 156, 18, 0.2)' : 'rgba(255,255,255,0.03)', 
                               border: `1px solid ${targetCountry === c ? '#f39c12' : 'rgba(255,255,255,0.05)'}`,
                               color: targetCountry === c ? '#fff' : '#5a7a9a',
                               padding: '10px 4px', borderRadius: '10px', fontSize: '9px', fontWeight: '800', cursor: 'pointer' 
                             }}
                           >
                              {c}
                           </button>
                         ))}
                       </div>
                    </div>

                    {/* Launch Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                       <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {['Kinetic', 'Nuclear'].map(w => (
                              <button 
                                key={w}
                                onClick={() => setWeapon(w)}
                                style={{ 
                                  flex: 1, background: weapon === w ? (w === 'Nuclear' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(52, 152, 219, 0.2)') : 'rgba(255,255,255,0.03)', 
                                  border: `1px solid ${weapon === w ? (w === 'Nuclear' ? '#e74c3c' : '#3498db') : 'rgba(255,255,255,0.05)'}`,
                                  color: weapon === w ? '#fff' : '#5a7a9a',
                                  padding: '12px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', cursor: 'pointer'
                                }}
                              >
                                {w === 'Nuclear' ? '☢' : '🚀'} {w.toUpperCase()}
                              </button>
                            ))}
                          </div>
                       </div>
                       <button 
                          onClick={handleStrike}
                          disabled={!targetCountry || launching}
                          style={{ 
                            borderRadius: '24px', background: launching ? '#111' : 'linear-gradient(to right, #f39c12, #d35400)', 
                            color: '#fff', fontWeight: '900', fontSize: '14px', cursor: 'pointer', border: 'none',
                            boxShadow: targetCountry ? '0 0 30px rgba(243, 156, 18, 0.3)' : 'none',
                            opacity: (!targetCountry || launching) ? 0.3 : 1
                          }}
                        >
                          {launching ? 'LAUNCHING...' : 'FIRE'}
                        </button>
                    </div>
                  </div>

                   {/* Right Column: 3D Globe View - PREMIUM STRIKE THEATER */}
                   <div style={{ position: 'relative', background: 'rgba(0,0,0,0.5)', borderRadius: '40px', overflow: 'hidden', border: `1px solid ${strikePhase === 'detonation' || strikePhase === 'afterburn' ? (weapon === 'Nuclear' ? '#f1c40f' : '#e74c3c') : 'rgba(255,255,255,0.1)'}`, transition: 'border-color 0.3s', boxShadow: strikePhase === 'detonation' ? `0 0 80px ${weapon === 'Nuclear' ? 'rgba(241,196,15,0.5)' : 'rgba(231,76,60,0.5)'}` : 'none' }}>
                     <WorldGlobe
                        ref={globeRef}
                        width={600}
                        height={600}
                        backgroundColor="rgba(0,0,0,0)"
                        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                        ringsData={impacts}
                        ringColor={d => d.color}
                        ringMaxRadius={d => d.size}
                        ringPropagationSpeed={4}
                        ringRepeatPeriod={weapon === 'Nuclear' ? 600 : 900}
                        animateIn={false}
                     />

                     {/* Tactical Crosshair */}
                     <motion.div
                       animate={targetCountry && !launching ? { opacity: [0.4, 1, 0.4], scale: [1, 1.05, 1] } : { opacity: 0.3, scale: 1 }}
                       transition={{ repeat: Infinity, duration: 2 }}
                       style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
                     >
                       <div style={{ width: '48px', height: '48px', border: `2px solid ${targetCountry ? '#f39c12' : 'rgba(255,255,255,0.2)'}`, borderRadius: '50%' }} />
                       <div style={{ position: 'absolute', top: '50%', left: '50%', width: '120px', height: '1px', background: 'rgba(243,156,18,0.4)', transform: 'translate(-50%, -50%)' }} />
                       <div style={{ position: 'absolute', top: '50%', left: '50%', width: '1px', height: '120px', background: 'rgba(243,156,18,0.4)', transform: 'translate(-50%, -50%)' }} />
                       <div style={{ position: 'absolute', top: '-4px', left: '50%', width: '8px', height: '8px', border: '2px solid #f39c12', transform: 'translateX(-50%) rotate(45deg)' }} />
                     </motion.div>

                     {/* Phase: COUNTDOWN */}
                     <AnimatePresence>
                     {strikePhase === 'countdown' && (
                       <motion.div
                         key={`cd-${countdown}`}
                         initial={{ scale: 2.5, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         exit={{ scale: 0.5, opacity: 0 }}
                         transition={{ duration: 0.5, ease: 'easeOut' }}
                         style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 50 }}
                       >
                         <div style={{ fontSize: '140px', fontWeight: '900', color: '#e74c3c', textShadow: '0 0 80px rgba(231,76,60,0.8)', fontFamily: 'monospace', lineHeight: 1 }}>
                           {countdown > 0 ? countdown : 'FIRE'}
                         </div>
                       </motion.div>
                     )}

                     {/* Phase: MISSILE IN FLIGHT */}
                     {strikePhase === 'missile' && (
                       <motion.div
                         initial={{ x: 0, y: '100%', opacity: 1 }}
                         animate={{ x: 0, y: '-30%', opacity: [1, 1, 0] }}
                         transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                         style={{ position: 'absolute', left: '48%', bottom: '10%', zIndex: 60, pointerEvents: 'none' }}
                       >
                         {/* Missile body */}
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                           <div style={{ width: '8px', height: '30px', background: 'linear-gradient(to bottom, #c0392b, #e74c3c)', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', boxShadow: '0 0 20px rgba(231,76,60,0.9)' }} />
                           <div style={{ width: '6px', height: '24px', background: 'linear-gradient(to bottom, #bdc3c7, #7f8c8d)' }} />
                           {/* Exhaust trail */}
                           <motion.div
                             animate={{ scaleY: [1, 1.3, 0.8, 1.2, 1], opacity: [0.8, 1, 0.6, 1, 0.8] }}
                             transition={{ repeat: Infinity, duration: 0.12 }}
                             style={{ width: '16px', height: '50px', background: 'linear-gradient(to bottom, rgba(255,165,0,0.9), transparent)', filter: 'blur(4px)', marginTop: '-4px' }}
                           />
                         </div>
                       </motion.div>
                     )}

                     {/* Phase: IMPACT FLASH */}
                     {(strikePhase === 'flash' || strikePhase === 'detonation') && (
                       <motion.div
                         initial={{ opacity: 0 }}
                         animate={strikePhase === 'flash' ? { opacity: [0, 1, 0.4] } : { opacity: [0.4, 0.1, 0] }}
                         transition={{ duration: strikePhase === 'flash' ? 0.3 : 1.5 }}
                         style={{ position: 'absolute', inset: 0, background: weapon === 'Nuclear' ? 'radial-gradient(circle, rgba(255,255,200,0.95) 0%, rgba(241,196,15,0.6) 40%, transparent 70%)' : 'radial-gradient(circle, rgba(255,200,150,0.95) 0%, rgba(231,76,60,0.5) 40%, transparent 70%)', pointerEvents: 'none', zIndex: 70 }}
                       />
                     )}

                     {/* Phase: DETONATION shockwave rings */}
                     {strikePhase === 'detonation' && (
                       <motion.div
                         initial={{ scale: 0, opacity: 1 }}
                         animate={{ scale: 4, opacity: 0 }}
                         transition={{ duration: 1.2, ease: 'easeOut' }}
                         style={{ position: 'absolute', top: '50%', left: '50%', translateX: '-50%', translateY: '-50%', width: '80px', height: '80px', borderRadius: '50%', border: `4px solid ${weapon === 'Nuclear' ? '#f1c40f' : '#e74c3c'}`, boxShadow: `0 0 40px ${weapon === 'Nuclear' ? '#f1c40f' : '#e74c3c'}`, pointerEvents: 'none', zIndex: 65 }}
                       />
                     )}
                     {strikePhase === 'detonation' && (
                       <motion.div
                         initial={{ scale: 0, opacity: 0.8 }}
                         animate={{ scale: 3, opacity: 0 }}
                         transition={{ duration: 1.8, ease: 'easeOut', delay: 0.3 }}
                         style={{ position: 'absolute', top: '50%', left: '50%', translateX: '-50%', translateY: '-50%', width: '80px', height: '80px', borderRadius: '50%', border: `2px solid ${weapon === 'Nuclear' ? '#ff6b35' : '#ff4757'}`, pointerEvents: 'none', zIndex: 65 }}
                       />
                     )}

                     {/* Smoke particles after detonation */}
                     {(strikePhase === 'detonation' || strikePhase === 'afterburn') && (
                       [0,1,2,3,4,5,6,7].map(i => (
                         <motion.div
                           key={i}
                           initial={{ x: 0, y: 0, opacity: 0.8, scale: 0 }}
                           animate={{ 
                             x: Math.cos(i * 45 * Math.PI/180) * (40 + i * 8),
                             y: Math.sin(i * 45 * Math.PI/180) * (40 + i * 8) - 20,
                             opacity: 0,
                             scale: [0, 1.5, 0.8]
                           }}
                           transition={{ duration: 1.5 + i * 0.2, delay: i * 0.05, ease: 'easeOut' }}
                           style={{ 
                             position: 'absolute', top: '50%', left: '50%', 
                             width: `${8 + i * 3}px`, height: `${8 + i * 3}px`, 
                             borderRadius: '50%', 
                             background: weapon === 'Nuclear' ? 'radial-gradient(circle, rgba(241,196,15,0.7), rgba(255,100,0,0.3))' : 'radial-gradient(circle, rgba(231,76,60,0.7), rgba(100,0,0,0.3))',
                             filter: 'blur(3px)',
                             pointerEvents: 'none', zIndex: 64 
                           }}
                         />
                       ))
                     )}

                     {/* Screen shake overlay on impact */}
                     {strikePhase === 'flash' && (
                       <motion.div
                         animate={{ x: [-4, 6, -3, 5, -2, 4, 0], y: [3, -5, 4, -3, 2, -2, 0] }}
                         transition={{ duration: 0.5 }}
                         style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 200 }}
                       />
                     )}
                     </AnimatePresence>

                     {/* Target Readout */}
                     {targetCountry && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          style={{ position: 'absolute', bottom: '30px', left: '30px', background: 'rgba(0,0,0,0.85)', padding: '12px 20px', borderRadius: '16px', border: `1px solid ${strikePhase === 'detonation' ? '#e74c3c' : '#f39c12'}`, backdropFilter: 'blur(10px)' }}
                        >
                           <div style={{ fontSize: '9px', color: '#f39c12', fontWeight: '900', letterSpacing: '2px', marginBottom: '4px' }}>TARGET LOCKED</div>
                           <div style={{ fontSize: '18px', fontWeight: '900' }}>{targetCountry.toUpperCase()}</div>
                           {strikePhase && <div style={{ fontSize: '9px', color: '#e74c3c', fontWeight: '900', marginTop: '4px', letterSpacing: '3px' }}>{strikePhase.toUpperCase()}</div>}
                        </motion.div>
                     )}

                     {/* FULL PAGE nuclear glow when detonated */}
                     {strikePhase === 'detonation' && weapon === 'Nuclear' && (
                       <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: [0, 0.3, 0] }}
                         transition={{ duration: 2 }}
                         style={{ position: 'fixed', inset: 0, background: 'rgba(241,196,15,0.1)', pointerEvents: 'none', zIndex: 1000 }}
                       />
                     )}
                   </div>

                </div>
              )}

              {!isStrikeMode && (
                <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                  <button 
                    onClick={runSimulation}
                    disabled={sideA.length === 0 || sideB.length === 0}
                    style={{ 
                      padding: '1.2rem 4rem', borderRadius: '99px', background: 'linear-gradient(to right, #6366f1, #22d3ee)', 
                      border: 'none', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer',
                      opacity: (sideA.length === 0 || sideB.length === 0) ? 0.3 : 1,
                      boxShadow: '0 0 40px rgba(99, 102, 241, 0.4)',
                      letterSpacing: '2px'
                    }}
                  >
                    INITIALIZE SIMULATION ENGINE
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: CALCULATING... */}
          {step === 2 && (
            <motion.div 
               key="step2"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               style={{ height: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
               <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                style={{ width: '80px', height: '80px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', marginBottom: '2rem' }}
               />
               <h2 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '4px' }}>RUNNING MACRO-HEURISTICS</h2>
               <p style={{ color: '#5a7a9a', fontSize: '14px', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6' }}>
                  Analyzing trillions of trade vectors and supply chain dependencies across 42 global corridors...
               </p>
            </motion.div>
          )}

          {/* STEP 3: IMPACT REPORT */}
          {step === 3 && simResult && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              {isStrikeMode && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ marginBottom: '2rem', padding: '1.5rem 2rem', background: 'rgba(231, 76, 60, 0.15)', border: '1px solid #ff4757', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 0 30px rgba(231,76,60,0.2)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff4757', animation: 'livePulse 1s infinite' }} />
                    <div>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#ff4757', letterSpacing: '3px' }}>TACTICAL DAMAGE ASSESSMENT: {targetCountry.toUpperCase()}</h2>
                      <div style={{ fontSize: '11px', color: '#8aa', marginTop: '4px', fontWeight: '800' }}>POST-KINETIC RECONNAISSANCE | WEAPON: {weapon.toUpperCase()} | IMPACT RADIUS: {weapon === 'Nuclear' ? '500km' : '50km'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#8aa', fontWeight: '800' }}>CIVILIAN SURVIVAL RATE</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: populationStats?.surviving > 99.5 ? '#2ecc71' : '#e74c3c' }}>{populationStats?.surviving.toFixed(3)}%</div>
                  </div>
                </motion.div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                
                {/* Main Results Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
                  
                  {isStrikeMode && (
                    <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '32px', height: '300px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                       <WorldGlobe
                          width={800}
                          height={300}
                          backgroundColor="rgba(0,0,0,0)"
                          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                          ringsData={impacts}
                          ringColor={d => d.color}
                          ringMaxRadius={d => d.size * 0.8}
                          ringPropagationSpeed={2}
                          ringRepeatPeriod={800}
                          animateIn={false}
                       />
                       <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent 40%)', pointerEvents: 'none' }} />
                       <div style={{ position: 'absolute', bottom: '20px', left: '30px', background: 'rgba(231,76,60,0.2)', border: '1px solid #e74c3c', padding: '10px 15px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                          <div style={{ fontSize: '10px', color: '#ff4757', fontWeight: '900', letterSpacing: '1px' }}>GROUND ZERO COORDINATES</div>
                          <div style={{ fontSize: '14px', fontWeight: '900', fontFamily: 'monospace' }}>LAT: {TARGET_COORDS[targetCountry]?.[0]} / LNG: {TARGET_COORDS[targetCountry]?.[1]}</div>
                       </div>
                    </div>
                  )}

                  {/* High-Level Score Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                    {[
                      { label: 'VOLATILITY INDEX', val: simResult.results.volatilityScore, icon: <Activity />, color: '#f1c40f' },
                      { label: 'TRADE SHADOW', val: `$${simResult.results.totalTradeCut}B+`, icon: <Zap />, color: '#e74c3c' },
                      { label: 'INFLATION PEAK', val: `+${simResult.results.globalInflationImpact.toFixed(1)}%`, icon: <TrendingUp />, color: '#e67e22' },
                      { label: 'CHOKEPOINTS', val: simResult.brokenLinks.length, icon: <ArrowRight />, color: '#3498db' }
                    ].map((card, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px', borderRadius: '20px' }}>
                        <div style={{ color: card.color, marginBottom: '12px' }}>{card.icon}</div>
                        <div style={{ fontSize: '9px', fontWeight: '800', color: '#5a7a9a', letterSpacing: '1px', marginBottom: '4px' }}>{card.label}</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{card.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Disrupted Goods Chart */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '30px', borderRadius: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <PieChart size={20} color="var(--primary)" />
                      Resource Scarcity Exposure ($ Values)
                    </h3>
                    <div style={{ height: '300px', width: '100%', minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height="100%" debounce={50}>
                        <BarChart data={Object.entries(simResult.results.disruptedGoods).map(([name, value]) => ({ name, value }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="#5a7a9a" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#5a7a9a" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ background: '#0d111d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                            {Object.entries(simResult.results.disruptedGoods).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6'][index % 5]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Deep Impact Timeline */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '32px', borderRadius: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '2px', color: isStrikeMode ? '#e74c3c' : '#fff' }}>
                          {isStrikeMode ? 'POST-IMPACT ECONOMIC COLLAPSE' : 'CRISIS ESCALATION TIMELINE'}
                        </h3>
                        <div style={{ fontSize: '10px', color: '#5a7a9a', fontWeight: '800' }}>{isStrikeMode ? '45-DAY PROJECTION' : '180-DAY SCAN'}</div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {simResult.results.timeline.map((item, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + (i * 0.1) }}
                          style={{ display: 'flex', gap: '24px', position: 'relative' }}
                        >
                          {i !== simResult.results.timeline.length - 1 && (
                            <div style={{ position: 'absolute', left: '20px', top: '40px', bottom: '-24px', width: '2px', background: 'linear-gradient(to bottom, rgba(231,76,60,0.3), rgba(255,255,255,0.05))' }} />
                          )}
                          <div style={{ 
                            width: '42px', height: '42px', borderRadius: '12px', 
                            background: isStrikeMode ? (i === 0 ? '#e74c3c' : 'rgba(231,76,60,0.1)') : 'rgba(255,255,255,0.05)', 
                            border: `1px solid ${isStrikeMode ? (i === 0 ? '#ff4757' : 'rgba(231,76,60,0.2)') : 'rgba(255,255,255,0.1)'}`,
                            display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900', 
                            color: i === 0 && isStrikeMode ? '#fff' : '#5a7a9a',
                            boxShadow: i === 0 && isStrikeMode ? '0 0 20px rgba(231,76,60,0.4)' : 'none'
                          }}>
                            {item.day || `D+${(i+1)*5}`}
                          </div>
                          <div style={{ flex: 1, paddingTop: '4px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '6px', color: i === 0 && isStrikeMode ? '#ff4757' : '#fff' }}>{item.event}</div>
                            <div style={{ fontSize: '12.5px', color: '#8aa', lineHeight: '1.6' }}>{item.impact}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Sidebar Detail Pane */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* Conflict Correlation Analysis */}
                  <div style={{ background: isStrikeMode ? 'rgba(231,76,60,0.12)' : 'rgba(231,76,60,0.06)', border: `1px solid ${isStrikeMode ? '#e74c3c' : 'rgba(231,76,60,0.2)'}`, padding: '24px', borderRadius: '24px' }}>
                    <div style={{ color: '#e74c3c', marginBottom: '1rem' }}><AlertTriangle size={24} /></div>
                    <h4 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '12px', color: '#fff' }}>
                      {isStrikeMode ? 'POST-KINETIC COLLAPSE' : 'STRATEGIC RISK BLOCKADE'}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#cc9999', lineHeight: '1.6', marginBottom: '20px' }}>
                      {isStrikeMode 
                        ? `The strike on ${targetCountry} has triggered an immediate localized infrastructure blackout. Secondary effects include a total halt of regional exports, specifically impacting global ${Object.keys(simResult.results.disruptedGoods)[0] || 'Resource'} stockpiles.`
                        : `The simulation identifies a critical failure point in high-frequency Semiconductor supply lanes and Artic-Indian energy routes. Global production efficiency would drop by ~14% in the first quarter of friction.`
                      }
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#886666' }}>
                          <span>RECESSION RISK</span>
                          <span>94%</span>
                       </div>
                       <div style={{ width: '100%', height: '4px', background: 'rgba(231,76,60,0.1)', borderRadius: '2px' }}>
                          <div style={{ width: '94%', height: '100%', background: '#e74c3c', borderRadius: '2px' }} />
                       </div>
                    </div>
                  </div>

                  {/* Broken Trade Links List */}
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '1.5rem' }}>OFFLINE TRADE ROUTES</h3>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {simResult.brokenLinks.map((link, i) => (
                        <div key={i} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', fontSize: '11px' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5a7a9a', marginBottom: '4px' }}>
                              <span>{link.corridor}</span>
                              <span style={{ color: '#e74c3c' }}>OFFLINE</span>
                           </div>
                           <div style={{ fontWeight: '700' }}>{link.source} ➔ {link.target}</div>
                           <div style={{ color: '#8aa', marginTop: '4px' }}>Value: {link.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={reset} style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <RefreshCcw size={16} /> RESET SIMULATOR
                  </button>
                  
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default Simulator;
