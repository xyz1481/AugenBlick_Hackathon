const eventService = require('../services/eventService');

exports.getLiveEvents = async (req, res) => {
  try {
    const events = await eventService.fetchLiveEvents();
    res.json({ success: true, events });
  } catch (err) {
    console.error('[EventController] Failed to fetch live events:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch live events' });
  }
};

exports.getEventImpactChain = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await eventService.getEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found in current feed' });
    }

    const graph = await eventService.buildImpactChain(event);
    res.json({ success: true, event, graph });
  } catch (err) {
    console.error('[EventController] Failed to build impact chain:', err);
    res.status(500).json({ success: false, error: 'Failed to build impact chain for event' });
  }
};

