import express, { Router, type ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { createInquiryService } from './service.js';
import { sendSupportError, SupportError } from './errors.js';
import { supportInquirySchema } from '../../../../client/src/features/support/rules.js';

export function createSupportRouter(
  options: {
    submit?: ReturnType<typeof createInquiryService>;
    isDatabaseReady?: () => boolean;
    rateLimitMax?: number;
  } = {},
) {
  const router = Router();
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: options.rateLimitMax ?? 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      sendSupportError(res, new SupportError(429, 'RATE_LIMITED', 'Try again later')),
  });
  const submit = options.submit ?? createInquiryService();
  router.post('/inquiries', limiter, express.json({ limit: '16kb' }), async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (Buffer.byteLength(JSON.stringify(req.body) ?? '') > 16 * 1024)
        throw new SupportError(413, 'VALIDATION_ERROR', 'Inquiry too large');
      if (!req.is('application/json'))
        throw new SupportError(415, 'VALIDATION_ERROR', 'JSON required');
      const result = supportInquirySchema.safeParse(req.body);
      if (!result.success) {
        const fields: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          fields[issue.path.join('.') || 'form'] = issue.message;
        });
        throw new SupportError(400, 'VALIDATION_ERROR', 'Invalid inquiry', fields);
      }
      if (!(options.isDatabaseReady ?? (() => mongoose.connection.readyState === 1))())
        throw new SupportError(503, 'SERVICE_UNAVAILABLE', 'Database unavailable');
      res.status(201).json({ data: await submit(result.data) });
    } catch (error) {
      sendSupportError(res, error);
    }
  });
  const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    const status =
      error && typeof error === 'object' && 'status' in error ? error.status : undefined;
    sendSupportError(
      res,
      status === 413 || status === 400
        ? new SupportError(
            status,
            'VALIDATION_ERROR',
            status === 413 ? 'Inquiry too large' : 'Invalid JSON',
          )
        : error,
    );
  };
  router.use(errorHandler);
  return router;
}
export const supportRouter = createSupportRouter();
