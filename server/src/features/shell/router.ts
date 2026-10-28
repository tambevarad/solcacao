import { Router } from 'express';
import { localeSchema } from '../../../../contracts/validation.js';
import { dictionaries } from '../../../../client/src/features/shell/dictionaries.js';

export const shellRouter = Router();

// GET /api/i18n/:locale (docs/api.json). Same assembled dictionaries as the client mock adapter.
shellRouter.get('/i18n/:locale', (req, res) => {
  const locale = localeSchema.safeParse(req.params.locale);
  if (!locale.success) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Unsupported locale',
        fieldErrors: { locale: 'Use en or es' },
      },
    });
    return;
  }
  // no-cache: browsers revalidate with the ETag, so a redeploy is picked up without stale copy.
  res.set('Cache-Control', 'no-cache').json({ data: dictionaries[locale.data] });
});
