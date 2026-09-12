import { createContext, useContext, type ReactNode } from 'react';
import type { CartLine } from '../../../../contracts/index.js';
import { notImplemented } from '../../api/notImplemented.js';
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
const Context = createContext<CartState>({
  items: [],
  count: 0,
  subtotalCents: 0,
  open: false,
  setOpen: () => notImplemented('cart.setOpen'),
  add: async () => notImplemented('cart.add'),
  update: async () => notImplemented('cart.update'),
  remove: async () => notImplemented('cart.remove'),
  clear: async () => notImplemented('cart.clear'),
});
export function CartProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
export function useCart() {
  return useContext(Context);
}
export function CartDrawer() {
  return null;
}
