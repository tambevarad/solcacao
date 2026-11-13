import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { Router } from 'express';
import { isWithin } from './assets.js';

export interface ClientAppOptions {
  /** The built React client, normally dist/client. */
  root: string;
  /** Private directories (UPLOAD_DIR) that must never sit inside or around the client root. */
  privateDirs?: string[];
}

/**
 * The routes in client/src/routes.tsx, below /:locale (tests/member-2/client-serving.test.ts keeps
 * the two lists in step). They get index.html with 200. Any other extensionless path gets the same
 * page, which renders not-found, with a 404, so a mistyped address is never served as a success.
 */
const APP_ROUTES = [
  'catalog',
  'products/[^/]+',
  'login',
  'register',
  'account',
  'checkout',
  'order-confirmation',
  'wholesale',
  'wholesale/request',
  'contact',
  'feedback',
  'sampler',
  'story',
  'care',
];
const APP_PATH = new RegExp(`^/(?:(?:en|es)(?:/(?:${APP_ROUTES.join('|')}))?/?)?$`);

const isApiPath = (p: string) => p === '/api' || p.startsWith('/api/');

/**
 * Production serving for the built client (docs/deployment.md, D22). Mount it after the /api
 * routers and before the JSON 404 handler:
 * - /api paths pass straight through, so unknown API routes keep their JSON 404;
 * - hashed files under /assets are cached for a year, other static files for an hour;
 * - any other GET for an extensionless path gets index.html, so /en and /es deep links survive a
 *   refresh. Paths that are not app routes get the same page (it renders not-found) with a 404.
 * Missing files keep the JSON 404 rather than receiving HTML.
 */
export function createClientRouter({ root, privateDirs = [] }: ClientAppOptions): Router {
  const clientRoot = path.resolve(root);
  const indexFile = path.join(clientRoot, 'index.html');
  if (!existsSync(indexFile))
    throw new Error(`Built client not found at ${indexFile}; run npm run build first`);
  for (const dir of privateDirs) {
    const privateRoot = path.resolve(dir);
    if (isWithin(privateRoot, clientRoot) || isWithin(clientRoot, privateRoot))
      throw new Error(`Client root ${clientRoot} overlaps private directory ${privateRoot}`);
  }

  const router = Router();
  router.use((req, _res, next) => (isApiPath(req.path) ? next('router') : next()));
  router.use(
    '/assets',
    express.static(path.join(clientRoot, 'assets'), {
      immutable: true,
      maxAge: '1y',
      index: false,
      redirect: false,
    }),
  );
  router.use(
    express.static(clientRoot, { dotfiles: 'ignore', index: false, redirect: false, maxAge: '1h' }),
  );
  router.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (path.extname(req.path) || !req.accepts('html')) return next();
    res
      .status(APP_PATH.test(req.path) ? 200 : 404)
      .set('Cache-Control', 'no-cache')
      .sendFile(indexFile);
  });
  return router;
}
