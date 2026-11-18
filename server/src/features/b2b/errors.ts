import type { Response } from 'express';

/** Codes from docs/contracts.md that the B2B routes can return. */
export type B2bErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'IDEMPOTENCY_CONFLICT'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

/** A failure that maps to one error envelope. Never carries stack traces or storage paths. */
export class B2bError extends Error {
  constructor(
    public status: number,
    public code: B2bErrorCode,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'B2bError';
  }
}

export function sendError(res: Response, error: B2bError) {
  res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
    },
  });
}
