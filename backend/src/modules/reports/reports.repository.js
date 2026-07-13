const db = require('../../config/db');

const VISIBILITY_CLAUSE = `
  (t.owner_id = $1 OR EXISTS (
    SELECT 1 FROM task_collaborators tc WHERE tc.task_id = t.id AND tc.user_id = $1
  ))
`;

async function summary(userId) {
  const { rows } = await db.query(
    `SELECT
       count(*) FILTER (WHERE true) AS total,
       count(*) FILTER (WHERE status = 'pending') AS pending,
       count(*) FILTER (WHERE status = 'in_progress') AS in_progress,
       count(*) FILTER (WHERE status = 'done') AS done,
       count(*) FILTER (WHERE priority = 'low') AS low_priority,
       count(*) FILTER (WHERE priority = 'medium') AS medium_priority,
       count(*) FILTER (WHERE priority = 'high') AS high_priority,
       count(*) FILTER (WHERE due_date < current_date AND status <> 'done') AS overdue
     FROM tasks t
     WHERE ${VISIBILITY_CLAUSE}`,
    [userId],
  );
  return rows[0];
}

async function byCategory(userId) {
  const { rows } = await db.query(
    `SELECT
       c.id AS category_id,
       c.name AS category_name,
       c.color AS category_color,
       count(t.*) AS total,
       count(*) FILTER (WHERE t.status = 'done') AS done
     FROM tasks t
     JOIN categories c ON c.id = t.category_id
     WHERE ${VISIBILITY_CLAUSE}
     GROUP BY c.id, c.name, c.color
     ORDER BY total DESC`,
    [userId],
  );
  return rows;
}

module.exports = { summary, byCategory };
