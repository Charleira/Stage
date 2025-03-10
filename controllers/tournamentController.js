const Tournament = require('../models/tournamentModel');
const Team = require('../models/teamModel');
const MercadoPago = require('../services/mercadoPagoService.js'); 

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
    const team = await Team.getTeamById(teamId);
    if (!team) return res.status(400).json({ message: 'Time não encontrado!' });

    const players = await Team.getPlayersByTeam(teamId);
    if (players.length < 5) {
      return res.status(400).json({ message: 'O time precisa ter pelo menos 5 jogadores para se inscrever no torneio.' });
    }
    
    const isRegistered = await Tournament.checkIfTeamRegistered(tournamentId, teamId);
    if (isRegistered) {
      return res.status(400).json({ message: 'O time já está inscrito neste torneio!' });
    }

    const tournament = await Tournament.getTournamentById(tournamentId);
    if (new Date(tournament.registration_deadline) < new Date()) {
      return res.status(400).json({ message: 'Período de inscrição encerrado!' });
    }

    // Criar pagamento via PIX
    if (tournament.has_registration_fee) {
      const paymentData = await MercadoPago.createPixPayment(
        tournament.registration_fee_value,
        `Inscrição - ${tournament.name}`,
        payerEmail
      );

      if (!paymentData) {
        return res.status(500).json({ message: 'Erro ao gerar pagamento via PIX' });
      }

      // Salvar inscrição com dados do pagamento
      await Tournament.registerTeam(tournamentId, teamId, paymentData.id, paymentData.qr_code);

      return res.status(200).json({
        message: 'Time inscrito com sucesso! Aguardando pagamento.',
        paymentId: paymentData.id,
        qrCode: paymentData.qr_code,
        pixCode: paymentData.pix_code
      });
    }

    // Caso não haja taxa de inscrição
    await Tournament.registerTeam(tournamentId, teamId, 'N/A', 'N/A');
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

const generateBrackets = async (req, res) => {
  const { tournamentId } = req.params;

  try {
    // Busca os times inscritos
    const [teams] = await db.execute(
      'SELECT team_id FROM tournament_registrations WHERE tournament_id = ? AND status = "pago"',
      [tournamentId]
    );

    if (teams.length < 2) {
      return res.status(400).json({ message: 'Número insuficiente de times para gerar chaves' });
    }

    // Embaralhar times aleatoriamente
    teams.sort(() => Math.random() - 0.5);

    // Criar pares para partidas eliminatórias
    const matches = [];
    for (let i = 0; i < teams.length; i += 2) {
      if (teams[i + 1]) {
        matches.push([teams[i].team_id, teams[i + 1].team_id]);
      }
    }

    // Salvar no banco de dados
    for (const match of matches) {
      await db.execute(
        'INSERT INTO tournament_brackets (tournament_id, team1_id, team2_id) VALUES (?, ?, ?)',
        [tournamentId, match[0], match[1]]
      );
    }

    res.status(200).json({ message: 'Chaves do torneio geradas com sucesso!', matches });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar chaves do torneio', error: error.message });
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

const updatePaymentStatus = async (req, res) => {
  const { id } = req.body.data; // Pega o ID do pagamento enviado pelo webhook

  try {
    // Buscar detalhes do pagamento via API do Mercado Pago
    const response = await axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${mercadoPagoToken}` }
    });

    const payment = response.data;
    const paymentStatus = payment.status;
    const paymentId = payment.id;

    // Verifica o status do pagamento
    if (paymentStatus === 'approved') {
      await db.execute(
        'UPDATE tournament_registrations SET status = ? WHERE payment_id = ?',
        ['pago', paymentId]
      );
    } else if (paymentStatus === 'cancelled' || paymentStatus === 'rejected') {
      await db.execute(
        'UPDATE tournament_registrations SET status = ? WHERE payment_id = ?',
        ['cancelado', paymentId]
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro no webhook do Mercado Pago:', err.message);
    res.status(500).json({ message: 'Erro ao atualizar pagamento', error: err.message });
  }
};

// Atualizar torneio
const updateTournament = async (req, res) => {
  const { tournamentId } = req.params;
  const { name, registrationDeadline, registrationFeeValue } = req.body; // Dados para atualização

  try {
    // Verifica se o torneio existe
    const [existingTournament] = await db.execute('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);

    if (!existingTournament) {
      return res.status(404).json({ message: 'Torneio não encontrado' });
    }

    // Verifica se a data de inscrição já passou
    const currentDate = new Date();
    const registrationDeadlineDate = new Date(registrationDeadline);

    if (currentDate > registrationDeadlineDate) {
      return res.status(400).json({ message: 'O prazo de inscrição já passou. Não é possível atualizar este torneio.' });
    }

    // Atualiza os dados do torneio
    await db.execute(
      'UPDATE tournaments SET name = ?, registration_deadline = ?, registration_fee_value = ? WHERE id = ?',
      [name, registrationDeadline, registrationFeeValue, tournamentId]
    );

    return res.status(200).json({ message: 'Torneio atualizado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao atualizar torneio', error: err.message });
  }
};

module.exports = { createTournament, registerTeamForTournament, getTournamentInfo, getAllTournaments, updatePaymentStatus, generateBrackets, updateTournament };
