import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const HERO = 'section[aria-labelledby="hero-title"]';
const APPROVED_H1 = 'Belleza para tu piel y tu cabello';
const PRIMARY_BORDER = 'rgb(27, 93, 74)';
const INK: Rgb = [18, 63, 51];
const SIZES = '100vw';

// DD-HOME-27 v0.4 §14.4: full-width band whose height is a function of width,
// not of the viewport height; the 768x600 case proves svh no longer matters.
const BAND_CASES = [
  { width: 320, height: 568, expectedWidth: 320, expectedHeight: 118 },
  { width: 375, height: 812, expectedWidth: 375, expectedHeight: 139 },
  { width: 600, height: 900, expectedWidth: 600, expectedHeight: 222 },
  { width: 767, height: 900, expectedWidth: 767, expectedHeight: 283 },
  { width: 768, height: 900, expectedWidth: 768, expectedHeight: 284 },
  { width: 820, height: 900, expectedWidth: 820, expectedHeight: 303 },
  { width: 900, height: 900, expectedWidth: 900, expectedHeight: 332 },
  { width: 1023, height: 900, expectedWidth: 1023, expectedHeight: 378 },
  { width: 1024, height: 900, expectedWidth: 1024, expectedHeight: 378 },
  { width: 1440, height: 900, expectedWidth: 1440, expectedHeight: 532 },
  { width: 768, height: 600, expectedWidth: 768, expectedHeight: 284 },
] as const;

type Rgb = readonly [number, number, number];
type LcpSample = { element: string; source: string | null; startTime: number };
type IntervalProbe = {
  active: Set<number>;
  calls: number[];
  delaysById: Map<number, number>;
  cleared: number[];
};

type PixelTarget = {
  name: string;
  selector: string;
  foreground: Rgb;
  columns?: number;
  rows?: number;
  outside?: number;
  adjacent?: number;
};

declare global {
  interface Window {
    __lcpSamples?: LcpSample[];
    __layoutShift?: number;
    __shiftByInput?: number;
    __intervalProbe?: IntervalProbe;
  }
}

// DD-HOME-27 §13 / ADR-HOME-28-01 §13: client assets are copied byte-for-byte
// into public/slides/; slide-04 now uses the final 2880x1100 JPEG.
const approvedSlides = [
  {
    source: 'hero-1.jpg',
    destination: 'public/slides/hero-1.jpg',
    sha256: '59127cdadf561af0d9d4acdaa14e2601b471bb31b683aac538a9a0de89e15d45',
  },
  {
    source: 'hero-2.jpg',
    destination: 'public/slides/hero-2.jpg',
    sha256: '70b830e0c52e0e0b6712113ae79b9f34c6de01ce5317df7d5a9250387ca31836',
  },
  {
    source: 'hero-3.jpg',
    destination: 'public/slides/hero-3.jpg',
    sha256: 'c9c834c87e3037a638a2bc722b7c49d02cdacb8bba4942a02c4038e859886cbd',
  },
  {
    source: 'hero-4.jpg',
    destination: 'public/slides/hero-4.jpg',
    sha256: 'd1931b2782e3e5546d8f273f38bc737b7d2cd7de811ae94c01b24a9063bcab48',
  },
] as const;

function sha256(relativePath: string): string {
  const absolutePath = join(process.cwd(), relativePath);
  expect(existsSync(absolutePath), `${relativePath} must exist`).toBe(true);
  return createHash('sha256').update(readFileSync(absolutePath)).digest('hex');
}

function luminance(rgb: Rgb): number {
  const channels = rgb.map((component) => {
    const channel = component / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first: Rgb, second: Rgb): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function waitForHydration(page: Page): Promise<void> {
  await expect(page.locator('.home-stage')).toHaveAttribute('data-hydrated', 'true');
  await expect(page.locator('[data-playback-toggle]')).toBeVisible();
  await expect(page.locator('[data-playback-toggle]')).toBeEnabled();
}

async function activeSlide(page: Page): Promise<number> {
  const dot = page.locator(`${HERO} button[aria-current="true"]`);
  await expect(dot).toHaveCount(1);
  const label = await dot.getAttribute('aria-label');
  const match = label?.match(/^Ir a la diapositiva (\d) de 4$/);
  if (!match) throw new Error(`Unexpected active dot label: ${label ?? 'null'}`);
  return Number(match[1]);
}

async function parkPointerOutsideStage(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.mouse.move(6, 6);
}

// clock.install() keeps advancing in real time: runFor() would fire the 5s
// interval early. Install and immediately freeze on a fixed future base so
// every runFor() is measured from a known point.
async function installPausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: new Date('2030-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2030-01-01T12:00:01Z'));
}

async function injectIntervalProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const active = new Set<number>();
    const calls: number[] = [];
    const delaysById = new Map<number, number>();
    const cleared: number[] = [];
    const nativeSet = window.setInterval;
    const nativeClear = window.clearInterval;

    window.setInterval = ((handler: () => void, timeout?: number, ...args: unknown[]) => {
      const id = nativeSet(handler, timeout, ...args);
      active.add(id);
      delaysById.set(id, timeout ?? 0);
      calls.push(timeout ?? 0);
      return id;
    }) as typeof window.setInterval;

    window.clearInterval = ((id: number | undefined) => {
      if (id !== undefined) {
        active.delete(id);
        cleared.push(id);
      }
      nativeClear(id);
    }) as typeof window.clearInterval;

    window.__intervalProbe = { active, calls, delaysById, cleared };
  });
}

async function sampleCompositedBackgrounds(
  page: Page,
  targets: readonly PixelTarget[],
): Promise<Record<string, Array<[number, number, number]>>> {
  const png = await page.locator(HERO).screenshot();
  return page.evaluate(
    async ({ imageSource, specs }) => {
      const image = new Image();
      image.src = imageSource;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('2D canvas context unavailable');
      context.drawImage(image, 0, 0);

      const hero = document.querySelector('section[aria-labelledby="hero-title"]');
      if (!(hero instanceof HTMLElement)) throw new Error('hero screenshot target not found');
      const heroRect = hero.getBoundingClientRect();
      const read = (x: number, y: number): [number, number, number] => {
        const data = context.getImageData(Math.round(x), Math.round(y), 1, 1).data;
        return [data[0], data[1], data[2]];
      };
      const lightness = (pixel: [number, number, number]): number =>
        0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2];
      // Same 5x5 neighbourhood heuristic for every target: keep the extremum
      // that represents background, opposite to the glyph colour.
      const backgroundAt = (
        x: number,
        y: number,
        lightForeground: boolean,
      ): [number, number, number] => {
        let best = read(x, y);
        let bestLightness = lightness(best);
        for (let dy = -2; dy <= 2; dy += 1) {
          for (let dx = -2; dx <= 2; dx += 1) {
            const px = Math.min(canvas.width - 1, Math.max(0, Math.round(x + dx)));
            const py = Math.min(canvas.height - 1, Math.max(0, Math.round(y + dy)));
            const pixel = read(px, py);
            const value = lightness(pixel);
            if (lightForeground ? value < bestLightness : value > bestLightness) {
              best = pixel;
              bestLightness = value;
            }
          }
        }
        return best;
      };

      const result: Record<string, Array<[number, number, number]>> = {};
      for (const spec of specs) {
        const elements = Array.from(document.querySelectorAll(spec.selector)).filter((element) => {
          if (!(element instanceof HTMLElement)) return false;
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility === 'visible' &&
            style.display !== 'none'
          );
        });
        if (elements.length === 0) throw new Error(`No visible pixel target: ${spec.name}`);
        const pixels: Array<[number, number, number]> = [];
        const lightForeground =
          spec.foreground[0] > 200 && spec.foreground[1] > 200 && spec.foreground[2] > 200;
        for (const element of elements) {
          const rect = element.getBoundingClientRect();
          if (spec.outside !== undefined) {
            const centerY = rect.top + rect.height / 2 - heroRect.top;
            pixels.push(read(rect.left - heroRect.left - spec.outside, centerY));
            pixels.push(read(rect.right - heroRect.left + spec.outside, centerY));
            continue;
          }
          if (spec.adjacent !== undefined) {
            const offset = spec.adjacent;
            const centerX = rect.left - heroRect.left + rect.width / 2;
            const centerY = rect.top - heroRect.top + rect.height / 2;
            pixels.push(
              backgroundAt(rect.left - heroRect.left - offset, centerY, lightForeground),
            );
            pixels.push(
              backgroundAt(rect.right - heroRect.left + offset, centerY, lightForeground),
            );
            pixels.push(
              backgroundAt(centerX, rect.top - heroRect.top - offset, lightForeground),
            );
            pixels.push(
              backgroundAt(centerX, rect.bottom - heroRect.top + offset, lightForeground),
            );
            continue;
          }
          const columns = spec.columns ?? 3;
          const rows = spec.rows ?? 3;
          for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
              pixels.push(
                backgroundAt(
                  rect.left - heroRect.left + ((column + 0.5) * rect.width) / columns,
                  rect.top - heroRect.top + ((row + 0.5) * rect.height) / rows,
                  lightForeground,
                ),
              );
            }
          }
        }
        result[spec.name] = pixels;
      }
      return result;
    },
    { imageSource: `data:image/png;base64,${png.toString('base64')}`, specs: targets },
  );
}

// QA-EXC-28-01 / forge-qualis: decode() has no own deadline and inherits the
// 60s test timeout. The budget lives in Node (not in the page clock, which some
// tests pause) so an optimizer stall under a fully parallel suite fails with a
// clear message instead of a mute timeout. Workers=1 needs ~1.5s; 30s leaves
// headroom without weakening the geometry assertions below.
async function waitForImagesLoaded(
  page: Page,
  selector: string,
  timeoutMs = 30_000,
): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      page.locator(selector).evaluateAll(async (elements) => {
        await Promise.all(
          elements.map(async (element) => {
            if (element instanceof HTMLImageElement) await element.decode();
          }),
        );
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`slide images in ${selector} not decoded in ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// DD-HOME-27 C-2 / ADR-HOME-28-01 (source-capped): next/image uses
// withoutEnlargement, so the requested `w` cannot add detail beyond the source:
// 1018 px for PNGs 01-03 (0.71 source px per CSS px at 1440) and 2880 px for
// the 2880x1100 JPEG (2.00). This guard verifies the band geometry and that every
// slide loads; the effective density is measured separately in HOME-E2E-54.
async function assertSharpBand(
  page: Page,
  { width, height }: { width: number; height: number },
): Promise<void> {
  await waitForImagesLoaded(page, `${HERO} img`);

  const band = await page.evaluate(() => {
    const element = document.querySelector('.hero__frame');
    if (!(element instanceof HTMLElement)) throw new Error('hero frame not found');
    const rect = element.getBoundingClientRect();
    const images = Array.from(element.querySelectorAll('img'));
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height,
      clientWidth: document.documentElement.clientWidth,
      images: images.map((image) => {
        if (!(image instanceof HTMLImageElement)) throw new Error('slide image not found');
        return {
          fit: getComputedStyle(image).objectFit,
          naturalWidth: image.naturalWidth,
          sourceWidth: Number(
            new URL(image.currentSrc, window.location.href).searchParams.get('w') ?? 0,
          ),
        };
      }),
    };
  });

  expect(band.images).toHaveLength(5);
  for (const image of band.images) {
    expect(image.fit).toBe('contain');
    expect(image.naturalWidth).toBeGreaterThan(0);
    expect(image.sourceWidth).toBeGreaterThan(0);
  }
  // The frame ratio matches bitmaps 01-03; slide 04 letterboxes by design.
  expect(Math.abs(band.width / band.height - 1018 / 376)).toBeLessThan(0.02);
  expect(Math.abs(band.width - width)).toBeLessThanOrEqual(1);
  expect(Math.abs(band.height - height)).toBeLessThanOrEqual(1);
  expect(band.left).toBe(0);
  expect(Math.abs(band.right - band.clientWidth)).toBeLessThanOrEqual(1);
}

test.describe('HOME-E2E-30 — deterministic 5s autoplay @smoke', () => {
  test('4999ms is stable, then each 5000ms step wraps 2 to 1 @smoke', async ({ page }) => {
    await installPausedClock(page);
    await page.goto('/');
    await waitForHydration(page);
    await parkPointerOutsideStage(page);

    expect(await activeSlide(page)).toBe(1);
    await page.clock.runFor(4999);
    await page.clock.runFor(0);
    expect(await activeSlide(page)).toBe(1);

    for (const expected of [2, 3, 4, 5, 1]) {
      await page.clock.runFor(4999);
      await page.clock.runFor(1);
      await page.clock.runFor(0);
      expect(await activeSlide(page)).toBe(expected);
    }
  });
});

test.describe('HOME-E2E-31 — pause flags and timer cleanup @smoke @a11y', () => {
  test('hovering the slide freezes the deck @smoke @a11y', async ({ page }) => {
    await installPausedClock(page);
    await page.goto('/');
    await waitForHydration(page);
    await page.locator(HERO).hover();

    await page.clock.runFor(6000);
    await page.clock.runFor(0);
    expect(await activeSlide(page)).toBe(1);
  });

  // D-23-06: the header is normal chrome again; only the slide may pause.
  test('HOME-E2E-40: hovering the header does not freeze the deck @smoke @a11y', async ({
    page,
  }) => {
    await installPausedClock(page);
    await page.goto('/');
    await waitForHydration(page);
    await page.locator('.home-stage__chrome').hover();

    await page.clock.runFor(5000);
    await page.clock.runFor(0);
    expect(await activeSlide(page)).toBe(2);
  });

  test('focus on an arrow freezes the deck @smoke @a11y', async ({ page }) => {
    await installPausedClock(page);
    await page.goto('/');
    await waitForHydration(page);
    await parkPointerOutsideStage(page);
    const next = page.getByRole('button', { name: 'Diapositiva siguiente' });
    await next.focus();

    await page.clock.runFor(6000);
    await page.clock.runFor(0);
    expect(await activeSlide(page)).toBe(1);
  });

  test('explicit toggle holds, then resumes with focus still on the toggle @smoke @a11y', async ({
    page,
  }) => {
    await installPausedClock(page);
    await page.goto('/');
    await waitForHydration(page);
    await parkPointerOutsideStage(page);
    const toggle = page.locator('[data-playback-toggle]');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await parkPointerOutsideStage(page);
    await page.clock.runFor(6000);
    await page.clock.runFor(0);
    expect(await activeSlide(page)).toBe(1);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toBeFocused();
    await parkPointerOutsideStage(page);
    await page.clock.runFor(4999);
    await page.clock.runFor(1);
    await page.clock.runFor(0);
    // DD-HOME-22.5: the toggle is exempt from focusPaused.
    expect(await activeSlide(page)).toBe(2);
  });

  test('hidden visibility freezes and visible resumes @smoke @a11y', async ({ page }) => {
    await installPausedClock(page);
    await page.goto('/');
    await waitForHydration(page);
    await parkPointerOutsideStage(page);

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.runFor(6000);
    await page.clock.runFor(0);
    expect(await activeSlide(page)).toBe(1);

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    // The interval is still at its T+10000 tick after the skipped hidden
    // tick: from T+6000 advance 3999ms (still slide 1), then the final 1ms.
    await page.clock.runFor(3999);
    await page.clock.runFor(0);
    expect(await activeSlide(page)).toBe(1);
    await page.clock.runFor(1);
    await page.clock.runFor(0);
    expect(await activeSlide(page)).toBe(2);
  });

  test('reduced motion clears the running interval in the same document @smoke @a11y', async ({
    page,
  }) => {
    await injectIntervalProbe(page);
    await page.goto('/');
    await waitForHydration(page);
    await parkPointerOutsideStage(page);

    const autoplayIds = await page.evaluate(() =>
      Array.from(window.__intervalProbe?.delaysById.entries() ?? [])
        .filter(([, delay]) => delay === 5000)
        .map(([id]) => id),
    );
    expect(autoplayIds.length, 'one 5000ms interval must be running').toBeGreaterThan(0);

    // Flip the media query in place: navigating away would re-inject a fresh
    // probe and turn this assertion into a false green.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect
      .poll(() =>
        page.evaluate((ids) => {
          const probe = window.__intervalProbe;
          if (!probe) return { cleared: [] as number[], active: ids };
          return {
            cleared: ids.filter((id) => probe.cleared.includes(id)),
            active: ids.filter((id) => probe.active.has(id)),
          };
        }, autoplayIds),
      )
      .toEqual({ cleared: autoplayIds, active: [] });

    // Reduced motion from the first render must never schedule a 5000ms timer.
    await page.goto('/');
    await waitForHydration(page);
    expect(
      await page.evaluate(
        () => window.__intervalProbe?.calls.filter((delay) => delay === 5000) ?? [],
      ),
    ).toEqual([]);
  });
});

test.describe('HOME-E2E-32 — reduced motion @smoke @a11y', () => {
  test.use({ reducedMotion: 'reduce' });

  test('zero 5s intervals, instant manual navigation @smoke @a11y', async ({ page }) => {
    await injectIntervalProbe(page);
    await installPausedClock(page);
    await page.goto('/');
    await waitForHydration(page);
    await parkPointerOutsideStage(page);

    expect(
      await page.evaluate(
        () => window.__intervalProbe?.calls.filter((delay) => delay === 5000) ?? [],
      ),
    ).toEqual([]);
    await page.clock.runFor(6000);
    await page.clock.runFor(0);
    expect(await activeSlide(page)).toBe(1);

    const styles = await page.locator(HERO).evaluate((hero) => {
      const link = hero.querySelector('a');
      if (!link) throw new Error('hero CTA not found');
      const computed = getComputedStyle(link);
      return {
        transition: computed.transitionDuration,
        animation: computed.animationName,
      };
    });
    expect(styles.transition).toBe('0s');
    expect(styles.animation).toBe('none');

    await page.getByRole('button', { name: 'Diapositiva siguiente' }).click();
    await expect(page.getByRole('button', { name: 'Ir a la diapositiva 2 de 5' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });
});

test('HOME-E2E-33: keyboard controls keep focus and expose exact names @a11y', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);

  const names = [
    'Diapositiva anterior',
    'Diapositiva siguiente',
    'Ir a la diapositiva 1 de 5',
    'Ir a la diapositiva 2 de 5',
    'Ir a la diapositiva 3 de 5',
    'Ir a la diapositiva 4 de 5',
    'Ir a la diapositiva 5 de 5',
    'Pausar presentación',
  ];
  for (const name of names) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(1);
  }
  await expect(page.locator(`${HERO} button[aria-current="true"]`)).toHaveCount(1);

  const next = page.getByRole('button', { name: 'Diapositiva siguiente', exact: true });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(next).toBeFocused();
  expect(await activeSlide(page)).toBe(2);
  await page.keyboard.press('Space');
  await expect(next).toBeFocused();
  expect(await activeSlide(page)).toBe(3);
  await page.keyboard.press('Enter');
  await expect(next).toBeFocused();
  expect(await activeSlide(page)).toBe(4);
  await page.keyboard.press('Enter');
  await expect(next).toBeFocused();
  expect(await activeSlide(page)).toBe(5);
  await page.keyboard.press('Enter');
  await expect(next).toBeFocused();
  expect(await activeSlide(page)).toBe(1);

  const firstDot = page.getByRole('button', {
    name: 'Ir a la diapositiva 1 de 5',
    exact: true,
  });
  await firstDot.focus();
  await page.keyboard.press('Enter');
  await expect(firstDot).toBeFocused();
  expect(await activeSlide(page)).toBe(1);
});

test.describe('HOME-E2E-34 — light slide below a static header, natural-height block @smoke @a11y', () => {
  // DD-HOME-27 v0.4 §14.4: band height is a function of width, not of svh.
  // Breakpoint edges, widths in between, and a short-height case: the band
  // spans the document content width with its bitmap-ratio reserved height.
  for (const { width, height, expectedWidth, expectedHeight } of BAND_CASES) {
    test(`${width}x${height}px: opaque white header above a natural-height slide, no overlap @smoke @a11y`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await waitForHydration(page);

      const geometry = await page.evaluate(() => {
        const header = document.querySelector('header');
        const wrapper = document.querySelector('.home-stage__chrome');
        const h1 = document.querySelector('h1');
        const hero = document.querySelector('section[aria-labelledby="hero-title"]');
        const viewport = document.querySelector('.home-stage__viewport');
        const frame = document.querySelector('.hero__frame');
        if (
          !(header instanceof HTMLElement) ||
          !(wrapper instanceof HTMLElement) ||
          !(h1 instanceof HTMLElement) ||
          !(hero instanceof HTMLElement) ||
          !(viewport instanceof HTMLElement) ||
          !(frame instanceof HTMLElement)
        ) {
          throw new Error('Hero chrome not found');
        }
        const headerRect = header.getBoundingClientRect();
        const h1Rect = h1.getBoundingClientRect();
        const heroRect = hero.getBoundingClientRect();
        const frameRect = frame.getBoundingClientRect();
        const viewportStyle = getComputedStyle(viewport);
        return {
          headerBackground: getComputedStyle(header).backgroundColor,
          wrapperBackground: getComputedStyle(wrapper).backgroundColor,
          border: getComputedStyle(header).borderBottom,
          wrapperBorder: getComputedStyle(wrapper).borderBottomWidth,
          overlap: Math.max(
            0,
            Math.min(headerRect.bottom, h1Rect.bottom) - Math.max(headerRect.top, h1Rect.top),
          ),
          heroTop: heroRect.top,
          headerBottom: headerRect.bottom,
          frameWidth: frameRect.width,
          frameHeight: frameRect.height,
          viewportDisplay: viewportStyle.display,
          viewportDirection: viewportStyle.flexDirection,
          viewportMinHeight: Number.parseFloat(viewportStyle.minHeight),
          heroFlexGrow: Number.parseFloat(getComputedStyle(hero).flexGrow),
        };
      });

      expect(geometry.headerBackground).toBe('rgb(255, 255, 255)');
      expect(geometry.wrapperBackground).toBe('rgb(255, 255, 255)');
      expect(geometry.border).toBe(`2px solid ${PRIMARY_BORDER}`);
      expect(geometry.wrapperBorder).toBe('0px');
      expect(geometry.overlap).toBe(0);
      // DD-HOME-27: the stage keeps its flex anchor but no viewport floor.
      expect(geometry.viewportDisplay).toBe('flex');
      expect(geometry.viewportDirection).toBe('column');
      expect(geometry.viewportMinHeight).toBe(0);
      expect(geometry.heroFlexGrow).toBe(0);
      // The natural-height slide starts right after the header; it no longer fills it.
      expect(Math.abs(geometry.heroTop - geometry.headerBottom)).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.frameWidth - expectedWidth)).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.frameHeight - expectedHeight)).toBeLessThanOrEqual(1);

      const expectNoOverflow = async () => {
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
      };
      await expectNoOverflow();
      for (const slide of [2, 3, 4, 5, 1]) {
        await page
          .getByRole('button', { name: `Ir a la diapositiva ${slide} de 5` })
          .click();
        await expectNoOverflow();
      }
    });
  }

  for (const width of [375, 767]) {
    test(`touch ${width}px: coarse pointer sees the same opaque white header @touch @smoke @a11y`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
      await page.goto('/');
      await waitForHydration(page);

      const coarse = await page.evaluate(() =>
        window.matchMedia('(hover: none), (pointer: coarse)').matches,
      );
      expect(coarse, 'touch branch must be active before asserting the colour').toBe(true);
      await expect(page.locator('header')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(page.locator('.home-stage__chrome')).toHaveCSS(
        'background-color',
        'rgb(255, 255, 255)',
      );
    });
  }
});

test.describe('HOME-E2E-35 — composited pixel sampling @a11y', () => {
  for (const width of [375, 768, 1440]) {
    const height = width === 375 ? 812 : 900;

    test(`${width}px: copy and focus contrast on all five slides @a11y`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await waitForHydration(page);

      // DD-HOME-24: the copy sits on white below the photograph, so the
      // sampled foreground is ink; the header stays opaque white chrome.
      await expect(page.locator('header')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(page.locator(HERO)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(page.locator('#hero-title')).toHaveCSS('color', 'rgb(18, 63, 51)');
      for (const paragraph of await page.locator('.hero__copy p').all()) {
        await expect(paragraph).toHaveCSS('color', 'rgb(18, 63, 51)');
      }

      for (const slide of [1, 2, 3, 4, 5]) {
        await page
          .getByRole('button', { name: `Ir a la diapositiva ${slide} de 5` })
          .click();
        await page.locator(`${HERO} img`).nth(slide - 1).evaluate((element) => {
          if (!(element instanceof HTMLImageElement)) throw new Error('slide image not found');
          return element.decode();
        });

        const toggle = page.locator('[data-playback-toggle]');
        await toggle.focus();

        const targets: PixelTarget[] = [
          {
            // The 56px headline has strokes wider than the helper's 5x5
            // neighbourhood, so sample the white composited around the box.
            name: 'headline',
            selector: '#hero-title',
            foreground: INK,
            adjacent: 6,
          },
          {
            name: 'copy paragraphs',
            selector: '.hero__copy p',
            foreground: INK,
            columns: 3,
            rows: 3,
          },
          {
            name: 'focus ring',
            selector: '[data-playback-toggle]',
            foreground: INK,
            outside: 6,
          },
        ];
        const samples = await sampleCompositedBackgrounds(page, targets);

        for (const target of targets) {
          const pixels = samples[target.name];
          expect(pixels?.length, `${width}px slide ${slide} ${target.name} samples`).toBeGreaterThan(
            0,
          );
          const worst = Math.min(
            ...(pixels ?? []).map((pixel) => contrast(target.foreground, [pixel[0], pixel[1], pixel[2]])),
          );
          const minimum = target.name === 'focus ring' ? 3 : 4.5;
          expect(worst, `${width}px slide ${slide} ${target.name} contrast`).toBeGreaterThanOrEqual(
            minimum,
          );
        }
      }
    });
  }
});

test('HOME-E2E-36: optimized local slides, AVIF/WebP and CLS without fake clock @smoke', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__layoutShift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value: number };
        if (!shift.hadRecentInput) {
          window.__layoutShift = (window.__layoutShift ?? 0) + shift.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  const images = page.locator(`${HERO} img`);
  await expect(images).toHaveCount(5);
  const sources = await images.evaluateAll((elements) =>
    elements.map((element) => ({
      src: element.getAttribute('src') ?? '',
      srcset: element.getAttribute('srcset') ?? '',
      sizes: element.getAttribute('sizes'),
      loading: element.getAttribute('loading'),
    })),
  );
  for (const source of sources) {
    const parsed = new URL(source.src, 'http://localhost');
    expect(parsed.pathname).toBe('/_next/image');
    expect(parsed.searchParams.get('url')).toMatch(/^\/slides\/(hero-[1-3]\.png|hero-[56]\.jpg)$/);
    expect(source.srcset).toContain('/_next/image?url=');
    // DD-HOME-27: the band uses the document content width.
    expect(source.sizes).toBe(SIZES);
  }
  // Next.js 15 emits a <link rel="preload" as="image"> for priority images
  // instead of putting fetchpriority="high" on the <img> itself.
  const preloads = await page
    .locator('link[rel="preload"][as="image"]')
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('imagesrcset') ?? ''),
    );
  // D-23-05: count only slide preloads; the normal header now preloads the logo too.
  const decodedPreloads = preloads.map((value) => decodeURIComponent(value));
  const slidePreloads = decodedPreloads.filter((value) => value.includes('/slides/'));
  expect(slidePreloads).toHaveLength(1);
  expect(slidePreloads[0]).toContain('hero-1.png');
  expect(slidePreloads.some((value) => value.includes('hero-2.png'))).toBe(false);
  expect(slidePreloads.some((value) => value.includes('hero-3.png'))).toBe(false);
  expect(slidePreloads.some((value) => value.includes('hero-5.jpg'))).toBe(false);
  expect(slidePreloads.some((value) => value.includes('hero-6.jpg'))).toBe(false);
  expect(decodedPreloads.some((value) => value.includes('/brand/logo.png'))).toBe(true);

  expect(sources[0]?.loading).toBeNull();
  expect(sources.slice(1).map((source) => source.loading)).toEqual([
    'lazy',
    'lazy',
    'lazy',
    'lazy',
  ]);

  const optimized = await page.request.get(
    '/_next/image?url=%2Fslides%2Fhero-1.png&w=640&q=75',
    { headers: { Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' } },
  );
  expect(optimized.ok()).toBe(true);
  expect(optimized.headers()['content-type']).toMatch(/^image\/(avif|webp)/);

  const cls = await page.evaluate(() => window.__layoutShift ?? 0);
  expect(cls).toBeLessThan(0.1);
});

test('HOME-E2E-38: slide provenance and no remote or raw image sources @smoke', async ({ page }) => {
  for (const slide of approvedSlides) {
    expect(sha256(slide.source)).toBe(slide.sha256);
    expect(sha256(slide.destination)).toBe(slide.sha256);
  }

  await page.goto('/');
  const sources = await page.locator('img').evaluateAll((elements) =>
    elements.map((element) => ({
      src: element.getAttribute('src') ?? '',
      srcset: element.getAttribute('srcset') ?? '',
    })),
  );
  for (const source of sources.flatMap((entry) => [
    entry.src,
    ...entry.srcset.split(',').map((part) => part.trim().split(/\s+/)[0] ?? ''),
  ])) {
    if (!source) continue;
    const parsed = new URL(source, 'http://localhost');
    expect(parsed.protocol, source).toBe('http:');
    const target =
      parsed.pathname === '/_next/image' ? (parsed.searchParams.get('url') ?? '') : parsed.pathname;
    expect(target, source).not.toContain('/Imagenes/');
  }
});

test('HOME-E2E-39: LCP candidate is slide 01 or the approved H1', async ({ page }) => {
  await page.addInitScript(() => {
    window.__lcpSamples = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const candidate = entry as PerformanceEntry & { element?: Element };
        const element = candidate.element;
        window.__lcpSamples?.push({
          element: element?.tagName ?? 'unknown',
          source: element instanceof HTMLImageElement ? element.currentSrc : null,
          startTime: candidate.startTime,
        });
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });

  await page.goto('/');
  await page.waitForTimeout(1200);
  const samples = await page.evaluate(() => window.__lcpSamples ?? []);
  expect(samples.length).toBeGreaterThan(0);

  const last = samples[samples.length - 1];
  expect(
    last.element === 'H1' || (last.element === 'IMG' && /hero-1\.png/.test(last.source ?? '')),
    `unexpected LCP candidate: ${JSON.stringify(last)}`,
  ).toBe(true);
  await expect(page.locator('h1').first()).toHaveText(APPROVED_H1);
});

type Box = { top: number; left: number; width: number; height: number };
type SlideMetrics = {
  frame: Box;
  title: Box;
  controls: Box;
  scrollHeight: number;
};

async function readSlideMetrics(page: Page): Promise<SlideMetrics> {
  return page.evaluate(() => {
    const pick = (selector: string): Box => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) throw new Error(`Missing element: ${selector}`);
      const { top, left, width, height } = element.getBoundingClientRect();
      return { top, left, width, height };
    };
    return {
      frame: pick('.hero__frame'),
      title: pick('#hero-title'),
      controls: pick('.hero__controls'),
      scrollHeight: document.documentElement.scrollHeight,
    };
  });
}

function expectSameLayout(before: SlideMetrics, after: SlideMetrics): void {
  for (const key of ['frame', 'title', 'controls'] as const) {
    for (const axis of ['top', 'left', 'width', 'height'] as const) {
      expect(Math.abs(before[key][axis] - after[key][axis]), `${key}.${axis}`).toBeLessThanOrEqual(
        1,
      );
    }
  }
  expect(Math.abs(before.scrollHeight - after.scrollHeight)).toBeLessThanOrEqual(1);
}

test.describe('HOME-E2E-41 — no velo over the photograph @smoke @a11y', () => {
  for (const width of [375, 768, 1440]) {
    test(`${width}px: zero scrim nodes, zero scrim rules, zero tints @smoke @a11y`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
      await page.goto('/');
      await waitForHydration(page);

      for (const slide of [1, 2, 3, 4, 5]) {
        await page.getByRole('button', { name: `Ir a la diapositiva ${slide} de 5` }).click();
        await expect(page.locator('.hero__scrim')).toHaveCount(0);
      }

      const cssText = await page.evaluate(async () => {
        const parts: string[] = [];
        for (const node of Array.from(document.querySelectorAll('link[rel="stylesheet"]'))) {
          const href = node.getAttribute('href');
          if (!href) continue;
          const response = await fetch(new URL(href, window.location.href));
          if (response.ok) parts.push(await response.text());
        }
        for (const node of Array.from(document.querySelectorAll('style'))) {
          parts.push(node.textContent ?? '');
        }
        return parts.join('\n');
      });
      expect(cssText.length).toBeGreaterThan(0);
      expect(cssText).not.toContain('.hero__scrim');
      await expect(page.locator(HERO)).toHaveCSS('background-color', 'rgb(255, 255, 255)');

      const overlays = await page.evaluate(() => {
        const frame = document.querySelector('.hero__frame');
        if (!(frame instanceof HTMLElement)) throw new Error('hero frame not found');
        const offenders: string[] = [];
        for (const node of [frame, ...Array.from(frame.querySelectorAll('*'))]) {
          if (!(node instanceof HTMLElement)) continue;
          const image = getComputedStyle(node).backgroundImage;
          const translucentInk = /rgba\(\s*18,\s*63,\s*51,\s*(?:0|0?\.\d+)\s*\)/.test(image);
          if (image.includes('gradient') || translucentInk) {
            offenders.push(`${node.tagName}.${node.className}: ${image}`);
          }
        }
        return offenders;
      });
      expect(overlays).toEqual([]);
    });
  }
});

test.describe('HOME-E2E-42 — uncropped full-width band at DPR 1 @smoke', () => {
  for (const { width, height, expectedWidth, expectedHeight } of BAND_CASES) {
    test(`${width}x${height}px: contain band with reserved geometry @smoke`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await waitForHydration(page);
      await assertSharpBand(page, { width: expectedWidth, height: expectedHeight });
    });
  }
});

test.describe('HOME-E2E-42 — uncropped full-width band at DPR 2 @smoke', () => {
  test.use({ deviceScaleFactor: 2 });

  // DD-HOME-27 v0.4 §14.4: at 1440 DPR 2 the same 1018 px source is still
  // 2.83x upscaled (0.71 source px per CSS px), accepted by C-HOME-27 and
  // measured (not assumed) by HOME-E2E-54.
  for (const { width, height, expectedWidth, expectedHeight } of BAND_CASES) {
    test(`${width}x${height}px: contain band keeps its reserved geometry @smoke`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await waitForHydration(page);
      await assertSharpBand(page, { width: expectedWidth, height: expectedHeight });
    });
  }
});

test.describe('HOME-E2E-43 — copy and controls below the photograph @smoke @a11y', () => {
  for (const width of [375, 768, 1440]) {
    test(`${width}px: ink copy and bare controls under the frame @smoke @a11y`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
      await page.goto('/');
      await waitForHydration(page);

      const names = [
        'Diapositiva anterior',
        'Diapositiva siguiente',
        'Ir a la diapositiva 1 de 5',
        'Ir a la diapositiva 2 de 5',
        'Ir a la diapositiva 3 de 5',
        'Ir a la diapositiva 4 de 5',
        'Ir a la diapositiva 5 de 5',
        'Pausar presentación',
      ];
      for (const name of names) {
        await expect(page.getByRole('button', { name, exact: true })).toHaveCount(1);
      }

      for (const slide of [1, 2, 3, 4, 5]) {
        await page.getByRole('button', { name: `Ir a la diapositiva ${slide} de 5` }).click();
        expect(await activeSlide(page)).toBe(slide);
        await expect(page.locator(`${HERO} button[aria-current="true"]`)).toHaveCount(1);

        const layout = await page.evaluate(() => {
          const frame = document.querySelector('.hero__frame');
          const copy = document.querySelector('.hero__copy');
          const controls = document.querySelector('.hero__controls');
          const hero = document.querySelector('section[aria-labelledby="hero-title"]');
          if (
            !(frame instanceof HTMLElement) ||
            !(copy instanceof HTMLElement) ||
            !(controls instanceof HTMLElement) ||
            !(hero instanceof HTMLElement)
          ) {
            throw new Error('Hero blocks not found');
          }
          const title = copy.querySelector('h1');
          if (!(title instanceof HTMLElement)) throw new Error('hero title not found');
          return {
            // DD-HOME-27 v0.4: measured from the full-width band; the padded wrapper
            // (py-8) plus the copy margin (mt-8) keeps the gap near 64 px.
            frameToCopy: copy.getBoundingClientRect().top - frame.getBoundingClientRect().bottom,
            copyToControls:
              controls.getBoundingClientRect().top - copy.getBoundingClientRect().bottom,
            heroBackground: getComputedStyle(hero).backgroundColor,
            controlsBackground: getComputedStyle(controls).backgroundColor,
            controlsClass: controls.className,
            titleColor: getComputedStyle(title).color,
            paragraphColors: Array.from(copy.querySelectorAll('p')).map(
              (node) => getComputedStyle(node).color,
            ),
          };
        });

        expect(layout.frameToCopy).toBeGreaterThanOrEqual(-1);
        expect(layout.frameToCopy).toBeLessThanOrEqual(96);
        expect(layout.copyToControls).toBeGreaterThanOrEqual(-1);
        expect(layout.copyToControls).toBeLessThanOrEqual(96);
        expect(layout.heroBackground).toBe('rgb(255, 255, 255)');
        expect(layout.controlsBackground).toBe('rgba(0, 0, 0, 0)');
        expect(layout.controlsClass).not.toContain('rounded-card');
        expect(layout.controlsClass).not.toContain('bg-surface/95');
        expect(layout.titleColor).toBe('rgb(18, 63, 51)');
        expect(layout.paragraphColors.length).toBeGreaterThan(0);
        for (const color of layout.paragraphColors) {
          expect(color).toBe('rgb(18, 63, 51)');
        }
      }
    });
  }
});

test('HOME-E2E-44: changing slides never moves the frame, copy or controls @smoke', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => {
    window.__shiftByInput = 0;
    window.__layoutShift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value: number };
        if (shift.hadRecentInput) {
          window.__shiftByInput = (window.__shiftByInput ?? 0) + shift.value;
        } else {
          window.__layoutShift = (window.__layoutShift ?? 0) + shift.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto('/');
  await waitForHydration(page);
  // The first click parks the scroll position and stops autoplay via focus;
  // every later click therefore keeps the same viewport geometry.
  await page.getByRole('button', { name: 'Ir a la diapositiva 1 de 5' }).click();
  await page.evaluate(() => {
    window.__shiftByInput = 0;
    window.__layoutShift = 0;
  });
  const before = await readSlideMetrics(page);

  for (const slide of [2, 3, 4, 5, 1]) {
    await page.getByRole('button', { name: `Ir a la diapositiva ${slide} de 5` }).click();
    expect(await activeSlide(page)).toBe(slide);
    expectSameLayout(before, await readSlideMetrics(page));
  }

  const shifts = await page.evaluate(() => ({
    byInput: window.__shiftByInput ?? 0,
    withoutInput: window.__layoutShift ?? 0,
  }));
  expect(shifts.byInput).toBeLessThanOrEqual(0.02);
  expect(shifts.withoutInput).toBeLessThan(0.1);
});

test('HOME-E2E-54: served bitmap is source-capped, not the requested w @smoke', async ({ page }) => {
  // DD-HOME-27 C-2 / ADR-HOME-28-01 + C-HOME-28i: next/image uses
  // withoutEnlargement, so a `w=3840` request still serves the source bitmap:
  // 1018 px for PNGs 01-03, 2880 px for slide 04 and 3000 px for slide 05.
  // Decode a bare Image (no srcset density correction) to measure the real
  // bitmap and record the effective density at 1440: 0.71, 2.00 and ≈2.08.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForHydration(page);

  const frameWidth = await page.evaluate(() => {
    const frame = document.querySelector('.hero__frame');
    if (!(frame instanceof HTMLElement)) throw new Error('hero frame not found');
    return frame.getBoundingClientRect().width;
  });
  expect(Math.abs(frameWidth - 1440)).toBeLessThanOrEqual(1);

  for (let slide = 1; slide <= 5; slide += 1) {
    const asset = slide === 4 ? 'hero-5.jpg' : slide === 5 ? 'hero-6.jpg' : `hero-${slide}.png`;
    const sourceCap = slide === 4 ? 2880 : slide === 5 ? 3000 : 1018;
    const expectedDensity = slide === 4 ? 2.0 : slide === 5 ? 3000 / 1440 : 0.71;
    const bitmapWidth = await page.evaluate(async (name) => {
      const image = new Image();
      image.src = `/_next/image?url=${encodeURIComponent(`/slides/${name}`)}&w=3840&q=75`;
      await image.decode();
      return image.naturalWidth;
    }, asset);

    expect(bitmapWidth, `${asset} decoded bitmap`).toBeGreaterThan(0);
    expect(bitmapWidth, `${asset} must not be upsampled`).toBeLessThanOrEqual(sourceCap);

    const density = bitmapWidth / frameWidth;
    test.info().annotations.push({
      type: 'source-density',
      description: `${asset}: ${bitmapWidth}px bitmap / ${frameWidth}px band = ${density.toFixed(3)} source px per CSS px`,
    });
    expect(density, `${asset} effective density at 1440`).toBeCloseTo(expectedDensity, 2);
  }
});

test('HOME-E2E-56: slide 04 pillarboxes without crop and keeps a stable frame @smoke', async ({
  page,
}) => {
  // ADR-HOME-28-01 §13: the final JPEG is 2880/1100 (≈2.618:1) inside the
  // unchanged 1018/376 frame, so object-contain leaves
  // (frameW - frameH * 2880/1100)/2 px left and right while the whole bitmap
  // stays visible and the reserved height avoids CLS.
  await page.addInitScript(() => {
    window.__layoutShift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value: number };
        if (!shift.hadRecentInput) window.__layoutShift = (window.__layoutShift ?? 0) + shift.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await installPausedClock(page);

  for (const { width, height, bandHeight } of [
    { width: 375, height: 812, bandHeight: 139 },
    { width: 768, height: 900, bandHeight: 284 },
    { width: 1440, height: 900, bandHeight: 532 },
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await waitForHydration(page);
    await page.evaluate(() => {
      window.__layoutShift = 0;
    });

    await page.getByRole('button', { name: 'Ir a la diapositiva 4 de 5' }).click();
    expect(await activeSlide(page)).toBe(4);
    await waitForImagesLoaded(page, '.hero__frame img');

    const letterbox = await page.evaluate(() => {
      const frame = document.querySelector('.hero__frame');
      if (!(frame instanceof HTMLElement)) throw new Error('hero frame not found');
      const image = frame.querySelectorAll('img')[3];
      if (!(image instanceof HTMLImageElement)) throw new Error('slide 04 image not found');
      const frameRect = frame.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const ratio = image.naturalWidth / image.naturalHeight;
      // object-contain centers the scaled bitmap inside the full-frame element;
      // object-position is asserted in the Node test below.
      const objectPosition = getComputedStyle(image).objectPosition;
      const contentWidth = Math.min(imageRect.width, imageRect.height * ratio);
      const contentHeight = contentWidth / ratio;
      return {
        fit: getComputedStyle(image).objectFit,
        objectPosition,
        ratio,
        frameWidth: frameRect.width,
        frameHeight: frameRect.height,
        imageWidth: imageRect.width,
        imageHeight: imageRect.height,
        contentWidth,
        contentHeight,
        gapLeft: (imageRect.width - contentWidth) / 2,
        gapRight: (imageRect.width - contentWidth) / 2,
      };
    });

    expect(letterbox.fit, `${width}px object-fit`).toBe('contain');
    expect(letterbox.objectPosition, `${width}px object-position`).toBe('50% 50%');
    // next/image rounds the optimized height (e.g. 640x242 at 375px), so the
    // served ratio differs from the source by up to ~0.02; allow 1 decimal.
    expect(letterbox.ratio, `${width}px bitmap ratio`).toBeCloseTo(2880 / 1100, 1);
    expect(Math.abs(letterbox.frameHeight - bandHeight), `${width}px band height`).toBeLessThanOrEqual(
      1,
    );
    expect(Math.abs(letterbox.imageWidth - letterbox.frameWidth), `${width}px image fill width`).toBeLessThanOrEqual(1);
    expect(Math.abs(letterbox.imageHeight - letterbox.frameHeight), `${width}px image fill height`).toBeLessThanOrEqual(1);
    // The whole bitmap is drawn: contain scales it to the frame height and no
    // dimension exceeds the frame box, so no approved text or mark is cropped.
    expect(
      Math.abs(letterbox.contentHeight - letterbox.frameHeight),
      `${width}px bitmap fully visible (height)`,
    ).toBeLessThanOrEqual(1);
    expect(letterbox.contentWidth, `${width}px bitmap fully visible (width)`).toBeLessThanOrEqual(
      letterbox.frameWidth + 1,
    );

    const expectedGap = (letterbox.frameWidth - letterbox.frameHeight * (2880 / 1100)) / 2;
    test.info().annotations.push({
      type: 'pillarbox',
      description: `${width}px: ${expectedGap.toFixed(1)}px left/right of slide 04 bitmap`,
    });
    for (const [side, gap] of [
      ['left', letterbox.gapLeft],
      ['right', letterbox.gapRight],
    ] as const) {
      // The served bitmap height is rounded to an integer by the optimizer,
      // so its ratio (and the drawn gap) can differ ~2px from the source ratio.
      expect(Math.abs(gap - expectedGap), `${width}px ${side} pillarbox`).toBeLessThanOrEqual(2);
    }
    expect(expectedGap, `${width}px pillarbox is visible`).toBeGreaterThan(0);

    const slideFour = await readSlideMetrics(page);
    await page.getByRole('button', { name: 'Ir a la diapositiva 1 de 5' }).click();
    expect(await activeSlide(page)).toBe(1);
    expectSameLayout(slideFour, await readSlideMetrics(page));

    const cls = await page.evaluate(() => window.__layoutShift ?? 0);
    expect(cls, `${width}px CLS`).toBeLessThan(0.1);
  }
});

test('HOME-E2E-55: full-bleed band never relies on CSS 100vw @smoke', async ({ page }) => {
  // DD-HOME-27 §4.2: the band is a normal block at the document content
  // width, so it cannot overrun the classic scrollbar the way 100vw would.
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await waitForHydration(page);

    const geometry = await page.evaluate(() => {
      const frame = document.querySelector('.hero__frame');
      if (!(frame instanceof HTMLElement)) throw new Error('hero frame not found');
      const rect = frame.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });

    expect(geometry.left, `${width}px band left`).toBe(0);
    expect(Math.abs(geometry.right - geometry.clientWidth), `${width}px band right`).toBeLessThanOrEqual(
      1,
    );
    expect(geometry.width, `${width}px band width`).toBe(geometry.clientWidth);
    expect(geometry.scrollWidth <= geometry.innerWidth, `${width}px no horizontal overflow`).toBe(true);

    const cssText = await page.evaluate(async () => {
      const parts: string[] = [];
      for (const node of Array.from(document.querySelectorAll('link[rel="stylesheet"]'))) {
        const href = node.getAttribute('href');
        if (!href) continue;
        const response = await fetch(new URL(href, window.location.href));
        if (response.ok) parts.push(await response.text());
      }
      for (const node of Array.from(document.querySelectorAll('style'))) {
        parts.push(node.textContent ?? '');
      }
      return parts.join('\n');
    });
    expect(cssText.length, `${width}px served CSS`).toBeGreaterThan(0);
    expect(cssText, `${width}px no CSS 100vw`).not.toMatch(/width\s*:\s*100vw/);
  }
});
