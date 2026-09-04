const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'authorization',
  'secret',
]);

/** Removes sensitive fields from an object before logging / persisting audit entries. */
export const sanitize = (input: unknown): unknown => {
  if (Array.isArray(input)) return input.map(sanitize);
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase()) || SENSITIVE_KEYS.has(key)) {
        out[key] = '[redacted]';
      } else {
        out[key] = sanitize(value);
      }
    }
    return out;
  }
  return input;
};
