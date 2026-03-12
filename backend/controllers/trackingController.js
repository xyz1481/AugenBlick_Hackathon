const trackingService = require('../services/trackingService');

exports.getLiveTracking = async (req, res) => {
    try {
        const data = await trackingService.getLiveTrackingData();
        res.json(data);
    } catch (error) {
        console.error('[TrackingController] Error:', error);
        res.status(500).json({ error: 'Failed to retrieve live tracking intelligence' });
    }
};
