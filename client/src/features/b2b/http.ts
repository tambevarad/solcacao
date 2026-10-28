import type { B2bApi, HttpClient, QuoteReceipt } from '../../../../contracts/index.js';

/**
 * POST /api/b2b/quote through the common transport, which adds the bearer token, unwraps
 * { data } and throws ApiError. Metadata is one JSON string field; the PDF is `designFile`.
 */
export function createHttpB2B(http: HttpClient): B2bApi {
  return {
    submit(input, file) {
      const form = new FormData();
      form.append('metadata', JSON.stringify(input));
      form.append('designFile', file, file.name);
      // No Content-Type header here: the browser sets multipart/form-data with its boundary.
      return http.request<QuoteReceipt>('/b2b/quote', { method: 'POST', multipart: form });
    },
  };
}
