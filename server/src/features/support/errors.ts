import type { Response } from 'express';

export class SupportError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export function sendSupportError(res: Response, error: unknown) {
  if (error instanceof SupportError)
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
      },
    });
  const unavailable =
    error instanceof Error &&
    /Mongo.*(Network|Selection|NotConnected)|MongooseServerSelection/.test(error.name);
  return res.status(unavailable ? 503 : 500).json({
    error: {
      code: unavailable ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR',
      message: unavailable ? 'Database unavailable' : 'Unexpected server error',
    },
  });
}
