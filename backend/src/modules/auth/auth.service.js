const usersRepository = require('../users/users.repository');
const categoriesRepository = require('../categories/categories.repository');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');

// Categorias sugeridas para um fluxo de produção de conteúdo (roteiro até
// publicação) — contexto de streaming/mídia, criadas automaticamente para
// toda conta nova como ponto de partida.
const DEFAULT_CATEGORIES = [
  { name: 'Roteiro', color: '#f97316' },
  { name: 'Gravação', color: '#db2777' },
  { name: 'Edição', color: '#7c3aed' },
  { name: 'Pós-produção', color: '#0ea5e9' },
  { name: 'Publicação', color: '#16a34a' },
];

async function seedDefaultCategories(ownerId) {
  try {
    await Promise.all(
      DEFAULT_CATEGORIES.map((category) => categoriesRepository.create({ ...category, ownerId })),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Falha ao semear categorias padrão para o usuário', ownerId, err);
  }
}

async function register({ name, email, password }) {
  const existing = await usersRepository.findByEmail(email);
  if (existing) {
    throw new AppError('Já existe uma conta com este e-mail', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await usersRepository.create({ name, email, passwordHash });
  const token = signToken({ sub: user.id, email: user.email, name: user.name });

  await seedDefaultCategories(user.id);

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
