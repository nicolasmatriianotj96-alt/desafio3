const { Pool } = require('pg');
const env = require('./env');

// Em Lambda cada container executa uma invocação por vez, então um pool grande
// não ajuda e só desperdiça conexões no Postgres. Fora da Lambda (servidor local),
// usamos um pool maior para lidar com requisições concorrentes.
const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: isLambda ? 1 : 10,
  idleTimeoutMillis: isLambda ? 0 : 30000,
  ssl: env.databaseUrl.includes('sslmode=require') || env.nodeEnv === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error on idle Postgres client', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient };
