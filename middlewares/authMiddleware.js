const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Pega o token do header

  if (!token) {
    return res.status(401).json({ message: 'Acesso não autorizado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Armazena dados do usuário no request
    next(); // Prossegue para a rota
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido ou expirado' });
  }
};

// Middleware para verificar se o usuário é um Administrador
const adminMiddleware = async (req, res, next) => {
    const userId = req.user.id; // Assumindo que você está usando algum sistema de autenticação com o id do usuário
  
    try {
      // Verifica no banco se o usuário tem a role 'admin'
      const [user] = await db.execute('SELECT role FROM users WHERE id = ?', [userId]);
  
      if (user && user.role === 'admin') {
        return next(); // Continua o fluxo se for admin
      }
  
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar essa ação.' });
    } catch (err) {
      return res.status(500).json({ message: 'Erro ao verificar a autorização', error: err.message });
    }
  };
  
  // Middleware para verificar se o usuário é o Capitão do time
  const captainMiddleware = async (req, res, next) => {
    const userId = req.user.id; // ID do usuário autenticado
    const { teamId } = req.params; // ID do time, que pode ser passado na URL
    
    try {
      // Verifica se o usuário é o Capitão da equipe
      const [team] = await db.execute('SELECT captain_id FROM teams WHERE id = ?', [teamId]);
  
      if (team && team.captain_id === userId) {
        return next(); // Permite o acesso se o usuário for o capitão
      }
  
      return res.status(403).json({ message: 'Acesso negado. Apenas o Capitão pode realizar essa ação.' });
    } catch (err) {
      return res.status(500).json({ message: 'Erro ao verificar a autorização', error: err.message });
    }
  };
  
  // Middleware para verificar se o jogador está convidado para a equipe e precisa aceitar
  const playerMiddleware = async (req, res, next) => {
    const userId = req.user.id; // ID do usuário autenticado
    const { teamId } = req.params; // ID do time
  
    try {
      // Verifica no banco se o jogador foi convidado para o time e está pendente
      const [invitation] = await db.execute('SELECT status FROM invitations WHERE team_id = ? AND player_id = ?', [teamId, userId]);
  
      if (invitation && invitation.status === 'pending') {
        return next(); // Jogador pode aceitar o convite
      }
  
      return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para se juntar a essa equipe.' });
    } catch (err) {
      return res.status(500).json({ message: 'Erro ao verificar o convite', error: err.message });
    }
  }

module.exports = { adminMiddleware, captainMiddleware, playerMiddleware, authMiddleware };
