import { expect, test } from '@playwright/test';

const GEOMETRY_WIDTHS = [320, 375, 600, 767, 768, 1024, 1440] as const;
const OVERLAY_WIDTHS = [320, 375] as const;

type Rect = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
  centerX: number;
};

type HeaderGeometry = {
  flexWrap: string;
  headerHeight: number;
  headerBottom: number;
  heroTop: number;
  overflow: number;
  container: Rect;
  brand: Rect;
  logo: Rect;
  logoAlt: string;
  name: { text: string; fontSize: string; visible: boolean };
  summary: Rect | null;
  desktopLinks: number;
  magnifier: Rect | null;
  whatsapp: Rect | null;
  sameRow: boolean;
};

type MenuGeometry = {
  headerHeight: number;
  headerBottom: number;
  heroTop: number;
  scrollWidth: number;
  innerWidth: number;
  menu: Rect | null;
  brand: Rect;
  summary: Rect;
};

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}

test.describe('Home header layout (DD-HOME-26)', () => {
  test('HOME-E2E-51: single row keeps the logo centered and the name visible at every width @smoke', async ({
    page,
  }) => {
    for (const width of GEOMETRY_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);

      const geometry = await page.evaluate((): HeaderGeometry => {
        const header = document.querySelector('header');
        const container = header?.querySelector(':scope > div');
        const hero = document.querySelector('section.hero');
        const brand = header?.querySelector('a[href="/"]');
        const logo = brand?.querySelector('img');
        const name = brand?.querySelector('span[aria-hidden="true"]');
        const summary = header?.querySelector('nav[aria-label="Principal"] details summary') ?? null;
        const magnifier = header?.querySelector('button[aria-label="Buscar"]') ?? null;
        const whatsapp = header?.querySelector('a[href^="https://wa.me/"]') ?? null;
        if (
          !(header instanceof HTMLElement) ||
          !(container instanceof HTMLElement) ||
          !(hero instanceof HTMLElement) ||
          !(brand instanceof HTMLElement) ||
          !(logo instanceof HTMLImageElement) ||
          !(name instanceof HTMLElement)
        ) {
          throw new Error('Header geometry landmarks not found');
        }

        const isVisible = (element: Element): boolean =>
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility !== 'hidden';
        const rect = (element: Element): Rect => {
          const box = element.getBoundingClientRect();
          return {
            top: box.top,
            bottom: box.bottom,
            left: box.left,
            right: box.right,
            width: box.width,
            height: box.height,
            centerX: box.left + box.width / 2,
          };
        };

        const brandLinks = Array.from(header.querySelectorAll('nav[aria-label="Principal"] > ul a'));
        const controls = [
          rect(brand),
          rect(logo),
          ...(summary !== null && isVisible(summary) ? [rect(summary)] : []),
          ...(magnifier !== null && isVisible(magnifier) ? [rect(magnifier)] : []),
          ...(whatsapp !== null && isVisible(whatsapp) ? [rect(whatsapp)] : []),
        ];
        const sameRow = controls.every((outer) =>
          controls.every(
            (inner) => outer.top < inner.bottom && inner.top < outer.bottom,
          ),
        );

        return {
          flexWrap: getComputedStyle(container).flexWrap,
          headerHeight: header.getBoundingClientRect().height,
          headerBottom: header.getBoundingClientRect().bottom,
          heroTop: hero.getBoundingClientRect().top,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          container: rect(container),
          brand: rect(brand),
          logo: rect(logo),
          logoAlt: logo.alt,
          name: {
            text: name.textContent?.trim() ?? '',
            fontSize: getComputedStyle(name).fontSize,
            visible: isVisible(name),
          },
          summary: summary !== null && isVisible(summary) ? rect(summary) : null,
          desktopLinks: brandLinks.filter(isVisible).length,
          magnifier: magnifier !== null && isVisible(magnifier) ? rect(magnifier) : null,
          whatsapp: whatsapp !== null && isVisible(whatsapp) ? rect(whatsapp) : null,
          sameRow,
        };
      });

      expect(geometry.flexWrap, `${width}px flex-wrap`).toBe('nowrap');
      expect(
        Math.abs(geometry.logo.centerX - geometry.container.centerX),
        `${width}px logo offset from container center`,
      ).toBeLessThanOrEqual(1);
      expect(geometry.name.visible, `${width}px store name visible`).toBe(true);
      expect(geometry.name.text, `${width}px store name`).toBe("D'Adriana Tienda");
      expect(geometry.name.fontSize, `${width}px store name size`).toBe('14px');
      expect(
        Math.abs(geometry.headerHeight - 89),
        `${width}px header height deviation`,
      ).toBeLessThanOrEqual(2);
      expect(geometry.overflow, `${width}px horizontal overflow`).toBeLessThanOrEqual(0);
      expect(geometry.logo.width, `${width}px logo width`).toBe(48);
      expect(geometry.logo.height, `${width}px logo height`).toBe(48);
      expect(geometry.logoAlt, `${width}px logo alt`).toBe('D\'Adriana Tienda, ir al inicio');
      expect(geometry.magnifier, `${width}px magnifier present`).not.toBeNull();
      expect(geometry.sameRow, `${width}px objects share one row`).toBe(true);

      if (width >= 768) {
        expect(geometry.desktopLinks, `${width}px desktop links`).toBe(4);
        expect(geometry.summary, `${width}px mobile menu hidden`).toBeNull();
      } else {
        expect(geometry.desktopLinks, `${width}px desktop links hidden`).toBe(0);
        expect(geometry.summary, `${width}px mobile menu visible`).not.toBeNull();
      }
    }
  });

  test('HOME-E2E-52: mobile menu overlay adds no CLS and never covers the brand @smoke', async ({
    page,
  }) => {
    for (const width of OVERLAY_WIDTHS) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);

      const details = page.locator('nav[aria-label="Principal"] details');
      const summary = details.locator('summary');
      const firstLink = details.locator('ul a').first();
      await expect(details).not.toHaveAttribute('open', '');
      await expect(details.locator('ul')).toBeHidden();

      const measure = () =>
        page.evaluate((): MenuGeometry => {
          const header = document.querySelector('header');
          const hero = document.querySelector('section.hero');
          const brand = header?.querySelector('a[href="/"]');
          const details = header?.querySelector('nav[aria-label="Principal"] details');
          const summary = details?.querySelector('summary');
          const menu = details?.querySelector('ul');
          if (
            !(header instanceof HTMLElement) ||
            !(hero instanceof HTMLElement) ||
            !(brand instanceof HTMLElement) ||
            !(details instanceof HTMLDetailsElement) ||
            !(summary instanceof HTMLElement) ||
            !(menu instanceof HTMLElement)
          ) {
            throw new Error('Menu overlay landmarks not found');
          }
          const rect = (element: Element): Rect => {
            const box = element.getBoundingClientRect();
            return {
              top: box.top,
              bottom: box.bottom,
              left: box.left,
              right: box.right,
              width: box.width,
              height: box.height,
              centerX: box.left + box.width / 2,
            };
          };
          return {
            headerHeight: header.getBoundingClientRect().height,
            headerBottom: header.getBoundingClientRect().bottom,
            heroTop: hero.getBoundingClientRect().top,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            menu:
              details.hasAttribute('open') && menu.getClientRects().length > 0
                ? rect(menu)
                : null,
            brand: rect(brand),
            summary: rect(summary),
          };
        });

      const before = await measure();
      await summary.click();
      await expect(details).toHaveAttribute('open', '');
      const open = await measure();

      expect(open.menu, `${width}px menu rect`).not.toBeNull();
      const menu = open.menu as Rect;
      expect(open.headerHeight, `${width}px header height`).toBe(before.headerHeight);
      expect(open.heroTop, `${width}px hero top`).toBe(before.heroTop);
      expect(open.scrollWidth, `${width}px scroll width`).toBe(before.scrollWidth);
      expect(open.scrollWidth - open.innerWidth, `${width}px overflow`).toBeLessThanOrEqual(0);
      expect(menu.top, `${width}px menu below header`).toBeGreaterThanOrEqual(open.headerBottom);
      expect(overlaps(menu, open.brand), `${width}px menu must not cover the brand`).toBe(false);
      expect(overlaps(menu, open.summary), `${width}px menu must not cover the summary`).toBe(false);

      await summary.focus();
      await page.keyboard.press('Tab');
      await expect(firstLink, `${width}px Tab from summary`).toBeFocused();

      await summary.click();
      await expect(details).not.toHaveAttribute('open', '');
      await expect(details.locator('ul')).toBeHidden();
      const closed = await measure();
      expect(closed.menu, `${width}px menu hidden after close`).toBeNull();
      expect(closed.headerHeight, `${width}px header height after close`).toBe(before.headerHeight);
      expect(closed.heroTop, `${width}px hero top after close`).toBe(before.heroTop);
      expect(closed.scrollWidth, `${width}px scroll width after close`).toBe(before.scrollWidth);
    }
  });
});
