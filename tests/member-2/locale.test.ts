import { describe, expect, it } from 'vitest';
import {
  interpolate,
  localeFromPath,
  localizePath,
  stripLocale,
  switchLocalePath,
} from '../../client/src/features/shell/locale.js';

describe('localized URL helpers', () => {
  it('builds canonical localized URLs, keeping slugs and query values untranslated', () => {
    expect(localizePath('en')).toBe('/en');
    expect(localizePath('es', '/')).toBe('/es');
    expect(localizePath('es', '/catalog?category=bar')).toBe('/es/catalog?category=bar');
    expect(localizePath('en', 'products/fixture-bar-1')).toBe('/en/products/fixture-bar-1');
    expect(localizePath('es', '?search=x')).toBe('/es?search=x');
  });

  it('switches only the prefix and keeps the rest of the path', () => {
    expect(switchLocalePath('/en/products/fixture-bar-1', 'es')).toBe('/es/products/fixture-bar-1');
    expect(switchLocalePath('/es/wholesale/request', 'en')).toBe('/en/wholesale/request');
    expect(switchLocalePath('/en', 'es')).toBe('/es');
    expect(switchLocalePath('/', 'es')).toBe('/es');
    // An unsupported prefix is replaced by the language the visitor explicitly chose.
    expect(switchLocalePath('/fr/catalog', 'es')).toBe('/es/catalog');
  });

  it('accepts only en/es prefixes', () => {
    expect(localeFromPath('/es/catalog')).toBe('es');
    expect(localeFromPath('/en')).toBe('en');
    expect(localeFromPath('/fr/catalog')).toBeNull();
    expect(localeFromPath('/EN/catalog')).toBeNull();
    expect(localeFromPath('/catalog')).toBeNull();
    expect(localeFromPath('/')).toBeNull();
  });

  it('identifies the page independent of language', () => {
    expect(stripLocale('/en/products/a')).toBe('/products/a');
    expect(stripLocale('/es/products/a')).toBe('/products/a');
    expect(stripLocale('/es')).toBe('/');
  });
});

describe('interpolate', () => {
  it('replaces named tokens and leaves unknown tokens visible', () => {
    expect(interpolate('Items: {count}', { count: 3 })).toBe('Items: 3');
    expect(interpolate('{a} and {b}', { a: 'x' })).toBe('x and {b}');
    expect(interpolate('No tokens')).toBe('No tokens');
    expect(interpolate('{toString}', {})).toBe('{toString}');
  });
});
