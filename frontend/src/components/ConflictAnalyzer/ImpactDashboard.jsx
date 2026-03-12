import React from 'react';
import { AlertTriangle, TrendingUp, Activity, Anchor, Box, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const ImpactDashboard = ({ results }) => {
  if (!results) return null;
  const { impact } = results;

  const cards = [
    { label: 'ENERGY RISK', val: `${(impact.oil_price_risk * 100).toFixed(1)}%`, icon: <Zap size={20} />, color: '#f39c12' },
    { label: 'LOGISTICS DELAY', val: `${(impact.shipping_delay_risk * 100).toFixed(1)}%`, icon: <Anchor size={20} />, color: '#3498db' },
    { label: 'GDP SHOCK', val: `-${(impact.gdp_risk * 100).toFixed(1)}%`, icon: <Activity size={20} />, color: '#e74c3c' },
    { label: 'INFLATION SPIKE', val: `+${(impact.inflation_pressure * 100).toFixed(1)}%`, icon: <TrendingUp size={20} />, color: '#e67e22' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* High-Level Score Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {cards.map((card, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', borderRadius: '20px' }}>
            <div style={{ color: card.color, marginBottom: '12px' }}>{card.icon}</div>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#5a7a9a', letterSpacing: '1px', marginBottom: '4px' }}>{card.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>{card.val}</div>
          </div>
        ))}
      </div>

      {/* Compromised Sectors List */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} color="#e74c3c" />
          COMPROMISED SECTORS
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
          {impact.industries_impacted.map((industry, i) => {
            const isSevere = i < 2;
            const isHigh = i >= 2 && i < 4;
            
            const color = isSevere ? '#e74c3c' : isHigh ? '#f39c12' : '#f1c40f';
            const label = isSevere ? 'CRITICAL' : isHigh ? 'HIGH RISK' : 'ELEVATED';
            
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `3px solid ${color}` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Box size={14} color={color} opacity={0.7} />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff', letterSpacing: '0.5px' }}>{industry}</span>
                </div>
                <div style={{ fontSize: '10px', fontWeight: '900', color: color, background: `${color}15`, padding: '4px 8px', borderRadius: '6px', letterSpacing: '1px' }}>
                  {label}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

    </div>
  );
};

export default ImpactDashboard;
