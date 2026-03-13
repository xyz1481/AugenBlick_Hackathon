const systemsService = require('../services/systemsService');

exports.getSystemsOverview = async (req, res) => {
  try {
    const data = await systemsService.getSystemsOverview();
    res.json({ success: true, data });
  } catch (err) {
    console.error('[SystemsController] Failed to fetch systems overview:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch systems overview' });
  }
};

