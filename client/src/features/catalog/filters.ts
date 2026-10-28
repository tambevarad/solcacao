import type { ProductQuery } from '../../../../contracts/index.js';
import { CATEGORIES, MAX_SEARCH_LENGTH, SORTS } from './rules.js';

/** Price slider and number inputs share these bounds, in cents ($0–$50). */
export const PRICE_UI_MAX_CENTS = 5000;

/** Catalog URL keys (a subset of ProductQuery; locale comes from the path, limit is fixed). */
export type CatalogFilters = Omit<ProductQuery, 'locale' | 'limit'>;

const int = (value: string | null, min: number, max: number) =>
  value !== null && /^\d{1,9}$/.test(value) && Number(value) >= min && Number(value) <= max
    ? Number(value)
    : undefined;

/**
 * Reads filters from the page URL. Invalid or contradictory values are dropped one by one rather
 * than failing the whole page, so a hand-edited link still shows a sensible catalog.
 */
export function readFilters(params: URLSearchParams): CatalogFilters {
  const search = params.get('search')?.trim().slice(0, MAX_SEARCH_LENGTH) || undefined;
  const origin = params.get('origin')?.trim() || undefined;
  const category = (CATEGORIES as readonly string[]).includes(params.get('category') ?? '')
    ? (params.get('category') as CatalogFilters['category'])
    : undefined;
  const sort = (SORTS as readonly string[]).includes(params.get('sort') ?? '')
    ? (params.get('sort') as CatalogFilters['sort'])
    : undefined;
  let cacaoMin = int(params.get('cacaoMin'), 0, 100);
  let cacaoMax = int(params.get('cacaoMax'), 0, 100);
  let cacaoPct = int(params.get('cacaoPct'), 0, 100);
  if (cacaoPct !== undefined && (cacaoMin !== undefined || cacaoMax !== undefined))
    cacaoPct = undefined;
  if (cacaoMin !== undefined && cacaoMax !== undefined && cacaoMin > cacaoMax)
    cacaoMin = cacaoMax = undefined;
  let priceMinCents = int(params.get('priceMinCents'), 0, 100_000_000);
  let priceMaxCents = int(params.get('priceMaxCents'), 0, 100_000_000);
  if (priceMinCents !== undefined && priceMaxCents !== undefined && priceMinCents > priceMaxCents)
    priceMinCents = priceMaxCents = undefined;
  const page = int(params.get('page'), 1, 100_000);
  return {
    ...(search ? { search } : {}),
    ...(origin ? { origin } : {}),
    ...(category ? { category } : {}),
    ...(cacaoPct !== undefined ? { cacaoPct } : {}),
    ...(cacaoMin !== undefined ? { cacaoMin } : {}),
    ...(cacaoMax !== undefined ? { cacaoMax } : {}),
    ...(priceMinCents !== undefined ? { priceMinCents } : {}),
    ...(priceMaxCents !== undefined ? { priceMaxCents } : {}),
    ...(sort && sort !== 'name' ? { sort } : {}),
    ...(page && page > 1 ? { page } : {}),
  };
}

const ORDER: (keyof CatalogFilters)[] = [
  'search',
  'category',
  'origin',
  'cacaoPct',
  'cacaoMin',
  'cacaoMax',
  'priceMinCents',
  'priceMaxCents',
  'sort',
  'page',
];

/** Writes filters back in a stable key order; defaults are omitted to keep URLs short. */
export function writeFilters(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ORDER) {
    const value = filters[key];
    if (value === undefined || value === '') continue;
    if (key === 'sort' && value === 'name') continue;
    if (key === 'page' && value === 1) continue;
    params.set(key, String(value));
  }
  return params;
}

/** Number of narrowing filters (search, category, origin, cacao, price) for the mobile button. */
export function activeFilterCount(filters: CatalogFilters): number {
  return [
    filters.search,
    filters.category,
    filters.origin,
    filters.cacaoPct ?? filters.cacaoMin ?? filters.cacaoMax,
    filters.priceMinCents ?? filters.priceMaxCents,
  ].filter((value) => value !== undefined).length;
}
