import { createContext, useContext, useEffect } from 'react';

export const BRAND_NAME = 'SolCacao';

/** One id per route in client/src/routes.tsx. Default copy lives in shell.meta.<id>.title/description. */
export const ROUTE_META_IDS = [
  'home',
  'catalog',
  'product',
  'login',
  'register',
  'account',
  'checkout',
  'orderConfirmation',
  'wholesale',
  'quoteRequest',
  'contact',
  'feedback',
  'sampler',
  'story',
  'care',
  'notFound',
] as const;
export type RouteMetaId = (typeof ROUTE_META_IDS)[number];

export interface PageMeta {
  /** Already-translated page title; " · SolCacao" is appended. */
  title: string;
  /** Already-translated meta description. Falls back to the route default when omitted. */
  description?: string;
}

export function applyDocumentMeta({ title, description }: PageMeta) {
  document.title = title === BRAND_NAME ? BRAND_NAME : `${title} · ${BRAND_NAME}`;
  if (description === undefined) return;
  let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'description';
    document.head.append(tag);
  }
  tag.content = description;
}

/** Provided by PageFrame so a page's override wins over the route default deterministically. */
export const PageMetaContext = createContext<((meta: PageMeta | null) => void) | null>(null);

/**
 * Overrides the route's default title/description, e.g. with a product name. Pass translated
 * strings: usePageMeta({ title: product.name[locale] }).
 */
export function usePageMeta({ title, description }: PageMeta) {
  const setOverride = useContext(PageMetaContext);
  useEffect(() => {
    if (!setOverride) {
      applyDocumentMeta({ title, description });
      return;
    }
    setOverride({ title, description });
    return () => setOverride(null);
  }, [setOverride, title, description]);
}
