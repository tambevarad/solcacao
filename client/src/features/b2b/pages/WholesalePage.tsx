import { useId } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../../../../../contracts/index.js';
import { useAuth } from '../../auth/public.js';
import { buttonStyles, Photo, photos, type PhotoAsset } from '../../../shared/index.js';
import { DeferredPhoto } from '../components/DeferredPhoto.js';
import { localizePath, useLocale } from '../../shell/public.js';
import { PACKAGING_OPTIONS, PACKAGING_PHOTOS, QUANTITY_MAX, QUANTITY_MIN } from '../options.js';

const SERVICES = ['molds', 'packaging', 'whiteLabel'] as const;
const SERVICE_PHOTOS: Record<(typeof SERVICES)[number], PhotoAsset> = {
  molds: photos.serviceMolds,
  packaging: photos.servicePackaging,
  whiteLabel: photos.serviceWhiteLabel,
};
const sectionHeading = 'text-2xl font-semibold md:text-3xl';

/**
 * Wholesale services with original example slots and one start-customization action. No prices,
 * lead times or other business claims until the team supplies them.
 */
export default function WholesalePage() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const ids = useId();
  const quantities = new Intl.NumberFormat(locale);
  return (
    <div className="space-y-16 md:space-y-24">
      <section className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
        <div>
          <p className="text-sm font-semibold tracking-widest text-copper uppercase">
            {t('b2b.wholesale.eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-balance md:text-4xl">
            {t('b2b.wholesale.title')}
          </h1>
          <p className="mt-4 max-w-prose text-lg text-cacao/80">{t('b2b.wholesale.intro')}</p>
          <Link
            to={localizePath(locale, '/wholesale/request')}
            className={`${buttonStyles()} mt-6`}
          >
            {t('b2b.wholesale.start')}
          </Link>
          <AccountNote user={user} />
        </div>
        <Photo
          image={photos.wholesaleHero}
          sizes="(min-width: 1200px) 560px, (min-width: 768px) 50vw, 100vw"
          priority
        />
      </section>

      <section aria-labelledby={`${ids}-services`}>
        <h2 id={`${ids}-services`} className={`${sectionHeading} mb-6`}>
          {t('b2b.wholesale.servicesTitle')}
        </h2>
        <ul className="grid gap-8 md:grid-cols-3">
          {SERVICES.map((service) => (
            <li key={service} className="flex flex-col gap-3">
              <DeferredPhoto
                image={SERVICE_PHOTOS[service]}
                sizes="(min-width: 1200px) 370px, (min-width: 768px) 33vw, 100vw"
              />
              <h3 className="text-xl font-semibold">
                {t(`b2b.wholesale.services.${service}.title`)}
              </h3>
              <p className="text-cacao/80">{t(`b2b.wholesale.services.${service}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`${ids}-packaging`}>
        <h2 id={`${ids}-packaging`} className={sectionHeading}>
          {t('b2b.wholesale.packagingTitle')}
        </h2>
        <p className="mt-3 mb-6 max-w-prose text-cacao/80">{t('b2b.wholesale.packagingIntro')}</p>
        <ul className="grid gap-8 sm:grid-cols-3">
          {PACKAGING_OPTIONS.map((option) => (
            <li key={option} className="flex flex-col gap-3">
              <DeferredPhoto
                image={PACKAGING_PHOTOS[option]}
                ratio="aspect-square"
                sizes="(min-width: 1200px) 370px, (min-width: 640px) 33vw, 100vw"
              />
              <h3 className="text-lg font-semibold">{t(`b2b.packaging.${option}.name`)}</h3>
              <p className="text-cacao/80">{t(`b2b.packaging.${option}.description`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-12 md:grid-cols-2">
        <section aria-labelledby={`${ids}-steps`}>
          <h2 id={`${ids}-steps`} className={`${sectionHeading} mb-6`}>
            {t('b2b.wholesale.stepsTitle')}
          </h2>
          <ol className="space-y-5">
            {([1, 2, 3, 4] as const).map((step) => (
              <li key={step} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cacao font-semibold text-ivory"
                >
                  {step}
                </span>
                <div>
                  <h3 className="font-semibold">{t(`b2b.wizard.step${step}.title`)}</h3>
                  <p className="text-cacao/80">{t(`b2b.wholesale.steps.${step}`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section
          aria-labelledby={`${ids}-needs`}
          className="rounded border border-line bg-white/60 p-6"
        >
          <h2 id={`${ids}-needs`} className={`${sectionHeading} mb-4`}>
            {t('b2b.wholesale.needsTitle')}
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-cacao/90">
            <li>{t('b2b.wholesale.needs.account')}</li>
            <li>{t('b2b.wholesale.needs.file')}</li>
            <li>
              {t('b2b.wholesale.needs.quantity', {
                min: quantities.format(QUANTITY_MIN),
                max: quantities.format(QUANTITY_MAX),
              })}
            </li>
            <li>{t('b2b.wholesale.needs.contact')}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

/**
 * Explains what happens next for the current account type. Access control itself stays with
 * Student 1's RequireRole on the wizard route; this is guidance, not a guard.
 */
function AccountNote({ user }: { user: User | null }) {
  const { t, locale } = useLocale();
  if (user?.role === 'b2b') return null;
  if (user?.role === 'retail')
    return (
      <p
        role="note"
        className="mt-4 max-w-prose rounded border border-copper/60 bg-white/70 p-4 text-sm"
      >
        {t('b2b.wholesale.retailNote')}{' '}
        <Link to={localizePath(locale, '/register')} className="font-medium underline">
          {t('b2b.wholesale.registerBusiness')}
        </Link>
      </p>
    );
  return <p className="mt-4 max-w-prose text-sm text-cacao/80">{t('b2b.wholesale.guestNote')}</p>;
}
