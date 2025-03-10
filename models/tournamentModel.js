const db = require('../config/db');

const Tournament = {
  getAll: async () => {
    const [rows] = await db.execute('SELECT * FROM tournaments');
    return rows;
  },
   // Criar torneio com taxa de inscrição
   create: async (name, description, registrationDeadline, hasRegistrationFee, registrationFeeValue) => {
    const [result] = await db.execute(
      'INSERT INTO tournaments (name, description, registration_deadline, has_registration_fee, registration_fee_value) VALUES (?, ?, ?, ?, ?)',
      [name, description, registrationDeadline, hasRegistrationFee, registrationFeeValue]
    );
    return result.insertId;
  },
  // Verificar se o time está inscrito no torneio
  checkIfTeamRegistered: async (tournamentId, teamId) => {
    const [result] = await db.execute(
      'SELECT * FROM tournament_registrations WHERE tournament_id = ? AND team_id = ?',
      [tournamentId, teamId]
    );
    return result.length > 0;
  },

  // Registrar time no torneio com pagamento
registerTeam: async (tournamentId, teamId, paymentId, qrCode) => {
    const [result] = await db.execute(
      'INSERT INTO tournament_registrations (tournament_id, team_id, status, payment_id, qr_code) VALUES (?, ?, ?, ?, ?)',
      [tournamentId, teamId, 'pendente', paymentId, qrCode]
    );
    return result;
  },

module.exports = Tournament;
