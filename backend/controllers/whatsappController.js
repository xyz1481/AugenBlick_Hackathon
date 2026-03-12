const User = require('../models/User');
const { sendWhatsappMessage } = require('../services/whatsappService');

exports.sendUpdateToUser = async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) return res.status(400).json({ error: 'userId and message are required' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    await sendWhatsappMessage(user.phone, message);

    return res.json({ success: true, to: user.phone });
  } catch (err) {
    console.error('[WhatsApp]', err);
    return res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
};

exports.broadcastNewsByCountry = async (req, res) => {
  try {
    const { country, topic } = req.body;
    if (!country || !topic) {
      return res.status(400).json({ error: 'country and topic are required' });
    }

    const newsData = await getNarrativeFromNews(topic);
    const articles = (newsData && newsData.topNarratives) ? newsData.topNarratives : [];
    if (!articles.length) {
      return res.status(404).json({ error: 'No news articles found for this topic' });
    }

    const top = articles[0];
    const message = `Update (${country}): ${top.title}\n${top.link}`;

    const users = await User.find({ country: { $regex: `^${country.trim()}$`, $options: 'i' } }).lean();
    if (!users.length) {
      return res.status(404).json({ error: `No users found for country: ${country}` });
    }

    const results = await Promise.allSettled(
      users.map(u => sendWhatsappMessage(u.phone, message))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    return res.json({
      success: true,
      country,
      topic,
      message,
      userCount: users.length,
      sent: successCount,
      failed: failureCount,
    });
  } catch (err) {
    console.error('[WhatsApp][broadcast]', err);
    return res.status(500).json({ error: 'Failed to broadcast WhatsApp message' });
  }
};