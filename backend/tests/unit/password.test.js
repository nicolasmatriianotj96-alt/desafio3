const { hashPassword, comparePassword } = require('../../src/utils/password');

describe('password utils', () => {
  it('generates a hash different from the plain password', async () => {
    const hash = await hashPassword('super-secret');
    expect(hash).not.toBe('super-secret');
  });

  it('validates the correct password against its hash', async () => {
    const hash = await hashPassword('super-secret');
    await expect(comparePassword('super-secret', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('super-secret');
    await expect(comparePassword('wrong-password', hash)).resolves.toBe(false);
  });
});
