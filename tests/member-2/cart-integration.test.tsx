// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './harness.js';

// Stand-in for Student 3's published useCart() port, so this checks the header against the
// CartState interface rather than the template stub.
const cart = vi.hoisted(() => ({ count: 3, open: false, setOpen: vi.fn() }));
vi.mock('../../client/src/features/catalog/public.js', () => ({
  CartProvider: ({ children }: { children: ReactNode }) => children,
  CartDrawer: () => null,
  useCart: () => ({
    items: [],
    subtotalCents: 0,
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    ...cart,
  }),
}));

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  cart.setOpen.mockReset();
});

it('reads the count from useCart and opens the shared drawer through setOpen', async () => {
  renderApp('/es');
  const button = await screen.findByRole('button', { name: 'Abrir carrito. Artículos: 3' });
  expect(screen.getByTestId('cart-count')).toHaveTextContent('3');
  fireEvent.click(button);
  expect(cart.setOpen).toHaveBeenCalledWith(true);
  // Scoped to the header: feature pages (e.g. the homepage) have their own status regions.
  expect(within(screen.getByRole('banner')).getByRole('status')).toBeEmptyDOMElement();
});
