// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogApi } from '../../contracts/index.js';
import { ApiError, createHttpClient } from '../../client/src/api/http.js';
import { CartDrawer, CartProvider } from '../../client/src/features/catalog/public.js';
import {
  GUEST_CART_KEY,
  saveGuestCart,
} from '../../client/src/features/catalog/cart/guestStorage.js';
import { makeCatalogFixtures } from '../../client/src/features/catalog/fixtures.js';
import { createMockCatalog } from '../../client/src/features/catalog/mock.js';
import CatalogPage from '../../client/src/features/catalog/pages/CatalogPage.js';
import CheckoutPage from '../../client/src/features/catalog/pages/CheckoutPage.js';
import OrderConfirmationPage from '../../client/src/features/catalog/pages/OrderConfirmationPage.js';
import ProductPage from '../../client/src/features/catalog/pages/ProductPage.js';
import { Layout } from '../../client/src/features/shell/Layout.js';
import { LocaleProvider } from '../../client/src/features/shell/public.js';
import { createAuthDouble, type AuthDouble } from './auth-double.js';
import { memoryStorage } from './storage-double.js';

const auth = vi.hoisted(() => ({ current: null as null | AuthDouble }));
vi.mock('../../client/src/features/auth/public.js', async () => {
  const { useSyncExternalStore } = await import('react');
  return {
    AuthProvider: ({ children }: { children: ReactNode }) => children,
    RequireAuth: ({ children }: { children: ReactNode }) => children,
    RequireRole: ({ children }: { children: ReactNode }) => children,
    useAuth: () => {
      const double = auth.current!;
      const user = useSyncExternalStore(double.subscribe, double.get);
      return { user, ready: true, login: vi.fn(), register: vi.fn(), logout: double.signOut };
    },
  };
});

const products = makeCatalogFixtures();
const bySlug = (slug: string) => products.find((p) => p.slug === slug)!;
let storage: Storage;
let catalog: CatalogApi;

function Probe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div>
      <p data-testid="location">{location.pathname + location.search}</p>
      <button type="button" onClick={() => navigate(-1)}>
        Probe back
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Probe forward
      </button>
    </div>
  );
}

/** Real shell Layout, LocaleProvider and catalog routes, with an injected catalog adapter. */
function renderShop(
  entry: string | { pathname: string; state?: unknown },
  api: CatalogApi = catalog,
) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocaleProvider>
        <CartProvider catalog={api} storage={storage}>
          <Routes>
            <Route path="/:locale" element={<Layout />}>
              <Route path="catalog" element={<CatalogPage catalog={api} />} />
              <Route path="products/:slug" element={<ProductPage catalog={api} />} />
              <Route path="checkout" element={<CheckoutPage catalog={api} />} />
              <Route path="order-confirmation" element={<OrderConfirmationPage />} />
            </Route>
          </Routes>
          <CartDrawer />
          <Probe />
        </CartProvider>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

const location = () => screen.getByTestId('location').textContent;
const productLinks = () =>
  within(screen.getByRole('region', { name: /Results|Resultados/ }))
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent)
    .filter((name) => name !== 'Results' && name !== 'Resultados');

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  auth.current = createAuthDouble();
  storage = memoryStorage();
  catalog = createMockCatalog(
    createHttpClient(() => null),
    { token: auth.current.token, delayMs: 0 },
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CatalogPage', () => {
  it('applies combined filters from the URL and shows their intersection', async () => {
    renderShop(
      '/en/catalog?search=dark&origin=Peru&cacaoMin=65&cacaoMax=90&priceMinCents=900&priceMaxCents=2300',
    );
    expect(await screen.findByText('2 chocolates')).toBeInTheDocument();
    expect(productLinks()).toEqual(['Peru 85% Dark Bar', 'Walnut Dark Truffles']);
    const filters = within(screen.getByRole('complementary', { name: 'Filters' }));
    expect(filters.getByLabelText('Search by name or description')).toHaveValue('dark');
    expect(filters.getByLabelText('Origin')).toHaveValue('Peru');
    expect(filters.getByLabelText('Minimum %')).toHaveValue(65);
    expect(filters.getByLabelText('Maximum cacao percentage slider')).toHaveValue('90');
    expect(filters.getByLabelText('Maximum $')).toHaveValue(23);
  });

  it('keeps filters in the URL, resets the page on change and restores state on back/forward', async () => {
    renderShop('/en/catalog?page=2');
    await screen.findByText('14 chocolates');
    const filters = within(screen.getByRole('complementary', { name: 'Filters' }));
    fireEvent.change(filters.getByLabelText('Collection'), { target: { value: 'truffle' } });
    await waitFor(() => expect(location()).toBe('/en/catalog?category=truffle'));
    expect(await screen.findByText('5 chocolates')).toBeInTheDocument();

    fireEvent.change(filters.getByLabelText('Minimum %'), { target: { value: '60' } });
    fireEvent.change(filters.getByLabelText('Maximum $'), { target: { value: '22' } });
    fireEvent.click(filters.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() =>
      expect(location()).toBe('/en/catalog?category=truffle&cacaoMin=60&priceMaxCents=2200'),
    );
    expect(await screen.findByText('2 chocolates')).toBeInTheDocument();
    expect(productLinks()).toEqual(['Chocolate Sprinkle Truffles', 'Walnut Dark Truffles']);

    fireEvent.click(screen.getByRole('button', { name: 'Probe back' }));
    await waitFor(() => expect(location()).toBe('/en/catalog?category=truffle'));
    expect(await screen.findByText('5 chocolates')).toBeInTheDocument();
    expect(filters.getByLabelText('Minimum %')).toHaveValue(0);
    fireEvent.click(screen.getByRole('button', { name: 'Probe forward' }));
    expect(await screen.findByText('2 chocolates')).toBeInTheDocument();
    expect(filters.getByLabelText('Minimum %')).toHaveValue(60);

    fireEvent.click(filters.getByRole('button', { name: 'Clear all filters' }));
    await waitFor(() => expect(location()).toBe('/en/catalog'));
  });

  it('rejects a reversed range in the form without touching the URL', async () => {
    renderShop('/en/catalog');
    await screen.findByText('14 chocolates');
    const filters = within(screen.getByRole('complementary', { name: 'Filters' }));
    fireEvent.change(filters.getByLabelText('Minimum %'), { target: { value: '90' } });
    fireEvent.change(filters.getByLabelText('Maximum %'), { target: { value: '40' } });
    fireEvent.click(filters.getByRole('button', { name: 'Apply filters' }));
    expect(
      filters.getByText('The minimum cacao percentage must not be higher than the maximum.'),
    ).toBeInTheDocument();
    expect(location()).toBe('/en/catalog');
  });

  it('paginates with real links and sorts by price', async () => {
    renderShop('/en/catalog?sort=priceAsc');
    await screen.findByText('14 chocolates');
    expect(productLinks()[0]).toBe('Ghana 45% Milk Bar');
    fireEvent.click(screen.getByRole('link', { name: 'Next' }));
    await waitFor(() => expect(location()).toBe('/en/catalog?sort=priceAsc&page=2'));
    await waitFor(() =>
      expect(productLinks()).toEqual(['Assorted Praline Collection', 'Heart Gift Box']),
    );
  });

  it('distinguishes the empty state from the error state, and keeps filters while retrying', async () => {
    renderShop('/en/catalog?origin=Vietnam&category=truffle');
    expect(
      await screen.findByRole('heading', { name: 'No chocolates match these filters' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    cleanup();

    const flaky: CatalogApi = {
      ...catalog,
      list: vi
        .fn<CatalogApi['list']>()
        .mockRejectedValueOnce(new ApiError(503, 'SERVICE_UNAVAILABLE', 'down'))
        .mockImplementation((query) => catalog.list(query)),
    };
    renderShop('/en/catalog?origin=Peru', flaky);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Chocolates could not be loaded');
    expect(
      within(screen.getByRole('complementary', { name: 'Filters' })).getByLabelText('Origin'),
    ).toHaveValue('Peru');
    fireEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('3 chocolates')).toBeInTheDocument();
  });

  it('renders localized names, origins and USD prices in Spanish', async () => {
    renderShop('/es/catalog?search=Perú');
    expect(await screen.findByRole('link', { name: 'Tableta oscura Perú 85 %' })).toHaveAttribute(
      'href',
      '/es/products/peru-85-dark-bar',
    );
    expect(screen.getAllByText('Perú · 85 % de cacao').length).toBeGreaterThan(0);
    expect(screen.getByText(/9,99\sUS\$/)).toBeInTheDocument();
  });

  it('puts the filters in a drawer on small screens', async () => {
    renderShop('/en/catalog');
    await screen.findByText('14 chocolates');
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const drawer = await screen.findByRole('dialog', { name: 'Filters' });
    fireEvent.change(within(drawer).getByLabelText('Origin'), { target: { value: 'Ghana' } });
    await waitFor(() => expect(location()).toBe('/en/catalog?origin=Ghana'));
    fireEvent.click(within(drawer).getByRole('button', { name: 'Apply filters' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filters' })).toBeNull());
  });
});

describe('ProductPage', () => {
  it('shows the product by canonical slug with gallery, accordions and a page title', async () => {
    renderShop('/en/products/hazelnut-praline-box');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hazelnut Praline Box' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Hazelnut Praline Box · SolCacao'));
    expect(screen.getByRole('img', { name: /hazelnut center/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show image 2 of 2' }));
    expect(screen.getByRole('button', { name: 'Show image 2 of 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('img', { name: /hazelnut center/ })).toBeNull();
    expect(screen.getByRole('img', { name: /Pile of hazelnut pralines/ })).toBeInTheDocument();
    for (const name of ['Ingredients', 'Allergens', 'Care and storage'])
      expect(screen.getByText(name).closest('summary')).toBeInTheDocument();
  });

  it('keeps the slug when switching language and shows translated text', async () => {
    renderShop('/en/products/peru-85-dark-bar');
    await screen.findByRole('heading', { level: 1, name: 'Peru 85% Dark Bar' });
    fireEvent.click(
      within(screen.getByRole('banner')).getAllByRole('link', { name: /Español/ })[0],
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tableta oscura Perú 85 %' }),
    ).toBeInTheDocument();
    expect(location()).toBe('/es/products/peru-85-dark-bar');
  });

  it('shows not found for inactive and unknown slugs, and an error state for failures', async () => {
    renderShop('/en/products/foil-heart-duo');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Product not found' }),
    ).toBeInTheDocument();
    cleanup();
    renderShop('/en/products/peru-85-dark-bar', {
      ...catalog,
      get: () => Promise.reject(new ApiError(503, 'SERVICE_UNAVAILABLE', 'down')),
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('This product could not be loaded');
  });

  it('disables purchase for a sold-out product', async () => {
    renderShop('/en/products/vietnam-78-coffee-bar');
    await screen.findByRole('heading', { level: 1, name: 'Vietnam 78% Coffee Bar' });
    expect(screen.getAllByText('Sold out').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Add to cart' })).toBeNull();
  });

  it('adds a validated quantity, limited by stock already in the cart', async () => {
    renderShop('/en/products/spring-chocolate-eggs');
    await screen.findByRole('heading', { level: 1, name: 'Spring Chocolate Eggs' });
    const quantity = screen.getByLabelText('Quantity');
    fireEvent.change(quantity, { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(await screen.findByText('Choose a quantity from 1 to 3.')).toBeInTheDocument();
    fireEvent.change(quantity, { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(
      await screen.findByText('Spring Chocolate Eggs was added to your cart.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    expect(screen.getByText('2 already in your cart')).toBeInTheDocument();
  });
});

describe('CartDrawer', () => {
  it('adds twice, updates, removes; traps focus, closes on Escape and restores focus', async () => {
    renderShop('/en/catalog');
    await screen.findByText('14 chocolates');
    const add = screen.getByRole('button', { name: 'Add to cart: Peru 85% Dark Bar' });
    fireEvent.click(add);
    fireEvent.click(add);
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('2'));

    const opener = screen.getByRole('button', { name: 'Open cart. Items: 2' });
    opener.focus();
    fireEvent.click(opener);
    const drawer = await screen.findByRole('dialog', { name: 'Your cart' });
    expect(drawer.contains(document.activeElement)).toBe(true);
    expect(within(drawer).getByLabelText('Quantity of Peru 85% Dark Bar')).toHaveValue(2);
    expect(within(drawer).getByTestId('cart-subtotal')).toHaveTextContent('$19.98');

    fireEvent.click(
      within(drawer).getByRole('button', { name: 'Increase quantity of Peru 85% Dark Bar' }),
    );
    await waitFor(() =>
      expect(within(drawer).getByTestId('cart-subtotal')).toHaveTextContent('$29.97'),
    );
    const input = within(drawer).getByLabelText('Quantity of Peru 85% Dark Bar');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('5'));

    fireEvent.click(within(drawer).getByRole('button', { name: 'Remove Peru 85% Dark Bar' }));
    expect(
      await within(drawer).findByRole('heading', { name: 'Your cart is empty' }),
    ).toBeInTheDocument();
    expect(storage.getItem(GUEST_CART_KEY)).toBeNull();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Your cart' })).toBeNull());
    expect(opener).toHaveFocus();
  });

  it('keeps the cart across a language switch', async () => {
    saveGuestCart(storage, [{ productId: bySlug('peru-85-dark-bar').id, quantity: 2 }]);
    renderShop('/en/catalog');
    await screen.findByText('14 chocolates');
    fireEvent.click(
      within(screen.getByRole('banner')).getAllByRole('link', { name: /Español/ })[0],
    );
    await screen.findByText('14 chocolates');
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir carrito. Artículos: 2' }));
    const drawer = await screen.findByRole('dialog', { name: 'Tu carrito' });
    expect(within(drawer).getByTestId('cart-subtotal')).toHaveTextContent(/19,98\sUS\$/);
    expect(within(drawer).getByRole('link', { name: 'Tableta oscura Perú 85 %' })).toHaveAttribute(
      'href',
      '/es/products/peru-85-dark-bar',
    );
  });
});

describe('Checkout and confirmation', () => {
  const fill = (values: Record<string, string>) => {
    for (const [label, value] of Object.entries(values))
      fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value } });
  };
  const validAddress = {
    Email: 'shopper@example.test',
    'Full name': 'Test Shopper',
    'Address line 1': '1 Example Street',
    City: 'Testville',
    'State, province or region': 'TX',
    'Postal code': '75001',
  };

  it('shows an empty state instead of a form when the cart is empty', async () => {
    renderShop('/en/checkout');
    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
  });

  it('validates fields with a focusable error summary and keeps valid entries', async () => {
    saveGuestCart(storage, [{ productId: bySlug('peru-85-dark-bar').id, quantity: 2 }]);
    renderShop('/en/checkout');
    await screen.findByText('Demo order — no payment collected');
    fill({ Email: 'not-an-email', City: 'Testville' });
    fireEvent.click(screen.getByRole('button', { name: 'Place demo order' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveTextContent('Please correct');
    expect(
      within(summary).getByRole('link', { name: /Email: Enter a valid email/ }),
    ).toHaveAttribute('href', '#checkout-email');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/^City/)).toHaveValue('Testville');
    expect(screen.getByLabelText(/^City/)).not.toHaveAttribute('aria-invalid');
  });

  it('submits once on a rapid double click and shows the receipt from route state', async () => {
    saveGuestCart(storage, [{ productId: bySlug('peru-85-dark-bar').id, quantity: 2 }]);
    const checkout = vi.spyOn(catalog, 'checkout');
    renderShop('/en/checkout');
    await screen.findByText('Demo order — no payment collected');
    await waitFor(() => expect(screen.getByText('2 × Peru 85% Dark Bar')).toBeInTheDocument());
    fill(validAddress);
    const place = screen.getByRole('button', { name: 'Place demo order' });
    act(() => {
      fireEvent.click(place);
      fireEvent.click(place);
    });
    expect(
      await screen.findByRole('heading', { name: 'Thank you — demo order received' }),
    ).toBeInTheDocument();
    expect(checkout).toHaveBeenCalledTimes(1);
    expect(checkout.mock.calls[0][0]).toMatchObject({
      items: [{ productId: bySlug('peru-85-dark-bar').id, quantity: 2 }],
      email: 'shopper@example.test',
      address: { country: 'US', postalCode: '75001' },
    });
    expect(screen.getByText('$19.98')).toBeInTheDocument();
    expect(screen.getByText('Demo order — no payment collected')).toBeInTheDocument();
    expect(location()).toBe('/en/order-confirmation');
    await waitFor(() => expect(screen.queryByTestId('cart-count')).toBeNull());
  });

  it('reuses the requestId for a retry of the same request after a failure', async () => {
    saveGuestCart(storage, [{ productId: bySlug('peru-85-dark-bar').id, quantity: 1 }]);
    const checkout = vi
      .fn<CatalogApi['checkout']>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockImplementation((input) => catalog.checkout(input));
    renderShop('/en/checkout', { ...catalog, checkout });
    await screen.findByText('Demo order — no payment collected');
    fill(validAddress);
    fireEvent.click(screen.getByRole('button', { name: 'Place demo order' }));
    expect(await screen.findByText(/The order could not be placed/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Place demo order' }));
    await screen.findByRole('heading', { name: 'Thank you — demo order received' });
    expect(checkout.mock.calls[1][0].requestId).toBe(checkout.mock.calls[0][0].requestId);
  });

  it('reports out-of-stock lines returned by the server', async () => {
    const eggs = bySlug('spring-chocolate-eggs').id;
    saveGuestCart(storage, [{ productId: eggs, quantity: 3 }]);
    const checkout = vi.fn<CatalogApi['checkout']>().mockRejectedValue(
      new ApiError(409, 'OUT_OF_STOCK', 'Some items are not available', {
        'items.0.quantity': 'Only 1 available',
      }),
    );
    renderShop('/es/checkout', { ...catalog, checkout });
    await screen.findByText('Pedido de demostración — no se cobra ningún pago');
    fill({
      'Correo electrónico': 'a@example.test',
      'Nombre completo': 'Prueba',
      'Dirección, línea 1': 'Calle 1',
      Ciudad: 'Madrid',
      'Estado, provincia o región': 'MD',
      'Código postal': '28001',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Realizar pedido de demostración' }));
    expect(
      await screen.findByText(/no están disponibles en la cantidad pedida/),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No está disponible en esta cantidad. Actualiza tu carrito.'),
    ).toBeInTheDocument();
  });

  it('shows a safe link instead of an invented order when opened without route state', async () => {
    renderShop('/en/order-confirmation');
    expect(await screen.findByRole('heading', { name: 'No order to show' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute(
      'href',
      '/en/catalog',
    );
    cleanup();
    renderShop({
      pathname: '/en/order-confirmation',
      state: { receipt: { id: 'forged', totalCents: -1 } },
    });
    expect(await screen.findByRole('heading', { name: 'No order to show' })).toBeInTheDocument();
  });
});
