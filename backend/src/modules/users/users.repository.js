const db = require('../../config/db');

async function create({ name, email, passwordHash }) {
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash],
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await db.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [id],
  );
  return rows[0] || null;
}

async function searchByEmail(emailFragment) {
  const { rows } = await db.query(
    `SELECT id, name, email FROM users WHERE email ILIKE $1 ORDER BY email LIMIT 10`,
    [`%${emailFragment}%`],
  );
  return rows;
}

module.exports = { create, findByEmail, findById, searchByEmail };
