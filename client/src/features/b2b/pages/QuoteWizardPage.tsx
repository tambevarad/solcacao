import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import type { QuoteInput, QuoteReceipt } from '../../../../../contracts/index.js';
import { api } from '../../../api/index.js';
import { ApiError } from '../../../api/http.js';
import { useAuth } from '../../auth/public.js';
import { Button } from '../../../shared/index.js';
import { usePageMeta, useLocale } from '../../shell/public.js';
import {
  BrandingStep,
  CacaoStep,
  ErrorSummary,
  PackagingStep,
  ReviewStep,
} from '../components/QuoteSteps.js';
import { QuoteReceiptView } from '../components/QuoteReceiptView.js';
import { WizardStepper } from '../components/WizardStepper.js';
import { quoteDraftStore, type QuoteDraftStore } from '../draftStore.js';
import { COMPANY_MAX, NOTES_MAX, QUANTITY_MAX, QUANTITY_MIN } from '../options.js';
import {
  STEPS,
  buildQuoteInput,
  failureFromError,
  hasErrors,
  hasProgress,
  initialWizardState,
  validateAll,
  type WizardAction,
} from '../wizard.js';

export type SubmitQuote = (input: QuoteInput, file: File) => Promise<QuoteReceipt>;

const submitWithApi: SubmitQuote = (input, file) => api.b2b.submit(input, file);
const newRequestId = () => crypto.randomUUID();
/** Mirrors client/src/api/index.ts: anything but explicit HTTP mode is the in-browser mock. */
const demoMode = (import.meta.env.VITE_API_MODE || 'mock') !== 'http';
/** Shown for an account whose draft has not been claimed yet (identical to a new draft). */
const FRESH = initialWizardState();

/**
 * Four-step custom quote wizard. Access control is Student 1's RequireRole on this route; the page
 * adds no guard of its own. State lives in this tab's draft store (draftStore.ts), not in the page:
 * a language switch keeps the page mounted, and when the guard replaces the page because the
 * session ended, signing in again with the same account brings back the step, answers and file.
 */
export default function QuoteWizardPage({
  submitQuote = submitWithApi,
  createRequestId = newRequestId,
  store = quoteDraftStore,
}: {
  /** Test seam; the app always uses api.b2b.submit (mock or HTTP per VITE_API_MODE). */
  submitQuote?: SubmitQuote;
  createRequestId?: () => string;
  /** Test seam; the app uses the tab's single draft store. */
  store?: QuoteDraftStore;
}) {
  const { t, locale } = useLocale();
  const { user, logout } = useAuth();
  const owner = user?.id ?? null;
  const entry = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const state = entry.owner === owner ? entry.state : FRESH;
  const dispatch = (action: WizardAction) => store.update(owner, action);
  // A draft kept from earlier in this tab is announced once, with a way to start over.
  const [restored, setRestored] = useState(() => state.status === 'editing' && hasProgress(state));
  const headingId = useId();
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const shownStep = useRef(state.step);
  const submitting = state.status === 'submitting';

  // Claim the draft for this account before the effects below act on it. Another account's draft
  // is discarded, never shown. Signing in again after a refused session resolves that message.
  useEffect(() => {
    store.claim(owner);
    store.update(owner, { type: 'resume' });
  }, [store, owner]);

  // Business accounts carry their company and email; prefill only fills empty fields.
  function prefill() {
    if (user)
      store.update(user.id, {
        type: 'prefill',
        companyName: user.companyName,
        contactEmail: user.email,
      });
  }
  // prefill reads only `store` and `user`.
  useEffect(() => prefill(), [store, user]);

  function startOver() {
    setRestored(false);
    dispatch({ type: 'reset' });
    prefill();
  }

  // A new step moves focus to its heading; blocked progress moves focus to the error summary.
  useEffect(() => {
    if (shownStep.current === state.step) return;
    shownStep.current = state.step;
    stepHeading.current?.focus();
  }, [state.step]);
  useEffect(() => {
    if (state.errorRound > 0) summary.current?.focus();
  }, [state.errorRound]);

  usePageMeta({
    title:
      state.status === 'succeeded'
        ? t(demoMode ? 'b2b.receipt.demoTitle' : 'b2b.receipt.title')
        : `${t('b2b.wizard.title')} · ${t('b2b.wizard.stepCount', { current: state.step, total: STEPS.length })}`,
  });

  const numbers = new Intl.NumberFormat(locale);
  const errorValues = {
    min: numbers.format(QUANTITY_MIN),
    max: numbers.format(QUANTITY_MAX),
    companyMax: numbers.format(COMPANY_MAX),
    notesMax: numbers.format(NOTES_MAX),
    fileMax: t('b2b.branding.maxSize'),
  };

  async function submit() {
    const errors = validateAll(state.draft, state.file);
    // A retry without edits resends the identical payload so the server can deduplicate it.
    const input = state.attempt ?? buildQuoteInput(state.draft, locale, createRequestId());
    if (hasErrors(errors) || !input || !state.file) {
      dispatch({ type: 'invalid', errors });
      return;
    }
    // The outcome is applied to this draft even if the page unmounts while the upload runs (for
    // example the session ends meanwhile), and never to a draft that has since been discarded.
    const { generation } = entry;
    store.settle(generation, { type: 'submitStart', input });
    try {
      const receipt = await submitQuote(input, state.file);
      store.settle(generation, { type: 'submitSuccess', receipt });
    } catch (error) {
      store.settle(generation, { type: 'submitFailure', failure: failureFromError(error) });
      // A refused session is recoverable: signing out lets the guard ask for sign-in, and the
      // draft (answers, file and the unsent attempt) waits in the store for the same account.
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        store.getSnapshot().generation === generation
      )
        logout();
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (state.step === 4) void submit();
    else dispatch({ type: 'next' });
  }

  const retryLabel = state.failure?.retrySame && state.attempt;
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-widest text-copper uppercase">
          {t('b2b.wizard.eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{t('b2b.wizard.title')}</h1>
        <p className="mt-3 max-w-prose text-cacao/80">{t('b2b.wizard.intro')}</p>
        {demoMode && (
          <p
            role="note"
            className="mt-4 max-w-prose rounded border border-copper/60 bg-white/70 p-3 text-sm"
          >
            {t('b2b.wizard.demoNotice')}
          </p>
        )}
        {restored && state.status === 'editing' && (
          <div
            role="note"
            className="mt-4 flex max-w-prose flex-wrap items-center justify-between gap-3 rounded border border-line bg-white/70 p-3 text-sm"
          >
            <p>{t('b2b.wizard.restored')}</p>
            <Button variant="secondary" onClick={startOver}>
              {t('b2b.wizard.startOver')}
            </Button>
          </div>
        )}
      </header>

      {state.status === 'succeeded' && state.receipt ? (
        <QuoteReceiptView receipt={state.receipt} demoMode={demoMode} onReset={startOver} />
      ) : (
        <>
          <WizardStepper
            step={state.step}
            furthest={state.furthest}
            onSelect={(step) => dispatch({ type: 'goTo', step })}
          />
          <form
            noValidate
            onSubmit={onSubmit}
            aria-labelledby={headingId}
            className="mt-8 space-y-8"
          >
            <div>
              <h2
                id={headingId}
                ref={stepHeading}
                tabIndex={-1}
                className="text-2xl font-semibold focus-visible:outline-none"
              >
                {t(`b2b.wizard.step${state.step}.title`)}
              </h2>
              <p className="mt-2 max-w-prose text-cacao/80">
                {t(`b2b.wizard.step${state.step}.intro`)}
              </p>
            </div>

            {state.showSummary && hasErrors(state.errors) && (
              <ErrorSummary ref={summary} errors={state.errors} values={errorValues} />
            )}

            {state.step === 1 && (
              <CacaoStep
                draft={state.draft}
                errors={state.errors}
                dispatch={dispatch}
                values={errorValues}
              />
            )}
            {state.step === 2 && (
              <BrandingStep
                file={state.file}
                errors={state.errors}
                dispatch={dispatch}
                values={errorValues}
              />
            )}
            {state.step === 3 && (
              <PackagingStep
                draft={state.draft}
                errors={state.errors}
                dispatch={dispatch}
                values={errorValues}
              />
            )}
            {state.step === 4 && (
              <ReviewStep
                draft={state.draft}
                file={state.file}
                locale={locale}
                onEdit={(step) => dispatch({ type: 'goTo', step })}
              />
            )}

            {state.step === 4 && state.failure && (
              <div role="alert" className="rounded border-2 border-error bg-white p-4">
                <p className="font-semibold">{t(state.failure.messageKey)}</p>
                <p className="mt-1 text-sm text-cacao/80">{t('b2b.submit.keptNote')}</p>
              </div>
            )}
            <p role="status" className="sr-only">
              {submitting ? t('b2b.submit.sending') : ''}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
              {state.step > 1 ? (
                <Button
                  variant="secondary"
                  onClick={() => dispatch({ type: 'back' })}
                  disabled={submitting}
                >
                  {t('b2b.wizard.back')}
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" pending={submitting}>
                {state.step < 4
                  ? t('b2b.wizard.next')
                  : t(retryLabel ? 'b2b.submit.retry' : 'b2b.submit.send')}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
