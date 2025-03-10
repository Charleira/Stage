const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Criar torneio
router.post('/create', authMiddleware.adminMiddleware, tournamentController.createTournament);

// Atualizar torneio (somente administrador e antes da data de inscrição)
router.put('/update/:tournamentId', adminMiddleware, tournamentController.updateTournament);

// Inscrever time no torneio
router.post('/register', authMiddleware.captainMiddleware, tournamentController.registerTeamForTournament);

// Obter informações do torneio
router.get('/info/:tournamentId', tournamentController.getTournamentInfo);

// Obter todos os torneios
router.get('/', tournamentController.getAllTournaments);

router.post('/webhook/mercadopago', tournamentController.updatePaymentStatus);

router.post('/generate-brackets/:tournamentId', authMiddleware.adminMiddleware, tournamentController.generateBrackets);


module.exports = router;
