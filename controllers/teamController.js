const Team = require('../models/teamModel');
const User = require('../models/userModel');

// Criar equipe
const createTeam = async (req, res) => {
  const { teamName, coachId } = req.body;

  try {
    const coach = await User.findById(coachId);
    if (!coach) return res.status(400).json({ message: 'Coach não encontrado!' });

    const teamId = await Team.create(teamName, coachId);
    res.status(201).json({ message: 'Equipe criada com sucesso!', teamId });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar equipe', error: err.message });
  }
};

// Adicionar jogador à equipe
const addPlayer = async (req, res) => {
  const { teamId, playerId } = req.body;

  try {
    const player = await User.findById(playerId);
    if (!player) return res.status(400).json({ message: 'Jogador não encontrado!' });

    // Verificar se a equipe já tem 7 jogadores
    const players = await Team.getTeamPlayers(teamId);
    if (players.length >= 7) {
      return res.status(400).json({ message: 'A equipe já tem 7 jogadores!' });
    }

    await Team.addPlayer(teamId, playerId);
    res.status(200).json({ message: 'Jogador adicionado à equipe!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao adicionar jogador', error: err.message });
  }
};

// Obter informações da equipe
const getTeamInfo = async (req, res) => {
  const { teamId } = req.params;

  try {
    const team = await Team.getTeamInfo(teamId);
    const players = await Team.getTeamPlayers(teamId);
    const coach = await Team.getTeamCoach(teamId);

    res.status(200).json({ team, players, coach });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter informações da equipe', error: err.message });
  }
};

module.exports = { createTeam, addPlayer, getTeamInfo };
