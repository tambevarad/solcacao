import { Component, useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ErrorState } from '../../shared/StatusStates.js';
import { useLocale } from './public.js';
import { stripLocale } from './locale.js';
import { PageMetaContext, applyDocumentMeta, type PageMeta, type RouteMetaId } from './meta.js';

/**
 * Wraps every routed page in client/src/routes.tsx. Applies the route's default document title and
 * description (shell.meta.<id>.*), lets the page override them with usePageMeta, and contains page
 * render errors so the header, footer and navigation keep working.
 */
export function PageFrame({ meta, children }: { meta: RouteMetaId; children: ReactNode }) {
  const { t } = useLocale();
  const location = useLocation();
  const [override, setOverride] = useState<PageMeta | null>(null);
  const title = override?.title ?? t(`shell.meta.${meta}.title`);
  const description = override?.description ?? t(`shell.meta.${meta}.description`);

  useEffect(() => {
    applyDocumentMeta({ title, description });
  }, [title, description]);

  return (
    <PageMetaContext.Provider value={setOverride}>
      <RouteErrorBoundary resetKey={stripLocale(location.pathname)}>{children}</RouteErrorBoundary>
    </PageMetaContext.Provider>
  );
}

interface BoundaryProps {
  resetKey: string;
  children: ReactNode;
}
interface BoundaryState {
  error: Error | null;
  resetKey: string;
}

/** Resets when the page path changes (not on a language switch, which keeps the same path). */
class RouteErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error };
  }

  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState) {
    return props.resetKey === state.resetKey ? null : { error: null, resetKey: props.resetKey };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <RouteErrorFallback onRetry={() => this.setState({ error: null })} />;
  }
}

function RouteErrorFallback({ onRetry }: { onRetry(): void }) {
  const { t } = useLocale();
  return (
    <ErrorState
      title={t('shell.state.routeErrorTitle')}
      description={t('shell.state.routeErrorBody')}
      onRetry={onRetry}
    />
  );
}
