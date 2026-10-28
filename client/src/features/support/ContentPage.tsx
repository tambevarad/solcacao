import { Link } from 'react-router-dom';
import { Photo, photos, buttonStyles } from '../../shared/index.js';
import { localizePath, useLocale, usePageMeta } from '../shell/public.js';

export function ContentPage({ page }: { page: 'story' | 'care' }) {
  const { locale, t } = useLocale();
  usePageMeta({ title: t(`support.${page}.title`), description: t(`support.${page}.intro`) });
  const related =
    page === 'story'
      ? [
          { path: '/catalog', label: 'catalog' },
          { path: '/wholesale', label: 'wholesale' },
        ]
      : [
          { path: '/catalog', label: 'catalog' },
          { path: '/sampler', label: 'sampler' },
        ];
  return (
    <article className="space-y-12 py-8 md:py-16">
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-widest text-copper">
            {t(`support.${page}.eyebrow`)}
          </p>
          <h1 className="text-3xl sm:text-4xl">{t(`support.${page}.title`)}</h1>
          <p className="max-w-prose leading-relaxed">{t(`support.${page}.intro`)}</p>
        </div>
        <Photo
          image={page === 'story' ? photos.homeStory : photos.productDarkShards}
          ratio="aspect-[3/2]"
          priority
        />
      </div>
      <div className="mx-auto max-w-prose space-y-8 leading-relaxed">
        <p className="text-sm text-copper">{t('support.content.photoNote')}</p>
        <section className="space-y-3 border-t border-line pt-6">
          <h2 className="text-2xl">{t(`support.${page}.section`)}</h2>
          <p>{t(`support.${page}.body`)}</p>
        </section>
        <section className="space-y-3 border-t border-line pt-6">
          <h2 className="text-2xl">{t(`support.${page}.secondTitle`)}</h2>
          <p>{t(`support.${page}.secondBody`)}</p>
        </section>
        <nav
          aria-label={t('support.content.explore')}
          className="flex flex-wrap gap-x-6 gap-y-3 underline underline-offset-4"
        >
          {related.map((link) => (
            <Link key={link.path} to={localizePath(locale, link.path)}>
              {t(`support.content.${link.label}`)}
            </Link>
          ))}
        </nav>
        <Link
          className={buttonStyles({ variant: 'secondary' })}
          to={localizePath(locale, '/contact')}
        >
          {t('support.content.contact')}
        </Link>
      </div>
    </article>
  );
}
