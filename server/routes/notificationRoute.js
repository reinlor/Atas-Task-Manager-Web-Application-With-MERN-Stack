const express = require('express');
const router = express.Router();
const { getNotification, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.get('/', getNotification);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

module.exports = router;