import { Fragment, useState, type ChangeEvent, type Dispatch, type Ref } from 'react';
import { FileText } from 'lucide-react';
import type { Locale } from '../../../../../contracts/index.js';
import { Button, Field, TextArea, Photo } from '../../../shared/index.js';
import { useLocale, type TranslationValues } from '../../shell/public.js';
import { FILE_PROBLEM_KEYS, checkPdf, displayFileName, formatFileSize } from '../file.js';
import { CACAO_PROFILES, NOTES_MAX, PACKAGING_OPTIONS, PACKAGING_PHOTOS } from '../options.js';
import {
  STEPS,
  STEP_FIELDS,
  parseQuantity,
  type FieldErrors,
  type FieldName,
  type QuoteDraft,
  type Step,
  type WizardAction,
} from '../wizard.js';
import { ChoiceCards } from './ChoiceCards.js';

/** Stable ids so the error summary can move focus to each control. */
export const FIELD_IDS: Record<FieldName, string> = {
  cacaoProfile: 'quote-cacao',
  quantity: 'quote-quantity',
  designFile: 'quote-file',
  packaging: 'quote-packaging',
  companyName: 'quote-company',
  contactEmail: 'quote-email',
  notes: 'quote-notes',
};

const ALL_FIELDS: readonly FieldName[] = STEPS.flatMap((step) => STEP_FIELDS[step]);

/** Decorative darkness swatches; original colors, not product photography. */
const SWATCHES = { dark85: 'bg-[#2b1a14]', dark70: 'bg-[#4a2e22]', milk45: 'bg-[#8a5a3c]' };

interface StepProps {
  draft: QuoteDraft;
  errors: FieldErrors;
  dispatch: Dispatch<WizardAction>;
  /** Interpolation values shared by every validation message. */
  values: TranslationValues;
}

/** Focusable list of blocking problems with links that move focus to each control. */
export function ErrorSummary({
  errors,
  values,
  ref,
}: {
  errors: FieldErrors;
  values: TranslationValues;
  ref?: Ref<HTMLDivElement>;
}) {
  const { t } = useLocale();
  const fields = ALL_FIELDS.filter((field) => errors[field]);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="rounded border-2 border-error bg-white p-4 focus-visible:outline-offset-2"
    >
      <h3 className="font-semibold">{t('b2b.errors.summaryTitle')}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {fields.map((field) => (
          <li key={field}>
            <a
              href={`#${FIELD_IDS[field]}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(FIELD_IDS[field])?.focus();
              }}
              className="text-error underline underline-offset-2"
            >
              {t(`b2b.fields.${field}`)}: {t(errors[field] ?? '', values)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CacaoStep({ draft, errors, dispatch, values }: StepProps) {
  const { t } = useLocale();
  return (
    <div className="space-y-8">
      <ChoiceCards
        id={FIELD_IDS.cacaoProfile}
        name="cacaoProfile"
        legend={t('b2b.fields.cacaoProfile')}
        hint={t('b2b.cacao.hint')}
        choices={CACAO_PROFILES.map((profile) => ({
          value: profile,
          label: t(`b2b.cacao.${profile}.name`),
          description: t(`b2b.cacao.${profile}.description`),
          media: <span aria-hidden="true" className={`block h-12 rounded ${SWATCHES[profile]}`} />,
        }))}
        value={draft.cacaoProfile}
        onChange={(value) => dispatch({ type: 'cacao', value })}
        error={errors.cacaoProfile && t(errors.cacaoProfile, values)}
      />
      <Field
        id={FIELD_IDS.quantity}
        name="quantity"
        label={t('b2b.fields.quantity')}
        hint={t('b2b.quantity.hint', values)}
        inputMode="numeric"
        autoComplete="off"
        required
        value={draft.quantity}
        onChange={(event) =>
          dispatch({ type: 'text', field: 'quantity', value: event.target.value })
        }
        error={errors.quantity && t(errors.quantity, values)}
        className="max-w-xs"
      />
    </div>
  );
}

export function BrandingStep({
  file,
  errors,
  dispatch,
  values,
}: Omit<StepProps, 'draft'> & { file: File | null }) {
  const { t, locale } = useLocale();
  // Remounting the input clears its native value, so the same file can be chosen again.
  const [inputKey, setInputKey] = useState(0);
  const [checking, setChecking] = useState(false);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setChecking(true);
    const problem = await checkPdf(selected);
    setChecking(false);
    setInputKey((key) => key + 1);
    if (problem) dispatch({ type: 'fileRejected', errorKey: FILE_PROBLEM_KEYS[problem] });
    else dispatch({ type: 'file', file: selected });
  }

  return (
    <div className="space-y-4">
      <Field
        key={inputKey}
        id={FIELD_IDS.designFile}
        name="designFile"
        type="file"
        accept="application/pdf,.pdf"
        label={t(file ? 'b2b.branding.replaceLabel' : 'b2b.fields.designFile')}
        hint={t('b2b.branding.hint', values)}
        required={!file}
        onChange={choose}
        error={errors.designFile && t(errors.designFile, values)}
      />
      <p aria-live="polite" className="text-sm">
        {checking ? t('b2b.branding.checking') : ''}
      </p>
      {file && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-white p-4">
          <div className="flex min-w-0 items-center gap-3">
            <FileText aria-hidden="true" className="size-8 shrink-0 text-copper" />
            <div className="min-w-0">
              <p className="font-medium break-all" data-testid="selected-file">
                {displayFileName(file.name)}
              </p>
              <p className="text-sm text-cacao/80">
                {t('b2b.branding.fileMeta', { size: formatFileSize(file.size, locale) })}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => dispatch({ type: 'removeFile' })}>
            {t('b2b.branding.remove')}
            <span className="sr-only"> {displayFileName(file.name)}</span>
          </Button>
        </div>
      )}
      <p className="text-sm text-cacao/80">{t('b2b.branding.memoryNote')}</p>
    </div>
  );
}

export function PackagingStep({ draft, errors, dispatch, values }: StepProps) {
  const { t, locale } = useLocale();
  const notesLength = draft.notes.trim().length;
  return (
    <div className="space-y-8">
      <ChoiceCards
        id={FIELD_IDS.packaging}
        name="packaging"
        legend={t('b2b.fields.packaging')}
        hint={t('b2b.packaging.hint')}
        choices={PACKAGING_OPTIONS.map((option) => ({
          value: option,
          label: t(`b2b.packaging.${option}.name`),
          description: t(`b2b.packaging.${option}.description`),
          media: (
            <Photo
              image={PACKAGING_PHOTOS[option]}
              ratio="aspect-[3/2]"
              sizes="(min-width: 640px) 280px, 100vw"
              decorative
            />
          ),
        }))}
        value={draft.packaging}
        onChange={(value) => dispatch({ type: 'packaging', value })}
        error={errors.packaging && t(errors.packaging, values)}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          id={FIELD_IDS.companyName}
          name="companyName"
          label={t('b2b.fields.companyName')}
          autoComplete="organization"
          required
          value={draft.companyName}
          onChange={(event) =>
            dispatch({ type: 'text', field: 'companyName', value: event.target.value })
          }
          error={errors.companyName && t(errors.companyName, values)}
        />
        <Field
          id={FIELD_IDS.contactEmail}
          name="contactEmail"
          type="email"
          label={t('b2b.fields.contactEmail')}
          hint={t('b2b.contact.hint')}
          autoComplete="email"
          required
          value={draft.contactEmail}
          onChange={(event) =>
            dispatch({ type: 'text', field: 'contactEmail', value: event.target.value })
          }
          error={errors.contactEmail && t(errors.contactEmail, values)}
        />
      </div>
      <TextArea
        id={FIELD_IDS.notes}
        name="notes"
        label={t('b2b.fields.notes')}
        hint={t('b2b.notes.hint', {
          count: new Intl.NumberFormat(locale).format(notesLength),
          max: new Intl.NumberFormat(locale).format(NOTES_MAX),
        })}
        rows={5}
        value={draft.notes}
        onChange={(event) => dispatch({ type: 'text', field: 'notes', value: event.target.value })}
        error={errors.notes && t(errors.notes, values)}
      />
    </div>
  );
}

export function ReviewStep({
  draft,
  file,
  locale,
  onEdit,
}: {
  draft: QuoteDraft;
  file: File | null;
  locale: Locale;
  onEdit(step: Step): void;
}) {
  const { t } = useLocale();
  const quantity = parseQuantity(draft.quantity);
  const empty = t('b2b.review.missing');
  const sections: { step: Step; rows: [string, string][] }[] = [
    {
      step: 1,
      rows: [
        [
          t('b2b.fields.cacaoProfile'),
          draft.cacaoProfile ? t(`b2b.cacao.${draft.cacaoProfile}.name`) : empty,
        ],
        [
          t('b2b.fields.quantity'),
          quantity === null
            ? empty
            : t('b2b.review.units', { count: new Intl.NumberFormat(locale).format(quantity) }),
        ],
      ],
    },
    {
      step: 2,
      rows: [
        [
          t('b2b.fields.designFile'),
          file ? `${displayFileName(file.name)} (${formatFileSize(file.size, locale)})` : empty,
        ],
      ],
    },
    {
      step: 3,
      rows: [
        [
          t('b2b.fields.packaging'),
          draft.packaging ? t(`b2b.packaging.${draft.packaging}.name`) : empty,
        ],
        [t('b2b.fields.companyName'), draft.companyName.trim() || empty],
        [t('b2b.fields.contactEmail'), draft.contactEmail.trim() || empty],
        [t('b2b.fields.notes'), draft.notes.trim() || t('b2b.review.noNotes')],
      ],
    },
  ];
  return (
    <div className="space-y-6">
      {sections.map(({ step, rows }) => (
        <section key={step} className="rounded border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">{t(`b2b.wizard.step${step}.title`)}</h3>
            <Button variant="ghost" onClick={() => onEdit(step)}>
              {t('b2b.review.edit')}
              <span className="sr-only">: {t(`b2b.wizard.step${step}.title`)}</span>
            </Button>
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,12rem)_1fr]">
            {rows.map(([term, value]) => (
              <Fragment key={term}>
                <dt className="text-sm text-cacao/70">{term}</dt>
                <dd className="break-words whitespace-pre-line">{value}</dd>
              </Fragment>
            ))}
          </dl>
        </section>
      ))}
      <p className="text-sm text-cacao/80">
        {t('b2b.review.language', { language: t('b2b.review.languageName') })}
      </p>
    </div>
  );
}
