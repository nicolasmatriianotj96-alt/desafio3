const { startTracing } = require('./telemetry/tracing');

startTracing();

const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API rodando em http://localhost:${env.port}`);
  // eslint-disable-next-line no-console
  console.log(`Documentação Swagger em http://localhost:${env.port}/docs`);
});
