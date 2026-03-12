const dominoService = require('../services/dominoService');

exports.listScenarios = (req, res) => {
  res.json({ success: true, scenarios: dominoService.SCENARIOS });
};

exports.runScenario = (req, res) => {
  try {
    const { id } = req.params;
    const { intensity } = req.body || {};
    const sim = dominoService.simulateScenario(id, intensity ?? 0.8);
    res.json({ success: true, simulation: sim });
  } catch (err) {
    console.error('[DominoController] Failed to run scenario:', err.message);
    res.status(400).json({ success: false, error: err.message || 'Simulation failed' });
  }
};

