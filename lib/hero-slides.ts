// DD-HOME-22 §4.7: approved hero photos, served locally from public/slides/.
// Slides are decorative: no approved subject copy exists for slides 01/02, so
// `alt` stays empty instead of inventing content (N-22-02).

export type HeroSlide = {
  readonly id: 'slide-01' | 'slide-02' | 'slide-03';
  readonly src:
    | '/slides/hero-01.jpg'
    | '/slides/hero-02.jpg'
    | '/slides/hero-03-crema-hidratante.jpg';
  readonly alt: '';
};

export const heroSlides: readonly HeroSlide[] = [
  { id: 'slide-01', src: '/slides/hero-01.jpg', alt: '' },
  { id: 'slide-02', src: '/slides/hero-02.jpg', alt: '' },
  { id: 'slide-03', src: '/slides/hero-03-crema-hidratante.jpg', alt: '' },
];

/**
 * Minimal local allowlist for slide sources (DD-HOME-22 §4.7 QA HALL 7).
 * Deliberately not a copy of `parseImage` from home-content.ts: it only checks
 * the local manifest contract and is reused by the manifest unit test.
 */
export function isLocalSlidePath(value: string): boolean {
  return value.startsWith('/slides/') && !value.includes('://') && !value.includes('/Imagenes/');
}
