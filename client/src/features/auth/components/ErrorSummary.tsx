import { forwardRef } from 'react';
import { useLocale } from '../../shell/public.js';
import type { ErrorKeys } from './messages.js';

/**
 * Focusable summary at the top of an auth form. Field errors link to their inputs; a form-level
 * failure (wrong password, server down) is shown on its own. Renders nothing without errors.
 */
export const ErrorSummary = forwardRef<
  HTMLDivElement,
  { errors: ErrorKeys; fieldIds: Record<string, string>; labels: Record<string, string> }
>(function ErrorSummary({ errors, fieldIds, labels }, ref) {
  const { t } = useLocale();
  const fields = Object.keys(errors).filter((field) => field !== 'form' && fieldIds[field]);
  if (!errors.form && !fields.length) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="mb-6 rounded border border-error bg-white p-4 text-error focus:outline-2 focus:outline-error"
    >
      {errors.form && <p className="font-medium">{t(errors.form)}</p>}
      {fields.length > 0 && (
        <>
          <p className="font-medium">{t('auth.error.summary')}</p>
          <ul className="mt-2 list-disc pl-5">
            {fields.map((field) => (
              <li key={field}>
                <a
                  href={`#${fieldIds[field]}`}
                  className="underline"
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(fieldIds[field])?.focus();
                  }}
                >
                  {t('auth.error.summaryItem', { field: labels[field], message: t(errors[field]) })}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
});
