import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Dictionary, Locale } from '../../../../contracts/index.js';
import { api } from '../../api/index.js';
import { buttonStyles } from '../../shared/Button.js';
import {
  DEFAULT_LOCALE,
  interpolate,
  localeFromPath,
  switchLocalePath,
  type TranslationValues,
} from './locale.js';

// Public shell port (docs/contracts.md "Shell public surface"). Other features import only these.
export { SUPPORTED_LOCALES, isLocale, localizePath, type TranslationValues } from './locale.js';
export { usePageMeta, type PageMeta } from './meta.js';

export interface LocaleState {
  /** Locale from the URL prefix; the default locale while an unsupported prefix shows not-found. */
  locale: Locale;
  /** Swaps only the URL prefix. Path, query, hash, history state and mounted components are kept. */
  setLocale(value: Locale): void;
  /** Looks up a flat namespaced key and replaces {name} tokens from `values`. */
  t(key: string, values?: TranslationValues): string;
}

const Context = createContext<LocaleState>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {
    throw new Error('useLocale must be used inside LocaleProvider');
  },
  t: (key, values) => interpolate(key, values),
});

const reportedMissing = new Set<string>();

/** Development builds show missing keys loudly; production falls back to the raw key. */
function missingKey(locale: Locale, key: string) {
  if (!import.meta.env.DEV) return key;
  const id = `${locale}:${key}`;
  if (!reportedMissing.has(id)) {
    reportedMissing.add(id);
    console.warn(`[i18n] Missing "${key}" in ${locale} dictionary`);
  }
  return `⟦${key}⟧`;
}

type Loader = (locale: Locale) => Promise<Dictionary>;
const loadFromApi: Loader = (locale) => api.shell.dictionary(locale);

export function LocaleProvider({
  children,
  loadDictionary = loadFromApi,
}: {
  children: ReactNode;
  /** Test seam. The app always uses api.shell.dictionary (mock or HTTP per VITE_API_MODE). */
  loadDictionary?: Loader;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeLocale = localeFromPath(location.pathname);
  const locale = routeLocale ?? DEFAULT_LOCALE;

  const [loaded, setLoaded] = useState<Partial<Record<Locale, Dictionary>>>({});
  const [failedLocale, setFailedLocale] = useState<Locale | null>(null);
  const [attempt, setAttempt] = useState(0);
  const loaderRef = useRef(loadDictionary);
  loaderRef.current = loadDictionary;

  const hasCurrent = Boolean(loaded[locale]);
  useEffect(() => {
    if (hasCurrent) return;
    let active = true;
    setFailedLocale(null);
    loaderRef.current(locale).then(
      (dictionary) => {
        if (active) setLoaded((previous) => ({ ...previous, [locale]: dictionary }));
      },
      (error: unknown) => {
        if (!active) return;
        console.error(`[i18n] Could not load ${locale} dictionary`, error);
        setFailedLocale(locale);
      },
    );
    return () => {
      active = false;
    };
  }, [locale, hasCurrent, attempt]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // While a newly selected locale loads (or after it failed), keep the previous text on screen so
  // nothing unmounts and no form, cart or wizard state is lost.
  const dictionary = loaded[locale] ?? loaded.en ?? loaded.es ?? null;

  const t = useCallback(
    (key: string, values?: TranslationValues) => {
      const value = dictionary?.[key];
      return value === undefined ? missingKey(locale, key) : interpolate(value, values);
    },
    [dictionary, locale],
  );

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === routeLocale) return;
      navigate(
        {
          pathname: switchLocalePath(location.pathname, next),
          search: location.search,
          hash: location.hash,
        },
        { state: location.state },
      );
    },
    [navigate, location, routeLocale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  const retry = () => setAttempt((count) => count + 1);

  if (!dictionary) return <LocaleBootScreen failed={failedLocale === locale} onRetry={retry} />;
  return (
    <Context.Provider value={value}>
      {children}
      {failedLocale === locale && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md flex-wrap items-center justify-between gap-3 rounded border border-error bg-ivory p-4 shadow-lg"
        >
          <p>{t('shell.locale.loadError')}</p>
          <button type="button" onClick={retry} className={buttonStyles({ variant: 'secondary' })}>
            {t('shell.action.retry')}
          </button>
        </div>
      )}
    </Context.Provider>
  );
}

/**
 * Shown only before the first dictionary arrives, so its text cannot come from a dictionary. It is
 * the one deliberate bilingual hardcoded string in the client.
 */
function LocaleBootScreen({ failed, onRetry }: { failed: boolean; onRetry(): void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      {failed ? (
        <div role="alert" className="space-y-4">
          <p>
            <span lang="en">We could not load the site text.</span>
            <br />
            <span lang="es">No pudimos cargar los textos del sitio.</span>
          </p>
          <button type="button" onClick={onRetry} className={buttonStyles()}>
            <span lang="en">Try again</span>&nbsp;/&nbsp;<span lang="es">Reintentar</span>
          </button>
        </div>
      ) : (
        <p role="status" className="shell-delayed-fade-in text-cacao/80">
          <span lang="en">Loading…</span> / <span lang="es">Cargando…</span>
        </p>
      )}
    </div>
  );
}

export function useLocale() {
  return useContext(Context);
}
