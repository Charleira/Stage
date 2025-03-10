const Tournament = require('../models/tournamentModel');
const Team = require('../models/teamModel');

// Criar torneio
const createTournament = async (req, res) => {
    const { name, description, registrationDeadline, hasRegistrationFee, registrationFeeValue } = req.body;
  
    try {
      // Verificar se a taxa de inscrição foi marcada como true e se o valor foi fornecido
      if (hasRegistrationFee && (registrationFeeValue === undefined || registrationFeeValue <= 0)) {
        return res.status(400).json({ message: 'Se a taxa de inscrição estiver ativada, o valor deve ser informado e maior que 0.' });
      }
  
      // Criar o torneio
      const tournamentId = await Tournament.create(name, description, registrationDeadline, hasRegistrationFee, registrationFeeValue);
      res.status(201).json({ message: 'Torneio criado com sucesso!', tournamentId });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao criar torneio', error: err.message });
    }
  };

// Inscrever time no torneio
const registerTeamForTournament = async (req, res) => {
  const { tournamentId, teamId } = req.body;

  try {
    // Verificar se o time existe
    const team = await Team.getTeamById(teamId);
    if (!team) return res.status(400).json({ message: 'Time não encontrado!' });

    // Verificar se o time tem pelo menos 5 jogadores
    const players = await Team.getPlayersByTeam(teamId);
    if (players.length < 5) {
      return res.status(400).json({ message: 'O time precisa ter pelo menos 5 jogadores para se inscrever no torneio.' });
    }

    // Verificar se a inscrição já foi feita para o torneio
    const isRegistered = await Tournament.checkIfTeamRegistered(tournamentId, teamId);
    if (isRegistered) {
      return res.status(400).json({ message: 'O time já está inscrito neste torneio!' });
    }

    // Verificar se a data de inscrição já passou
    const tournament = await Tournament.getTournamentById(tournamentId);
    const currentDate = new Date();
    if (new Date(tournament.registration_deadline) < currentDate) {
      return res.status(400).json({ message: 'Período de inscrição encerrado!' });
    }

    // Inscrever o time no torneio
    await Tournament.registerTeam(tournamentId, teamId);
    res.status(200).json({ message: 'Time inscrito no torneio com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao inscrever time no torneio', error: err.message });
  }
};

// Obter informações do torneio
const getTournamentInfo = async (req, res) => {
  const { tournamentId } = req.params;

  try {
    const tournament = await Tournament.getTournamentById(tournamentId);
    const registrations = await Tournament.getTournamentRegistrations(tournamentId);

    res.status(200).json({ tournament, registrations });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter informações do torneio', error: err.message });
  }
};

// Obter todos os torneios
const getAllTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.getAllTournaments();
    res.status(200).json(tournaments);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter torneios', error: err.message });
  }
};

module.exports = { createTournament, registerTeamForTournament, getTournamentInfo, getAllTournaments };
