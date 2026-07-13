const repository = require('./tasks.repository');
const usersRepository = require('../users/users.repository');
const AppError = require('../../utils/AppError');

async function list(userId, filters) {
  return repository.findAllForUser(userId, filters);
}

async function getOne(id, userId) {
  const task = await repository.findByIdForUser(id, userId);
  if (!task) throw new AppError('Tarefa não encontrada', 404);
  return task;
}

async function create(data, ownerId) {
  const id = await repository.create({ ...data, ownerId });
  return repository.findByIdForUser(id, ownerId);
}

async function update(id, userId, data) {
  // dono OU colaborador podem editar o conteúdo da tarefa
  await getOne(id, userId);
  const updated = await repository.update(id, data);
  if (!updated) throw new AppError('Tarefa não encontrada', 404);
  return repository.findByIdForUser(id, userId);
}

async function remove(id, ownerId) {
  const deleted = await repository.remove(id, ownerId);
  if (!deleted) throw new AppError('Tarefa não encontrada ou você não é o dono', 404);
}

async function addCollaborator(taskId, ownerId, email) {
  const owns = await repository.isOwner(taskId, ownerId);
  if (!owns) throw new AppError('Apenas o dono da tarefa pode adicionar colaboradores', 403);

  const user = await usersRepository.findByEmail(email);
  if (!user) throw new AppError('Nenhum usuário encontrado com este e-mail', 404);
  if (user.id === ownerId) throw new AppError('O dono já tem acesso à tarefa', 422);

  await repository.addCollaborator(taskId, user.id);
  return repository.findByIdForUser(taskId, ownerId);
}

async function removeCollaborator(taskId, ownerId, userId) {
  const owns = await repository.isOwner(taskId, ownerId);
  if (!owns) throw new AppError('Apenas o dono da tarefa pode remover colaboradores', 403);

  await repository.removeCollaborator(taskId, userId);
  return repository.findByIdForUser(taskId, ownerId);
}

module.exports = { list, getOne, create, update, remove, addCollaborator, removeCollaborator };
