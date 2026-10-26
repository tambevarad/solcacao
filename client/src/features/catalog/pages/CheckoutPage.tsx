import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Address, CatalogApi, CheckoutInput } from '../../../../../contracts/index.js';
import { api } from '../../../api/index.js';
import { ApiError } from '../../../api/http.js';
import {
  Button,
  EmptyState,
  Field,
  LoadingState,
  Select,
  buttonStyles,
} from '../../../shared/index.js';
import { useAuth } from '../../auth/public.js';
import { localizePath, useLocale } from '../../shell/public.js';
import { useCartDetails } from '../cart/CartProvider.js';
import { useMoney } from '../components/format.js';
import { canonicalCheckout, listCountryCodes, parseCheckout, type FieldErrors } from '../rules.js';
import type { ConfirmationState } from './OrderConfirmationPage.js';

type AddressField = Exclude<keyof Address, 'id'>;
const ADDRESS_FIELDS: AddressField[] = [
  'recipient',
  'line1',
  'line2',
  'city',
  'region',
  'postalCode',
  'country',
];
const AUTOCOMPLETE: Record<AddressField, string> = {
  recipient: 'name',
  line1: 'address-line1',
  line2: 'address-line2',
  city: 'address-level2',
  region: 'address-level1',
  postalCode: 'postal-code',
  country: 'country',
};
const MAX_LENGTH: Record<AddressField, number> = {
  recipient: 100,
  line1: 200,
  line2: 200,
  city: 100,
  region: 100,
  postalCode: 20,
  country: 2,
};

type Form = { email: string } & Record<AddressField, string>;

/**
 * /:locale/checkout: simulated retail checkout (decision D03). Validates email and address with
 * the same schema as the server, shows a review with a display-only subtotal (the server
 * recalculates from its own prices) and submits one requestId per distinct request, so a double
 * click or a retry after a lost response returns the same receipt. No payment is collected.
 */
export default function CheckoutPage({ catalog = api.catalog }: { catalog?: CatalogApi }) {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const cart = useCartDetails();
  const money = useMoney();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(() => ({
    email: user?.email ?? '',
    recipient: '',
    line1: '',
    line2: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'US',
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState('');
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const attempt = useRef<{ key: string; requestId: string } | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: 'region' });
    const collator = new Intl.Collator(locale);
    return listCountryCodes()
      .map((code) => ({ code, name: names.of(code) ?? code }))
      .sort((a, b) => collator.compare(a.name, b.name));
  }, [locale]);

  const lines = cart.items.map((line) => ({ line, product: cart.lookup(line.productId) }));
  const unavailable = lines.some(({ product }) => product === null);
  const resolving = lines.some(({ product }) => product === undefined);

  if (cart.status === 'loading') return <LoadingState label={t('catalog.cart.loading')} />;
  if (!cart.items.length)
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">{t('catalog.checkout.title')}</h1>
        <EmptyState
          title={t('catalog.cart.empty')}
          description={t('catalog.checkout.emptyBody')}
          action={
            <Link to={localizePath(locale, '/catalog')} className={buttonStyles()}>
              {t('catalog.cart.browse')}
            </Link>
          }
        />
      </div>
    );

  const fieldMessage = (field: string, message: string) => {
    if (field === 'email')
      return t(
        form.email.trim() ? 'catalog.checkout.error.email' : 'catalog.checkout.error.required',
      );
    if (field === 'address.postalCode' && message !== 'Required')
      return t('catalog.checkout.error.postalCode');
    if (field === 'address.country') return t('catalog.checkout.error.country');
    if (message === 'Required') return t('catalog.checkout.error.required');
    if (field.startsWith('address.')) return t('catalog.checkout.error.tooLong');
    return t('catalog.checkout.error.generic');
  };

  function showFieldErrors(fieldErrors: FieldErrors) {
    const mapped: Record<string, string> = {};
    const perLine: Record<string, string> = {};
    for (const [field, message] of Object.entries(fieldErrors)) {
      const item = field.match(/^items\.(\d+)\./);
      if (item) {
        const productId = cart.items[Number(item[1])]?.productId;
        if (productId) perLine[productId] = message;
      } else if (field === 'email' || field.startsWith('address.'))
        mapped[field] = fieldMessage(field, message);
    }
    setErrors(mapped);
    setLineErrors(perLine);
    if (Object.keys(mapped).length) requestAnimationFrame(() => summaryRef.current?.focus());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || unavailable || resolving) return;
    setFailure('');
    const address: Address = {
      recipient: form.recipient,
      line1: form.line1,
      ...(form.line2.trim() ? { line2: form.line2 } : {}),
      city: form.city,
      region: form.region,
      postalCode: form.postalCode,
      country: form.country,
    };
    const draft = { items: cart.items, email: form.email, address };
    const parsed = parseCheckout({ ...draft, requestId: crypto.randomUUID() });
    if (!parsed.ok) {
      showFieldErrors(parsed.fieldErrors);
      return;
    }
    setErrors({});
    setLineErrors({});
    // Same normalized request -> same requestId, so retries are idempotent; any change -> new id.
    const key = canonicalCheckout({ ...parsed.value, requestId: '' });
    if (attempt.current?.key !== key) attempt.current = { key, requestId: crypto.randomUUID() };
    const input: CheckoutInput = { ...draft, requestId: attempt.current.requestId };

    submitting.current = true;
    setPending(true);
    try {
      const receipt = await catalog.checkout(input);
      const state: ConfirmationState = { receipt };
      navigate(localizePath(locale, '/order-confirmation'), { state });
      void cart.clear();
    } catch (error) {
      if (!(error instanceof ApiError)) setFailure(t('catalog.checkout.failure.network'));
      else if (error.code === 'OUT_OF_STOCK') {
        showFieldErrors(error.fieldErrors ?? {});
        setFailure(t('catalog.checkout.failure.stock'));
      } else if (error.code === 'VALIDATION_ERROR') {
        showFieldErrors(error.fieldErrors ?? {});
        setFailure(t('catalog.checkout.failure.invalid'));
      } else if (error.code === 'UNAUTHORIZED') setFailure(t('catalog.checkout.failure.auth'));
      else if (error.code === 'IDEMPOTENCY_CONFLICT') {
        attempt.current = null;
        setFailure(t('catalog.checkout.failure.network'));
      } else setFailure(t('catalog.checkout.failure.network'));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  const set = (key: keyof Form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const errorEntries = Object.entries(errors);
  const fieldId = (key: string) => `checkout-${key.replace('address.', '')}`;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold md:text-4xl">{t('catalog.checkout.title')}</h1>
      <p className="mt-4 rounded border-2 border-copper bg-white p-4 font-semibold">
        {t('catalog.checkout.demoNotice')}
      </p>
      <p className="mt-2 max-w-prose text-cacao/80">{t('catalog.checkout.demoBody')}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem]">
        <form onSubmit={submit} noValidate className="space-y-6" aria-labelledby="checkout-details">
          <h2 id="checkout-details" className="text-xl font-semibold">
            {t('catalog.checkout.details')}
          </h2>
          {errorEntries.length > 0 && (
            <div
              ref={summaryRef}
              tabIndex={-1}
              role="alert"
              className="rounded border border-error bg-white p-4"
            >
              <p className="font-semibold">
                {t('catalog.checkout.errorSummary', { count: errorEntries.length })}
              </p>
              <ul className="mt-2 list-disc pl-5">
                {errorEntries.map(([field, message]) => (
                  <li key={field}>
                    <a href={`#${fieldId(field)}`} className="underline underline-offset-4">
                      {t('catalog.checkout.errorItem', {
                        field: t(`catalog.checkout.field.${field.replace('address.', '')}`),
                        message,
                      })}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Field
            id={fieldId('email')}
            label={t('catalog.checkout.field.email')}
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            hint={t('catalog.checkout.emailHint')}
          />
          <fieldset className="space-y-4">
            <legend className="mb-2 text-lg font-semibold">{t('catalog.checkout.address')}</legend>
            {ADDRESS_FIELDS.map((key) =>
              key === 'country' ? (
                <Select
                  key={key}
                  id={fieldId(key)}
                  label={t('catalog.checkout.field.country')}
                  name="country"
                  autoComplete="country"
                  required
                  value={form.country}
                  onChange={set('country')}
                  error={errors['address.country']}
                >
                  {countries.map(({ code, name }) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Field
                  key={key}
                  id={fieldId(key)}
                  label={t(`catalog.checkout.field.${key}`)}
                  name={key}
                  autoComplete={AUTOCOMPLETE[key]}
                  required={key !== 'line2'}
                  maxLength={MAX_LENGTH[key]}
                  value={form[key]}
                  onChange={set(key)}
                  error={errors[`address.${key}`]}
                />
              ),
            )}
          </fieldset>
          {failure && (
            <p role="alert" className="rounded border border-error bg-white p-4">
              {failure}
            </p>
          )}
          <Button type="submit" pending={pending} disabled={unavailable || resolving} fullWidth>
            {pending ? t('catalog.checkout.placing') : t('catalog.checkout.place')}
          </Button>
        </form>

        <section
          aria-labelledby="checkout-review"
          className="h-fit rounded border border-line bg-white p-5"
        >
          <h2 id="checkout-review" className="text-xl font-semibold">
            {t('catalog.checkout.review')}
          </h2>
          <ul className="mt-4 divide-y divide-line">
            {lines.map(({ line, product }) => (
              <li key={line.productId} className="py-3">
                {product === undefined ? (
                  <span className="text-cacao/80">{t('catalog.cart.lineLoading')}</span>
                ) : product === null ? (
                  <span className="text-error">{t('catalog.cart.lineUnavailable')}</span>
                ) : (
                  <div className="flex justify-between gap-4">
                    <span className="min-w-0 break-words">
                      {t('catalog.checkout.lineSummary', {
                        quantity: line.quantity,
                        name: product.name[locale],
                      })}
                    </span>
                    <span>{money(product.priceCents * line.quantity)}</span>
                  </div>
                )}
                {lineErrors[line.productId] && (
                  <p className="mt-1 text-sm text-error">{t('catalog.checkout.lineProblem')}</p>
                )}
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4">
            <div className="flex justify-between">
              <dt>{t('catalog.cart.subtotal')}</dt>
              <dd>{money(cart.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between text-cacao/80">
              <dt>{t('catalog.checkout.shipping')}</dt>
              <dd>{t('catalog.checkout.notCharged')}</dd>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <dt>{t('catalog.checkout.total')}</dt>
              <dd>{money(cart.subtotalCents)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-cacao/80">{t('catalog.checkout.totalNote')}</p>
          {unavailable && (
            <p className="mt-3 text-sm text-error">{t('catalog.cart.removeUnavailable')}</p>
          )}
          <Button variant="secondary" className="mt-4" fullWidth onClick={() => cart.setOpen(true)}>
            {t('catalog.checkout.editCart')}
          </Button>
        </section>
      </div>
    </div>
  );
}
