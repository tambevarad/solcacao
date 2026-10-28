import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate, type To } from 'react-router-dom';
import type { Dictionary, Locale } from '../../contracts/index.js';
import { AuthProvider } from '../../client/src/features/auth/public.js';
import { CartDrawer, CartProvider } from '../../client/src/features/catalog/public.js';
import { LocaleProvider } from '../../client/src/features/shell/public.js';
import { Layout } from '../../client/src/features/shell/Layout.js';
import { AppRoutes } from '../../client/src/routes.js';

type Entry = string | { pathname: string; search?: string; hash?: string; state?: unknown };
type Loader = (locale: Locale) => Promise<Dictionary>;

/** Shows the current URL and offers browser-style back navigation for assertions. */
export function LocationProbe({ links = [] }: { links?: { label: string; to: To }[] }) {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div>
      <p data-testid="location">{location.pathname + location.search + location.hash}</p>
      <button type="button" onClick={() => navigate(-1)}>
        Probe back
      </button>
      {links.map((link) => (
        <button key={link.label} type="button" onClick={() => navigate(link.to)}>
          {link.label}
        </button>
      ))}
    </div>
  );
}

/** Same provider order as client/src/main.tsx, with the real route table. */
export function renderApp(entry: Entry, loadDictionary?: Loader) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocaleProvider loadDictionary={loadDictionary}>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
            <CartDrawer />
            <LocationProbe />
          </CartProvider>
        </AuthProvider>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/** The real Layout around test-only pages, for state-retention and error-containment checks. */
export function renderInLayout(
  entry: Entry,
  routes: ReactNode,
  options: { loadDictionary?: Loader; probeLinks?: { label: string; to: To }[] } = {},
) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocaleProvider loadDictionary={options.loadDictionary}>
        <Routes>
          <Route path="/:locale" element={<Layout />}>
            {routes}
          </Route>
        </Routes>
        <LocationProbe links={options.probeLinks} />
      </LocaleProvider>
    </MemoryRouter>,
  );
}
