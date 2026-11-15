import path from 'node:path';
import express, { Router, type Response } from 'express';

/** Only approved image/font types are public. Uploaded PDFs and everything else are refused. */
export const PUBLIC_ASSET_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webp',
  '.woff2',
]);

export interface PublicAssetsOptions {
  /** Directory of approved public files, e.g. dist/client/placeholders. */
  root: string;
  /** Private directories (UPLOAD_DIR) that must never overlap the public root. */
  privateDirs?: string[];
  /** Cache lifetime passed to express.static. */
  maxAge?: string | number;
}

export function isWithin(child: string, parent: string) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function notFound(res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Asset not found' } });
}

/**
 * Template for serving approved brand/product assets. Not mounted yet: the Express app belongs to
 * Student 1, and the proposed mount is in team/member-2/handoff.md. Student 4's private uploads
 * stay outside every public root; configuration that overlaps them fails at startup.
 */
export function createPublicAssetsRouter({
  root,
  privateDirs = [],
  maxAge = '1h',
}: PublicAssetsOptions): Router {
  const publicRoot = path.resolve(root);
  for (const dir of privateDirs) {
    const privateRoot = path.resolve(dir);
    if (isWithin(privateRoot, publicRoot) || isWithin(publicRoot, privateRoot))
      throw new Error(`Public asset root ${publicRoot} overlaps private directory ${privateRoot}`);
  }

  const router = Router();
  router.use((req, res, next) => {
    if (!PUBLIC_ASSET_EXTENSIONS.has(path.extname(req.path).toLowerCase())) return notFound(res);
    next();
  });
  router.use(
    express.static(publicRoot, {
      dotfiles: 'ignore',
      index: false,
      redirect: false,
      maxAge,
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    }),
  );
  router.use((_req, res) => notFound(res));
  return router;
}
