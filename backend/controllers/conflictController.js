exports.simulateConflict = async (req, res) => {
  try {
    const { attacker, target, allies = [], conflictType = 'Military War', intensity = 50 } = req.body;

    // In a real app, this would use an ML model or complex heuristics based on the countries involved.
    // For now, we simulate the output based on the input parameters.
    
    // Base risk multipliers based on conflict type
    const typeMultipliers = {
      'Military War': 1.5,
      'Trade War': 0.8,
      'Sanctions Conflict': 0.6,
      'Naval Blockade': 1.2,
      'Proxy Conflict': 0.9
    };

    const baseMultiplier = typeMultipliers[conflictType] || 1.0;
    const intensityFactor = intensity / 100; // 0.0 to 1.0

    // Simulate calculated risks
    const oil_price_risk = Math.min(0.95, (0.3 + Math.random() * 0.4) * baseMultiplier * (0.5 + intensityFactor));
    const shipping_delay_risk = Math.min(0.95, (0.2 + Math.random() * 0.5) * baseMultiplier * (0.4 + intensityFactor));
    
    // Determine impacted industries
    const allIndustries = ['Energy', 'Airlines', 'Logistics', 'Agriculture', 'Technology', 'Manufacturing', 'Retail', 'Defense'];
    const numIndustries = Math.floor(Math.random() * 3) + 2 + Math.floor(intensityFactor * 3); // 2 to 7 industries
    
    // Always include some key ones for Military/Naval
    const industries_impacted = new Set();
    if (conflictType === 'Military War' || conflictType === 'Naval Blockade') {
      industries_impacted.add('Energy');
      industries_impacted.add('Logistics');
      industries_impacted.add('Defense');
    } else if (conflictType === 'Trade War' || conflictType === 'Sanctions Conflict') {
      industries_impacted.add('Technology');
      industries_impacted.add('Manufacturing');
      industries_impacted.add('Retail');
    }

    // Add random others
    while (industries_impacted.size < Math.min(numIndustries, allIndustries.length)) {
      industries_impacted.add(allIndustries[Math.floor(Math.random() * allIndustries.length)]);
    }

    // Generate price forecast trajectories
    const priceForecasts = {
      oil: Array.from({ length: 12 }, (_, i) => 75 + (i * 2 * intensityFactor * baseMultiplier) + (Math.random() * 5 - 2.5)),
      gas: Array.from({ length: 12 }, (_, i) => 3.5 + (i * 0.1 * intensityFactor * baseMultiplier) + (Math.random() * 0.2 - 0.1)),
      wheat: Array.from({ length: 12 }, (_, i) => 600 + (i * 10 * intensityFactor) + (Math.random() * 20 - 10))
    };

    res.json({
      success: true,
      simulationId: `SIM-${Date.now()}`,
      parameters: { attacker, target, allies, conflictType, intensity },
      impact: {
        oil_price_risk: Number(oil_price_risk.toFixed(2)),
        shipping_delay_risk: Number(shipping_delay_risk.toFixed(2)),
        gdp_risk: Number((0.1 + Math.random() * 0.3 * intensityFactor).toFixed(2)),
        inflation_pressure: Number((0.2 + Math.random() * 0.4 * intensityFactor * baseMultiplier).toFixed(2)),
        industries_impacted: Array.from(industries_impacted),
      },
      forecasts: priceForecasts,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error in simulateConflict:', error);
    res.status(500).json({ success: false, error: 'Simulation failed' });
  }
};

exports.getImpactResults = async (req, res) => {
  // Normally would fetch by SIM ID. Returning generic data for now.
  res.json({
    success: true,
    message: 'Impact results retrieved successfully'
  });
};

exports.getTradeDependency = async (req, res) => {
  res.json({
    success: true,
    message: 'Trade dependency data retrieved successfully'
  });
};

exports.getCommodityRisk = async (req, res) => {
  res.json({
    success: true,
    message: 'Commodity risk data retrieved successfully'
  });
};

exports.getEnergyImpact = async (req, res) => {
  res.json({
    success: true,
    message: 'Energy impact data retrieved successfully'
  });
};
