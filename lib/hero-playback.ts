// DD-HOME-22 §4.4: pure home-stage playback rules. Kept free of DOM and React
// so the whole truth table can be unit-tested without a browser.

export type PlaybackFlags = {
  readonly reduce: boolean;
  readonly explicitPaused: boolean;
  readonly hoverPaused: boolean;
  readonly focusPaused: boolean;
};

/** Autoplay only runs when no pause flag is active. */
export function shouldAutoplay(flags: PlaybackFlags): boolean {
  return (
    !flags.reduce &&
    !flags.explicitPaused &&
    !flags.hoverPaused &&
    !flags.focusPaused
  );
}

/**
 * Advance the active index with wrap-around, including out-of-range and
 * empty-deck inputs. A negative offset moves to the previous slide.
 */
export function nextIndex(current: number, length: number, offset = 1): number {
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(length) ||
    !Number.isFinite(offset) ||
    length <= 0
  ) {
    return 0;
  }

  const step = Math.trunc(current) + Math.trunc(offset);
  return ((step % length) + length) % length;
}
