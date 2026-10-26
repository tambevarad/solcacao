import { z } from 'zod';
import type { CartLine } from '../../../../../contracts/index.js';
import { cartLinesSchema } from '../rules.js';

/** Decision D10. Holds only cart lines and the merge id: never tokens or personal data. */
export const GUEST_CART_KEY = 'solcacao.guestCart.v1';

export interface GuestCart {
  items: CartLine[];
  /** Identifies this version of the guest cart for an idempotent merge on sign-in. */
  mergeId: string;
}

const guestCartSchema = z.object({ items: cartLinesSchema, mergeId: z.string().uuid() }).strict();

/** localStorage can be missing or throw (private mode, blocked storage); treat that as no storage. */
export function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

const freshGuestCart = (items: CartLine[] = []): GuestCart => ({
  items,
  mergeId: crypto.randomUUID(),
});

/** Reads and validates the stored guest cart. Corrupt or foreign content is removed safely. */
export function loadGuestCart(storage: Storage | null): GuestCart {
  let raw: string | null = null;
  try {
    raw = storage?.getItem(GUEST_CART_KEY) ?? null;
  } catch {
    return freshGuestCart();
  }
  if (raw === null) return freshGuestCart();
  try {
    const parsed = guestCartSchema.safeParse(JSON.parse(raw));
    if (parsed.success)
      return {
        items: parsed.data.items.map((line) => ({
          productId: line.productId.toLowerCase(),
          quantity: line.quantity,
        })),
        mergeId: parsed.data.mergeId,
      };
  } catch {
    // Malformed JSON falls through to a reset.
  }
  clearGuestCart(storage);
  return freshGuestCart();
}

/** Saves an edited guest cart under a NEW mergeId (each edit is a new cart version). */
export function saveGuestCart(storage: Storage | null, items: CartLine[]): GuestCart {
  const cart = freshGuestCart(items);
  try {
    if (items.length) storage?.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    else storage?.removeItem(GUEST_CART_KEY);
  } catch {
    // Quota or blocked storage: the cart still works for this page view.
  }
  return cart;
}

export function clearGuestCart(storage: Storage | null) {
  try {
    storage?.removeItem(GUEST_CART_KEY);
  } catch {
    // Nothing to clear.
  }
}
