// @vitest-environment jsdom
import { StrictMode, type ReactNode } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cart, CatalogApi } from '../../contracts/index.js';
import { ApiError, createHttpClient } from '../../client/src/api/http.js';
import {
  CartProvider,
  useCartDetails,
} from '../../client/src/features/catalog/cart/CartProvider.js';
import {
  GUEST_CART_KEY,
  saveGuestCart,
} from '../../client/src/features/catalog/cart/guestStorage.js';
import { makeCatalogFixtures } from '../../client/src/features/catalog/fixtures.js';
import { createMockCatalog } from '../../client/src/features/catalog/mock.js';
import { createAuthDouble } from './auth-double.js';
import { memoryStorage } from './storage-double.js';

const auth = vi.hoisted(() => ({ current: null as null | import('./auth-double.js').AuthDouble }));
vi.mock('../../client/src/features/auth/public.js', async () => {
  const { useSyncExternalStore } = await import('react');
  return {
    AuthProvider: ({ children }: { children: ReactNode }) => children,
    useAuth: () => {
      const double = auth.current!;
      const user = useSyncExternalStore(double.subscribe, double.get);
      return { user, ready: true, login: vi.fn(), register: vi.fn(), logout: double.signOut };
    },
  };
});

const products = makeCatalogFixtures();
const id = (slug: string) => products.find((p) => p.slug === slug)!.id;
const BAR = id('ecuador-72-dark-bar'); // $8.99, 24 in stock
const EGGS = id('spring-chocolate-eggs'); // $12.00, 3 in stock
const USER_A = '0000000000000000000000a1';

let storage: Storage;
let catalog: CatalogApi;

function setup({ strict = false, api = catalog }: { strict?: boolean; api?: CatalogApi } = {}) {
  const wrapper = ({ children }: { children: ReactNode }) => {
    const provider = (
      <CartProvider catalog={api} storage={storage}>
        {children}
      </CartProvider>
    );
    return strict ? <StrictMode>{provider}</StrictMode> : provider;
  };
  return renderHook(() => useCartDetails(), { wrapper });
}

/** A second "device" for the same user, sharing the mock's server-side state. */
async function serverCart(): Promise<Cart> {
  return catalog.cart();
}

beforeEach(() => {
  auth.current = createAuthDouble();
  storage = memoryStorage();
  catalog = createMockCatalog(
    createHttpClient(() => null),
    {
      token: auth.current.token,
      delayMs: 0,
    },
  );
});
afterEach(() => cleanup());

describe('guest cart', () => {
  it('adds twice, updates, removes, and computes count and subtotal', async () => {
    const { result } = setup();
    await act(() => result.current.add(BAR));
    await act(() => result.current.add(BAR));
    await act(() => result.current.add(EGGS, 2));
    expect(result.current.items).toEqual([
      { productId: BAR, quantity: 2 },
      { productId: EGGS, quantity: 2 },
    ]);
    expect(result.current.count).toBe(4);
    await waitFor(() => expect(result.current.subtotalCents).toBe(2 * 899 + 2 * 1200));
    await act(() => result.current.update(BAR, 5));
    expect(result.current.items[0].quantity).toBe(5);
    await act(() => result.current.remove(EGGS));
    expect(result.current.items).toEqual([{ productId: BAR, quantity: 5 }]);
    await act(() => result.current.update(BAR, 0));
    expect(result.current.items).toEqual([]);
    expect(storage.getItem(GUEST_CART_KEY)).toBeNull();
  });

  it('survives a reload through localStorage and rotates mergeId on each edit', async () => {
    const first = setup();
    await act(() => first.result.current.add(BAR, 3));
    const stored = JSON.parse(storage.getItem(GUEST_CART_KEY)!);
    await act(() => first.result.current.add(BAR));
    expect(JSON.parse(storage.getItem(GUEST_CART_KEY)!).mergeId).not.toBe(stored.mergeId);
    first.unmount();
    const reloaded = setup();
    expect(reloaded.result.current.items).toEqual([{ productId: BAR, quantity: 4 }]);
    await waitFor(() =>
      expect(reloaded.result.current.lookup(BAR)?.slug).toBe('ecuador-72-dark-bar'),
    );
  });

  it('starts empty and safe when storage is corrupt', () => {
    storage.setItem(GUEST_CART_KEY, '{"items":"nope"');
    expect(setup().result.current.items).toEqual([]);
  });

  it('caps quantities at stock and reports it', async () => {
    const { result } = setup();
    act(() => result.current.remember(products));
    await act(() => result.current.add(EGGS, 10));
    expect(result.current.items).toEqual([{ productId: EGGS, quantity: 3 }]);
    expect(result.current.notice).toEqual({ kind: 'limited', productId: EGGS, max: 3 });
  });

  it('marks lines for missing or inactive products as unavailable', async () => {
    saveGuestCart(storage, [{ productId: id('foil-heart-duo'), quantity: 1 }]);
    const { result } = setup();
    await waitFor(() => expect(result.current.lookup(id('foil-heart-duo'))).toBeNull());
    expect(result.current.subtotalCents).toBe(0);
  });
});

describe('sign-in merge', () => {
  it('merges the guest cart into the saved cart exactly once, then clears guest storage', async () => {
    auth.current!.signIn(USER_A);
    await catalog.persist({
      items: [
        { productId: BAR, quantity: 1 },
        { productId: EGGS, quantity: 2 },
      ],
      expectedRevision: 0,
    });
    auth.current!.signOut();
    const guest = saveGuestCart(storage, [
      { productId: BAR, quantity: 2 },
      { productId: EGGS, quantity: 2 },
    ]);
    const merge = vi.spyOn(catalog, 'merge');
    const { result } = setup({ strict: true });
    expect(result.current.mode).toBe('guest');

    act(() => auth.current!.signIn(USER_A));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await waitFor(() =>
      expect(result.current.items).toEqual([
        { productId: BAR, quantity: 3 },
        { productId: EGGS, quantity: 3 },
      ]),
    );
    expect(merge).toHaveBeenCalledTimes(1);
    expect(merge).toHaveBeenCalledWith({ items: guest.items, mergeId: guest.mergeId });
    expect(storage.getItem(GUEST_CART_KEY)).toBeNull();
    expect(result.current.notice).toEqual({
      kind: 'merged',
      adjustments: [{ productId: EGGS, requested: 4, actual: 3 }],
    });

    // A repeated merge with the same mergeId (lost response) adds nothing.
    await catalog.merge({ items: guest.items, mergeId: guest.mergeId });
    expect((await serverCart()).items).toEqual(result.current.items);
  });

  it('keeps the guest cart and offers a retry when the merge fails', async () => {
    saveGuestCart(storage, [{ productId: BAR, quantity: 2 }]);
    const failing: CatalogApi = {
      ...catalog,
      merge: vi
        .fn<CatalogApi['merge']>()
        .mockRejectedValueOnce(new ApiError(503, 'SERVICE_UNAVAILABLE', 'down'))
        .mockImplementation((input) => catalog.merge(input)),
    };
    const { result } = setup({ api: failing });
    act(() => auth.current!.signIn(USER_A));
    await waitFor(() => expect(result.current.notice).toEqual({ kind: 'mergeFailed' }));
    expect(JSON.parse(storage.getItem(GUEST_CART_KEY)!).items).toEqual([
      { productId: BAR, quantity: 2 },
    ]);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.items).toEqual([{ productId: BAR, quantity: 2 }]));
    expect(storage.getItem(GUEST_CART_KEY)).toBeNull();
  });

  it('ignores a delayed response that arrives after sign-out', async () => {
    let release!: (cart: Cart) => void;
    const slow: CatalogApi = {
      ...catalog,
      cart: () => new Promise<Cart>((resolve) => (release = resolve)),
    };
    const { result } = setup({ api: slow });
    act(() => auth.current!.signIn(USER_A));
    await waitFor(() => expect(result.current.status).toBe('loading'));
    act(() => auth.current!.signOut());
    await act(async () => release({ items: [{ productId: BAR, quantity: 7 }], revision: 3 }));
    expect(result.current.mode).toBe('guest');
    expect(result.current.items).toEqual([]);
    expect(result.current.status).toBe('ready');
  });

  it('clears the signed-in cart on sign-out without copying it into guest storage', async () => {
    const { result } = setup();
    act(() => auth.current!.signIn(USER_A));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(() => result.current.add(BAR, 2));
    expect((await serverCart()).items).toEqual([{ productId: BAR, quantity: 2 }]);
    act(() => auth.current!.signOut());
    expect(result.current.items).toEqual([]);
    expect(storage.getItem(GUEST_CART_KEY)).toBeNull();
    // The saved cart returns after the next sign-in.
    act(() => auth.current!.signIn(USER_A));
    await waitFor(() => expect(result.current.items).toEqual([{ productId: BAR, quantity: 2 }]));
  });

  it('switching accounts never shows the previous account cart', async () => {
    const { result } = setup();
    act(() => auth.current!.signIn(USER_A));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(() => result.current.add(BAR, 2));
    act(() => auth.current!.signIn('0000000000000000000000b2'));
    expect(result.current.items).toEqual([]);
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items).toEqual([]);
  });
});

describe('signed-in saves', () => {
  it('serializes rapid edits: one request at a time, newest state wins, no conflict', async () => {
    const persist = vi.spyOn(catalog, 'persist');
    const { result } = setup();
    act(() => auth.current!.signIn(USER_A));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(() =>
      Promise.all([result.current.add(BAR), result.current.add(BAR), result.current.add(BAR)]),
    );
    expect(result.current.items).toEqual([{ productId: BAR, quantity: 3 }]);
    expect(result.current.notice).toBeNull();
    expect(await serverCart()).toEqual({
      items: [{ productId: BAR, quantity: 3 }],
      revision: persist.mock.calls.length,
    });
    const revisions = persist.mock.calls.map(([input]) => input.expectedRevision);
    expect(revisions).toEqual(revisions.map((_, index) => index));
  });

  it('refetches and asks the shopper to retry on a revision conflict (no silent overwrite)', async () => {
    const { result } = setup();
    act(() => auth.current!.signIn(USER_A));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    // Another tab saves first.
    await catalog.persist({ items: [{ productId: EGGS, quantity: 1 }], expectedRevision: 0 });
    await act(() => result.current.add(BAR));
    await waitFor(() => expect(result.current.notice).toEqual({ kind: 'conflict' }));
    expect(result.current.items).toEqual([{ productId: EGGS, quantity: 1 }]);
    expect((await serverCart()).items).toEqual([{ productId: EGGS, quantity: 1 }]);
  });
});
