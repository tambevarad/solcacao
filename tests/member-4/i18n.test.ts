import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import en from '../../client/src/features/b2b/locales/en.json' with { type: 'json' };
import es from '../../client/src/features/b2b/locales/es.json' with { type: 'json' };
import { CACAO_PROFILES, PACKAGING_OPTIONS } from '../../client/src/features/b2b/options.js';
import { STEPS, STEP_FIELDS } from '../../client/src/features/b2b/wizard.js';

const featureDir = 'client/src/features/b2b';
const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) return name === 'locales' ? [] : sourceFiles(file);
    return /\.tsx?$/.test(name) ? [file] : [];
  });

/** Keys built from contract values or fixed lists in templates such as `b2b.cacao.${id}.name`. */
function templateKeys(): string[] {
  const expand = (prefix: string, ids: readonly (string | number)[], parts: string[]) =>
    ids.flatMap((id) => parts.map((part) => `${prefix}.${id}${part ? `.${part}` : ''}`));
  return [
    ...expand(
      'b2b.hero',
      ['seasonal', 'truffles', 'business'],
      ['eyebrow', 'title', 'body', 'cta'],
    ),
    ...expand('b2b.home.collections', ['bar', 'truffle', 'seasonal'], ['title', 'body']),
    ...expand('b2b.wholesale.services', ['molds', 'packaging', 'whiteLabel'], ['title', 'body']),
    ...expand('b2b.wholesale.steps', STEPS, ['']),
    ...expand('b2b.packaging', PACKAGING_OPTIONS, ['name', 'description']),
    ...expand('b2b.cacao', CACAO_PROFILES, ['name', 'description']),
    ...STEPS.flatMap((step) => [`b2b.wizard.step${step}.title`, `b2b.wizard.step${step}.intro`]),
    ...STEPS.flatMap((step) => STEP_FIELDS[step]).map((field) => `b2b.fields.${field}`),
    ...expand('b2b.receipt.notificationStatus', ['pending', 'sent', 'failed'], ['']),
  ];
}

function literalKeys(): string[] {
  const keys = new Set<string>();
  for (const file of sourceFiles(featureDir))
    for (const match of readFileSync(file, 'utf8').matchAll(/['"`](b2b\.[A-Za-z0-9_.]+)['"`]/g))
      keys.add(match[1]);
  return [...keys];
}

const tokens = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('b2b dictionaries', () => {
  const used = new Set([...literalKeys(), ...templateKeys()]);
  const dictionaries: [string, Record<string, string>][] = [
    ['en', en],
    ['es', es],
  ];

  it.each(dictionaries)('%s defines every key the feature uses', (_locale, dictionary) => {
    expect([...used].filter((key) => !(key in dictionary))).toEqual([]);
  });

  it('has no unused keys and matching {tokens} in both languages', () => {
    expect(Object.keys(en).filter((key) => !used.has(key))).toEqual([]);
    for (const key of Object.keys(en))
      expect(tokens(es[key as keyof typeof es] ?? ''), key).toEqual(
        tokens(en[key as keyof typeof en]),
      );
  });

  it('does not hard-code shopper-facing English in components', () => {
    for (const file of sourceFiles(featureDir).filter((name) => name.endsWith('.tsx'))) {
      // Text nodes between tags that contain letters, other than {expressions}. The lookbehind
      // skips arrow types such as `=> Promise<T>`.
      const text = readFileSync(file, 'utf8').match(/(?<!=)>\s*[A-Za-z][^<>{}]*</g) ?? [];
      expect(text, file).toEqual([]);
    }
  });
});
