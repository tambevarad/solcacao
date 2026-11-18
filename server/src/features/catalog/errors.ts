import type { Response } from 'express';

/** Codes from docs/contracts.md that the catalog, cart and order routes can return. */
export type CatalogErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CART_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'OUT_OF_STOCK'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

/** A failure that maps to one error envelope. Never carries stack traces or database details. */
export class CatalogError extends Error {
  constructor(
    public status: number,
    public code: CatalogErrorCode,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'CatalogError';
  }
}

export const invalid = (fieldErrors: Record<string, string>) =>
  new CatalogError(400, 'VALIDATION_ERROR', 'Invalid request', fieldErrors);

export function sendError(res: Response, error: CatalogError) {
  res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
    },
  });
}
