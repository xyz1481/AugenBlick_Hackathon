import React, { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';

// Coords for MVP targets
const coordinates = {
  'US': { lat: 38, lng: -97 },
  'CN': { lat: 35, lng: 105 },
  'RU': { lat: 60, lng: 100 },
  'UA': { lat: 48, lng: 31 },
  'IL': { lat: 31, lng: 35 },
  'IR': { lat: 32, lng: 53 },
  'TW': { lat: 23, lng: 120 },
  'IN': { lat: 20, lng: 77 },
  'GB': { lat: 55, lng: -3 },
  'FR': { lat: 46, lng: 2 },
  'DE': { lat: 51, lng: 9 },
  'JP': { lat: 36, lng: 138 }
};

const ConflictMap = ({ simulationResults, isSimulating, params, strikePhase, countdown }) => {
  const globeRef = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [arcsData, setArcsData] = useState([]);
  const [ringsData, setRingsData] = useState([]);
  const [htmlElements, setHtmlElements] = useState([]);
  const [chokepointsData, setChokepointsData] = useState([
    { name: 'Suez Canal', lat: 29.9, lng: 32.5, id: 'Suez', tradeShare: 12 },
    { name: 'Strait of Hormuz', lat: 26.5, lng: 56.2, id: 'Hormuz', tradeShare: 20 },
    { name: 'Malacca Strait', lat: 1.3, lng: 103.4, id: 'Malacca', tradeShare: 15 },
    { name: 'Bab el-Mandeb', lat: 12.6, lng: 43.3, id: 'Bab', tradeShare: 4 },
    { name: 'Panama Canal', lat: 8.9, lng: -79.6, id: 'Panama', tradeShare: 5 }
  ]);

  // Load map geometry once
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries);
  }, []);

  // Animation Sequence Logic
  useEffect(() => {
    const atkCode = params.attacker ? coordinates[params.attacker] : null;
    const tgtCode = params.target ? coordinates[params.target] : null;

    if (strikePhase === 'countdown') {
       const g = globeRef.current;
       if (g && atkCode && tgtCode) {
         const midLat = (atkCode.lat + tgtCode.lat) / 2;
         const midLng = (atkCode.lng + tgtCode.lng) / 2;
         g.pointOfView({ lat: midLat, lng: midLng, altitude: 2.2 }, 800);
       }
       setArcsData([]);
       setRingsData([]);
       setHtmlElements([]);
       
    } else if (strikePhase === 'missile') {
      if (atkCode && tgtCode) {
        setArcsData([{
          startLat: atkCode.lat,
          startLng: atkCode.lng,
          endLat: tgtCode.lat,
          endLng: tgtCode.lng,
          color: ['#ff0000', '#ffaa00'] 
        }]);

        setHtmlElements([{
          lat: atkCode.lat,
          lng: atkCode.lng,
          label: 'LAUNCH DETECTED',
          color: 'orange'
        }]);
      }
      
    } else if (strikePhase === 'detonation') {
      if (tgtCode) {
        setArcsData(prev => prev.map(a => ({...a, color: ['#ff0000', '#ff0000']}))); // Solid red arc
        
        setRingsData([
          { lat: tgtCode.lat, lng: tgtCode.lng, maxR: params.intensity / 4, propagationSpeed: 4, repeatPeriod: 800, color: () => 'rgba(239, 68, 68, 0.8)' },
          { lat: tgtCode.lat, lng: tgtCode.lng, maxR: params.intensity / 6, propagationSpeed: 3, repeatPeriod: 800, color: () => 'rgba(249, 115, 22, 0.8)' },
        ]);

        setHtmlElements([{ lat: tgtCode.lat, lng: tgtCode.lng, label: 'IMPACT EVENT', color: 'red' }]);
        
        const g = globeRef.current;
        if (g) {
           g.pointOfView({ lat: tgtCode.lat, lng: tgtCode.lng, altitude: 1.2 }, 1500); // Zoom in on hit
        }
      }
    } else if (simulationResults && params.target) {
       // Keep final state active
       if (tgtCode) {
         const g = globeRef.current;
         if (g) g.pointOfView({ lat: tgtCode.lat, lng: tgtCode.lng, altitude: 1.8 }, 1500); // Relax zoom slightly
       }
    } else {
      setArcsData([]);
      setRingsData([]);
      setHtmlElements([]);
    }
  }, [strikePhase, simulationResults, params, isSimulating]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }} className="cursor-crosshair">
       <Globe
        ref={globeRef}
        width={700}
        height={700}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        backgroundColor="rgba(6, 10, 20, 1)" /* matching #060a14 */
        
        // Country Styling - Dark mode
        polygonsData={countries.features}
        polygonAltitude={0.01}
        polygonCapColor={d => {
          const iso = d.properties.ISO_A2;
          if (isSimulating || simulationResults) {
            if (iso === params.attacker) return 'rgba(249, 115, 22, 0.6)'; // Orange pulse
            if (iso === params.target) return 'rgba(239, 68, 68, 0.8)'; // Red pulse
          }
          return 'rgba(15, 23, 42, 0.4)'; // Slate 900 base
        }}
        polygonSideColor={() => 'rgba(0,0,0,0.5)'}
        polygonStrokeColor={() => 'rgba(51, 65, 85, 0.4)'} // Slate 700 border
        
        // Rocket Trajectory Arc (Visible when isSimulating, stays when result available)
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={isSimulating ? 0.3 : 1}
        arcDashGap={isSimulating ? 0.2 : 0}
        arcDashAnimateTime={isSimulating ? 1500 : 0}
        arcAltitudeAutoScale={0.4}
        arcStroke={isSimulating ? 2 : 1}
        
        // Impact Shockwaves
        ringsData={ringsData}
        ringColor="color"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"

        // HTML Overlays for Intel markers
        htmlElementsData={[...htmlElements, ...chokepointsData.map(c => ({
            ...c,
            label: c.name,
            color: (simulationResults?.analysis?.chokepoints?.some(cp => cp.includes(c.name.split(' ')[0]))) ? '#f1c40f' : 'rgba(52,152,219,0.3)',
            type: 'chokepoint'
        }))]}
        htmlElement={d => {
          const isChoke = d.type === 'chokepoint';
          const isHighRisk = isChoke && d.color !== 'rgba(52,152,219,0.3)';
          const el = document.createElement('div');
          el.innerHTML = `
            <div class="flex items-center space-x-1 whitespace-nowrap -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div class="w-8 h-8 rounded-full border border-[${d.color}] flex items-center justify-center ${isHighRisk ? 'animate-ping' : ''} absolute"></div>
              <div class="w-1.5 h-1.5 rounded-full bg-[${d.color}] shadow-[0_0_10px_${d.color}] relative z-10"></div>
              <div class="flex flex-col gap-0.5">
                <div class="bg-[rgba(6,10,20,0.8)] border border-[${d.color}] text-[${d.color}] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                  ${d.label}
                </div>
                ${isChoke ? `
                <div class="bg-[rgba(0,0,0,0.6)] text-[10px] text-white/70 px-2 py-0.5 rounded font-bold border border-white/5 flex gap-2">
                   <span>TRADE: ${d.tradeShare}%</span>
                   ${isHighRisk ? '<span class="text-orange-500">DISRUPTED</span>' : ''}
                </div>` : ''}
              </div>
            </div>
          `;
          return el;
        }}
      />
      
      {/* ── CUSTOM ANIMATION OVERLAYS ── */}
      
      {strikePhase === 'countdown' && (
         <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 50 }}>
            <div key={countdown} className="text-red-500 font-mono font-black" style={{ fontSize: '140px', textShadow: '0 0 80px rgba(231,76,60,0.8)', lineHeight: 1, animation: 'pulseZoom 0.7s ease-out forwards' }}>
               {countdown > 0 ? countdown : 'FIRE'}
            </div>
         </div>
      )}

      {strikePhase === 'missile' && (
         <div style={{ position: 'absolute', left: '48%', bottom: '10%', zIndex: 60, pointerEvents: 'none', animation: 'flyUp 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
               <div style={{ width: '8px', height: '30px', background: 'linear-gradient(to bottom, #c0392b, #e74c3c)', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', boxShadow: '0 0 20px rgba(231,76,60,0.9)' }} />
               <div style={{ width: '8px', height: '20px', background: 'linear-gradient(to bottom, #bdc3c7, #7f8c8d)' }} />
               {/* Engine Exhaust */}
               <div style={{ width: '16px', height: '50px', background: 'linear-gradient(to bottom, rgba(255,165,0,0.9), transparent)', filter: 'blur(4px)', marginTop: '-4px', animation: 'exhaustFlicker 0.1s infinite alternate' }} />
            </div>
         </div>
      )}

      {(strikePhase === 'detonation' || strikePhase === 'flash') && (
         <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,200,150,0.95) 0%, rgba(231,76,60,0.5) 40%, transparent 70%)', pointerEvents: 'none', zIndex: 70, animation: 'detonationFlash 1.5s ease-out forwards' }} />
      )}

      {strikePhase === 'detonation' && (
         <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 200, animation: 'screenShake 0.5s ease-in-out' }} />
      )}

      <style>{`
        @keyframes pulseZoom { 0% { transform: scale(2.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes flyUp { 0% { transform: translateY(100%); opacity: 1; } 100% { transform: translateY(-300%); opacity: 0; } }
        @keyframes exhaustFlicker { 0% { opacity: 0.7; transform: scaleY(0.9); } 100% { opacity: 1; transform: scaleY(1.2); } }
        @keyframes detonationFlash { 0% { opacity: 0; } 10% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes screenShake { 0% { transform: translate(0,0) } 20% { transform: translate(-4px, 4px) } 40% { transform: translate(6px, -5px) } 60% { transform: translate(-3px, 5px) } 80% { transform: translate(4px, -2px) } 100% { transform: translate(0,0) } }
      `}</style>
      
      {/* Target UI Overlay overlay crosshairs in the absolute center of component, to give it that "targeting" system feel */}
      <div className="absolute inset-x-0 inset-y-0 pointer-events-none flex items-center justify-center overflow-hidden">
         <div className="w-[800px] h-[800px] border-[0.5px] border-neutral-800 rounded-full opacity-20" />
         <div className="w-[600px] h-[600px] border-[0.5px] border-neutral-700/30 rounded-full opacity-20 absolute" />
         <div className="w-[400px] h-[400px] border-[0.5px] border-neutral-600/30 rounded-full opacity-30 absolute" />
         <div className="w-[200px] h-[200px] border-[1px] border-cyan-900/40 rounded-full opacity-40 absolute flex justify-center items-center">
             {/* Center Cross */}
             <div className="w-12 h-[1px] bg-cyan-500/50 absolute" />
             <div className="h-12 w-[1px] bg-cyan-500/50 absolute" />
         </div>
      </div>
    </div>
  );
};

export default ConflictMap;
