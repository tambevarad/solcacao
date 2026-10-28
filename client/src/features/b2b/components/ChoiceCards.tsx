import type { ReactNode } from 'react';

export interface Choice<T extends string> {
  value: T;
  label: string;
  description?: string;
  /** Decorative visual (swatch or image slot) shown inside the card. */
  media?: ReactNode;
}

/**
 * Native radio group rendered as cards. Keeps the real radio inputs visible, so arrow-key
 * selection, focus rings and screen-reader semantics come from the browser.
 */
export function ChoiceCards<T extends string>({
  id,
  name,
  legend,
  hint,
  choices,
  value,
  onChange,
  error,
}: {
  /** Id of the fieldset; the error summary moves focus here. */
  id: string;
  name: string;
  legend: string;
  hint?: string;
  choices: readonly Choice<T>[];
  value: T | '';
  onChange(value: T): void;
  /** Translated validation message. */
  error?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
      className="focus-visible:outline-none"
    >
      <legend className="text-lg font-semibold">{legend}</legend>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-cacao/80">
          {hint}
        </p>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {choices.map((choice) => {
          const checked = value === choice.value;
          return (
            <label
              key={choice.value}
              className={`flex cursor-pointer flex-col gap-3 rounded border-2 bg-white p-4 transition-colors motion-reduce:transition-none ${checked ? 'border-copper' : error ? 'border-error/60' : 'border-line hover:border-cacao/40'}`}
            >
              {choice.media}
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name={name}
                  value={choice.value}
                  checked={checked}
                  onChange={() => onChange(choice.value)}
                  className="mt-0.5 size-5 shrink-0 accent-copper"
                />
                <span>
                  <span className="block font-semibold">{choice.label}</span>
                  {choice.description && (
                    <span className="mt-1 block text-sm text-cacao/80">{choice.description}</span>
                  )}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
