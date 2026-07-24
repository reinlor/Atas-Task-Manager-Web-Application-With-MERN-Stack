const express = require('express');
const router = express.Router();
const { createTask, updateTask, getTask } = require('../controllers/taskController')

router.post('/create', createTask);
router.patch('/update/:id', updateTask);
router.get('/get/:id', getTask);

module.exports = router
