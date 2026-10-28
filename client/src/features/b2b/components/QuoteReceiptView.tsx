import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import type { QuoteReceipt } from '../../../../../contracts/index.js';
import { Button, buttonStyles } from '../../../shared/index.js';
import { localizePath, useLocale } from '../../shell/public.js';

/**
 * Truthful confirmation (docs/design.md, Forms): says whether the request was only simulated or
 * actually saved, and reports the notification result exactly as the receipt states it.
 */
export function QuoteReceiptView({
  receipt,
  demoMode,
  onReset,
}: {
  receipt: QuoteReceipt;
  demoMode: boolean;
  onReset(): void;
}) {
  const { t, locale } = useLocale();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const submittedAt = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(receipt.createdAt));

  return (
    <section className="rounded border border-line bg-white/70 p-6 md:p-10">
      <CircleCheck aria-hidden="true" className="size-10 text-copper" />
      <h2
        ref={heading}
        tabIndex={-1}
        className="mt-4 text-2xl font-semibold focus-visible:outline-none"
      >
        {t(demoMode ? 'b2b.receipt.demoTitle' : 'b2b.receipt.title')}
      </h2>
      <p className="mt-3 max-w-prose text-cacao/80">
        {t(demoMode ? 'b2b.receipt.demoBody' : 'b2b.receipt.savedBody')}
      </p>
      <dl className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <dt className="text-sm text-cacao/70">{t('b2b.receipt.reference')}</dt>
        <dd className="font-mono break-all">{receipt.id}</dd>
        <dt className="text-sm text-cacao/70">{t('b2b.receipt.submittedAt')}</dt>
        <dd>{submittedAt}</dd>
        <dt className="text-sm text-cacao/70">{t('b2b.receipt.notification')}</dt>
        <dd>{t(`b2b.receipt.notificationStatus.${receipt.notificationStatus}`)}</dd>
      </dl>
      {receipt.notificationStatus === 'failed' && (
        <p
          role="note"
          className="mt-6 max-w-prose rounded border border-copper/60 bg-ivory p-4 text-sm"
        >
          {t('b2b.receipt.notificationFailedHelp')}
        </p>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={onReset}>{t('b2b.receipt.another')}</Button>
        <Link
          to={localizePath(locale, '/wholesale')}
          className={buttonStyles({ variant: 'secondary' })}
        >
          {t('b2b.receipt.backToWholesale')}
        </Link>
      </div>
    </section>
  );
}
