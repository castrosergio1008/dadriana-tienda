import { expect, test, type Locator, type Page } from '@playwright/test';

const LOGO_PATH = '/brand/logo.png';
const HEADER_ALT = "D'Adriana Tienda, ir al inicio";
const FOOTER_ALT = "D'Adriana Tienda";

async function expectBrandSources(image: Locator): Promise<void> {
  const raw = await image.evaluate((element) => ({
    src: element.getAttribute('src') ?? '',
    srcset: element.getAttribute('srcset') ?? '',
  }));
  const candidates = [
    raw.src,
    ...raw.srcset.split(',').map((entry) => entry.trim().split(/\s+/)[0] ?? ''),
  ].filter(Boolean);

  expect(candidates.length).toBeGreaterThan(0);
  for (const candidate of candidates) {
    const url = new URL(candidate, 'http://localhost');
    const target =
      url.pathname === '/_next/image' ? url.searchParams.get('url') : url.pathname;

    expect(target).toBe(LOGO_PATH);
  }
}

async function expectPriorityLogoPreload(page: Page): Promise<void> {
  const preloaded = await page
    .locator('link[rel="preload"][as="image"]')
    .evaluateAll(
      (elements, logoPath) =>
        elements.some((element) =>
          decodeURIComponent(element.getAttribute('imagesrcset') ?? '').includes(logoPath),
        ),
      LOGO_PATH,
    );
  expect(preloaded, 'header logo must be preloaded in the normal header').toBe(true);
}

test.describe('HOME-E2E-26 — brand logo @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('header and footer use the client logo with the exact alt text @smoke', async ({
    page,
  }) => {
    const headerImage = page.locator('header img');
    const footerImage = page.locator('footer img');

    await expect(headerImage).toHaveCount(1);
    await expect(footerImage).toHaveCount(1);
    await expect(headerImage).toHaveAttribute('alt', HEADER_ALT);
    await expect(footerImage).toHaveAttribute('alt', FOOTER_ALT);
    // DD-HOME-23 §4.2: the header is normal again, so the logo is preloaded.
    // Next 15 emits the hint as <link rel="preload" as="image">.
    await expectPriorityLogoPreload(page);

    await expectBrandSources(headerImage);
    await expectBrandSources(footerImage);
  });

  test('header logo stays local in the normal header @smoke', async ({ page }) => {
    const image = page.locator('header a[href="/"] img');

    await expect(image).toHaveCount(1);
    await expectPriorityLogoPreload(page);
    await expectBrandSources(image);
  });

  test('favicon is served from /icon.png @smoke', async ({ page }) => {
    const hrefs = await page
      .locator('link[rel="icon"]')
      .evaluateAll((elements) => elements.map((element) => element.getAttribute('href') ?? ''));

    expect(
      hrefs.some((href) => new URL(href, 'http://localhost').pathname === '/icon.png'),
    ).toBe(true);
  });

  test.describe('375px viewport', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('direct logo causes no horizontal overflow on any slide @smoke', async ({ page }) => {
      await expect(page.locator('header img')).toBeVisible();

      const expectNoOverflow = async () => {
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      };

      await expectNoOverflow();
      for (const slide of [2, 3, 1]) {
        await page
          .getByRole('button', { name: `Ir a la diapositiva ${slide} de 3` })
          .click();
        await expectNoOverflow();
      }
    });
  });
});
