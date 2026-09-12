import type { SupportApi, HttpClient } from '../../../../contracts/index.js';
import { notImplemented } from '../../api/notImplemented.js';
export function createHttpSupport(_http: HttpClient): SupportApi {
  return {
    submit: async () => notImplemented('support.submit (http)'),
  };
}
