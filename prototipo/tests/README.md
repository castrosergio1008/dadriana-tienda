# Tests del prototipo (S0)

Tests de humo y QA del prototipo, ejecutados con **Chrome headless** a través de
`puppeteer-core` (solo driver; el navegador es el Chrome ya instalado en el sistema).
No requieren build: el prototipo es HTML + CSS + JS puro.

## Requisitos

- Node.js 18+.
- Google Chrome (o Chromium) instalado.
- Dependencia `puppeteer-core` (no necesita Chrome descargado por Puppeteer).

## Instalación

```bash
cd prototipo/tests
npm install
```

Si Chrome está en una ruta distinta a `/usr/bin/google-chrome`, define `CHROME_PATH`:

```bash
CHROME_PATH=/usr/bin/chromium node smoke.test.js
```

## Ejecución

```bash
npm test          # smoke.test.js — 108 verificaciones de flujos y accesibilidad
npm run test:qa   # qa.test.js — overflow por elemento + carga de imágenes
npm run test:layout # layout.test.js — columnas y layouts por breakpoint
npm run test:tracking # tracking.test.js — rastreo de pedidos y terminología "carrito"
```

Los cuatro scripts cargan `../index.html` vía `file://` y stubban las peticiones de
Google Fonts para que funcionen sin conexión.

## Qué cubren

- **smoke.test.js**: overflow en 375/768/1440, render de Home/PLP/PDP/Checkout,
  navegación, quick-add + drawer, filtros (marca, necesidad, precio, rating),
  variantes (precio/stock/imagen/URL), tabs con flechas, checkout con cupón y
  mutaciones de carrito, foco del bottom-sheet, skip-link, contraste AA,
  persistencia de la confirmación, overlay clicks, `prefers-reduced-motion` y
  cero errores de consola.
- **qa.test.js**: desbordes por elemento en todas las vistas y breakpoints, y
  verificación de que todas las imágenes cargan.
- **layout.test.js**: número de columnas del grid y layouts (2/3/4 columnas,
  PDP apilado vs. 7/5, checkout con resumen sticky).
- **tracking.test.js**: render del formulario de rastreo, pedido desconocido, email vacío,
  email que no coincide, resultado con estados y avance, variante "Recoge en tienda",
  terminología "carrito" (botón, contador y drawer) y enlace del footer.
