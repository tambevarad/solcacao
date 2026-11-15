import { useId } from 'react';
import { Link } from 'react-router-dom';
import type { ProductQuery } from '../../../../../contracts/index.js';
import { api } from '../../../api/index.js';
import { buttonStyles, photos, type PhotoAsset } from '../../../shared/index.js';
import { localizePath, useLocale } from '../../shell/public.js';
import { DeferredPhoto } from '../components/DeferredPhoto.js';
import { FeaturedProducts, type ListProducts } from '../components/FeaturedProducts.js';
import { HeroCarousel } from '../components/HeroCarousel.js';

const listFromApi: ListProducts = (query: ProductQuery) => api.catalog.list(query);

/** Canonical ProductQuery categories, linked untranslated; artwork is Student 3's fixture art. */
const COLLECTIONS = ['bar', 'truffle', 'seasonal'] as const;
const COLLECTION_PHOTOS: Record<(typeof COLLECTIONS)[number], PhotoAsset> = {
  bar: photos.collectionBars,
  truffle: photos.collectionTruffles,
  seasonal: photos.collectionSeasonal,
};

const sectionHeading = 'text-2xl font-semibold md:text-3xl';
const textLink = 'font-medium text-copper underline-offset-4 hover:underline';

/**
 * Landing page in docs/design.md order: hero slides, featured products, category links,
 * corporate gifting, craftsmanship teaser and sampler entry. Only the first hero photo loads with
 * the page; the photos further down mount as the visitor scrolls near them (DeferredPhoto).
 */
export default function HomePage({
  listProducts = listFromApi,
}: {
  /** Test seam; the app always uses api.catalog.list (mock or HTTP per VITE_API_MODE). */
  listProducts?: ListProducts;
}) {
  const { t, locale } = useLocale();
  const ids = useId();
  return (
    <div className="space-y-16 md:space-y-24">
      <h1 className="sr-only">{t('b2b.home.title')}</h1>
      <HeroCarousel />

      <section aria-labelledby={`${ids}-featured`}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 id={`${ids}-featured`} className={sectionHeading}>
            {t('b2b.home.featuredTitle')}
          </h2>
          <Link to={localizePath(locale, '/catalog')} className={textLink}>
            {t('b2b.home.viewAll')}
          </Link>
        </div>
        <FeaturedProducts listProducts={listProducts} />
      </section>

      <section aria-labelledby={`${ids}-collections`}>
        <h2 id={`${ids}-collections`} className={`${sectionHeading} mb-6`}>
          {t('b2b.home.collectionsTitle')}
        </h2>
        <ul className="grid gap-6 sm:grid-cols-3">
          {COLLECTIONS.map((category) => (
            <li key={category}>
              <Link
                to={localizePath(locale, `/catalog?category=${category}`)}
                className="group block rounded border border-line bg-white/60 p-3 hover:border-copper"
              >
                <DeferredPhoto
                  image={COLLECTION_PHOTOS[category]}
                  sizes="(min-width: 1200px) 370px, (min-width: 640px) 33vw, 100vw"
                  decorative
                />
                <span className="mt-3 block text-lg font-semibold group-hover:underline">
                  {t(`b2b.home.collections.${category}.title`)}
                </span>
                <span className="mt-1 block text-sm text-cacao/80">
                  {t(`b2b.home.collections.${category}.body`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby={`${ids}-business`}
        className="grid gap-8 rounded border border-line bg-white/60 p-6 md:grid-cols-2 md:items-center md:p-10"
      >
        <DeferredPhoto image={photos.homeBusiness} sizes="(min-width: 768px) 50vw, 100vw" />
        <div>
          <p className="text-sm font-semibold tracking-widest text-copper uppercase">
            {t('b2b.home.businessEyebrow')}
          </p>
          <h2 id={`${ids}-business`} className={`${sectionHeading} mt-2`}>
            {t('b2b.home.businessTitle')}
          </h2>
          <p className="mt-4 max-w-prose text-cacao/80">{t('b2b.home.businessBody')}</p>
          <Link to={localizePath(locale, '/wholesale')} className={`${buttonStyles()} mt-6`}>
            {t('b2b.home.businessCta')}
          </Link>
        </div>
      </section>

      <div className="grid gap-10 md:grid-cols-2">
        <section aria-labelledby={`${ids}-story`} className="flex flex-col gap-4">
          <DeferredPhoto
            image={photos.homeStory}
            ratio="aspect-[3/2]"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <h2 id={`${ids}-story`} className={sectionHeading}>
            {t('b2b.home.storyTitle')}
          </h2>
          <p className="max-w-prose text-cacao/80">{t('b2b.home.storyBody')}</p>
          <Link to={localizePath(locale, '/story')} className={textLink}>
            {t('b2b.home.storyCta')}
          </Link>
        </section>
        <section aria-labelledby={`${ids}-sampler`} className="flex flex-col gap-4">
          <DeferredPhoto
            image={photos.homeSampler}
            ratio="aspect-[3/2]"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <h2 id={`${ids}-sampler`} className={sectionHeading}>
            {t('b2b.home.samplerTitle')}
          </h2>
          <p className="max-w-prose text-cacao/80">{t('b2b.home.samplerBody')}</p>
          <Link to={localizePath(locale, '/sampler')} className={textLink}>
            {t('b2b.home.samplerCta')}
          </Link>
        </section>
      </div>
    </div>
  );
}
