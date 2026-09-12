import type { AuthApi, HttpClient } from '../../../../contracts/index.js';
import { notImplemented } from '../../api/notImplemented.js';
export function createMockAuth(_http: HttpClient): AuthApi {
  return {
    register: async () => notImplemented('auth.register (mock)'),
    login: async () => notImplemented('auth.login (mock)'),
    me: async () => notImplemented('auth.me (mock)'),
    updateProfile: async () => notImplemented('auth.updateProfile (mock)'),
    addresses: async () => notImplemented('auth.addresses (mock)'),
    saveAddress: async () => notImplemented('auth.saveAddress (mock)'),
  };
}
