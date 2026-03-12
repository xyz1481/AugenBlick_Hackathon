import React from 'react';
import { Target, MapPin, Gauge, ShieldAlert, Globe as GlobeIcon } from 'lucide-react';

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CN', name: 'China' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'IL', name: 'Israel' },
  { code: 'IR', name: 'Iran' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' }
];

const CONFLICT_TYPES = [
  'Military War',
  'Trade War',
  'Sanctions Conflict',
  'Naval Blockade',
  'Proxy Conflict'
];

const ControlPanel = ({ params, onChange, onAnalyze, isSimulating }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Target & Aggressor Block */}
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '32px', border: '1px solid rgba(243, 156, 18, 0.2)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <GlobeIcon size={18} color="#f39c12" />
          <span style={{ fontWeight: '900', letterSpacing: '2px', fontSize: '12px', color: '#f39c12' }}>COMBATANT ACQUISITION</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Attacker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '800', color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Target size={14} color="#e74c3c" />
              <span>Initiator</span>
            </label>
            <select 
              style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', padding: '12px', outline: 'none', fontSize: '12px', fontFamily: 'monospace' }}
              value={params.attacker}
              onChange={(e) => onChange('attacker', e.target.value)}
            >
              <option value="">[ SELECT INITIATOR ]</option>
              {COUNTRIES.map(c => <option key={`atk-${c.code}`} value={c.code}>{c.code} - {c.name.toUpperCase()}</option>)}
            </select>
          </div>

          {/* Target */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '800', color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <MapPin size={14} color="#3498db" />
              <span>Target Country</span>
            </label>
            <select 
              style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', padding: '12px', outline: 'none', fontSize: '12px', fontFamily: 'monospace' }}
              value={params.target}
              onChange={(e) => onChange('target', e.target.value)}
            >
              <option value="">[ SELECT TARGET ]</option>
              {COUNTRIES.map(c => <option key={`tgt-${c.code}`} value={c.code}>{c.code} - {c.name.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Vector & Intensity Block and Launch Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
        
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Conflict Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '800', color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <ShieldAlert size={14} color="#f39c12" />
              <span>Theater Typology</span>
            </label>
            <select 
              style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', color: '#fff', padding: '10px', outline: 'none', fontSize: '11px', fontFamily: 'monospace' }}
              value={params.conflictType}
              onChange={(e) => onChange('conflictType', e.target.value)}
            >
              {CONFLICT_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>

          {/* Intensity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: '800', color: '#5a7a9a', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gauge size={14} color="#3498db" />
                <span>Escalation Matrix</span>
              </div>
              <span style={{ color: params.intensity > 80 ? '#e74c3c' : params.intensity > 40 ? '#f39c12' : '#3498db', fontFamily: 'monospace' }}>
                OP-LVL {params.intensity}
              </span>
            </label>
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={params.intensity}
              onChange={(e) => onChange('intensity', parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#3498db', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onAnalyze}
          disabled={isSimulating || !params.attacker || !params.target || params.attacker === params.target}
          style={{ 
            borderRadius: '24px', 
            background: (isSimulating || !params.attacker || !params.target || params.attacker === params.target) ? '#111' : 'linear-gradient(to right, #f39c12, #d35400)', 
            color: '#fff', fontWeight: '900', fontSize: '14px', cursor: (isSimulating || !params.attacker || !params.target || params.attacker === params.target) ? 'not-allowed' : 'pointer', border: 'none',
            boxShadow: (!isSimulating && params.attacker && params.target && params.attacker !== params.target) ? '0 0 30px rgba(243, 156, 18, 0.3)' : 'none',
            opacity: (isSimulating || !params.attacker || !params.target || params.attacker === params.target) ? 0.3 : 1,
            transition: 'all 0.3s'
          }}
        >
          {isSimulating ? 'SIMULATING...' : 'FIRE'}
        </button>
      </div>

      {params.attacker && params.target && params.attacker === params.target && (
         <div style={{ textAlign: 'center', color: '#e74c3c', fontSize: '10px', fontWeight: '800', marginTop: '-10px' }}>
            Initiator and Target cannot be identical.
         </div>
      )}
    </div>
  );
};

export default ControlPanel;
