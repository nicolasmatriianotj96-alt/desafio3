const service = require('./categories.service');

async function list(req, res, next) {
  try {
    const categories = await service.list(req.user.id);
    res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const category = await service.getOne(req.params.id, req.user.id);
    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const category = await service.create(req.body, req.user.id);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const category = await service.update(req.params.id, req.user.id, req.body);
    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
