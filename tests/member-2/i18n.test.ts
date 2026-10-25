import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../server/src/app.js';
import { ApiError, createHttpClient } from '../../client/src/api/http.js';
import { createHttpShell } from '../../client/src/features/shell/http.js';
import { createMockShell } from '../../client/src/features/shell/mock.js';
import {
  FEATURE_NAMESPACES,
  dictionaries,
  featureDictionaries,
} from '../../client/src/features/shell/dictionaries.js';
import { ROUTE_META_IDS } from '../../client/src/features/shell/meta.js';
import {
  accountLinks,
  footerNavigation,
  isNavGroup,
  primaryNavigation,
} from '../../client/src/features/shell/navigation.js';
import type { Locale } from '../../contracts/index.js';

const locales: Locale[] = ['en', 'es'];
const unusedHttp = createHttpClient(() => null);

/** JSON.parse keeps the last duplicate silently, so scan the raw flat dictionary text. */
function duplicateKeys(file: string) {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const match of readFileSync(file, 'utf8').matchAll(/^\s*"((?:[^"\\]|\\.)*)"\s*:/gm)) {
    if (seen.has(match[1])) duplicates.push(match[1]);
    seen.add(match[1]);
  }
  return duplicates;
}

describe('feature dictionaries', () => {
  it.each(FEATURE_NAMESPACES)('%s has no duplicate keys in either locale file', (feature) => {
    for (const locale of locales)
      expect(duplicateKeys(`client/src/features/${feature}/locales/${locale}.json`)).toEqual([]);
  });

  it.each(FEATURE_NAMESPACES)('%s keys are prefixed, string-valued and match EN/ES', (feature) => {
    const en = featureDictionaries.en[feature];
    const es = featureDictionaries.es[feature];
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    for (const [key, value] of [...Object.entries(en), ...Object.entries(es)]) {
      expect(key.startsWith(`${feature}.`), key).toBe(true);
      expect(typeof value).toBe('string');
    }
  });

  it('combines all five features without losing or overriding keys', () => {
    for (const locale of locales) {
      const total = FEATURE_NAMESPACES.reduce(
        (sum, feature) => sum + Object.keys(featureDictionaries[locale][feature]).length,
        0,
      );
      expect(Object.keys(dictionaries[locale])).toHaveLength(total);
    }
    expect(Object.keys(dictionaries.es).sort()).toEqual(Object.keys(dictionaries.en).sort());
  });

  it('defines every navigation label and every route title/description in both languages', () => {
    const keys = [
      ...primaryNavigation.flatMap((item) =>
        isNavGroup(item)
          ? [item.labelKey, ...item.children.map((child) => child.labelKey)]
          : [item.labelKey],
      ),
      ...footerNavigation.flatMap((group) => [
        group.headingKey,
        ...group.items.map((item) => item.labelKey),
      ]),
      ...Object.values(accountLinks).map((item) => item.labelKey),
      ...ROUTE_META_IDS.flatMap((id) => [`shell.meta.${id}.title`, `shell.meta.${id}.description`]),
    ];
    for (const locale of locales)
      for (const key of keys) expect(dictionaries[locale][key], `${locale} ${key}`).toBeTruthy();
  });
});

describe('dictionary adapters', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('mock returns a copy of the combined dictionary for each locale', async () => {
    const shell = createMockShell(unusedHttp);
    for (const locale of locales) {
      const result = await shell.dictionary(locale);
      expect(result).toEqual(dictionaries[locale]);
      result['shell.nav.shop'] = 'mutated';
      expect(dictionaries[locale]['shell.nav.shop']).not.toBe('mutated');
    }
  });

  it('mock rejects an unsupported locale with the same error as the API', async () => {
    const shell = createMockShell(unusedHttp);
    // Simulates an untyped caller; the contract type only admits en|es.
    const bad = 'fr' as unknown as Locale;
    await expect(shell.dictionary(bad)).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  });

  it('HTTP adapter requests /api/i18n/:locale and unwraps the data envelope', async () => {
    const fetchMock = vi.fn(
      async (url: string) =>
        new Response(JSON.stringify({ data: dictionaries[url.endsWith('/es') ? 'es' : 'en'] }), {
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const shell = createHttpShell(createHttpClient(() => null));
    expect(await shell.dictionary('en')).toEqual(dictionaries.en);
    expect(await shell.dictionary('es')).toEqual(dictionaries.es);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/i18n/en', '/api/i18n/es']);
  });

  it('HTTP adapter surfaces a 400 as ApiError instead of returning a fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Unsupported locale' } }),
            { status: 400 },
          ),
      ),
    );
    const error = await createHttpShell(createHttpClient(() => null))
      .dictionary('en')
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });
});

describe('GET /api/i18n/:locale', () => {
  it.each(locales)('serves the same %s dictionary as the mock adapter', async (locale) => {
    const response = await request(app).get(`/api/i18n/${locale}`);
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-cache');
    expect(response.body).toEqual({ data: await createMockShell(unusedHttp).dictionary(locale) });
  });

  it.each(['fr', 'EN', 'en-US', '%20en'])(
    'rejects unsupported locale %s with 400',
    async (locale) => {
      const response = await request(app).get(`/api/i18n/${locale}`);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unsupported locale',
          fieldErrors: { locale: 'Use en or es' },
        },
      });
    },
  );
});
