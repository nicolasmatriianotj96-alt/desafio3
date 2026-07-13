const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Token de autenticação ausente ou inválido', 401));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    return next(new AppError('Token de autenticação expirado ou inválido', 401));
  }
}

module.exports = { requireAuth };
