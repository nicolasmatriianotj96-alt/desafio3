const repository = require('./reports.repository');

function toNumber(value) {
  return Number(value) || 0;
}

async function summary(userId) {
  const row = await repository.summary(userId);
  const total = toNumber(row.total);
  const done = toNumber(row.done);

  return {
    total,
    byStatus: {
      pending: toNumber(row.pending),
      in_progress: toNumber(row.in_progress),
      done,
    },
    byPriority: {
      low: toNumber(row.low_priority),
      medium: toNumber(row.medium_priority),
      high: toNumber(row.high_priority),
    },
    overdue: toNumber(row.overdue),
    completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

async function byCategory(userId) {
  const rows = await repository.byCategory(userId);
  return rows.map((row) => ({
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryColor: row.category_color,
    total: toNumber(row.total),
    done: toNumber(row.done),
  }));
}

module.exports = { summary, byCategory };
