import { useLocale } from '../public.js';
import { BRAND_NAME } from '../meta.js';
import { footerNavigation } from '../navigation.js';
import { LanguageSwitcher } from './LanguageSwitcher.js';
import { ShellLink } from './ShellLink.js';

/** Global footer. Contains no address, phone or sourcing claims; those must be team-supplied. */
export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="mt-16 border-t border-line bg-white/50">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 sm:grid-cols-2 md:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-lg font-semibold tracking-[0.25em] uppercase">{BRAND_NAME}</p>
          <p className="mt-3 max-w-xs text-cacao/80">{t('shell.footer.tagline')}</p>
          <LanguageSwitcher className="mt-4 -ml-2" />
        </div>
        {footerNavigation.map((group) => (
          <nav key={group.id} aria-labelledby={`footer-${group.id}`}>
            <h2
              id={`footer-${group.id}`}
              className="text-sm font-semibold tracking-wider uppercase"
            >
              {t(group.headingKey)}
            </h2>
            <ul className="mt-3">
              {group.items.map((item) => (
                <li key={item.id}>
                  <ShellLink
                    item={item}
                    className="inline-flex min-h-11 items-center hover:underline aria-[current=page]:font-semibold"
                  />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-6 text-sm text-cacao/80 sm:flex-row sm:justify-between md:px-6 lg:px-8">
          <p>{t('shell.footer.copyright', { year: new Date().getFullYear() })}</p>
          <p>{t('shell.footer.demoNotice')}</p>
        </div>
      </div>
    </footer>
  );
}
