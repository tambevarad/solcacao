import { describe, expect, it } from 'vitest';
import {
  GUEST_CART_KEY,
  clearGuestCart,
  loadGuestCart,
  saveGuestCart,
} from '../../client/src/features/catalog/cart/guestStorage.js';
import { memoryStorage } from './storage-double.js';

const line = { productId: '5c0ca0000000000000000001', quantity: 2 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('guest cart storage (solcacao.guestCart.v1)', () => {
  it('stores only { items, mergeId } and rotates mergeId on every edit', () => {
    const storage = memoryStorage();
    const first = saveGuestCart(storage, [line]);
    expect(JSON.parse(storage.getItem(GUEST_CART_KEY)!)).toEqual({
      items: [line],
      mergeId: first.mergeId,
    });
    expect(first.mergeId).toMatch(UUID);
    const second = saveGuestCart(storage, [{ ...line, quantity: 3 }]);
    expect(second.mergeId).not.toBe(first.mergeId);
    expect(loadGuestCart(storage)).toEqual(second);
  });

  it('keeps the same mergeId across reloads until the next edit (for merge retries)', () => {
    const storage = memoryStorage();
    const saved = saveGuestCart(storage, [line]);
    expect(loadGuestCart(storage).mergeId).toBe(saved.mergeId);
    expect(loadGuestCart(storage).mergeId).toBe(saved.mergeId);
  });

  it.each([
    ['malformed JSON', '{not json'],
    ['a different shape', JSON.stringify({ lines: [] })],
    [
      'a token-like extra field',
      JSON.stringify({ items: [line], mergeId: crypto.randomUUID(), token: 'x' }),
    ],
    [
      'a bad quantity',
      JSON.stringify({ items: [{ ...line, quantity: 0 }], mergeId: crypto.randomUUID() }),
    ],
    ['duplicate products', JSON.stringify({ items: [line, line], mergeId: crypto.randomUUID() })],
    ['a non-uuid mergeId', JSON.stringify({ items: [line], mergeId: '1' })],
  ])('resets safely when storage holds %s', (_label, raw) => {
    const storage = memoryStorage({ [GUEST_CART_KEY]: raw });
    const cart = loadGuestCart(storage);
    expect(cart.items).toEqual([]);
    expect(cart.mergeId).toMatch(UUID);
    expect(storage.getItem(GUEST_CART_KEY)).toBeNull();
  });

  it('works without storage or when storage throws', () => {
    expect(loadGuestCart(null).items).toEqual([]);
    const throwing = memoryStorage();
    throwing.getItem = () => {
      throw new Error('blocked');
    };
    throwing.setItem = () => {
      throw new Error('quota');
    };
    expect(loadGuestCart(throwing).items).toEqual([]);
    expect(saveGuestCart(throwing, [line]).items).toEqual([line]);
    clearGuestCart(throwing);
  });

  it('removes the key when the cart becomes empty', () => {
    const storage = memoryStorage();
    saveGuestCart(storage, [line]);
    saveGuestCart(storage, []);
    expect(storage.getItem(GUEST_CART_KEY)).toBeNull();
  });
});
