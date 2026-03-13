import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Globe2,
  Network,
  Zap,
  Ship,
  Thermometer,
  Search,
  Cpu,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import API_BASE_URL from "../api/config";
import ConflictMap from "../components/ConflictAnalyzer/ConflictMap";
import TradeMap from "../components/ConflictAnalyzer/TradeMap";

function radialGradient(score) {
  if (score >= 75) return "linear-gradient(135deg, #2ecc71, #27ae60)";
  if (score >= 50) return "linear-gradient(135deg, #f1c40f, #e67e22)";
  return "linear-gradient(135deg, #e74c3c, #c0392b)";
}

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [intelData, setIntelData] = useState(null);
  
  const [stability, setStability] = useState(null);
  const [systems, setSystems] = useState(null);
  const [dominoScenarios, setDominoScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [domino, setDomino] = useState(null);
  const [dominoStep, setDominoStep] = useState(0);
  const [impactVisible, setImpactVisible] = useState(false);

  // Initial Load: Scenarios + Global Stats
  useEffect(() => {
    const load = async () => {
      try {
        const [stabRes, sysRes, scRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/stability/global`),
          fetch(`${API_BASE_URL}/api/systems/overview`),
          fetch(`${API_BASE_URL}/api/domino/scenarios`),
        ]);
        if (stabRes.ok) setStability((await stabRes.json()).data);
        if (sysRes.ok) setSystems((await sysRes.json()).data);
        if (scRes.ok) setDominoScenarios((await scRes.json()).scenarios || []);
      } catch (e) {
        console.warn("[Dashboard] Initial load failed:", e.message);
      }
    };
    load();
  }, []);

  // Handle Domino Simulation when selection changes
  useEffect(() => {
    let interval = null;
    if (!selectedScenarioId) {
      setDomino(null);
      return;
    }

    const runSim = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/domino/run/${selectedScenarioId}`, {
          method: 'POST'
        });
        const data = await res.json();
        if (data.success) {
          setDomino(data.simulation);
          // Auto-animate steps
          setDominoStep(0);
          interval = setInterval(() => {
            setDominoStep(prev => (prev < data.simulation.timeline.length - 1 ? prev + 1 : prev));
          }, 1000);
        }
      } catch (err) {
        console.error("[Dashboard] Domino error:", err);
      }
    };
    runSim();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedScenarioId]);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsAnalyzing(true);
    setIntelData(null);
    setImpactVisible(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/intelligence/analyze-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.success) {
        setIntelData(data);
        if (data.stability) setStability(data.stability);
        if (data.systems) setSystems(data.systems);
        
        // Delay visual update for impact panel
        setTimeout(() => {
          setImpactVisible(true);
        }, 2500);
      }
    } catch (err) {
      console.error("[Dashboard] Analysis error:", err);
      setImpactVisible(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stabilityScore = stability?.score ?? 0;

  return (
    <div style={{ width: "100%", minHeight: "100%", display: "flex", flexDirection: "column", gap: 24, padding: "10px 0" }}>
      
      {/* ── Header & Command Input ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Cpu size={28} color="#3498db" />
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Impact Analyzer
                </h1>
            </div>
            <p style={{ color: '#5a7a9a', fontSize: '14px', margin: 0 }}>Projecting global systemic impacts via real-time signal analysis.</p>
          </div>

          <form onSubmit={handleAnalyze} style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={20} color="#5a7a9a" style={{ position: 'absolute', left: '16px' }} />
                  <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter geopolitical event (e.g. Suez Canal Blockage, Oil Supply Crisis)..."
                    style={{
                        width: '100%',
                        background: '#050910',
                        border: '1px solid #1e2d4a',
                        borderRadius: '12px',
                        padding: '14px 16px 14px 48px',
                        color: '#fff',
                        fontSize: '15px',
                        outline: 'none',
                    }}
                  />
              </div>
              <button 
                type="submit"
                disabled={isAnalyzing}
                style={{
                    background: '#3498db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0 32px',
                    fontWeight: '900',
                    fontSize: '14px',
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: isAnalyzing ? 0.5 : 1
                }}
              >
                {isAnalyzing ? 'SIMULATING...' : 'RUN ANALYSIS'}
              </button>
          </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', minHeight: '600px' }}>
        
        {/* Left Column: Intelligence Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. Global Stability Score */}
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "#050910",
                borderRadius: 24,
                border: "1px solid #1e2d4a",
                padding: 24,
                display: "flex",
                alignItems: "center",
                gap: 24,
                boxShadow: "0 10px 40px rgba(0,0,0,0.4)"
              }}
            >
              <div style={{ width: 120, height: 120, borderRadius: "50%", background: radialGradient(stabilityScore), display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(0,0,0,0.6)", flexShrink: 0 }}>
                <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#050910", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, color: "#5a7a9a", fontWeight: 800 }}>STABILITY</span>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>{stabilityScore}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#7a9ab8", letterSpacing: "0.08em" }}>DYNAMIC STABILITY INDEX</span>
                  <Activity size={18} color="#2ecc71" />
                </div>
                <p style={{ fontSize: 14, color: "#9bb1cc", margin: 0, lineHeight: 1.6 }}>{stability?.reason || "Monitoring global signals..."}</p>
              </div>
            </motion.div>

            {/* 2. Event -> Impact Chain (Conditional) */}
            <AnimatePresence>
                {intelData && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ background: "#050910", borderRadius: 24, border: "1px solid #1e2d4a", padding: 24, flex: 1, display: "flex", flexDirection: "column", gap: 20 }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: "#3498db" }}>CASCADING IMPACT CHAIN</span>
                            <Network size={20} color="#3498db" />
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px' }}>
                            {/* SVG Flow would go here, using a list for MVP refinement */}
                            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                {intelData.graph.nodes.map((node, idx) => {
                                    const nodeColors = {
                                        'geopolitical_event': '#e74c3c',
                                        'energy_supply': '#f39c12',
                                        'trade_routes': '#3498db',
                                        'logistics_network': '#9b59b6',
                                        'commodity_markets': '#2ecc71',
                                        'regional_economy': '#1abc9c'
                                    };
                                    const color = nodeColors[node.type] || '#3498db';
                                    
                                    return (
                                        <div key={node.id} style={{ position: 'relative', zIndex: 1 }}>
                                            <div style={{ 
                                                background: 'rgba(15,23,42,0.8)', 
                                                border: `1px solid ${color}`,
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                            }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 800, color: '#fff', fontSize: '13px' }}>{node.label}</span>
                                                    <span style={{ fontSize: '11px', color: '#9bb1cc', marginTop: '2px', lineHeight: 1.4 }}>{node.description}</span>
                                                </div>
                                                <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#5a7a9a', textTransform: 'uppercase', fontWeight: 900, alignSelf: 'flex-start' }}>{node.type.replace('_', ' ')}</span>
                                            </div>
                                            {idx < intelData.graph.nodes.length - 1 && (
                                                <div style={{ position: 'absolute', left: '22px', top: '100%', height: '30px', width: '2px', background: `linear-gradient(to bottom, ${color}, transparent)` }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(231,76,60,0.05)', borderRadius: '12px', border: '1px solid rgba(231,76,60,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <AlertTriangle size={14} color="#e74c3c" />
                                <span style={{ fontSize: 11, fontWeight: 900, color: '#e74c3c', textTransform: 'uppercase' }}>Intelligence Logic</span>
                            </div>
                            <p style={{ fontSize: 13, color: '#9bb1cc', margin: 0, fontStyle: 'italic' }}>"{intelData.graph.logic}"</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Global Systems Impact Panel */}
            <AnimatePresence>
                {impactVisible && (
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{ background: "#050910", borderRadius: 24, border: "1px solid #1e2d4a", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: "#f1c40f" }}>SYSTEMS IMPACT PANEL</span>
                            <BarChart3 size={18} color="#5a7a9a" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Commodity Column */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <span style={{ fontSize: 11, fontWeight: 900, color: '#5a7a9a', textTransform: 'uppercase' }}>Commodity Market Impacts</span>
                                {systems?.commodities.map(c => {
                                    const impact = intelData?.graph?.marketImpact?.find(m => m.id === c.id);
                                    return (
                                        <div key={c.id} style={{ padding: '12px', background: 'rgba(15,23,42,0.6)', borderRadius: '12px', border: `1px solid ${impact ? (impact.exposure === 'High' ? 'rgba(231,76,60,0.3)' : 'rgba(255,255,255,0.03)') : 'rgba(255,255,255,0.03)'}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{c.label}</span>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>${c.price?.toFixed(2)}</div>
                                                    <div style={{ fontSize: 11, color: c.changePct >= 0 ? '#2ecc71' : '#e74c3c', fontWeight: 800 }}>{c.changePct ? (c.changePct > 0 ? '+' : '') + c.changePct.toFixed(2) + '%' : '--'}</div>
                                                </div>
                                            </div>
                                            {impact && (
                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{ fontSize: 10, color: '#5a7a9a', fontWeight: 800 }}>TREND DEVIATION:</span>
                                                        <span style={{ fontSize: 10, color: impact.weightedImpact >= 0 ? '#2ecc71' : '#e74c3c', fontWeight: 900 }}>{impact.weightedImpact.toFixed(2)}%</span>
                                                    </div>
                                                    <div style={{ background: impact.exposure === 'High' ? 'rgba(231,76,60,0.1)' : 'rgba(15,23,42,0.8)', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${impact.exposure === 'High' ? '#e74c3c' : 'rgba(51,65,85,0.5)'}` }}>
                                                        <span style={{ fontSize: 9, fontWeight: 900, color: impact.exposure === 'High' ? '#e74c3c' : '#5a7a9a' }}>{impact.exposure} EXPOSURE</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Logistics Column */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <span style={{ fontSize: 11, fontWeight: 900, color: '#5a7a9a', textTransform: 'uppercase' }}>Logistics Stress</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
                                    <div style={{ padding: '16px', background: 'rgba(15,23,42,0.6)', borderRadius: '12px', border: '1px solid rgba(241,196,15,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: 10, color: '#5a7a9a', fontWeight: 900, textTransform: 'uppercase' }}>Port Congestion</span>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: '#f1c40f' }}>{systems?.logistics.indices.portCongestion}%</div>
                                    </div>
                                    <div style={{ padding: '16px', background: 'rgba(15,23,42,0.6)', borderRadius: '12px', border: '1px solid rgba(231,76,60,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: 10, color: '#5a7a9a', fontWeight: 900, textTransform: 'uppercase' }}>Shipping Delays</span>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: '#e74c3c' }}>{systems?.logistics.indices.shippingDelay}d</div>
                                    </div>
                                </div>
                                <div style={{ padding: '8px 16px', background: 'rgba(15,23,42,0.3)', borderRadius: '8px', fontSize: '11px', color: '#5a7a9a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Ship size={12} />
                                    <span>Derived from AIS live tracking signals</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Right Column: World Map Intelligence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: "#050910", borderRadius: 32, border: "1px solid #1e2d4a", padding: "10px", flex: 1, position: 'relative', overflow: 'hidden', boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
                <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10, pointerEvents: 'none' }}>
                    <div style={{ background: 'rgba(6,10,20,0.8)', border: '1px solid rgba(52,152,219,0.3)', padding: '10px 16px', borderRadius: '12px', backdropFilter: 'blur(8px)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Globe2 size={16} color="#3498db" />
                            <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Trade Route Intelligence</span>
                        </div>
                    </div>
                </div>

                <div style={{ width: '100%', height: '100%', borderRadius: '24px', overflow: 'hidden' }}>
                    <TradeMap 
                      simulationResults={intelData} 
                      isSimulating={isAnalyzing} 
                    />
                </div>
            </div>
            
            {/* Domino Effect Simulator (Mini View) */}
            <div style={{ background: "#050910", borderRadius: 24, border: "1px solid #1e2d4a", padding: 24, minHeight: '200px' }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: '16px' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#f97316" }}>DOMINO EFFECT SIMULATOR</span>
                    <TrendingUp size={18} color="#f97316" />
                </div>
                <select
                    value={selectedScenarioId || ""}
                    onChange={(e) => setSelectedScenarioId(e.target.value || null)}
                    style={{
                      width: "100%",
                      background: "#020617",
                      color: "#e5e7eb",
                      borderRadius: 12,
                      border: "1px solid #1e293b",
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      outline: "none",
                      marginBottom: '16px'
                    }}
                >
                    <option value="">Select failure mode...</option>
                    {dominoScenarios.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                </select>
                <div style={{ fontSize: '13px', color: '#5a7a9a', marginBottom: '20px' }}>
                    Simulate how specific system failures cascade into global disruptions.
                </div>

                {domino && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative', paddingLeft: '12px' }}>
                    {/* Vertical Connector Line */}
                    <div style={{ 
                        position: 'absolute', 
                        left: '18px', 
                        top: '20px', 
                        bottom: '20px', 
                        width: '2px', 
                        background: 'linear-gradient(to bottom, #f97316, rgba(249,115,22,0.1))',
                        boxShadow: '0 0 10px rgba(249,115,22,0.3)'
                    }} />

                    {domino.nodes.map((node, idx) => {
                      const isVisible = idx <= dominoStep;
                      if (!isVisible) return null;
                      
                      const isLatest = idx === dominoStep;

                      return (
                        <motion.div
                          key={node.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          style={{
                            padding: '12px 14px',
                            background: node.type === 'scenario' ? 'rgba(249,115,22,0.15)' : 'rgba(15,23,42,0.8)',
                            borderRadius: '12px',
                            border: `1px solid ${isLatest ? '#f97316' : (node.type === 'scenario' ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.05)')}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px',
                            marginLeft: '20px',
                            position: 'relative',
                            boxShadow: isLatest ? '0 0 20px rgba(249,115,22,0.1)' : 'none'
                          }}
                        >
                          {/* Node Bullet on Line */}
                          <div style={{ 
                              position: 'absolute', 
                              left: '-24px', 
                              top: '50%', 
                              transform: 'translateY(-50%)',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: isLatest ? '#f97316' : 'rgba(249,115,22,0.4)',
                              border: '2px solid #050910',
                              zIndex: 10,
                              boxShadow: isLatest ? '0 0 10px #f97316' : 'none'
                          }} />

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                                fontSize: 13, 
                                fontWeight: isLatest ? 900 : 700, 
                                color: isLatest ? '#fff' : '#e5e7eb',
                                letterSpacing: '0.2px'
                            }}>
                                {node.label}
                            </span>
                          </div>
                          {node.impactPct > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <TrendingUp size={12} color="#e74c3c" />
                                <span style={{ fontSize: 12, fontWeight: 900, color: '#e74c3c' }}>+{node.impactPct}%</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
            </div>
        </div>

      </div>

      <style>{`
        @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}
