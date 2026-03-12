import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Globe, Zap, ArrowRight, TrendingUp, AlertTriangle, 
  BarChart2, Activity, PieChart, Users, ChevronRight, RefreshCcw, HandMetal
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, Cell
} from 'recharts';
import API_BASE_URL from '../api/config';

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
    if (sideA.length === 0 || sideB.length === 0) return;
    setLoading(true);
    setStep(2);

    try {
      const res = await fetch(`${API_BASE_URL}/api/simulator/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sideA, sideB })
      });
      
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      
      const data = await res.json();
      
      // Simulate "processing" time for effect
      setTimeout(() => {
        setSimResult(data);
        setStep(3);
        setLoading(false);
      }, 2500);
    } catch (err) {
      console.error('Simulation engine failed:', err);
      setLoading(false);
      setStep(1);
    }
  };

  const reset = () => {
    setSideA([]);
    setSideB([]);
    setSimResult(null);
    setStep(1);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060a14', color: '#fff', overflowX: 'hidden' }}>
      
      {/* ── Status Header ── */}
      <div style={{ padding: '2rem 4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <ShieldAlert size={24} color="#e74c3c" />
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '1px' }}>CRISIS SIMULATOR</h1>
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
          
          {/* STEP 1: DEFINE GEOPOLITICAL BLOCKS */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
                
                {/* Alliance A Selection */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3498db' }} />
                    <span style={{ fontWeight: '800', letterSpacing: '2px', fontSize: '14px' }}>ALLIANCE ALPHA</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '120px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '20px' }}>
                    {sideA.length === 0 && <span style={{ color: '#5a7a9a', fontSize: '12px' }}>Click countries to add to Alpha...</span>}
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
                  <div style={{ width: '1px', height: '100px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)' }} />
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#e74c3c', letterSpacing: '2px' }}>VS</span>
                  <div style={{ width: '1px', height: '100px', background: 'linear-gradient(to top, rgba(255,255,255,0.1), transparent)' }} />
                </div>

                {/* Alliance B Selection */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e67e22' }} />
                    <span style={{ fontWeight: '800', letterSpacing: '2px', fontSize: '14px' }}>ALLIANCE OMEGA</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '120px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '20px' }}>
                    {sideB.length === 0 && <span style={{ color: '#5a7a9a', fontSize: '12px' }}>Click countries to add to Omega...</span>}
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
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                
                {/* Main Results Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
                  
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
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '30px', borderRadius: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '2rem' }}>Phase-Based Impact Projection</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {simResult.results.timeline.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                          <div style={{ textAlign: 'right', minWidth: '80px' }}>
                             <div style={{ fontSize: '12px', color: '#5a7a9a', fontWeight: '900' }}>DAY</div>
                             <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)' }}>{item.day}</div>
                          </div>
                          <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                             <div style={{ fontWeight: '800', marginBottom: '6px', color: '#fff' }}>{item.event}</div>
                             <div style={{ fontSize: '13px', color: '#8aa' }}>{item.impact}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Sidebar Detail Pane */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* Conflict Correlation Analysis */}
                  <div style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)', padding: '24px', borderRadius: '24px' }}>
                    <div style={{ color: '#e74c3c', marginBottom: '1rem' }}><AlertTriangle size={24} /></div>
                    <h4 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '12px', color: '#fff' }}>STRATEGIC RISK BLOCKADE</h4>
                    <p style={{ fontSize: '13px', color: '#cc9999', lineHeight: '1.6', marginBottom: '20px' }}>
                      The simulation identifies a critical failure point in high-frequency <b>Semiconductor</b> supply lanes and <b>Artic-Indian</b> energy routes. Global production efficiency would drop by ~14% in the first quarter of friction.
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
