import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '../../shell/public.js';

/** Previous/next and numbered links; each is a real URL so back/forward and new tabs work. */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor(page: number): string;
}) {
  const { t } = useLocale();
  if (totalPages <= 1) return null;
  const link =
    'inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-line px-3 hover:bg-line/60';
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
  );
  return (
    <nav aria-label={t('catalog.pagination.label')} className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {page > 1 ? (
            <Link to={hrefFor(page - 1)} className={link} rel="prev">
              <ChevronLeft aria-hidden="true" className="size-4" />
              {t('catalog.pagination.previous')}
            </Link>
          ) : null}
        </li>
        {pages.map((n, index) => (
          <li key={n} className="flex items-center gap-2">
            {index > 0 && pages[index - 1] !== n - 1 && <span aria-hidden="true">…</span>}
            <Link
              to={hrefFor(n)}
              aria-current={n === page ? 'page' : undefined}
              aria-label={t('catalog.pagination.page', { page: n })}
              className={`${link} aria-[current=page]:bg-cacao aria-[current=page]:text-ivory`}
            >
              {n}
            </Link>
          </li>
        ))}
        <li>
          {page < totalPages ? (
            <Link to={hrefFor(page + 1)} className={link} rel="next">
              {t('catalog.pagination.next')}
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
        </li>
      </ul>
    </nav>
  );
}
