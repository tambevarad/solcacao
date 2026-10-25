import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLocale } from '../public.js';
import { LOCALE_NAMES, SUPPORTED_LOCALES, switchLocalePath } from '../locale.js';

/**
 * EN | ES links. Real links (not buttons) so each language version is crawlable. Only the prefix
 * changes; query, hash and history state (e.g. an order receipt) are carried over, and because the
 * same route stays matched, mounted page state survives the switch.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, locale } = useLocale();
  const location = useLocation();
  return (
    <div
      role="group"
      aria-label={t('shell.language.label')}
      className={`flex items-center${className ? ` ${className}` : ''}`}
    >
      {SUPPORTED_LOCALES.map((option, index) => (
        <Fragment key={option}>
          {index > 0 && (
            <span aria-hidden="true" className="text-cacao/40">
              |
            </span>
          )}
          <Link
            to={{
              pathname: switchLocalePath(location.pathname, option),
              search: location.search,
              hash: location.hash,
            }}
            state={location.state}
            hrefLang={option}
            lang={option}
            aria-current={option === locale ? 'true' : undefined}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded px-2 text-sm font-semibold hover:bg-line/60 aria-[current=true]:text-copper aria-[current=true]:underline aria-[current=true]:underline-offset-4"
          >
            {/* Accessible name starts with the visible code (WCAG 2.5.3), e.g. "ES (Español)". */}
            {option.toUpperCase()} <span className="sr-only">({LOCALE_NAMES[option]})</span>
          </Link>
        </Fragment>
      ))}
    </div>
  );
}
