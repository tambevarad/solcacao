// Public catalog port (docs/contracts.md "Cross-feature imports"). Other features import only these:
// useCart / CartState / CartProvider / CartDrawer. Products reach other features through
// api.catalog, never through fixtures or internal components.
export { CartProvider, useCart, type CartState } from './cart/CartProvider.js';
export { CartDrawer } from './components/CartDrawer.js';
