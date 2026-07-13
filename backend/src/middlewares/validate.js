const AppError = require('../utils/AppError');

/**
 * Middleware factory que valida req.body/query/params contra schemas Zod.
 * schemas: { body?, query?, params? }
 */
function validate(schemas) {
  return (req, res, next) => {
    for (const key of ['body', 'query', 'params']) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        return next(
          new AppError('Dados inválidos', 422, result.error.flatten().fieldErrors),
        );
      }
      req[key] = result.data;
    }
    return next();
  };
}

module.exports = { validate };
