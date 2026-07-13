jest.mock('../../src/modules/users/users.repository');

const request = require('supertest');
const usersRepository = require('../../src/modules/users/users.repository');
const app = require('../../src/app');

describe('POST /api/auth/register', () => {
  it('returns 422 when the payload is invalid', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
  });

  it('creates a user and returns a token', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.create.mockResolvedValue({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      created_at: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ana', email: 'ana@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('ana@example.com');
  });

  it('returns 409 when the e-mail is already registered', async () => {
    usersRepository.findByEmail.mockResolvedValue({ id: 'existing' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ana', email: 'ana@example.com', password: 'password123' });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
