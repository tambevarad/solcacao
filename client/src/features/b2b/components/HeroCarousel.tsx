import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { buttonStyles } from '../../../shared/index.js';
import { localizePath, useLocale } from '../../shell/public.js';
import { ImageSlot } from './ImageSlot.js';

/** Seasonal entry points. Category values are the canonical ProductQuery enum, never translated. */
const SLIDES = [
  { id: 'seasonal', to: '/catalog?category=seasonal' },
  { id: 'truffles', to: '/catalog?category=truffle' },
  { id: 'business', to: '/wholesale' },
] as const;

export const SLIDE_INTERVAL_MS = 7000;

const control =
  'inline-flex size-11 shrink-0 items-center justify-center rounded border border-line bg-ivory hover:bg-line/60';

function reducedMotionQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
}

/**
 * Homepage hero slides following the WAI-ARIA carousel pattern. Rotation is off when the visitor
 * prefers reduced motion, pauses on hover or keyboard focus, and stops for good after any manual
 * navigation. Every destination is also linked elsewhere on the page, so nothing essential
 * depends on autoplay.
 */
export function HeroCarousel() {
  const { t, locale } = useLocale();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !reducedMotionQuery()?.matches);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const query = reducedMotionQuery();
    if (!query) return;
    const onChange = () => {
      if (query.matches) setPlaying(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!playing || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [playing, paused]);

  function show(next: number) {
    setPlaying(false);
    setIndex((next + SLIDES.length) % SLIDES.length);
  }

  const rotating = playing && !paused;
  return (
    <section
      aria-roledescription="carousel"
      aria-label={t('b2b.hero.label')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        )
          setPaused(false);
      }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* The rotation control comes first in tab order, as the carousel pattern recommends. */}
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          aria-label={t(playing ? 'b2b.hero.pause' : 'b2b.hero.play')}
          className={control}
        >
          {playing ? (
            <Pause aria-hidden="true" className="size-5" />
          ) : (
            <Play aria-hidden="true" className="size-5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => show(index - 1)}
          aria-label={t('b2b.hero.previous')}
          className={control}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => show(index + 1)}
          aria-label={t('b2b.hero.next')}
          className={control}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
        <div role="group" aria-label={t('b2b.hero.choose')} className="ml-auto flex">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => show(i)}
              aria-label={t('b2b.hero.goTo', { number: i + 1 })}
              aria-current={i === index ? 'true' : undefined}
              className="group inline-flex size-11 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={`block size-3 rounded-full border border-cacao ${i === index ? 'bg-cacao' : 'bg-transparent group-hover:bg-line'}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Slides share one grid cell so the hero keeps the height of the tallest slide. The
          minmax(0, 1fr) column stops the widest slide from forcing horizontal overflow. */}
      <div className="grid grid-cols-1" aria-live={rotating ? 'off' : 'polite'}>
        {SLIDES.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={t('b2b.hero.position', { current: i + 1, total: SLIDES.length })}
              aria-hidden={active ? undefined : true}
              inert={!active}
              className={`grid grid-cols-1 gap-6 [grid-area:1/1] md:grid-cols-2 md:items-center md:gap-10 ${active ? 'visible' : 'invisible'}`}
            >
              <div className="order-2 md:order-1">
                <p className="text-sm font-semibold tracking-widest text-copper uppercase">
                  {t(`b2b.hero.${slide.id}.eyebrow`)}
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-balance md:text-4xl">
                  {t(`b2b.hero.${slide.id}.title`)}
                </h2>
                <p className="mt-4 max-w-prose text-lg text-cacao/80">
                  {t(`b2b.hero.${slide.id}.body`)}
                </p>
                <Link to={localizePath(locale, slide.to)} className={`${buttonStyles()} mt-6`}>
                  {t(`b2b.hero.${slide.id}.cta`)}
                </Link>
              </div>
              <ImageSlot
                className="order-1 md:order-2"
                ratio="aspect-[16/10]"
                description={t(`b2b.hero.${slide.id}.image`)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
