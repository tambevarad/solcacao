import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Role } from '../../../../contracts/index.js';
import { Button, LoadingState, buttonStyles } from '../../shared/index.js';
import { localizePath, useLocale } from '../shell/public.js';
import { AuthProvider, useAuth, type AuthState } from './AuthProvider.js';
import { AuthDialog } from './components/AuthDialog.js';

export { AuthProvider, useAuth, type AuthState };

/** `?returnTo=` for the current page, so sign-in resumes here. */
function useReturnQuery() {
  const location = useLocation();
  return `?returnTo=${encodeURIComponent(location.pathname + location.search)}`;
}

const panel = 'mx-auto max-w-xl px-4 py-12 md:px-6';

/** Guest view of a protected page: sign in here (modal) or on the sign-in page, then continue. */
function SignInPrompt() {
  const { t, locale } = useLocale();
  const returnQuery = useReturnQuery();
  const [open, setOpen] = useState(false);
  return (
    <section className={panel}>
      <h1 className="text-3xl font-semibold">{t('auth.guard.title')}</h1>
      <p className="mt-3 text-cacao/80">{t('auth.guard.body')}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => setOpen(true)} aria-haspopup="dialog">
          {t('auth.guard.openDialog')}
        </Button>
        <Link
          to={localizePath(locale, '/register') + returnQuery}
          className={buttonStyles({ variant: 'secondary' })}
        >
          {t('auth.guard.register')}
        </Link>
      </div>
      <p className="mt-4">
        <Link to={localizePath(locale, '/login') + returnQuery} className="underline">
          {t('auth.guard.loginPage')}
        </Link>
      </p>
      <AuthDialog open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

/**
 * Renders children only for a signed-in user. While a session check is running it shows a
 * loading state; a guest gets a sign-in prompt that returns to this page (safe internal returnTo).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const { t } = useLocale();
  if (!ready) return <LoadingState label={t('auth.guard.loading')} />;
  if (!user) return <SignInPrompt />;
  return <>{children}</>;
}

/**
 * RequireAuth plus a role check. A signed-in user with another role sees why access is refused
 * and how to get a matching account; the protected children never render for them.
 */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const returnQuery = useReturnQuery();
  return (
    <RequireAuth>
      {user?.role === role ? (
        children
      ) : (
        <section className={panel}>
          <h1 className="text-3xl font-semibold">{t(`auth.roleGuard.${role}.title`)}</h1>
          <p className="mt-3 text-cacao/80">
            {t(`auth.roleGuard.${role}.body`, { email: user?.email ?? '' })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {role === 'b2b' && (
              <>
                <Link
                  to={localizePath(locale, '/register') + returnQuery + '&role=b2b'}
                  className={buttonStyles()}
                >
                  {t('auth.roleGuard.b2b.createBusiness')}
                </Link>
                <Link
                  to={localizePath(locale, '/wholesale')}
                  className={buttonStyles({ variant: 'secondary' })}
                >
                  {t('auth.roleGuard.b2b.wholesale')}
                </Link>
              </>
            )}
            {role === 'retail' && (
              <Link to={localizePath(locale, '/catalog')} className={buttonStyles()}>
                {t('auth.roleGuard.retail.shop')}
              </Link>
            )}
          </div>
        </section>
      )}
    </RequireAuth>
  );
}
