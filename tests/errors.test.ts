import { describe, expect, it } from 'vitest';
import { AppError, badRequest, unauthorized, forbidden, notFound, conflict, tooManyRequests } from '../server/src/lib/errors';

describe('AppError', () => {
  it('has statusCode and code', () => {
    const err = new AppError('test', 400, 'bad_request');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('bad_request');
    expect(err.message).toBe('test');
    expect(err).toBeInstanceOf(Error);
  });

  it('defaults to 500 and internal_error', () => {
    const err = new AppError('oops');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('internal_error');
  });

  it('captures stack trace', () => {
    const err = new AppError('trace', 400, 'test');
    expect(err.stack).toBeTruthy();
    expect(err.stack).toContain('trace');
    expect(err.stack).toContain('errors.test.ts');
  });
});

describe('error factories', () => {
  it('badRequest creates 400 error', () => {
    const err = badRequest('invalid input');
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('bad_request');
  });

  it('badRequest supports details', () => {
    const err = badRequest('validation failed', { field: 'email' });
    expect(err.details).toEqual({ field: 'email' });
  });

  it('unauthorized creates 401 error', () => {
    const err = unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('unauthorized');
    expect(err.message).toBe('Authentication required');
  });

  it('unauthorized supports custom message', () => {
    const err = unauthorized('Invalid token');
    expect(err.message).toBe('Invalid token');
  });

  it('forbidden creates 403 error', () => {
    const err = forbidden();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('forbidden');
  });

  it('notFound creates 404 error', () => {
    const err = notFound();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('not_found');
  });

  it('conflict creates 409 error', () => {
    const err = conflict('already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('conflict');
  });

  it('tooManyRequests creates 429 error', () => {
    const err = tooManyRequests();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('rate_limited');
  });
});
