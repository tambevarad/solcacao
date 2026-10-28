import type {
  Cart,
  CatalogApi,
  HttpClient,
  OrderReceipt,
  Product,
  ProductQuery,
} from '../../../../contracts/index.js';
import { DEFAULT_LIMIT, QUERY_KEYS, totalPagesOf } from './rules.js';

/** URL query for GET /api/products: only defined, non-empty values; a fixed key order. */
export function productQueryString(query: ProductQuery): string {
  const params = new URLSearchParams();
  for (const key of QUERY_KEYS) {
    const value = query[key];
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) params.set(key, text);
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}

function headerInt(headers: Headers, name: string): number | undefined {
  const value = headers.get(name);
  return value !== null && /^\d+$/.test(value) ? Number(value) : undefined;
}

/**
 * Real API adapter (docs/api.json). The common transport adds the bearer token, unwraps { data }
 * and throws ApiError. Two wire exceptions: the product list is a raw Product[] with pagination
 * headers, and persist sends a raw CartLine[] with the revision in If-Match.
 */
export function createHttpCatalog(http: HttpClient): CatalogApi {
  return {
    async list(query) {
      const { body, headers } = await http.requestRaw<Product[]>(
        `/products${productQueryString(query)}`,
      );
      const items = Array.isArray(body) ? body : [];
      const limit = headerInt(headers, 'X-Limit') ?? query.limit ?? DEFAULT_LIMIT;
      const total = headerInt(headers, 'X-Total-Count') ?? items.length;
      return {
        items,
        page: headerInt(headers, 'X-Page') ?? query.page ?? 1,
        limit,
        total,
        totalPages: headerInt(headers, 'X-Total-Pages') ?? totalPagesOf(total, limit),
      };
    },
    get: (slug) => http.request<Product>(`/products/${encodeURIComponent(slug)}`),
    cart: () => http.request<Cart>('/cart'),
    persist: ({ items, expectedRevision }) =>
      http.request<Cart>('/cart/persist', {
        method: 'POST',
        body: items,
        headers: { 'If-Match': `"${expectedRevision}"` },
      }),
    merge: ({ items, mergeId }) =>
      http.request<Cart>('/cart/merge', { method: 'POST', body: { items, mergeId } }),
    checkout: (input) => http.request<OrderReceipt>('/orders', { method: 'POST', body: input }),
  };
}
