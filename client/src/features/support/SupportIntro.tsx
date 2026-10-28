import { Link } from 'react-router-dom';
import { localizePath, useLocale } from '../shell/public.js';
import { whatsappUrl } from './rules.js';

export function SupportIntro({ page }: { page: 'contact' | 'feedback' | 'sampler' }) {
  const { locale, t } = useLocale();
  const whatsapp = whatsappUrl(import.meta.env.VITE_WHATSAPP_NUMBER, t('support.whatsapp.message'));
  return (
    <div className="space-y-6">
      <p className="text-sm uppercase tracking-widest text-copper">{t('support.intro.eyebrow')}</p>
      <h1 className="text-3xl leading-tight sm:text-4xl">{t(`support.${page}.title`)}</h1>
      <p className="max-w-prose leading-relaxed">{t(`support.${page}.description`)}</p>
      <nav
        aria-label={t('support.nav.label')}
        className="flex flex-wrap gap-x-6 gap-y-3 text-sm underline underline-offset-4"
      >
        {(['contact', 'feedback', 'sampler'] as const)
          .filter((item) => item !== page)
          .map((item) => (
            <Link key={item} to={localizePath(locale, `/${item}`)}>
              {t(`support.${item}.title`)}
            </Link>
          ))}
      </nav>
      {whatsapp && (
        <a
          className="inline-block underline underline-offset-4"
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('support.whatsapp.link')}
        </a>
      )}
    </div>
  );
}
