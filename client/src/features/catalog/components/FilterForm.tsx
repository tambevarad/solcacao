import { useEffect, useId, useState, type FormEvent } from 'react';
import { Button, Field, Select } from '../../../shared/index.js';
import { useLocale } from '../../shell/public.js';
import { CATALOG_ORIGINS } from '../fixtures.js';
import { PRICE_UI_MAX_CENTS, type CatalogFilters } from '../filters.js';
import { useMoney, useOriginLabel } from './format.js';

interface Draft {
  search: string;
  cacaoMin: number;
  cacaoMax: number;
  /** Dollar strings so a half-typed value is not rewritten while typing. */
  priceMin: string;
  priceMax: string;
}

const dollars = (cents: number | undefined) =>
  cents === undefined ? '' : (cents / 100).toFixed(cents % 100 ? 2 : 0);

function draftOf(filters: CatalogFilters): Draft {
  return {
    search: filters.search ?? '',
    cacaoMin: filters.cacaoPct ?? filters.cacaoMin ?? 0,
    cacaoMax: filters.cacaoPct ?? filters.cacaoMax ?? 100,
    priceMin: dollars(filters.priceMinCents),
    priceMax: dollars(filters.priceMaxCents),
  };
}

/** "12.5" -> 1250; empty -> undefined; anything else -> NaN (shown as an error). */
function toCents(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^\d{1,6}(\.\d{1,2})?$/.test(trimmed) ? Math.round(Number(trimmed) * 100) : Number.NaN;
}

/**
 * Catalog filters. Selects apply at once; search, cacao and price apply with "Apply filters"
 * (or Enter), so dragging a slider does not add a history entry per step. Sliders and number
 * inputs share one state and the same bounds. Used in the desktop sidebar and the mobile drawer.
 */
export function FilterForm({
  filters,
  onChange,
  onApplied,
}: {
  filters: CatalogFilters;
  onChange(next: CatalogFilters): void;
  /** Called after Apply/Clear, e.g. to close the mobile drawer. */
  onApplied?(): void;
}) {
  const { t } = useLocale();
  const originLabel = useOriginLabel();
  const money = useMoney();
  const [draft, setDraft] = useState(() => draftOf(filters));
  const [errors, setErrors] = useState<{ cacao?: string; price?: string }>({});
  const id = useId();
  // Back/forward or a header search changes the URL: show what is actually applied.
  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    setDraft(draftOf(filters));
    setErrors({});
  }, [filtersKey]); // Keyed by value, not object identity.

  const narrowing: CatalogFilters = { ...filters, page: undefined };

  function apply(event: FormEvent) {
    event.preventDefault();
    const priceMinCents = toCents(draft.priceMin);
    const priceMaxCents = toCents(draft.priceMax);
    const next: typeof errors = {};
    if (draft.cacaoMin > draft.cacaoMax) next.cacao = t('catalog.filters.cacaoOrder');
    if (Number.isNaN(priceMinCents) || Number.isNaN(priceMaxCents))
      next.price = t('catalog.filters.priceInvalid');
    else if (
      priceMinCents !== undefined &&
      priceMaxCents !== undefined &&
      priceMinCents > priceMaxCents
    )
      next.price = t('catalog.filters.priceOrder');
    setErrors(next);
    if (next.cacao || next.price) return;
    const exact =
      filters.cacaoPct !== undefined &&
      draft.cacaoMin === draft.cacaoMax &&
      draft.cacaoMin === filters.cacaoPct;
    onChange({
      ...narrowing,
      search: draft.search.trim() || undefined,
      cacaoPct: exact ? filters.cacaoPct : undefined,
      cacaoMin: exact || draft.cacaoMin === 0 ? undefined : draft.cacaoMin,
      cacaoMax: exact || draft.cacaoMax === 100 ? undefined : draft.cacaoMax,
      priceMinCents: priceMinCents || undefined,
      priceMaxCents,
    });
    onApplied?.();
  }

  function clearAll() {
    onChange({ sort: filters.sort });
    onApplied?.();
  }

  const setCacao = (key: 'cacaoMin' | 'cacaoMax', value: number) =>
    setDraft((current) => ({ ...current, [key]: Math.max(0, Math.min(100, value)) }));
  const slider = 'block w-full accent-copper';
  const priceSliderValue = (value: string, fallback: number) => {
    const cents = toCents(value);
    return cents === undefined || Number.isNaN(cents)
      ? fallback
      : Math.min(PRICE_UI_MAX_CENTS, cents) / 100;
  };

  return (
    <form onSubmit={apply} className="space-y-6" aria-label={t('catalog.filters.title')}>
      <Field
        label={t('catalog.filters.search')}
        type="search"
        name="search"
        maxLength={100}
        value={draft.search}
        onChange={(event) => setDraft({ ...draft, search: event.target.value })}
      />
      <Select
        label={t('catalog.filters.category')}
        value={filters.category ?? ''}
        onChange={(event) =>
          onChange({
            ...narrowing,
            category: (event.target.value || undefined) as CatalogFilters['category'],
          })
        }
      >
        <option value="">{t('catalog.filters.allCategories')}</option>
        <option value="bar">{t('catalog.category.bar')}</option>
        <option value="truffle">{t('catalog.category.truffle')}</option>
        <option value="seasonal">{t('catalog.category.seasonal')}</option>
      </Select>
      <Select
        label={t('catalog.filters.origin')}
        value={filters.origin ?? ''}
        onChange={(event) => onChange({ ...narrowing, origin: event.target.value || undefined })}
      >
        <option value="">{t('catalog.filters.allOrigins')}</option>
        {CATALOG_ORIGINS.map((origin) => (
          <option key={origin} value={origin}>
            {originLabel(origin)}
          </option>
        ))}
        {filters.origin && !(CATALOG_ORIGINS as readonly string[]).includes(filters.origin) && (
          <option value={filters.origin}>{filters.origin}</option>
        )}
      </Select>

      <fieldset aria-describedby={errors.cacao ? `${id}-cacao-error` : undefined}>
        <legend className="mb-2 font-medium">{t('catalog.filters.cacaoRange')}</legend>
        <div className="grid grid-cols-2 gap-3">
          {(['cacaoMin', 'cacaoMax'] as const).map((key) => (
            <div key={key} className="space-y-2">
              <label htmlFor={`${id}-${key}`} className="block text-sm">
                {t(key === 'cacaoMin' ? 'catalog.filters.cacaoMin' : 'catalog.filters.cacaoMax')}
              </label>
              <input
                id={`${id}-${key}`}
                type="number"
                min={0}
                max={100}
                step={1}
                value={draft[key]}
                onChange={(event) => setCacao(key, Number(event.target.value))}
                aria-invalid={errors.cacao ? true : undefined}
                className="block min-h-11 w-full rounded border border-line bg-white px-3"
              />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={draft[key]}
                onChange={(event) => setCacao(key, Number(event.target.value))}
                aria-label={t(
                  key === 'cacaoMin'
                    ? 'catalog.filters.cacaoMinSlider'
                    : 'catalog.filters.cacaoMaxSlider',
                )}
                aria-valuetext={`${draft[key]} %`}
                className={slider}
              />
            </div>
          ))}
        </div>
        {errors.cacao && (
          <p id={`${id}-cacao-error`} className="mt-1 text-sm text-error">
            {errors.cacao}
          </p>
        )}
      </fieldset>

      <fieldset aria-describedby={errors.price ? `${id}-price-error` : undefined}>
        <legend className="mb-2 font-medium">{t('catalog.filters.priceRange')}</legend>
        <div className="grid grid-cols-2 gap-3">
          {(['priceMin', 'priceMax'] as const).map((key) => (
            <div key={key} className="space-y-2">
              <label htmlFor={`${id}-${key}`} className="block text-sm">
                {t(key === 'priceMin' ? 'catalog.filters.priceMin' : 'catalog.filters.priceMax')}
              </label>
              <input
                id={`${id}-${key}`}
                type="number"
                inputMode="decimal"
                min={0}
                max={PRICE_UI_MAX_CENTS / 100}
                step={0.01}
                value={draft[key]}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                aria-invalid={errors.price ? true : undefined}
                className="block min-h-11 w-full rounded border border-line bg-white px-3"
              />
              <input
                type="range"
                min={0}
                max={PRICE_UI_MAX_CENTS / 100}
                step={1}
                value={priceSliderValue(
                  draft[key],
                  key === 'priceMin' ? 0 : PRICE_UI_MAX_CENTS / 100,
                )}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                aria-label={t(
                  key === 'priceMin'
                    ? 'catalog.filters.priceMinSlider'
                    : 'catalog.filters.priceMaxSlider',
                )}
                aria-valuetext={money(
                  priceSliderValue(draft[key], key === 'priceMin' ? 0 : PRICE_UI_MAX_CENTS / 100) *
                    100,
                )}
                className={slider}
              />
            </div>
          ))}
        </div>
        {errors.price && (
          <p id={`${id}-price-error`} className="mt-1 text-sm text-error">
            {errors.price}
          </p>
        )}
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <Button type="submit">{t('catalog.filters.apply')}</Button>
        <Button variant="secondary" onClick={clearAll}>
          {t('catalog.filters.clear')}
        </Button>
      </div>
    </form>
  );
}
