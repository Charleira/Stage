const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

// Criar equipe
router.post('/create', teamController.createTeam);

// Adicionar jogador à equipe
router.post('/add-player', teamController.addPlayer);

// Obter informações da equipe
router.get('/info/:teamId', teamController.getTeamInfo);

module.exports = router;
