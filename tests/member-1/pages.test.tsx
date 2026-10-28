// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { AuthApi } from '../../contracts/index.js';
import { sessionToken } from '../../client/src/api/session.js';
import { resetMockAuth } from '../../client/src/features/auth/mock.js';
import { fastMockAuth, renderApp } from './harness.js';

const PASSWORD = 'synthetic-pass-123';

beforeEach(() => {
  resetMockAuth();
  sessionToken.set(null);
  localStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const location = () => screen.getByTestId('location').textContent;
const type = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const main = () => within(screen.getByRole('main'));

async function fillRegistration(fields: { name?: string; email?: string; password?: string } = {}) {
  await screen.findByRole('heading', { level: 1, name: 'Create an account' });
  type(/^Full name/, fields.name ?? 'Retail Tester');
  type(/^Email/, fields.email ?? 'shopper@member1.test');
  type(/^Password/, fields.password ?? PASSWORD);
}

describe('registration', () => {
  it('creates a retail account and lands on the account page showing its type', async () => {
    renderApp('/en/register');
    await fillRegistration();
    fireEvent.click(main().getByRole('button', { name: 'Create account' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your account' }),
    ).toBeInTheDocument();
    expect(location()).toBe('/en/account');
    expect(screen.getByText('Retail account')).toBeInTheDocument();
    expect(sessionToken.get()).toMatch(/^mock:[a-f0-9]{24}$/);
  });

  it('requires a company name for business accounts, then creates a business account', async () => {
    renderApp('/en/register');
    await fillRegistration({ email: 'buyer@member1.test' });
    expect(screen.queryByLabelText(/^Company name/)).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /Business/ }));
    fireEvent.click(main().getByRole('button', { name: 'Create account' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveTextContent('Enter your company name for a business account.');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.getByLabelText(/^Company name/)).toHaveAttribute('aria-invalid', 'true');

    type(/^Company name/, 'Test Co');
    fireEvent.click(main().getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Business account')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Company name/)).toHaveValue('Test Co');
  });

  it('shows field errors for empty, invalid and too-short input without submitting', async () => {
    const auth = fastMockAuth();
    const register = vi.spyOn(auth, 'register');
    renderApp('/en/register', auth);
    await fillRegistration({ name: ' ', email: 'not-an-email', password: 'short' });
    fireEvent.click(main().getByRole('button', { name: 'Create account' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveTextContent('Full name: This field is required.');
    expect(summary).toHaveTextContent('Email: Enter a valid email address.');
    expect(summary).toHaveTextContent('Password: Use at least 12 characters.');
    expect(register).not.toHaveBeenCalled();
    fireEvent.click(within(summary).getByRole('link', { name: /Email:/ }));
    expect(screen.getByLabelText(/^Email/)).toHaveFocus();
  });

  it('rejects a password over 72 UTF-8 bytes, matching the shared schema', async () => {
    renderApp('/en/register');
    await fillRegistration({ password: 'ñ'.repeat(37) });
    fireEvent.click(main().getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Use at most 72 characters/);
  });

  it('a duplicate email is a recoverable field error; other fields are kept, password cleared', async () => {
    renderApp('/en/register');
    await fillRegistration({ email: 'retail@solcacao.test' }); // seeded demo account
    fireEvent.click(main().getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists. Sign in instead.',
    );
    expect(screen.getByLabelText(/^Full name/)).toHaveValue('Retail Tester');
    expect(screen.getByLabelText(/^Email/)).toHaveValue('retail@solcacao.test');
    expect(screen.getByLabelText(/^Password/)).toHaveValue('');
    expect(screen.getByLabelText(/^Password/)).toHaveAttribute('autocomplete', 'new-password');
  });

  it('offers only retail and business account types (no admin)', async () => {
    renderApp('/en/register');
    await screen.findByRole('heading', { level: 1, name: 'Create an account' });
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
      'retail',
      'b2b',
    ]);
  });
});

describe('sign in', () => {
  it('a wrong password shows a generic error, keeps the email and clears the password', async () => {
    renderApp('/en/login');
    await screen.findByRole('heading', { level: 1, name: 'Sign in' });
    type(/^Email/, 'retail@solcacao.test');
    type(/^Password/, 'wrong-password-1');
    fireEvent.click(main().getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The email or password is incorrect.',
    );
    expect(screen.getByLabelText(/^Email/)).toHaveValue('retail@solcacao.test');
    expect(screen.getByLabelText(/^Password/)).toHaveValue('');
    expect(screen.getByLabelText(/^Password/)).toHaveAttribute('autocomplete', 'current-password');
  });

  it('disables the submit button while pending and sends one request', async () => {
    const auth = fastMockAuth();
    let release: () => void = () => {};
    const login = vi.spyOn(auth, 'login').mockImplementation(
      (input) =>
        new Promise((resolve, reject) => {
          release = () => fastMockAuth().login(input).then(resolve, reject);
        }),
    );
    renderApp('/en/login', auth);
    await screen.findByRole('heading', { level: 1, name: 'Sign in' });
    type(/^Email/, 'retail@solcacao.test');
    type(/^Password/, 'retail-demo-pass');
    const button = main().getByRole('button', { name: 'Sign in' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(login).toHaveBeenCalledTimes(1);
    await act(async () => release());
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your account' }),
    ).toBeInTheDocument();
  });

  it('resumes a safe internal returnTo after sign-in', async () => {
    renderApp('/en/login?returnTo=%2Fen%2Fwholesale%2Frequest');
    await screen.findByRole('heading', { level: 1, name: 'Sign in' });
    type(/^Email/, 'business@solcacao.test');
    type(/^Password/, 'business-demo-pass');
    fireEvent.click(main().getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(location()).toBe('/en/wholesale/request'));
  });

  it.each(['https://evil.example/en/account', '//evil.example', '/en//evil.example'])(
    'ignores an external returnTo (%s) and goes to the account page',
    async (returnTo) => {
      renderApp(`/en/login?returnTo=${encodeURIComponent(returnTo)}`);
      await screen.findByRole('heading', { level: 1, name: 'Sign in' });
      type(/^Email/, 'retail@solcacao.test');
      type(/^Password/, 'retail-demo-pass');
      fireEvent.click(main().getByRole('button', { name: 'Sign in' }));
      await waitFor(() => expect(location()).toBe('/en/account'));
    },
  );

  it('keeps typed input and re-translates errors when the language is switched', async () => {
    renderApp('/en/login');
    await screen.findByRole('heading', { level: 1, name: 'Sign in' });
    type(/^Email/, 'not-an-email');
    fireEvent.click(main().getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address.');
    fireEvent.click(within(screen.getByRole('banner')).getByRole('link', { name: /Español/ }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Correo electrónico/)).toHaveValue('not-an-email');
    expect(screen.getByRole('alert')).toHaveTextContent('Introduce un correo electrónico válido.');
  });
});

describe('guards', () => {
  it('RequireAuth: a guest sees a sign-in prompt with a safe returnTo link', async () => {
    renderApp('/es/account');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Inicia sesión para continuar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Abrir la página de inicio de sesión' }),
    ).toHaveAttribute('href', '/es/login?returnTo=%2Fes%2Faccount');
  });

  it('auth modal: keyboard sign-in, Escape closes, focus returns to the opener', async () => {
    renderApp('/en/account');
    await screen.findByRole('heading', { level: 1, name: 'Sign in to continue' });
    const opener = main().getByRole('button', { name: 'Sign in' });
    opener.focus();
    fireEvent.click(opener);
    const dialog = await screen.findByRole('dialog', { name: 'Sign in' });
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(opener).toHaveFocus();

    fireEvent.click(opener);
    const reopened = await screen.findByRole('dialog', { name: 'Sign in' });
    expect(dialog).not.toBe(reopened);
    fireEvent.change(within(reopened).getByLabelText(/^Email/), {
      target: { value: 'retail@solcacao.test' },
    });
    fireEvent.change(within(reopened).getByLabelText(/^Password/), {
      target: { value: 'retail-demo-pass' },
    });
    fireEvent.submit(
      within(reopened)
        .getByLabelText(/^Password/)
        .closest('form')!,
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your account' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('RequireRole b2b: guest -> sign-in prompt; retail -> explanation; business -> wizard', async () => {
    const auth = fastMockAuth();
    renderApp('/en/wholesale/request', auth);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in to continue' }),
    ).toBeInTheDocument();

    fireEvent.click(main().getByRole('button', { name: 'Sign in' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sign in' });
    fireEvent.change(within(dialog).getByLabelText(/^Email/), {
      target: { value: 'retail@solcacao.test' },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Password/), {
      target: { value: 'retail-demo-pass' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sign in' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Business account required' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/retail@solcacao.test/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a business account' })).toHaveAttribute(
      'href',
      '/en/register?returnTo=%2Fen%2Fwholesale%2Frequest&role=b2b',
    );
    expect(screen.queryByRole('heading', { name: 'Request a custom quote' })).toBeNull();

    fireEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Sign out' }));
    fireEvent.click(await main().findByRole('button', { name: 'Sign in' }));
    const again = await screen.findByRole('dialog', { name: 'Sign in' });
    fireEvent.change(within(again).getByLabelText(/^Email/), {
      target: { value: 'business@solcacao.test' },
    });
    fireEvent.change(within(again).getByLabelText(/^Password/), {
      target: { value: 'business-demo-pass' },
    });
    fireEvent.click(within(again).getByRole('button', { name: 'Sign in' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Request a custom quote' }),
    ).toBeInTheDocument();
  });
});

describe('account page and session lifecycle', () => {
  async function signIn(entry = '/en/login', auth: AuthApi = fastMockAuth()) {
    renderApp(entry, auth);
    await screen.findByRole('heading', { level: 1, name: 'Sign in' });
    type(/^Email/, 'business@solcacao.test');
    type(/^Password/, 'business-demo-pass');
    fireEvent.click(main().getByRole('button', { name: 'Sign in' }));
    await screen.findByRole('heading', { level: 1, name: 'Your account' });
  }

  it('edits the profile; email and role are shown but not editable', async () => {
    await signIn();
    expect(screen.getByText('Business account')).toBeInTheDocument();
    expect(screen.getByText('business@solcacao.test')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Email/)).toBeNull();
    type(/^Full name/, 'Renamed Buyer');
    type(/^Company name/, '');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your company name');
    type(/^Company name/, 'Renamed Co');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument();
  });

  it('adds and edits an address for the current tab session', async () => {
    await signIn();
    expect(await screen.findByText('No saved addresses yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add an address' }));
    type(/^Recipient/, 'Test Person');
    type(/^Address line 1/, '1 Example Street');
    type(/^City/, 'Testville');
    type(/^State, province or region/, 'TX');
    type(/^Postal code/, '<bad>');
    fireEvent.click(screen.getByRole('button', { name: 'Save address' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid postal code.');
    type(/^Postal code/, '75001');
    fireEvent.click(screen.getByRole('button', { name: 'Save address' }));
    expect(await screen.findByText('Address saved.')).toBeInTheDocument();
    expect(screen.getByText('1 Example Street')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit the address for Test Person' }));
    type(/^City/, 'Newtown');
    fireEvent.click(screen.getByRole('button', { name: 'Save address' }));
    expect(await screen.findByText(/Newtown, TX 75001/)).toBeInTheDocument();
  });

  it('logout clears the in-memory token and user; protected pages ask to sign in again', async () => {
    await signIn();
    expect(sessionToken.get()).toMatch(/^mock:/);
    fireEvent.click(main().getByRole('button', { name: 'Sign out' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in to continue' }),
    ).toBeInTheDocument();
    expect(sessionToken.get()).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('a fresh app (as after a reload) starts signed out even though the account still exists', async () => {
    await signIn();
    cleanup();
    sessionToken.set(null); // a reload empties the in-memory token store
    renderApp('/en/account');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in to continue' }),
    ).toBeInTheDocument();
  });

  it('a 401 from an account action signs out into a recoverable sign-in prompt', async () => {
    const auth = fastMockAuth();
    await signIn('/en/login', auth);
    sessionToken.set('mock:ffffffffffffffffffffffff'); // session no longer valid server-side
    type(/^Full name/, 'Someone');
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in to continue' }),
    ).toBeInTheDocument();
  });
});
