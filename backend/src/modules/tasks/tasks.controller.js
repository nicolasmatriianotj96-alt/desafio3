const service = require('./tasks.service');

async function list(req, res, next) {
  try {
    const tasks = await service.list(req.user.id, req.query);
    res.status(200).json({ tasks });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const task = await service.getOne(req.params.id, req.user.id);
    res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const task = await service.create(req.body, req.user.id);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const task = await service.update(req.params.id, req.user.id, req.body);
    res.status(200).json({ task });
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

async function addCollaborator(req, res, next) {
  try {
    const task = await service.addCollaborator(req.params.id, req.user.id, req.body.email);
    res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
}

async function removeCollaborator(req, res, next) {
  try {
    const task = await service.removeCollaborator(req.params.id, req.user.id, req.params.userId);
    res.status(200).json({ task });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, addCollaborator, removeCollaborator };
