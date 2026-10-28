import { api } from '../../api/index.js';
import type { Locale, Product } from '../../../../contracts/index.js';

export async function loadSamplerProducts(locale: Locale): Promise<Product[]> {
  const first = await api.catalog.list({ page: 1, limit: 48, locale });
  const products = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    products.push(...(await api.catalog.list({ page, limit: 48, locale })).items);
  }
  return products.filter((product) => product.active);
}
