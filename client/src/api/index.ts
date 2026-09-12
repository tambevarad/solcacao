import { createMockAuth } from '../features/auth/mock.js';
import { createHttpAuth } from '../features/auth/http.js';
import { createMockShell } from '../features/shell/mock.js';
import { createHttpShell } from '../features/shell/http.js';
import { createMockCatalog } from '../features/catalog/mock.js';
import { createHttpCatalog } from '../features/catalog/http.js';
import { createMockB2B } from '../features/b2b/mock.js';
import { createHttpB2B } from '../features/b2b/http.js';
import { createMockSupport } from '../features/support/mock.js';
import { createHttpSupport } from '../features/support/http.js';
import type { Api } from '../../../contracts/index.js';
import { createHttpClient } from './http.js';
import { sessionToken } from './session.js';
export { sessionToken } from './session.js';
const http = createHttpClient(sessionToken.get);
const mode = import.meta.env.VITE_API_MODE || 'mock';
if (!['mock', 'http'].includes(mode)) throw new Error('VITE_API_MODE must be mock or http');
export const api: Api = {
  auth: mode === 'http' ? createHttpAuth(http) : createMockAuth(http),
  shell: mode === 'http' ? createHttpShell(http) : createMockShell(http),
  catalog: mode === 'http' ? createHttpCatalog(http) : createMockCatalog(http),
  b2b: mode === 'http' ? createHttpB2B(http) : createMockB2B(http),
  support: mode === 'http' ? createHttpSupport(http) : createMockSupport(http),
};
