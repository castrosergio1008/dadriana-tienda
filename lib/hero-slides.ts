// Home hero slider: four client-supplied 3000x1100 JPGs. Sources are copied
// into public/slides/ and served as local static assets. Slides are decorative
// (no approved subject copy), so `alt` stays empty instead of inventing content.

export type HeroSlide = {
  readonly id: 'slide-01' | 'slide-02' | 'slide-03' | 'slide-04';
  readonly src:
    | '/slides/hero-1.jpg'
    | '/slides/hero-2.jpg'
    | '/slides/hero-3.jpg'
    | '/slides/hero-4.jpg';
  readonly alt: '';
};

export const heroSlides: readonly HeroSlide[] = [
  { id: 'slide-01', src: '/slides/hero-1.jpg', alt: '' },
  { id: 'slide-02', src: '/slides/hero-2.jpg', alt: '' },
  { id: 'slide-03', src: '/slides/hero-3.jpg', alt: '' },
  { id: 'slide-04', src: '/slides/hero-4.jpg', alt: '' },
];

/**
 * Minimal local allowlist for slide sources (DD-HOME-22 §4.7 QA HALL 7).
 * Deliberately not a copy of `parseImage` from home-content.ts: it only checks
 * the local manifest contract and is reused by the manifest unit test.
 */
export function isLocalSlidePath(value: string): boolean {
  return value.startsWith('/slides/') && !value.includes('://') && !value.includes('/Imagenes/');
}
