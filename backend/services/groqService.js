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
      2. 'affectedSystems': JSON Array of strings.
      3. 'supplyChainImpacts': JSON Array of strings.
      4. 'marketImpacts': JSON Array of strings.
      5. 'economicImpacts': JSON Array of strings.
      6. 'riskAssessment': Choose from [Low, Medium, High, Critical].

      Tone: Rigorous, objective, professional. Remove all conversational pleasantries.
      Format: Raw JSON only. Ensure all fields (2-5) are strictly ARRAYS.
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

const moderateContent = async (content) => {
  try {
    const prompt = `
      You are a content moderator for a geopolitical intelligence platform.
      Classify the following message into one of the categories:
      SAFE
      HATE_SPEECH
      ABUSIVE
      THREAT

      CRITICAL GUIDELINES:
      - SAFE: Geopolitical insights, news, predictions, and even aggressive strategic claims (e.g., predicted conflicts between nations, border movements, captures) ARE ALLOWED. Do not flag geopolitical news or predictions as unsafe.
      - HATE_SPEECH/ABUSIVE: Flag only if the content uses slurs, dehumanizing language, or targets specific ethnic/religious groups.
      - THREAT: Flag only if the content contains a direct threat of violence against a specific individual or identifiable civilian group.

      Message: "${content}"

      Return ONLY the category name.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 10,
    });

    return chatCompletion.choices[0]?.message?.content?.trim() || 'SAFE';
  } catch (error) {
    console.error("Moderation Error:", error);
    return 'SAFE'; // Fallback to safe if API fails during moderation
  }
};

const verifyClaim = async (claim, newsSignals = []) => {
  try {
    const signalsText = newsSignals.length > 0
      ? newsSignals.map((s, i) => `${i + 1}. ${s.title} - ${s.source}`).join('\n')
      : "No relevant news signals found in external database.";

    const prompt = `
      You are Reality AI, a geopolitical intelligence analyst.
      Evaluate the credibility of the following claim based on provided external news signals and your internal analytical engine.
      
      Claim: "${claim}"

      Recent news signals:
      ${signalsText}

      RULES:
      1. If multiple credible sources support the claim → credibility HIGH
      2. If sources contradict the claim → credibility LOW
      3. If evidence is mixed or unclear → credibility MEDIUM
      4. If no relevant signals are provided → default to credibility LOW unless internal data strongly suggests otherwise (but favor LOW).

      Return JSON in this format:
      {
        "credibility": "Low | Medium | High",
        "analysisSummary": "brief explanation",
        "supportingSignals": ["list of signals supporting the claim"],
        "contradictions": ["list of signals contradicting the claim"],
        "sources": ["list of news source names used"]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(chatCompletion.choices[0]?.message?.content);
    return result;
  } catch (error) {
    console.error("Verification Error:", error);
    throw new Error("Claim verification failed.");
  }
};

module.exports = { generateIntelReport, moderateContent, verifyClaim };
