import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import type { CatalogApi, Product, ProductPage } from '../../../../../contracts/index.js';
import { api } from '../../../api/index.js';
import { ApiError } from '../../../api/http.js';
import {
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  LoadingState,
  Select,
} from '../../../shared/index.js';
import { useLocale } from '../../shell/public.js';
import { useCartDetails } from '../cart/CartProvider.js';
import { FilterForm } from '../components/FilterForm.js';
import { Pagination } from '../components/Pagination.js';
import { ProductCard } from '../components/ProductCard.js';
import { activeFilterCount, readFilters, writeFilters, type CatalogFilters } from '../filters.js';
import { MAX_QUANTITY } from '../rules.js';

export const CATALOG_PAGE_SIZE = 12;

type Load =
  | { status: 'loading'; previous?: ProductPage }
  | { status: 'error'; invalid: boolean }
  | { status: 'ready'; page: ProductPage };

/**
 * /:locale/catalog. Every filter, the sort and the page live in the URL, so refresh, shared links
 * and back/forward restore them; changing a filter resets to page 1. Results come from
 * api.catalog.list. Loading keeps the form (and the previous results, dimmed) on screen; empty and
 * error are separate states.
 */
export default function CatalogPage({ catalog = api.catalog }: { catalog?: CatalogApi }) {
  const { t, locale } = useLocale();
  const cart = useCartDetails();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const filtersKey = writeFilters(filters).toString();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const remember = cart.remember;

  useEffect(() => {
    let active = true;
    setLoad((current) => ({
      status: 'loading',
      previous:
        current.status === 'ready'
          ? current.page
          : current.status === 'loading'
            ? current.previous
            : undefined,
    }));
    catalog.list({ ...filters, limit: CATALOG_PAGE_SIZE, locale }).then(
      (page) => {
        if (!active) return;
        remember(page.items);
        setLoad({ status: 'ready', page });
      },
      (error: unknown) => {
        if (active)
          setLoad({ status: 'error', invalid: error instanceof ApiError && error.status === 400 });
      },
    );
    return () => {
      active = false;
    };
    // filtersKey captures every filter value; the object itself changes identity per render.
  }, [catalog, filtersKey, locale, attempt, remember]);

  const change = (next: CatalogFilters) => setParams(writeFilters({ ...next, page: undefined }));
  const hrefFor = (page: number) => `?${writeFilters({ ...filters, page }).toString()}`;
  const clearAll = () => setParams(writeFilters({ sort: filters.sort }));
  const count = activeFilterCount(filters);

  /** Rejects when nothing was saved, so the card keeps the chosen amount and shows its alert. */
  async function addToCart(product: Product, quantity: number) {
    const name = product.name[locale];
    const outcome = await cart.addLine(product.id, quantity);
    if (outcome === 'failed') {
      setAnnouncement('');
      throw new Error('The cart change was not saved');
    }
    setAnnouncement(
      outcome === 'added'
        ? t('catalog.product.added', { name })
        : t('catalog.cart.limited', {
            name,
            max: Math.min(MAX_QUANTITY, product.stock),
          }),
    );
  }

  const shown =
    load.status === 'ready' ? load.page : load.status === 'loading' ? load.previous : undefined;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold md:text-4xl">{t('catalog.list.title')}</h1>
      <p className="mt-2 max-w-prose text-cacao/80">{t('catalog.list.intro')}</p>
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[16rem_1fr]">
        <aside className="hidden md:block" aria-label={t('catalog.filters.title')}>
          <h2 className="mb-4 text-lg font-semibold">{t('catalog.filters.title')}</h2>
          <FilterForm filters={filters} onChange={change} />
        </aside>

        <section aria-labelledby="catalog-results" className="min-w-0">
          <h2 id="catalog-results" className="sr-only">
            {t('catalog.list.results')}
          </h2>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <Button
              variant="secondary"
              className="md:hidden"
              onClick={() => setFiltersOpen(true)}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              {count ? t('catalog.filters.openWithCount', { count }) : t('catalog.filters.open')}
            </Button>
            <p role="status" aria-live="polite" className="text-cacao/80">
              {load.status === 'ready'
                ? t('catalog.list.count', { count: load.page.total })
                : load.status === 'loading'
                  ? t('catalog.list.loading')
                  : ''}
            </p>
            <Select
              label={t('catalog.sort.label')}
              value={filters.sort ?? 'name'}
              onChange={(event) =>
                change({ ...filters, sort: event.target.value as CatalogFilters['sort'] })
              }
              className="w-full sm:w-56"
            >
              <option value="name">{t('catalog.sort.name')}</option>
              <option value="priceAsc">{t('catalog.sort.priceAsc')}</option>
              <option value="priceDesc">{t('catalog.sort.priceDesc')}</option>
            </Select>
          </div>

          {load.status === 'error' ? (
            <ErrorState
              title={t('catalog.list.errorTitle')}
              description={t(load.invalid ? 'catalog.list.invalidBody' : 'catalog.list.errorBody')}
              onRetry={load.invalid ? clearAll : () => setAttempt((n) => n + 1)}
              retryLabel={load.invalid ? t('catalog.filters.clear') : undefined}
            />
          ) : !shown ? (
            <LoadingState label={t('catalog.list.loading')} />
          ) : shown.items.length === 0 ? (
            <EmptyState
              title={shown.total > 0 ? t('catalog.list.pageEmpty') : t('catalog.list.empty')}
              description={shown.total > 0 ? undefined : t('catalog.list.emptyBody')}
              action={
                shown.total > 0 ? (
                  <Button
                    variant="secondary"
                    onClick={() => setParams(writeFilters({ ...filters, page: 1 }))}
                  >
                    {t('catalog.pagination.first')}
                  </Button>
                ) : count ? (
                  <Button variant="secondary" onClick={clearAll}>
                    {t('catalog.filters.clear')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <ul
                aria-busy={load.status === 'loading' || undefined}
                className={`grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 ${load.status === 'loading' ? 'opacity-60' : ''}`}
              >
                {shown.items.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToCart}
                    eagerImage={index < 3}
                    maxQuantity={Math.max(
                      0,
                      Math.min(MAX_QUANTITY, product.stock) -
                        (cart.items.find((line) => line.productId === product.id)?.quantity ?? 0),
                    )}
                  />
                ))}
              </ul>
              <Pagination page={shown.page} totalPages={shown.totalPages} hrefFor={hrefFor} />
            </>
          )}
        </section>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        side="left"
        title={t('catalog.filters.title')}
      >
        <FilterForm filters={filters} onChange={change} onApplied={() => setFiltersOpen(false)} />
      </Drawer>
    </div>
  );
}
