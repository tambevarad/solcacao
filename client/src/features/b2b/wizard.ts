import type {
  CacaoProfile,
  Locale,
  Packaging,
  QuoteInput,
  QuoteReceipt,
} from '../../../../contracts/index.js';
import { quoteSchema } from '../../../../contracts/validation.js';
import { ApiError } from '../../api/http.js';
import { NotImplementedError } from '../../api/notImplemented.js';
import {
  CACAO_PROFILES,
  COMPANY_MAX,
  NOTES_MAX,
  PACKAGING_OPTIONS,
  QUANTITY_MAX,
  QUANTITY_MIN,
} from './options.js';

/** The contract fixes exactly four steps (docs/contracts.md, "B2B quote"). */
export const STEPS = [1, 2, 3, 4] as const;
export type Step = (typeof STEPS)[number];
const NEXT: Record<Step, Step> = { 1: 2, 2: 3, 3: 4, 4: 4 };
const PREVIOUS: Record<Step, Step> = { 1: 1, 2: 1, 3: 2, 4: 3 };

export type TextField = 'quantity' | 'companyName' | 'contactEmail' | 'notes';
export type FieldName = 'cacaoProfile' | 'packaging' | 'designFile' | TextField;

/** Inputs owned by each step. Step 4 is the review and owns none. */
export const STEP_FIELDS: Record<Step, readonly FieldName[]> = {
  1: ['cacaoProfile', 'quantity'],
  2: ['designFile'],
  3: ['packaging', 'companyName', 'contactEmail', 'notes'],
  4: [],
};

export interface QuoteDraft {
  cacaoProfile: CacaoProfile | '';
  quantity: string;
  packaging: Packaging | '';
  companyName: string;
  contactEmail: string;
  notes: string;
}

/** Values are translation keys, so a language switch re-renders messages without revalidating. */
export type FieldErrors = Partial<Record<FieldName, string>>;

export interface SubmitFailure {
  /** Translation key for the alert on the review step. */
  messageKey: string;
  fieldErrors?: FieldErrors;
  /** True when resending the identical payload (same requestId) is the right retry. */
  retrySame: boolean;
}

export interface WizardState {
  step: Step;
  /** Furthest step reached. Completed steps stay editable from the stepper. */
  furthest: Step;
  draft: QuoteDraft;
  /** In memory only: never written to browser storage, so a page reload requires reselection. */
  file: File | null;
  errors: FieldErrors;
  /** True after progress was blocked; inline errors alone (e.g. a rejected file) don't show it. */
  showSummary: boolean;
  /** Increments whenever validation blocks progress, so the page can focus the error summary. */
  errorRound: number;
  /**
   * Exact payload of the last attempt. A retry resends it unchanged (same requestId), so a lost
   * response cannot create a second request; any edit clears it and the next submit is new.
   */
  attempt: QuoteInput | null;
  status: 'editing' | 'submitting' | 'succeeded';
  failure: SubmitFailure | null;
  receipt: QuoteReceipt | null;
}

export type WizardAction =
  | { type: 'cacao'; value: CacaoProfile }
  | { type: 'packaging'; value: Packaging }
  | { type: 'text'; field: TextField; value: string }
  | { type: 'prefill'; companyName?: string; contactEmail?: string }
  | { type: 'file'; file: File }
  | { type: 'fileRejected'; errorKey: string }
  | { type: 'removeFile' }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'goTo'; step: Step }
  | { type: 'invalid'; errors: FieldErrors }
  | { type: 'submitStart'; input: QuoteInput }
  | { type: 'submitSuccess'; receipt: QuoteReceipt }
  | { type: 'submitFailure'; failure: SubmitFailure }
  /** The shopper signed in again after the server refused an ended session. */
  | { type: 'resume' }
  | { type: 'reset' };

/** Message for a submission the server refused because the session had ended (401). */
export const SESSION_ENDED_KEY = 'b2b.submit.errorUnauthorized';

export const emptyDraft: QuoteDraft = {
  cacaoProfile: '',
  quantity: '',
  packaging: '',
  companyName: '',
  contactEmail: '',
  notes: '',
};

export function initialWizardState(): WizardState {
  return {
    step: 1,
    furthest: 1,
    draft: emptyDraft,
    file: null,
    errors: {},
    showSummary: false,
    errorRound: 0,
    attempt: null,
    status: 'editing',
    failure: null,
    receipt: null,
  };
}

/**
 * True when the wizard holds something the shopper entered: a later step, a choice, a quantity,
 * notes or a file. Company and email alone don't count, because they are prefilled from the account.
 */
export function hasProgress(state: WizardState): boolean {
  const { cacaoProfile, quantity, packaging, notes } = state.draft;
  return (
    state.status !== 'succeeded' &&
    (state.furthest > 1 ||
      state.file !== null ||
      [cacaoProfile, quantity, packaging, notes].some((value) => value !== ''))
  );
}

export function isCacaoProfile(value: string): value is CacaoProfile {
  return CACAO_PROFILES.some((profile) => profile === value);
}

export function isPackaging(value: string): value is Packaging {
  return PACKAGING_OPTIONS.some((option) => option === value);
}

/** Whole units only, within the D06 bounds; anything else is null. */
export function parseQuantity(raw: string): number | null {
  const value = raw.trim();
  if (!/^\d{1,6}$/.test(value)) return null;
  const quantity = Number(value);
  return quantity >= QUANTITY_MIN && quantity <= QUANTITY_MAX ? quantity : null;
}

const emailSchema = quoteSchema.shape.contactEmail;

function fieldError(field: FieldName, draft: QuoteDraft, file: File | null): string | undefined {
  switch (field) {
    case 'cacaoProfile':
      return draft.cacaoProfile ? undefined : 'b2b.errors.cacaoRequired';
    case 'quantity':
      return parseQuantity(draft.quantity) === null ? 'b2b.errors.quantityRange' : undefined;
    case 'designFile':
      return file ? undefined : 'b2b.errors.fileRequired';
    case 'packaging':
      return draft.packaging ? undefined : 'b2b.errors.packagingRequired';
    case 'companyName': {
      const value = draft.companyName.trim();
      if (!value) return 'b2b.errors.companyRequired';
      return value.length > COMPANY_MAX ? 'b2b.errors.companyTooLong' : undefined;
    }
    case 'contactEmail':
      return emailSchema.safeParse(draft.contactEmail.trim()).success
        ? undefined
        : 'b2b.errors.emailInvalid';
    case 'notes':
      return draft.notes.trim().length > NOTES_MAX ? 'b2b.errors.notesTooLong' : undefined;
  }
}

/** Validates only the inputs owned by `step`. */
export function validateStep(step: Step, draft: QuoteDraft, file: File | null): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of STEP_FIELDS[step]) {
    const error = fieldError(field, draft, file);
    if (error) errors[field] = error;
  }
  return errors;
}

/** Full validation used on the review step before submitting. */
export function validateAll(draft: QuoteDraft, file: File | null): FieldErrors {
  return {
    ...validateStep(1, draft, file),
    ...validateStep(2, draft, file),
    ...validateStep(3, draft, file),
  };
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function firstStepWithError(errors: FieldErrors): Step | null {
  return STEPS.find((step) => STEP_FIELDS[step].some((field) => errors[field])) ?? null;
}

/** Builds the contract payload, or null when the draft is not yet valid. */
export function buildQuoteInput(
  draft: QuoteDraft,
  locale: Locale,
  requestId: string,
): QuoteInput | null {
  const quantity = parseQuantity(draft.quantity);
  if (!draft.cacaoProfile || !draft.packaging || quantity === null) return null;
  const notes = draft.notes.trim();
  const input: QuoteInput = {
    cacaoProfile: draft.cacaoProfile,
    quantity,
    packaging: draft.packaging,
    companyName: draft.companyName.trim(),
    contactEmail: draft.contactEmail.trim(),
    ...(notes ? { notes } : {}),
    locale,
    requestId,
  };
  return quoteSchema.safeParse(input).success ? input : null;
}

function withoutError(errors: FieldErrors, field: FieldName): FieldErrors {
  const next = { ...errors };
  delete next[field];
  return next;
}

/** Any edit starts a new submission: the old attempt and its failure no longer apply. */
function edited(state: WizardState, patch: Partial<WizardState>): WizardState {
  return { ...state, ...patch, attempt: null, failure: null };
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  if (
    state.status === 'submitting' &&
    action.type !== 'submitSuccess' &&
    action.type !== 'submitFailure'
  )
    return state;
  switch (action.type) {
    case 'cacao':
      return edited(state, {
        draft: { ...state.draft, cacaoProfile: action.value },
        errors: withoutError(state.errors, 'cacaoProfile'),
      });
    case 'packaging':
      return edited(state, {
        draft: { ...state.draft, packaging: action.value },
        errors: withoutError(state.errors, 'packaging'),
      });
    case 'text':
      return edited(state, {
        draft: { ...state.draft, [action.field]: action.value },
        errors: withoutError(state.errors, action.field),
      });
    case 'prefill': {
      // Only fills empty fields, so it never overwrites what the shopper typed.
      const draft = { ...state.draft };
      if (!draft.companyName && action.companyName) draft.companyName = action.companyName;
      if (!draft.contactEmail && action.contactEmail) draft.contactEmail = action.contactEmail;
      return { ...state, draft };
    }
    case 'file':
      return edited(state, { file: action.file, errors: withoutError(state.errors, 'designFile') });
    case 'fileRejected':
      // Keeps a previously accepted file: a bad replacement must not discard a good one.
      return { ...state, errors: { ...state.errors, designFile: action.errorKey } };
    case 'removeFile':
      return edited(state, { file: null });
    case 'next': {
      if (state.step === 4) return state;
      const errors = validateStep(state.step, state.draft, state.file);
      if (hasErrors(errors))
        return { ...state, errors, showSummary: true, errorRound: state.errorRound + 1 };
      const step = NEXT[state.step];
      return {
        ...state,
        step,
        furthest: step > state.furthest ? step : state.furthest,
        errors: {},
        showSummary: false,
      };
    }
    case 'back':
      return { ...state, step: PREVIOUS[state.step], errors: {}, showSummary: false };
    case 'goTo': {
      if (action.step > state.furthest) return state;
      // Jumping forward still gates every step in between.
      for (const step of STEPS) {
        if (step < state.step || step >= action.step) continue;
        const errors = validateStep(step, state.draft, state.file);
        if (hasErrors(errors))
          return { ...state, step, errors, showSummary: true, errorRound: state.errorRound + 1 };
      }
      return { ...state, step: action.step, errors: {}, showSummary: false };
    }
    case 'invalid': {
      const step = firstStepWithError(action.errors) ?? state.step;
      return {
        ...state,
        step,
        errors: action.errors,
        showSummary: true,
        errorRound: state.errorRound + 1,
      };
    }
    case 'submitStart':
      return { ...state, status: 'submitting', attempt: action.input, failure: null };
    case 'submitSuccess':
      // Draft and file are cleared only after a confirmed receipt.
      return { ...initialWizardState(), status: 'succeeded', receipt: action.receipt };
    case 'submitFailure': {
      const errors = action.failure.fieldErrors ?? {};
      const errorStep = firstStepWithError(errors);
      return {
        ...state,
        status: 'editing',
        failure: action.failure,
        attempt: action.failure.retrySame ? state.attempt : null,
        errors,
        showSummary: errorStep !== null,
        step: errorStep ?? state.step,
        errorRound: errorStep ? state.errorRound + 1 : state.errorRound,
      };
    }
    case 'resume':
      // The "session ended" message no longer applies; the kept attempt can be sent as it is.
      return state.failure?.messageKey === SESSION_ENDED_KEY ? { ...state, failure: null } : state;
    case 'reset':
      return initialWizardState();
  }
}

function isFieldName(value: string): value is FieldName {
  return STEPS.some((step) => STEP_FIELDS[step].some((field) => field === value));
}

/** Maps a submission error to a recoverable, translated state. Draft and file are always kept. */
export function failureFromError(error: unknown): SubmitFailure {
  if (error instanceof NotImplementedError)
    return { messageKey: 'b2b.submit.errorUnavailable', retrySame: true };
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        return { messageKey: SESSION_ENDED_KEY, retrySame: true };
      case 'FORBIDDEN':
        return { messageKey: 'b2b.submit.errorForbidden', retrySame: false };
      case 'FILE_TOO_LARGE':
        return {
          messageKey: 'b2b.submit.errorFile',
          fieldErrors: { designFile: 'b2b.errors.fileSize' },
          retrySame: false,
        };
      case 'UNSUPPORTED_FILE':
        return {
          messageKey: 'b2b.submit.errorFile',
          fieldErrors: { designFile: 'b2b.errors.fileType' },
          retrySame: false,
        };
      case 'VALIDATION_ERROR': {
        const fieldErrors: FieldErrors = {};
        for (const name of Object.keys(error.fieldErrors ?? {}))
          if (isFieldName(name)) fieldErrors[name] = 'b2b.errors.serverRejected';
        return { messageKey: 'b2b.submit.errorValidation', fieldErrors, retrySame: false };
      }
      case 'IDEMPOTENCY_CONFLICT':
        return { messageKey: 'b2b.submit.errorConflict', retrySame: false };
      case 'RATE_LIMITED':
        return { messageKey: 'b2b.submit.errorRateLimited', retrySame: true };
    }
  }
  return { messageKey: 'b2b.submit.errorGeneric', retrySame: true };
}
