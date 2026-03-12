import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ControlPanel from '../components/ConflictAnalyzer/ControlPanel';
import ConflictMap from '../components/ConflictAnalyzer/ConflictMap';
import ImpactDashboard from '../components/ConflictAnalyzer/ImpactDashboard';
import { ShieldAlert } from 'lucide-react';
import API_BASE_URL from '../api/config';

const ConflictAnalyzer = () => {
  const [simulationParams, setSimulationParams] = useState({
    attacker: '',
    target: '',
    conflictType: 'Military War',
    intensity: 50
  });
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  
  // Strike Sequence orchestration
  const [strikePhase, setStrikePhase] = useState(null); // 'countdown' | 'missile' | 'detonation'
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef();

  const handleAnalyze = () => {
    if (!simulationParams.attacker || !simulationParams.target) {
      alert("PLEASE ESTABLISH DIRECT COMBATANTS.");
      return;
    }
    
    setIsSimulating(true);
    setSimulationResults(null); 
    setStrikePhase('countdown');
    setCountdown(3);

    let c = 3;
    countdownRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countdownRef.current);
        executeStrikeSequence();
      }
    }, 700);
  };

  const executeStrikeSequence = () => {
    // Missile in flight
    setStrikePhase('missile');
    
    setTimeout(() => {
      // Impact Detonation
      setStrikePhase('detonation');
      
      setTimeout(async () => {
         // Resolve backend data
         try {
           const response = await fetch(`${API_BASE_URL}/api/conflict/simulate-conflict`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(simulationParams)
           });

           if (!response.ok) {
             throw new Error(`HTTP ${response.status}`);
           }

           const data = await response.json();
           if (data.success) {
             setSimulationResults(data);
           } else {
             console.error("Simulation failed:", data);
             alert("Simulation failed to return results. Please try again.");
           }
         } catch (error) {
           console.error("Simulation error:", error);
           alert("Unable to run conflict simulation. Please check the backend service.");
         } finally {
            setIsSimulating(false);
            setStrikePhase(null); // Sequence completed
         }
      }, 1500); // 1.5s detonation
    }, 1800); // 1.8s missile flight
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060a14', color: '#fff', overflowX: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* ── Status Header ── */}
      <div style={{ padding: '2rem 4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <ShieldAlert size={24} color="#f39c12" />
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
                WARGAMES: STRIKE SIM
              </h1>
           </div>
           <p style={{ color: '#5a7a9a', fontSize: '13px', margin: 0 }}>Projecting Global Economic Shifts via Reality Engine v2.0</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
           {[1, 2, 3].map(s => (
             <div key={s} style={{ 
                width: '40px', height: '4px', borderRadius: '2px', 
                background: isSimulating && s===2 ? '#f39c12' : (simulationResults && s<=3 ? '#f39c12' : (s===1 ? '#f39c12' : 'rgba(255,255,255,0.05)')),
                transition: 'all 0.5s'
             }} />
           ))}
        </div>
      </div>

      <div style={{ padding: '3rem 4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr', gap: '2rem', width: '100%', minHeight: '600px' }}>
          
          {/* Left Column: Data & Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <ControlPanel 
              params={simulationParams} 
              onChange={(field, value) => setSimulationParams(prev => ({ ...prev, [field]: value }))} 
              onAnalyze={handleAnalyze}
              isSimulating={isSimulating}
            />

            <AnimatePresence>
              {isSimulating && (
                 <motion.div 
                   key="loading"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}
                 >
                    <div style={{ width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#f39c12', borderRadius: '50%', marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
                    <div style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '2px', color: '#f39c12' }}>SIMULATING IMPACTS...</div>
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                 </motion.div>
              )}
              {simulationResults && !isSimulating && (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                  <ImpactDashboard results={simulationResults} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: 3D Globe Theater */}
          <div style={{ position: 'relative', background: 'rgba(0,0,0,0.5)', borderRadius: '40px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ConflictMap 
                simulationResults={simulationResults} 
                isSimulating={isSimulating} 
                params={simulationParams}
                strikePhase={strikePhase}
                countdown={countdown}
              />
              
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', opacity: 0.3 }}>
                 <div style={{ width: '800px', height: '800px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                 <div style={{ width: '400px', height: '400px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ConflictAnalyzer;
