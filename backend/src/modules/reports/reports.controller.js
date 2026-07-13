const service = require('./reports.service');

async function summary(req, res, next) {
  try {
    const data = await service.summary(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

async function byCategory(req, res, next) {
  try {
    const data = await service.byCategory(req.user.id);
    res.status(200).json({ categories: data });
  } catch (err) {
    next(err);
  }
}

module.exports = { summary, byCategory };
