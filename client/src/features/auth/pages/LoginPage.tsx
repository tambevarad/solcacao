import { Link } from 'react-router-dom';
import { localizePath, useLocale } from '../../shell/public.js';
import { LoginForm } from '../components/AuthForms.js';
import { AuthPageLayout, MockNotice, useResumeDestination } from '../components/AuthPageLayout.js';

/** /:locale/login. Resumes the validated `?returnTo=` (or the account page) after sign-in. */
export default function LoginPage() {
  const { t, locale } = useLocale();
  const { carry, resume } = useResumeDestination();
  return (
    <AuthPageLayout
      title={t('auth.login.title')}
      intro={t('auth.login.intro')}
      footer={
        <p>
          {t('auth.login.noAccount')}{' '}
          <Link to={localizePath(locale, '/register') + carry} className="font-medium underline">
            {t('auth.login.createAccount')}
          </Link>
        </p>
      }
    >
      <MockNotice showDemoAccounts />
      <LoginForm onSuccess={resume} />
    </AuthPageLayout>
  );
}
