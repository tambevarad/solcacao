import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Photo } from '../../../shared/index.js';
import { useLocale } from '../../shell/public.js';

/** How close to the viewport (above or below) a deferred image starts loading. */
export const NEAR_VIEWPORT_MARGIN = '600px';

/**
 * True once the element comes within NEAR_VIEWPORT_MARGIN of the viewport. The browser's own
 * loading="lazy" starts much further away (over 1,000 px on a fast connection), which on these
 * pages meant every photo downloaded at first load; this keeps the photos further down for when
 * the visitor scrolls towards them. Without IntersectionObserver it is true straight away.
 */
export function useNearViewport<T extends Element>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const element = ref.current;
    if (near || !element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNear(true);
      },
      { rootMargin: `${NEAR_VIEWPORT_MARGIN} 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [near]);
  return { ref, near };
}

/**
 * The shared <Photo>, mounted only when its slot nears the viewport. Until then a box with the
 * same width and ratio holds its place, so nothing shifts, and it carries the photo's description
 * for assistive technology unless the photo is decorative.
 */
export function DeferredPhoto(props: ComponentProps<typeof Photo>) {
  const { locale } = useLocale();
  const { ref, near } = useNearViewport<HTMLDivElement>();
  if (near) return <Photo {...props} />;
  const { image, ratio = 'aspect-[4/3]', decorative = false, className = '' } = props;
  return (
    <div
      ref={ref}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : image.alt[locale]}
      aria-hidden={decorative ? true : undefined}
      className={`w-full rounded bg-line/30 ${ratio}${className ? ` ${className}` : ''}`}
    />
  );
}
