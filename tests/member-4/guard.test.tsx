// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import type { Role, User } from '../../contracts/index.js';
import { renderApp } from './harness.js';

// Test double for Student 1's RequireRole (fail closed unless the signed-in role matches). It
// proves the real route table wires the wizard through RequireRole role="b2b"; the real guard UX
// (login return, business explanation) belongs to Student 1.
const auth = vi.hoisted(() => ({ user: null as User | null }));
vi.mock('../../client/src/features/auth/public.js', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  RequireAuth: ({ children }: { children: ReactNode }) =>
    auth.user ? children : <p>signed out</p>,
  RequireRole: ({ role, children }: { role: Role; children: ReactNode }) =>
    auth.user?.role === role ? children : <p>blocked for {auth.user?.role ?? 'guest'}</p>,
  useAuth: () => ({
    user: auth.user,
    ready: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

const user = (role: Role): User => ({
  id: '0000000000000000000000c3',
  name: 'Test',
  email: 'test@example.test',
  role,
  companyName: role === 'b2b' ? 'Test Co' : undefined,
});

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('wizard route access', () => {
  it.each([
    [null, 'guest'],
    [user('retail'), 'retail'],
  ])('does not render the submission UI for %s', async (signedIn, label) => {
    auth.user = signedIn;
    renderApp('/en/wholesale/request');
    expect(await screen.findByText(`blocked for ${label}`)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Request a custom quote' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Send quote request|Continue/ })).toBeNull();
  });

  it('renders the wizard for a business account', async () => {
    auth.user = user('b2b');
    renderApp('/es/wholesale/request');
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Solicitar una cotización personalizada',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument();
  });
});
