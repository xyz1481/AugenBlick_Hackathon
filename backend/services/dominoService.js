// Domino effect simulator: deterministic, rule-based cascades for disruption scenarios.

const SCENARIOS = [
  {
    id: 'hormuz_closure',
    label: 'Strait of Hormuz Closure',
    type: 'chokepoint',
    severity: 'CRITICAL',
  },
  {
    id: 'suez_blockage',
    label: 'Suez Canal Blockage',
    type: 'chokepoint',
    severity: 'HIGH',
  },
  {
    id: 'major_port_shutdown',
    label: 'Major Port Shutdown',
    type: 'port',
    severity: 'HIGH',
  },
  {
    id: 'pipeline_disruption',
    label: 'Energy Pipeline Disruption',
    type: 'pipeline',
    severity: 'ELEVATED',
  },
];

// Simple dependency graph template
const BASE_CHAIN = [
  { id: 'node-oil-supply', label: 'Global Oil Supply', type: 'commodity' },
  { id: 'node-freight', label: 'Shipping & Freight Rates', type: 'logistics' },
  { id: 'node-fuel', label: 'Fuel Costs', type: 'logistics' },
  { id: 'node-transport', label: 'Transportation Costs', type: 'logistics' },
  { id: 'node-food', label: 'Food Prices', type: 'commodity' },
  { id: 'node-inflation', label: 'Headline Inflation', type: 'macro' },
];

function severityMultiplier(severity) {
  switch (severity) {
    case 'CRITICAL':
      return 1.2;
    case 'HIGH':
      return 1.0;
    case 'ELEVATED':
      return 0.7;
    default:
      return 0.5;
  }
}

function simulateScenario(scenarioId, intensity = 0.8) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) {
    throw new Error('Unknown scenario');
  }

  const sevMult = severityMultiplier(scenario.severity);
  const baseShock = intensity * sevMult; // 0–1

  // Build nodes with impact percentages propagating along the chain
  const nodes = [];
  const edges = [];

  // Root scenario node
  const rootId = `scenario-${scenario.id}`;
  nodes.push({
    id: rootId,
    label: scenario.label,
    type: 'scenario',
    impactPct: Math.round(baseShock * 100),
  });

  let currentImpact = baseShock;
  let prevId = rootId;

  BASE_CHAIN.forEach((n, idx) => {
    // Each step attenuates but compounds
    const attenuation = 0.75 - idx * 0.08; // gradually decreasing
    currentImpact = Math.max(0, currentImpact * attenuation);
    const impactPct = Math.round(currentImpact * 100);

    nodes.push({
      id: n.id,
      label: n.label,
      type: n.type,
      impactPct,
    });
    edges.push({
      from: prevId,
      to: n.id,
      relation: 'cascade',
    });
    prevId = n.id;
  });

  // Provide a compact time-phased narrative for animation timelines
  const timeline = [
    { step: 0, nodeId: rootId },
    { step: 1, nodeId: 'node-oil-supply' },
    { step: 2, nodeId: 'node-freight' },
    { step: 3, nodeId: 'node-fuel' },
    { step: 4, nodeId: 'node-transport' },
    { step: 5, nodeId: 'node-food' },
    { step: 6, nodeId: 'node-inflation' },
  ];

  return {
    scenario,
    intensity,
    nodes,
    edges,
    timeline,
  };
}

module.exports = {
  SCENARIOS,
  simulateScenario,
};

