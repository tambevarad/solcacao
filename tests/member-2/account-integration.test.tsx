// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './harness.js';

// Stand-in for Student 1's published useAuth() port with a signed-in shopper, so this checks the
// shell's account entry and sign-out wiring against the AuthState interface, not the stub.
const auth = vi.hoisted(() => ({ logout: vi.fn() }));
vi.mock('../../client/src/features/auth/public.js', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  RequireAuth: ({ children }: { children: ReactNode }) => children,
  RequireRole: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: { id: '000000000000000000000001', name: 'Test', email: 'a@example.test', role: 'retail' },
    ready: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: auth.logout,
  }),
}));

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  auth.logout.mockReset();
});

it('links a signed-in user to their account and signs out from the desktop header', async () => {
  renderApp('/es');
  const banner = await screen.findByRole('banner');
  expect(within(banner).getByRole('link', { name: 'Tu cuenta' })).toHaveAttribute(
    'href',
    '/es/account',
  );
  fireEvent.click(within(banner).getByRole('button', { name: 'Cerrar sesión' }));
  expect(auth.logout).toHaveBeenCalledTimes(1);
});

it('offers sign out in the mobile drawer too', async () => {
  renderApp('/en');
  fireEvent.click(await screen.findByRole('button', { name: 'Open menu' }));
  const drawer = await screen.findByRole('dialog', { name: 'Menu' });
  fireEvent.click(within(drawer).getByRole('button', { name: 'Sign out' }));
  expect(auth.logout).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).toBeNull();
});
