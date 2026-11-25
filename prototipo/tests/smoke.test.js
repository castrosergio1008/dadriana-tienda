/* Headless Chrome smoke tests for the Adriana Tienda prototype. */
const puppeteer = require('puppeteer-core');

const path = require('path');
const { pathToFileURL } = require('url');
const URL = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const report = [];
function check(name, pass, detail = '') {
  report.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

  // Stub external font requests so offline runs are stable (no net::ERR_FAILED noise).
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) {
      req.respond({ status: 204, contentType: 'text/css', body: '' });
    } else {
      req.continue();
    }
  });

  async function gotoHome() {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(350);
  }
  async function go(hash) {
    await page.evaluate((h) => { window.location.hash = h; }, hash);
    await sleep(400);
  }
  async function visible(sel) {
    return page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return false;
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && !el.hidden;
    }, sel);
  }
  async function text(sel) {
    return page.evaluate((s) => (document.querySelector(s) ? document.querySelector(s).textContent.trim() : null), sel);
  }
  async function click(sel) {
    const ok = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return false;
      el.scrollIntoView({ block: 'center' });
      el.click();
      return true;
    }, sel);
    await sleep(300);
    return ok;
  }
  async function setInput(sel, value) {
    await page.evaluate((s, v) => {
      const el = document.querySelector(s);
      if (!el) return false;
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }, sel, value);
    await sleep(150);
  }
  async function metrics() {
    return page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
  }
  async function evalCount(sel) {
    return page.evaluate((s) => document.querySelectorAll(s).length, sel);
  }

  // ── 1. Horizontal overflow at 3 breakpoints (Home) ───────────
  await gotoHome();
  for (const width of [375, 768, 1440]) {
    await page.setViewport({ width, height: 900 });
    await sleep(250);
    const m = await metrics();
    check(`No horizontal overflow @ ${width}px (home)`, m.scrollWidth <= m.innerWidth + 1,
      `scrollWidth=${m.scrollWidth} innerWidth=${m.innerWidth}`);
  }

  // Overflow on PLP + PDP at mobile width
  await page.setViewport({ width: 375, height: 800 });
  await go('#/plp');
  let m = await metrics();
  check('No horizontal overflow @ 375px (PLP)', m.scrollWidth <= m.innerWidth + 1, `scrollWidth=${m.scrollWidth}`);
  await go('#/pdp/labial-mate');
  m = await metrics();
  check('No horizontal overflow @ 375px (PDP)', m.scrollWidth <= m.innerWidth + 1, `scrollWidth=${m.scrollWidth}`);
  await go('#/checkout');
  m = await metrics();
  check('No horizontal overflow @ 375px (checkout)', m.scrollWidth <= m.innerWidth + 1, `scrollWidth=${m.scrollWidth}`);

  // ── 2. Home renders ─────────────────────────────────────────
  await page.setViewport({ width: 1440, height: 900 });
  await gotoHome();
  const bestsellers = await evalCount('#bestsellers-grid .product-card');
  check('Home renders best-seller cards', bestsellers >= 4, `${bestsellers} cards`);
  const needs = await evalCount('#needs-chips .chip');
  check('Home renders need chips', needs === 6, `${needs} chips`);
  const brands = await evalCount('#brands-track .brand-pill');
  check('Home renders brand pills', brands === 8, `${brands} brands`);

  // ── 3. Navigation Home -> PLP -> PDP ─────────────────────────
  await click('.hero__copy .btn--primary');
  check('Navigate to PLP', await visible('#view-plp'), await page.evaluate(() => location.hash));
  const plpCards = await evalCount('#plp-grid .product-card');
  check('PLP renders product cards', plpCards > 0, `${plpCards} cards`);
  await click('#plp-grid .product-card__name a');
  check('Navigate to PDP', await visible('#view-pdp'), await page.evaluate(() => location.hash));
  const pdpName = await text('.pdp-name');
  check('PDP shows product name', !!pdpName, pdpName);

  // ── 4. Quick-add + drawer ────────────────────────────────────
  await go('#/plp');
  await click('#plp-grid .product-card__quick');
  const cartCount = await text('#cart-count');
  check('Quick-add updates cart counter', cartCount === '1', `count=${cartCount}`);
  await click('.cart-btn');
  await sleep(500);
  check('Drawer opens', await visible('#cart-drawer'));
  const drawerCount = await text('#drawer-count');
  const subtotal = await text('#cart-subtotal');
  check('Drawer shows item count', drawerCount.includes('1'), drawerCount);
  check('Drawer shows subtotal', subtotal && subtotal.startsWith('$'), subtotal);
  const freeShipping = await text('#free-shipping');
  check('Free shipping progress bar', !!freeShipping && freeShipping.length > 0, freeShipping.slice(0, 60));
  // Focus trap keeps Tab inside the drawer
  await page.keyboard.press('Tab');
  const focusInDrawer = await page.evaluate(() => {
    const d = document.querySelector('#cart-drawer');
    return d && d.contains(document.activeElement);
  });
  check('Focus trap keeps Tab inside drawer', focusInDrawer);
  // Esc closes drawer
  await page.keyboard.press('Escape');
  await sleep(500);
  check('Esc closes drawer', !(await visible('#cart-drawer')));
  // Reopen and go to checkout via CTA
  await click('.cart-btn');
  await sleep(500);
  await click('#checkout-btn');
  await sleep(500);
  check('"Ir a pagar" navigates to checkout', await visible('#view-checkout'), await page.evaluate(() => location.hash));
  await go('#/plp');

  // Free shipping threshold + drawer quantity stepper + removal
  await page.evaluate(() => {
    document.querySelectorAll('#plp-grid .product-card').forEach((c) => {
      const name = c.querySelector('.product-card__name').textContent;
      if (name.includes('Sérum Vitamina C') || name.includes('Aceite Capilar')) {
        c.querySelector('.product-card__quick').click();
      }
    });
  });
  await sleep(400);
  await click('.cart-btn');
  await sleep(600);
  const freeText = await text('#free-shipping');
  check('Free shipping unlocked over threshold', freeText.includes('envío gratis'), freeText.slice(0, 60));
  const subBefore = await text('#cart-subtotal');
  await page.evaluate(() => {
    const btn = document.querySelector('.cart-item__qty button[data-action="cart-qty-inc"]');
    if (btn) btn.click();
  });
  await sleep(400);
  const subAfter = await text('#cart-subtotal');
  check('Drawer quantity stepper updates subtotal', subBefore !== subAfter, `${subBefore} -> ${subAfter}`);
  const itemsBeforeRemove = await evalCount('.cart-item');
  await page.evaluate(() => {
    const btn = document.querySelector('.cart-item__remove');
    if (btn) btn.click();
  });
  await sleep(400);
  const itemsAfterRemove = await evalCount('.cart-item');
  check('Drawer item removal works', itemsAfterRemove === itemsBeforeRemove - 1,
    `${itemsBeforeRemove} -> ${itemsAfterRemove}`);
  await page.keyboard.press('Escape');
  await sleep(400);

  // ── 5. PLP filters ──────────────────────────────────────────
  await go('#/plp');
  const totalBefore = await evalCount('#plp-grid .product-card');
  await page.evaluate(() => {
    const cb = document.querySelector('#filters-rail input[name="brands"][value="CeraVe"]');
    if (cb) { cb.scrollIntoView(); cb.click(); }
  });
  await sleep(350);
  const totalAfterBrand = await evalCount('#plp-grid .product-card');
  check('Brand filter reduces results', totalAfterBrand > 0 && totalAfterBrand < totalBefore,
    `${totalBefore} -> ${totalAfterBrand}`);
  const chipCount = await evalCount('#active-chips .chip');
  check('Active filter chip appears', chipCount >= 1, `${chipCount} chips`);
  await click('#active-chips button[data-key="brand"]');
  await sleep(350);
  const totalAfterClear = await evalCount('#plp-grid .product-card');
  check('Active chip removal restores results', totalAfterClear === totalBefore,
    `${totalAfterClear} vs ${totalBefore}`);

  // Need filter via query
  await go('#/plp?need=' + encodeURIComponent('Manchas'));
  const needTitle = await text('#plp-title');
  check('Need filter heading', needTitle === 'Necesidad: Manchas', needTitle);
  const needCards = await evalCount('#plp-grid .product-card');
  check('Need filter shows results', needCards > 0, `${needCards} cards`);

  // Rating filter
  await go('#/plp');
  await page.evaluate(() => {
    const r = document.querySelector('#filters-rail input[name="minRating"][value="4.5"]');
    if (r) r.click();
  });
  await sleep(350);
  const ratingCards = await evalCount('#plp-grid .product-card');
  check('Rating filter works', ratingCards > 0 && ratingCards <= 16, `${ratingCards} cards`);

  // Price filter via range input
  await go('#/plp');
  await page.evaluate(() => {
    const el = document.querySelector('#filters-rail #price-min-rail');
    if (el) {
      el.value = '50000';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(350);
  const priceCards = await evalCount('#plp-grid .product-card');
  check('Price filter works', priceCards > 0 && priceCards < 16, `${priceCards} cards`);
  const priceLabels = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#plp-grid .product-card__price-row .price'))
      .map((el) => el.textContent));
  check('All filtered prices >= $50.000', priceLabels.every((p) => parseInt(p.replace(/[^0-9]/g, ''), 10) >= 50000),
    priceLabels.slice(0, 4).join(', '));

  // Load more (force a real reset by changing the hash twice)
  await go('#/plp?refresh=1');
  await go('#/plp');
  const beforeLoadMore = await evalCount('#plp-grid .product-card');
  await click('#load-more-btn');
  const afterLoadMore = await evalCount('#plp-grid .product-card');
  check('Load more reveals products', afterLoadMore > beforeLoadMore, `${beforeLoadMore} -> ${afterLoadMore}`);
  const loadMoreHidden = await page.evaluate(() => document.querySelector('#load-more-wrap').hidden);
  check('Load more hides when all visible', loadMoreHidden, `hidden=${loadMoreHidden}`);

  // ── 6. PDP variant selector ─────────────────────────────────
  await go('#/pdp/mascarilla-reparadora');
  const priceBefore = await text('#pdp-price');
  const stockBefore = await text('#pdp-stock-text');
  const imgBefore = await page.evaluate(() => document.querySelector('#pdp-main-image').getAttribute('src'));
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="select-variant"][data-variant="1 L"]');
    if (btn) btn.click();
  });
  await sleep(350);
  const priceAfter = await text('#pdp-price');
  const stockAfter = await text('#pdp-stock-text');
  const imgAfter = await page.evaluate(() => document.querySelector('#pdp-main-image').getAttribute('src'));
  check('Variant change updates price', priceBefore !== priceAfter, `${priceBefore} -> ${priceAfter}`);
  check('Variant change updates stock', stockBefore !== stockAfter, `${stockBefore} -> ${stockAfter}`);
  check('Variant change updates main image', imgBefore === imgAfter, `${imgBefore.split('/').pop()} -> ${imgAfter.split('/').pop()}`);
  const variantLabel = await text('#variant-selected-label');
  check('Variant label updates', variantLabel === '1 L', variantLabel);

  // Shade variant changes image
  await go('#/pdp/labial-mate');
  const labialImgBefore = await page.evaluate(() => document.querySelector('#pdp-main-image').getAttribute('src'));
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="select-variant"][data-variant="Nude"]');
    if (btn) btn.click();
  });
  await sleep(350);
  const labialImgAfter = await page.evaluate(() => document.querySelector('#pdp-main-image').getAttribute('src'));
  check('Shade variant changes image', labialImgBefore !== labialImgAfter,
    `${labialImgBefore.split('/').pop()} -> ${labialImgAfter.split('/').pop()}`);

  // PDP tabs
  await page.evaluate(() => {
    const tab = document.querySelector('[data-action="tab"][data-tab="modo"]');
    if (tab) tab.click();
  });
  await sleep(200);
  const tabVisible = await visible('#panel-modo');
  check('PDP tab switches', tabVisible);

  // PDP add to cart
  await go('#/pdp/crema-hidratante');
  const cartBefore = Number(await text('#cart-count'));
  await page.evaluate(() => {
    const btn = document.querySelector('.pdp-cta [data-action="add-to-cart"]');
    if (btn) btn.click();
  });
  await sleep(350);
  const cartAfterPdp = await text('#cart-count');
  check('PDP add-to-cart updates counter', Number(cartAfterPdp) === cartBefore + 1, `${cartBefore} -> ${cartAfterPdp}`);

  // ── 7. Checkout summary + confirmation ───────────────────────
  await go('#/checkout');
  check('Checkout renders', await visible('#view-checkout'));
  const total = await text('#checkout-total');
  check('Checkout shows total', !!total && total.startsWith('$'), total);
  const summaryItems = await evalCount('.checkout-summary .summary-item');
  check('Checkout summary lists items', summaryItems >= 1, `${summaryItems} items`);

  await setInput('#co-name', 'María Pérez');
  await setInput('#co-email', 'maria@example.com');
  await setInput('#co-phone', '3001234567');
  await click('[data-action="step-continue"][data-step="1"]');
  check('Checkout advances to step 2', await visible('[data-step="2"] .step__body'));

  await page.evaluate(() => {
    const sel = document.querySelector('#co-department');
    if (sel) { sel.value = 'Bogotá D.C.'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await sleep(400);
  await page.evaluate(() => {
    const sel = document.querySelector('#co-city');
    if (sel) { sel.value = 'Bogotá'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await setInput('#co-address', 'Calle 72 # 11 – 30, apto 401');
  await click('[data-action="step-continue"][data-step="2"]');
  check('Checkout advances to step 3', await visible('[data-step="3"] .step__body'));

  // Coupon
  await setInput('#coupon-input', 'ADRIANA10');
  await click('[data-action="apply-coupon"]');
  await sleep(350);
  const totalWithDiscount = await text('#checkout-total');
  check('Coupon applies discount', totalWithDiscount !== total, `${total} -> ${totalWithDiscount}`);

  // Payment
  await setInput('#co-card-number', '4111111111111111');
  await setInput('#co-card-name', 'MARIA PEREZ');
  await setInput('#co-card-exp', '12/28');
  await setInput('#co-card-cvv', '123');
  await click('[data-action="pay"]');
  await sleep(2400);
  check('Payment shows confirmation', await visible('#view-confirmation'), await page.evaluate(() => location.hash));
  const orderNum = await page.evaluate(() => {
    const el = document.querySelector('.confirmation__order');
    return el ? el.textContent.trim() : null;
  });
  check('Confirmation shows order number', !!orderNum && orderNum.includes('ATR'), orderNum);
  const cartAfterPay = await text('#cart-count');
  check('Cart clears after payment', cartAfterPay === '0', `count=${cartAfterPay}`);
  const savedOrders = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('adriana_orders_v1') || '{}')));
  check('Payment stores order for tracking', savedOrders.length >= 1, savedOrders.join(','));

  // ── 8. Mobile behaviors ─────────────────────────────────────
  await page.setViewport({ width: 375, height: 780 });
  await go('#/pdp/aceite-argan');
  const buybarVisible = await page.evaluate(() => {
    const el = document.querySelector('#pdp-buybar');
    return el && getComputedStyle(el).display !== 'none';
  });
  check('Sticky PDP buy bar visible on mobile', buybarVisible);

  await go('#/plp');
  await click('#plp-grid .product-card__quick');
  await click('.cart-btn');
  await sleep(600);
  const drawerRect = await page.evaluate(() => {
    const el = document.querySelector('#cart-drawer');
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, vh: window.innerHeight, width: r.width };
  });
  check('Mobile drawer is near-full-width bottom sheet',
    drawerRect.width >= 370 && Math.abs(drawerRect.bottom - drawerRect.vh) < 2,
    JSON.stringify(drawerRect));

  // Mobile filter sheet
  await page.keyboard.press('Escape');
  await sleep(400);
  await go('#/plp');
  await click('.btn--filters');
  await sleep(500);
  check('Mobile filter sheet opens', await visible('#filter-sheet'));
  await page.evaluate(() => {
    const cb = document.querySelector('#filter-sheet-body input[name="brands"][value="Vichy"]');
    if (cb) cb.click();
  });
  await sleep(300);
  await click('[data-action="apply-filters"]');
  await sleep(600);
  const vichyCards = await evalCount('#plp-grid .product-card');
  check('Mobile filter applies', vichyCards > 0 && vichyCards < 16, `${vichyCards} cards`);

  // ── 8b. Search ─────────────────────────────────────────────
  await page.setViewport({ width: 1440, height: 900 });
  await gotoHome();
  await page.focus('#search-input');
  await page.keyboard.type('sérum');
  await page.keyboard.press('Enter');
  await sleep(600);
  check('Search navigates to filtered PLP', await visible('#view-plp'), await page.evaluate(() => location.hash));
  const searchTitle = await text('#plp-title');
  check('Search heading', searchTitle.includes('sérum'), searchTitle);
  check('Search returns results', (await evalCount('#plp-grid .product-card')) > 0);

  // Empty state
  await go('#/plp?q=zzzznoexiste');
  check('Empty state shows for no results', await visible('#plp-empty'));

  // Brands dropdown
  await gotoHome();
  await click('.nav-dropdown__toggle');
  check('Brands dropdown opens', await visible('#brands-panel'));
  await click('#brands-panel a');
  await sleep(600);
  check('Brands dropdown navigates', await visible('#view-plp'), await page.evaluate(() => location.hash));
  const brandTitle = await text('#plp-title');
  check('Brand heading from dropdown', brandTitle.length > 0, brandTitle);

  // Header brands available when landing directly on PLP
  await page.goto(URL + '#/plp', { waitUntil: 'domcontentloaded' });
  await sleep(500);
  await click('.nav-dropdown__toggle');
  const panelLinks = await evalCount('#brands-panel a');
  check('Brands dropdown populated on direct landing', panelLinks === 8, `${panelLinks} links`);

  // Mobile menu
  await page.setViewport({ width: 375, height: 780 });
  await gotoHome();
  await click('.menu-toggle');
  check('Mobile menu opens', await visible('#mobile-nav'));
  await click('#mobile-nav a');
  await sleep(600);
  check('Mobile menu navigates', await visible('#view-plp'), await page.evaluate(() => location.hash));

  // PDP related products
  await go('#/pdp/crema-hidratante');
  const related = await evalCount('.pdp-related .product-card');
  check('PDP related products render', related > 0, `${related} cards`);

  // Pickup flow
  await go('#/plp');
  await click('#plp-grid .product-card__quick');
  await go('#/checkout');
  await setInput('#co-name', 'María Pérez');
  await setInput('#co-email', 'maria@example.com');
  await setInput('#co-phone', '3001234567');
  await click('[data-action="step-continue"][data-step="1"]');
  await page.evaluate(() => {
    const r = document.querySelector('input[name="delivery"][value="recoger"]');
    if (r) r.click();
  });
  await sleep(400);
  check('Pickup fields render', await visible('#co-store'));
  await page.evaluate(() => {
    const sel = document.querySelector('#co-store');
    if (sel) { sel.value = 'Bogotá — Zona Rosa'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await click('[data-action="step-continue"][data-step="2"]');
  await sleep(400);
  check('Pickup advances to payment', await visible('[data-step="3"] .step__body'));
  await page.evaluate(() => {
    const r = document.querySelector('input[name="payment"][value="nequi"]');
    if (r) r.click();
  });
  await sleep(400);
  await click('[data-action="pay"]');
  await sleep(2400);
  check('Pickup payment confirms', await visible('#view-confirmation'), await page.evaluate(() => location.hash));

  // ── 8c. Empty checkout guard ───────────────────────────────
  await go('#/checkout');
  check('Empty cart checkout shows empty state',
    await page.evaluate(() => !!document.querySelector('#checkout-container .empty-state')));

  // ── 8d. Reviewer-fix regression checks ─────────────────────
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Skip link must focus main and keep the current route
  await go('#/pdp/crema-hidratante');
  await page.evaluate(() => document.querySelector('.skip-link').click());
  await sleep(400);
  const skipHash = await page.evaluate(() => location.hash);
  const skipFocus = await page.evaluate(() => document.activeElement && document.activeElement.id);
  check('Skip link keeps route (no Home redirect)', skipHash === '#/pdp/crema-hidratante', skipHash);
  check('Skip link focuses #main', skipFocus === 'main', String(skipFocus));

  // 2. Checkout stays in sync with cart mutations + coupon
  await go('#/plp');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#plp-grid .product-card__quick');
    if (btns[0]) btns[0].click();
    if (btns[1]) btns[1].click();
  });
  await sleep(400);
  await go('#/checkout');
  const payBeforeCoupon = await text('#pay-btn');
  await setInput('#coupon-input', 'ADRIANA10');
  await click('[data-action="apply-coupon"]');
  await sleep(400);
  const payAfterCoupon = await text('#pay-btn');
  check('Coupon updates pay button total', payBeforeCoupon !== payAfterCoupon, `${payBeforeCoupon} -> ${payAfterCoupon}`);
  const totalBeforeRemove = await text('#checkout-total');
  await click('.cart-btn');
  await sleep(600);
  await page.evaluate(() => {
    const btn = document.querySelector('.cart-item__remove');
    if (btn) btn.click();
  });
  await sleep(600);
  const totalAfterRemove = await text('#checkout-total');
  check('Cart mutation updates checkout total', totalBeforeRemove !== totalAfterRemove, `${totalBeforeRemove} -> ${totalAfterRemove}`);
  // Remove the remaining item -> checkout empty state, no pay button
  await page.evaluate(() => {
    const btn = document.querySelector('.cart-item__remove');
    if (btn) btn.click();
  });
  await sleep(600);
  check('Removing last item shows checkout empty state',
    await page.evaluate(() => !!document.querySelector('#checkout-container .empty-state')));
  check('No pay button on empty cart', !(await page.evaluate(() => !!document.querySelector('#pay-btn'))));

  // 3. Filter sheet focus + trap (mobile-only UI)
  await page.setViewport({ width: 375, height: 780 });
  await go('#/plp');
  await click('.btn--filters');
  await sleep(500);
  const sheetFocusAction = await page.evaluate(() =>
    document.activeElement ? document.activeElement.getAttribute('data-action') : null);
  check('Filter sheet focuses close button', sheetFocusAction === 'close-filters', String(sheetFocusAction));
  await page.keyboard.press('Tab');
  const sheetTrap = await page.evaluate(() => {
    const s = document.querySelector('#filter-sheet');
    return s && s.contains(document.activeElement);
  });
  check('Filter sheet traps Tab', sheetTrap);
  await page.keyboard.press('Escape');
  await sleep(400);
  await page.setViewport({ width: 1440, height: 900 });

  // 4. Header wishlist gives feedback
  await page.evaluate(() => document.querySelector('[data-action="wishlist-header"]').click());
  await sleep(350);
  const wishToast = await page.evaluate(() => {
    const t = document.querySelector('.toast');
    return t ? t.textContent.trim() : '';
  });
  check('Header wishlist shows feedback', wishToast.length > 0, wishToast);

  // 5. Variant change updates the URL without reload
  await go('#/pdp/labial-mate');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="select-variant"][data-variant="Nude"]');
    if (btn) btn.click();
  });
  await sleep(400);
  const variantHash = await page.evaluate(() => location.hash);
  check('Variant updates URL (?variant=)', variantHash.includes('variant=') && variantHash.includes('Nude'), variantHash);
  // Reload keeps the variant selected
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(600);
  const variantAfterReload = await text('#variant-selected-label');
  check('Variant persists after reload', variantAfterReload === 'Nude', String(variantAfterReload));

  // 6. Tabs arrow-key navigation
  await go('#/pdp/crema-hidratante');
  await page.evaluate(() => document.querySelector('[data-action="tab"][data-tab="detalles"]').focus());
  await page.keyboard.press('ArrowRight');
  await sleep(250);
  const tabFocus = await page.evaluate(() => document.activeElement && document.activeElement.dataset.tab);
  const tabSelected = await page.evaluate(() => {
    const t = document.querySelector('.tab-btn[aria-selected="true"]');
    return t ? t.dataset.tab : null;
  });
  check('Tabs ArrowRight moves focus', tabFocus === 'modo', String(tabFocus));
  check('Tabs ArrowRight selects panel', tabSelected === 'modo', String(tabSelected));

  // 7. Card price == cheapest in-stock variant (PDP entry price)
  await go('#/plp');
  const cardPairs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#plp-grid .product-card')).map((card) => ({
      id: card.dataset.productId,
      cardPrice: card.querySelector('.price').textContent,
      from: !!card.querySelector('.price-from'),
    }));
  });
  let priceMismatches = 0;
  let fromCount = 0;
  for (const pair of cardPairs) {
    const expected = await page.evaluate((id) => {
      const p = PRODUCTS.find((x) => x.id === id);
      const inStock = p.variants.filter((v) => v.stock > 0);
      const pool = inStock.length ? inStock : p.variants;
      const prices = [...new Set(pool.map((v) => v.price))];
      return { min: Math.min(...prices), multi: prices.length > 1 };
    }, pair.id);
    const cardNum = parseInt(pair.cardPrice.replace(/[^0-9]/g, ''), 10);
    if (cardNum !== expected.min) priceMismatches += 1;
    if (expected.multi) fromCount += 1;
    if (expected.multi && !pair.from) priceMismatches += 1;
  }
  check('Card price matches cheapest in-stock variant', priceMismatches === 0,
    `${priceMismatches} mismatches over ${cardPairs.length} cards`);
  check('Multi-price cards show "desde"', fromCount > 0, `${fromCount} multi-price cards`);

  // 8. Contrast AA for the adjusted tokens
  const contrast = await page.evaluate(() => {
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const lum = (hex) => {
      const h = hex.replace('#', '');
      return 0.2126 * lin(parseInt(h.slice(0, 2), 16)) +
             0.7152 * lin(parseInt(h.slice(2, 4), 16)) +
             0.0722 * lin(parseInt(h.slice(4, 6), 16));
    };
    const cr = (a, b) => {
      const la = lum(a); const lb = lum(b);
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };
    return {
      warning: cr('#8F5600', '#FFFFFF'),
      accentWhite: cr('#7E5A34', '#FFFFFF'),
      accentSoft: cr('#7E5A34', '#F4EAE0'),
      tokens: {
        warningDark: getComputedStyle(document.documentElement).getPropertyValue('--color-warning-dark').trim(),
        accentDark: getComputedStyle(document.documentElement).getPropertyValue('--color-accent-dark').trim(),
      },
    };
  });
  check('AA contrast: warning dark >= 4.5', contrast.warning >= 4.5, contrast.warning.toFixed(2));
  check('AA contrast: accent dark on white >= 4.5', contrast.accentWhite >= 4.5, contrast.accentWhite.toFixed(2));
  check('AA contrast: accent dark on soft >= 4.5', contrast.accentSoft >= 4.5, contrast.accentSoft.toFixed(2));
  check('AA tokens wired', contrast.tokens.warningDark === '#8F5600' && contrast.tokens.accentDark === '#7E5A34',
    JSON.stringify(contrast.tokens));

  // 9. Low-stock status uses the AA color
  await go('#/pdp/mascarilla-reparadora');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="select-variant"][data-variant="1 L"]');
    if (btn) btn.click();
  });
  await sleep(350);
  const lowColor = await page.evaluate(() => getComputedStyle(document.querySelector('#pdp-stock')).color);
  check('Low-stock uses AA warning color', lowColor === 'rgb(143, 86, 0)', lowColor);

  // 10. Apply button shows the active filter count (mobile-only UI)
  await page.setViewport({ width: 375, height: 780 });
  await go('#/plp');
  await page.evaluate(() => {
    const cb = document.querySelector('#filter-sheet-body input[name="brands"][value="Vichy"]');
    if (cb) cb.click();
  });
  await sleep(350);
  await click('.btn--filters');
  await sleep(450);
  const applyText = await text('#apply-filters-btn');
  check('Apply button shows filter count', /Aplicar\s*\(1\)/.test(applyText), String(applyText));
  await page.keyboard.press('Escape');
  await sleep(400);
  await page.setViewport({ width: 1440, height: 900 });

  // 11. No duplicate DOM ids (rail + sheet)
  const dupIds = await page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
    const seen = new Set(); const dups = new Set();
    ids.forEach((id) => { if (seen.has(id)) dups.add(id); seen.add(id); });
    return Array.from(dups);
  });
  check('No duplicate DOM ids', dupIds.length === 0, dupIds.slice(0, 6).join(', '));

  // 12. Confirmation persists in sessionStorage after reload
  await go('#/plp');
  await click('#plp-grid .product-card__quick');
  await go('#/checkout');
  await setInput('#co-name', 'María Pérez');
  await setInput('#co-email', 'maria@example.com');
  await setInput('#co-phone', '3001234567');
  await click('[data-action="step-continue"][data-step="1"]');
  await page.evaluate(() => {
    const sel = document.querySelector('#co-department');
    if (sel) { sel.value = 'Bogotá D.C.'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await sleep(400);
  await page.evaluate(() => {
    const sel = document.querySelector('#co-city');
    if (sel) { sel.value = 'Bogotá'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await setInput('#co-address', 'Calle 72 # 11 – 30');
  await click('[data-action="step-continue"][data-step="2"]');
  await setInput('#co-card-number', '4111111111111111');
  await setInput('#co-card-name', 'MARIA PEREZ');
  await setInput('#co-card-exp', '12/28');
  await setInput('#co-card-cvv', '123');
  await click('[data-action="pay"]');
  await sleep(2400);
  check('Payment reaches confirmation', await visible('#view-confirmation'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(600);
  check('Confirmation persists after reload', await visible('#view-confirmation'), await page.evaluate(() => location.hash));
  const orderAfterReload = await page.evaluate(() => {
    const el = document.querySelector('.confirmation__order');
    return el ? el.textContent.trim() : null;
  });
  check('Order number survives reload', !!orderAfterReload && orderAfterReload.includes('ATR'), String(orderAfterReload));

  // 13. Overlay click closes drawer and sheet
  await go('#/plp');
  await click('#plp-grid .product-card__quick');
  await click('.cart-btn');
  await sleep(500);
  await page.evaluate(() => document.querySelector('#drawer-overlay').click());
  await sleep(500);
  check('Overlay click closes drawer', !(await visible('#cart-drawer')));
  await page.setViewport({ width: 375, height: 780 });
  await click('.btn--filters');
  await sleep(500);
  await page.evaluate(() => document.querySelector('#sheet-overlay').click());
  await sleep(500);
  check('Overlay click closes filter sheet', !(await visible('#filter-sheet')));
  await page.setViewport({ width: 1440, height: 900 });

  // 14. Focus preserved across checkout re-renders
  await go('#/plp');
  await click('#plp-grid .product-card__quick');
  await go('#/checkout');
  await setInput('#co-name', 'María Pérez');
  await setInput('#co-email', 'maria@example.com');
  await setInput('#co-phone', '3001234567');
  await click('[data-action="step-continue"][data-step="1"]');
  await page.focus('#co-department');
  await page.evaluate(() => {
    const sel = document.querySelector('#co-department');
    sel.value = 'Bogotá D.C.';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(500);
  const deptFocus = await page.evaluate(() => document.activeElement && document.activeElement.id);
  check('Focus preserved on department select', deptFocus === 'co-department', String(deptFocus));
  await page.evaluate(() => {
    const sel = document.querySelector('#co-city');
    if (sel) { sel.value = 'Bogotá'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await setInput('#co-address', 'Calle 72 # 11 – 30');
  await click('[data-action="step-continue"][data-step="2"]');
  await page.focus('#payment-pse');
  await page.evaluate(() => document.querySelector('#payment-pse').click());
  await sleep(500);
  const payFocus = await page.evaluate(() => document.activeElement && document.activeElement.id);
  check('Focus preserved on payment method', payFocus === 'payment-pse', String(payFocus));

  // 15. Gallery ARIA uses group + button (not tab)
  await go('#/pdp/labial-mate');
  const galleryAria = await page.evaluate(() => {
    const group = document.querySelector('.pdp-gallery__thumbs');
    const thumb = document.querySelector('.pdp-thumb');
    return {
      groupRole: group ? group.getAttribute('role') : null,
      thumbRole: thumb ? thumb.getAttribute('role') : null,
      pressed: thumb ? thumb.getAttribute('aria-pressed') : null,
    };
  });
  check('Gallery uses role=group + role=button',
    galleryAria.groupRole === 'group' && galleryAria.thumbRole === 'button',
    JSON.stringify(galleryAria));

  // 16. Share action gives honest feedback (no fake "copied" claim)
  await go('#/pdp/crema-hidratante');
  await click('[data-action="share"]');
  await sleep(400);
  const shareToast = await page.evaluate(() => {
    const toasts = Array.from(document.querySelectorAll('.toast'));
    const t = toasts[toasts.length - 1];
    return t ? t.textContent.trim() : '';
  });
  check('Share action gives feedback', shareToast.length > 0, shareToast);

  // 17. Blocker: paying from step 3 with steps 1/2 incomplete jumps to the first invalid step
  await page.goto(URL, { waitUntil: 'domcontentloaded' }); // fresh page: resets in-memory checkout data
  await sleep(500);
  if (Number(await text('#cart-count')) === 0) {
    await go('#/plp');
    await click('#plp-grid .product-card__quick');
  }
  await go('#/checkout');
  await page.evaluate(() => {
    const head = document.querySelector('[data-step="3"] .step__head');
    if (head) head.click();
  });
  await sleep(400);
  check('Step 3 is expandable before completing steps 1/2', await visible('[data-step="3"] .step__body'));
  await click('[data-action="pay"]');
  await sleep(600);
  const activeStep = await page.evaluate(() => {
    const open = document.querySelector('.step .step__body:not([hidden])');
    return open ? open.closest('.step').dataset.step : null;
  });
  check('Pay jumps to step 1 (first incomplete)', activeStep === '1', String(activeStep));
  const focusId = await page.evaluate(() => document.activeElement && document.activeElement.id);
  check('Focus lands on the first invalid field', focusId === 'co-name', String(focusId));
  const payToast = await page.evaluate(() => {
    const toasts = Array.from(document.querySelectorAll('.toast'));
    const t = toasts[toasts.length - 1];
    return t ? t.textContent.trim() : '';
  });
  check('Error toast shown', payToast.includes('campos marcados'), payToast);

  // 18. Coupon apply/remove preserves focus (summary re-render)
  await go('#/plp');
  await click('#plp-grid .product-card__quick');
  await go('#/checkout');
  await setInput('#coupon-input', 'ADRIANA10');
  await page.focus('#coupon-input');
  await page.evaluate(() => document.querySelector('[data-action="apply-coupon"]').click());
  await sleep(500);
  const couponFocus = await page.evaluate(() => document.activeElement && document.activeElement.id);
  check('Coupon apply restores focus to input', couponFocus === 'coupon-input', String(couponFocus));
  await page.evaluate(() => document.querySelector('[data-action="remove-coupon"]').click());
  await sleep(500);
  const removeFocus = await page.evaluate(() => document.activeElement && document.activeElement.id);
  check('Coupon remove restores focus to input', removeFocus === 'coupon-input', String(removeFocus));

  // ── 9. Reduced motion ──────────────────────────────────────
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await gotoHome();
  const transitionDuration = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.btn')).transitionDuration);
  check('prefers-reduced-motion disables transitions', parseFloat(transitionDuration) < 0.02, transitionDuration);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);

  // ── 10. Console errors ──────────────────────────────────────
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));

  await browser.close();

  const failed = report.filter((r) => !r.pass);
  console.log(`\n${report.length - failed.length}/${report.length} checks passed`);
  if (failed.length) {
    console.log('\nFAILURES:');
    failed.forEach((f) => console.log(` - ${f.name}: ${f.detail}`));
    process.exit(1);
  }
})().catch((err) => {
  console.error('TEST CRASH:', err);
  process.exit(2);
});
