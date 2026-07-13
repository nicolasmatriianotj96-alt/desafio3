const usersRepository = require('../users/users.repository');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');

async function register({ name, email, password }) {
  const existing = await usersRepository.findByEmail(email);
  if (existing) {
    throw new AppError('Já existe uma conta com este e-mail', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await usersRepository.create({ name, email, passwordHash });
  const token = signToken({ sub: user.id, email: user.email, name: user.name });

  return { user, token };
}

async function login({ email, password }) {
  const user = await usersRepository.findByEmail(email);
  if (!user) {
    throw new AppError('E-mail ou senha inválidos', 401);
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new AppError('E-mail ou senha inválidos', 401);
  }

  const token = signToken({ sub: user.id, email: user.email, name: user.name });
  return {
    user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at },
    token,
  };
}

async function me(userId) {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }
  return user;
}

module.exports = { register, login, me };
