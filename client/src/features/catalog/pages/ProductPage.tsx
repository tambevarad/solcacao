import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import type { CatalogApi, Product } from '../../../../../contracts/index.js';
import { api } from '../../../api/index.js';
import { ApiError } from '../../../api/http.js';
import { Button, ErrorState, Field, LoadingState, buttonStyles } from '../../../shared/index.js';
import { localizePath, useLocale, usePageMeta } from '../../shell/public.js';
import { useCartDetails } from '../cart/CartProvider.js';
import { useMoney, useOriginLabel } from '../components/format.js';
import { MAX_QUANTITY } from '../rules.js';

type Load =
  | { status: 'loading' }
  | { status: 'notFound' }
  | { status: 'error' }
  | { status: 'ready'; product: Product };

/**
 * /:locale/products/:slug. The slug is canonical and never translated; switching language keeps
 * the same product and only changes the displayed text. Missing and inactive products are 404.
 */
export default function ProductPage({ catalog = api.catalog }: { catalog?: CatalogApi }) {
  const { slug = '' } = useParams();
  const { t, locale } = useLocale();
  const remember = useCartDetails().remember;
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoad({ status: 'loading' });
    catalog.get(slug).then(
      (product) => {
        if (!active) return;
        remember([product]);
        setLoad({ status: 'ready', product });
      },
      (error: unknown) => {
        if (!active) return;
        setLoad({
          status: error instanceof ApiError && error.status === 404 ? 'notFound' : 'error',
        });
      },
    );
    return () => {
      active = false;
    };
  }, [catalog, slug, attempt, remember]);

  const back = (
    <Link
      to={localizePath(locale, '/catalog')}
      className="inline-flex min-h-11 items-center gap-1 underline-offset-4 hover:underline"
    >
      <ChevronLeft aria-hidden="true" className="size-4" />
      {t('catalog.product.back')}
    </Link>
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 lg:px-8">
      {back}
      {load.status === 'loading' ? (
        <LoadingState label={t('catalog.product.loading')} />
      ) : load.status === 'notFound' ? (
        <div className="py-12 text-center">
          <h1 className="text-3xl font-semibold">{t('catalog.product.notFoundTitle')}</h1>
          <p className="mx-auto mt-3 max-w-prose text-cacao/80">
            {t('catalog.product.notFoundBody')}
          </p>
          <Link to={localizePath(locale, '/catalog')} className={`${buttonStyles()} mt-6`}>
            {t('catalog.cart.browse')}
          </Link>
        </div>
      ) : load.status === 'error' ? (
        <>
          <h1 className="sr-only">{t('catalog.product.errorTitle')}</h1>
          <ErrorState
            title={t('catalog.product.errorTitle')}
            description={t('catalog.product.errorBody')}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        </>
      ) : (
        <ProductDetails product={load.product} />
      )}
    </div>
  );
}

function ProductDetails({ product }: { product: Product }) {
  const { t, locale } = useLocale();
  const cart = useCartDetails();
  const money = useMoney();
  const originLabel = useOriginLabel();
  const name = product.name[locale];
  usePageMeta({ title: name, description: product.description[locale] });

  const inCart = cart.items.find((line) => line.productId === product.id)?.quantity ?? 0;
  const max = Math.max(0, Math.min(MAX_QUANTITY, product.stock) - inCart);
  const soldOut = product.stock <= 0;
  const [selected, setSelected] = useState(0);
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const [added, setAdded] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const image = product.images[selected] ?? product.images[0];

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(quantity);
    if (!Number.isInteger(value) || value < 1 || value > max) {
      setError(t('catalog.product.quantityRange', { max }));
      return;
    }
    setError('');
    setAdded('');
    setSaveFailed(false);
    const outcome = await cart.addLine(product.id, value);
    if (outcome === 'failed') {
      // Nothing was saved: keep the chosen amount so the shopper can try again.
      setSaveFailed(true);
      return;
    }
    setAdded(
      outcome === 'added'
        ? t('catalog.product.added', { name })
        : t('catalog.cart.limited', { name, max: Math.min(MAX_QUANTITY, product.stock) }),
    );
    setQuantity('1');
  }

  return (
    <article className="mt-4 grid gap-8 md:grid-cols-2 lg:gap-12">
      <div>
        {image ? (
          <img
            src={image.url}
            alt={image.alt[locale]}
            width={800}
            height={800}
            decoding="async"
            className="aspect-square w-full rounded border border-line bg-white object-cover"
          />
        ) : (
          <div className="aspect-square w-full rounded border border-line bg-line/30" />
        )}
        {product.images.length > 1 && (
          <ul className="mt-3 flex gap-3" aria-label={t('catalog.product.gallery')}>
            {product.images.map((item, index) => (
              <li key={item.url}>
                <button
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-pressed={index === selected}
                  aria-label={t('catalog.product.showImage', {
                    index: index + 1,
                    total: product.images.length,
                  })}
                  className="block size-20 overflow-hidden rounded border border-line aria-pressed:border-cacao aria-pressed:ring-2 aria-pressed:ring-cacao"
                >
                  <img
                    src={item.url}
                    alt=""
                    width={80}
                    height={80}
                    loading="lazy"
                    className="aspect-square size-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-cacao/70">{t('catalog.product.photoNote')}</p>
      </div>

      <div className="min-w-0">
        <p className="text-sm tracking-wide text-cacao/80 uppercase">
          {t(`catalog.category.${product.category}`)}
        </p>
        <h1 className="mt-1 text-3xl font-semibold break-words md:text-4xl">{name}</h1>
        <p className="mt-2 text-cacao/80">
          {t('catalog.product.originCacao', {
            origin: originLabel(product.origin),
            cacao: product.cacaoPct,
          })}
        </p>
        <p className="mt-4 text-2xl font-semibold">{money(product.priceCents)}</p>
        <p className={`mt-1 text-sm ${soldOut ? 'font-medium text-error' : 'text-cacao/80'}`}>
          {soldOut
            ? t('catalog.product.soldOut')
            : product.stock <= 5
              ? t('catalog.product.lowStock', { count: product.stock })
              : t('catalog.product.inStock')}
        </p>
        <p className="mt-6 max-w-prose">{product.description[locale]}</p>

        {soldOut ? (
          <p className="mt-6 rounded border border-line bg-white p-4">
            {t('catalog.product.soldOutBody')}
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-wrap items-end gap-3" noValidate>
            <Field
              label={t('catalog.product.quantity')}
              type="number"
              inputMode="numeric"
              name="quantity"
              min={1}
              max={Math.max(1, max)}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              error={error || undefined}
              hint={inCart ? t('catalog.product.inCart', { count: inCart }) : undefined}
              className="w-32"
              disabled={max === 0}
            />
            <Button type="submit" disabled={max === 0}>
              {t('catalog.product.add')}
            </Button>
          </form>
        )}
        {max === 0 && !soldOut && (
          <p className="mt-2 text-sm text-cacao/80">{t('catalog.product.maxInCart')}</p>
        )}
        {saveFailed && (
          <p role="alert" className="mt-2 flex flex-wrap items-center gap-3 text-sm text-error">
            {t('catalog.cart.saveFailed')}
            <button
              type="button"
              onClick={() => cart.setOpen(true)}
              className="font-medium underline underline-offset-4"
            >
              {t('catalog.product.viewCart')}
            </button>
          </p>
        )}
        <div role="status" className="mt-3 min-h-6">
          {added && (
            <span className="flex flex-wrap items-center gap-3">
              {added}
              <button
                type="button"
                onClick={() => cart.setOpen(true)}
                className="font-medium underline underline-offset-4"
              >
                {t('catalog.product.viewCart')}
              </button>
            </span>
          )}
        </div>

        <div className="mt-8 divide-y divide-line border-y border-line">
          <Accordion title={t('catalog.product.ingredients')}>
            {product.ingredients[locale]}
          </Accordion>
          <Accordion title={t('catalog.product.allergens')}>{product.allergens[locale]}</Accordion>
          <Accordion title={t('catalog.product.care')}>{t('catalog.product.careBody')}</Accordion>
        </div>
      </div>
    </article>
  );
}

/** Native disclosure: keyboard, screen-reader state and find-in-page work without extra code. */
function Accordion({ title, children }: { title: string; children: string }) {
  return (
    <details className="group">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-5 transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <p className="pb-4 text-cacao/90">{children}</p>
    </details>
  );
}
