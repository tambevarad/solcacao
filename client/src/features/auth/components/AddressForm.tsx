import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import type { Address } from '../../../../../contracts/index.js';
import { Button, Field, Select } from '../../../shared/index.js';
import { useLocale } from '../../shell/public.js';
import { addressSchema, fieldErrorsOf, listCountryCodes } from '../rules.js';
import { ErrorSummary } from './ErrorSummary.js';
import { failureKeys, validationKeys, type ErrorKeys } from './messages.js';

type AddressField = Exclude<keyof Address, 'id'>;
type Values = Record<AddressField, string>;

const FIELDS: { field: AddressField; autoComplete: string; maxLength: number }[] = [
  { field: 'recipient', autoComplete: 'name', maxLength: 100 },
  { field: 'line1', autoComplete: 'address-line1', maxLength: 200 },
  { field: 'line2', autoComplete: 'address-line2', maxLength: 200 },
  { field: 'city', autoComplete: 'address-level2', maxLength: 100 },
  { field: 'region', autoComplete: 'address-level1', maxLength: 100 },
  { field: 'postalCode', autoComplete: 'postal-code', maxLength: 20 },
];

const valuesOf = (address?: Address): Values => ({
  recipient: address?.recipient ?? '',
  line1: address?.line1 ?? '',
  line2: address?.line2 ?? '',
  city: address?.city ?? '',
  region: address?.region ?? '',
  postalCode: address?.postalCode ?? '',
  country: address?.country ?? 'US',
});

/**
 * Create or edit one saved address. Validated with the same schema as the server; the id of an
 * edited address is sent back so the server upserts it, never a user id.
 */
export function AddressForm({
  address,
  onSave,
  onCancel,
  onUnauthorized,
}: {
  address?: Address;
  onSave(input: Address): Promise<void>;
  onCancel(): void;
  onUnauthorized(): void;
}) {
  const { t, locale } = useLocale();
  const id = useId();
  const [values, setValues] = useState<Values>(() => valuesOf(address));
  const [errors, setErrors] = useState<ErrorKeys>({});
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const summary = useRef<HTMLDivElement>(null);
  const ids = Object.fromEntries(
    [...FIELDS.map(({ field }) => field), 'country'].map((field) => [field, `${id}-${field}`]),
  );
  const labels = Object.fromEntries(
    [...FIELDS.map(({ field }) => field), 'country'].map((field) => [
      field,
      t(`auth.address.${field}`),
    ]),
  );

  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: 'region' });
    const collator = new Intl.Collator(locale);
    return listCountryCodes()
      .map((code) => ({ code, name: names.of(code) ?? code }))
      .sort((a, b) => collator.compare(a.name, b.name));
  }, [locale]);

  function show(keys: ErrorKeys) {
    setErrors(keys);
    requestAnimationFrame(() => summary.current?.focus());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    const input = { ...(address?.id ? { id: address.id } : {}), ...values };
    const parsed = addressSchema.safeParse(input);
    if (!parsed.success) return show(validationKeys(fieldErrorsOf(parsed.error), values));
    busy.current = true;
    setPending(true);
    setErrors({});
    try {
      await onSave(parsed.data);
    } catch (error) {
      const keys = failureKeys(error, values);
      if (keys.form === 'auth.error.sessionExpired') return onUnauthorized();
      show(keys);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-busy={pending}
      className="rounded border border-line bg-white p-4 md:p-6"
    >
      <h3 className="mb-4 text-lg font-semibold">
        {t(address ? 'auth.account.editAddressTitle' : 'auth.account.newAddressTitle')}
      </h3>
      <ErrorSummary ref={summary} errors={errors} fieldIds={ids} labels={labels} />
      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map(({ field, autoComplete, maxLength }) => (
          <Field
            key={field}
            id={ids[field]}
            label={labels[field]}
            name={field}
            required={field !== 'line2'}
            autoComplete={autoComplete}
            maxLength={maxLength}
            value={values[field]}
            onChange={(event) => setValues({ ...values, [field]: event.target.value })}
            error={errors[field] ? t(errors[field]) : undefined}
            className={
              field === 'recipient' || field.startsWith('line') ? 'md:col-span-2' : undefined
            }
          />
        ))}
        <Select
          id={ids.country}
          label={labels.country}
          name="country"
          required
          autoComplete="country"
          value={values.country}
          onChange={(event) => setValues({ ...values, country: event.target.value })}
          error={errors.country ? t(errors.country) : undefined}
        >
          {countries.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" pending={pending}>
          {t('auth.account.saveAddress')}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          {t('auth.account.cancel')}
        </Button>
      </div>
    </form>
  );
}
