import type { ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, buttonStyles } from '../../../shared/index.js';
import { localizePath, useLocale } from '../../shell/public.js';
import { useAuth } from '../AuthProvider.js';
import { safeReturnTo } from '../rules.js';

/** True unless the app was built for the real API (VITE_API_MODE=http). */
export const isMockMode = () => (import.meta.env.VITE_API_MODE || 'mock') !== 'http';

/** Labeled mock-mode notice: accounts live in this tab only. Hidden in HTTP mode. */
export function MockNotice({ showDemoAccounts = false }: { showDemoAccounts?: boolean }) {
  const { t } = useLocale();
  if (!isMockMode()) return null;
  return (
    <div className="mb-6 rounded border border-line bg-white p-4 text-sm">
      <p>{t('auth.mock.notice')}</p>
      {showDemoAccounts && <p className="mt-2">{t('auth.mock.demoAccounts')}</p>}
    </div>
  );
}

/**
 * Destination after sign-in: a validated internal `?returnTo=` (re-prefixed with the current
 * locale) or the account page. External or malformed values are ignored.
 */
export function useResumeDestination() {
  const { locale } = useLocale();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const raw = params.get('returnTo');
  const returnTo = safeReturnTo(raw, locale);
  const destination = returnTo ?? localizePath(locale, '/account');
  // Pass a valid returnTo along when switching between sign-in and registration.
  const carry = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
  return { destination, carry, resume: () => navigate(destination, { replace: true }) };
}

/** Shared frame for the login and register routes (one h1, centered single column). */
export function AuthPageLayout({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const { destination } = useResumeDestination();
  return (
    <div className="mx-auto max-w-md px-4 py-10 md:px-6 md:py-14">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-2 mb-6 text-cacao/80">{intro}</p>
      {user && (
        <div role="status" className="mb-6 rounded border border-line bg-white p-4">
          <p>{t('auth.signedIn.as', { name: user.name })}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link to={destination} className={buttonStyles()}>
              {t('auth.signedIn.continue')}
            </Link>
            <Button variant="secondary" onClick={logout}>
              {t('auth.signedIn.switch')}
            </Button>
          </div>
        </div>
      )}
      {children}
      <div className="mt-6 border-t border-line pt-6">{footer}</div>
    </div>
  );
}
