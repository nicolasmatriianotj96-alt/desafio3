const AppError = require('../utils/AppError');

function notFoundHandler(req, res) {
  res.status(404).json({ message: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }

  if (err && err.code === '23505') {
    // unique_violation do Postgres
    return res.status(409).json({ message: 'Registro já existe (violação de unicidade)' });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ message: 'Erro interno do servidor' });
}

module.exports = { notFoundHandler, errorHandler };
