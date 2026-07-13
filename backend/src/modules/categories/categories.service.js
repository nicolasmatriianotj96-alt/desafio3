const repository = require('./categories.repository');
const AppError = require('../../utils/AppError');

async function list(ownerId) {
  return repository.findAllByOwner(ownerId);
}

async function getOne(id, ownerId) {
  const category = await repository.findByIdAndOwner(id, ownerId);
  if (!category) throw new AppError('Categoria não encontrada', 404);
  return category;
}

async function create(data, ownerId) {
  return repository.create({ ...data, ownerId });
}

async function update(id, ownerId, data) {
  const updated = await repository.update(id, ownerId, data);
  if (!updated) throw new AppError('Categoria não encontrada', 404);
  return updated;
}

async function remove(id, ownerId) {
  const deleted = await repository.remove(id, ownerId);
  if (!deleted) throw new AppError('Categoria não encontrada', 404);
}

module.exports = { list, getOne, create, update, remove };
