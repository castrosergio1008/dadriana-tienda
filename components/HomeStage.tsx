'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react';

import type { HeroSlide } from '@/lib/hero-slides';
import { nextIndex, shouldAutoplay } from '@/lib/hero-playback';

type HomeStageProps = {
  chrome: ReactNode;
  heroCopy: ReactNode;
  slides: readonly HeroSlide[];
  children: ReactNode;
};

const AUTOPLAY_MS = 5000;

/**
 * The only Client Component in the Home stage. All copy, navigation and the
 * rest of <main> arrive as server-rendered slots: no client fetch and no
 * duplicated React state outside the slide index and pause flags.
 */
export function HomeStage({ chrome, heroCopy, slides, children }: HomeStageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  // `null` until the media query has been read: deterministic SSR/first paint
  // and no interval can be scheduled before reduced-motion is known.
  const [reduce, setReduce] = useState<boolean | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // QA hydration marker: the SSR markup is identical on every render, and
  // E2E clock tests wait for this attribute before driving virtual time.
  useEffect(() => {
    stageRef.current?.setAttribute('data-hydrated', 'true');
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(query.matches);

    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const canAutoplay =
    reduce !== null &&
    shouldAutoplay({
      reduce,
      explicitPaused: false,
      hoverPaused,
      focusPaused,
    });

  useEffect(() => {
    if (!canAutoplay) return;

    const timer = window.setInterval(() => {
      // R-22-15: a hidden tab must not advance the deck.
      if (document.visibilityState !== 'visible') return;
      setActiveIndex((current) => nextIndex(current, slides.length));
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [canAutoplay, activeIndex, slides.length]);

  const pauseOnPointerEnter = () => setHoverPaused(true);
  const resumeOnPointerLeave = () => setHoverPaused(false);

  const pauseOnFocus = (_event: FocusEvent<HTMLElement>): void => {
    setFocusPaused(true);
  };

  const resumeOnBlur = (event: FocusEvent<HTMLElement>): void => {
    const next = event.relatedTarget;
    // focusout with relatedTarget: only clear the flag when focus really left
    // this region, not when it moved to another control inside it.
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }
    setFocusPaused(false);
  };

  const step = (offset: number): void => {
    setActiveIndex((current) => nextIndex(current, slides.length, offset));
  };

  return (
    <div ref={stageRef} className="home-stage">
      <div className="home-stage__viewport">
        <div className="home-stage__chrome">{chrome}</div>

        <section
          id="main"
          tabIndex={-1}
          aria-labelledby="hero-title"
          className="hero relative"
          onPointerEnter={pauseOnPointerEnter}
          onPointerLeave={resumeOnPointerLeave}
          onFocus={pauseOnFocus}
          onBlur={resumeOnBlur}
        >
          {/* Full-width hero frame: aspect ratio matches the 3000x1100 source
              bitmaps so the image fills the slider without gaps or letterboxing. */}
          <div className="hero__media relative">
            <div className="hero__frame">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden={index === activeIndex ? undefined : true}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="100vw"
                    priority={index === 0}
                    loading={index === 0 ? undefined : 'lazy'}
                    decoding="async"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              aria-label="Diapositiva anterior"
              onClick={() => step(-1)}
              className="hero__arrow hero__arrow--prev absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-soft backdrop-blur-sm transition hover:bg-white focus-visible:bg-white md:left-5"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="Diapositiva siguiente"
              onClick={() => step(1)}
              className="hero__arrow hero__arrow--next absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-soft backdrop-blur-sm transition hover:bg-white focus-visible:bg-white md:right-5"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="mx-auto w-full max-w-[var(--content-max)] px-5 py-8 md:px-6 md:py-10 lg:px-8">
            <div className="hero__copy mx-auto mt-8 max-w-2xl text-center">{heroCopy}</div>
          </div>
        </section>
      </div>

      <main id="contenido" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
