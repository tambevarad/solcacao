// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { QuoteInput, QuoteReceipt, User } from '../../contracts/index.js';
import { ApiError } from '../../client/src/api/http.js';
import QuoteWizardPage, {
  type SubmitQuote,
} from '../../client/src/features/b2b/pages/QuoteWizardPage.js';
import { MAX_FILE_BYTES } from '../../client/src/features/b2b/options.js';
import { pdfFile, renderInLayout } from './harness.js';

// Stand-in for Student 1's published useAuth() port: a signed-in business account. Access
// control itself (RequireRole) is covered in guard.test.tsx.
const auth = vi.hoisted(() => ({
  user: {
    id: '0000000000000000000000b2',
    name: 'Test Buyer',
    email: 'buyer@example.test',
    role: 'b2b',
    companyName: 'Test Co',
  } satisfies User,
}));
vi.mock('../../client/src/features/auth/public.js', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  RequireAuth: ({ children }: { children: ReactNode }) => children,
  RequireRole: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: auth.user,
    ready: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

const IDS = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'];
const receipt: QuoteReceipt = {
  id: '0123456789abcdef01234567',
  status: 'submitted',
  createdAt: '2026-10-25T12:00:00.000Z',
  notificationStatus: 'pending',
};

function setup(
  submitQuote: SubmitQuote = vi.fn(async () => receipt),
  entry = '/en/wholesale/request',
) {
  const ids = [...IDS];
  const createRequestId = vi.fn(() => ids.shift() ?? 'unexpected');
  renderInLayout(
    entry,
    <QuoteWizardPage submitQuote={submitQuote} createRequestId={createRequestId} />,
    'wholesale/request',
  );
  return { createRequestId };
}

const continueButton = () => screen.getByRole('button', { name: 'Continue' });
const stepHeading = (name: string) => screen.findByRole('heading', { level: 2, name });

async function chooseFile(file: File) {
  fireEvent.change(screen.getByLabelText(/branding file \(PDF\)/i), { target: { files: [file] } });
}

async function completeStepOne() {
  fireEvent.click(await screen.findByRole('radio', { name: /Dark 70%/ }));
  fireEvent.change(screen.getByLabelText(/Quantity \(units\)/), { target: { value: '250' } });
  fireEvent.click(continueButton());
  await stepHeading('Branding file');
}

async function completeStepTwo(file = pdfFile()) {
  await chooseFile(file);
  expect(await screen.findByTestId('selected-file')).toHaveTextContent(file.name);
  fireEvent.click(continueButton());
  await stepHeading('Packaging and contact');
}

async function completeStepThree() {
  fireEvent.click(screen.getByRole('radio', { name: /Gift box/ }));
  fireEvent.click(continueButton());
  await stepHeading('Review and send');
}

async function reachReview() {
  await completeStepOne();
  await completeStepTwo();
  await completeStepThree();
}

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('quote wizard steps', () => {
  it('cannot skip required values and moves focus to the error summary', async () => {
    setup();
    await stepHeading('Cacao and quantity');
    fireEvent.change(screen.getByLabelText(/Quantity \(units\)/), { target: { value: '49' } });
    fireEvent.click(continueButton());
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveTextContent('Please fix the following before continuing');
    expect(summary).toHaveTextContent('Cacao profile: Choose a cacao profile.');
    expect(summary).toHaveTextContent(
      'Quantity (units): Enter a whole number between 50 and 100,000.',
    );
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.getByLabelText(/Quantity \(units\)/)).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Cacao and quantity' }),
    ).toBeInTheDocument();

    fireEvent.click(within(summary).getByRole('link', { name: /Quantity/ }));
    expect(screen.getByLabelText(/Quantity \(units\)/)).toHaveFocus();
  });

  it('keeps answers across back, next and edits from the review', async () => {
    setup();
    await reachReview();
    const review = screen.getByRole('form');
    expect(review).toHaveTextContent('Dark 70%');
    expect(review).toHaveTextContent('250 units');
    expect(review).toHaveTextContent('brand.pdf');
    expect(review).toHaveTextContent('Gift box');
    expect(review).toHaveTextContent('Test Co');
    expect(review).toHaveTextContent('buyer@example.test');

    fireEvent.click(screen.getByRole('button', { name: 'Edit: Cacao and quantity' }));
    await stepHeading('Cacao and quantity');
    expect(screen.getByRole('radio', { name: /Dark 70%/ })).toBeChecked();
    expect(screen.getByLabelText(/Quantity \(units\)/)).toHaveValue('250');
    fireEvent.click(continueButton());
    await stepHeading('Branding file');
    expect(screen.getByTestId('selected-file')).toHaveTextContent('brand.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await stepHeading('Cacao and quantity');
  });

  it('prefills company and email from the signed-in business account', async () => {
    setup();
    await completeStepOne();
    await completeStepTwo();
    expect(screen.getByLabelText(/Company name/)).toHaveValue('Test Co');
    expect(screen.getByLabelText(/Contact email/)).toHaveValue('buyer@example.test');
  });
});

describe('branding file', () => {
  it('rejects a wrong type, an oversized file and a fake PDF', async () => {
    setup();
    await completeStepOne();
    await chooseFile(new File(['hello'], 'logo.png', { type: 'image/png' }));
    expect(await screen.findByText('The file must be a PDF.')).toBeInTheDocument();
    await chooseFile(
      new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'big.pdf', { type: 'application/pdf' }),
    );
    expect(
      await screen.findByText('The file is larger than 5 MB. Choose a smaller PDF.'),
    ).toBeInTheDocument();
    await chooseFile(new File(['not a pdf'], 'fake.pdf', { type: 'application/pdf' }));
    expect(await screen.findByText(/doesn't look like a valid PDF/)).toBeInTheDocument();
    expect(screen.queryByTestId('selected-file')).toBeNull();
    fireEvent.click(continueButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Upload your branding file as a PDF.',
    );
  });

  it('replacing the file updates the summary, and the file can be removed', async () => {
    setup();
    await completeStepOne();
    await chooseFile(pdfFile('logo-v1.pdf'));
    expect(await screen.findByTestId('selected-file')).toHaveTextContent('logo-v1.pdf');
    await chooseFile(pdfFile('logo-v2.pdf'));
    await waitFor(() =>
      expect(screen.getByTestId('selected-file')).toHaveTextContent('logo-v2.pdf'),
    );
    fireEvent.click(continueButton());
    await completeStepThree();
    expect(screen.getByRole('form')).toHaveTextContent('logo-v2.pdf');
    expect(screen.getByRole('form')).not.toHaveTextContent('logo-v1.pdf');

    fireEvent.click(screen.getByRole('button', { name: 'Edit: Branding file' }));
    fireEvent.click(await screen.findByRole('button', { name: /Remove file/ }));
    expect(screen.queryByTestId('selected-file')).toBeNull();
  });
});

describe('language switching', () => {
  it('keeps the step, answers and in-memory file when switching to Spanish at step 3', async () => {
    setup();
    await completeStepOne();
    await completeStepTwo(pdfFile('marca.pdf'));
    fireEvent.click(screen.getByRole('radio', { name: /Bulk/ }));
    fireEvent.change(screen.getByLabelText(/Company name/), { target: { value: 'Hotel Prueba' } });

    fireEvent.click(screen.getAllByRole('link', { name: 'ES (Español)' })[0]);
    await stepHeading('Empaque y contacto');
    expect(screen.getByTestId('location')).toHaveTextContent('/es/wholesale/request');
    expect(screen.getByLabelText(/Nombre de la empresa/)).toHaveValue('Hotel Prueba');
    expect(screen.getByRole('radio', { name: /A granel/ })).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }));
    await stepHeading('Archivo de marca');
    expect(screen.getByTestId('selected-file')).toHaveTextContent('marca.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(screen.getByLabelText(/Cantidad \(unidades\)/)).toHaveValue('250');
  });
});

describe('submission', () => {
  it('keeps everything after a failure and retries with the same requestId and file', async () => {
    const submitQuote = vi
      .fn<SubmitQuote>()
      .mockRejectedValueOnce(new ApiError(503, 'SERVICE_UNAVAILABLE', 'Unavailable'))
      .mockResolvedValueOnce(receipt);
    setup(submitQuote);
    await reachReview();
    fireEvent.click(screen.getByRole('button', { name: 'Send quote request' }));

    const alert = await screen.findByText(
      "We couldn't send your request. Check your connection and try again.",
    );
    expect(alert.closest('[role="alert"]')).toHaveTextContent(
      'Your answers and file are still here.',
    );
    expect(screen.getByRole('form')).toHaveTextContent('brand.pdf');
    expect(screen.getByRole('form')).toHaveTextContent('250 units');

    fireEvent.click(screen.getByRole('button', { name: 'Try sending again' }));
    expect(
      await screen.findByRole('heading', { name: 'Demo quote request completed' }),
    ).toBeInTheDocument();
    const [first, second] = submitQuote.mock.calls;
    expect(second[0]).toEqual(first[0]);
    expect(second[0].requestId).toBe(IDS[0]);
    expect(second[1]).toBe(first[1]);
  });

  it('starts a new request id once the shopper edits after a failure', async () => {
    const submitQuote = vi
      .fn<SubmitQuote>()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(receipt);
    setup(submitQuote);
    await reachReview();
    fireEvent.click(screen.getByRole('button', { name: 'Send quote request' }));
    await screen.findByText(/couldn't send your request/);

    fireEvent.click(screen.getByRole('button', { name: 'Edit: Packaging and contact' }));
    fireEvent.change(await screen.findByLabelText(/Notes/), {
      target: { value: 'Matte gold foil' },
    });
    fireEvent.click(continueButton());
    await stepHeading('Review and send');
    fireEvent.click(screen.getByRole('button', { name: 'Send quote request' }));
    await screen.findByRole('heading', { name: 'Demo quote request completed' });

    const sent: QuoteInput[] = submitQuote.mock.calls.map(([input]) => input);
    expect(sent.map((input) => input.requestId)).toEqual(IDS);
    expect(sent[1].notes).toBe('Matte gold foil');
  });

  it('blocks duplicate submits while a request is pending', async () => {
    let resolve: (value: QuoteReceipt) => void = () => {};
    const submitQuote = vi.fn<SubmitQuote>(
      () => new Promise<QuoteReceipt>((done) => (resolve = done)),
    );
    setup(submitQuote);
    await reachReview();
    const send = screen.getByRole('button', { name: 'Send quote request' });
    fireEvent.click(send);
    fireEvent.click(send);
    await waitFor(() => expect(send).toBeDisabled());
    expect(send).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    expect(submitQuote).toHaveBeenCalledTimes(1);
    resolve(receipt);
    await screen.findByRole('heading', { name: 'Demo quote request completed' });
  });

  it('returns to the step that holds a server-side field error', async () => {
    setup(
      vi
        .fn<SubmitQuote>()
        .mockRejectedValue(
          new ApiError(400, 'VALIDATION_ERROR', 'Invalid request', { companyName: 'Required' }),
        ),
    );
    await reachReview();
    fireEvent.click(screen.getByRole('button', { name: 'Send quote request' }));
    await stepHeading('Packaging and contact');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Company name: The server did not accept this value.',
    );
  });

  it('shows a truthful demo receipt and clears the draft only after success', async () => {
    setup();
    await reachReview();
    fireEvent.click(screen.getByRole('button', { name: 'Send quote request' }));
    const heading = await screen.findByRole('heading', { name: 'Demo quote request completed' });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText(/was not saved on a server and no email was sent/)).toBeInTheDocument();
    expect(screen.getByText(receipt.id)).toBeInTheDocument();
    expect(screen.getByText('Not sent')).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Demo quote request completed · SolCacao'));

    fireEvent.click(screen.getByRole('button', { name: 'Start another request' }));
    await stepHeading('Cacao and quantity');
    expect(screen.getByRole('radio', { name: /Dark 70%/ })).not.toBeChecked();
    expect(screen.getByLabelText(/Quantity \(units\)/)).toHaveValue('');
  });

  it('reports a failed notification without asking for a resubmission', async () => {
    setup(vi.fn<SubmitQuote>().mockResolvedValue({ ...receipt, notificationStatus: 'failed' }));
    await reachReview();
    fireEvent.click(screen.getByRole('button', { name: 'Send quote request' }));
    await screen.findByRole('heading', { name: 'Demo quote request completed' });
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText(/You don't need to send the request again/)).toBeInTheDocument();
  });
});
