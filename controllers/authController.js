const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Criar usuário
const register = async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const existingUser = await User.findByUsername(username);
    if (existingUser) return res.status(400).json({ message: 'Usuário já existe!' });

    const newUser = await User.create(username, password, email);

    res.status(201).json({ message: 'Usuário registrado com sucesso!', id: newUser.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao registrar usuário', error: err.message });
  }
};

// Login de usuário
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findByUsername(username);
    if (!user) return res.status(400).json({ message: 'Usuário não encontrado!' });

    const isValid = await User.validatePassword(password, user.password);
    if (!isValid) return res.status(400).json({ message: 'Senha incorreta!' });

    // Gerar token JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login bem-sucedido', token });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao fazer login', error: err.message });
  }
};

// Recuperação de senha
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({ message: 'Email não encontrado!' });

    // Criar link de recuperação de senha (pode ser um código gerado ou um token)
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Enviar email com o link de recuperação
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      to: email,
      subject: 'Recuperação de Senha',
      text: `Clique no link para recuperar sua senha: ${resetLink}`,
    });

    res.status(200).json({ message: 'Email de recuperação enviado!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao enviar email', error: err.message });
  }
};

// Resetar senha
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.userId]);

    res.status(200).json({ message: 'Senha alterada com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao resetar senha', error: err.message });
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
