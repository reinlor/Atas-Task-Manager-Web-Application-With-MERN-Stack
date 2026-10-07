const express = require('express');
const router = express.Router();

const { createCard, moveCard } = require('../../controllers/kanbanController/cardController');

router.post('/create', createCard)
router.patch('/move', moveCard)


module.exports = router