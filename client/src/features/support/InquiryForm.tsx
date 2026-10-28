import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import type { CartLine, InquiryInput, InquiryReceipt } from '../../../../contracts/index.js';
import { api } from '../../api/index.js';
import { ApiError } from '../../api/http.js';
import { Button, Field, Select, TextArea } from '../../shared/index.js';
import { useLocale } from '../shell/public.js';
import { canonicalInquiry, supportInquirySchema } from './rules.js';
import { simulateNextInquiryFailure } from './mock.js';

const isMock = (import.meta.env.VITE_API_MODE || 'mock') === 'mock';

export function InquiryForm({
  category,
  samplerItems,
  children,
  unavailable = false,
}: {
  category: 'support' | 'feedback' | 'sampler';
  samplerItems?: CartLine[];
  children?: ReactNode;
  unavailable?: boolean;
}) {
  const { locale, t } = useLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [topic, setTopic] = useState<'support' | 'wholesale'>('support');
  const [errors, setErrors] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<InquiryReceipt | null>(null);
  const summary = useRef<HTMLDivElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);
  const request = useRef<{ body: string; id: string } | null>(null);
  useEffect(() => {
    if (failed || errors.length) summary.current?.focus();
  }, [failed, errors]);
  useEffect(() => {
    if (receipt) confirmation.current?.focus();
  }, [receipt]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    setErrors([]);
    setFailed(false);
    const draft: InquiryInput = {
      name,
      email,
      message,
      category: category === 'support' ? topic : category,
      locale,
      requestId: request.current?.id ?? crypto.randomUUID(),
      ...(category === 'sampler' ? { samplerItems: samplerItems ?? [] } : {}),
    };
    const parsed = supportInquirySchema.safeParse(draft);
    if (!parsed.success) {
      setErrors([...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? 'form')))]);
      return;
    }
    if (unavailable) {
      setErrors(['samplerItems']);
      return;
    }
    const body = canonicalInquiry(parsed.data);
    if (!request.current || request.current.body !== body)
      request.current = { body, id: crypto.randomUUID() };
    submitting.current = true;
    setPending(true);
    try {
      setReceipt(await api.support.submit({ ...parsed.data, requestId: request.current.id }));
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        const fields = Object.keys(error.fieldErrors).map((field) => field.split('.')[0]);
        setErrors([...new Set(fields)]);
      }
      setFailed(true);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  const errorKey = (field: string) =>
    ['name', 'email', 'message', 'samplerItems'].includes(field) ? field : 'form';
  const fieldError = (field: string) =>
    errors.includes(field) ? t(`support.error.${errorKey(field)}`) : undefined;

  if (receipt)
    return (
      <div
        ref={confirmation}
        tabIndex={-1}
        role="status"
        className="space-y-4 border border-line p-6 focus:outline-copper"
      >
        <h2 className="text-2xl">{t('support.receipt.title')}</h2>
        <p>{t(isMock ? 'support.receipt.mock' : 'support.receipt.saved')}</p>
        <p className="break-all">{t('support.receipt.reference', { id: receipt.id })}</p>
        {!isMock && <p>{t(`support.notification.${receipt.notificationStatus}`)}</p>}
        <Button
          variant="secondary"
          onClick={() => {
            setReceipt(null);
            setName('');
            setEmail('');
            setMessage('');
            request.current = null;
          }}
        >
          {t('support.form.another')}
        </Button>
      </div>
    );

  return (
    <form id="support-form" onSubmit={submit} noValidate className="space-y-6" aria-busy={pending}>
      {isMock && <p className="border-l-2 border-copper pl-4 text-sm">{t('support.form.demo')}</p>}
      {(failed || errors.length > 0) && (
        <div
          ref={summary}
          role="alert"
          tabIndex={-1}
          className="space-y-2 border border-error p-4 text-error focus:outline-error"
        >
          <p>{t(failed ? 'support.error.request' : 'support.error.summary')}</p>
          <ul className="list-inside list-disc">
            {errors.map((field) => (
              <li key={field}>
                <a href={`#support-${errorKey(field)}`}>{t(`support.error.${errorKey(field)}`)}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <fieldset disabled={pending} className="min-w-0 space-y-6">
        <legend className="sr-only">{t('support.form.details')}</legend>
        {children}
        {category === 'support' && (
          <Select
            id="support-category"
            label={t('support.form.category')}
            value={topic}
            onChange={(event) =>
              setTopic(event.target.value === 'wholesale' ? 'wholesale' : 'support')
            }
          >
            <option value="support">{t('support.category.support')}</option>
            <option value="wholesale">{t('support.category.wholesale')}</option>
          </Select>
        )}
        <Field
          id="support-name"
          label={t('support.form.name')}
          name="name"
          required
          autoComplete="name"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldError('name')}
        />
        <Field
          id="support-email"
          label={t('support.form.email')}
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError('email')}
        />
        <TextArea
          id="support-message"
          label={t('support.form.message')}
          name="message"
          required
          rows={5}
          minLength={10}
          maxLength={2000}
          hint={t('support.form.messageHint')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          error={fieldError('message')}
        />
        <Button type="submit" pending={pending} disabled={unavailable}>
          {t(pending ? 'support.form.sending' : 'support.form.send')}
        </Button>
      </fieldset>
      {isMock && import.meta.env.DEV && (
        <Button
          variant="ghost"
          disabled={pending}
          onClick={() => {
            simulateNextInquiryFailure();
            setFailed(false);
          }}
        >
          {t('support.form.simulateFailure')}
        </Button>
      )}
    </form>
  );
}
