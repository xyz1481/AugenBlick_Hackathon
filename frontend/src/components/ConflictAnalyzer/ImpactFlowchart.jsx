import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, EdgeText, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const ImpactFlowchart = ({ results }) => {
  if (!results) return null;

  const { impact, parameters } = results;
  
  const nodes = useMemo(() => {
    const baseNodes = [
      {
        id: 'conflict',
        data: { label: `${parameters.conflictType.toUpperCase()}\n[ ${parameters.attacker} v ${parameters.target} ]` },
        position: { x: 150, y: 20 },
        style: { 
           background: '#0f172a', 
           color: '#ef4444', 
           border: '1px solid #7f1d1d', 
           borderRadius: '4px', 
           padding: '12px', 
           fontSize: '10px', 
           fontFamily: 'monospace',
           fontWeight: '900',
           textAlign: 'center',
           boxShadow: '0 0 15px rgba(220, 38, 38, 0.2)',
           width: 180
        }
      },
      {
        id: 'supply',
        data: { label: impact.oil_price_risk > 0.6 ? 'GLOBAL ENERGY\nDISRUPTION DETECTED' : 'SUPPLY CHAIN\nFRICTION WARNING' },
        position: { x: 150, y: 120 },
        style: { 
           background: '#060a14', 
           color: '#f97316', 
           border: '1px solid #9a3412', 
           borderLeft: '4px solid #f97316',
           borderRadius: '2px', 
           padding: '10px', 
           fontSize: '9px',
           fontFamily: 'monospace',
           fontWeight: '700',
           textAlign: 'center',
           width: 180
        }
      },
      {
        id: 'logistics',
        data: { label: `LOGISTICS DELAY\n[ +${(impact.shipping_delay_risk * 100).toFixed(0)}% ]` },
        position: { x: 150, y: 220 },
        style: { 
           background: '#060a14', 
           color: '#eab308', 
           border: '1px solid #854d0e',
           borderLeft: '4px solid #eab308', 
           borderRadius: '2px', 
           padding: '10px', 
           fontSize: '9px',
           fontFamily: 'monospace',
           fontWeight: '700',
           textAlign: 'center',
           width: 180
        }
      }
    ];

    // Add industry nodes
    impact.industries_impacted.slice(0, 3).forEach((industry, idx) => {
      baseNodes.push({
        id: `ind-${idx}`,
        data: { label: `${industry.toUpperCase()}\nIMPACT` },
        position: { x: idx === 0 ? 0 : idx === 1 ? 150 : 300, y: 320 },
        style: { 
           background: '#0f172a', 
           color: '#cbd5e1', 
           border: '1px solid #334155', 
           borderRadius: '2px', 
           padding: '8px', 
           fontSize: '8px',
           fontFamily: 'monospace',
           fontWeight: 'bold',
           textAlign: 'center',
           width: 120
        }
      });
    });

    return baseNodes;
  }, [results]);

  const edges = useMemo(() => {
    const defaultEdgeOptions = {
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
    };

    const baseEdges = [
      { id: 'e1', source: 'conflict', target: 'supply', ...defaultEdgeOptions, style: { stroke: '#ef4444', strokeWidth: 2 } },
      { id: 'e2', source: 'supply', target: 'logistics', ...defaultEdgeOptions, markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' }, style: { stroke: '#f97316', strokeWidth: 2 } },
    ];

    impact.industries_impacted.slice(0, 3).forEach((_, idx) => {
      baseEdges.push({
        id: `e-ind-${idx}`,
        source: 'logistics',
        target: `ind-${idx}`,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
        style: { stroke: '#475569', strokeDasharray: '5,5' }
      });
    });

    return baseEdges;
  }, [results]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#060a14', borderRadius: '4px', border: '1px solid #1e293b' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        {/* Tactical grid background */}
        <Background color="#1e293b" gap={15} size={1} />
        <Background color="#0f172a" gap={75} size={2} />
        <Controls showInteractive={false} style={{ fill: '#475569' }} />
      </ReactFlow>
    </div>
  );
};

export default ImpactFlowchart;
