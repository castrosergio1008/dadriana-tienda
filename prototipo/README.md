# Adriana Tienda — Prototipo navegable (S0)

Prototipo front-end **sin backend** del e-commerce de Adriana Tienda, construido como una
SPA autocontenida en un solo HTML + CSS + JS (sin build, sin dependencias de runtime).
Cubre el entregable **S0** del Design Doc: **Home, PLP, PDP y Checkout**, más el
**drawer del carrito** y la vista de **rastreo de pedidos**.

---

## Cómo abrirlo

**Opción 1 (la más simple):** abre `index.html` con doble clic en Chrome/Edge/Firefox.
No requiere servidor ni instalación.

**Opción 2 (servidor local, recomendada para compartir):**

```bash
cd prototipo
python3 -m http.server 8080
# luego abre http://localhost:8080
```

> El prototipo usa rutas por hash (`#/plp`, `#/pdp/...`), así que funciona tanto desde
> `file://` como desde un servidor. Los estilos de fuente cargan desde Google Fonts si hay
> conexión; si no, se usan las fuentes del sistema (Georgia / system-ui) sin romper el layout.

---

## Archivos

| Archivo | Descripción |
|---|---|
| `index.html` | Documento completo: header, las 4 vistas, drawer, bottom sheet de filtros, footer. |
| `styles.css` | Design system completo: tokens, layout, componentes, responsive y motion. |
| `app.js` | Catálogo, router por hash, carrito, filtros, checkout simulado y utilidades. |
| `assets/` | Logo, portada y 19 imágenes reales de producto del cliente. |
| `tests/` | Tests de humo/QA reproducibles con Chrome headless (Puppeteer). |
| `README.md` | Este archivo. |

---

## Alcance (S0)

### Home (`#/home`)
- Header con logo real, menú de categorías, dropdown de marcas, buscador, wishlist y carrito con contador.
- Barra de anuncio (envío gratis, recoge en tienda, retracto).
- Hero con `portada.jpg` y CTA "Ver colección".
- Carrusel de marcas con scroll-snap (sin autoplay).
- "Compra por necesidad" (6 chips que filtran el catálogo).
- "Los más vendidos" (8 ProductCards con quick-add).
- Banners de campaña con imágenes reales.
- Reseñas agregadas (4.8 · 1.240 verificadas).
- Newsletter con consentimiento (Ley 1581) y fecha de nacimiento.
- Footer completo con legales, ayuda, contacto y medios de pago.

### PLP (`#/plp`, `#/plp?cat=…`, `#/plp?need=…`, `#/plp?q=…`)
- Breadcrumb, H1 contextual y contador de resultados.
- Orden: relevancia, precio ascendente/descendente, novedad, mejor calificados.
- Filtros funcionales: marca, rango de precio (slider dual), necesidad, tipo de cabello,
  calificación y disponibilidad.
- Chips de filtros activos con "limpiar todo" y eliminación individual.
- Grid de ProductCards (2 / 3 / 4 columnas) con quick-add.
- "Cargar más" con paginación incremental.
- Estado vacío con sugerencias.
- Texto SEO.
- **Móvil:** filtros en bottom-sheet con "Aplicar" y contador de filtros activos.

### PDP (`#/pdp/:id`)
- Galería 1:1 con thumbnails; en productos por tono, la galería muestra todos los tonos.
- Marca, nombre, rating con enlace a reseñas y badges (Nuevo, -% real, Bestseller).
- Precio con IVA y precio anterior tachado solo si el descuento es real.
- Selector de variantes: tamaños (botones) y tonos (swatches con color).
- **El cambio de variante actualiza precio, imagen principal, stock, thumbnails activos y la URL (`?variant=`, sin recargar; persiste al recargar).**
- Cantidad con stepper limitada al stock.
- Un solo CTA "Agregar al carrito" (sticky en móvil, con buy-bar).
- Disponibilidad con ETA por ciudad y opción "Recoge gratis hoy en tienda".
- Medios de pago aceptados.
- Tabs: Detalles, Modo de uso, Ingredientes, Especificaciones.
- Relacionados por necesidad/categoría y reseñas verificadas con distribución de estrellas.

### Checkout (`#/checkout`)
- Pasos visuales **Contacto → Entrega → Pago** en acordeón (sin cambiar de URL).
- Resumen **sticky** en desktop y **colapsable** al inicio en móvil, con ítems, subtotal,
  descuento, envío y total.
- Cupones funcionales: `ADRIANA10` (10%) y `ENVIOGRATIS`.
- Entrega a domicilio con **departamento → ciudad dependientes**, dirección, barrio e
  indicaciones; o **recoger en tienda** con sede y horario.
- Métodos de pago: tarjeta (con campos y validación), PSE, Nequi, contraentrega (COD) y
  BNPL Wompi SU+Pay (simulador de cuotas).
- Validación inline (sin alertas) y estados de error por campo.
- CTA "Pagar" con estado "Procesando…" y **confirmación simulada** con número de pedido,
  resumen, ETA y botón "Descargar factura" (informativo).

### Rastrear pedido (`#/tracking`)
- Formulario con **número de pedido + correo de compra** (validados; el correo es obligatorio).
- Muestra estado actual, transportadora, número de guía, fecha estimada y la línea de avance
  (Confirmado → En preparación → En ruta → Entregado; variante para recoge en tienda).
- Accesible desde el footer ("Seguir mi pedido"), el menú móvil y el botón "Rastrear tu pedido"
  de la confirmación.
- Los pedidos se guardan en `localStorage` (`adriana_orders_v1`) con su fecha de creación.

### Drawer del carrito
- Ítems con imagen 64×64, nombre, variante, stepper de cantidad, precio y eliminar.
- Subtotal y barra de progreso "Te faltan $X para envío gratis" (umbral $150.000).
- CTA "Ir a pagar" que lleva al checkout.
- **Drawer lateral en desktop y bottom-sheet en móvil.**
- `Esc` cierra, focus trap, `aria-live` para "producto agregado".
- Persistencia en `localStorage` (el carrito sobrevive al recargar).

---

## Decisiones de diseño

### Paleta (adaptada a la identidad real del logo)
El Design Doc proponía un primario burdeos `#7A1F3D`; se adaptó a la identidad real del
logo de Adriana Tienda, que es **verde profundo y dorado**:

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#1E644C` | CTA, links, marca (contraste AA sobre blanco ≈ 7:1) |
| `--color-primary-hover` | `#154E3B` | Hover/activo |
| `--color-accent` | `#B8895A` | Detalles premium, badges, estrellas |
| `--color-bg` | `#FDFBF9` | Fondo cálido |
| `--color-surface` | `#FFFFFF` | Tarjetas e inputs |
| `--color-border` | `#E8E1DD` | Bordes |
| `--color-ink` | `#1C1418` | Texto principal |
| `--color-muted` | `#6B5F63` | Texto secundario (AA sobre blanco ≈ 6:1) |
| `--color-success/warning/danger` | `#1E7A4C` / `#B26B00` / `#B3261E` | Estado |

Tipografías: **Fraunces** (titulares, Google Fonts con fallback Georgia) e **Inter**
(UI/cuerpo, con fallback system-ui). Radios 4/8/16, sombras cálidas de baja opacidad,
espaciado base 4 y motion CSS-first 120/200/320 ms con `cubic-bezier(0.2,0,0,1)`.
`prefers-reduced-motion` desactiva transiciones y animaciones.

### Mapeo de imágenes reales → productos
Las 19 imágenes de 206×206 se asignaron por **color y vibe dominante** (analizado
programáticamente: hue/saturación media de cada imagen):

| Imagen | Color dominante | Producto asignado |
|---|---|---|
| `476383572…` | neutro gris-verde | Shampoo Purificante Anticaspa |
| `476452255…` | violeta | Shampoo Morado Anti-amarillo |
| `476162518…` | terracota | Mascarilla Reparadora 400 ml |
| `476134411…`, `476292909…` | dorado / oliva | Aceite Capilar de Argán |
| `191190005…` | tan | Tónico Anticaída |
| `476245791…` | marrón cálido | Mascarilla Rizos Definición |
| `476402716…` | naranja | Sérum Vitamina C |
| `476224305…_942328714741276` | azul | Sérum Ácido Hialurónico |
| `187485109…` | crema/beige | Crema Hidratante Piel Sensible |
| `476076229…` | pálido | Protector Solar FPS 50+ |
| `191503315…` | neutro | Tónico Facial Calmante |
| `476443865…` | taupe | Contorno de Ojos Anti-edad |
| `476469612…` | marrón | Crema Corporal Reparadora |
| `476224305…_942328781407936` | ámbar dorado | Aceite Corporal Nutritivo |
| `476291670…`, `476619204…`, `190319138…`, `193774564…` | rojo / rosa / nude / vino | Labial Mate (4 tonos) |
| `476619204…`, `193774564…` | rosa / malva | Rubor en Crema (2 tonos) |

> No había imágenes verdes en el lote; los productos de cabello/cuerpo usan los neutros,
> tan y marrones disponibles. El hero usa `portada.jpg` (960×514) y el logo `logo.jpg`.

### Catálogo
16 productos plausibles para una tienda de belleza colombiana: 6 de cabello, 6 de rostro,
2 de cuerpo y 2 de maquillaje, con 8 marcas, precios en COP con IVA, ratings, reseñas,
stock y variantes (tamaño y tono). **Los nombres de marca son ilustrativos** y deben
reemplazarse por el catálogo real del cliente.

### Decisiones de UI respecto al Design Doc
- **Hero:** se usa 4:3 en móvil y 16:9 en desktop (en lugar de 4:5 / 21:9) para no recortar
  agresivamente la foto horizontal `portada.jpg` (1.87:1). El resto del sistema (tokens,
  grid, componentes, filtros por necesidad, quick-add, un solo CTA, resumen sticky) sigue
  el Design Doc.
- **Filtros:** el rail de 280 px se muestra desde 1024 px; en móvil es un bottom-sheet.
- **PDP móvil:** buy-bar sticky con precio + CTA, como pide el brief.
- **Checkout móvil:** resumen colapsable al inicio (orden -1) sobre los pasos.

---

## Auto-prueba (Chrome headless)

Los tests son **reproducibles** y viven en [`tests/`](tests/) (ver [`tests/README.md`](tests/README.md)
para instalación y ejecución). Se ejecutó un suite de **108 verificaciones** con
`google-chrome --headless` (Puppeteer) en 375 / 768 / 1440 px (y 320 / 414 px de overflow).
Resultado: **108/108 en verde**.

Cubierto:
1. Sin desbordes horizontales en Home, PLP, PDP, Checkout y Confirmación a
   375 / 768 / 1440 px (document-level y por elemento; además 320 / 414 px).
2. Navegación Home → PLP → PDP → Checkout → Confirmación.
3. Quick-add y drawer actualizan contador, subtotal y barra de envío gratis.
4. Filtros por marca, necesidad, precio, calificación y disponibilidad; chips activos y
   "limpiar todo"; estado vacío; "cargar más"; contador en el botón "Aplicar".
5. Selector de variantes de PDP actualiza precio, stock, imagen **y URL**
   (`?variant=`, sin recargar; persiste al recargar).
6. Checkout: pasos, resumen sticky sincronizado con el carrito y cupones, validación
   inline, pago con tarjeta y con Nequi, recogida en tienda y confirmación simulada.
7. Drawer: bottom-sheet en móvil, stepper de cantidad, eliminar, `Esc`, focus trap y
   cierre al hacer clic en el overlay.
8. `prefers-reduced-motion` desactiva transiciones y respeta el scroll de "ver reseñas".
9. Accesibilidad: skip-link que enfoca `#main` sin navegar, ARIA de tabs con flechas,
   foco preservado tras re-renderar el checkout, contraste AA verificado por cálculo.
10. Precio consistente entre tarjeta (PLP) y PDP (variante de entrada = la más barata con
    stock, con "desde" cuando hay rango de precios).
11. Cero errores de consola; todas las imágenes cargan; sin IDs duplicados en el DOM.

### Correcciones de review (ronda 1)
- **Skip-link** convertido a `<button>` que enfoca `#main` y no dispara el router.
- **Checkout desactualizado:** `addToCart`, `updateCartItem`, `removeCartItem` y los
  cupones repintan el resumen y el total del botón "Pagar" si la vista está activa;
  no se puede pagar con el carrito vacío (estado vacío + botón deshabilitado).
- **Bottom-sheet de filtros** enfoca su botón cerrar al abrir (focus trap verificado).
- **Wishlist del header** ahora da feedback (toast con el contador de favoritos).
- **URL de variante** sincronizada con `history.replaceState`.
- **ARIA de galería** corregido: `role="group"` + `role="button"` con `aria-pressed`.
- **Contraste AA:** `--color-warning-dark: #8F5600` (6,0:1) y
  `--color-accent-dark: #7E5A34` (6,2:1 sobre blanco, 5,2:1 sobre `--color-accent-soft`).
- **Precio tarjeta = precio PDP** (variante de entrada más barata con stock; "desde"
  cuando hay varias tarifas).
- **Tabs con flechas** (ArrowLeft/ArrowRight/Home/End) y paneles sincronizados.
- **Foco preservado** tras re-renderar el checkout (departamento, ciudad, entrega, pago
  y cuotas).
- **Confirmación persistente** en `sessionStorage` (sobrevive al recargar la pestaña).
- **Overlay click** cierra drawer y bottom-sheet.
- **`share`** copia la URL al portapapeles (con fallback honesto).
- **IDs únicos** en rail y bottom-sheet (prefijados por contexto).
- **Robustez:** `decodeURIComponent` protegido con try/catch; `renderPDP` valida el
  contenedor antes de desreferenciarlo.

### Correcciones de review (ronda 2)
- **Blocker:** `processPayment` ahora detecta el primer paso con errores con
  `Object.keys(e1).length` (antes `!e1`, siempre `false`) y enfoca el primer campo
  `aria-invalid="true"`. Verificado: pagar desde el paso 3 con pasos 1/2 incompletos
  salta al paso 1 y enfoca `#co-name`, con el toast de error correspondiente.
- **Foco en cupones:** aplicar y quitar cupón devuelve el foco al input tras re-renderar
  el resumen.
- **Overlays:** eliminados `role="button"` y `tabindex="-1"` de los overlays (el click y
  `Esc` siguen cerrando drawer y bottom-sheet).
- **Limpieza de código muerto:** fuera `renderFilterGroup`, `.pdp-badges`,
  `.filter-see-more`, `.hero__overlay`, `--color-warning-soft` y `--radius-xl`.

---

## Limitaciones (prototipo S0)

- **Sin backend:** los pagos son simulados; no hay integración con Wompi/PSE/Nequi, NI
  ni DIAN. El número de pedido es aleatorio (guardado en `sessionStorage` solo durante
  la pestaña; no en base de datos).
- **Sin búsqueda con autocompletado** (el buscador filtra el catálogo por texto, sin
  overlay con sugerencias ni sinónimos).
- **Sin wishlist persistente con página propia** (el corazón guarda en `localStorage`,
  pero no hay vista de lista).
- **Sin cupones reales** ni motor de reglas; solo dos códigos de demostración.
- **Sin escenarios de error de red** (Skeleton/error/retry del Design Doc) porque no hay
  peticiones: los datos son locales.
- **Filtros no se reflejan en la URL** (el Design Doc pedía URL actualizable); el estado
  de filtros se pierde al navegar a un producto y volver.
- **Reseñas y ratings son de ejemplo** (deterministas por producto), no datos reales.
- **Fotografías:** las imágenes reales del cliente son de 206×206; en la PDP se escalan a
  1:1 grandes, por lo que en desktop pueden verse ligeramente suaves. En producción se
  deben usar fotos de ≥800 px.
- **Hero:** la proporción se ajustó a 4:3 / 16:9 para no recortar la foto horizontal.
