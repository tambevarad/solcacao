import type { Locale } from '../../../../contracts/index.js';

/** Supported URL prefixes. Anything else renders the not-found page (docs/contracts.md). */
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'es'];
export const DEFAULT_LOCALE: Locale = 'en';

/** Endonyms are shown in their own language in every locale, so they are not dictionary keys. */
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', es: 'Español' };

export type TranslationValues = Record<string, string | number>;

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'es';
}

/** Returns the locale from the first path segment, or null when the prefix is unsupported. */
export function localeFromPath(pathname: string): Locale | null {
  const segment = pathname.split('/')[1];
  return isLocale(segment) ? segment : null;
}

/** "/es/products/x" -> "/products/x"; "/es" -> "/". Used to detect real page changes. */
export function stripLocale(pathname: string): string {
  const rest = pathname.split('/').slice(2).join('/');
  return `/${rest}`;
}

/**
 * Builds a canonical localized URL. `path` is relative to the locale root and may include a
 * query string: localizePath('es', '/catalog?category=bar') -> '/es/catalog?category=bar'.
 */
export function localizePath(locale: Locale, path = ''): string {
  const rest = path.replace(/^\/+/, '');
  if (!rest) return `/${locale}`;
  return rest.startsWith('?') || rest.startsWith('#') ? `/${locale}${rest}` : `/${locale}/${rest}`;
}

/** Replaces only the locale prefix so the same page (and slug) stays open. */
export function switchLocalePath(pathname: string, next: Locale): string {
  const segments = pathname.split('/');
  if (segments.length < 2 || segments[1] === '') return `/${next}`;
  segments[1] = next;
  return segments.join('/');
}

/** Replaces `{name}` tokens. Unknown tokens stay visible so missing values are noticed. */
export function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (token, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : token,
  );
}
