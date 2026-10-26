import { useMemo } from 'react';
import { useLocale } from '../../shell/public.js';
import { CATALOG_ORIGINS } from '../fixtures.js';

/** Integer USD cents in the visitor's locale. Spanish changes formatting, never the currency. */
export function useMoney() {
  const { locale } = useLocale();
  return useMemo(() => {
    const format = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' });
    return (cents: number) => format.format(cents / 100);
  }, [locale]);
}

const originKeys: Record<string, string> = Object.fromEntries(
  CATALOG_ORIGINS.map((origin) => [origin, `catalog.origin.${origin.replace(/\s+/g, '')}`]),
);

/** Translated label for a canonical origin; unknown origins show their canonical name. */
export function useOriginLabel() {
  const { t } = useLocale();
  return (origin: string) => (originKeys[origin] ? t(originKeys[origin]) : origin);
}
