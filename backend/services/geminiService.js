const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const generateIntelReport = async (query, mode) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in backend .env file.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const isHypothetical = mode === 'Hypothetical';

    const prompt = `
      You are Reality Intelligence Agent, an elite geopolitical strategist.
      Analyze the following query: "${query}"
      The analysis mode is: ${mode}. 
      ${isHypothetical ? "HYPOTHETICAL MODE ACTIVE: Focus on systemic cascade analysis. Trace the domino effect: Event -> Strategic Resources -> Global Supply Chains -> National Economic Sectors -> Financial Markets." : "REAL WORLD MODE ACTIVE: Focus on current verified intelligence, verified signals, and measurable data points."}

      Task: Generate a detailed structural analysis briefing.
      
      Respond ONLY with a JSON object in this exact format:
      {
          "summary": "High-level briefing of the situation",
          "affectedSystems": ["System 1", "System 2"],
          "supplyChainImpacts": ["Specific disruption points"],
          "marketImpacts": ["Commodity/Equity effects"],
          "economicImpacts": ["Macroeconomic implications"],
          "riskAssessment": "Low" | "Medium" | "High" | "Critical"
      }

      Strict rule: Do not include formatting like markdown code blocks (\`\`\`json). Just the raw JSON object.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    if (response.promptFeedback && response.promptFeedback.blockReason) {
      throw new Error(`Gemini blocked the prompt: ${response.promptFeedback.blockReason}`);
    }

    const text = response.text();
    console.log("Gemini Raw Response:", text);

    // More robust JSON extraction
    let jsonContent = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    return JSON.parse(jsonContent);
  } catch (error) {
    console.error("Gemini Service Error:", error);
    if (error.message.includes("JSON")) {
      throw new Error("Gemini returned invalid data format. Please try again.");
    }
    throw new Error(`Gemini Error: ${error.message}`);
  }
};

module.exports = { generateIntelReport };
