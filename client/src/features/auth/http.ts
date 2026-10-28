import type { AuthApi, HttpClient } from '../../../../contracts/index.js';

/**
 * HTTP adapter for the auth endpoints in docs/api.json. The shared HttpClient adds the bearer
 * token, unwraps `{ data }` and throws ApiError for the `{ error }` envelope; this file only names
 * paths and methods, so components never see transport details.
 */
export function createHttpAuth(http: HttpClient): AuthApi {
  return {
    register: (input) => http.request('/auth/register', { method: 'POST', body: input }),
    login: (input) => http.request('/auth/login', { method: 'POST', body: input }),
    me: () => http.request('/auth/me'),
    updateProfile: (input) => http.request('/users/me', { method: 'PATCH', body: input }),
    addresses: () => http.request('/users/me/addresses'),
    saveAddress: (input) => http.request('/users/me/addresses', { method: 'POST', body: input }),
  };
}
