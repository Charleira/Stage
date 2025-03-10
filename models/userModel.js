const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  // Criar usuário
  create: async (username, password, email, role = 'user') => {
    const hashedPassword = await bcrypt.hash(password, 10); // Criptografa a senha
    const [result] = await db.execute(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email, role]
    );
    return result;
  },

  // Verificar se o usuário existe
  findByUsername: async (username) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  },

  // Verificar email
  findByEmail: async (email) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  // Validar senha
  validatePassword: async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
  },

  // Obter todos os usuários
  getAll: async () => {
    const [rows] = await db.execute('SELECT * FROM users');
    return rows;
  },
};

module.exports = User;
