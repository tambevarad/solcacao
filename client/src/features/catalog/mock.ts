import type { CatalogApi, HttpClient } from '../../../../contracts/index.js';
import { notImplemented } from '../../api/notImplemented.js';
export function createMockCatalog(_http: HttpClient): CatalogApi {
  return {
    list: async () => notImplemented('catalog.list (mock)'),
    get: async () => notImplemented('catalog.get (mock)'),
    cart: async () => notImplemented('catalog.cart (mock)'),
    persist: async () => notImplemented('catalog.persist (mock)'),
    merge: async () => notImplemented('catalog.merge (mock)'),
    checkout: async () => notImplemented('catalog.checkout (mock)'),
  };
}
