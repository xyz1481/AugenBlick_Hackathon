const axios = require('axios');
const Groq = require('groq-sdk');
const dataService = require('./dataService');
const trackingService = require('./trackingService');
const stabilityService = require('./stabilityService');

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const groq = new Groq({ apiKey: GROQ_API_KEY });

/**
 * Analyzes a raw event string using LLM to extract structured entities.
 */
async function analyzeEvent(query) {
    try {
        const prompt = `You are a global intelligence analyzer. Analyze the following event or scenario: "${query}"
        
        Extract the following impact components in JSON format:
        1. primary_region: The geograhpic region or country.
        2. actors: Key countries, companies, or groups involved.
        3. chokepoints: Specific maritime or logistics chokepoints affected (e.g. Suez Canal, Bab el-Mandeb, Strait of Hormuz).
        4. commodities: Commodity markets affected (e.g. Crude Oil, Natural Gas, Wheat).
        5. sectors: Broader economic sectors hit (e.g. Semiconductors, Tourism, Automotive).
        6. logic: A brief 2-sentence explanation of the cascading chain.

        Return ONLY raw JSON. No markdown.
        Format:
        {
            "region": "Middle East",
            "actors": ["Israel", "Iran"],
            "chokepoints": ["Strait of Hormuz"],
            "commodities": ["Crude Oil"],
            "sectors": ["Energy", "Finance"],
            "logic": "Conflict near the Strait of Hormuz restricts global tankers, spiking oil prices and increasing shipping insurance costs."
        }`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-8b-8192",
            temperature: 0.1,
            max_tokens: 400
        });

        const raw = chatCompletion.choices[0]?.message?.content || "{}";
        return JSON.parse(raw.replace(/```json|```/g, ''));
    } catch (err) {
        console.error('[IntelligenceService] Analysis failed:', err.message);
        return {
            region: "Global",
            actors: ["Market Actors"],
            chokepoints: ["Suez Canal"],
            commodities: ["Global Commodities"],
            sectors: ["General Economy"],
            logic: "Unable to parse specific chain; defaulting to general system stress."
        };
    }
}

const { exec } = require('child_process');
const path = require('path');

const marketImpactService = require('./marketImpactService');

/**
 * Builds a formal graph structure using the Python NetworkX script.
 */
async function buildGraph(query, systemsData = null) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '..', 'scripts', 'impact_graph.py');
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        
        exec(`${pythonCmd} "${scriptPath}" "${query}"`, async (error, stdout, stderr) => {
            if (error) {
                console.error(`[IntelligenceService] Graph error: ${error.message}`);
                return resolve({ nodes: [], edges: [], logic: "Fallback to manual parsing due to script error." });
            }
            try {
                const result = JSON.parse(stdout);
                if (result.error) throw new Error(result.error);
                
                // Estimate market impact if we have current prices
                let marketImpact = null;
                if (systemsData && systemsData.commodities) {
                    marketImpact = await marketImpactService.estimateCommodityImpacts(result.event_type, systemsData.commodities);
                }
                
                resolve({
                    nodes: result.nodes,
                    edges: result.edges,
                    logic: result.summary,
                    eventType: result.event_type,
                    marketImpact: marketImpact
                });
            } catch (err) {
                console.error('[IntelligenceService] Parse error:', err.message);
                resolve({ nodes: [], edges: [], logic: "Error interpreting propagation results." });
            }
        });
    });
}

module.exports = {
    analyzeEvent,
    buildGraph
};
