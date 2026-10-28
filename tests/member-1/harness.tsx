import { render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { AuthApi, HttpClient } from '../../contracts/index.js';
import { AuthProvider } from '../../client/src/features/auth/public.js';
import { createMockAuth } from '../../client/src/features/auth/mock.js';
import { CartDrawer, CartProvider } from '../../client/src/features/catalog/public.js';
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

/** Same provider order as client/src/main.tsx with the real routes, layout and guards. */
export function renderApp(entry: string, auth: AuthApi = fastMockAuth()) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocaleProvider>
        <AuthProvider auth={auth}>
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
