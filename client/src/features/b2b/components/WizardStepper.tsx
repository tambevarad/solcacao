import { Check } from 'lucide-react';
import { useLocale } from '../../shell/public.js';
import { STEPS, type Step } from '../wizard.js';

/**
 * Horizontal stepper on desktop, compact current-step text on phones (docs/design.md, B2B).
 * Reached steps are buttons so completed answers stay editable.
 */
export function WizardStepper({
  step,
  furthest,
  onSelect,
}: {
  step: Step;
  furthest: Step;
  onSelect(step: Step): void;
}) {
  const { t } = useLocale();
  return (
    <nav aria-label={t('b2b.wizard.stepsLabel')}>
      <p className="text-sm font-semibold md:hidden">
        {t('b2b.wizard.stepCount', { current: step, total: STEPS.length })}
        {' · '}
        {t(`b2b.wizard.step${step}.title`)}
      </p>
      <ol className="hidden gap-2 md:flex">
        {STEPS.map((item) => {
          const current = item === step;
          const reachable = !current && item <= furthest;
          const complete = item < furthest && !current;
          const marker = (
            <span
              aria-hidden="true"
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${current ? 'border-cacao bg-cacao text-ivory' : complete ? 'border-copper bg-copper text-ivory' : 'border-line text-cacao/70'}`}
            >
              {complete ? <Check className="size-4" /> : item}
            </span>
          );
          const label = (
            <span className="text-left text-sm leading-tight font-medium">
              {t(`b2b.wizard.step${item}.title`)}
              <span className="sr-only">
                {' '}
                (
                {t(
                  current
                    ? 'b2b.wizard.stateCurrent'
                    : complete
                      ? 'b2b.wizard.stateComplete'
                      : 'b2b.wizard.stateUpcoming',
                )}
                )
              </span>
            </span>
          );
          return (
            <li
              key={item}
              aria-current={current ? 'step' : undefined}
              className={`flex-1 border-t-4 pt-3 ${current ? 'border-cacao' : complete ? 'border-copper' : 'border-line'}`}
            >
              {reachable ? (
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex min-h-11 w-full items-center gap-3 rounded hover:underline"
                >
                  {marker}
                  {label}
                </button>
              ) : (
                <span
                  className={`flex min-h-11 items-center gap-3 ${current ? '' : 'text-cacao/70'}`}
                >
                  {marker}
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
