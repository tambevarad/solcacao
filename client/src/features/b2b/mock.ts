import type {
  B2bApi,
  HttpClient,
  QuoteInput,
  QuoteReceipt,
  User,
} from '../../../../contracts/index.js';
import { quoteSchema } from '../../../../contracts/validation.js';
import { ApiError } from '../../api/http.js';
import { createMockAuth } from '../auth/mock.js';
import { MAX_FILE_BYTES } from './options.js';

/**
 * Demo outcomes for the Phase 2 mock. Choose one for a local demo with
 * VITE_B2B_MOCK_SCENARIO=fail-first|notification-failed npm run dev:client (default: success).
 */
export type MockScenario = 'success' | 'fail-first' | 'notification-failed';

export interface MockB2bOptions {
  /**
   * Signed-in user, read at invocation time. Defaults to Student 1's auth mock, whose registry and
   * session are shared module state (docs/contracts.md, "Mock identity boundary"). Imported from
   * auth/mock.ts rather than api/index.ts, which imports this file, to avoid an import cycle.
   */
  identity?: () => Promise<User>;
  scenario?: MockScenario;
  now?: () => Date;
  /** Simulated latency so the pending state is visible. */
  delayMs?: number;
}

function scenarioFromEnv(): MockScenario {
  const value: unknown = import.meta.env.VITE_B2B_MOCK_SCENARIO;
  return value === 'fail-first' || value === 'notification-failed' ? value : 'success';
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Stable key-order JSON for comparing a retry with the stored request. */
function canonical(input: QuoteInput, file: File): string {
  const sorted = Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));
  return JSON.stringify({ ...sorted, file: { name: file.name, size: file.size, type: file.type } });
}

async function rejectInvalidFile(file: File) {
  if (file.type !== 'application/pdf' || !/\.pdf$/i.test(file.name))
    throw new ApiError(415, 'UNSUPPORTED_FILE', 'Upload a PDF file', { designFile: 'PDF only' });
  if (file.size > MAX_FILE_BYTES)
    throw new ApiError(413, 'FILE_TOO_LARGE', 'File too large', { designFile: 'Maximum 5 MiB' });
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...head) !== '%PDF-')
    throw new ApiError(415, 'UNSUPPORTED_FILE', 'Upload a PDF file', { designFile: 'Not a PDF' });
}

/**
 * Phase 2 mock of POST /api/b2b/quote. Mirrors the server's checks and errors, enforces the b2b
 * role, keeps nothing outside this tab's memory and never sends email. The receipt is
 * deterministic per requestId, and a retry with the same requestId returns the original receipt.
 */
export function createMockB2B(http: HttpClient, options: MockB2bOptions = {}): B2bApi {
  const {
    identity = () => createMockAuth(http).me(),
    scenario = scenarioFromEnv(),
    now = () => new Date(),
    delayMs = 400,
  } = options;
  const saved = new Map<string, { canonical: string; receipt: QuoteReceipt }>();
  const failedOnce = new Set<string>();

  return {
    async submit(input, file) {
      await wait(delayMs);
      const user = await identity();
      if (user.role !== 'b2b')
        throw new ApiError(403, 'FORBIDDEN', 'A business account is required');
      const parsed = quoteSchema.safeParse(input);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues)
          fieldErrors[String(issue.path[0] ?? 'metadata')] = issue.message;
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request', fieldErrors);
      }
      await rejectInvalidFile(file);

      const key = `${user.id}:${parsed.data.requestId}`;
      const body = canonical(parsed.data, file);
      const existing = saved.get(key);
      if (existing) {
        if (existing.canonical !== body)
          throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Request ID reused with different data');
        return { ...existing.receipt };
      }
      if (scenario === 'fail-first' && !failedOnce.has(key)) {
        failedOnce.add(key);
        throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Simulated outage');
      }
      const receipt: QuoteReceipt = {
        id: parsed.data.requestId.replace(/-/g, '').slice(0, 24).toLowerCase(),
        status: 'submitted',
        createdAt: now().toISOString(),
        // Nothing is emailed in mock mode, so the receipt never claims "sent".
        notificationStatus: scenario === 'notification-failed' ? 'failed' : 'pending',
      };
      saved.set(key, { canonical: body, receipt });
      return { ...receipt };
    },
  };
}
