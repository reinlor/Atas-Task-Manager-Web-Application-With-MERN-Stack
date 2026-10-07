const express = require('express');
const router = express.Router();

const { getBoards, createBoard, getBoardById, updateBoard, addColumn, renameColumn, deleteBoard } = require('../../controllers/kanbanController/boardController');

router.get('/getAll', getBoards);
router.get('/get/:boardId', getBoardById);
router.post('/create', createBoard);
router.patch('/update/:boardId', updateBoard);
router.post('/:boardId/columns', addColumn);
router.patch('/:boardId/columns/:columnId', renameColumn);
router.delete('/delete/:boardId', deleteBoard);

module.exports = router