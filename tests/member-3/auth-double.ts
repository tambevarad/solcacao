import type { User } from '../../contracts/index.js';

/**
 * Stand-in for Student 1's useAuth() port (not merged yet). Tests switch between guest and
 * signed-in users; components re-render through useSyncExternalStore like a real provider.
 * Mock tokens follow docs/contracts.md: `mock:<userId>`.
 */
export function createAuthDouble() {
  let user: User | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => user,
    token: () => (user ? `mock:${user.id}` : null),
    signIn(id = '0000000000000000000000a1') {
      user = { id, name: 'Test Shopper', email: `${id}@example.test`, role: 'retail' };
      listeners.forEach((listener) => listener());
    },
    signOut() {
      user = null;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
export type AuthDouble = ReturnType<typeof createAuthDouble>;
