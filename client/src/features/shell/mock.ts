import type { ShellApi, HttpClient } from '../../../../contracts/index.js';
import { notImplemented } from '../../api/notImplemented.js';
export function createMockShell(_http: HttpClient): ShellApi {
  return {
    dictionary: async () => notImplemented('shell.dictionary (mock)'),
  };
}
