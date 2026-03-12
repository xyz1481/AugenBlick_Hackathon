const stabilityService = require('../services/stabilityService');

exports.getGlobalStability = async (req, res) => {
  try {
    const data = await stabilityService.computeGlobalStability();
    res.json({ success: true, data });
  } catch (err) {
    console.error('[StabilityController] Error computing stability score:', err);
    res.status(500).json({ success: false, error: 'Failed to compute global stability score' });
  }
};

