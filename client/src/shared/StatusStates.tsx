import type { ReactNode } from 'react';
import { CircleAlert, Inbox, LoaderCircle, RotateCcw } from 'lucide-react';
import { useLocale } from '../features/shell/public.js';
import { Button } from './Button.js';

const frame = 'flex flex-col items-center justify-center gap-3 px-4 py-12 text-center';

/** Polite live region for in-progress requests. Defaults to shell.state.loading. */
export function LoadingState({ label, className }: { label?: string; className?: string }) {
  const { t } = useLocale();
  return (
    <div role="status" className={`${frame} text-cacao/80${className ? ` ${className}` : ''}`}>
      <LoaderCircle aria-hidden="true" className="size-6 animate-spin motion-reduce:animate-none" />
      <span>{label ?? t('shell.state.loading')}</span>
    </div>
  );
}

/** A successful request with no results. Distinct from ErrorState. */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Optional recovery action, e.g. a "clear filters" Button. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${frame}${className ? ` ${className}` : ''}`}>
      <Inbox aria-hidden="true" className="size-8 text-copper" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="max-w-prose text-cacao/80">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Failed request. Announced as an alert; offers retry when `onRetry` is supplied. */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <div role="alert" className={`${frame}${className ? ` ${className}` : ''}`}>
      <CircleAlert aria-hidden="true" className="size-8 text-error" />
      <h2 className="text-lg font-semibold">{title ?? t('shell.state.error')}</h2>
      {description && <p className="max-w-prose text-cacao/80">{description}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-3">
          <RotateCcw aria-hidden="true" className="size-4" />
          {retryLabel ?? t('shell.action.retry')}
        </Button>
      )}
    </div>
  );
}
