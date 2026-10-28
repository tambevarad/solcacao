import { useId, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/Button.js';
import { useLocale } from '../public.js';
import { localizePath, stripLocale } from '../locale.js';

/** Contract maximum for ProductQuery.search (docs/contracts.md, Catalog). */
const SEARCH_MAX_LENGTH = 100;

/**
 * Global product search. Submits to /:locale/catalog?search=<term>; the catalog page owns
 * filtering. Starts a fresh search rather than merging other catalog filters.
 */
export function SearchForm({
  autoFocus,
  onSubmitted,
  onEscape,
}: {
  autoFocus?: boolean;
  onSubmitted?: () => void;
  onEscape?: () => void;
}) {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const inputId = useId();
  const [term, setTerm] = useState(() =>
    stripLocale(location.pathname) === '/catalog'
      ? (new URLSearchParams(location.search).get('search') ?? '')
      : '',
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = term.trim();
    navigate(
      localizePath(
        locale,
        query ? `/catalog?${new URLSearchParams({ search: query })}` : '/catalog',
      ),
    );
    onSubmitted?.();
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !onEscape) return;
        event.preventDefault();
        onEscape();
      }}
      className="flex gap-2"
    >
      <label htmlFor={inputId} className="sr-only">
        {t('shell.search.label')}
      </label>
      <input
        id={inputId}
        type="search"
        name="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        maxLength={SEARCH_MAX_LENGTH}
        autoFocus={autoFocus}
        placeholder={t('shell.search.placeholder')}
        className="min-h-11 min-w-0 flex-1 rounded border border-line bg-white px-3 focus:border-copper"
      />
      <Button type="submit">{t('shell.search.submit')}</Button>
    </form>
  );
}
