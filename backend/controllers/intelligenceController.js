const intelligenceService = require('../services/intelligenceService');
const stabilityService = require('../services/stabilityService');
const systemsService = require('../services/systemsService');

exports.analyzeEvent = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ success: false, error: 'Query is required' });
        }

        console.log(`[IntelligenceController] Analyzing event: "${query}"`);

        // 1. Get current systems overview (needed for price baselines)
        const systems = await systemsService.getSystemsOverview();

        // 2. Analyze event with LLM
        const analysis = await intelligenceService.analyzeEvent(query);

        // 3. Build impact graph (NetworkX based) with market estimation
        const graph = await intelligenceService.buildGraph(query, systems);

        // 4. Compute current stability context
        const stability = await stabilityService.computeGlobalStability();

        res.json({
            success: true,
            analysis,
            graph,
            stability,
            systems,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('[IntelligenceController] Error:', err);
        res.status(500).json({ success: false, error: 'Internal Server Error during analysis' });
    }
};
