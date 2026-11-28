# Decisiones del Comandante — Adriana Tienda

| Campo | Valor |
|---|---|
| **Autoridad** | `apex-forge` (Comandante APEX FORGE) |
| **Fecha** | 23 de noviembre de 2026 |
| **Originado por** | `docs/08-review/lgtm-documentacion.md` — REQUEST CHANGES (3 bloqueantes, 6 mayores, 8 menores, 4 nits) |
| **Estado** | **Ejecutorio**. Toda la documentación debe ajustarse a esta tabla antes de solicitar el LGTM final. |
| **Regla** | Ante dos documentos en conflicto, manda esta tabla; después manda el Design Doc enmendado; los artefactos de dominio (datos, API, seguridad) son la fuente operativa. |

---

## 1. Decisiones sobre bloqueantes

### C-01 — Inventario: se adopta **lotes + FEFO** (resuelve B1)
- La fuente de verdad es `inventory_lots(lot_id, site_id)`. `inventory_by_site(variant_id, site_id)` es **solo una proyección** derivada, actualizada en la misma transacción.
- Vocabulario único: **`site_id` / `sites`** en todos los artefactos. Quedan prohibidos `branch_id`, `branches`, `sucursal_id` como identificadores técnicos (se conservan como etiqueta UI en español).
- El anti-sobreventa es el `UPDATE` atómico condicional sobre `inventory_lots` con `reserved ≤ on_hand`.
- Se añaden RF-078 a RF-081 (lotes, vencimientos, FEFO, bloqueo por vencimiento), una historia de diseño y una historia del backlog.
- **Se cierra la pregunta FEFO** (antes DD-Q9 / RM-Q9). Umbrales aprobados para MVP: aviso a 90 días, bloqueo de venta a 15 días. Sin descuento automático en Fase 1.
- Se corrige el typo «concerted» → «concertar».

### C-02 — Dinero: se adopta **BIGINT en centavos** (resuelve B2)
- Todos los importes son `*_cents` (`BIGINT`). El IVA del 19 % se expresa como **`1900 basis points`**; queda prohibido usar `1900` como `rate` decimal.
- Fórmula canónica: `base_cents = round_half_up(total_line_cents / 1.19)`, `iva_cents = total_line_cents - base_cents`. La suma por línea debe cuadrar con el total.
- Se enmiendan ADR-004, Design Doc, estrategia de pruebas y glosario. Los ejemplos con «COP enteros» desaparecen.

### C-03 — Venta POS: **permanece en el MVP** (resuelve B3)
- Se añade la historia `OPS-09 — Registro de venta presencial` (8 pts) al Sprint 6, con dependencia de la historia de inventario.
- Se añade el escenario E2E de pedido POS al plan de pruebas y se mantiene como gate de release.
- Se corrige el plan de sprints y el panorama para que POS aparezca donde se dice que aparece.

---

## 2. Decisiones sobre hallazgos mayores

### C-04 — Autenticación (resuelve M1, m1, m8)
- **Storefront y panel admin:** access token y refresh token en **cookies `httpOnly`**. Sin `Bearer` accesible desde JavaScript.
- `Authorization: Bearer` queda **exclusivamente** para integraciones servidor a servidor (webhooks, worker, DIAN), documentado como tal en el contrato.
- `SameSite=Strict` con **excepción documentada** para el retorno desde Wompi (callback de pago), donde se usa `SameSite=Lax` solo en la cookie de sesión de checkout.
- **MFA en MVP para Admin y Superadmin.** Los Vendedores usan sesión de tablet de 8 h sin MFA; MFA para vendedores se difiere a Fase 2. Se alinean ADR-005, diagramas, README y requisitos SEC.

### C-05 — Rate limiting (resuelve M2)
- Login: **5 intentos / 15 min por IP + cuenta**, con backoff exponencial y CAPTCHA tras el quinto intento.
- Checkout: **20 peticiones / min por sesión**, con `Idempotency-Key` obligatoria.
- Estos son los valores únicos; se propagan a RNF-016, ADR-005, API y SEC-011.

### C-06 — Contrato de pedido (resuelve M3)
- `POST /api/v1/checkout` es el **único** endpoint de creación de pedido. No se crea `POST /orders`.
- El ejemplo del Design Doc se reescribe con `cartId`, `fulfillmentType`, `grandTotalCents` y `nextAction.checkoutUrl`.

### C-07 — Trazabilidad de decisiones (resuelve M4)
- Prefijos obligatorios: **`DD-Qn`** para el Design Doc y **`RM-Qn`** para el plan maestro. Se elimina el ID `Qn` suelto.
- Esta tabla es la **tabla maestra de decisiones**; cada documento puede referenciar `C-01`…`C-12`.

### C-08 — Estados de pedido (resuelve M5, M6)
- Identificadores canónicos en inglés: `PENDING_PAYMENT`, `PAID`, `PREPARING`, `PACKED`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `REFUNDED`, `RETURN_REQUESTED`, `RETURN_REJECTED`.
- Los nombres en español de RF/ADR son **etiquetas de UI**, no identificadores. Se publica una tabla de mapeo.
- Se elimina la transición `RETURN_REQUESTED → DELIVERED`. Retracto rechazado termina en `RETURN_REJECTED` (terminal). `DELIVERED` deja de ser terminal únicamente cuando existe `RETURN_REQUESTED`.
- `READY_FOR_PICKUP` es un estado propio de `orders.status`, no un derivado de `store_pickups.status`.

### C-09 — Costes, TRM y PITR (resuelve Q11/Q12, m2)
- **TRM de planeación: COP 4.000/USD** hasta el cierre contractual. Se indica explícitamente que es estimación y se actualizará con la TRM vigente el día de firma. No coexisten dos cifras sin esta nota.
- **PITR: 7 días + dump frío diario con retención de 30 días** para MVP. La ampliación a PITR de 30 días (USD 50–100/mes) queda como mejora aprobable por el cliente, no como requisito bloqueante.
- Comisión de pasarela: los importes publicados son **sin IVA**; se elimina el `× 1,19` de la nota y el rótulo «con IVA» para evitar doble conteo.

---

## 3. Decisiones sobre menores y nits

| ID | Decisión | Responsable |
|---|---|---|
| C-10 | Contraste `#B8895A` sobre `#1C1418` = **5,82:1** (corregir el 6,4:1). Se añaden tokens semánticos para los colores usados en panel admin; el texto deshabilitado sube a ≥4,5:1. | frontend |
| C-11 | Estimación Fibonacci estricta: 6 → 5 u 8; 11 → 8 o 13. El total 259 se recalcula y se propaga a plan de sprints y métricas. | qualis |
| C-12 | Adaptador `mercado-pago` se elimina del contrato (o se marca «inactivo, Fase 2»). Formato único de pedido `AT-2026-000123` y cupón `ADRIANA10`. Precedencia: **el Draft `docs/02-arquitectura/design-doc.md` absorbe al raíz `DESIGN_DOC.md` v1.0**; las referencias relativas se convierten en enlaces. `aria-live` queda como requisito de implementación, no de maqueta estática. | backend / frontend / architect |

---

## 4. Matriz de propagación

| Decisión | Artefactos que deben cambiar | Dueño |
|---|---|---|
| C-01 | design-doc, ADR-003, ADR-004, requisitos funcionales, historias-usuario, backlog, modelo lógico, diccionario, Prisma documental, reglas de negocio, máquinas de estado, estrategia de datos, README | architect / backend / qualis / Comandante |
| C-02 | ADR-004, design-doc, estrategia-pruebas, api-rest, diccionario, Prisma documental, README | architect / backend / qualis / Comandante |
| C-03 | backlog, plan-sprints, estrategia-pruebas, matriz-riesgos, README | qualis / Comandante |
| C-04 | design-doc, ADR-005, diagramas, api-rest, requisitos-seguridad, README, visto bueno sentinel | architect / backend / sentinel / Comandante |
| C-05 | RNF, ADR-005, api-rest, SEC-011, estrategia-pruebas | architect / backend / sentinel / qualis |
| C-06 | design-doc, api-rest | architect / backend |
| C-07 | design-doc, README + esta tabla | architect / Comandante |
| C-08 | design-doc, RF, ADR-003, máquinas de estado, api-rest, RF/UI labels | architect / backend |
| C-09 | design-doc, ADR-002, presupuesto, analisis-hosting, backups, README | architect / infra / Comandante |
| C-10..C-12 | sistema-diseno, maquetas, backlog, api-rest, docs raíz | frontend / qualis / backend / architect |

---

## 4b. Arbitrajes de la segunda iteración

| ID | Decisión |
|---|---|
| C-13 | **Estados residuales retirados.** No existen como `OrderStatus`: `PAID_NEEDS_REVIEW`, `SHIPPED`, `RETURNED`, `DRAFT`, `PICKED_UP_READY`. Pago aprobado tras expirar la reserva ⇒ pedido permanece en `PENDING_PAYMENT`, `payments.status = PAID` y bandera `reviewRequired = true`. Envío a domicilio ⇒ `OUT_FOR_DELIVERY` (no `SHIPPED`). Retiro confirmado ⇒ `DELIVERED`. Se propaga a scrum, maquetas, seguridad y Design Doc. |
| C-14 | **Alias POS aceptado.** `POST /api/v1/pos/sales` es un alias de canal que delega en el mismo handler de `POST /api/v1/checkout` (mismo esquema, idempotencia y numeración). No es un segundo contrato de creación de pedido. |
| C-15 | **Numeración.** `AT-2026-000123` define el **formato** `AT-AAAA-XXXXXX` con secuencia compartida entre web y POS; no es un literal que deba repetirse en todos los ejemplos. |

---

## 4c. Arbitraje del Home — CSP interino (26-nov-2026)

| ID | Decisión |
|---|---|
| C-HOME-01 | **CSP interino del Home para F4.** Se mantiene únicamente `Content-Security-Policy-Report-Only` (nunca `enforce`) con `base-uri 'none'`, `form-action 'self'` y `upgrade-insecure-requests`. **No se publica `report-uri`**: DD-HOME-02 prohíbe Route Handlers en el Home y no existe endpoint de reporte; el `enforce` queda **bloqueado** hasta que un DD nuevo defina un endpoint sin PII, se acumulen 7 días de evidencia y firmen `forge-sentinel` + `forge-infra` con E2E en verde. `style-src 'unsafe-inline'` queda como excepción temporal documentada hasta migrar a nonce/hashes. Esto matiza transitoriamente la línea `design-doc-home.md:407` sin modificar el documento aprobado; A2/`noindex` y el OK de Sentinel siguen vigentes para cualquier publicación. Veredicto de `forge-sentinel`: **OK interino para F4, NO para release**. |
| C-HOME-02 | **Logo del cliente en Home (26-nov-2026).** Se reemplaza en header, footer y favicon desde `logo_dadriana.png` (raíz, conservado sin modificar): `public/brand/logo.png` 96×96 RGBA (14.987 B) y `app/icon.png` 64×64 RGBA (7.889 B), ambos < 40 KB. Presentación directa, sin el círculo crema: se retira el `span` con `bg-surface` en `BrandMark()` y en el footer; se mantienen el enlace `/`, los alt, el foco global y la imagen OG `/brand/og-image.png` intactos. CSP/A2 (C-HOME-01), F5 y `noindex` no se tocan. Sin commit, push ni deploy. |

Nota C-HOME-02: hash SHA-256 previo de `public/brand/logo.png` = `b70861c4979f98172bdbe6fc6acd999538c8e0040ac7a38b1dd7c7038997462b`; hash actual = `72cea2ec1d5858c1ca527135176752f993823bead7a00003b52ab18cc74de441`. No se guarda backup binario. Riesgo reportado sin inventar un fondo nuevo: al quitarse el círculo, el verde del logo sobre `#1B5D4A` tiene contraste mediano 1,1:1 (17,4 % de píxeles opacos ≥ 3:1) y sobre `#123F33` 1,55:1 (23,8 %).

---

## 4d. Arbitraje del Home — DD-HOME-23 (27-nov-2026)

| ID | Decisión |
|---|---|
| C-HOME-03 | **D-23-08 — Región de viewport, no compensación estática.** El patrón literal de `§4.3` (`.home-stage` flex con `min-height:100svh` y `main` conteniendo también las secciones) no produce una altura definida para el hero: `flex:1` resuelve contra la altura del contenido (~2900 px) y el slide queda en `70svh`. La alternativa de `--stage-chrome-h` deja huecos de 64–66 px en 600–1023 px porque la altura real del header cambia en esos anchos. Se introduce `.home-stage__viewport` con `display:flex; flex-direction:column; min-height:100svh`, que contiene **solo** el chrome y el hero; las secciones quedan en `<main>` hermano. Así el hero crece con `flex:1` hasta exactamente el borde inferior del viewport en cualquier ancho, sin medir el header en runtime, sin `--stage-chrome-h` y sin CLS. Es una enmienda deliberada al DD aprobado: la fuente de verdad pasa a ser esta decisión + el DD-23 §4.3 leído con este modelo. |
| C-HOME-04 | **Matriz de geometría ampliada.** HOME-E2E-34 cubre `[375, 600, 767, 768, 820, 900, 1023, 1024, 1440]`, verifica `display:flex`, `flex-direction:column`, `min-height:100svh` del viewport, `flex-grow >= 1` del hero, cero solape, que el hero termine en el viewport (±1 px) y cero overflow en los 3 slides. La rama táctil se comprueba también en 767 px. `retries: 0` se mantiene. |
| C-HOME-05 | **Retirada completa del chrome de DD-HOME-22.** Además de quitar `overlay`, se eliminan las reglas no-op `:hover`, `:focus-within`, `@media (hover:none)` sobre `.home-stage__chrome` y el velo superior. El fondo del header es blanco por una sola regla base; el autoplay lo pausa únicamente el slide (D-23-06). |
| C-HOME-06 | **Skip link sigue alcanzando el H1 y el CTA.** Con el hero fuera de `<main>`, el target `#main` se coloca en la región del hero (`tabIndex={-1}`) y el landmark pasa a `id="contenido"`. HOME-E2E-01 verifica que "Saltar al contenido" enfoca `#main`; así el usuario de teclado no salta por encima del H1 y el CTA aprobado. HOME-E2E-40 queda etiquetado también `@smoke` tras estabilizar (67/67 en dos corridas, `retries: 0`). |

## 4e. Arbitraje del Home — DD-HOME-24 (27-nov-2026)

| ID | Decisión |
|---|---|
| C-HOME-07 | **DD-HOME-24 APROBADO.** El cliente pidió «quita la capa de la imagen, que la imagen se vea clara, no tan gigante» y eligió texto/controles **debajo de la foto**. Se elimina `.hero__scrim` del DOM y del CSS (fin del velo verde), se sustituye `object-cover` por `object-contain` en un marco cuadrado de `min(100%, 48svh, 28rem)` (≤ 448 px, sin recorte y sin CLS) y el `HeroCopy` pasa a variante `on-light` sobre fondo blanco. Header, autoplay, assets, Poppins y skip link intactos. El reloj determinista de HOME-E2E-40 se mantiene en 5 s (no 6 s) para preservar la corrección del `pauseAt`. |

## 4f. Publicación de la app en el alias de producción (27-nov-2026)

| ID | Decisión |
|---|---|
| C-HOME-08 | **Retirar el `vercel.json` temporal y publicar la app en `https://dadriana-tienda.vercel.app`.** El log del deployment de `f7a0610` mostró `Build Completed [99ms]` y `no files were prepared`: Vercel copió `presentacion/mvp/` porque `vercel.json:3-6` fijaba `framework:null`, `buildCommand:""` y `outputDirectory`. Infra y Sentinel aprobaron el borrado: basta con eliminar el archivo, Vercel detecta Next.js por `package.json`/lockfile y aplica el CSP **report-only** de `next.config.ts:33-38` (C-HOME-01, sin `report-uri`). El cliente pidió explícitamente que la página sea visible y autorizó commit + push; el Comandante arbitra que esa autorización **supera la excepción temporal de «solo HTML estático»** de `runbook-mvp.md:113-117`. El ID del deployment anterior queda registrado como **`CLqk5ZKNjuDNVGdMyp9FqTjH6QuW`** (commit `a7e035b`); el drill cronometrado y el acta A2 siguen pendientes, pero no bloquean esta publicación autorizada. Rollback: revertir el commit que retira `vercel.json` y reasignar el alias al ID registrado; no hay BD ni migraciones que revertir. Production ya respondía 200 anónimo, Previews siguen con SSO y `noindex` intacto. |

## 4g. Lupa de búsqueda en el header (27-nov-2026)

| ID | Decisión |
|---|---|
| C-HOME-09 | **DD-HOME-25 APROBADO.** El cliente pidió «cambiar el botón de búsqueda, añadir una lupa que al seleccionarla diga ¿Qué estás buscando?», pasó un SVG de Nihlo como referencia y cerró tres decisiones: (1) la lupa **abre el campo**, (2) la URL de Nihlo es **solo referencia visual**, (3) color **verde ink** (`#123F33`), no el azul `#132c45` del ejemplo. Se adopta el patrón de **disclosure con panel overlay**: botón `type="button"` con `aria-expanded`/`aria-controls`, foco automático al input, cierre con Escape/click fuera y submit propio «Enviar búsqueda». El `<form action="/buscar" method="get" role="search">` y el `GET /buscar?q=…` sin XHR quedan intactos. SVG local con `currentColor`, `viewBox="0 0 49.36 45.44"`, 28 px desktop / 22 px móvil y área táctil ≥44×44 px; sin IDs uuid, sin `<style>` inyectado, sin recursos externos. CLS 0 px y overflow 0 en los 9 anchos. Actualizan HOME-E2E-05/-13/-19/-27 y se añaden -45…-50. **No hay autorización para commit, push ni deploy** de este cambio. |

## 4i. Arbitraje del Home — DD-HOME-27 (27-nov-2026)

| ID | Decisión |
|---|---|
| C-HOME-27 | **DD-HOME-27 v0.3 APROBADO Y EJECUTADO; PUBLICACIÓN BLOQUEADA.** El cliente pidió «que las imágenes del slide se ocupen todo el espacio, que no lleven marco» y cerró cinco decisiones: (1) ancho completo con bloque compacto, no pantalla completa; (2) `object-cover`; (3) texto y controles debajo sobre blanco, sin velo; (4) usar los cuatro PNG que él proporcionó (`hero_1`…`hero_4`, 1018×376, marca BellSk y texto incrustado) en lugar de los tres JPG cuadrados; (5) carrusel de **cuatro slides**. Se enmienda así `C-HOME-07`: `.hero__media` pasa a hijo directo de `section.hero` (sin `width:100vw`, para evitar overflow por scrollbar), banda `clamp(200px, 40svh, 384px)` (360 px a 900 px de alto, 325 px a 375×812, 240 px a 768×600), `object-position: center`, `sizes="100vw"` y `alt=""`. Se aceptan de forma explícita el escalado 1,415× (0,71 px de fuente por px CSS a 1440) y el recorte a 43–52 % del ancho en móvil; HOME-E2E-54 mide la densidad real del bitmap servido. **GO de implementación recibido («ejecuta el plan») y ejecutado**: manifiesto y allowlist de cuatro slides, `HomeStage.tsx`, `globals.css`, cuatro PNG copiados byte-for-byte a `public/slides/`, HOME-E2E-30/-33/-34/-35/-36/-38/-39/-41/-42/-43/-44 adaptados y nuevos HOME-E2E-54/-55. Gates verdes: lint, typecheck, 68/68 unitarios, 107/107 E2E (`retries: 0`), build y bundle (Home 110.853 B gzip / 150.000 B; total 258.986 / 300.000). `forge-reviewer` emitió **LGTM**; `forge-qualis` e `forge-infra` emitieron **GO técnico condicionado**. `forge-sentinel` emitió **BLOQUEAR PUBLICACIÓN**: exige licencia escrita del titular de BellSk con alcance, plazo y territorio (o sustitución por marca propia) y evidencia o reformulación/retirada de los claims incrustados. La excepción QA `QA-EXC-27-01` queda registrada abajo. `ADR-HOME-27-01` registra la inversión deliberada de C-HOME-07. **No hay autorización para commitear, pushear ni desplegar**; si se llega a versionar, el commit debe incluir los ocho PNG (raíz y `public/slides/`) porque los tests leen la raíz como fixture. Rollback: conservar los tres JPG antiguos y restaurar manifiesto/CSS/test al estado DD-HOME-24. |

Nota C-HOME-27 — cierre técnico y waiver QA (27-nov-2026):

> **QA-EXC-27-01 — Aceptada condicionadamente** (DD-HOME-27 v0.3; owner: `forge-qualis`). Se acepta `alt=""` en `/slides/hero-1.png` … `/slides/hero-4.png` pese al texto incrustado (marca BellSk y claims), porque no existe copia aprobada que duplicar y el H1 «Belleza para tu piel y tu cabello» y el CTA «Explorar piel» → `/piel` permanecen en el DOM (`tests/e2e/home.spec.ts:139-145`). Esta excepción **NO autoriza publicación** y **NO declara conformidad WCAG 1.1.1/1.4.5** para el texto de las imágenes: axe no puede inspeccionarlo; se registra como riesgo residual con plan de remediación (añadir alternativa textual aprobada en el DOM cuando legal/content la entregue, sin inventar copia). Condiciones de cierre: (1) `forge-sentinel` + contenido/legal firman el checklist de los cuatro PNG antes del release; (2) se verifican los SHA-256 en disco contra `tests/unit/hero-slides.test.ts:11-36` y `tests/e2e/home-slide.spec.ts:55-76`; (3) se confirma uno a uno el texto visible. Si legal/content declara que algún claim es copia informativa esencial, la excepción decae y el release espera la alternativa textual.

Checklist manual de claims que debe adjuntarse al acta de release (no lo puede verificar axe):

- [ ] `hero_1.png`: «BellSk», «EYES CONTOUR / DARK CIRCLE», «YOUTH AND BEAUTY», «Reduce / Suaviza ojeras / líneas» → requiere evidencia o suavizado de «reduce/suaviza».
- [ ] `hero_2.png`: «Cuida tu piel, controla el brillo y luce radiante», «Tu piel en las mejores manos», «BellSk», «YOUTH AND BEAUTY» → aceptable con descargo genérico.
- [ ] `hero_3.png`: «Lápiz antiacné», «Tea Tree Oil», «combate efectivamente espinillas», «reduce espinillas / previene brotes» → **bloqueante** sin evidencia o reformulación.
- [ ] `hero_4.png`: «LA MAGIA DE LA METALTERAPIA», «El oro y la plata revitalizan y protegen tu piel» → **bloqueante** sin evidencia o reformulación.

> **Nota de alcance C-HOME-28 (27-nov-2026).** El cliente aprobó el contenido de `hero_5.jpg`, por lo que el visto bueno de `forge-sentinel` se levanta **SOLO para el slide 04**. Este checklist histórico de `hero_4.png` se conserva como registro del asset sustituido y de su rol de rollback; no se interpreta como autorización para los slides 01–03, que siguen con `QA-EXC-27-01` y los claims bloqueantes de `hero_3` (§4i). El acta de release debe citar `ADR-HOME-28-01`.

Condiciones mínimas de `forge-sentinel` para levantar el veto: licencia escrita del titular de BellSk con alcance, plazo y territorio, o sustitución de las imágenes por marca propia; y evidencia/reformulación/retirada de los claims bloqueantes. Sin estos dos requisitos no hay merge a `main`, promoción de alias ni deploy. `forge-qualis` añade como condición técnica la medición manual a 1440 con barra de scroll visible (banda ≈ `clientWidth`, sin overflow), porque CI ejecuta Chromium con `--hide-scrollbars`. `forge-infra` añade la inclusión explícita de los ocho PNG y el reparto/revisión del workstream del header antes de atribuir el green a este cambio.

Nota C-HOME-27/v0.4 — enmienda de geometría (27-nov-2026):

> El cliente pidió «Necesito que muestres todo el alto de la imagen, ya que la estás recortando» y, ante la pregunta de cómo hacerlo, eligió **«Altura natural, ancho completo»**. El Comandante aprueba la enmienda **en diseño**: la banda sigue ocupando todo el ancho disponible del documento y **no se introduce CSS `width:100vw`** (§4.2 del DD sigue vigente); `.hero__frame` pasa de `height:clamp(200px,40svh,384px)` a **`aspect-ratio:1018 / 376; height:auto`** y `<Image>` de `object-cover` a **`object-contain`**. La proporción del marco es la del bitmap, así que no hay bandas ni recorte (100 % de ancho y alto) y la altura se reserva antes de cargar la imagen, con **CLS 0**. Alturas: 320→118 px, 375→139 px, 600→222 px, 767→283 px, 768→284 px, 820→303 px, 900→332 px, 1023→378 px, 1024→378 px y 1440→532 px; la altura ya no depende del viewport (768×600: 240 px → 284 px). La densidad real no cambia: a 1440 se dibuja 1440×532 con escala 1,415×, es decir **0,71 px de fuente por px CSS** (2,83× en DPR 2); HOME-E2E-54 sigue midiendo eso. Peajes aceptados: en escritorio la banda deja de ser compacta (532 px, +172 px frente a 360 px y +100 px frente al cuadrado de 432 px de DD-HOME-24) y el H1/CTA bajan; en móvil es más baja (139 px frente a 325 px). Antes se veía el 68 % de la altura a 1440 y el 43–52 % del ancho en móvil; ahora se ve el 100 % de ambos. No cambian `fill`, `sizes="100vw"`, `object-position:center`, `alt=""`, los cuatro PNG byte-for-byte, el ciclo 1→2→3→4→1, el texto/controles sobre blanco ni los handlers de pausa. El LGTM y el veto anteriores se referían a la implementación v0.3. **GO de ejecución recibido y ejecutado**: `app/globals.css`, `components/HomeStage.tsx` y los tests de geometría quedaron en v0.4; gates verdes (lint, typecheck, 68/68 unitarios, **110/110 E2E** con `retries: 0`, build y bundle con Home 110.851 B gzip / 150.000 B y total 258.984 / 300.000). `forge-reviewer` emitió **LGTM v0.4** sin bloqueantes y `forge-qualis` reconfirmó **GO técnico condicionado**; `QA-EXC-27-01` sigue válida sin cambios porque los PNG son idénticos. **El veto de `forge-sentinel` por marca BellSk y claims sigue vigente y no se reabre**: este cambio es solo geometría sobre los mismos assets, ahora totalmente visibles. Estado: **ejecutada y revisada; NO autoriza commit, push ni deploy**. La fuente de verdad es §14 de `docs/02-arquitectura/design-doc-slide-full-bleed.md`; `ADR-HOME-27-01` registra qué decisiones quedan superadas.

## 4j. Enmienda del slide 04 — DD-HOME-28 (27-nov-2026)

| ID | Decisión |
|---|---|
| **C-HOME-28** | **DD-HOME-28 / `ADR-HOME-28-01` APROBADO EN DISEÑO.** El cliente pidió «cambies la imagen hero_4 por hero_5» y cerró tres decisiones: (1) `hero_5.jpg` tal cual (JPEG, 2880×900, 412712 bytes, SHA-256 `37328e3d…`), copiado byte-for-byte a `public/slides/hero-5.jpg`, sin recodificar ni convertir; (2) se **reemplaza** el slide 04 y el carrusel sigue con **4 slides** e id `slide-04`; (3) el texto/marca incrustado está **aprobado para publicación**, con lo que se levanta el veto de `forge-sentinel` **únicamente sobre el slide 04**. Se conserva `hero_4.png` en raíz y en `public/slides/` para rollback. **Sin autorización para commitear, pushear ni desplegar.** |
| **C-HOME-28a** | **Geometría: no se toca.** Se mantiene `.hero__frame { aspect-ratio:1018/376; height:auto }` y `object-contain` global. El asset nuevo es 3,2:1, por lo que el slide 04 deja ~15,39 % de la altura del marco en bandas (7,70 % arriba y 7,70 % abajo; ≈41 px a 1440, ≈11 px a 375). Se **aceptan esas bandas** como peaje localizado. Se rechazan `object-cover` global (recortaría 15,39 % del bitmap y, según OCR, el texto «SOLO POR HOY» que empieza en `x=0`), el cambio de ratio global (pillarbox en los otros tres slides y reescritura de 11 geometrías) y las excepciones por slide (Q-27-D). Sin recorte, sin `object-position` por slide, CLS 0. |
| **C-HOME-28b** | **Alcance legal: solo slide 04.** El OK del cliente cubre el contenido de `hero_5.jpg`; no modifica `QA-EXC-27-01` para 01–03 ni retira los claims bloqueantes de `hero_3` (`decisiones-comandante.md:158`). La publicación sigue condicionada a que `forge-sentinel` + contenido/legal cierren los slides 01–03. Se añade una nota de alcance junto al checklist histórico de `hero_4.png:159` sin borrarlo. |
| **C-HOME-28c** | **Tests.** Actualizar SHA-256 y rutas en `tests/unit/hero-slides.test.ts:30-35,61,83` y `tests/e2e/home-slide.spec.ts:56,73-77,783,802`; ramificar HOME-E2E-54 para cap 2880 / densidad 2,00 en slide 04; añadir HOME-E2E-56 de letterbox y estabilidad del rect. `BAND_CASES`, `assertSharpBand`, HOME-E2E-34/-42/-43/-44/-55 quedan intactos. Revisión visual obligatoria en preview a 375/768/1440. |
| **C-HOME-28d** | **Rollback y gobernanza.** Revertir es cambiar dos líneas del manifiesto y sus fixtures; los PNG/JPG aditivos pueden permanecer. `ADR-HOME-28-01`, la nueva §15 del DD-HOME-27 y esta sección son adiciones: no se reescriben C-HOME-27, §13, §14 ni `ADR-HOME-27-01`. Requiere LGTM nuevo de `forge-reviewer`; el LGTM v0.4 no cubre este asset. |
| **C-HOME-28e** | **Enmienda v0.6 del cliente (27-nov-2026, supersedida por C-HOME-28f).** Durante la implementación el cliente sustituyó `hero_5.jpg` (2880×900, SHA `37328e3d…`) por `hero-5.jpg` (2880×1000, 2,88:1, SHA `6898831f…`). Queda como registro cronológico en `ADR-HOME-28-01` §12. |
| **C-HOME-28f** | **Enmienda v0.7 del cliente — asset final en su momento, hoy supersedido por C-HOME-28h (27-nov-2026).** El cliente confirmó como imagen definitiva del slide 04 **`SOLO POR HOY (2880 x 1200 px).jpg`** (2880×1200, 2,4:1, 2.981.703 bytes, SHA-256 `d36949f11cd9a6e4f499edaf1d8f25e6fe705af82eeec9b981ea703541539b07`), copiado byte-for-byte a `public/slides/hero-5.jpg` y verificado en ambos. Se mantiene la decisión A: marco 1018/376 y `object-contain` intactos, `object-position: 50% 50%`, sin recorte. Al ser el bitmap más alto que el marco, el hueco pasa a ser **pillarbox horizontal** ≈21/43/82 px a 375/768/1440; los valores de C-HOME-28a y C-HOME-28e quedan **supersedidos** (`ADR-HOME-28-01` §13). HOME-E2E-56 mide la nueva geometría. Para rollback: `hero_4.png` está en raíz y en `public/slides/` (SHA `283bf014…`); `hero_5.jpg` de v0.5 ya no está en disco y el `hero-5.jpg` en raíz es 2880×1100, SHA `efbfd27f…`, distinto del de v0.6 (`6898831f…`), por lo que esos hashes históricos no son verificables hoy. **Sin autorización para commit, push ni deploy.** |

> **Nota de alcance C-HOME-28h (27-nov-2026, vigente; C-HOME-28f queda histórico).** El cliente pidió expresamente usar el **`hero-5.jpg` que aportó** (2880×1100, SHA `efbfd27f…`): ese es el asset cubierto por su visto bueno de contenido, únicamente en el **slide 04**. `forge-sentinel` reconfirmó el OK exclusivo para ese slide y ese asset. Los slides 01–03 siguen bloqueados por `QA-EXC-27-01` y los claims de `hero_3`; el acta de release debe citar `ADR-HOME-28-01` §13.

| **C-HOME-28g** | **QA-EXC-28-01 — estabilidad del smoke (27-nov-2026).** El asset de 2.981.703 bytes saturaba el optimizador de `next/image` con 4 workers y caché fría: `page.goto` y `decode()` agotaban el timeout de 60 s, aunque aislado el test pasaba en 1,6 s. Se adopta el dictamen de `forge-qualis`: plazo de 30 s en Node para `waitForImagesLoaded` y `globalSetup` que calienta las 32 variantes (4 assets × 8 anchos; hoy 40 con 5 assets según C-HOME-28i) antes de los workers. Sin cambios en la app ni reencodificación. `typecheck`, `lint`, 68/68 unitarios y **92/92 smoke con `retries: 0`** en `next dev` y en build de producción. |
| **C-HOME-28h** | **Enmienda v0.8 del cliente — asset final vigente (27-nov-2026).** El cliente pide expresamente usar el **`hero-5.jpg` que aportó en la raíz** (2880×1100, 2.776.232 bytes, SHA-256 `efbfd27f8c9dee42dab666fdd1148de3932e47a62c67f3e9efe22d1322fcb0ee`), copiado byte-for-byte a `public/slides/hero-5.jpg`. **Supersede C-HOME-28f/v0.7** (`SOLO POR HOY`, 2880×1200) en todo lo que contradiga; ese archivo queda como registro histórico. Se mantienen marco 1018/376, `object-contain`, `object-position: 50% 50%`, cuatro slides e id `slide-04`, sin recorte. Al ser 2880/1100 ≈2.618:1, el pillarbox horizontal se reduce a ≈6/12/24 px a 375/768/1440. HOME-E2E-54/56, fixtures y provenancia se actualizan al nuevo SHA y ratio. Sin autorización para commit, push ni deploy. |
| **C-HOME-28i** | **Enmienda v0.9 del cliente — quinto slide `hero-6.jpg` (27-nov-2026).** El cliente pidió «incluye otra imagen en el slider, se llama hero-6». Se añade `slide-05` con `/slides/hero-6.jpg` (3000×1100, 2.909.904 bytes, SHA-256 `651966eaded97050fb750e74f8eaf5303a373a506bfeb9d4e3ad46bc36ce6206`), copiado byte-for-byte a `public/slides/hero-6.jpg`. **No sustituye a `slide-04`**. El bitmap es 3000/1100 ≈2,727:1 frente al marco 1018/376 ≈2,707:1: diferencia de ≈1 px de banda vertical a 1440, sin recorte. `object-contain`, `object-position: 50% 50%`, `alt=""`, `aspect-ratio` y autoplay intactos. Manifiesto, allowlist, fixtures unitarias/E2E, etiquetas de paginación y `globalSetup` (40 variantes = 5 assets × 8 anchos) actualizados a cinco slides; HOME-E2E-56 sigue midiendo el slide 04. Gates: `typecheck`, `lint`, 69/69 unitarios y **92/92 smoke con caché fría** (`retries: 0`). ✅ `forge-sentinel` emitió **OK exclusivo para slide 05 / `hero-6.jpg`** (OCR: solo copy de producto, sin BellSk, PII ni secretos). Sin autorización para commit, push ni deploy. |

---

## 5. Estado de firmas

| Rol | Estado | Condición |
|---|---|---|
| `forge-reviewer` | ✅ **LGTM DD-HOME-23 y DD-HOME-24** (27 nov 2026) | DD-23: bloqueantes B1/B2 cerrados por C-HOME-03/C-HOME-05; 9 anchos verificados. DD-24: 8 checks sin bloqueantes, cero velo y autoplay intacto. El borrado de `vercel.json` sigue siendo cambio de configuración: requiere LGTM adicional si se reabre el PR |
| `forge-sentinel` | ✅ OK para DD-HOME-24 y para retirar `vercel.json` (27 nov 2026) | Sin PII/secretos; CSP report-only sin `report-uri` (C-HOME-01). Condición: verificar cabeceras en `/`, `/piel` y 404; el acta A2 queda pendiente |
| `forge-qualis` | ✅ **GO DD-HOME-24** (27 nov 2026) | Cobertura HOME-E2E-34/-35/-36/-40 y -41…-44 verificada; build/bundle y rollback documentados. Publicación C-HOME-08 requiere monitoreo inicial |
| `forge-infra` | ✅ Aprobado retirar `vercel.json` (27 nov 2026) | Vercel detecta Next.js sin archivo; `prisma generate` funciona sin `DATABASE_URL`; build/bundle locales verdes. ID anterior registrado en QR-22-01 |
| `apex-forge` (Comandante) | ✅ **Approved DD-HOME-24 + C-HOME-08** (27 nov 2026) | El cliente autorizó explícitamente commit, push y visibilidad pública. Falta el acta del drill para la go-live formal |
| **DD-HOME-27 — cierre 27 nov 2026** | ✅ `forge-reviewer` **LGTM v0.3 y LGTM v0.4**; ✅ `forge-qualis` **GO técnico condicionado** (`QA-EXC-27-01`, reconfirmada en v0.4); ✅ `forge-infra` **GO técnico condicionado**; ⛔ `forge-sentinel` **BLOQUEAR PUBLICACIÓN**; ⏸ `apex-forge` implementación v0.4 cerrada, release en espera | Lint/typecheck/68 unitarios/**110 E2E** (`retries: 0`)/build/bundle verdes (Home 110.851 B gzip / 150.000 B). El GO técnico **no sustituye** al visto bueno legal: sin licencia BellSk y claims resueltos no hay commit autorizado, merge, promoción de alias ni deploy |
| **DD-HOME-28 — implementado; release en espera** | ✅ Diseño aprobado por `apex-forge` (`ADR-HOME-28-01`) y enmienda v0.9 pedida por el cliente: cinco slides, `slide-04` con **`hero-5.jpg`** (2880×1100, SHA `efbfd27f…`) y `slide-05` con **`hero-6.jpg`** (3000×1100, SHA `651966ea…`); ✅ `forge-reviewer` **LGTM v0.8 (ronda 3)** y **LGTM v0.9 (ronda 2)**; ✅ `forge-sentinel` **OK reconfirmado con alcance exclusivo a slide 04 y al `hero-5.jpg` v0.8**, ✅ `forge-sentinel` **OK slide 05 / `hero-6.jpg`** (01–03 siguen bloqueados); ✅ `forge-qualis` dictamen `QA-EXC-28-01` aplicado; ⏸ GO de `forge-infra` y autorización de `apex-forge` para release | Sin commit, push ni deploy: el cliente no lo ha autorizado. Si rechaza los huecos laterales, se abre una decisión nueva (derivado 1018×376 o recorte autorizado). |
