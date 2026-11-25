/* Tracking + terminology tests for the Adriana Tienda prototype. */
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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) {
      req.respond({ status: 204, contentType: 'text/css', body: '' });
    } else {
      req.continue();
    }
  });

  async function go(hash) {
    await page.goto(URL + hash, { waitUntil: 'domcontentloaded' });
    await sleep(300);
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
    return page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return false;
      el.click();
      return true;
    }, sel);
  }
  async function type(sel, value) {
    await page.evaluate((s, v) => {
      const el = document.querySelector(s);
      if (el) { el.value = v; }
    }, sel, value);
  }

  // Seed a known order (simulates a completed purchase).
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('adriana_orders_v1', JSON.stringify({
      'ATR-123456': {
        number: 'ATR-123456',
        email: 'cliente@example.com',
        name: 'Clienta Prueba',
        city: 'Medellín',
        eta: 'Llega mañana a Medellín',
        method: 'Tarjeta',
        total: 189900,
        createdAt: Date.now() - 2 * 60 * 1000,
      },
      'ATR-654321': {
        number: 'ATR-654321',
        email: 'cliente@example.com',
        name: 'Clienta Prueba',
        city: 'Recoge en tienda',
        eta: 'Listo para recoger hoy',
        method: 'Tarjeta',
        total: 99900,
        createdAt: Date.now() - 4 * 60 * 1000,
      },
    }));
  });

  // 1. Tracking view renders the form.
  await go('#/tracking');
  check('Tracking form renders', (await visible('#tr-order')) && (await visible('#tr-email')));

  // 2. Unknown order shows a clear empty state.
  await type('#tr-order', 'ATR-000000');
  await type('#tr-email', 'cliente@example.com');
  await click('form[data-action="track-order"] button[type="submit"]');
  await sleep(200);
  check('Unknown order shows empty state', (await text('.tracking__empty h2')) === 'No encontramos ese pedido');

  // 2b. Empty email must not reveal the order.
  await type('#tr-order', 'ATR-123456');
  await type('#tr-email', '');
  await click('form[data-action="track-order"] button[type="submit"]');
  await sleep(200);
  check('Empty email is rejected', !(await visible('.tracking__result')));

  // 3. Known order renders the tracking result.
  await go('#/tracking?order=ATR-123456');
  await sleep(200);
  const emailValue = await page.evaluate(() => document.querySelector('#tr-email').value);
  check('Order query prefills email', emailValue === 'cliente@example.com', `email=${emailValue}`);
  await click('form[data-action="track-order"] button[type="submit"]');
  await sleep(200);
  check('Tracking result shows order number', (await text('.tracking__num')) === 'ATR-123456');
  const badgeText = await text('.tracking__badge');
  check('Tracking result shows a status badge', !!badgeText, badgeText);
  check('Tracking badge text is a known state', ['Confirmado', 'En preparación', 'En ruta'].includes(badgeText), badgeText);
  const stepStates = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.tracking__steps li')).map((li) => li.className).filter(Boolean));
  check('Tracking steps mark progress', stepStates.includes('is-done') && stepStates.includes('is-active'), stepStates.join(','));

  // 4. Email mismatch is rejected.
  await go('#/tracking?order=ATR-123456');
  await sleep(200);
  await page.evaluate(() => { document.querySelector('#tr-email').value = 'otro@correo.com'; });
  await click('form[data-action="track-order"] button[type="submit"]');
  await sleep(200);
  check('Email mismatch is rejected', (await text('.tracking__empty h2')) === 'El correo no coincide');

  // 3b. Pickup variant.
  await go('#/tracking?order=ATR-654321');
  await sleep(200);
  await click('form[data-action="track-order"] button[type="submit"]');
  await sleep(200);
  const pickupBadge = await text('.tracking__badge');
  check('Pickup order badge', pickupBadge === 'Listo para recoger', pickupBadge);
  const pickupMeta = await page.evaluate(() => document.querySelector('.tracking__meta')?.innerText || '');
  check('Pickup order omits carrier', !/Transportadora/.test(pickupMeta));

  // 5. Terminology: the prototype says "carrito", not "bolsa".
  await go('#/home');
  const cartLabel = await page.evaluate(() => document.querySelector('.cart-btn')?.getAttribute('aria-label') || '');
  check('Cart button uses "carrito"', /carrito/.test(cartLabel), cartLabel);
  check('Cart counter id present', (await visible('#cart-count')));
  await click('.cart-btn');
  await sleep(300);
  const drawerLabel = await page.evaluate(() => document.querySelector('#cart-drawer')?.getAttribute('aria-label') || '');
  check('Cart drawer uses "carrito"', /carrito/i.test(drawerLabel), drawerLabel);
  const drawerTitle = await text('#cart-drawer .cart-drawer__head h2');
  check('Cart drawer title is "Tu carrito"', /Tu carrito/.test(drawerTitle || ''), drawerTitle);
  const bodyText = await page.evaluate(() => document.body.innerText);
  check('No visible "bolsa" text remains', !/bolsa/i.test(bodyText));

  // 6. Tracking is reachable from the footer.
  const footerHref = await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('.site-footer a')).find((a) => a.textContent.trim() === 'Seguir mi pedido');
    return link ? link.getAttribute('href') : null;
  });
  check('Footer tracks orders', footerHref === '#/tracking', String(footerHref));

  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

  const failed = report.filter((r) => !r.pass).length;
  console.log(`\n${report.length - failed}/${report.length} checks passed`);
  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
})();
