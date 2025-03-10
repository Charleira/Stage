const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const authMiddleware = require('../middlewares/authMiddleware');

// Criar equipe
router.post('/create', teamController.createTeam);

// Adicionar jogador à equipe
router.post('/add-player',authMiddleware.captainMiddleware, teamController.addPlayer);


router.post('/accept-invite', teamController.acceptInvite);
// Obter informações da equipe
router.get('/info/:teamId', teamController.getTeamInfo);

module.exports = router;
