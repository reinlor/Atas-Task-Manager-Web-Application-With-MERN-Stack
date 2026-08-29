const express = require('express');
const router = express.Router();
const { updateTeam, findTeam, createTeam, getUserTeams, deleteTeam } = require('../controllers/TeamController');

router.patch('/update/:teamId', updateTeam);
router.get('/get/:teamId', findTeam);
router.get('/get', getUserTeams);
router.post('/create', createTeam);
router.delete('/:teamId', deleteTeam);

module.exports = router;