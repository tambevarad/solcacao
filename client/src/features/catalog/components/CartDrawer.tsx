import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartLine, Product } from '../../../../../contracts/index.js';
import {
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  LoadingState,
  buttonStyles,
} from '../../../shared/index.js';
import { localizePath, useLocale } from '../../shell/public.js';
import { useCartDetails, type CartDetails } from '../cart/CartProvider.js';
import { CartNoticeView } from './CartNoticeView.js';
import { useMoney } from './format.js';

/** The one shared right-hand cart drawer (docs/design.md), opened from the header. */
export function CartDrawer() {
  const cart = useCartDetails();
  const { t, locale } = useLocale();
  const money = useMoney();
  const close = () => cart.setOpen(false);
  const unavailable = cart.items.some((line) => cart.lookup(line.productId) === null);
  const resolving = cart.items.some((line) => cart.lookup(line.productId) === undefined);

  const footer = cart.items.length ? (
    <div className="space-y-3">
      <p className="flex items-baseline justify-between gap-4 text-lg font-semibold">
        <span>{t('catalog.cart.subtotal')}</span>
        <span data-testid="cart-subtotal">{money(cart.subtotalCents)}</span>
      </p>
      <p className="text-sm text-cacao/80">{t('catalog.cart.subtotalNote')}</p>
      {unavailable && <p className="text-sm text-error">{t('catalog.cart.removeUnavailable')}</p>}
      {unavailable || resolving || cart.status === 'loading' ? (
        <Button fullWidth disabled>
          {t('catalog.cart.checkout')}
        </Button>
      ) : (
        <Link
          to={localizePath(locale, '/checkout')}
          onClick={close}
          className={buttonStyles({ fullWidth: true })}
        >
          {t('catalog.cart.checkout')}
        </Link>
      )}
    </div>
  ) : undefined;

  return (
    <Drawer
      open={cart.open}
      onClose={close}
      side="right"
      title={t('catalog.cart.title')}
      footer={footer}
    >
      <CartNoticeView />
      {cart.status === 'loading' ? (
        <LoadingState label={t('catalog.cart.loading')} />
      ) : !cart.items.length ? (
        <EmptyState
          title={t('catalog.cart.empty')}
          description={t('catalog.cart.emptyBody')}
          action={
            <Link
              to={localizePath(locale, '/catalog')}
              onClick={close}
              className={buttonStyles({ variant: 'secondary' })}
            >
              {t('catalog.cart.browse')}
            </Link>
          }
        />
      ) : (
        <>
          {cart.directoryFailed && (
            <ErrorState
              title={t('catalog.cart.detailsError')}
              onRetry={cart.retryDirectory}
              className="py-4"
            />
          )}
          <ul className="divide-y divide-line" aria-busy={cart.status === 'saving' || undefined}>
            {cart.items.map((line) => (
              <CartLineRow
                key={line.productId}
                line={line}
                product={cart.lookup(line.productId)}
                cart={cart}
                onNavigate={close}
              />
            ))}
          </ul>
          <p role="status" className="sr-only">
            {cart.status === 'saving' ? t('catalog.cart.saving') : ''}
          </p>
        </>
      )}
    </Drawer>
  );
}

function CartLineRow({
  line,
  product,
  cart,
  onNavigate,
}: {
  line: CartLine;
  product: Product | null | undefined;
  cart: CartDetails;
  onNavigate(): void;
}) {
  const { t, locale } = useLocale();
  const money = useMoney();
  if (product === undefined)
    return (
      <li className="py-4 text-cacao/80" aria-busy="true">
        {t('catalog.cart.lineLoading')}
      </li>
    );
  if (product === null)
    return (
      <li className="flex items-center justify-between gap-3 py-4">
        <p>{t('catalog.cart.lineUnavailable')}</p>
        <Button variant="secondary" onClick={() => void cart.remove(line.productId)}>
          {t('catalog.cart.remove')}
        </Button>
      </li>
    );
  const name = product.name[locale];
  const image = product.images[0];
  const max = Math.max(1, Math.min(99, product.stock));
  return (
    <li className="grid grid-cols-[4rem_1fr] gap-3 py-4">
      {image ? (
        <img
          src={image.url}
          alt=""
          width={64}
          height={64}
          className="aspect-square w-16 rounded border border-line bg-white object-cover"
        />
      ) : (
        <span aria-hidden="true" className="aspect-square w-16 rounded border border-line" />
      )}
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <Link
            to={localizePath(locale, `/products/${product.slug}`)}
            onClick={onNavigate}
            className="font-medium break-words hover:underline"
          >
            {name}
          </Link>
          <span className="text-sm">{money(product.priceCents * line.quantity)}</span>
        </div>
        <p className="text-sm text-cacao/80">
          {t('catalog.cart.unitPrice', { price: money(product.priceCents) })}
        </p>
        {product.stock < line.quantity && (
          <p className="text-sm text-error">
            {product.stock
              ? t('catalog.cart.lineShort', { count: product.stock })
              : t('catalog.product.soldOut')}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <QuantityStepper
            name={name}
            quantity={line.quantity}
            max={max}
            onChange={(quantity) => void cart.update(line.productId, quantity)}
          />
          <Button
            variant="ghost"
            className="px-2"
            onClick={() => void cart.remove(line.productId)}
            aria-label={t('catalog.cart.removeItem', { name })}
          >
            <Trash2 aria-hidden="true" className="size-4" />
            <span aria-hidden="true">{t('catalog.cart.remove')}</span>
          </Button>
        </div>
      </div>
    </li>
  );
}

/** − [n] + with a typed value applied on blur/Enter; every control is labeled with the product. */
export function QuantityStepper({
  name,
  quantity,
  max,
  onChange,
}: {
  name: string;
  quantity: number;
  max: number;
  onChange(quantity: number): void;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState(String(quantity));
  useEffect(() => setDraft(String(quantity)), [quantity]);
  const commit = () => {
    const value = Number(draft);
    if (Number.isInteger(value) && value >= 1 && value !== quantity) onChange(Math.min(max, value));
    else setDraft(String(quantity));
  };
  const control =
    'inline-flex size-11 items-center justify-center rounded border border-line hover:bg-line/60 disabled:opacity-50';
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={control}
        onClick={() => onChange(quantity - 1)}
        aria-label={t('catalog.cart.decrease', { name })}
      >
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
        }}
        aria-label={t('catalog.cart.quantityFor', { name })}
        className="h-11 w-14 rounded border border-line bg-white text-center"
      />
      <button
        type="button"
        className={control}
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= max}
        aria-label={t('catalog.cart.increase', { name })}
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
