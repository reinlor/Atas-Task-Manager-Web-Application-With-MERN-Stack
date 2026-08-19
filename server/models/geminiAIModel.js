const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

const generateTextFromGemini = async (promptText) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptText,
      config: {
        systemInstruction: `You are an expert project management AI. Your job is to generate clear, structured, well-formatted Markdown for task management. 
        - OUTPUT ONLY VALID RAW MARKDOWN. 
        - Do not wrap the output in triple backtick markdown code blocks (e.g., do NOT start with \`\`\`markdown).
        - Do not include conversational intros, outros, or explanations before or after the text.`,
        temperature: 0.2,
      }
    });

    return response.text;
  } catch (error) {
    console.error('Error in AI Model:', error);
    throw new Error('Failed to generate content from Gemini API');
  }
};

module.exports = { generateTextFromGemini };