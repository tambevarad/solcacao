import type { ErrorBody, HttpClient } from '../../../contracts/index.js';
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}
export function createHttpClient(getToken: () => string | null): HttpClient {
  return {
    async request<T>(
      path: string,
      options: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown; multipart?: FormData } = {},
    ): Promise<T> {
      const headers = new Headers({ Accept: 'application/json' });
      const token = getToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (options.body !== undefined) headers.set('Content-Type', 'application/json');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}${path}`, {
        method: options.method || 'GET',
        headers,
        body:
          options.multipart ||
          (options.body === undefined ? undefined : JSON.stringify(options.body)),
      });
      const payload = await response.json();
      if (!response.ok) {
        const e = (payload as ErrorBody).error;
        throw new ApiError(
          response.status,
          e?.code || 'HTTP_ERROR',
          e?.message || 'Request failed',
          e?.fieldErrors,
        );
      }
      return payload.data as T;
    },
  };
}
