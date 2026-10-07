const express = require('express');
const router = express.Router();

const { getBoards, createBoard, getBoardById, deleteBoard } = require('../../controllers/kanbanController/boardController');

router.get('/getAll', getBoards)
router.get('/get/:boardId', getBoardById)
router.post('/create', createBoard)
router.delete('/delete/:boardId', deleteBoard)

module.exports = router