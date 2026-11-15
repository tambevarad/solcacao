import type { ErrorRequestHandler, RequestHandler, Response } from 'express';

/** Every error code in docs/contracts.md. */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'EMAIL_EXISTS'
  | 'CART_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'OUT_OF_STOCK'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

/** A failure that maps to one `{ error }` envelope. Never carries stack traces or DB details. */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const invalid = (fieldErrors: Record<string, string>) =>
  new AppError(400, 'VALIDATION_ERROR', 'Invalid request', fieldErrors);
export const unauthorized = (message = 'Authentication required') =>
  new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'Access denied') => new AppError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Not found') => new AppError(404, 'NOT_FOUND', message);
export const serviceUnavailable = () =>
  new AppError(503, 'SERVICE_UNAVAILABLE', 'Service unavailable');

export function sendError(res: Response, error: AppError) {
  res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
    },
  });
}

/** Lost or unreachable MongoDB: reported as 503, never as a crash or a fake success. */
export function isDatabaseOutage(error: unknown): boolean {
  return (
    error instanceof Error &&
    /^Mongo(Network|ServerSelection|NotConnected)Error$|^MongooseServerSelectionError$/.test(
      error.name,
    )
  );
}

/** body-parser failures carry `type` and `status`; map them to the standard envelope. */
function bodyParserError(error: unknown): AppError | null {
  if (typeof error !== 'object' || error === null || !('type' in error)) return null;
  switch (error.type) {
    case 'entity.parse.failed':
      return invalid({ request: 'Malformed JSON' });
    case 'entity.too.large':
      return new AppError(413, 'VALIDATION_ERROR', 'Request body too large');
    case 'encoding.unsupported':
    case 'charset.unsupported':
      return new AppError(415, 'VALIDATION_ERROR', 'Unsupported request encoding');
    default:
      return 'status' in error && typeof error.status === 'number' && error.status < 500
        ? invalid({ request: 'Malformed request' })
        : null;
  }
}

/**
 * A log line for an unexpected error. MongoDB messages can quote stored values (a duplicate-key
 * error names the email), so database errors are logged by name and code only.
 */
export function describeForLog(error: unknown): string {
  if (!(error instanceof Error)) return 'non-Error value thrown';
  if (/^Mongo|^Mongoose/.test(error.name)) {
    const code = 'code' in error && error.code !== undefined ? ` (code ${String(error.code)})` : '';
    return `${error.name}${code}`;
  }
  return `${error.name}: ${error.message}`;
}

/** Last router in app.ts: unknown /api paths. */
export const notFoundHandler: RequestHandler = (_req, res) =>
  sendError(res, notFound('Route not found'));

/**
 * Last error handler in app.ts. Logs only the error name/message for unexpected failures; never
 * the request body, headers or tokens.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof AppError) return sendError(res, error);
  const parser = bodyParserError(error);
  if (parser) return sendError(res, parser);
  if (isDatabaseOutage(error)) return sendError(res, serviceUnavailable());
  console.error('[server] Unexpected error:', describeForLog(error));
  sendError(res, new AppError(500, 'INTERNAL_ERROR', 'Unexpected server error'));
};
