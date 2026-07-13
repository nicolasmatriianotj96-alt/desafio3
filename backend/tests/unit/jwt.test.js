const { signToken, verifyToken } = require('../../src/utils/jwt');

describe('jwt utils', () => {
  it('signs and verifies a token round-trip', () => {
    const token = signToken({ sub: 'user-1', email: 'a@b.com' });
    const payload = verifyToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('a@b.com');
  });

  it('throws when verifying a tampered token', () => {
    const token = signToken({ sub: 'user-1' });
    expect(() => verifyToken(`${token}tampered`)).toThrow();
  });
});
