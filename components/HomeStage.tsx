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
  const [explicitPaused, setExplicitPaused] = useState(false);
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
      explicitPaused,
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

  // DD-HOME-22.5: the pause toggle is exempt from focusPaused so that
  // "Reanudar presentación" resumes even while the button keeps focus.
  const isPlaybackToggle = (target: EventTarget | null): boolean =>
    target instanceof HTMLElement && target.matches('[data-playback-toggle]');

  const pauseOnFocus = (event: FocusEvent<HTMLElement>): void => {
    setFocusPaused(!isPlaybackToggle(event.target));
  };

  const resumeOnBlur = (event: FocusEvent<HTMLElement>): void => {
    const next = event.relatedTarget;
    // Moving into the toggle from any other control clears the pause flag.
    if (isPlaybackToggle(next)) {
      setFocusPaused(false);
      return;
    }
    // focusout with relatedTarget: only clear the flag when focus really left
    // this region, not when it moved to another control inside it.
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }
    setFocusPaused(false);
  };

  // Dots point at an already-valid index; arrows move by one with wrap-around.
  // Clicking the active dot keeps focusPaused true, so the 5s counter is
  // intentionally not restarted (approved DD-HOME-22 behaviour).
  const goTo = (index: number): void => {
    setActiveIndex(index);
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
          <div className="mx-auto w-full max-w-[var(--content-max)] px-5 py-8 md:px-6 md:py-10 lg:px-8">
            <div className="hero__media">
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
                      sizes="(min-width: 640px) 448px, calc(100vw - 40px)"
                      priority={index === 0}
                      loading={index === 0 ? undefined : 'lazy'}
                      decoding="async"
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="hero__copy mx-auto mt-8 max-w-2xl text-center">{heroCopy}</div>

            {/* Controls sit directly on the white hero surface, below the copy. */}
            <div className="hero__controls mx-auto mt-6 flex w-fit flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                aria-label="Diapositiva anterior"
                onClick={() => step(-1)}
                className="rounded-pill bg-surface px-4 py-2 text-ink"
              >
                <span aria-hidden="true">‹</span>
              </button>

              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Ir a la diapositiva ${index + 1} de ${slides.length}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  onClick={() => goTo(index)}
                  className={`rounded-pill px-4 py-2 ${
                    index === activeIndex ? 'bg-primary text-white' : 'bg-surface text-ink'
                  }`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                type="button"
                aria-label="Diapositiva siguiente"
                onClick={() => step(1)}
                className="rounded-pill bg-surface px-4 py-2 text-ink"
              >
                <span aria-hidden="true">›</span>
              </button>

              <button
                type="button"
                data-playback-toggle
                aria-pressed={explicitPaused}
                onClick={() => setExplicitPaused((paused) => !paused)}
                className="rounded-pill bg-surface px-4 py-2 text-ink"
              >
                {explicitPaused ? 'Reanudar presentación' : 'Pausar presentación'}
              </button>
            </div>
          </div>
        </section>
      </div>

      <main id="contenido" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
