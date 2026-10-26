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
import type { CartLine, CatalogApi, Product } from '../../../../../contracts/index.js';
import { api } from '../../../api/index.js';
import { ApiError } from '../../../api/http.js';
import { useAuth } from '../../auth/public.js';
import { MAX_LIMIT, MAX_QUANTITY } from '../rules.js';
import {
  GUEST_CART_KEY,
  browserStorage,
  clearGuestCart,
  loadGuestCart,
  saveGuestCart,
} from './guestStorage.js';

/** Stable public cart port; also declared in catalog/public.tsx. */
export interface CartState {
  items: CartLine[];
  count: number;
  subtotalCents: number;
  open: boolean;
  setOpen(value: boolean): void;
  add(productId: string, quantity?: number): Promise<void>;
  update(productId: string, quantity: number): Promise<void>;
  remove(productId: string): Promise<void>;
  clear(): Promise<void>;
}

/** A merged or saved quantity that ended up lower than requested (stock or the 99 cap). */
export interface CartAdjustment {
  productId: string;
  requested: number;
  actual: number;
}

export type CartNotice =
  | { kind: 'merged'; adjustments: CartAdjustment[] }
  | { kind: 'mergeFailed' }
  | { kind: 'conflict' }
  | { kind: 'outOfStock' }
  | { kind: 'unavailable' }
  | { kind: 'limited'; productId: string; max: number }
  | { kind: 'saveFailed' }
  | { kind: 'loadFailed' };

/** Feature-internal view of the cart. Other features use only CartState through useCart(). */
export interface CartDetails extends CartState {
  mode: 'guest' | 'user';
  /** loading: the signed-in cart is being fetched or merged; saving: a persist is in flight. */
  status: 'loading' | 'ready' | 'saving';
  notice: CartNotice | null;
  dismissNotice(): void;
  /** Product for a line: undefined while unknown, null when missing or inactive. */
  lookup(productId: string): Product | null | undefined;
  /** Pages share products they already loaded so the drawer needs no extra request. */
  remember(products: Product[]): void;
  directoryFailed: boolean;
  retryDirectory(): void;
  /** Retries the failed load/merge, or the failed save, depending on the notice. */
  retry(): void;
}

const missingProvider = () => {
  throw new Error('useCart must be used inside CartProvider');
};
const Context = createContext<CartDetails>({
  items: [],
  count: 0,
  subtotalCents: 0,
  open: false,
  setOpen: missingProvider,
  add: missingProvider,
  update: missingProvider,
  remove: missingProvider,
  clear: missingProvider,
  mode: 'guest',
  status: 'ready',
  notice: null,
  dismissNotice: () => {},
  lookup: () => undefined,
  remember: () => {},
  directoryFailed: false,
  retryDirectory: () => {},
  retry: () => {},
});

const codeOf = (error: unknown) => (error instanceof ApiError ? error.code : '');

/** Lines whose merged quantity is below saved + guest (capped by stock, 99, or dropped). */
export function mergeAdjustments(
  saved: CartLine[],
  guest: CartLine[],
  merged: CartLine[],
): CartAdjustment[] {
  const quantity = (lines: CartLine[], id: string) =>
    lines.find((line) => line.productId === id)?.quantity ?? 0;
  return guest.flatMap((line) => {
    const requested = Math.min(MAX_QUANTITY, quantity(saved, line.productId) + line.quantity);
    const actual = quantity(merged, line.productId);
    return actual < requested ? [{ productId: line.productId, requested, actual }] : [];
  });
}

/**
 * The one shared cart, mounted once in main.tsx.
 *
 * - Guest: lines live in localStorage (`solcacao.guestCart.v1`) with a mergeId rotated on each edit.
 * - Sign-in (useAuth user null -> id): load the saved cart, merge the guest cart once with its
 *   mergeId, replace the UI state with the server result, then clear guest storage (only after
 *   success) and report any quantity that was reduced.
 * - Signed in: edits are applied locally at once and saved one request at a time with the latest
 *   lines and the expected revision; a 409 refetches and asks the shopper to retry.
 * - Every async step captures a session generation; anything that resolves after sign-out or an
 *   account switch is ignored. Sign-out clears the private cart and starts an empty guest cart.
 */
export function CartProvider({
  children,
  catalog = api.catalog,
  storage = browserStorage(),
}: {
  children: ReactNode;
  /** Test seams; the app always uses api.catalog and window.localStorage. */
  catalog?: CatalogApi;
  storage?: Storage | null;
}) {
  const { user, ready } = useAuth();
  const userId = ready ? (user?.id ?? null) : undefined;

  const [items, setItems] = useState<CartLine[]>(() => loadGuestCart(storage).items);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'guest' | 'user'>('guest');
  const [status, setStatus] = useState<CartDetails['status']>('ready');
  const [notice, setNotice] = useState<CartNotice | null>(null);
  const [products, setProducts] = useState<ReadonlyMap<string, Product | null>>(new Map());
  const [directoryFailed, setDirectoryFailed] = useState(false);

  const itemsRef = useRef(items);
  const modeRef = useRef<'guest' | 'user'>('guest');
  const productsRef = useRef(products);
  productsRef.current = products;
  const revision = useRef(0);
  const session = useRef<{ generation: number; userId: string | null | undefined }>({
    generation: 0,
    userId: undefined,
  });
  /** Resolves once the signed-in cart is known; mutations wait for it. */
  const loaded = useRef<Promise<void>>(Promise.resolve());
  const dirty = useRef(false);
  const flushing = useRef<Promise<void> | null>(null);
  const merging = useRef<string | null>(null);

  const apply = useCallback((next: CartLine[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const isCurrent = (generation: number) => session.current.generation === generation;

  const refetch = useCallback(
    async (generation: number) => {
      try {
        const cart = await catalog.cart();
        if (!isCurrent(generation)) return;
        revision.current = cart.revision;
        apply(cart.items);
      } catch {
        if (isCurrent(generation)) setNotice({ kind: 'loadFailed' });
      }
    },
    [catalog, apply],
  );

  /** Sends the latest lines until nothing is pending. One request at a time, newest state wins. */
  const flush = useCallback((): Promise<void> => {
    if (flushing.current) return flushing.current;
    const generation = session.current.generation;
    const run = async () => {
      setStatus('saving');
      try {
        while (dirty.current && isCurrent(generation)) {
          dirty.current = false;
          try {
            const cart = await catalog.persist({
              items: itemsRef.current,
              expectedRevision: revision.current,
            });
            if (!isCurrent(generation)) return;
            revision.current = cart.revision;
            if (!dirty.current) apply(cart.items);
          } catch (error) {
            if (!isCurrent(generation)) return;
            const code = codeOf(error);
            if (
              code === 'CART_CONFLICT' ||
              code === 'OUT_OF_STOCK' ||
              code === 'VALIDATION_ERROR'
            ) {
              dirty.current = false;
              setNotice({
                kind:
                  code === 'CART_CONFLICT'
                    ? 'conflict'
                    : code === 'OUT_OF_STOCK'
                      ? 'outOfStock'
                      : 'unavailable',
              });
              await refetch(generation);
            } else setNotice({ kind: 'saveFailed' });
            return;
          }
        }
      } finally {
        flushing.current = null;
        if (isCurrent(generation)) setStatus('ready');
      }
    };
    flushing.current = run();
    return flushing.current;
  }, [catalog, apply, refetch]);

  const signIn = useCallback(
    async (generation: number) => {
      setStatus('loading');
      const guest = loadGuestCart(storage);
      try {
        const saved = await catalog.cart();
        if (!isCurrent(generation)) return;
        revision.current = saved.revision;
        apply(saved.items);
        if (guest.items.length && merging.current !== guest.mergeId) {
          merging.current = guest.mergeId;
          try {
            const merged = await catalog.merge({ items: guest.items, mergeId: guest.mergeId });
            if (!isCurrent(generation)) return;
            clearGuestCart(storage);
            revision.current = merged.revision;
            apply(merged.items);
            setNotice({
              kind: 'merged',
              adjustments: mergeAdjustments(saved.items, guest.items, merged.items),
            });
          } finally {
            merging.current = null;
          }
        }
      } catch {
        // The guest cart stays in storage, so the merge can be retried with the same mergeId.
        if (isCurrent(generation)) setNotice({ kind: 'mergeFailed' });
      } finally {
        if (isCurrent(generation)) setStatus('ready');
      }
    },
    [catalog, storage, apply],
  );

  // Observe auth transitions (docs/contracts.md "Cart persistence, login and races").
  useEffect(() => {
    if (userId === undefined) return;
    const previous = session.current.userId;
    if (previous === userId) return;
    const generation = ++session.current.generation;
    session.current.userId = userId;
    dirty.current = false;
    setNotice(null);
    if (userId === null) {
      modeRef.current = 'guest';
      setMode('guest');
      setStatus('ready');
      loaded.current = Promise.resolve();
      if (previous) {
        // Signed out: drop the private cart; the saved one returns after the next sign-in.
        clearGuestCart(storage);
        apply([]);
      } else apply(loadGuestCart(storage).items);
      return;
    }
    modeRef.current = 'user';
    setMode('user');
    apply([]);
    loaded.current = signIn(generation);
  }, [userId, storage, apply, signIn]);

  // Keep guest carts in other tabs in step.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === GUEST_CART_KEY && modeRef.current === 'guest')
        apply(loadGuestCart(storage).items);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storage, apply]);

  const stockCap = (productId: string) => {
    const product = productsRef.current.get(productId);
    return Math.min(MAX_QUANTITY, product ? product.stock : MAX_QUANTITY);
  };

  /** Applies one edit to the latest lines, then stores (guest) or saves (signed in). */
  const mutate = useCallback(
    async (change: (current: CartLine[]) => CartLine[]) => {
      const generation = session.current.generation;
      await loaded.current;
      if (!isCurrent(generation)) return;
      const next = change(itemsRef.current);
      if (next === itemsRef.current) return;
      apply(next);
      if (modeRef.current === 'guest') {
        saveGuestCart(storage, next);
        return;
      }
      dirty.current = true;
      await flush();
    },
    [apply, flush, storage],
  );

  const add = useCallback(
    (productId: string, quantity = 1) =>
      mutate((current) => {
        const id = productId.toLowerCase();
        const cap = stockCap(id);
        const existing = current.find((line) => line.productId === id);
        const wanted = (existing?.quantity ?? 0) + Math.max(1, Math.floor(quantity));
        const next = Math.min(cap, wanted);
        if (next < wanted) setNotice({ kind: 'limited', productId: id, max: cap });
        if (next < 1 || next === existing?.quantity) return current;
        return existing
          ? current.map((line) => (line.productId === id ? { ...line, quantity: next } : line))
          : [...current, { productId: id, quantity: next }];
      }),
    [mutate],
  );

  const remove = useCallback(
    (productId: string) =>
      mutate((current) => {
        const id = productId.toLowerCase();
        return current.some((line) => line.productId === id)
          ? current.filter((line) => line.productId !== id)
          : current;
      }),
    [mutate],
  );

  const update = useCallback(
    (productId: string, quantity: number) => {
      if (!Number.isFinite(quantity) || quantity < 1) return remove(productId);
      return mutate((current) => {
        const id = productId.toLowerCase();
        const cap = stockCap(id);
        const next = Math.min(cap, Math.floor(quantity));
        if (next < quantity) setNotice({ kind: 'limited', productId: id, max: cap });
        if (next < 1) return current.filter((line) => line.productId !== id);
        return current.map((line) => (line.productId === id ? { ...line, quantity: next } : line));
      });
    },
    [mutate, remove],
  );

  const clear = useCallback(() => mutate((current) => (current.length ? [] : current)), [mutate]);

  const remember = useCallback((list: Product[]) => {
    setProducts((previous) => {
      const next = new Map(previous);
      for (const product of list) next.set(product.id, product);
      return next;
    });
  }, []);

  // Resolve products for lines the pages have not shown yet (e.g. a guest cart after reload).
  // CatalogApi has no lookup by id, so active products are paged through api.catalog.list;
  // ids that never appear are missing or inactive and shown as unavailable.
  const resolving = useRef(false);
  useEffect(() => {
    const missing = items.map((line) => line.productId).filter((id) => !products.has(id));
    if (!missing.length || resolving.current || directoryFailed) return;
    resolving.current = true;
    (async () => {
      const found = new Map<string, Product | null>();
      try {
        let page = 1;
        let totalPages = 1;
        do {
          const result = await catalog.list({ limit: MAX_LIMIT, page, sort: 'name' });
          for (const product of result.items) found.set(product.id, product);
          totalPages = result.totalPages;
          page += 1;
        } while (missing.some((id) => !found.has(id)) && page <= totalPages);
        for (const id of missing) if (!found.has(id)) found.set(id, null);
        setProducts((previous) => {
          const next = new Map(previous);
          for (const [id, product] of found) if (product || !next.has(id)) next.set(id, product);
          return next;
        });
      } catch {
        setDirectoryFailed(true);
      } finally {
        resolving.current = false;
      }
    })();
  }, [items, products, directoryFailed, catalog]);

  const retry = useCallback(() => {
    const generation = session.current.generation;
    if (notice?.kind === 'saveFailed') {
      setNotice(null);
      dirty.current = true;
      void flush();
    } else if (modeRef.current === 'user') {
      setNotice(null);
      loaded.current = signIn(generation);
    }
  }, [notice, flush, signIn]);

  const value = useMemo<CartDetails>(() => {
    const count = items.reduce((sum, line) => sum + line.quantity, 0);
    const subtotalCents = items.reduce((sum, line) => {
      const product = products.get(line.productId);
      return product ? sum + product.priceCents * line.quantity : sum;
    }, 0);
    return {
      items,
      count,
      subtotalCents,
      open,
      setOpen,
      add,
      update,
      remove,
      clear,
      mode,
      status,
      notice,
      dismissNotice: () => setNotice(null),
      lookup: (id) => products.get(id.toLowerCase()),
      remember,
      directoryFailed,
      retryDirectory: () => setDirectoryFailed(false),
      retry,
    };
  }, [
    items,
    products,
    open,
    add,
    update,
    remove,
    clear,
    mode,
    status,
    notice,
    remember,
    directoryFailed,
    retry,
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** Public port: the CartState subset other features rely on. */
export function useCart(): CartState {
  return useContext(Context);
}

/** Catalog-internal: the full cart view used by the drawer and catalog pages. */
export function useCartDetails(): CartDetails {
  return useContext(Context);
}
