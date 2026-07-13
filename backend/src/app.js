const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const categoriesRoutes = require('./modules/categories/categories.routes');
const tasksRoutes = require('./modules/tasks/tasks.routes');
const reportsRoutes = require('./modules/reports/reports.routes');

const openapiDocument = require('./docs/openapi.json');

const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/openapi.json', (req, res) => res.status(200).json(openapiDocument));

// Swagger UI interativo só é montado fora do Lambda: evita empacotar os
// assets estáticos do swagger-ui-express no pacote de deploy serverless.
// O JSON da spec (acima) continua disponível em qualquer ambiente.
if (!isLambda) {
  // eslint-disable-next-line global-require
  const swaggerUi = require('swagger-ui-express');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
}

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/reports', reportsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
