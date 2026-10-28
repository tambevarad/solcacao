import { Link, useLocation } from 'react-router-dom';
import { useLocale } from '../public.js';
import { localizePath, stripLocale } from '../locale.js';
import type { NavItem } from '../navigation.js';

export const iconButton =
  'relative inline-flex size-11 shrink-0 items-center justify-center rounded hover:bg-line/60';

/** Localized link for a navigation item; marks the exact current page with aria-current. */
export function ShellLink({
  item,
  className,
  onNavigate,
}: {
  item: NavItem;
  className?: string;
  onNavigate?: () => void;
}) {
  const { t, locale } = useLocale();
  const location = useLocation();
  const current = stripLocale(location.pathname) + location.search === item.to;
  return (
    <Link
      to={localizePath(locale, item.to)}
      aria-current={current ? 'page' : undefined}
      onClick={onNavigate}
      className={className}
    >
      {t(item.labelKey)}
    </Link>
  );
}
