const { GoogleGenAI } = require('@google/genai');

const analyzeScamMessage = async (message) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Check local keywords first as a pre-filter
    const keywords = ['urgent', 'blocked', 'otp', 'verify now', 'suspend', 'unauthorized'];
    const lowerMessage = message.toLowerCase();
    const hasSuspiciousKeywords = keywords.some(keyword => lowerMessage.includes(keyword));
    
    const prompt = `
      You are an expert cybersecurity analyst. Analyze the following message for potential phishing, scam, or social engineering tactics.
      Message: "${message}"
      
      Respond in the following JSON format ONLY, do not include markdown formatting like \`\`\`json:
      {
        "isScam": true/false,
        "confidence": 0-100,
        "explanation": "A concise explanation of why this is or isn't a scam, highlighting specific tactics used."
      }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
             responseMimeType: "application/json",
        }
    });

    const resultText = response.text || (response.candidates && response.candidates[0].content.parts[0].text);
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }
    const result = JSON.parse(resultText);
    
    // Add local flag if keywords matched but AI said no (defense in depth)
    if (hasSuspiciousKeywords && !result.isScam) {
        result.explanation += " (Note: Flagged locally due to suspicious keywords like urgent/OTP/blocked).";
    }

    return result;
  } catch (error) {
    console.error('Error analyzing scam message with Gemini:', error);
    throw new Error('Failed to analyze message');
  }
};

module.exports = { analyzeScamMessage };
