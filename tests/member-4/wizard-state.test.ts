import { describe, expect, it } from 'vitest';
import type { QuoteInput, QuoteReceipt } from '../../contracts/index.js';
import { quoteSchema } from '../../contracts/validation.js';
import { ApiError } from '../../client/src/api/http.js';
import { NotImplementedError } from '../../client/src/api/notImplemented.js';
import { checkPdf, displayFileName } from '../../client/src/features/b2b/file.js';
import {
  COMPANY_MAX,
  MAX_FILE_BYTES,
  NOTES_MAX,
  QUANTITY_MAX,
  QUANTITY_MIN,
} from '../../client/src/features/b2b/options.js';
import {
  STEPS,
  buildQuoteInput,
  failureFromError,
  initialWizardState,
  validateAll,
  wizardReducer,
  type WizardAction,
  type WizardState,
} from '../../client/src/features/b2b/wizard.js';

const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const pdf = () => new File(['%PDF-1.4\n'], 'brand.pdf', { type: 'application/pdf' });

function apply(state: WizardState, ...actions: WizardAction[]): WizardState {
  return actions.reduce(wizardReducer, state);
}
const run = (...actions: WizardAction[]) => apply(initialWizardState(), ...actions);

const stepOne: WizardAction[] = [
  { type: 'cacao', value: 'dark70' },
  { type: 'text', field: 'quantity', value: '250' },
  { type: 'next' },
];
const stepThree: WizardAction[] = [
  { type: 'packaging', value: 'giftBox' },
  { type: 'text', field: 'companyName', value: '  Test Co  ' },
  { type: 'text', field: 'contactEmail', value: 'buyer@example.test' },
  { type: 'next' },
];
function atReview() {
  return run(...stepOne, { type: 'file', file: pdf() }, { type: 'next' }, ...stepThree);
}

describe('wizard contract', () => {
  it('has exactly four steps', () => {
    expect(STEPS).toEqual([1, 2, 3, 4]);
  });

  it('uses the same bounds as the shared quote schema', () => {
    const base: QuoteInput = {
      cacaoProfile: 'dark70',
      quantity: QUANTITY_MIN,
      packaging: 'bulk',
      companyName: 'Test Co',
      contactEmail: 'buyer@example.test',
      locale: 'en',
      requestId: REQUEST_ID,
    };
    expect(quoteSchema.safeParse(base).success).toBe(true);
    expect(quoteSchema.safeParse({ ...base, quantity: QUANTITY_MIN - 1 }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...base, quantity: QUANTITY_MAX }).success).toBe(true);
    expect(quoteSchema.safeParse({ ...base, quantity: QUANTITY_MAX + 1 }).success).toBe(false);
    expect(
      quoteSchema.safeParse({ ...base, companyName: 'x'.repeat(COMPANY_MAX + 1) }).success,
    ).toBe(false);
    expect(quoteSchema.safeParse({ ...base, notes: 'x'.repeat(NOTES_MAX + 1) }).success).toBe(
      false,
    );
  });
});

describe('step gating', () => {
  it('cannot leave step 1 without a cacao profile and a valid whole quantity', () => {
    const blocked = run({ type: 'text', field: 'quantity', value: '49' }, { type: 'next' });
    expect(blocked.step).toBe(1);
    expect(blocked.errors).toEqual({
      cacaoProfile: 'b2b.errors.cacaoRequired',
      quantity: 'b2b.errors.quantityRange',
    });
    expect(blocked.errorRound).toBe(1);
    for (const value of ['', '12.5', '1e3', '100001', ' 50x'])
      expect(
        run(
          { type: 'cacao', value: 'dark85' },
          { type: 'text', field: 'quantity', value },
          { type: 'next' },
        ).step,
      ).toBe(1);
    expect(run(...stepOne).step).toBe(2);
  });

  it('requires a file on step 2 and complete contact details on step 3', () => {
    const noFile = run(...stepOne, { type: 'next' });
    expect(noFile.step).toBe(2);
    expect(noFile.errors.designFile).toBe('b2b.errors.fileRequired');
    const stepThreeBlocked = run(
      ...stepOne,
      { type: 'file', file: pdf() },
      { type: 'next' },
      { type: 'text', field: 'contactEmail', value: 'not-an-email' },
      { type: 'next' },
    );
    expect(stepThreeBlocked.step).toBe(3);
    expect(Object.keys(stepThreeBlocked.errors).sort()).toEqual([
      'companyName',
      'contactEmail',
      'packaging',
    ]);
  });

  it('keeps answers when moving back and only jumps to reached steps', () => {
    const review = atReview();
    expect(review.step).toBe(4);
    const back = wizardReducer(wizardReducer(review, { type: 'back' }), { type: 'back' });
    expect(back.step).toBe(2);
    expect(back.draft.quantity).toBe('250');
    expect(back.file?.name).toBe('brand.pdf');
    expect(wizardReducer(run(...stepOne), { type: 'goTo', step: 4 }).step).toBe(2);
  });

  it('still gates every step in between when jumping forward from the stepper', () => {
    const review = atReview();
    const editing = wizardReducer(wizardReducer(review, { type: 'goTo', step: 1 }), {
      type: 'text',
      field: 'quantity',
      value: '10',
    });
    const jumped = wizardReducer(editing, { type: 'goTo', step: 4 });
    expect(jumped.step).toBe(1);
    expect(jumped.errors.quantity).toBe('b2b.errors.quantityRange');
  });

  it('validates every step again at review', () => {
    expect(validateAll(initialWizardState().draft, null)).toMatchObject({
      cacaoProfile: expect.any(String),
      quantity: expect.any(String),
      designFile: expect.any(String),
      packaging: expect.any(String),
    });
    const invalid = wizardReducer(atReview(), { type: 'invalid', errors: { companyName: 'x' } });
    expect(invalid.step).toBe(3);
  });
});

describe('files', () => {
  it('keeps an accepted file when a replacement is rejected, and replaces it with a valid one', () => {
    const accepted = run({ type: 'file', file: pdf() });
    const rejected = wizardReducer(accepted, {
      type: 'fileRejected',
      errorKey: 'b2b.errors.fileType',
    });
    expect(rejected.file?.name).toBe('brand.pdf');
    expect(rejected.errors.designFile).toBe('b2b.errors.fileType');
    const replaced = wizardReducer(rejected, {
      type: 'file',
      file: new File(['%PDF-1.7'], 'logo-v2.pdf', { type: 'application/pdf' }),
    });
    expect(replaced.file?.name).toBe('logo-v2.pdf');
    expect(replaced.errors.designFile).toBeUndefined();
    expect(wizardReducer(replaced, { type: 'removeFile' }).file).toBeNull();
  });

  it('pre-checks type, size, emptiness and the PDF signature', async () => {
    expect(await checkPdf(pdf())).toBeNull();
    expect(await checkPdf(new File(['%PDF-'], 'brand.png', { type: 'application/pdf' }))).toBe(
      'type',
    );
    expect(await checkPdf(new File(['%PDF-'], 'brand.pdf', { type: 'text/plain' }))).toBe('type');
    expect(await checkPdf(new File([], 'empty.pdf', { type: 'application/pdf' }))).toBe('empty');
    expect(await checkPdf(new File(['hello'], 'fake.pdf', { type: 'application/pdf' }))).toBe(
      'signature',
    );
    const big = new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'big.pdf', {
      type: 'application/pdf',
    });
    expect(await checkPdf(big)).toBe('size');
  });

  it('shows only a safe display name', () => {
    expect(displayFileName('C:\\fakepath\\logo\u0007.pdf')).toBe('logo.pdf');
    expect(displayFileName('../../secret/brand.pdf')).toBe('brand.pdf');
    expect(displayFileName('')).toBe('design.pdf');
    expect(displayFileName(`${'a'.repeat(200)}.pdf`).length).toBeLessThanOrEqual(121);
  });
});

describe('submission and retries', () => {
  const receipt: QuoteReceipt = {
    id: '0123456789abcdef01234567',
    status: 'submitted',
    createdAt: '2026-10-25T12:00:00.000Z',
    notificationStatus: 'pending',
  };

  it('builds a trimmed contract payload with the current locale and request id', () => {
    const input = buildQuoteInput(atReview().draft, 'es', REQUEST_ID);
    expect(input).toEqual({
      cacaoProfile: 'dark70',
      quantity: 250,
      packaging: 'giftBox',
      companyName: 'Test Co',
      contactEmail: 'buyer@example.test',
      locale: 'es',
      requestId: REQUEST_ID,
    });
    expect(buildQuoteInput(initialWizardState().draft, 'en', REQUEST_ID)).toBeNull();
    expect(buildQuoteInput(atReview().draft, 'en', 'not-a-uuid')).toBeNull();
  });

  it('keeps draft, file and attempt after a retryable failure, and clears the attempt on edit', () => {
    const input = buildQuoteInput(atReview().draft, 'en', REQUEST_ID);
    if (!input) throw new Error('fixture draft should be valid');
    const failed = apply(
      atReview(),
      { type: 'submitStart', input },
      { type: 'submitFailure', failure: failureFromError(new TypeError('Failed to fetch')) },
    );
    expect(failed.status).toBe('editing');
    expect(failed.attempt).toEqual(input);
    expect(failed.file?.name).toBe('brand.pdf');
    expect(failed.draft.quantity).toBe('250');
    expect(failed.failure?.messageKey).toBe('b2b.submit.errorGeneric');
    const edited = wizardReducer(failed, { type: 'text', field: 'notes', value: 'Matte finish' });
    expect(edited.attempt).toBeNull();
    expect(edited.failure).toBeNull();
  });

  it('ignores edits while a submission is pending', () => {
    const input = buildQuoteInput(atReview().draft, 'en', REQUEST_ID);
    if (!input) throw new Error('fixture draft should be valid');
    const pending = wizardReducer(atReview(), { type: 'submitStart', input });
    expect(wizardReducer(pending, { type: 'text', field: 'notes', value: 'x' })).toBe(pending);
    expect(wizardReducer(pending, { type: 'back' })).toBe(pending);
  });

  it('clears the draft and file only after a confirmed receipt', () => {
    const input = buildQuoteInput(atReview().draft, 'en', REQUEST_ID);
    if (!input) throw new Error('fixture draft should be valid');
    const done = apply(
      atReview(),
      { type: 'submitStart', input },
      { type: 'submitSuccess', receipt },
    );
    expect(done.status).toBe('succeeded');
    expect(done.receipt).toEqual(receipt);
    expect(done.file).toBeNull();
    expect(done.draft.companyName).toBe('');
  });

  it('prefills company and email without overwriting typed values', () => {
    const typed = run({ type: 'text', field: 'companyName', value: 'Typed Co' });
    const prefilled = wizardReducer(typed, {
      type: 'prefill',
      companyName: 'Account Co',
      contactEmail: 'account@example.test',
    });
    expect(prefilled.draft.companyName).toBe('Typed Co');
    expect(prefilled.draft.contactEmail).toBe('account@example.test');
  });

  it('maps API errors to recoverable states', () => {
    expect(failureFromError(new NotImplementedError('auth.me'))).toMatchObject({
      messageKey: 'b2b.submit.errorUnavailable',
      retrySame: true,
    });
    expect(failureFromError(new ApiError(401, 'UNAUTHORIZED', 'x')).retrySame).toBe(true);
    expect(failureFromError(new ApiError(403, 'FORBIDDEN', 'x')).retrySame).toBe(false);
    expect(failureFromError(new ApiError(413, 'FILE_TOO_LARGE', 'x')).fieldErrors).toEqual({
      designFile: 'b2b.errors.fileSize',
    });
    expect(failureFromError(new ApiError(415, 'UNSUPPORTED_FILE', 'x')).fieldErrors).toEqual({
      designFile: 'b2b.errors.fileType',
    });
    expect(
      failureFromError(
        new ApiError(400, 'VALIDATION_ERROR', 'x', { companyName: 'bad', requestId: 'bad' }),
      ).fieldErrors,
    ).toEqual({ companyName: 'b2b.errors.serverRejected' });
    expect(failureFromError(new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'x')).retrySame).toBe(false);
    expect(failureFromError(new ApiError(503, 'SERVICE_UNAVAILABLE', 'x'))).toMatchObject({
      messageKey: 'b2b.submit.errorGeneric',
      retrySame: true,
    });
  });

  it('sends the shopper back to the step that holds a server-side field error', () => {
    const input = buildQuoteInput(atReview().draft, 'en', REQUEST_ID);
    if (!input) throw new Error('fixture draft should be valid');
    const failed = apply(
      atReview(),
      { type: 'submitStart', input },
      {
        type: 'submitFailure',
        failure: failureFromError(new ApiError(413, 'FILE_TOO_LARGE', 'x')),
      },
    );
    expect(failed.step).toBe(2);
    expect(failed.errors.designFile).toBe('b2b.errors.fileSize');
    expect(failed.attempt).toBeNull();
  });
});
