const db = require('../../config/db');

async function findAllByOwner(ownerId) {
  const { rows } = await db.query(
    `SELECT * FROM categories WHERE owner_id = $1 ORDER BY name`,
    [ownerId],
  );
  return rows;
}

async function findByIdAndOwner(id, ownerId) {
  const { rows } = await db.query(
    `SELECT * FROM categories WHERE id = $1 AND owner_id = $2`,
    [id, ownerId],
  );
  return rows[0] || null;
}

async function create({ name, color, ownerId }) {
  const { rows } = await db.query(
    `INSERT INTO categories (name, color, owner_id) VALUES ($1, $2, $3) RETURNING *`,
    [name, color, ownerId],
  );
  return rows[0];
}

async function update(id, ownerId, { name, color }) {
  const { rows } = await db.query(
    `UPDATE categories SET name = COALESCE($3, name), color = COALESCE($4, color)
     WHERE id = $1 AND owner_id = $2
     RETURNING *`,
    [id, ownerId, name, color],
  );
  return rows[0] || null;
}

async function remove(id, ownerId) {
  const { rowCount } = await db.query(
    `DELETE FROM categories WHERE id = $1 AND owner_id = $2`,
    [id, ownerId],
  );
  return rowCount > 0;
}

module.exports = { findAllByOwner, findByIdAndOwner, create, update, remove };
