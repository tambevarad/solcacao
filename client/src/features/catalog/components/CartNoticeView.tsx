import { useLocale } from '../../shell/public.js';
import { Button } from '../../../shared/index.js';
import { useCartDetails } from '../cart/CartProvider.js';

/**
 * Visible status for merge adjustments, revision conflicts and failed saves (docs/design.md:
 * "Visible status for merge/stock adjustments"). Problems are alerts; a clean merge is polite.
 */
export function CartNoticeView() {
  const cart = useCartDetails();
  const { t, locale } = useLocale();
  const notice = cart.notice;
  if (!notice) return null;
  const nameOf = (productId: string) => {
    const product = cart.lookup(productId);
    return product ? product.name[locale] : t('catalog.cart.unknownItem');
  };

  let message: string;
  let details: string[] = [];
  let retry = false;
  switch (notice.kind) {
    case 'merged':
      message = t(
        notice.adjustments.length ? 'catalog.cart.mergedAdjusted' : 'catalog.cart.merged',
      );
      details = notice.adjustments.map((adjustment) =>
        adjustment.actual
          ? t('catalog.cart.adjustedLine', {
              name: nameOf(adjustment.productId),
              requested: adjustment.requested,
              actual: adjustment.actual,
            })
          : t('catalog.cart.droppedLine', { name: nameOf(adjustment.productId) }),
      );
      break;
    case 'mergeFailed':
      message = t('catalog.cart.mergeFailed');
      retry = true;
      break;
    case 'loadFailed':
      message = t('catalog.cart.loadFailed');
      retry = true;
      break;
    case 'conflict':
      message = t('catalog.cart.conflict');
      break;
    case 'outOfStock':
      message = t('catalog.cart.outOfStock');
      break;
    case 'unavailable':
      message = t('catalog.cart.unavailable');
      break;
    case 'limited':
      message = t('catalog.cart.limited', { name: nameOf(notice.productId), max: notice.max });
      break;
    case 'saveFailed':
      message = t('catalog.cart.saveFailed');
      retry = true;
      break;
  }
  const problem = notice.kind !== 'merged' || details.length > 0;
  return (
    <div
      role={problem ? 'alert' : 'status'}
      className={`mb-4 rounded border p-3 text-sm ${problem ? 'border-error' : 'border-line'} bg-white`}
    >
      <p>{message}</p>
      {details.length > 0 && (
        <ul className="mt-2 list-disc pl-5">
          {details.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {retry && (
          <Button variant="secondary" onClick={cart.retry}>
            {t('catalog.cart.retry')}
          </Button>
        )}
        <Button variant="ghost" onClick={cart.dismissNotice}>
          {t('catalog.cart.dismiss')}
        </Button>
      </div>
    </div>
  );
}
