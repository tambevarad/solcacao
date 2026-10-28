import type { InquiryInput, Product, HttpClient } from '../../contracts/index.js';

export const input: InquiryInput = {
  name: 'Synthetic Shopper',
  email: 'shopper@example.test',
  category: 'support',
  message: 'A fictional support question.',
  locale: 'en',
  requestId: 'a0183df2-237c-4375-8775-e8ce17c39bf4',
};
export const product: Product = {
  id: '000000000000000000000001',
  slug: 'test-bar',
  name: { en: 'Test bar', es: 'Barra de prueba' },
  description: { en: 'Fictional test product', es: 'Producto ficticio de prueba' },
  category: 'bar',
  origin: 'Test',
  cacaoPct: 70,
  priceCents: 500,
  currency: 'USD',
  images: [],
  ingredients: { en: 'Pending', es: 'Pendiente' },
  allergens: { en: 'Pending', es: 'Pendiente' },
  stock: 10,
  active: true,
};
export const unusedHttp: HttpClient = {
  async request() {
    throw new Error('Unexpected HTTP request');
  },
  async requestRaw() {
    throw new Error('Unexpected raw HTTP request');
  },
};
