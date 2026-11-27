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

---

## 5. Estado de firmas

| Rol | Estado | Condición |
|---|---|---|
| `forge-reviewer` | ✅ **LGTM DD-HOME-23 y DD-HOME-24** (27 nov 2026) | DD-23: bloqueantes B1/B2 cerrados por C-HOME-03/C-HOME-05; 9 anchos verificados. DD-24: 8 checks sin bloqueantes, cero velo y autoplay intacto. El borrado de `vercel.json` sigue siendo cambio de configuración: requiere LGTM adicional si se reabre el PR |
| `forge-sentinel` | ✅ OK para DD-HOME-24 y para retirar `vercel.json` (27 nov 2026) | Sin PII/secretos; CSP report-only sin `report-uri` (C-HOME-01). Condición: verificar cabeceras en `/`, `/piel` y 404; el acta A2 queda pendiente |
| `forge-qualis` | ✅ **GO DD-HOME-24** (27 nov 2026) | Cobertura HOME-E2E-34/-35/-36/-40 y -41…-44 verificada; build/bundle y rollback documentados. Publicación C-HOME-08 requiere monitoreo inicial |
| `forge-infra` | ✅ Aprobado retirar `vercel.json` (27 nov 2026) | Vercel detecta Next.js sin archivo; `prisma generate` funciona sin `DATABASE_URL`; build/bundle locales verdes. ID anterior registrado en QR-22-01 |
| `apex-forge` (Comandante) | ✅ **Approved DD-HOME-24 + C-HOME-08** (27 nov 2026) | El cliente autorizó explícitamente commit, push y visibilidad pública. Falta el acta del drill para la go-live formal |
