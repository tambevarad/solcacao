// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { CatalogApi, Locale } from '../../contracts/index.js';
import { LocaleProvider } from '../../client/src/features/shell/public.js';
import { ProductCard } from '../../client/src/features/catalog/components/ProductCard.js';
import CatalogPage from '../../client/src/features/catalog/pages/CatalogPage.js';
import { CartProvider, useCart } from '../../client/src/features/catalog/public.js';
import catalogEn from '../../client/src/features/catalog/locales/en.json';
import catalogEs from '../../client/src/features/catalog/locales/es.json';
import shellEn from '../../client/src/features/shell/locales/en.json';
import shellEs from '../../client/src/features/shell/locales/es.json';
import { product } from './fixtures.js';
import type { ReactNode } from 'react';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

function mount(children: ReactNode, locale: Locale = 'en') {
  return render(
    <MemoryRouter
      initialEntries={[`/${locale}/catalog`]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <LocaleProvider
        loadDictionary={async (value) =>
          value === 'es' ? { ...shellEs, ...catalogEs } : { ...shellEn, ...catalogEn }
        }
      >
        {children}
      </LocaleProvider>
    </MemoryRouter>,
  );
}

function CartProbe() {
  const cart = useCart();
  return <output data-testid="cart-items">{JSON.stringify(cart.items)}</output>;
}

describe('retail catalog quantity selection', () => {
  it.each(['en', 'es'] as const)(
    'chooses a typed amount and resets after adding in %s',
    async (locale) => {
      const onAdd = vi.fn(async () => {});
      const dictionary = locale === 'es' ? catalogEs : catalogEn;
      mount(<ProductCard product={product} onAdd={onAdd} />, locale);
      const input = await screen.findByRole('spinbutton', {
        name: dictionary['catalog.cart.quantityFor'].replace('{name}', product.name[locale]),
      });
      fireEvent.change(input, { target: { value: '4' } });
      fireEvent.blur(input);
      fireEvent.click(
        screen.getByRole('button', {
          name: dictionary['catalog.product.addNamed'].replace('{name}', product.name[locale]),
        }),
      );
      await waitFor(() => expect(onAdd).toHaveBeenCalledWith(product, 4));
      await waitFor(() => expect(input).toHaveValue(1));
    },
  );

  it('supports minus/plus buttons without exceeding the available quantity', async () => {
    const onAdd = vi.fn(async () => {});
    mount(<ProductCard product={product} onAdd={onAdd} maxQuantity={3} />);
    const input = await screen.findByRole('spinbutton', { name: 'Quantity of Test bar' });
    const decrease = screen.getByRole('button', { name: 'Decrease quantity of Test bar' });
    const increase = screen.getByRole('button', { name: 'Increase quantity of Test bar' });
    expect(decrease).toBeDisabled();
    fireEvent.click(increase);
    expect(input).toHaveValue(2);
    fireEvent.click(increase);
    expect(input).toHaveValue(3);
    expect(increase).toBeDisabled();
    fireEvent.click(decrease);
    expect(input).toHaveValue(2);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it.each(['', '0', '-1', '1.5', '11'])('rejects invalid quantity %j', async (value) => {
    const onAdd = vi.fn(async () => {});
    mount(<ProductCard product={product} onAdd={onAdd} />);
    const input = await screen.findByRole('spinbutton', { name: 'Quantity of Test bar' });
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a quantity from 1 to 10.');
    expect(screen.getByRole('button', { name: 'Add to cart: Test bar' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart: Test bar' }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('preserves the selected amount after an add failure and resets it after a successful retry', async () => {
    let reject: ((reason: Error) => void) | undefined;
    const onAdd = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((_resolve, fail) => {
            reject = fail;
          }),
      )
      .mockResolvedValue(undefined);
    mount(<ProductCard product={product} onAdd={onAdd} />);
    const input = await screen.findByRole('spinbutton', { name: 'Quantity of Test bar' });
    fireEvent.change(input, { target: { value: '3' } });
    const add = screen.getByRole('button', { name: 'Add to cart: Test bar' });
    fireEvent.click(add);
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(add).toHaveAttribute('aria-busy', 'true');
    expect(input).toBeDisabled();
    reject?.(new Error('Offline'));
    await screen.findByText(catalogEn['catalog.cart.saveFailed']);
    expect(input).toHaveValue(3);
    fireEvent.click(add);
    await waitFor(() => expect(input).toHaveValue(1));
    expect(onAdd).toHaveBeenLastCalledWith(product, 3);
  });

  it('passes the selected number to the real guest cart and accounts for items already added', async () => {
    const catalog: CatalogApi = {
      async list() {
        return { items: [product], page: 1, limit: 12, total: 1, totalPages: 1 };
      },
      async get() {
        return product;
      },
      async cart() {
        throw new Error('Unexpected signed-in cart call');
      },
      async persist() {
        throw new Error('Unexpected signed-in cart save');
      },
      async merge() {
        throw new Error('Unexpected signed-in cart merge');
      },
      async checkout() {
        throw new Error('Unexpected checkout');
      },
    };
    mount(
      <CartProvider catalog={catalog} storage={window.localStorage}>
        <CatalogPage catalog={catalog} />
        <CartProbe />
      </CartProvider>,
    );
    const input = await screen.findByRole('spinbutton', { name: 'Quantity of Test bar' });
    const add = screen.getByRole('button', { name: 'Add to cart: Test bar' });
    fireEvent.change(input, { target: { value: '6' } });
    fireEvent.click(add);
    await waitFor(() =>
      expect(screen.getByTestId('cart-items')).toHaveTextContent(
        JSON.stringify([{ productId: product.id, quantity: 6 }]),
      ),
    );
    await waitFor(() => expect(input).toHaveValue(1));
    expect(input).toHaveAttribute('max', '4');
    fireEvent.change(input, { target: { value: '4' } });
    fireEvent.click(add);
    await waitFor(() =>
      expect(screen.getByTestId('cart-items')).toHaveTextContent(
        JSON.stringify([{ productId: product.id, quantity: 10 }]),
      ),
    );
    expect(add).toBeDisabled();
    expect(input).toBeDisabled();
    expect(screen.getByText(catalogEn['catalog.product.maxInCart'])).toBeInTheDocument();
  });

  it('does not offer quantity selection for sold-out products', async () => {
    const onAdd = vi.fn(async () => {});
    mount(<ProductCard product={{ ...product, stock: 0 }} onAdd={onAdd} />);
    expect(
      await screen.findByRole('button', { name: catalogEn['catalog.product.soldOut'] }),
    ).toBeDisabled();
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
