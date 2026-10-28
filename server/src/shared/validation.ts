import type { z } from 'zod';
import { fieldErrorsOf } from '../../../client/src/features/auth/rules.js';
import { invalid } from './errors.js';

export { fieldErrorsOf };

/**
 * Parse a JSON request body with a strict shared schema, or throw a 400 VALIDATION_ERROR with
 * flat fieldErrors. Only the schema's output is returned, so request fields are never spread into
 * a model.
 */
export function parseBody<S extends z.ZodType>(schema: S, body: unknown): z.output<S> {
  if (typeof body !== 'object' || body === null || Array.isArray(body))
    throw invalid({ request: 'Send a JSON object' });
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw invalid(fieldErrorsOf(parsed.error));
  return parsed.data;
}
