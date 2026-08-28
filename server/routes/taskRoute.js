const express = require('express');
const router = express.Router();
const { createTask, updateTask, getTask, getTaskById, deleteTask } = require('../controllers/taskController')

router.post('/create', createTask);
router.patch('/update/:id', updateTask);
router.get('/get', getTask);
router.get('/get/:id', getTaskById);
router.delete('/delete/:id', deleteTask)

module.exports = router
