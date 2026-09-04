import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../lib/password';

describe('password hashing', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('S3cure-Pass!');
    expect(hash).not.toBe('S3cure-Pass!');
    await expect(verifyPassword('S3cure-Pass!', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct');
    await expect(verifyPassword('incorrect', hash)).resolves.toBe(false);
  });

  it('produces unique hashes for identical inputs', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
    expect(a).not.toBe(b);
  });
});
