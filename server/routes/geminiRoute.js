const express = require('express');
const router = express.Router();
const { handlePrompt } = require('../controllers/geminiController');

router.post('/generate', handlePrompt);

module.exports = router;