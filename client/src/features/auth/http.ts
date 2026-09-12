import type { AuthApi, HttpClient } from '../../../../contracts/index.js';
import { notImplemented } from '../../api/notImplemented.js';
export function createHttpAuth(_http: HttpClient): AuthApi {
  return {
    register: async () => notImplemented('auth.register (http)'),
    login: async () => notImplemented('auth.login (http)'),
    me: async () => notImplemented('auth.me (http)'),
    updateProfile: async () => notImplemented('auth.updateProfile (http)'),
    addresses: async () => notImplemented('auth.addresses (http)'),
    saveAddress: async () => notImplemented('auth.saveAddress (http)'),
  };
}
