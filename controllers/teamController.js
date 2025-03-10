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
  const { teamId } = req.params;
  const { playerId } = req.body; // ID do jogador a ser convidado

  try {
    // Verifica se o time existe
    const [team] = await db.execute('SELECT captain_id FROM teams WHERE id = ?', [teamId]);

    if (!team) {
      return res.status(404).json({ message: 'Equipe não encontrada' });
    }

    // Verifica se o capitão está fazendo a ação
    if (team.captain_id !== req.user.id) {
      return res.status(403).json({ message: 'Somente o Capitão pode adicionar jogadores.' });
    }

    // Convida o jogador para a equipe
    await db.execute('INSERT INTO invitations (team_id, player_id, status) VALUES (?, ?, ?)', [teamId, playerId, 'pending']);

    return res.status(200).json({ message: 'Convite enviado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao adicionar jogador', error: err.message });
  }
};

// Aceitar convite para a equipe
const acceptInvite = async (req, res) => {
  const { teamId } = req.params;

  try {
    // Aceita o convite do jogador
    await db.execute('UPDATE invitations SET status = ? WHERE team_id = ? AND player_id = ?', ['accepted', teamId, req.user.id]);

    return res.status(200).json({ message: 'Convite aceito com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao aceitar convite', error: err.message });
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

module.exports = { createTeam, addPlayer, getTeamInfo, acceptInvite };
