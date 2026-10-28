import { useLocale } from '../../shell/public.js';

/**
 * Clearly labeled space for team-supplied photography (docs/design.md: real photos and copy are
 * intentionally absent until supplied). It is text, not an image, so it needs no alt text.
 */
export function ImageSlot({
  description,
  ratio = 'aspect-[4/3]',
  className = '',
}: {
  /** Translated description of the photo that belongs here. */
  description: string;
  ratio?: string;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <div
      data-image-slot
      className={`flex w-full items-center justify-center rounded border border-dashed border-copper/60 bg-line/30 p-4 text-center ${ratio} ${className}`}
    >
      <p className="max-w-xs text-sm text-cacao/80">
        <span className="mb-1 block text-xs font-semibold tracking-wider text-copper uppercase">
          {t('b2b.imageSlot.badge')}
        </span>
        {description}
      </p>
    </div>
  );
}
