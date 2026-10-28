import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../../client/src/features/auth/public.js';
import { CartDrawer, CartProvider } from '../../client/src/features/catalog/public.js';
import { Layout } from '../../client/src/features/shell/Layout.js';
import { LocaleProvider } from '../../client/src/features/shell/public.js';
import { AppRoutes } from '../../client/src/routes.js';

/** Shows the current URL for assertions. */
export function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}

/** Same provider order as client/src/main.tsx, with the real route table and guards. */
export function renderApp(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocaleProvider>
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

/**
 * One page inside the real shell Layout (header with the EN|ES switch), so language switching
 * keeps the page mounted exactly as it does in the app. `path` undefined means the index route.
 */
export function renderInLayout(entry: string, element: ReactNode, path?: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocaleProvider>
        <Routes>
          <Route path="/:locale" element={<Layout />}>
            {path === undefined ? (
              <Route index element={element} />
            ) : (
              <Route path={path} element={element} />
            )}
          </Route>
        </Routes>
        <LocationProbe />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

/** Minimal synthetic PDF: correct signature, no real corporate content. */
export function pdfFile(name = 'brand.pdf', body = '%PDF-1.4\n% synthetic test file\n') {
  return new File([body], name, { type: 'application/pdf' });
}
