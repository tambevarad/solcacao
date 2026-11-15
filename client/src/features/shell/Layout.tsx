import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { useLocale } from './public.js';
import { isLocale, stripLocale } from './locale.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { PageFrame } from './PageFrame.js';
import NotFoundPage from './pages/NotFoundPage.js';

/** Shared shell for every /:locale route. Unsupported prefixes render not-found, never a page. */
export function Layout() {
  const { locale: prefix } = useParams();
  const { t } = useLocale();
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const page = stripLocale(location.pathname);
  const previousPage = useRef(page);

  // On a real page change (not a language switch or query update) start at the top and move focus
  // to the main region so keyboard and screen-reader users land on the new content.
  useEffect(() => {
    if (previousPage.current === page) return;
    previousPage.current = page;
    window.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [page]);

  // <main> is at least one screen tall, so the footer starts below the fold. Pages load on demand,
  // and a footer painted beside the short loading state was pushed down when the page arrived
  // (Lighthouse CLS 0.4–0.7 on the deployed site).
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-cacao px-4 py-3 text-ivory focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t('shell.skipToContent')}
      </a>
      <Header />
      <main
        id="main"
        ref={main}
        tabIndex={-1}
        className="mx-auto min-h-svh w-full max-w-[1200px] flex-1 px-4 py-8 focus-visible:outline-none md:px-6 lg:px-8"
      >
        {isLocale(prefix) ? (
          <Outlet />
        ) : (
          <PageFrame meta="notFound">
            <NotFoundPage />
          </PageFrame>
        )}
      </main>
      <Footer />
    </div>
  );
}
