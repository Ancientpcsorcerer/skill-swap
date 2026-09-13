import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  hashPassword,
  comparePassword,
} from '../utils/tokens';

describe('Token and Security Utilities', () => {
  test('generates and verifies valid JWT access tokens', () => {
    const payload = {
      userId: 'test-user-123',
      email: 'test@example.com',
      role: 'user',
    };

    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  test('generates 80-char hex refresh tokens and valid SHA256 hashes', () => {
    const rawToken = generateRefreshToken();
    expect(typeof rawToken).toBe('string');
    expect(rawToken.length).toBe(80); // 40 bytes hex

    const hash1 = hashToken(rawToken);
    const hash2 = hashToken(rawToken);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex
  });

  test('hashes passwords and correctly compares them', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2')).toBe(true);

    const isMatch = await comparePassword(password, hash);
    expect(isMatch).toBe(true);

    const isWrong = await comparePassword('WrongPassword123!', hash);
    expect(isWrong).toBe(false);
  });
});
