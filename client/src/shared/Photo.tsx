import { useLocale } from '../features/shell/public.js';
import type { PhotoAsset } from './photos.js';

/**
 * Responsive, cropped photo for a fixed-ratio slot. Pass `sizes` matching the slot's rendered
 * width so the browser picks the smallest adequate file. Mark `decorative` when nearby text
 * already says the same thing (e.g. an image inside a labeled link or radio card).
 */
export function Photo({
  image,
  ratio = 'aspect-[4/3]',
  sizes = '100vw',
  decorative = false,
  priority = false,
  className = '',
}: {
  image: PhotoAsset;
  /** Tailwind aspect-ratio class for the slot, e.g. "aspect-[16/10]" or "aspect-square". */
  ratio?: string;
  sizes?: string;
  decorative?: boolean;
  /** Above-the-fold image: load eagerly with high priority (one per page at most). */
  priority?: boolean;
  className?: string;
}) {
  const { locale } = useLocale();
  return (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={decorative ? '' : image.alt[locale]}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      style={{ objectPosition: image.position }}
      className={`w-full rounded bg-line/30 object-cover ${ratio}${className ? ` ${className}` : ''}`}
    />
  );
}
