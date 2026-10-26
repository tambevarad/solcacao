import { Link } from 'react-router-dom';
import type { Product } from '../../../../../contracts/index.js';
import { Button } from '../../../shared/index.js';
import { localizePath, useLocale } from '../../shell/public.js';
import { useMoney, useOriginLabel } from './format.js';

/** Grid card: square image, name, origin and cacao, price, stock cue and a quick add. */
export function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd(product: Product): void;
}) {
  const { t, locale } = useLocale();
  const money = useMoney();
  const originLabel = useOriginLabel();
  const image = product.images[0];
  const href = localizePath(locale, `/products/${product.slug}`);
  const soldOut = product.stock <= 0;
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
      <Button
        variant="secondary"
        className="mt-3"
        disabled={soldOut}
        onClick={() => onAdd(product)}
        aria-label={
          soldOut ? undefined : t('catalog.product.addNamed', { name: product.name[locale] })
        }
      >
        {soldOut ? t('catalog.product.soldOut') : t('catalog.product.add')}
      </Button>
    </li>
  );
}
