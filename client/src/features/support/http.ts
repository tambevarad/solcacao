import type { HttpClient, InquiryReceipt, SupportApi } from '../../../../contracts/index.js';

export class InquiryTimeoutError extends Error {
  constructor() {
    super('Inquiry response timed out');
    this.name = 'InquiryTimeoutError';
  }
}

export function createHttpSupport(http: HttpClient, timeoutMs = 20000): SupportApi {
  return {
    async submit(input) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        // The server may already have saved the inquiry. Never auto-resubmit or rotate its ID.
        return await Promise.race([
          http.request<InquiryReceipt>('/inquiries', {
            method: 'POST',
            body: input,
          }),
          new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new InquiryTimeoutError()), timeoutMs);
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
