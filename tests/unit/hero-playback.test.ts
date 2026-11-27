import { describe, expect, it } from 'vitest';

import {
  nextIndex,
  shouldAutoplay,
  type PlaybackFlags,
} from '../../lib/hero-playback';

function flagsFromMask(mask: number): PlaybackFlags {
  return {
    reduce: (mask & 1) !== 0,
    explicitPaused: (mask & 2) !== 0,
    hoverPaused: (mask & 4) !== 0,
    focusPaused: (mask & 8) !== 0,
  };
}

describe('shouldAutoplay', () => {
  it('implements the complete four-flag truth table', () => {
    for (let mask = 0; mask < 16; mask += 1) {
      expect(shouldAutoplay(flagsFromMask(mask)), `flag mask ${mask}`).toBe(mask === 0);
    }
  });

  it.each([
    { label: 'reduced motion', flags: { reduce: true } },
    { label: 'explicit pause', flags: { explicitPaused: true } },
    { label: 'pointer over the slide or header', flags: { hoverPaused: true } },
    { label: 'keyboard focus inside the stage', flags: { focusPaused: true } },
  ] as const)('stops autoplay on $label', ({ flags }) => {
    const baseline: PlaybackFlags = {
      reduce: false,
      explicitPaused: false,
      hoverPaused: false,
      focusPaused: false,
    };

    expect(shouldAutoplay({ ...baseline, ...flags })).toBe(false);
  });
});

describe('nextIndex', () => {
  it.each([
    { current: 0, length: 3, expected: 1 },
    { current: 1, length: 3, expected: 2 },
    { current: 2, length: 3, expected: 0 },
    { current: 3, length: 3, expected: 1 },
    { current: 4, length: 3, expected: 2 },
    { current: -1, length: 3, expected: 0 },
    { current: -4, length: 3, expected: 0 },
    { current: 1.9, length: 3, expected: 2 },
  ])('maps $current on a deck of $length to $expected', ({ current, length, expected }) => {
    expect(nextIndex(current, length)).toBe(expected);
  });

  it.each([
    { current: 0, length: 3, offset: -1, expected: 2 },
    { current: 2, length: 3, offset: -1, expected: 1 },
    { current: 0, length: 3, offset: Number.NaN, expected: 0 },
    { current: 1, length: 3, offset: 1.9, expected: 2 },
  ])(
    'maps $current with offset $offset on a deck of $length to $expected',
    ({ current, length, offset, expected }) => {
      expect(nextIndex(current, length, offset)).toBe(expected);
    },
  );

  it.each([
    { current: 0, length: 0 },
    { current: 2, length: -1 },
    { current: Number.NaN, length: 3 },
    { current: 1, length: Number.POSITIVE_INFINITY },
  ])('falls back to slide 0 for invalid deck $length', ({ current, length }) => {
    expect(nextIndex(current, length)).toBe(0);
  });

  it('keeps a single-slide deck on slide 0', () => {
    expect(nextIndex(0, 1)).toBe(0);
    expect(nextIndex(5, 1)).toBe(0);
  });
});
