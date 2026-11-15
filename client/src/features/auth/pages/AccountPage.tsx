import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, ShoppingBag } from 'lucide-react';
import type { Address, ProfileUpdate, User } from '../../../../../contracts/index.js';
import { sessionToken } from '../../../api/index.js';
import { Button, ErrorState, Field, LoadingState, buttonStyles } from '../../../shared/index.js';
import { localizePath, useLocale } from '../../shell/public.js';
import { useAuth, useAuthInternals } from '../AuthProvider.js';
import { AddressForm } from '../components/AddressForm.js';
import { MockNotice } from '../components/AuthPageLayout.js';
import { ErrorSummary } from '../components/ErrorSummary.js';
import { failureKeys, validationKeys, type ErrorKeys } from '../components/messages.js';
import { fieldErrorsOf, profileSchema } from '../rules.js';

/**
 * /:locale/account (wrapped in RequireAuth by routes.tsx). Shows the account type, edits the
 * profile (name, plus company for business accounts; email and role are not editable) and the
 * signed-in user's own addresses. A 401 from any action signs out, so the guard offers sign-in.
 * RequireAuth unmounts the page on sign-out, so the token present at mount is the session every
 * request here was sent with: a late 401 for it never signs out an account that signed in since.
 */
export default function AccountPage() {
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const [pageSession] = useState(() => sessionToken.get());
  const expire = useCallback(() => {
    if (sessionToken.get() === pageSession) logout();
  }, [pageSession, logout]);
  if (!user) return null; // RequireAuth renders the sign-in prompt instead.
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="text-3xl font-semibold">{t('auth.account.title')}</h1>
      <div className="mt-6">
        <MockNotice />
      </div>
      <AccountType user={user} />
      <ProfileSection user={user} onUnauthorized={expire} />
      <AddressSection onUnauthorized={expire} />
      <div className="mt-10 border-t border-line pt-6">
        <Button variant="secondary" onClick={logout}>
          {t('auth.account.signOut')}
        </Button>
      </div>
    </div>
  );
}

function AccountType({ user }: { user: User }) {
  const { t, locale } = useLocale();
  const business = user.role === 'b2b';
  const Icon = business ? BriefcaseBusiness : ShoppingBag;
  return (
    <section
      aria-labelledby="account-type"
      className={`mt-6 flex flex-wrap items-start gap-4 rounded border p-4 md:p-6 ${
        business ? 'border-copper bg-white' : 'border-line bg-white'
      }`}
    >
      <Icon aria-hidden="true" className={`size-8 ${business ? 'text-copper' : 'text-cacao'}`} />
      <div className="min-w-0 flex-1">
        <h2 id="account-type" className="text-sm font-medium uppercase tracking-wide text-cacao/80">
          {t('auth.account.type')}
        </h2>
        <p className="text-xl font-semibold">
          {t(business ? 'auth.account.b2b' : 'auth.account.retail')}
        </p>
        <p className="mt-1 text-cacao/80">
          {t(business ? 'auth.account.b2bHint' : 'auth.account.retailHint')}
        </p>
      </div>
      {business && (
        <Link to={localizePath(locale, '/wholesale/request')} className={buttonStyles()}>
          {t('auth.account.quoteLink')}
        </Link>
      )}
    </section>
  );
}

function ProfileSection({ user, onUnauthorized }: { user: User; onUnauthorized(): void }) {
  const { t } = useLocale();
  const { auth, replaceUser } = useAuthInternals();
  const id = useId();
  const business = user.role === 'b2b';
  const ids = { name: `${id}-name`, companyName: `${id}-company` };
  const labels = { name: t('auth.field.name'), companyName: t('auth.field.companyName') };
  const [values, setValues] = useState({ name: user.name, companyName: user.companyName ?? '' });
  const [errors, setErrors] = useState<ErrorKeys>({});
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const summary = useRef<HTMLDivElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    setSaved(false);
    // Only ProfileUpdate fields are sent; retail accounts have no company.
    const input: ProfileUpdate = {
      name: values.name,
      ...(business ? { companyName: values.companyName } : {}),
    };
    const parsed = profileSchema.safeParse(input);
    const keys = parsed.success ? {} : validationKeys(fieldErrorsOf(parsed.error), values);
    if (business && !values.companyName.trim()) keys.companyName = 'auth.error.companyRequired';
    if (!parsed.success || Object.keys(keys).length) {
      setErrors(keys);
      return requestAnimationFrame(() => summary.current?.focus());
    }
    busy.current = true;
    setPending(true);
    setErrors({});
    try {
      replaceUser(await auth.updateProfile(parsed.data));
      setSaved(true);
    } catch (error) {
      const failure = failureKeys(error, values);
      if (failure.form === 'auth.error.sessionExpired') return onUnauthorized();
      setErrors(failure);
      requestAnimationFrame(() => summary.current?.focus());
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="account-profile" className="mt-10">
      <h2 id="account-profile" className="text-2xl font-semibold">
        {t('auth.account.profile')}
      </h2>
      <form noValidate onSubmit={submit} aria-busy={pending} className="mt-4">
        <ErrorSummary ref={summary} errors={errors} fieldIds={ids} labels={labels} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id={ids.name}
            label={labels.name}
            name="name"
            required
            autoComplete="name"
            maxLength={100}
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            error={errors.name ? t(errors.name) : undefined}
          />
          {business && (
            <Field
              id={ids.companyName}
              label={labels.companyName}
              name="companyName"
              required
              autoComplete="organization"
              maxLength={120}
              value={values.companyName}
              onChange={(event) => setValues({ ...values, companyName: event.target.value })}
              error={errors.companyName ? t(errors.companyName) : undefined}
            />
          )}
          <div className="md:col-span-2">
            <p className="font-medium">{t('auth.account.email')}</p>
            <p className="break-all">{user.email}</p>
            <p className="text-sm text-cacao/80">{t('auth.account.emailNote')}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button type="submit" pending={pending}>
            {t('auth.account.saveProfile')}
          </Button>
          <p role="status" className="text-sm">
            {saved ? t('auth.account.profileSaved') : ''}
          </p>
        </div>
      </form>
    </section>
  );
}

type Editing = { mode: 'closed' } | { mode: 'new' } | { mode: 'edit'; address: Address };

function AddressSection({ onUnauthorized }: { onUnauthorized(): void }) {
  const { t, locale } = useLocale();
  const { auth } = useAuthInternals();
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState<Editing>({ mode: 'closed' });
  const [notice, setNotice] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const countryNames = new Intl.DisplayNames([locale], { type: 'region' });

  const load = useCallback(() => {
    setStatus('loading');
    auth.addresses().then(
      (list) => {
        setAddresses(list);
        setStatus('ready');
      },
      (error: unknown) => {
        if (failureKeys(error, {}).form === 'auth.error.sessionExpired') onUnauthorized();
        else setStatus('error');
      },
    );
  }, [auth, onUnauthorized]);
  useEffect(load, [load]);

  async function save(input: Address) {
    const saved = await auth.saveAddress(input);
    setAddresses((list) =>
      list.some((address) => address.id === saved.id)
        ? list.map((address) => (address.id === saved.id ? saved : address))
        : [...list, saved],
    );
    setEditing({ mode: 'closed' });
    setNotice(true);
    requestAnimationFrame(() => addButton.current?.focus());
  }

  function open(next: Editing) {
    setNotice(false);
    setEditing(next);
  }

  return (
    <section aria-labelledby="account-addresses" className="mt-10">
      <h2 id="account-addresses" className="text-2xl font-semibold">
        {t('auth.account.addresses')}
      </h2>
      <p role="status" className="mt-2 text-sm">
        {notice ? t('auth.account.addressSaved') : ''}
      </p>
      {status === 'loading' && <LoadingState label={t('auth.account.loadingAddresses')} />}
      {status === 'error' && (
        <ErrorState description={t('auth.account.addressesError')} onRetry={load} />
      )}
      {status === 'ready' && (
        <>
          {addresses.length === 0 && editing.mode === 'closed' && (
            <p className="mt-2 text-cacao/80">{t('auth.account.noAddresses')}</p>
          )}
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {addresses.map((address) =>
              editing.mode === 'edit' && editing.address.id === address.id ? null : (
                <li key={address.id} className="rounded border border-line bg-white p-4">
                  <address className="not-italic">
                    <span className="block font-medium">{address.recipient}</span>
                    <span className="block">{address.line1}</span>
                    {address.line2 && <span className="block">{address.line2}</span>}
                    <span className="block">
                      {address.city}, {address.region} {address.postalCode}
                    </span>
                    <span className="block">
                      {countryNames.of(address.country) ?? address.country}
                    </span>
                  </address>
                  <Button
                    variant="ghost"
                    className="mt-2 px-0"
                    onClick={() => open({ mode: 'edit', address })}
                    aria-label={t('auth.account.editAddressLabel', {
                      recipient: address.recipient,
                    })}
                  >
                    {t('auth.account.editAddress')}
                  </Button>
                </li>
              ),
            )}
          </ul>
          {editing.mode !== 'closed' ? (
            <div className="mt-4">
              <AddressForm
                key={editing.mode === 'edit' ? editing.address.id : 'new'}
                address={editing.mode === 'edit' ? editing.address : undefined}
                onSave={save}
                onCancel={() => {
                  setEditing({ mode: 'closed' });
                  requestAnimationFrame(() => addButton.current?.focus());
                }}
                onUnauthorized={onUnauthorized}
              />
            </div>
          ) : (
            <Button
              ref={addButton}
              variant="secondary"
              className="mt-4"
              onClick={() => open({ mode: 'new' })}
            >
              {t('auth.account.addAddress')}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
