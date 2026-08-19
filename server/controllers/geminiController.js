const aiModel = require('../models/geminiAIModel');

const handlePrompt = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'A valid string prompt is required in the request body.' 
      });
    }

    const markdownResponse = await aiModel.generateTextFromGemini(prompt.trim());

    return res.status(200).json({ 
      success: true, 
      markdown: markdownResponse 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = { handlePrompt };