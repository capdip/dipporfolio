export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'internal_error', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(message, 400, 'bad_request', details);

export const unauthorized = (message = 'Authentication required') =>
  new AppError(message, 401, 'unauthorized');

export const forbidden = (message = 'Insufficient permissions') =>
  new AppError(message, 403, 'forbidden');

export const notFound = (message = 'Resource not found') =>
  new AppError(message, 404, 'not_found');

export const conflict = (message: string) => new AppError(message, 409, 'conflict');

export const tooManyRequests = (message = 'Too many requests, please slow down') =>
  new AppError(message, 429, 'rate_limited');
