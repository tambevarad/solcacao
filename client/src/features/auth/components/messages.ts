import { ApiError } from '../../../api/http.js';
import type { FieldErrors } from '../rules.js';

/** Field -> translation key. Keys (not translated text) are stored so a language switch re-renders. */
export type ErrorKeys = Record<string, string>;

const byteLength = (value: string) => new TextEncoder().encode(value).length;

/**
 * Turns validation messages (from the shared schema locally, or a server VALIDATION_ERROR) into
 * translated keys. The decision uses the entered value, so client and server wording can differ
 * without changing what the shopper sees.
 */
export function validationKeys(
  fieldErrors: FieldErrors,
  values: Record<string, string>,
): ErrorKeys {
  const keys: ErrorKeys = {};
  for (const [field, message] of Object.entries(fieldErrors)) {
    const value = values[field];
    if (field === 'addresses') {
      keys.form = 'auth.error.addressLimit';
      continue;
    }
    if (value === undefined) {
      keys.form = 'auth.error.generic';
      continue;
    }
    const empty = field === 'password' ? value === '' : value.trim() === '';
    if (field === 'companyName' && empty) keys[field] = 'auth.error.companyRequired';
    else if (empty) keys[field] = 'auth.error.required';
    else if (field === 'email')
      keys[field] =
        message === 'Already registered' ? 'auth.error.emailExists' : 'auth.error.email';
    else if (field === 'password')
      keys[field] =
        byteLength(value) > 72
          ? 'auth.error.passwordLong'
          : value.length < 12
            ? 'auth.error.passwordShort'
            : 'auth.error.generic';
    else if (field === 'postalCode') keys[field] = 'auth.error.postalCode';
    else if (field === 'country') keys[field] = 'auth.error.country';
    else keys[field] = 'auth.error.tooLong';
  }
  return keys;
}

/** Envelope code -> form-level key for failures that are not about one field. */
export function failureKeys(
  error: unknown,
  values: Record<string, string>,
  { unauthorized = 'auth.error.sessionExpired' }: { unauthorized?: string } = {},
): ErrorKeys {
  if (!(error instanceof ApiError)) return { form: 'auth.error.unavailable' };
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return error.fieldErrors
        ? validationKeys(error.fieldErrors, values)
        : { form: 'auth.error.generic' };
    case 'EMAIL_EXISTS':
      return { email: 'auth.error.emailExists' };
    case 'UNAUTHORIZED':
      return { form: unauthorized };
    case 'NOT_FOUND':
      return { form: 'auth.error.notFound' };
    case 'RATE_LIMITED':
      return { form: 'auth.error.rateLimited' };
    case 'SERVICE_UNAVAILABLE':
      return { form: 'auth.error.unavailable' };
    default:
      return { form: 'auth.error.generic' };
  }
}
