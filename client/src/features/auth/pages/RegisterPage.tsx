import { Link, useSearchParams } from 'react-router-dom';
import { localizePath, useLocale } from '../../shell/public.js';
import { RegisterForm } from '../components/AuthForms.js';
import { AuthPageLayout, MockNotice, useResumeDestination } from '../components/AuthPageLayout.js';

/**
 * /:locale/register. `?role=b2b` preselects a business account (linked from the quote guard);
 * the shopper can still choose either type. Resumes the validated `?returnTo=` afterwards.
 */
export default function RegisterPage() {
  const { t, locale } = useLocale();
  const [params] = useSearchParams();
  const { carry, resume } = useResumeDestination();
  return (
    <AuthPageLayout
      title={t('auth.register.title')}
      intro={t('auth.register.intro')}
      footer={
        <p>
          {t('auth.register.haveAccount')}{' '}
          <Link to={localizePath(locale, '/login') + carry} className="font-medium underline">
            {t('auth.register.signIn')}
          </Link>
        </p>
      }
    >
      <MockNotice />
      <RegisterForm
        onSuccess={resume}
        initialRole={params.get('role') === 'b2b' ? 'b2b' : 'retail'}
      />
    </AuthPageLayout>
  );
}
