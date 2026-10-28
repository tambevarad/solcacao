import type { SupportApi, HttpClient } from '../../../../contracts/index.js';
export function createHttpSupport(http: HttpClient): SupportApi {
  return {
    submit: (input) => http.request('/inquiries', { method: 'POST', body: input }),
  };
}
