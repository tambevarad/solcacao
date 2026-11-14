// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import type { AuthApi, AuthSession } from '../../contracts/index.js';
import { sessionToken } from '../../client/src/api/session.js';
import { AuthProvider, useAuth, type AuthState } from '../../client/src/features/auth/public.js';
import { resetMockAuth } from '../../client/src/features/auth/mock.js';
import { fastMockAuth } from './harness.js';

let latest: AuthState;
const tokenSeenWithUser: (string | null)[] = [];
function Probe() {
  latest = useAuth();
  if (latest.user) tokenSeenWithUser.push(sessionToken.get());
  return <p data-testid="user">{latest.user?.email ?? 'guest'}</p>;
}
const mount = (auth: AuthApi) =>
  render(
    <AuthProvider auth={auth}>
      <Probe />
    </AuthProvider>,
  );

beforeEach(() => {
  resetMockAuth();
  sessionToken.set(null);
  tokenSeenWithUser.length = 0;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('starts ready and signed out; sets the token before the user is visible', async () => {
  mount(fastMockAuth());
  expect(latest.ready).toBe(true);
  expect(screen.getByTestId('user')).toHaveTextContent('guest');
  await act(() => latest.login({ email: 'retail@solcacao.test', password: 'retail-demo-pass' }));
  expect(screen.getByTestId('user')).toHaveTextContent('retail@solcacao.test');
  // CartProvider reacts to `user`; by then authenticated calls must already carry the token.
  expect(tokenSeenWithUser.every((token) => token?.startsWith('mock:'))).toBe(true);
  act(() => latest.logout());
  expect(sessionToken.get()).toBeNull();
  expect(screen.getByTestId('user')).toHaveTextContent('guest');
});

it('drops a sign-in response that arrives after logout', async () => {
  let resolve: (session: AuthSession) => void = () => {};
  const auth = fastMockAuth();
  auth.login = () => new Promise((done) => (resolve = done));
  mount(auth);
  let pending: Promise<void> = Promise.resolve();
  act(() => {
    pending = latest.login({ email: 'a@member1.test', password: 'x' });
  });
  act(() => latest.logout());
  await act(async () => {
    resolve({
      user: { id: 'a'.repeat(24), name: 'Late', email: 'late@member1.test', role: 'retail' },
      token: `mock:${'a'.repeat(24)}`,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    await pending;
  });
  expect(screen.getByTestId('user')).toHaveTextContent('guest');
  expect(sessionToken.get()).toBeNull();
});

it('propagates a failed sign-in to the caller and stays signed out', async () => {
  mount(fastMockAuth());
  await expect(
    act(() => latest.login({ email: 'retail@solcacao.test', password: 'wrong-password' })),
  ).rejects.toMatchObject({ status: 401 });
  expect(sessionToken.get()).toBeNull();
});

it('ends the session at expiresAt (no silent refresh)', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mount(fastMockAuth());
  await act(() => latest.login({ email: 'retail@solcacao.test', password: 'retail-demo-pass' }));
  expect(screen.getByTestId('user')).toHaveTextContent('retail@solcacao.test');
  act(() => vi.advanceTimersByTime(60 * 60 * 1000 + 1000));
  expect(screen.getByTestId('user')).toHaveTextContent('guest');
  expect(sessionToken.get()).toBeNull();
});

it('checks a token already in memory before reporting ready, and clears an invalid one', async () => {
  sessionToken.set('mock:ffffffffffffffffffffffff');
  mount(fastMockAuth());
  expect(latest.ready).toBe(false);
  await act(async () => {});
  expect(latest.ready).toBe(true);
  expect(latest.user).toBeNull();
  expect(sessionToken.get()).toBeNull();
});

it('ends an overdue session when the tab becomes visible again (timer delayed by sleep)', async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); // the clock moves; the expiry timer does not fire
  mount(fastMockAuth());
  await act(() => latest.login({ email: 'retail@solcacao.test', password: 'retail-demo-pass' }));
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(screen.getByTestId('user')).toHaveTextContent('retail@solcacao.test');
  vi.setSystemTime(Date.now() + 60 * 60 * 1000 + 1000);
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(screen.getByTestId('user')).toHaveTextContent('guest');
  expect(sessionToken.get()).toBeNull();
});
