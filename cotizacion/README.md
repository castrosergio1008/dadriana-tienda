# Cotización DD-2026-0117 · E-commerce Adriana Tienda

Documento comercial de **Digitaldevs** para el diseño, construcción y lanzamiento de un
e-commerce de belleza y cuidado personal en Colombia. 12 páginas A4, HTML + Tailwind CSS v4,
exportable a PDF.

## Archivos

| Archivo | Uso |
|---|---|
| `index.html` | Documento completo (12 hojas A4). Es la fuente de verdad. |
| `src/input.css` | Tokens de marca, componentes y CSS de impresión (`@page A4`). |
| `styles.css` | CSS compilado por Tailwind. No editar a mano. |
| `DD-2026-0117-Cotizacion-Digitaldevs.pdf` | PDF final, 12 páginas A4, fuentes embebidas. |
| `assets/logo-isotipo.png` | Isotipo oficial (versión para fondos claros), usado en los encabezados. |
| `assets/logo-full-dark.png` | Lockup vertical oficial (símbolo + wordmark) con fondo transparente, usado en la portada. |
| `assets/brand-strip.png` | Franja de marca azul → cian → naranja de la portada (PNG para impresión fiable). |
| `package.json` | Tailwind 4 + CLI. |

## Regenerar el PDF

```bash
npm install                     # solo la primera vez
npx @tailwindcss/cli -i src/input.css -o styles.css --minify
google-chrome --headless --disable-gpu --no-sandbox --no-pdf-header-footer \
  --print-to-pdf="DD-2026-0117-Cotizacion-Digitaldevs.pdf" \
  "file://$PWD/index.html"
```

También se puede abrir `index.html` en Chrome y usar el botón **Descargar PDF**
(`window.print()`), con márgenes en “Ninguno” y gráficos de fondo activados.

## Identidad de marca

Se aplicó el **Manual de Imagen Corporativa de Digitaldevs**:

| Token | HEX | Uso |
|---|---|---|
| Azul Tecnológico | `#0066FF` | Primario, CTA, enlaces |
| Azul Profundo | `#003399` | Texto de acento sobre blanco |
| Cian Brillante | `#00CCFF` | Acento sobre fondos oscuros, hitos |
| Naranja Energético | `#FF6600` | CTA y franja de portada |
| Coral Vibrante | `#FF3366` | Alertas y detalles |
| Gris Corporativo | `#666666` | Texto secundario |
| Gris Claro | `#F5F5F5` | Fondos y separadores |
| Navy de marca | `#090F4B` | Fondo de portada y tarjetas oscuras |

Tipografía: **Inter** (títulos y cuerpo; el manual indica Roboto para cuerpo, pero no está
instalada en el entorno y se usa Inter como primaria) + **JetBrains Mono** para datos.

## Dónde editar

- **Precios del MVP / fases:** buscar `COP 159 M`, `COP 64 M`, `COP 80 M` (TRM de referencia: COP 3.317/USD).
- **Forma de pago:** tabla “Forma de pago del MVP” (5 hitos, suman 100%).
- **Recurrentes:** `COP 5.500.000`, `COP 150.000/h`, `COP 830.000–1.560.000/mes` de infraestructura.
- **Datos del cliente / cotización:** portada y encabezados (`DD-2026-0117`, fecha, vigencia).
- **Contacto:** bloque “Contacto comercial” al final (`hola@digitaldevs.co` es placeholder).
- **Marca:** los logos oficiales viven en `assets/`. Para cambiar el lockup de portada,
  reemplazar `assets/logo-full-dark.png`; para el encabezado, `assets/logo-isotipo.png`.

## Notas

- Las cifras de pasarelas son tarifas publicadas (oct-2026) y deben verificarse antes de
  firmar. Los precios del proyecto son una **propuesta comercial editable**.
- El benchmark de la referencia usa solo datos medidos: TTFB y peso del HTML. No incluye
  tiempos totales de carga inventados.
- La franja de portada se exportó como PNG porque Chrome headless imprimía el gradiente CSS
  con una transparencia incorrecta; el PNG garantiza el color en PDF.
