const db = require('../../config/db');

const BASE_SELECT = `
  SELECT
    t.*,
    c.name AS category_name,
    c.color AS category_color,
    (t.owner_id = $1) AS is_owner,
    COALESCE(
      json_agg(
        json_build_object('id', u.id, 'name', u.name, 'email', u.email)
      ) FILTER (WHERE u.id IS NOT NULL),
      '[]'
    ) AS collaborators
  FROM tasks t
  LEFT JOIN categories c ON c.id = t.category_id
  LEFT JOIN task_collaborators tc ON tc.task_id = t.id
  LEFT JOIN users u ON u.id = tc.user_id
`;

const VISIBILITY_CLAUSE = `
  (t.owner_id = $1 OR EXISTS (
    SELECT 1 FROM task_collaborators tc2 WHERE tc2.task_id = t.id AND tc2.user_id = $1
  ))
`;

async function findAllForUser(userId, { status, categoryId, search } = {}) {
  const { rows } = await db.query(
    `${BASE_SELECT}
     WHERE ${VISIBILITY_CLAUSE}
       AND ($2::task_status IS NULL OR t.status = $2)
       AND ($3::uuid IS NULL OR t.category_id = $3)
       AND ($4::text IS NULL OR t.title ILIKE '%' || $4 || '%')
     GROUP BY t.id, c.name, c.color
     ORDER BY t.due_date NULLS LAST, t.created_at DESC`,
    [userId, status || null, categoryId || null, search || null],
  );
  return rows;
}

async function findByIdForUser(id, userId) {
  const { rows } = await db.query(
    `${BASE_SELECT}
     WHERE t.id = $2 AND ${VISIBILITY_CLAUSE}
     GROUP BY t.id, c.name, c.color`,
    [userId, id],
  );
  return rows[0] || null;
}

async function isOwner(id, userId) {
  const { rows } = await db.query('SELECT 1 FROM tasks WHERE id = $1 AND owner_id = $2', [id, userId]);
  return rows.length > 0;
}

async function create({ title, description, status, priority, dueDate, categoryId, ownerId }) {
  const { rows } = await db.query(
    `INSERT INTO tasks (title, description, status, priority, due_date, category_id, owner_id)
     VALUES ($1, $2, COALESCE($3::task_status, 'pending'), COALESCE($4::task_priority, 'medium'), $5, $6, $7)
     RETURNING id`,
    [title, description || null, status, priority, dueDate || null, categoryId || null, ownerId],
  );
  return rows[0].id;
}

async function update(id, { title, description, status, priority, dueDate, categoryId }) {
  const { rows } = await db.query(
    `UPDATE tasks SET
       title = COALESCE($2, title),
       description = COALESCE($3, description),
       status = COALESCE($4::task_status, status),
       priority = COALESCE($5::task_priority, priority),
       due_date = COALESCE($6::date, due_date),
       category_id = COALESCE($7::uuid, category_id),
       updated_at = now()
     WHERE id = $1
     RETURNING id`,
    [id, title, description, status, priority, dueDate, categoryId],
  );
  return rows[0] || null;
}

async function remove(id, ownerId) {
  const { rowCount } = await db.query('DELETE FROM tasks WHERE id = $1 AND owner_id = $2', [id, ownerId]);
  return rowCount > 0;
}

async function addCollaborator(taskId, userId) {
  await db.query(
    `INSERT INTO task_collaborators (task_id, user_id) VALUES ($1, $2)
     ON CONFLICT (task_id, user_id) DO NOTHING`,
    [taskId, userId],
  );
}

async function removeCollaborator(taskId, userId) {
  const { rowCount } = await db.query(
    'DELETE FROM task_collaborators WHERE task_id = $1 AND user_id = $2',
    [taskId, userId],
  );
  return rowCount > 0;
}

module.exports = {
  findAllForUser,
  findByIdForUser,
  isOwner,
  create,
  update,
  remove,
  addCollaborator,
  removeCollaborator,
};
