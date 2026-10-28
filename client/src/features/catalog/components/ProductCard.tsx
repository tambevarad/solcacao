import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import type { Product } from '../../../../../contracts/index.js';
import { Button } from '../../../shared/index.js';
import { localizePath, useLocale } from '../../shell/public.js';
import { useMoney, useOriginLabel } from './format.js';
import { MAX_QUANTITY } from '../rules.js';

/** Grid card: square image, name, origin and cacao, price, stock cue and a quick add. */
export function ProductCard({
  product,
  onAdd,
  maxQuantity = Math.min(MAX_QUANTITY, product.stock),
}: {
  product: Product;
  onAdd(product: Product, quantity: number): Promise<void>;
  maxQuantity?: number;
}) {
  const { t, locale } = useLocale();
  const money = useMoney();
  const originLabel = useOriginLabel();
  const image = product.images[0];
  const href = localizePath(locale, `/products/${product.slug}`);
  const soldOut = product.stock <= 0;
  const max = Math.max(0, Math.min(MAX_QUANTITY, product.stock, maxQuantity));
  const [draft, setDraft] = useState('1');
  const [quantityError, setQuantityError] = useState(false);
  const [addError, setAddError] = useState(false);
  const [pendingAdds, setPendingAdds] = useState(0);
  const pending = pendingAdds > 0;
  const quantityId = useId();
  const quantity = Number(draft);
  const valid =
    draft.trim() !== '' && Number.isInteger(quantity) && quantity >= 1 && quantity <= max;
  const disabled = pending || max === 0;
  const step = valid ? quantity : 1;
  const stepStyles =
    'inline-flex size-11 shrink-0 items-center justify-center rounded border border-line hover:bg-line/60 disabled:opacity-50 disabled:cursor-not-allowed';

  useEffect(() => {
    setDraft((value) => (Number(value) > max ? String(Math.max(1, max)) : value));
    setQuantityError(false);
  }, [max]);

  function changeQuantity(next: number) {
    setDraft(String(Math.max(1, Math.min(max, next))));
    setQuantityError(false);
  }

  async function addSelected() {
    if (max === 0) return;
    if (!valid) {
      setQuantityError(true);
      return;
    }
    setPendingAdds((count) => count + 1);
    setAddError(false);
    try {
      await onAdd(product, quantity);
      setDraft('1');
      setQuantityError(false);
    } catch {
      setAddError(true);
    } finally {
      setPendingAdds((count) => count - 1);
    }
  }
  return (
    <li className="flex flex-col">
      <Link to={href} tabIndex={-1} aria-hidden="true" className="block">
        {image ? (
          <img
            src={image.url}
            alt=""
            width={480}
            height={480}
            loading="lazy"
            decoding="async"
            className="aspect-square w-full rounded border border-line bg-white object-cover"
          />
        ) : (
          <span className="block aspect-square w-full rounded border border-line bg-line/30" />
        )}
      </Link>
      <h2 className="mt-3 text-base font-semibold">
        <Link to={href} className="hover:underline">
          {product.name[locale]}
        </Link>
      </h2>
      <p className="text-sm text-cacao/80">
        {t('catalog.product.originCacao', {
          origin: originLabel(product.origin),
          cacao: product.cacaoPct,
        })}
      </p>
      <p className="mt-1 font-medium">{money(product.priceCents)}</p>
      {soldOut ? (
        <p className="mt-1 text-sm font-medium text-error">{t('catalog.product.soldOut')}</p>
      ) : product.stock <= 5 ? (
        <p className="mt-1 text-sm text-cacao/80">
          {t('catalog.product.lowStock', { count: product.stock })}
        </p>
      ) : null}
      {!soldOut && (
        <fieldset disabled={disabled} className="mt-3 min-w-0">
          <legend className="mb-1 text-sm font-medium">{t('catalog.product.quantity')}</legend>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={stepStyles}
              disabled={disabled || step <= 1}
              aria-label={t('catalog.cart.decrease', { name: product.name[locale] })}
              onClick={() => changeQuantity(step - 1)}
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>
            <input
              id={quantityId}
              type="number"
              inputMode="numeric"
              min={1}
              max={max}
              step={1}
              value={draft}
              disabled={disabled}
              aria-label={t('catalog.cart.quantityFor', { name: product.name[locale] })}
              aria-invalid={quantityError || undefined}
              aria-describedby={quantityError ? `${quantityId}-error` : undefined}
              className="h-11 w-11 min-w-0 rounded border border-line bg-white px-1 text-center text-cacao disabled:opacity-50"
              onChange={(event) => {
                setDraft(event.target.value);
                setQuantityError(false);
              }}
              onBlur={() => setQuantityError(!valid && max > 0)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  setQuantityError(!valid);
                }
              }}
            />
            <button
              type="button"
              className={stepStyles}
              disabled={disabled || step >= max}
              aria-label={t('catalog.cart.increase', { name: product.name[locale] })}
              onClick={() => changeQuantity(step + 1)}
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
        </fieldset>
      )}
      {quantityError && max > 0 && (
        <p id={`${quantityId}-error`} role="alert" className="mt-2 text-sm text-error">
          {t('catalog.product.quantityRange', { max })}
        </p>
      )}
      {!soldOut && max === 0 && (
        <p className="mt-2 text-sm text-cacao/80">{t('catalog.product.maxInCart')}</p>
      )}
      {addError && (
        <p role="alert" className="mt-2 text-sm text-error">
          {t('catalog.cart.saveFailed')}
        </p>
      )}
      <Button
        variant="secondary"
        className="mt-3"
        disabled={soldOut || max === 0 || !valid}
        aria-busy={pending || undefined}
        onClick={addSelected}
        aria-label={
          soldOut ? undefined : t('catalog.product.addNamed', { name: product.name[locale] })
        }
      >
        {soldOut ? t('catalog.product.soldOut') : t('catalog.product.add')}
      </Button>
    </li>
  );
}
