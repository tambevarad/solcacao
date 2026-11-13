import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product, ProductPage, ProductQuery } from '../../../../../contracts/index.js';
import { NotImplementedError } from '../../../api/notImplemented.js';
import { EmptyState, ErrorState, buttonStyles } from '../../../shared/index.js';
import { localizePath, useLocale } from '../../shell/public.js';
import { useNearViewport } from './DeferredPhoto.js';
import { ImageSlot } from './ImageSlot.js';

export type ListProducts = (query: ProductQuery) => Promise<ProductPage>;

type LoadState =
  | { status: 'loading' }
  /** Student 3's catalog API is still a template stub. */
  | { status: 'pending' }
  | { status: 'error' }
  | { status: 'ready'; items: Product[] };

export const FEATURED_LIMIT = 4;

const grid = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4';
const imageBox = 'aspect-[4/3] w-full rounded border border-line';

/** Product photo that loads only when the card nears the viewport; its box holds the space. */
function ProductImage({ image, alt }: { image: Product['images'][number]; alt: string }) {
  const { ref, near } = useNearViewport<HTMLDivElement>();
  if (!near)
    return <div ref={ref} role="img" aria-label={alt} className={`${imageBox} bg-white`} />;
  return (
    <img
      src={image.url}
      alt={alt}
      width={480}
      height={360}
      loading="lazy"
      decoding="async"
      className={`${imageBox} bg-white object-cover`}
    />
  );
}

/**
 * Loading state with the same layout as the loaded grid, so the sections below don't move when the
 * products arrive (and their photos aren't counted as near the top of the page while it loads).
 */
function FeaturedSkeleton({ label }: { label: string }) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      <ul aria-hidden="true" className={grid}>
        {Array.from({ length: FEATURED_LIMIT }, (_, i) => (
          <li key={i} className="flex flex-col">
            <div className={`${imageBox} bg-line/30`} />
            <div className="mt-3 h-5 w-3/4 rounded bg-line/30" />
            <div className="mt-2 h-4 w-1/2 rounded bg-line/30" />
            <div className="mt-2 h-5 w-1/4 rounded bg-line/30" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Featured items through api.catalog.list (docs/contracts.md: the homepage gets products only
 * through the catalog API). Loading, empty, error and "catalog not connected yet" stay distinct.
 */
export function FeaturedProducts({ listProducts }: { listProducts: ListProducts }) {
  const { t, locale } = useLocale();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    // Keep current cards on screen while a language change reloads the localized sort.
    setState((previous) => (previous.status === 'ready' ? previous : { status: 'loading' }));
    listProducts({ limit: FEATURED_LIMIT, sort: 'name', locale }).then(
      (page) => {
        if (active) setState({ status: 'ready', items: page.items.slice(0, FEATURED_LIMIT) });
      },
      (error: unknown) => {
        if (active)
          setState(
            error instanceof NotImplementedError ? { status: 'pending' } : { status: 'error' },
          );
      },
    );
    return () => {
      active = false;
    };
  }, [listProducts, locale, attempt]);

  const catalogLink = (
    <Link to={localizePath(locale, '/catalog')} className={buttonStyles({ variant: 'secondary' })}>
      {t('b2b.featured.browse')}
    </Link>
  );

  if (state.status === 'loading') return <FeaturedSkeleton label={t('b2b.featured.loading')} />;
  if (state.status === 'pending')
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 rounded border border-dashed border-copper/60 bg-white/60 px-4 py-10 text-center"
      >
        <p className="max-w-prose text-cacao/80">{t('b2b.featured.pending')}</p>
        {catalogLink}
      </div>
    );
  if (state.status === 'error')
    return (
      <ErrorState
        title={t('b2b.featured.errorTitle')}
        description={t('b2b.featured.errorBody')}
        onRetry={() => setAttempt((count) => count + 1)}
      />
    );
  if (!state.items.length)
    return <EmptyState title={t('b2b.featured.empty')} action={catalogLink} />;

  const price = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' });
  return (
    <ul className={grid}>
      {state.items.map((product) => {
        const image = product.images[0];
        return (
          <li key={product.id} className="flex flex-col">
            {image ? (
              <ProductImage image={image} alt={image.alt[locale]} />
            ) : (
              <ImageSlot description={t('b2b.featured.imageMissing')} />
            )}
            <h3 className="mt-3 font-semibold">
              <Link
                to={localizePath(locale, `/products/${product.slug}`)}
                className="hover:underline"
              >
                {product.name[locale]}
              </Link>
            </h3>
            <p className="text-sm text-cacao/80">
              {t('b2b.featured.details', { origin: product.origin, cacao: product.cacaoPct })}
            </p>
            <p className="mt-1 font-medium">{price.format(product.priceCents / 100)}</p>
          </li>
        );
      })}
    </ul>
  );
}
