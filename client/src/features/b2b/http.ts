import type { B2bApi, HttpClient } from '../../../../contracts/index.js';
import { notImplemented } from '../../api/notImplemented.js';
export function createHttpB2B(_http: HttpClient): B2bApi {
  return {
    submit: async () => notImplemented('b2b.submit (http)'),
  };
}
