jest.mock('../../src/modules/tasks/tasks.repository');
jest.mock('../../src/modules/users/users.repository');

const tasksRepository = require('../../src/modules/tasks/tasks.repository');
const usersRepository = require('../../src/modules/users/users.repository');
const tasksService = require('../../src/modules/tasks/tasks.service');

describe('tasks.service', () => {
  describe('getOne', () => {
    it('throws 404 when the task is not visible to the user', async () => {
      tasksRepository.findByIdForUser.mockResolvedValue(null);

      await expect(tasksService.getOne('task-1', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('returns the task when visible', async () => {
      tasksRepository.findByIdForUser.mockResolvedValue({ id: 'task-1', title: 'Test' });

      const task = await tasksService.getOne('task-1', 'user-1');
      expect(task.id).toBe('task-1');
    });
  });

  describe('addCollaborator', () => {
    it('rejects when the requester is not the owner', async () => {
      tasksRepository.isOwner.mockResolvedValue(false);

      await expect(
        tasksService.addCollaborator('task-1', 'user-1', 'friend@example.com'),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('rejects when the target user does not exist', async () => {
      tasksRepository.isOwner.mockResolvedValue(true);
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(
        tasksService.addCollaborator('task-1', 'user-1', 'ghost@example.com'),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('adds the collaborator when the requester is the owner and the user exists', async () => {
      tasksRepository.isOwner.mockResolvedValue(true);
      usersRepository.findByEmail.mockResolvedValue({ id: 'user-2', email: 'friend@example.com' });
      tasksRepository.addCollaborator.mockResolvedValue();
      tasksRepository.findByIdForUser.mockResolvedValue({ id: 'task-1', collaborators: [{ id: 'user-2' }] });

      const task = await tasksService.addCollaborator('task-1', 'user-1', 'friend@example.com');

      expect(tasksRepository.addCollaborator).toHaveBeenCalledWith('task-1', 'user-2');
      expect(task.collaborators).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('throws 404 when the user is not the owner', async () => {
      tasksRepository.remove.mockResolvedValue(false);

      await expect(tasksService.remove('task-1', 'user-1')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
