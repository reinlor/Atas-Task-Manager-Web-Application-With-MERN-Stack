const express = require('express');
const router = express.Router();
const { getDashboardByID } = require('../controllers/dashboardController')

router.get('/get', getDashboardByID)

module.exports = router