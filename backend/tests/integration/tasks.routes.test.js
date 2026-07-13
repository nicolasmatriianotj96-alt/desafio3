jest.mock('../../src/modules/tasks/tasks.repository');
jest.mock('../../src/modules/users/users.repository');

const request = require('supertest');
const tasksRepository = require('../../src/modules/tasks/tasks.repository');
const app = require('../../src/app');
const { signToken } = require('../../src/utils/jwt');

const token = signToken({ sub: 'user-1', email: 'ana@example.com', name: 'Ana' });
const authHeader = { Authorization: `Bearer ${token}` };

describe('GET /api/tasks', () => {
  it('rejects requests without a valid token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('lists tasks visible to the authenticated user', async () => {
    tasksRepository.findAllForUser.mockResolvedValue([
      { id: 'task-1', title: 'Comprar leite', status: 'pending' },
    ]);

    const res = await request(app).get('/api/tasks').set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(tasksRepository.findAllForUser).toHaveBeenCalledWith('user-1', expect.any(Object));
  });

  it('rejects an invalid status filter', async () => {
    const res = await request(app).get('/api/tasks?status=invalid').set(authHeader);
    expect(res.status).toBe(422);
  });
});

describe('POST /api/tasks', () => {
  it('validates the request body', async () => {
    const res = await request(app).post('/api/tasks').set(authHeader).send({});
    expect(res.status).toBe(422);
  });

  it('creates a task for the authenticated user', async () => {
    tasksRepository.create.mockResolvedValue('task-1');
    tasksRepository.findByIdForUser.mockResolvedValue({ id: 'task-1', title: 'Nova tarefa' });

    const res = await request(app).post('/api/tasks').set(authHeader).send({ title: 'Nova tarefa' });

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('Nova tarefa');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('returns 404 when the requester does not own the task', async () => {
    tasksRepository.remove.mockResolvedValue(false);

    const res = await request(app)
      .delete('/api/tasks/11111111-1111-1111-1111-111111111111')
      .set(authHeader);

    expect(res.status).toBe(404);
  });
});
