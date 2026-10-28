import type {
  SupportApi,
  HttpClient,
  InquiryReceipt,
  Product,
} from '../../../../contracts/index.js';
import { ApiError } from '../../api/http.js';
import { canonicalInquiry, normalizeInquiry, supportInquirySchema } from './rules.js';
import { loadSamplerProducts } from './catalog.js';

let failNext = false;
export function simulateNextInquiryFailure() {
  failNext = true;
}

export function createMockSupport(
  _http: HttpClient,
  options: {
    products?: () => Promise<Product[]>;
    delayMs?: number;
    afterSave?: () => void;
  } = {},
): SupportApi {
  const saved = new Map<string, { body: string; receipt: InquiryReceipt }>();
  let sequence = 0;
  return {
    async submit(raw) {
      const parsed = supportInquirySchema.safeParse(raw);
      if (!parsed.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid inquiry');
      const input = normalizeInquiry(parsed.data);
      const body = canonicalInquiry(input);
      const previous = saved.get(input.requestId);
      if (previous) {
        if (previous.body !== body)
          throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Request changed');
        return { ...previous.receipt };
      }
      await new Promise((resolve) => setTimeout(resolve, options.delayMs ?? 250));
      if (failNext) {
        failNext = false;
        throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Simulated request failure');
      }
      if (input.samplerItems) {
        const products = await (options.products?.() ?? loadSamplerProducts(input.locale));
        if (
          input.samplerItems.some(
            (item) => !products.some((p) => p.active && p.id === item.productId),
          )
        )
          throw new ApiError(400, 'VALIDATION_ERROR', 'Product unavailable', {
            samplerItems: 'Product unavailable',
          });
      }
      const winner = saved.get(input.requestId);
      if (winner) {
        if (winner.body !== body)
          throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Request changed');
        return { ...winner.receipt };
      }
      const receipt: InquiryReceipt = {
        id: (++sequence).toString(16).padStart(24, '0'),
        status: 'received',
        notificationStatus: 'pending',
      };
      saved.set(input.requestId, { body, receipt });
      options.afterSave?.();
      return { ...receipt };
    },
  };
}
