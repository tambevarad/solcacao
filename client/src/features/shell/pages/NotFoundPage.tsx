import { Link, useParams } from 'react-router-dom';
import { buttonStyles } from '../../../shared/Button.js';
import { useLocale } from '../public.js';
import { LOCALE_NAMES, SUPPORTED_LOCALES, isLocale, localizePath } from '../locale.js';

/** Unknown paths and unsupported language prefixes. Offers recovery links, never a redirect guess. */
export default function NotFoundPage() {
  const { t, locale } = useLocale();
  const { locale: prefix } = useParams();
  const unsupportedPrefix = !isLocale(prefix);
  return (
    <section className="mx-auto max-w-xl py-12 text-center">
      <p className="text-sm font-semibold tracking-widest text-copper uppercase">
        {t('shell.notFound.eyebrow')}
      </p>
      <h1 className="mt-3 text-3xl font-semibold break-words hyphens-auto">
        {t('shell.notFound.title')}
      </h1>
      <p className="mt-4 text-cacao/80">{t('shell.notFound.body')}</p>
      {unsupportedPrefix ? (
        <>
          <p className="mt-6">{t('shell.notFound.unsupportedLocale')}</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-3">
            {SUPPORTED_LOCALES.map((option) => (
              <li key={option}>
                <Link
                  to={localizePath(option)}
                  lang={option}
                  hrefLang={option}
                  className={buttonStyles({ variant: option === locale ? 'primary' : 'secondary' })}
                >
                  {LOCALE_NAMES[option]}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={localizePath(locale)} className={buttonStyles()}>
            {t('shell.notFound.home')}
          </Link>
          <Link
            to={localizePath(locale, '/catalog')}
            className={buttonStyles({ variant: 'secondary' })}
          >
            {t('shell.notFound.catalog')}
          </Link>
        </div>
      )}
    </section>
  );
}
