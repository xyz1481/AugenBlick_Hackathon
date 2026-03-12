const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateIntelReport = async (query, mode) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in backend .env file.");
  }

  try {
    const isHypothetical = mode === 'Hypothetical';

    const prompt = `
      You are Reality Intelligence Agent, a strategic analytical system.
      Analyze the following core geopolitical query: "${query}"
      Operation Mode: ${mode}. 

      ${isHypothetical ? "STRATEGIC PROJECTION: Construct a direct systemic cascade. Formulate the 'summary' as a single string of 4-5 interconnected nodes separated by '→' characters. Format: Primary Event → Resource/System Disruption → Immediate Logistic/Sector Impact → Macro-Financial Consequence." : "OPERATIONAL INTELLIGENCE: Analyze active signals. Construct the 'summary' as an interconnected series of events separated by '→'."}

      Output Requirements:
      1. 'summary': Strictly a chain of events using '→' as the delimiter.
      2. 'affectedSystems': List of high-level industrial or national systems.
      3. 'supplyChainImpacts': Specific technical disruptions.
      4. 'marketImpacts': Quantifiable or directional financial markers.
      5. 'economicImpacts': Broad sovereign or regional fiscal consequences.
      6. 'riskAssessment': Choose from [Low, Medium, High, Critical].

      Tone: Rigorous, objective, professional. Remove all conversational pleasantries.
      Format: Raw JSON only.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" },
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    console.log("Groq Raw Response:", responseContent);

    return JSON.parse(responseContent);
  } catch (error) {
    console.error("Groq Service Error:", error);
    if (error.message.includes("JSON")) {
      throw new Error("Groq returned invalid data format. Please try again.");
    }
    throw new Error(`Groq Error: ${error.message}`);
  }
};

module.exports = { generateIntelReport };
