import type { ShellApi, HttpClient } from '../../../../contracts/index.js';
import { notImplemented } from '../../api/notImplemented.js';
export function createHttpShell(_http: HttpClient): ShellApi {
  return {
    dictionary: async () => notImplemented('shell.dictionary (http)'),
  };
}
