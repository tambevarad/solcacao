import type { Locale, User } from '../../../../contracts/index.js';

// Same augmentation Student 1 publishes with server/src/shared/auth.ts (docs/contracts.md:
// "Add req.user?: User via Express type augmentation"). Identical declarations merge, so this can
// be deleted once that port lands without changing any handler.
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/** Student 5's port (docs/contracts.md): never throws for an SMTP outage. */
export type NotifyQuote = (input: {
  quoteId: string;
  companyName: string;
  contactEmail: string;
  locale: Locale;
}) => Promise<'sent' | 'failed'>;
