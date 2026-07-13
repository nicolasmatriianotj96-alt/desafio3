jest.mock('../../src/modules/users/users.repository');
jest.mock('../../src/modules/categories/categories.repository');

const usersRepository = require('../../src/modules/users/users.repository');
const categoriesRepository = require('../../src/modules/categories/categories.repository');
const authService = require('../../src/modules/auth/auth.service');
const { hashPassword } = require('../../src/utils/password');

describe('auth.service', () => {
  describe('register', () => {
    it('creates a user and returns a token when the email is not taken', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue({
        id: 'user-1',
        name: 'Ana',
        email: 'ana@example.com',
        created_at: new Date().toISOString(),
      });

      const result = await authService.register({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'password123',
      });

      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Ana', email: 'ana@example.com' }),
      );
      expect(result.user.email).toBe('ana@example.com');
      expect(typeof result.token).toBe('string');
      // Categorias padrão de produção de conteúdo devem ser semeadas para a conta nova
      expect(categoriesRepository.create).toHaveBeenCalledTimes(5);
      expect(categoriesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Roteiro', ownerId: 'user-1' }),
      );
    });

    it('still returns a token even if seeding default categories fails', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue({
        id: 'user-1',
        name: 'Ana',
        email: 'ana@example.com',
        created_at: new Date().toISOString(),
      });
      categoriesRepository.create.mockRejectedValue(new Error('db down'));

      const result = await authService.register({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'password123',
      });

      expect(typeof result.token).toBe('string');
    });

    it('throws when the email is already registered', async () => {
      usersRepository.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({ name: 'Ana', email: 'ana@example.com', password: '123456' }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      const passwordHash = await hashPassword('password123');
      usersRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        name: 'Ana',
        email: 'ana@example.com',
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
      });

      const result = await authService.login({ email: 'ana@example.com', password: 'password123' });
      expect(result.user.email).toBe('ana@example.com');
      expect(typeof result.token).toBe('string');
    });

    it('rejects an unknown email', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'ghost@example.com', password: '123456' }),
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('rejects an incorrect password', async () => {
      const passwordHash = await hashPassword('password123');
      usersRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'ana@example.com',
        password_hash: passwordHash,
      });

      await expect(
        authService.login({ email: 'ana@example.com', password: 'wrong' }),
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });
});
