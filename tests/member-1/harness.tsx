import { render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { AuthApi, HttpClient } from '../../contracts/index.js';
import { AuthProvider } from '../../client/src/features/auth/public.js';
import { createMockAuth } from '../../client/src/features/auth/mock.js';
import { CartDrawer, CartProvider } from '../../client/src/features/catalog/public.js';
import { createMockCatalog } from '../../client/src/features/catalog/mock.js';
import { LocaleProvider } from '../../client/src/features/shell/public.js';
import { AppRoutes } from '../../client/src/routes.js';

export const unusedHttp: HttpClient = {
  request: async () => {
    throw new Error('mock adapter must not use HTTP');
  },
  requestRaw: async () => {
    throw new Error('mock adapter must not use HTTP');
  },
};

/** The shared auth mock registry without simulated latency. */
export const fastMockAuth = (): AuthApi => createMockAuth(unusedHttp, { delayMs: 0 });

export function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}

/**
 * Same provider order as client/src/main.tsx with the real routes, layout and guards. The cart gets
 * the catalog mock without its 250 ms demo latency: with it, the cart's sign-in load and merge
 * could still be pending when a test file's jsdom is torn down ("window is not defined" in CI).
 */
export function renderApp(entry: string, auth: AuthApi = fastMockAuth()) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocaleProvider>
        <AuthProvider auth={auth}>
          <CartProvider catalog={createMockCatalog(unusedHttp, { delayMs: 0 })}>
            <AppRoutes />
            <CartDrawer />
            <LocationProbe />
          </CartProvider>
        </AuthProvider>
      </LocaleProvider>
    </MemoryRouter>,
  );
}
