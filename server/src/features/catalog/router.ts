import {
  Router,
  type ErrorRequestHandler,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import type { User } from '../../../../contracts/index.js';
import { idSchema } from '../../../../contracts/validation.js';
import { optionalAuth, requireAuth } from '../../shared/auth.js';
import { describeForLog } from '../../shared/errors.js';
import {
  cartLinesSchema,
  fieldErrorsOf,
  isSlug,
  mergeCartSchema,
  parseCheckout,
  parseProductSearchParams,
} from '../../../../client/src/features/catalog/rules.js';
import { CatalogError, invalid, sendError } from './errors.js';
import {
  createOrder,
  getCart,
  getProductBySlug,
  listProducts,
  mergeCart,
  persistCart,
} from './service.js';

export interface CatalogRouterDependencies {
  /** Student 1's requireAuth: 401 envelope for a missing, invalid or expired token. */
  requireAuth: RequestHandler;
  /**
   * Student 1's optionalAuth: sets req.user for a valid bearer token, continues as a guest without
   * one, and rejects an invalid supplied token with 401 (never a silent guest downgrade).
   */
  optionalAuth: RequestHandler;
  /** Defaults to the shared mongoose connection, which Student 1's connectDb opens. */
  isDatabaseReady?: () => boolean;
  /** Per-client throttle for POST /api/orders (security finding 6); tests can inject their own. */
  orderLimit?: RequestHandler;
}

/** 30 order attempts per 15 minutes per client: far above a shopper, a brake on scripted abuse. */
export function orderRateLimit(limit = 30): RequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      sendError(res, new CatalogError(429, 'RATE_LIMITED', 'Too many orders, try again later')),
  });
}

const unauthorized = () => new CatalogError(401, 'UNAUTHORIZED', 'Authentication required');

function signedInUser(req: Request): User {
  if (!req.user || !idSchema.safeParse(req.user.id).success) throw unauthorized();
  return req.user;
}

/** `If-Match: "<revision>"`: a quoted non-negative integer, nothing else. */
function expectedRevision(req: Request): number {
  const header = req.get('if-match');
  const match = header?.match(/^"(0|[1-9]\d{0,9})"$/);
  if (!match)
    throw invalid({ 'If-Match': 'Send the expected cart revision as a quoted integer, e.g. "0"' });
  return Number(match[1]);
}

function isDatabaseOutage(error: unknown): boolean {
  return (
    error instanceof Error &&
    /^Mongo(Network|ServerSelection|NotConnected)Error$|^MongooseServerSelectionError$/.test(
      error.name,
    )
  );
}

function isClientError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
  );
}

const noStore = (res: Response) => res.set('Cache-Control', 'private, no-store');

/**
 * GET /api/products, GET /api/products/:slug, GET /api/cart, POST /api/cart/persist,
 * POST /api/cart/merge and POST /api/orders (docs/api.json). Input is validated before the
 * database is touched; authentication runs before anything else on cart routes. Dependencies are
 * injected so tests and the later real ports use the same routes.
 */
export function createCatalogRouter({
  requireAuth,
  optionalAuth,
  isDatabaseReady = () => mongoose.connection.readyState === 1,
  orderLimit = orderRateLimit(),
}: CatalogRouterDependencies): Router {
  const router = Router();

  function requireDatabase() {
    if (!isDatabaseReady())
      throw new CatalogError(503, 'SERVICE_UNAVAILABLE', 'Service unavailable');
  }

  // Raw Product[] (blueprint wire exception) with pagination in headers.
  router.get('/products', async (req, res) => {
    const query = parseProductSearchParams(req.query as Record<string, unknown>);
    if (!query.ok) throw invalid(query.fieldErrors);
    requireDatabase();
    const page = await listProducts(query.value);
    res.set({
      'X-Page': String(page.page),
      'X-Limit': String(page.limit),
      'X-Total-Count': String(page.total),
      'X-Total-Pages': String(page.totalPages),
    });
    res.json(page.items);
  });

  router.get('/products/:slug', async (req, res) => {
    const slug = req.params.slug;
    if (typeof slug !== 'string' || !isSlug(slug))
      throw new CatalogError(404, 'NOT_FOUND', 'Product not found');
    requireDatabase();
    const product = await getProductBySlug(slug);
    if (!product) throw new CatalogError(404, 'NOT_FOUND', 'Product not found');
    res.json({ data: product });
  });

  router.get('/cart', requireAuth, async (req, res) => {
    const user = signedInUser(req);
    requireDatabase();
    noStore(res).json({ data: await getCart(user.id) });
  });

  // Raw CartLine[] body (blueprint wire exception); the revision travels in If-Match.
  router.post('/cart/persist', requireAuth, async (req, res) => {
    const user = signedInUser(req);
    const revision = expectedRevision(req);
    if (!Array.isArray(req.body)) throw invalid({ items: 'Send the cart lines as a JSON array' });
    const items = cartLinesSchema.safeParse(req.body);
    if (!items.success) throw invalid(prefixed(fieldErrorsOf(items.error)));
    requireDatabase();
    noStore(res).json({ data: await persistCart(user.id, items.data, revision) });
  });

  router.post('/cart/merge', requireAuth, async (req, res) => {
    const user = signedInUser(req);
    const input = mergeCartSchema.safeParse(req.body);
    if (!input.success) throw invalid(fieldErrorsOf(input.error));
    requireDatabase();
    noStore(res).json({ data: await mergeCart(user.id, input.data) });
  });

  router.post('/orders', orderLimit, optionalAuth, async (req, res) => {
    // Owner comes from the verified token only; the body cannot name a user.
    const userId = req.user ? signedInUser(req).id : null;
    const input = parseCheckout(req.body);
    if (!input.ok) throw invalid(input.fieldErrors);
    requireDatabase();
    noStore(res)
      .status(201)
      .json({ data: await createOrder(userId, input.value) });
  });

  const handleErrors: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof CatalogError) return sendError(res, error);
    if (isDatabaseOutage(error))
      return sendError(res, new CatalogError(503, 'SERVICE_UNAVAILABLE', 'Service unavailable'));
    if (isClientError(error)) return sendError(res, invalid({ request: 'Malformed request' }));
    console.error('[catalog] Unexpected error:', describeForLog(error));
    sendError(res, new CatalogError(500, 'INTERNAL_ERROR', 'Unexpected server error'));
  };
  router.use(handleErrors);
  return router;
}

/** Array-body issues are reported as items.<index>.<field>, matching the checkout errors. */
function prefixed(fieldErrors: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, message]) => [
      key === 'request' ? 'items' : `items.${key}`,
      message,
    ]),
  );
}

/**
 * Mounted by server/src/app.ts with Student 1's middleware (server/src/shared/auth.ts): cart routes
 * require a verified bearer token; checkout accepts guests, and a supplied but invalid token is 401.
 */
export const catalogRouter = createCatalogRouter({ requireAuth, optionalAuth });
