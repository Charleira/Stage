const db = require('../config/db');

const Team = {
  // Criar time
  create: async (name, coachId) => {
    const [result] = await db.execute(
      'INSERT INTO teams (name, coach_id) VALUES (?, ?)',
      [name, coachId]
    );
    return result.insertId;
  },

  // Adicionar jogador ao time
  addPlayer: async (teamId, userId) => {
    const [result] = await db.execute(
      'INSERT INTO team_players (team_id, user_id) VALUES (?, ?)',
      [teamId, userId]
    );
    return result;
  },

  // Obter jogadores de um time
  getPlayersByTeam: async (teamId) => {
    const [players] = await db.execute(
      'SELECT u.username, u.id FROM team_players tp JOIN users u ON tp.user_id = u.id WHERE tp.team_id = ?',
      [teamId]
    );
    return players;
  },

  // Obter time por ID
  getTeamById: async (id) => {
    const [team] = await db.execute(
      'SELECT * FROM teams WHERE id = ?',
      [id]
    );
    return team[0];
  },

  // Obter todos os times
  getAllTeams: async () => {
    const [teams] = await db.execute('SELECT * FROM teams');
    return teams;
  }
};

module.exports = Team;
