import { useId, useRef, useState, type FormEvent } from 'react';
import type { RegisterInput, Role } from '../../../../../contracts/index.js';
import { Button, Field } from '../../../shared/index.js';
import { useLocale } from '../../shell/public.js';
import { useAuth } from '../AuthProvider.js';
import { fieldErrorsOf, loginSchema, registerSchema } from '../rules.js';
import { ErrorSummary } from './ErrorSummary.js';
import { failureKeys, validationKeys, type ErrorKeys } from './messages.js';

/**
 * Submission state shared by both forms: one request at a time, errors stored as translation keys
 * (so a language switch re-renders them), focus moved to the summary after a failure.
 */
function useAuthSubmit() {
  const [errors, setErrors] = useState<ErrorKeys>({});
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const summary = useRef<HTMLDivElement>(null);

  function show(keys: ErrorKeys) {
    setErrors(keys);
    requestAnimationFrame(() => summary.current?.focus());
  }

  async function run(request: () => Promise<void>, onError: (error: unknown) => void) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setErrors({});
    try {
      await request();
    } catch (error) {
      onError(error);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return { errors, setErrors, show, pending, run, summary };
}

const message = (t: (key: string) => string, errors: ErrorKeys, field: string) =>
  errors[field] ? t(errors[field]) : undefined;

/** Sign-in form used by LoginPage and the auth dialog. Calls onSuccess once signed in. */
export function LoginForm({ onSuccess }: { onSuccess(): void }) {
  const { t } = useLocale();
  const { login } = useAuth();
  const id = useId();
  const ids = { email: `${id}-email`, password: `${id}-password` };
  const labels = { email: t('auth.field.email'), password: t('auth.field.password') };
  const [values, setValues] = useState({ email: '', password: '' });
  const { errors, show, pending, run, summary } = useAuthSubmit();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) return show(validationKeys(fieldErrorsOf(parsed.error), values));
    await run(
      async () => {
        await login(parsed.data);
        onSuccess();
      },
      (error) => {
        // Keep the email, never the password.
        setValues((current) => ({ ...current, password: '' }));
        show(failureKeys(error, values, { unauthorized: 'auth.error.invalidCredentials' }));
      },
    );
  }

  return (
    <form noValidate onSubmit={submit} aria-busy={pending}>
      <ErrorSummary ref={summary} errors={errors} fieldIds={ids} labels={labels} />
      <div className="grid gap-4">
        <Field
          id={ids.email}
          label={labels.email}
          type="email"
          name="email"
          required
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          error={message(t, errors, 'email')}
        />
        <Field
          id={ids.password}
          label={labels.password}
          type="password"
          name="password"
          required
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          error={message(t, errors, 'password')}
        />
      </div>
      <Button type="submit" pending={pending} fullWidth className="mt-6">
        {t('auth.login.submit')}
      </Button>
    </form>
  );
}

type RegisterValues = { name: string; email: string; password: string; companyName: string };

/**
 * Registration form used by RegisterPage and the auth dialog. Only retail and business can be
 * chosen (no admin); the company name appears and becomes required for business accounts.
 */
export function RegisterForm({
  onSuccess,
  initialRole = 'retail',
}: {
  onSuccess(): void;
  initialRole?: Role;
}) {
  const { t } = useLocale();
  const { register } = useAuth();
  const id = useId();
  const ids = {
    name: `${id}-name`,
    email: `${id}-email`,
    password: `${id}-password`,
    companyName: `${id}-company`,
  };
  const labels = {
    name: t('auth.field.name'),
    email: t('auth.field.email'),
    password: t('auth.field.password'),
    companyName: t('auth.field.companyName'),
  };
  const [role, setRole] = useState<Role>(initialRole);
  const [values, setValues] = useState<RegisterValues>({
    name: '',
    email: '',
    password: '',
    companyName: '',
  });
  const { errors, setErrors, show, pending, run, summary } = useAuthSubmit();
  const set = (field: keyof RegisterValues) => (event: { target: { value: string } }) =>
    setValues({ ...values, [field]: event.target.value });

  function chooseRole(next: Role) {
    setRole(next);
    if (next === 'retail' && errors.companyName) {
      const { companyName: _hidden, ...rest } = errors;
      setErrors(rest);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input: RegisterInput = {
      name: values.name,
      email: values.email,
      password: values.password,
      role,
      ...(role === 'b2b' ? { companyName: values.companyName } : {}),
    };
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) return show(validationKeys(fieldErrorsOf(parsed.error), values));
    await run(
      async () => {
        await register(parsed.data);
        onSuccess();
      },
      (error) => {
        setValues((current) => ({ ...current, password: '' }));
        show(failureKeys(error, values));
      },
    );
  }

  return (
    <form noValidate onSubmit={submit} aria-busy={pending}>
      <ErrorSummary ref={summary} errors={errors} fieldIds={ids} labels={labels} />
      <div className="grid gap-4">
        <fieldset>
          <legend className="mb-2 font-medium">{t('auth.field.accountType')}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(['retail', 'b2b'] as const).map((option) => (
              <label
                key={option}
                className="flex min-h-11 cursor-pointer gap-3 rounded border border-line bg-white p-3 has-[:checked]:border-cacao has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-copper"
              >
                <input
                  type="radio"
                  name={`${id}-role`}
                  value={option}
                  checked={role === option}
                  onChange={() => chooseRole(option)}
                  className="mt-1 size-4 accent-cacao"
                />
                <span>
                  <span className="block font-medium">{t(`auth.role.${option}`)}</span>
                  <span className="block text-sm text-cacao/80">
                    {t(`auth.role.${option}Hint`)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {role === 'b2b' && (
          <Field
            id={ids.companyName}
            label={labels.companyName}
            name="companyName"
            required
            autoComplete="organization"
            maxLength={120}
            value={values.companyName}
            onChange={set('companyName')}
            error={message(t, errors, 'companyName')}
          />
        )}
        <Field
          id={ids.name}
          label={labels.name}
          name="name"
          required
          autoComplete="name"
          maxLength={100}
          value={values.name}
          onChange={set('name')}
          error={message(t, errors, 'name')}
        />
        <Field
          id={ids.email}
          label={labels.email}
          type="email"
          name="email"
          required
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          value={values.email}
          onChange={set('email')}
          error={message(t, errors, 'email')}
        />
        <Field
          id={ids.password}
          label={labels.password}
          type="password"
          name="password"
          required
          autoComplete="new-password"
          hint={t('auth.field.passwordHint')}
          value={values.password}
          onChange={set('password')}
          error={message(t, errors, 'password')}
        />
      </div>
      <Button type="submit" pending={pending} fullWidth className="mt-6">
        {t('auth.register.submit')}
      </Button>
    </form>
  );
}
