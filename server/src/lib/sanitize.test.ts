import { describe, expect, it } from 'vitest';
import { sanitize } from '../lib/sanitize';

describe('sanitize', () => {
  it('redacts sensitive top-level keys', () => {
    const result = sanitize({ email: 'a@b.c', password: 'hunter2' }) as Record<string, unknown>;
    expect(result.email).toBe('a@b.c');
    expect(result.password).toBe('[redacted]');
  });

  it('redacts nested and case-insensitive keys', () => {
    const result = sanitize({
      user: { PASSWORD: 'x', name: 'Dipesh' },
      list: [{ token: 'abc' }],
    }) as Record<string, any>;
    expect(result.user.PASSWORD).toBe('[redacted]');
    expect(result.user.name).toBe('Dipesh');
    expect(result.list[0].token).toBe('[redacted]');
  });

  it('leaves primitives untouched', () => {
    expect(sanitize(42)).toBe(42);
    expect(sanitize(null)).toBe(null);
    expect(sanitize('plain')).toBe('plain');
  });

  it('sanitizes arrays of scalars', () => {
    expect(sanitize(['a', 1])).toEqual(['a', 1]);
  });
});
