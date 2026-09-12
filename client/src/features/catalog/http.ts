import type { CatalogApi, HttpClient } from '../../../../contracts/index.js';
import { notImplemented } from '../../api/notImplemented.js';
export function createHttpCatalog(_http: HttpClient): CatalogApi {
  return {
    list: async () => notImplemented('catalog.list (http)'),
    get: async () => notImplemented('catalog.get (http)'),
    cart: async () => notImplemented('catalog.cart (http)'),
    persist: async () => notImplemented('catalog.persist (http)'),
    merge: async () => notImplemented('catalog.merge (http)'),
    checkout: async () => notImplemented('catalog.checkout (http)'),
  };
}
