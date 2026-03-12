const { generateIntelReport } = require('../services/groqService');

const getIntelReport = async (req, res) => {
  try {
    const { query, mode } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query is required." });
    }

    const report = await generateIntelReport(query, mode);
    res.json(report);
  } catch (error) {
    console.error("Intel Controller Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getIntelReport };
