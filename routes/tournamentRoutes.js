const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');

// Criar torneio
router.post('/create', tournamentController.createTournament);

// Inscrever time no torneio
router.post('/register', tournamentController.registerTeamForTournament);

// Obter informações do torneio
router.get('/info/:tournamentId', tournamentController.getTournamentInfo);

// Obter todos os torneios
router.get('/', tournamentController.getAllTournaments);


module.exports = router;
