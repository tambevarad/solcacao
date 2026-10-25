/**
 * Single assembly point for UI dictionaries (decision D15). Both the client mock adapter and the
 * server GET /api/i18n/:locale route import this module, so the two can never disagree. Explicit
 * JSON imports are compiled into dist/server by tsc, so the API does not depend on source paths.
 *
 * Each feature owner edits only their own locales/en.json and locales/es.json. Keys are flat and
 * prefixed with the feature namespace (for example "catalog.filters.origin").
 */
import type { Dictionary, Locale } from '../../../../contracts/index.js';
import authEn from '../auth/locales/en.json' with { type: 'json' };
import authEs from '../auth/locales/es.json' with { type: 'json' };
import shellEn from './locales/en.json' with { type: 'json' };
import shellEs from './locales/es.json' with { type: 'json' };
import catalogEn from '../catalog/locales/en.json' with { type: 'json' };
import catalogEs from '../catalog/locales/es.json' with { type: 'json' };
import b2bEn from '../b2b/locales/en.json' with { type: 'json' };
import b2bEs from '../b2b/locales/es.json' with { type: 'json' };
import supportEn from '../support/locales/en.json' with { type: 'json' };
import supportEs from '../support/locales/es.json' with { type: 'json' };

export const FEATURE_NAMESPACES = ['auth', 'shell', 'catalog', 'b2b', 'support'] as const;
export type FeatureNamespace = (typeof FEATURE_NAMESPACES)[number];

/** Per-feature sources, kept separate so tests can check prefixes and EN/ES parity per owner. */
export const featureDictionaries: Record<Locale, Record<FeatureNamespace, Dictionary>> = {
  en: { auth: authEn, shell: shellEn, catalog: catalogEn, b2b: b2bEn, support: supportEn },
  es: { auth: authEs, shell: shellEs, catalog: catalogEs, b2b: b2bEs, support: supportEs },
};

function combine(locale: Locale): Readonly<Dictionary> {
  const combined: Dictionary = {};
  for (const namespace of FEATURE_NAMESPACES)
    Object.assign(combined, featureDictionaries[locale][namespace]);
  return Object.freeze(combined);
}

/** Combined flat dictionaries served to the UI. Treat as read-only. */
export const dictionaries: Record<Locale, Readonly<Dictionary>> = {
  en: combine('en'),
  es: combine('es'),
};
