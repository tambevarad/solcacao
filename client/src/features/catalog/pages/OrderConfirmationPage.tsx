import { z } from 'zod';
import { Link, useLocation } from 'react-router-dom';
import type { OrderReceipt } from '../../../../../contracts/index.js';
import { buttonStyles } from '../../../shared/index.js';
import { localizePath, useLocale } from '../../shell/public.js';
import { useMoney } from '../components/format.js';

/** Route state the checkout page passes; never read from storage or the URL. No personal data. */
export interface ConfirmationState {
  receipt: OrderReceipt;
}

const stateSchema = z.object({
  receipt: z.object({
    id: z.string().regex(/^[a-f0-9]{24}$/i),
    status: z.literal('simulated'),
    totalCents: z.number().int().min(0),
    currency: z.literal('USD'),
    createdAt: z.string().datetime(),
  }),
});

/**
 * /:locale/order-confirmation. Shows the simulated receipt from route state only. Without valid
 * state (opened directly, or a stale tab) it shows a safe link back to the catalog instead of an
 * invented order.
 */
export default function OrderConfirmationPage() {
  const { t, locale } = useLocale();
  const money = useMoney();
  const parsed = stateSchema.safeParse(useLocation().state);
  const catalogLink = (
    <Link to={localizePath(locale, '/catalog')} className={buttonStyles()}>
      {t('catalog.confirmation.continue')}
    </Link>
  );

  if (!parsed.success)
    return (
      <div className="mx-auto max-w-prose px-4 py-12 text-center">
        <h1 className="text-3xl font-semibold">{t('catalog.confirmation.missingTitle')}</h1>
        <p className="mt-3 text-cacao/80">{t('catalog.confirmation.missingBody')}</p>
        <div className="mt-6">{catalogLink}</div>
      </div>
    );

  const { receipt } = parsed.data;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(
    new Date(receipt.createdAt),
  );
  return (
    <div className="mx-auto max-w-prose px-4 py-12">
      <h1 className="text-3xl font-semibold">{t('catalog.confirmation.title')}</h1>
      <p className="mt-4 rounded border-2 border-copper bg-white p-4 font-semibold">
        {t('catalog.checkout.demoNotice')}
      </p>
      <p className="mt-4 text-cacao/80">{t('catalog.confirmation.body')}</p>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded border border-line bg-white p-5">
        <dt className="font-medium">{t('catalog.confirmation.reference')}</dt>
        <dd className="font-mono break-all">{receipt.id}</dd>
        <dt className="font-medium">{t('catalog.confirmation.date')}</dt>
        <dd>{date}</dd>
        <dt className="font-medium">{t('catalog.confirmation.total')}</dt>
        <dd>{money(receipt.totalCents)}</dd>
      </dl>
      <p className="mt-4 text-sm text-cacao/80">{t('catalog.confirmation.noEmail')}</p>
      <div className="mt-8">{catalogLink}</div>
    </div>
  );
}
