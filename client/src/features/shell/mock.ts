import type { ShellApi, HttpClient } from '../../../../contracts/index.js';
import { ApiError } from '../../api/http.js';
import { dictionaries } from './dictionaries.js';
import { isLocale } from './locale.js';

/** Phase 2 mock: serves the same assembled dictionaries as GET /api/i18n/:locale, with the same errors. */
export function createMockShell(_http: HttpClient): ShellApi {
  return {
    dictionary: async (locale) => {
      if (!isLocale(locale))
        throw new ApiError(400, 'VALIDATION_ERROR', 'Unsupported locale', {
          locale: 'Use en or es',
        });
      return { ...dictionaries[locale] };
    },
  };
}
