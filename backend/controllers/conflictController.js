const dataService = require('../services/dataService');

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

    // Fetch live API data 
    const liveCommodities = await dataService.fetchCommodities(); 
    const newsEscalation = await dataService.fetchNewsEscalation(attacker, target);
    const dependencyMetric = await dataService.fetchDependencyMetric(attacker, target); // e.g., 0.85 for US/CN
    
    // The higher the news volume (tension) + base intensity, the higher the risk ceiling
    const dynamicEscalation = (intensityFactor + (newsEscalation - 1.0)) * baseMultiplier;

    // Simulate calculated risks using real-world dependencies 
    // If oil is currently very expensive globally (> $85), the risk scales even higher
    const oilBaseRisk = liveCommodities.oil > 80 ? 0.6 : 0.3;
    const oil_price_risk = Math.min(0.98, (oilBaseRisk + Math.random() * 0.2) * dynamicEscalation);
    
    // Shipping delay tied to bilateral trade dependency
    const shipping_delay_risk = Math.min(0.98, (dependencyMetric * 0.7 + Math.random() * 0.2) * dynamicEscalation);
    
    // Fetch specific hyper-realistic AI industry impacts via Groq Llama 3
    const industries_impacted = await dataService.fetchLLMIndustryImpacts(attacker, target, conflictType, intensity, liveCommodities.oil);

    // Generate price forecast trajectories
    // Generate price forecast trajectories tailored to live base data
    const priceForecasts = {
      oil: Array.from({ length: 12 }, (_, i) => liveCommodities.oil + (i * 2 * dynamicEscalation) + (Math.random() * 5 - 2.5)),
      gas: Array.from({ length: 12 }, (_, i) => 3.5 + (i * 0.1 * dynamicEscalation) + (Math.random() * 0.2 - 0.1)),
      wheat: Array.from({ length: 12 }, (_, i) => 600 + (i * 10 * dynamicEscalation) + (Math.random() * 20 - 10))
    };

    res.json({
      success: true,
      simulationId: `SIM-${Date.now()}`,
      parameters: { attacker, target, allies, conflictType, intensity },
      api_context: { 
        live_wti_oil: liveCommodities.oil,
        news_escalation_factor: Number(newsEscalation.toFixed(2)),
        trade_dependency_index: dependencyMetric
      },
      impact: {
        oil_price_risk: Number(oil_price_risk.toFixed(2)),
        shipping_delay_risk: Number(shipping_delay_risk.toFixed(2)),
        gdp_risk: Number((dependencyMetric * 0.5 * dynamicEscalation).toFixed(2)),
        inflation_pressure: Number((0.2 + (liveCommodities.oil > 80 ? 0.3 : 0.1) * dynamicEscalation).toFixed(2)),
        industries_impacted: industries_impacted,
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
