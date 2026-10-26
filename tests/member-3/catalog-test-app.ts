import express, { type RequestHandler } from 'express';
import type { Address, CheckoutInput } from '../../contracts/index.js';
import { createCatalogRouter } from '../../server/src/features/catalog/router.js';

/**
 * Test doubles for Student 1's requireAuth / optionalAuth, used only in tests. The header
 * `x-test-user: <24-hex id>` stands in for a verified JWT subject; `x-test-user: invalid` stands in
 * for a supplied but invalid token.
 */
const user = (id: string) => ({
  id,
  name: 'Test',
  email: `${id}@example.test`,
  role: 'retail' as const,
});
const testRequireAuth: RequestHandler = (req, res, next) => {
  const id = req.get('x-test-user');
  if (!id || !/^[a-f0-9]{24}$/.test(id)) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    return;
  }
  req.user = user(id);
  next();
};
const testOptionalAuth: RequestHandler = (req, res, next) => {
  const id = req.get('x-test-user');
  if (id === undefined) return next();
  testRequireAuth(req, res, next);
};

export const SHOPPER_A = '0000000000000000000000a1';
export const SHOPPER_B = '0000000000000000000000b2';

export function createCatalogTestApp(options: { isDatabaseReady?: () => boolean } = {}) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use(
    '/api',
    createCatalogRouter({
      requireAuth: testRequireAuth,
      optionalAuth: testOptionalAuth,
      isDatabaseReady: options.isDatabaseReady,
    }),
  );
  return app;
}

export const testAddress = (overrides: Partial<Address> = {}): Address => ({
  recipient: 'Test Shopper',
  line1: '1 Example Street',
  city: 'Testville',
  region: 'TX',
  postalCode: '75001',
  country: 'US',
  ...overrides,
});

export const checkoutInput = (overrides: Partial<CheckoutInput> = {}): CheckoutInput => ({
  items: [{ productId: '5c0ca0000000000000000001', quantity: 2 }],
  email: 'shopper@example.test',
  address: testAddress(),
  requestId: '11111111-1111-4111-8111-111111111111',
  ...overrides,
});
