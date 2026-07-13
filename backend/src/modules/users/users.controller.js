const usersRepository = require('./users.repository');
const AppError = require('../../utils/AppError');

async function search(req, res, next) {
  try {
    const { email } = req.query;
    if (!email || email.length < 3) {
      throw new AppError('Informe ao menos 3 caracteres do e-mail para buscar', 422);
    }
    const users = await usersRepository.searchByEmail(email);
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
