import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';

const axeSource = readFileSync(
  join(process.cwd(), 'node_modules/axe-core/axe.min.js'),
  'utf8',
);

const REGION_NAME = 'Productos destacados';
const NAV_NAME = 'Navegación de productos destacados';

// Approved facts from DD-HOME-20 §4.3; the tests assert the browser output,
// never feed these strings into the application.
const HIGHLIGHTS = [
  {
    slug: 'shampoo-purificante',
    name: 'Shampoo Purificante Anticaspa',
    image: '/products/shampoo-purificante-anticaspa.jpg',
  },
  {
    slug: 'shampoo-morado',
    name: 'Shampoo Morado Anti-amarillo',
    image: '/products/shampoo-morado-anti-amarillo.jpg',
  },
  {
    slug: 'mascarilla-reparadora',
    name: 'Mascarilla Reparadora 400 ml',
    image: '/products/mascarilla-reparadora-400-ml.jpg',
  },
  {
    slug: 'aceite-argan',
    name: 'Aceite Capilar de Argán',
    image: '/products/aceite-capilar-argan.jpg',
  },
  {
    slug: 'serum-vitamina-c',
    name: 'Sérum Vitamina C 30 ml',
    image: '/products/serum-vitamina-c-30-ml.jpg',
  },
  {
    slug: 'crema-hidratante',
    name: 'Crema Hidratante Piel Sensible',
    image: '/products/crema-hidratante-piel-sensible.jpg',
  },
] as const;

type AxeViolation = { id: string; impact?: string; nodes: unknown[] };

function highlightsRegion(page: Page): Locator {
  return page.getByRole('region', { name: REGION_NAME, exact: true });
}

async function rowScrollLeft(list: Locator): Promise<number> {
  return list.evaluate((element) => element.scrollLeft);
}

test('HOME-E2E-20: six factual cards are always visible in the approved order @smoke', async ({
  page,
}) => {
  await page.goto('/');

  const region = highlightsRegion(page);
  await expect(region).toBeVisible();
  await expect(region.getByRole('heading', { level: 2, name: REGION_NAME })).toHaveCount(1);
  await expect(region.locator('article h3')).toHaveText(
    HIGHLIGHTS.map((highlight) => highlight.name),
  );

  const links = region.locator('article a');
  await expect(links).toHaveCount(6);
  for (const [index, highlight] of HIGHLIGHTS.entries()) {
    await expect(links.nth(index)).toHaveAttribute('href', `/productos/${highlight.slug}`);
    await expect(links.nth(index)).toHaveText(`Ver ficha de ${highlight.name}`);
  }

  const visibleText = (await region.innerText()).toLowerCase();
  for (const banned of [
    'ver producto',
    'agotado',
    'bestseller',
    'recomendado',
    'rating',
    '$',
    '%',
    '★',
  ]) {
    expect(visibleText, `unapproved copy leaked into the row: ${banned}`).not.toContain(
      banned,
    );
  }

  const domOrder = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) throw new Error('main landmark is missing');
    // DD-HOME-23 keeps <main> inside the stage; the section order below must
    // still hold inside it (no relaxation of the original assertion).
    if (!main.closest('.home-stage')) throw new Error('home stage wrapper is missing');
    const sections = Array.from(main.querySelectorAll('section'));
    const indexOf = (predicate: (section: Element) => boolean): number =>
      sections.findIndex(predicate);
    return {
      editorial: indexOf(
        (section) => section.getAttribute('aria-labelledby') === 'editorial-title',
      ),
      highlights: indexOf((section) =>
        Array.from(section.querySelectorAll('h2')).some(
          (heading) => heading.textContent === 'Productos destacados',
        ),
      ),
      storeCta: indexOf((section) =>
        Array.from(section.querySelectorAll('a')).some((link) =>
          link.textContent?.includes('Encuentra tu tienda'),
        ),
      ),
    };
  });
  expect(domOrder.editorial).toBeGreaterThanOrEqual(0);
  expect(domOrder.highlights).toBeGreaterThan(domOrder.editorial);
  expect(domOrder.storeCta).toBeGreaterThan(domOrder.highlights);

  // The curated carousels are data-dependent, so verify insertion relative to
  // them from the server source rather than from a DB-free DOM snapshot.
  const pageSource = readFileSync(join(process.cwd(), 'app/page.tsx'), 'utf8');
  expect(pageSource.indexOf('<EditorialBanner />')).toBeLessThan(
    pageSource.indexOf('<PrototypeHighlights />'),
  );
  expect(pageSource.indexOf('<PrototypeHighlights />')).toBeLessThan(
    pageSource.indexOf('<SectionFrame'),
  );
});

for (const width of [375, 768, 1440]) {
  test(`HOME-E2E-21: anchors focus their card and move the row at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    const region = highlightsRegion(page);
    const nav = region.getByRole('navigation', { name: NAV_NAME });
    const list = region.locator('ul[tabindex="0"]');
    await expect(nav.getByRole('link')).toHaveCount(8);
    expect(
      await list.evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBeGreaterThan(0);

    const item = (index: number): Locator => region.locator(`li#destacado-${index}`);
    const initialScroll = await rowScrollLeft(list);

    const lastAnchor = nav.getByRole('link', {
      name: `Ir al último producto destacado: ${HIGHLIGHTS[5].name}`,
    });
    await lastAnchor.focus();
    await page.keyboard.press('Enter');
    await expect(item(6)).toBeFocused();
    await expect
      .poll(() => rowScrollLeft(list), { timeout: 5_000 })
      .toBeGreaterThan(initialScroll);
    const scrollAtLast = await rowScrollLeft(list);

    const firstAnchor = nav.getByRole('link', {
      name: `Ir al primer producto destacado: ${HIGHLIGHTS[0].name}`,
    });
    await firstAnchor.focus();
    await page.keyboard.press('Enter');
    await expect(item(1)).toBeFocused();
    // The row keeps the approved px-1 gutter, so the first snap position is
    // ~4px rather than exactly 0. Compare against the measured last position
    // instead of the theoretical maximum, which could pass after a 1px shift.
    await expect.poll(() => rowScrollLeft(list), { timeout: 5_000 }).toBeLessThanOrEqual(8);
    expect(scrollAtLast).toBeGreaterThan(8);

    const thirdAnchor = nav.getByRole('link', {
      name: `Ir al producto 3 de 6: ${HIGHLIGHTS[2].name}`,
    });
    await thirdAnchor.focus();
    await page.keyboard.press('Enter');
    await expect(item(3)).toBeFocused();

    const geometry = await page.evaluate(() => {
      const target = document.querySelector('li#destacado-3');
      const row = target?.closest('ul');
      if (!(target instanceof HTMLElement) || !(row instanceof HTMLElement)) {
        throw new Error('target card or row is missing');
      }
      const card = target.getBoundingClientRect();
      const bounds = row.getBoundingClientRect();
      return {
        cardLeft: card.left,
        cardRight: card.right,
        rowLeft: bounds.left,
        rowRight: bounds.right,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      };
    });
    expect(geometry.cardLeft).toBeGreaterThanOrEqual(geometry.rowLeft - 1);
    expect(geometry.cardRight).toBeLessThanOrEqual(geometry.rowRight + 1);
    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);

    const outline = await item(3).evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        style: style.outlineStyle,
        color: style.outlineColor,
        width: style.outlineWidth,
        offset: style.outlineOffset,
      };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.color).toBe('rgb(18, 63, 51)');
    expect(outline.width).toBe('2px');
    expect(outline.offset).toBe('2px');
  });
}

test('HOME-E2E-22: the focusable row scrolls with arrow keys and has no carousel state', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const region = highlightsRegion(page);
  const list = region.locator('ul[tabindex="0"]');
  await expect(list).toHaveAttribute('tabindex', '0');
  await list.focus();
  await expect(list).toBeFocused();

  const initialScroll = await rowScrollLeft(list);
  for (let press = 0; press < 8; press += 1) {
    await page.keyboard.press('ArrowRight');
    if ((await rowScrollLeft(list)) > initialScroll) break;
  }
  await expect
    .poll(() => rowScrollLeft(list), { timeout: 5_000 })
    .toBeGreaterThan(initialScroll);

  await expect(
    region.locator('script, [data-state], [autoplay], [aria-roledescription="carousel"]'),
  ).toHaveCount(0);
  expect(
    await list.evaluate((element) => getComputedStyle(element).scrollBehavior),
  ).toBe('auto');
});

test.describe('HOME-E2E-23 (reduced motion)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('HOME-E2E-23: reduced motion keeps the anchor jump unanimated and instant', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    const styles = await page.evaluate(() => {
      const controls = Array.from(
        document.querySelectorAll(
          'nav[aria-label="Navegación de productos destacados"] a',
        ),
      );
      const cards = Array.from(document.querySelectorAll('li[id^="destacado-"] article'));
      const elements = [...controls, ...cards];
      return {
        scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
        transitions: elements.map((element) => getComputedStyle(element).transitionDuration),
        animations: elements.map((element) => getComputedStyle(element).animationName),
      };
    });
    expect(styles.scrollBehavior).toBe('auto');
    expect(styles.transitions.every((value) => value === '0s')).toBe(true);
    expect(styles.animations.every((value) => value === 'none')).toBe(true);

    const region = highlightsRegion(page);
    const nav = region.getByRole('navigation', { name: NAV_NAME });
    const lastAnchor = nav.getByRole('link', {
      name: `Ir al último producto destacado: ${HIGHLIGHTS[5].name}`,
    });
    await lastAnchor.focus();
    await page.keyboard.press('Enter');
    await expect(region.locator('li#destacado-6')).toBeFocused();
    await expect
      .poll(() => rowScrollLeft(region.locator('ul[tabindex="0"]')), { timeout: 1_500 })
      .toBeGreaterThan(0);
  });
});

for (const width of [375, 768, 1440]) {
  test(`HOME-E2E-24: axe 2.2 AA, heading order and landmarks at ${width}px @a11y`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1024 });
    await page.goto('/');
    await page.addScriptTag({ content: axeSource });

    const violations = await page.evaluate(async () => {
      const axe = (
        window as Window & {
          axe?: {
            run: (
              context: unknown,
              options: unknown,
            ) => Promise<{ violations: AxeViolation[] }>;
          };
        }
      ).axe;
      if (!axe) throw new Error('axe-core was not injected');
      const result = await axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        },
      });
      return result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.length,
      }));
    });
    expect(
      violations.filter(
        (violation) =>
          violation.impact === 'critical' || violation.impact === 'serious',
      ),
    ).toEqual([]);

    // DD-HOME-22 §7.2: force the three slide-control rules explicitly.
    const targeted = await page.evaluate(async () => {
      const axe = (
        window as Window & {
          axe?: {
            run: (
              context: unknown,
              options: unknown,
            ) => Promise<{ violations: AxeViolation[] }>;
          };
        }
      ).axe;
      if (!axe) throw new Error('axe-core was not injected');
      const result = await axe.run(document, {
        runOnly: {
          type: 'rule',
          values: ['aria-hidden-focus', 'button-name', 'aria-allowed-attr'],
        },
      });
      return result.violations.map((violation) => violation.id);
    });
    expect(targeted).toEqual([]);

    const levels = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((elements) => elements.map((element) => Number(element.tagName.slice(1))));
    expect(levels[0]).toBe(1);
    expect(levels.filter((level) => level === 1)).toEqual([1]);
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index] - levels[index - 1], `heading ${index + 1}`).toBeLessThanOrEqual(1);
    }

    const navNames = await page
      .locator('nav')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label')));
    expect(navNames.filter((name) => name === 'Principal')).toEqual(['Principal']);
    expect(navNames.filter((name) => name === NAV_NAME)).toEqual([NAV_NAME]);

    const images = highlightsRegion(page).locator('article img');
    await expect(images).toHaveCount(6);
    for (const [index, highlight] of HIGHLIGHTS.entries()) {
      await expect(images.nth(index)).toHaveAttribute('alt', highlight.name);
    }
  });
}

test('HOME-E2E-25: local optimized images use a reserved square box and lazy loading @smoke', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');

  const region = highlightsRegion(page);
  const images = region.locator('article img');
  await expect(images).toHaveCount(6);

  const sources = await images.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('src') ?? ''),
  );
  for (const [index, source] of sources.entries()) {
    const url = new URL(source, 'http://localhost');
    expect(url.pathname).toBe('/_next/image');
    expect(url.searchParams.get('url')).toBe(HIGHLIGHTS[index].image);
  }

  const srcsets = await images.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('srcset') ?? ''),
  );
  expect(srcsets.every((srcset) => srcset.includes('/_next/image?url='))).toBe(true);
  expect(srcsets.every((srcset) => /\bw=\d+/.test(srcset))).toBe(true);

  // Format negotiation is confirmed under the negotiated Accept header; the
  // browser itself already requests AVIF/WebP, so no external source is used.
  const optimized = await page.request.get(
    `/_next/image?url=${encodeURIComponent(HIGHLIGHTS[0].image)}&w=640&q=75`,
    { headers: { Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' } },
  );
  expect(optimized.ok()).toBe(true);
  expect(optimized.headers()['content-type']).toMatch(/^image\/(avif|webp)/);

  const boxes = region.locator('article > div:first-child');
  await expect(boxes).toHaveCount(6);
  for (const box of await boxes.all()) {
    const rect = await box.boundingBox();
    expect(rect).not.toBeNull();
    expect(Math.abs((rect?.width ?? 0) - (rect?.height ?? 0))).toBeLessThan(1);
  }

  await expect(region.locator('img[fetchpriority="high"]')).toHaveCount(0);
  for (const image of await images.all()) {
    expect(await image.getAttribute('fetchpriority')).not.toBe('high');
    expect(await image.getAttribute('loading')).toBe('lazy');
  }
});
