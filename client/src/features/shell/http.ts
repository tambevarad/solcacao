import type { Dictionary, ShellApi, HttpClient } from '../../../../contracts/index.js';

/** GET /api/i18n/:locale through the common transport, which unwraps { data } and throws ApiError. */
export function createHttpShell(http: HttpClient): ShellApi {
  return {
    dictionary: (locale) => http.request<Dictionary>(`/i18n/${encodeURIComponent(locale)}`),
  };
}
