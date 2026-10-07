const express = require('express');
const router = express.Router();

const { createCard, moveCard, updateCard, deleteCard } = require('../../controllers/kanbanController/cardController');

router.post('/create', createCard);
router.patch('/move', moveCard);
router.patch('/update/:cardId', updateCard);
router.delete('/delete/:cardId', deleteCard);


module.exports = router