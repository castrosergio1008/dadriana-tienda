# Product Backlog inicial — Adriana Tienda

| Campo | Valor |
|---|---|
| **Proyecto** | Adriana Tienda — e-commerce colombiano de belleza, facial, cabello y cuerpo |
| **Autor** | `forge-qualis` (Quality & Reliability / SRE), con criterios de negocio del cliente |
| **Versión** | 1.1 — 23 de noviembre de 2026 (enmienda REQUEST CHANGES: C-01, C-02, C-03, C-05, C-11, C-12) |
| **Estado** | Backlog ordenado para el Sprint 0; sujeto a refinamiento semanal con el PO |
| **Product Goal** | Lanzar un canal propio de belleza en Colombia que supere la experiencia de referencia en móvil, con pago y factura confiables para dos sedes físicas **y venta presencial (POS) en el MVP** |
| **Convención** | Esfuerzo en puntos **Fibonacci estricta (1, 2, 3, 5, 8, 13); prohibidos 6 y 11 (C-11)**; MoSCoW = Must / Should / Could / Won't (MVP) |
| **Documentos relacionados** | [`metodologia-scrum.md`](./metodologia-scrum.md), [`plan-sprints.md`](./plan-sprints.md), [`definicion-terminado.md`](./definicion-terminado.md), [Design Doc canónico](../02-arquitectura/design-doc.md), [decisiones-comandante.md](../02-arquitectura/decisiones-comandante.md) |

> **Fuentes canónicas (C-07/C-12):** el Design Doc canónico es
> [`docs/02-arquitectura/design-doc.md`](../02-arquitectura/design-doc.md) (absorbe al antiguo
> `DESIGN_DOC.md` de la raíz). Ante cualquier conflicto manda la tabla de
> [decisiones del Comandante](../02-arquitectura/decisiones-comandante.md) (`C-01`…`C-12`) y,
> después, el Design Doc. Los identificadores técnicos de sede son `site_id` / `sites`;
> «sucursal» es solo la etiqueta de UI (C-01).

> **Regla de oro:** una historia sin criterios de aceptación **Given/When/Then**, sin estimación
> y sin dependencias identificadas **no es Ready** y no puede entrar al Sprint Backlog.

---

## 1. Vista panorámica (ordenada por valor de negocio)

### 1.1 Resumen por épica

| # | Épica | Historias | Puntos | Peso en el MVP |
|---:|---|---:|---:|---|
| 1 | Fundamentos y arquitectura | 4 | 24 | Base transaccional y desplegable |
| 2 | Identidad y diseño | 2 | 10 | Experiencia móvil diferencial |
| 3 | Catálogo | 6 | 57 | Descubrimiento, SEO y confianza (C-11: CAT-02 y CAT-04 → 13) |
| 4 | Carrito y checkout | 3 | 26 | Conversión (C-11: CHE-01 → 13) |
| 5 | Pagos | 4 | 31 | Ingreso y cumplimiento PCI |
| 6 | Pedidos y logística | 4 | 23 | Entrega y postventa |
| 7 | Sucursales, inventario y venta presencial | 5 | 35 | Lotes FEFO, recogida en tienda y POS (C-01, C-03) |
| 8 | Cuenta de cliente | 3 | 15 | Recurrencia y prueba social |
| 9 | Administración | 2 | 8 | Operación diaria |
| 10 | Seguridad y cumplimiento | 2 | 16 | Ley 1581, Ley 1480, DIAN, SAQ-A |
| 11 | Calidad y despliegue | 7 | 35 | Gates, release y rollback (C-11: QUA-04 → 5) |
| | **Total MVP (Sprints 0–8)** | **42** | **280** | +2 historias (INV-03, OPS-09), Fibonacci estricta |

### 1.2 Índice completo (ID, título, puntos, prioridad, sprint, dependencias)

| ID | Título | Pts | MoSCoW | Sprint | Dependencias |
|---|---|---:|---|---:|---|
| **FUN-01** | Descubrimiento, supuestos, ADRs y Design Doc aprobado | 3 | Must | S0 | — |
| **DIS-01** | Prototipo navegable y tokens de diseño | 5 | Must | S0 | FUN-01 |
| **QUA-01** | Estrategia de pruebas, gates de CI y datos base | 3 | Must | S0 | FUN-01 |
| **FUN-02** | Monorepo, CI, previews y observabilidad | 5 | Must | S1 | FUN-01, QUA-01 |
| **FUN-03** | Modelo de datos Prisma y migraciones versionadas | 8 | Must | S1 | FUN-02 |
| **FUN-04** | Dominio, puertos y outbox transaccional | 8 | Must | S1 | FUN-03 |
| **DIS-02** | Design system y componentes accesibles base | 5 | Must | S1 | DIS-01 |
| **CUE-01** | Registro/login (email + Google) y recuperación | 5 | Must | S1 | FUN-02 |
| **CAT-01** | Catálogo, admin CRUD, carga CSV y pipeline de imágenes | 13 | Must | S2 | FUN-03, DIS-02 |
| **CAT-02** | PLP con facetas, URLs limpias y SEO técnico | 13 | Must | S2 | CAT-01 |
| **CAT-03** | Home con datos reales y bloques editoriales | 5 | Should | S2 | CAT-01, DIS-02 |
| **SUC-01** | Dos sedes (`sites`): datos, horarios y reglas de asignación | 3 | Must | S2 | FUN-03 |
| **CAT-04** | PDP con variantes, galería, stock, ETA y disponibilidad | 13 | Must | S3 | CAT-01, SUC-01 |
| **CAT-05** | Búsqueda con autocompletado, sinónimos y fallback | 8 | Should | S3 | CAT-01 |
| **CAT-06** | Relacionados y reseñas en lectura | 5 | Should | S3 | CAT-04 |
| **INV-01** | Inventario multi-sede y reservas con TTL sobre lotes | 8 | Must | S3 | SUC-01, FUN-04 |
| **CAR-01** | Carrito persistente, quick-add y merge | 8 | Must | S4 | CAT-04 |
| **CHE-01** | Checkout una página, direcciones, envío y recogida en sede | 13 | Must | S4 | CAR-01, INV-01 |
| **PRO-01** | Cupones y promociones base | 5 | Should | S4 | FUN-04 |
| **CUE-02** | Cuenta: pedidos, direcciones y datos personales | 5 | Should | S4 | CUE-01 |
| **QUA-02** | Fixtures, suite unitaria e integración de dominio | 3 | Must | S4 | QUA-01, FUN-04 |
| **PAG-01** | Wompi (tarjeta, PSE, Nequi) con checkout hospedado | 8 | Must | S5 | CHE-01 |
| **INV-03** | Lotes, vencimientos y FEFO (aviso 90 días / bloqueo 15 días) | 8 | Must | S5 | INV-01, FUN-03 |
| **PAG-02** | Webhooks firmados, idempotencia, estados y confirmación | 13 | Must | S5 | PAG-01, INV-01, INV-03 |
| **PAG-03** | BNPL nativo, efectivo y contraentrega | 5 | Should | S5 | PAG-01 |
| **PED-01** | Estados, historial, retracto y tracking del pedido | 5 | Must | S5 | PAG-02 |
| **INV-02** | Administración de inventario, movimientos y alertas | 8 | Must | S6 | INV-01, INV-03 |
| **OPS-09** | Registro de venta presencial (POS) | 8 | Must | S6 | INV-01, INV-02, INV-03, SUC-01 |
| **PAG-04** | Conciliación, reembolsos y plan B ePayco | 5 | Should | S6 | PAG-02 |
| **PED-02** | Facturación electrónica DIAN y nota crédito | 8 | Must | S6 | PED-01 |
| **PED-03** | Guías, etiquetas y tracking con transportadora | 5 | Must | S6 | PED-01 |
| **CUE-03** | Reseñas verificadas y moderación | 5 | Should | S7 | PED-01 |
| **LEG-01** | Consentimiento granular, newsletter y Consent Mode v2 | 8 | Must | S7 | DIS-02 |
| **LEG-02** | Datos personales cifrados, derechos ARCO y páginas legales | 8 | Must | S7 | FUN-03, LEG-01 |
| **ADM-01** | Roles, permisos y auditoría administrativa | 5 | Must | S7 | CAT-01 |
| **ADM-02** | Administración de cupones y campañas | 3 | Should | S7 | PRO-01 |
| **PED-04** | Seguimiento público del pedido | 5 | Should | S7 | PED-01 |
| **QUA-03** | E2E Playwright: 21 escenarios críticos (incluye pedido POS) | 8 | Must | S8 | S4, S5, S6, S7 |
| **QUA-04** | Carga, Core Web Vitals, QA visual y accesibilidad | 5 | Must | S8 | QUA-03, DIS-02 |
| **SEG-01** | CSP, rate limiting, secretos y alcance SAQ-A | 5 | Must | S8 | FUN-02 |
| **SEG-02** | OWASP ZAP, dependencias y revisión de seguridad | 3 | Must | S8 | SEG-01 |
| **OPS-01** | Runbook, rollback probado, canary y go-live | 8 | Must | S8 | QUA-03, SEG-02 |

**Suma por sprint (coherente con [`plan-sprints.md`](./plan-sprints.md)):** S0 11 · S1 31 · S2 34 ·
S3 34 · S4 34 · S5 39 · S6 34 · S7 34 · S8 29 = **280 puntos**.

> **Orden de dependencias (C-01/C-03):** `SUC-01 → INV-01 (S3) → INV-03 (S5)` queda **antes** de
> `PAG-01/PAG-02 (S5)` para que la confirmación de pago descuente FEFO desde el primer cobro;
> `INV-02 → OPS-09 (S6)` cierra la operación presencial. **POS está dentro del MVP**, no en Fase 2
> (C-03). El pico de 39 puntos de S5 se compensa con S8 en 29; ver el plan de sprints.

### 1.3 Orden de valor de negocio (para el PO)

1. **No se puede vender sin confianza:** inventario con lotes FEFO, pagos, estados de pedido y factura DIAN.
2. **No se puede elegir sin descubrimiento:** catálogo, PLP con facetas por necesidad, PDP y búsqueda.
3. **No se puede convertir sin fricción baja:** carrito y checkout de una página en móvil.
4. **No se puede operar sin control:** admin, dos sedes (`sites`), venta POS, roles y auditoría.
5. **No se puede lanzar sin cumplimiento y calidad:** consentimiento, PII, seguridad, E2E (incluye POS) y rollback.

> Las historias de `Could` y `Won't` para MVP están listadas al final (§3) para que el PO tenga
> el panorama completo y pueda decidir qué entra en Fase 2.

---

## 2. Detalle de historias

### Épica 1 — Fundamentos y arquitectura (4 historias, 24 puntos)

#### FUN-01 — Descubrimiento, supuestos, ADRs y Design Doc aprobado

- **Como** equipo APEX FORGE, **quiero** validar los supuestos del negocio y dejar decisiones
  técnicas registradas, **para** no construir sobre incertidumbre ni repetir discusiones.
- **Criterios de aceptación:**
  - **Given** el Design Doc en estado *Draft*, **when** el Comandante y los revisores (`reviewer`,
    `sentinel`, `qualis`, `infra`) lo revisen, **then** queda en *Approved* con ADRs de stack,
    pagos, datos y rollback.
  - **Given** los supuestos S1–S10 del Design Doc, **when** se confirme cada uno con el cliente,
    **then** se registra respuesta, dueño e impacto si cambia.
  - **Given** los contratos de Wompi, DIAN y transportadora, **when** se inicie el S0, **then**
    existen cuentas sandbox y un cronograma de habilitación con fechas.
- **Estimación:** 3 puntos · **MoSCoW:** Must · **Sprint:** S0 · **Dependencias:** ninguna.
- **Notas de calidad:** salida verificable = Design Doc aprobado + ADRs + matriz de supuestos.

#### FUN-02 — Monorepo, CI, previews y observabilidad

- **Como** Development Team, **quiero** un repositorio con CI obligatoria, previews por PR y
  telemetría básica, **para** integrar cambios pequeños en trunk con seguridad.
- **Criterios de aceptación:**
  - **Given** un PR, **when** se abra, **then** el gate de CI ejecuta lint, typecheck estricto,
    unitarios, build y presupuesto de performance, y publica un preview deploy.
  - **Given** un merge a trunk, **when** termine el pipeline, **then** se despliega a staging en
    <10 min y el evento queda registrado con SHA y autor.
  - **Given** un error 5xx en staging, **when** ocurra, **then** aparece en Sentry con `requestId`,
    ruta, usuario anónimo y correlación con logs estructurados.
- **Estimación:** 5 puntos · **MoSCoW:** Must · **Sprint:** S1 · **Dependencias:** FUN-01, QUA-01.
- **Notas de calidad:** gate documentado en [`estrategia-pruebas.md`](./estrategia-pruebas.md);
  implementación por `forge-infra`.

#### FUN-03 — Modelo de datos Prisma y migraciones versionadas

- **Como** sistema, **quiero** un schema transaccional con importes `BIGINT` en centavos
  (`*_cents`, C-02), snapshots e idempotencia, **para** que precio, inventario y pedidos sean
  consistentes.
- **Criterios de aceptación:**
  - **Given** el schema, **when** se apliquen las migraciones en una BD limpia, **then** se crean
    sin errores y son reversibles (expand/contract, sin columnas destructivas en el mismo release).
  - **Given** un `order_item`, **when** cambie el precio del catálogo, **then** el snapshot de
    precio/nombre/imagen del pedido permanece inmutable.
  - **Given** `inventory_lots(lot_id, site_id)` como fuente de verdad (C-01), **when** se intente
    `reserved > on_hand`, **then** el `CHECK` de BD rechaza la transacción (no se permite stock
    negativo) y la proyección `inventory_by_site(variant_id, site_id)` no se actualiza.
  - **Given** todos los importes, **when** se persistan, **then** usan `*_cents` (`BIGINT`); el IVA
    del 19 % se registra como `1900 basis points` y nunca como `1900` en una tasa decimal (C-02).
  - **Given** un `idempotency_keys`, **when** se repita la misma clave con distinto payload,
    **then** se responde conflicto sin duplicar efectos.
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S1 · **Dependencias:** FUN-02.
- **Notas de calidad:** tests de integración contra Postgres real (Testcontainers) son obligatorios.

#### FUN-04 — Dominio, puertos y outbox transaccional

- **Como** arquitecto, **quiero** la lógica de negocio en `packages/core` detrás de puertos y con
  outbox, **para** cambiar de proveedor sin tocar checkout y no perder eventos.
- **Criterios de aceptación:**
  - **Given** un evento de dominio (pedido pagado), **when** se confirme la transacción, **then**
    el `outbox_event` queda persistido en la misma transacción.
  - **Given** un worker con `jobId = outbox.id`, **when** se reintente un job, **then** el evento
    se procesa una sola vez (idempotencia por ID).
  - **Given** el puerto de pagos, **when** se implemente un adaptador nuevo, **then** el dominio
    no requiere cambios (contrato verificado por test de contrato).
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S1 · **Dependencias:** FUN-03.
- **Notas de calidad:** cobertura ≥80% en `packages/core`.

---

### Épica 2 — Identidad y diseño (2 historias, 10 puntos)

#### DIS-01 — Prototipo navegable y tokens de diseño

- **Como** PO y equipo, **quiero** un prototipo navegable de Home, PLP, PDP y Checkout con tokens
  de marca, **para** validar la experiencia móvil antes de programarla.
- **Criterios de aceptación:**
  - **Given** el benchmark de la referencia, **when** se revise el prototipo, **then** incluye un
    solo CTA primario, quick-add, filtros por necesidad y transparencia de stock/entrega.
  - **Given** los tokens (color, tipografía, espaciado, radios, motion), **when** se apliquen en
    el prototipo, **then** el contraste cumple AA y las animaciones respetan `prefers-reduced-motion`.
  - **Given** el prototipo, **when** el PO lo apruebe, **then** queda congelado para S2 (cambios
    posteriores por change request).
- **Estimación:** 5 puntos · **MoSCoW:** Must · **Sprint:** S0 · **Dependencias:** FUN-01.

#### DIS-02 — Design system y componentes accesibles base

- **Como** `forge-frontend`, **quiero** componentes reutilizables con Radix + Tailwind v4,
  **para** que cada pantalla herede accesibilidad y consistencia.
- **Criterios de aceptación:**
  - **Given** los componentes (botón, input, drawer, modal, tabs, chips, skeleton, toast),
    **when** se prueben con teclado, **then** foco visible, `Esc` cierra capas y hay focus trap.
  - **Given** un cambio de estado (carrito, variante), **when** ocurra, **then** se anuncia por
    `aria-live="polite"` sin recargar.
  - **Given** `prefers-reduced-motion: reduce`, **when** se active, **then** no hay transiciones
    largas ni autoplay, y el layout no presenta CLS.
- **Estimación:** 5 puntos · **MoSCoW:** Must · **Sprint:** S1 · **Dependencias:** DIS-01.
- **Notas de calidad:** axe sin violaciones críticas en la librería de componentes.

---

### Épica 3 — Catálogo (6 historias, 53 puntos)

#### CAT-01 — Catálogo, admin CRUD, carga CSV y pipeline de imágenes

- **Como** operador de la tienda, **quiero** gestionar marcas, categorías (2 niveles), productos,
  variantes, atributos y media en el admin, **para** publicar 300–800 SKUs sin depender de código.
- **Criterios de aceptación:**
  - **Given** un archivo CSV de 800 SKUs, **when** se importe, **then** se valida y carga con
    reporte de errores por fila, sin duplicados por SKU.
  - **Given** una imagen original, **when** se suba, **then** se generan derivados AVIF/WebP con
    `sizes`/`srcset` y dimensiones explícitas (CLS 0).
  - **Given** un producto con registro INVIMA aplicable, **when** se publique, **then** el dato de
    registro aparece en la ficha.
  - **Given** una acción de edición en el admin, **when** ocurra, **then** se escribe `audit_log`
    con antes/después y actor.
- **Estimación:** 13 puntos · **MoSCoW:** Must · **Sprint:** S2 · **Dependencias:** FUN-03, DIS-02.
- **Notas de calidad:** historia grande: se descompone en tareas verificables en Planning; el
  equipo define el orden de entrega dentro del sprint.

#### CAT-02 — PLP con facetas, URLs limpias y SEO técnico

- **Como** cliente, **quiero** filtrar por marca, precio, necesidad, tipo de cabello, tono y
  disponibilidad, **para** encontrar el producto por mi problema en ≤3 interacciones.
- **Criterios de aceptación:**
  - **Given** una combinación de filtros, **when** se aplique, **then** la URL es limpia y
    compartible (segmentos, no query params de plataforma) y el resultado es correcto.
  - **Given** Meilisearch sin respuesta en 300 ms, **when** se consulte, **then** se usa fallback
    a Postgres FTS sin mostrar error al usuario.
  - **Given** una PLP publicada, **when** se inspeccione, **then** tiene canonical, breadcrumb,
    sitemap y JSON-LD `BreadcrumbList`; no genera páginas infinitas indexables.
  - **Given** móvil, **when** se abran los filtros, **then** son bottom-sheet con "Aplicar (N)"
    sticky y orden en select nativo.
- **Estimación:** 13 puntos (C-11: 11 → 13) · **MoSCoW:** Must · **Sprint:** S2 · **Dependencias:** CAT-01.

#### CAT-03 — Home con datos reales y bloques editoriales

- **Como** cliente, **quiero** una Home que me oriente en <5 segundos, **para** entrar a la
  categoría o producto correcto desde el móvil.
- **Criterios de aceptación:**
  - **Given** la Home, **when** se cargue en 4G simulada, **then** LCP <2,5 s y CLS <0,1, con
    una sola imagen `priority` (hero).
  - **Given** los bloques (marcas, compra por necesidad, más vendidos, banners, reseñas,
    newsletter), **when** se navegue con teclado, **then** carruseles usan scroll-snap sin autoplay
    y son accesibles.
  - **Given** un producto destacado, **when** se muestre, **then** precio con IVA y badge
    verificable (sin descuentos ficticios).
- **Estimación:** 5 puntos · **MoSCoW:** Should · **Sprint:** S2 · **Dependencias:** CAT-01, DIS-02.

#### CAT-04 — PDP con variantes, galería, stock, ETA y disponibilidad

- **Como** cliente, **quiero** ver precio real, stock por variante y fecha estimada de entrega,
  **para** decidir la compra sin salir de la página ni llamar a la tienda.
- **Criterios de aceptación:**
  - **Given** una variante, **when** se cambie, **then** actualizan precio, imagen, stock y URL
    (`?variant=`) sin recargar la página.
  - **Given** una variante agotada, **when** se intente agregar, **then** el CTA está deshabilitado
    y se ofrece "avísame"; **nunca** se agrega sin stock.
  - **Given** una sede seleccionada, **when** se consulte disponibilidad, **then** se muestra ETA
    por ciudad y opción de recogida en tienda.
  - **Given** la PDP, **when** se cargue en móvil, **then** hay un solo CTA "Agregar a la bolsa"
    sticky y LCP <2,5 s.
- **Estimación:** 13 puntos (C-11: 11 → 13) · **MoSCoW:** Must · **Sprint:** S3 · **Dependencias:** CAT-01, SUC-01.

#### CAT-05 — Búsqueda con autocompletado, sinónimos y fallback

- **Como** cliente, **quiero** buscar "shampoo" y encontrar "champú" aunque escriba mal, **para**
  no perder la intención de compra.
- **Criterios de aceptación:**
  - **Given** una consulta, **when** se escriba, **then** sugerencias aparecen con debounce de
    150 ms y navegación por flechas + Enter (`aria-activedescendant`).
  - **Given** 1–2 errores tipográficos o un sinónimo, **when** se busque, **then** se devuelven
    resultados relevantes (configuración de sinónimos en español).
  - **Given** una búsqueda sin resultados, **when** se muestre, **then** ofrece "Quizás quisiste
    decir…", categorías sugeridas y productos populares; nunca un vacío seco.
- **Estimación:** 8 puntos · **MoSCoW:** Should · **Sprint:** S3 · **Dependencias:** CAT-01.

#### CAT-06 — Relacionados y reseñas en lectura

- **Como** cliente, **quiero** ver reseñas verificadas y productos relacionados por necesidad,
  **para** ganar confianza y descubrir mi rutina.
- **Criterios de aceptación:**
  - **Given** una PDP, **when** se muestren relacionados, **then** provienen de la misma
    categoría/necesidad (sin descuento de bundle en MVP).
  - **Given** reseñas, **when** se listan, **then** incluyen rating, filtro por verificadas y
    fecha relativa; solo se marca "Compra verificada" si hay entrega confirmada.
  - **Given** un rating agregado, **when** cambie una reseña moderada, **then** el promedio se
    recalcula y el JSON-LD `Product` refleja el nuevo valor.
- **Estimación:** 5 puntos · **MoSCoW:** Should · **Sprint:** S3 · **Dependencias:** CAT-04.

---

### Épica 4 — Carrito y checkout (3 historias, 24 puntos)

#### CAR-01 — Carrito persistente, quick-add y merge

- **Como** comprador invitado o registrado, **quiero** agregar productos desde el listado y
  conservar la bolsa entre dispositivos, **para** no perder mi selección.
- **Criterios de aceptación:**
  - **Given** un invitado, **when** agregue un producto, **then** la bolsa persiste por cookie
    firmada y sobrevive al cierre del navegador.
  - **Given** un invitado con bolsa, **when** inicie sesión, **then** se fusiona con su bolsa
    registrada quedando la cantidad mayor, **nunca duplicando líneas**.
  - **Given** un quick-add desde PLP, **when** el producto tenga variantes, **then** se abre un
    selector de variante antes de agregar; sin variantes, agrega directamente.
  - **Given** un cambio de cantidad, **when** supere el stock disponible, **then** se clampa al
    stock y se anuncia por `aria-live`.
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S4 · **Dependencias:** CAT-04.

#### CHE-01 — Checkout una página, direcciones, envío y recogida en sede

- **Como** comprador, **quiero** completar contacto, entrega y pago en una sola página con
  resumen sticky, **para** pagar en <90 s en móvil.
- **Criterios de aceptación:**
  - **Given** el checkout, **when** se llene con datos guardados, **then** se completa en <90 s
    y la tasa de error de validación es <5% en pruebas con usuarios reales.
  - **Given** una dirección, **when** se elija departamento y ciudad, **then** los campos
    dependientes se cargan y el costo de envío + ETA se recalculan.
  - **Given** un pedido con dos sedes disponibles, **when** elija "Recoger en tienda", **then**
    se selecciona sede (Bogotá / Medellín — *confirmar con cliente*) y horario, sin costo de envío.
  - **Given** un error de validación, **when** ocurra, **then** se muestra inline, conserva los
    datos ya digitados y permite reintentar sin perder el estado.
  - **Given** doble clic en "Pagar", **when** ocurra, **then** el botón se bloquea y se envía
    `Idempotency-Key` obligatoria en `POST /api/v1/checkout`.
  - **Given** una sesión con 20 peticiones de checkout en 1 minuto, **when** se envíe la petición
    21, **then** se responde 429 con `Retry-After` y no se crea ningún pedido (C-05).
- **Estimación:** 13 puntos (C-11: 11 → 13) · **MoSCoW:** Must · **Sprint:** S4 · **Dependencias:** CAR-01, INV-01.

#### PRO-01 — Cupones y promociones base

- **Como** negocio, **quiero** aplicar 1 cupón y promociones automáticas no acumulables, **para**
  impulsar conversión sin riesgo de margen.
- **Criterios de aceptación:**
  - **Given** un cupón vigente, **when** se aplique en la bolsa, **then** el descuento aparece
    desglosado y el total con IVA se recalcula correctamente.
  - **Given** un cupón expirado, agotado o de mínimo no cumplido, **when** se use, **then** se
    rechaza con mensaje claro y no altera el total.
  - **Given** una promoción automática y un cupón, **when** se combinen, **then** se aplica solo
    la mejor de las dos (regla declarada), nunca ambas.
- **Estimación:** 5 puntos · **MoSCoW:** Should · **Sprint:** S4 · **Dependencias:** FUN-04.

---

### Épica 5 — Pagos (4 historias, 31 puntos)

#### PAG-01 — Wompi (tarjeta, PSE, Nequi) con checkout hospedado

- **Como** comprador, **quiero** pagar con los métodos habituales en Colombia, **para** completar
  la compra con confianza.
- **Criterios de aceptación:**
  - **Given** un pedido reservado, **when** elija tarjeta/PSE/Nequi, **then** se crea una intención
    en Wompi y se redirige a su checkout hospedado (SAQ-A: ningún PAN/CVV entra a nuestro DOM).
  - **Given** un rechazo del banco, **when** vuelva el usuario, **then** ve mensaje claro con
    opción de reintentar con otro método, sin perder la reserva dentro de los 30 min.
  - **Given** el adaptador de pagos, **when** se cambie a ePayco en configuración, **then** el
    dominio no cambia (test de contrato del puerto).
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S5 · **Dependencias:** CHE-01.

#### PAG-02 — Webhooks firmados, idempotencia, estados y confirmación

- **Como** sistema, **quiero** procesar webhooks de pago de forma segura e idempotente, **para**
  que un evento duplicado, tardío o fuera de orden nunca confirme dos veces ni retroceda un pedido.
- **Criterios de aceptación:**
  - **Given** un webhook con firma inválida o fuera de ventana temporal, **when** llegue, **then**
    se rechaza (401) y se registra el intento.
  - **Given** un `event_id` repetido, **when** llegue de nuevo, **then** se responde 200 sin
    reprocesar (unicidad `provider + event_id`).
  - **Given** un evento `APPROVED` tras la expiración de 30 min, **when** se procese, **then** el
    pedido pasa a `PENDING_PAYMENT con reviewRequired=true`; si no hay stock, se reembolsa automáticamente y se alerta
    a operación (nunca se confirma entrega sin stock).
  - **Given** un webhook `APPROVED` usual, **when** se procese, **then** el pedido pasa a `PAID`,
    se descuenta inventario **una sola vez**, se encola factura y se envía confirmación en <60 s.
  - **Given** un pago en `PAID`, **when** llegue un evento antiguo de `PENDING`, **then** se
    ignora y se registra como `IGNORED` (transiciones monotónicas).
- **Estimación:** 13 puntos · **MoSCoW:** Must · **Sprint:** S5 · **Dependencias:** PAG-01, INV-01, INV-03 (FEFO).
- **Nota C-01:** la confirmación de pago descuenta del lote FEFO vigente; sin INV-03 esta historia
  no está Ready.
- **Notas de calidad:** 100% de los flujos de pago cubiertos; `forge-sentinel` revisa HMAC y
  comparación de monto/moneda.

#### PAG-03 — BNPL nativo, efectivo y contraentrega

- **Como** comprador, **quiero** pagar en cuotas, en efectivo o contraentrega, **para** comprar
  aunque no use tarjeta.
- **Criterios de aceptación:**
  - **Given** un método BNPL nativo de Wompi, **when** se elija, **then** se muestran cuotas y
    condiciones antes de confirmar (Addi/Sistecrédito directos son Fase 2).
  - **Given** contraentrega, **when** el monto exceda el límite configurado o la zona no esté
    habilitada, **then** el método se oculta/ bloquea con explicación.
  - **Given** un primer pedido COD, **when** se confirme, **then** se valida teléfono por OTP y
    se aplica límite por cliente/mes y blocklist.
  - **Given** un pedido COD, **when** nazca, **then** queda `PENDING_PAYMENT` y pasa a `PAID` solo
    con confirmación de recaudo de la transportadora (webhook o conciliación).
- **Estimación:** 5 puntos · **MoSCoW:** Should · **Sprint:** S5 · **Dependencias:** PAG-01.

#### PAG-04 — Conciliación, reembolsos y plan B ePayco

- **Como** operador financiero, **quiero** conciliar diariamente los pagos y poder cambiar de
  pasarela, **para** detectar diferencias y no depender de un solo proveedor.
- **Criterios de aceptación:**
  - **Given** el reporte diario de Wompi, **when** se concilie, **then** se cruzan
    `provider_payment_id` y montos; las diferencias generan incidencia y alerta.
  - **Given** un reembolso total/parcial, **when** se solicite, **then** se llama a la API del
    proveedor, se escribe `PaymentTransaction`, se emite nota crédito y no se excede el monto pagado.
  - **Given** Wompi fuera de servicio, **when** se active el flag de plan B, **then** ePayco está
    disponible en staging sin cambiar checkout ni dominio.
  - **Given** un webhook perdido, **when** un pago lleve >5 min en `PENDING`, **then** el job de
    reconciliación consulta la API del proveedor cada 10 min y corrige el estado.
- **Estimación:** 5 puntos · **MoSCoW:** Should · **Sprint:** S6 · **Dependencias:** PAG-02.

---

### Épica 6 — Pedidos y logística (4 historias, 23 puntos)

#### PED-01 — Estados, historial, retracto y tracking del pedido

- **Como** comprador y operador, **quiero** estados claros e inmutables del pedido, **para**
  saber siempre en qué va y ejercer mi derecho de retracto.
- **Criterios de aceptación:**
  - **Given** una transición de estado, **when** ocurra, **then** se escribe `OrderStatusHistory`
    con actor, motivo y timestamp, y un `OutboxEvent`.
  - **Given** un pedido `PAID`, **when** se intente volver a `PENDING_PAYMENT`, **then** la
    transición se rechaza (estados monotónicos).
  - **Given** un pedido entregado, **when** se solicite retracto dentro de 5 días hábiles (Ley
    1480), **then** pasa a `RETURN_REQUESTED`, congela liquidación y abre caso operativo.
  - **Given** un pedido `OUT_FOR_DELIVERY`, **when** se intente cancelar, **then** se requiere aprobación
    manual y se registra el costo logístico.
- **Estimación:** 5 puntos · **MoSCoW:** Must · **Sprint:** S5 · **Dependencias:** PAG-02.

#### PED-02 — Facturación electrónica DIAN y nota crédito

- **Como** negocio, **quiero** emitir factura electrónica automática tras el pago, **para**
  cumplir con la DIAN sin trabajo manual.
- **Criterios de aceptación:**
  - **Given** un pedido pagado, **when** pase a `PAID`, **then** se envía la factura al proveedor
    tecnológico y se obtiene CUFE en <15 min (p95).
  - **Given** un fallo del proveedor, **when** ocurra, **then** hay reintento con backoff (≤3),
    alerta y modo contingencia documentado; **0 pedidos pagados sin factura** tras 24 h.
  - **Given** un reembolso, **when** se apruebe, **then** se emite nota crédito asociada a la
    factura original y queda descargable en la cuenta.
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S6 · **Dependencias:** PED-01.
- **Notas de calidad:** `forge-sentinel` revisa el contrato y el manejo de credenciales DIAN.

#### PED-03 — Guías, etiquetas y tracking con transportadora

- **Como** operador, **quiero** generar guías y etiquetas desde el admin, **para** despachar desde
  cualquiera de las dos sedes sin copiar datos a mano.
- **Criterios de aceptación:**
  - **Given** un pedido `PACKED`, **when** se genere la guía, **then** se obtiene número y etiqueta
    y el pedido pasa a `DELIVERED` solo con confirmación de recogida.
  - **Given** la sede de origen, **when** se cree la guía, **then** se usa su dirección y horario
    de corte configurados.
  - **Given** un webhook de novedad de la transportadora, **when** llegue, **then** actualiza el
    estado y notifica al cliente; un evento duplicado no genera mensajes duplicados.
- **Estimación:** 5 puntos · **MoSCoW:** Must · **Sprint:** S6 · **Dependencias:** PED-01.

#### PED-04 — Seguimiento público del pedido

- **Como** comprador sin cuenta, **quiero** seguir mi pedido con número + email, **para** no tener
  que registrarme para saber dónde está.
- **Criterios de aceptación:**
  - **Given** número de pedido y email correctos, **when** se consulten, **then** se muestra el
    timeline (Pagado → Preparando → En camino → Entregado) con transportadora y guía.
  - **Given** datos incorrectos o consultas repetidas, **when** se consulten, **then** se aplica
    rate limiting y no se filtran datos de otro pedido.
  - **Given** un pedido entregado, **when** se vea el timeline, **then** aparece el plazo de
    retracto y el canal de soporte (WhatsApp).
- **Estimación:** 5 puntos · **MoSCoW:** Should · **Sprint:** S7 · **Dependencias:** PED-01.
- **Nota de rebalanceo:** se mueve de S6 a S7 para absorber OPS-09 (POS) e INV-03 (FEFO) sin
  bajar la DoD; el plan de sprints recoge el nuevo cómputo (S6 34 pts).

---

### Épica 7 — Sucursales, inventario y venta presencial (5 historias, 35 puntos)

#### SUC-01 — Dos sedes: datos, horarios y reglas de asignación

- **Como** negocio con dos sucursales físicas, **quiero** modelar sedes con horarios, stock y
  reglas de asignación, **para** ofrecer recogida y asignar pedidos de forma predecible.
- **Criterios de aceptación:**
  - **Given** las dos sedes, **when** se consulten, **then** muestran dirección, horario, ciudad y
    indicador de recogida disponible (datos exactos a confirmar por el cliente).
  - **Given** un pedido con recogida, **when** se asigne, **then** se elige la sede con stock y
    se registra en el pedido; si ninguna tiene stock, se ofrece envío.
  - **Given** un cambio de horario de una sede, **when** se guarde, **then** la ETA mostrada en PDP
    se actualiza sin cambio de código.
- **Estimación:** 3 puntos · **MoSCoW:** Must · **Sprint:** S2 · **Dependencias:** FUN-03.

#### INV-01 — Inventario multi-sede y reservas con TTL

- **Como** sistema, **quiero** inventario por `(variant_id, site_id)` con reservas de 30 min y
  `UPDATE` atómico condicional sobre `inventory_lots`, **para** evitar sobreventa por concurrencia
  entre web y POS.
- **Criterios de aceptación:**
  - **Given** 2 usuarios (web y/o POS) comprando la última unidad, **when** ambos reserven,
    **then** solo uno logra la reserva (`UPDATE inventory_lots ... WHERE reserved ≤ on_hand`) y la
    proyección `inventory_by_site(variant_id, site_id)` se actualiza en la misma transacción.
  - **Given** una reserva de 30 min, **when** expire, **then** se libera y la orden pasa a
    `CANCELLED` sin factura.
  - **Given** un pago aprobado, **when** se confirme la reserva, **then** el stock se descuenta
    una sola vez y se escribe un movimiento de inventario.
  - **Given** un intento de `reserved > on_hand`, **when** se ejecute, **then** la BD lo rechaza
    por `CHECK` y se registra métrica de incidencia.
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S3 · **Dependencias:** SUC-01, FUN-04.
- **Notas de calidad:** prueba de concurrencia con Testcontainers es obligatoria (riesgo R5).

#### INV-02 — Administración de inventario, movimientos y alertas

- **Como** operador, **quiero** ajustar stock por sede, ver movimientos y recibir alertas de stock
  bajo, **para** operar las dos tiendas sin hojas de cálculo.
- **Criterios de aceptación:**
  - **Given** un ajuste manual, **when** se registre, **then** exige motivo y actor, y crea un
    `inventory_movement` auditable (nunca edición directa sin traza).
  - **Given** stock por debajo del umbral, **when** se detecte, **then** se muestra alerta en el
    dashboard y se envía notificación al operador.
  - **Given** el inventario de ambas sedes, **when** se consulte, **then** los totales coinciden
    con la suma de movimientos (conciliación automática en test).
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S6 · **Dependencias:** INV-01, INV-03.

#### INV-03 — Lotes, vencimientos y FEFO (aviso 90 días / bloqueo 15 días)

- **Como** operador y sistema, **quiero** gestionar `inventory_lots(lot_id, site_id)` con fecha de
  vencimiento y consumirlos **FEFO**, **para** no vender cosméticos próximos a vencer y cumplir la
  trazabilidad exigible (RF-078 a RF-081, C-01).
- **Criterios de aceptación:**
  - **Given** un lote `ACTIVE` con `expires_at` entre 15 y 90 días, **when** se consulte o reserve,
    **then** se emite **aviso a 90 días** al operador y se muestra etiqueta de vencimiento, sin
    bloquear la venta.
  - **Given** un lote con `expires_at` a **15 días o menos**, **when** se intente reservarlo desde
    web o POS, **then** se bloquea ese lote y se selecciona el siguiente válido por FEFO; si no
    existe, la variante se agota con mensaje claro. **No hay descuento automático en Fase 1.**
  - **Given** varios lotes vigentes, **when** se cree una reserva, **then** se descuenta primero el
    de menor `expires_at` (desempate `received_at ASC`) mediante `UPDATE` atómico sobre
    `inventory_lots` con `reserved ≤ on_hand`, actualizando la proyección por `site_id` en la
    misma transacción (misma regla para web y POS).
  - **Given** una recepción o ajuste manual, **when** se registre, **then** exige `lot_code`,
    `received_at` y `expires_at` (o declaración explícita de «sin vencimiento») y queda auditable
    en `inventory_movement`.
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S5 · **Dependencias:** INV-01, FUN-03.
- **Justificación del sprint (C-01):** se adelanta a S5, **antes que PAG-01/PAG-02**, porque la
  primera confirmación de pago ya debe descontar el lote FEFO correcto; de lo contrario PAG-02
  tendría que rehacerse en S6. Épica 7, no Fase 2.
- **Notas de calidad:** umbrales 90/15 días cerrados por el Comandante (antes DD-Q9/RM-Q9);
  vocabulario `site_id`/`sites`, sin `branch_id`; sin `1900` como tasa decimal.

#### OPS-09 — Registro de venta presencial (POS)

- **Como** vendedor en una de las dos sedes, **quiero** registrar una venta presencial desde la
  tablet del punto de pago, **para** que el stock, el historial del cliente y los impuestos sean
  los mismos que en la web (C-03: **permanece en el MVP**).
- **Criterios de aceptación:**
  - **Given** un cliente con o sin cuenta, **when** el vendedor registra la venta en la tablet POS,
    **then** se crea el pedido con `site_id` de origen y el mismo formato `AT-2026-000123`, sin
    duplicar cliente (unificación web/POS).
  - **Given** una variante con lotes vigentes, **when** se confirme la venta POS, **then** se
    descuenta FEFO con el mismo `UPDATE` atómico sobre `inventory_lots` que usa la web; un lote a
    ≤15 días queda excluido (INV-03).
  - **Given** una venta web y una POS simultáneas sobre la última unidad, **when** ambas se
    confirmen, **then** solo una se registra y la otra recibe «sin stock»: **0 sobreventas** (R5,
    escenario E2E-21).
  - **Given** el pago presencial (tarjeta/efectivo), **when** se cierre la venta, **then** el total
    se calcula en `BIGINT` centavos con IVA de `1900 basis points` y la fórmula canónica
    `base_cents = round_half_up(total_line_cents / 1.19)`,
    `iva_cents = total_line_cents - base_cents`, cuadrando por línea (C-02).
  - **Given** una venta POS cancelada o devuelta, **when** se revierta, **then** se libera el lote
    reservado, se escribe un movimiento auditado y queda traza del actor (`site_id` + vendedor).
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S6 ·
  **Dependencias:** INV-01, INV-02, INV-03, SUC-01 (historia de inventario multi-sede).
- **Notas de calidad:** gate de release = escenario E2E-21 (pedido POS) en verde; cobertura del
  100% de la regla FEFO concurrente web/POS; revisión de `forge-sentinel` por manejo de datos del
  cliente y del medio de pago.

---

### Épica 8 — Cuenta de cliente (3 historias, 15 puntos)

#### CUE-01 — Registro/login (email + Google) y recuperación

- **Como** comprador, **quiero** entrar con email o Google y recuperar mi clave, **para** volver
  a comprar rápido.
- **Criterios de aceptación:**
  - **Given** un registro nuevo, **when** se confirme el email, **then** se crea la cuenta con
    consentimiento de términos y versión registrada.
  - **Given** credenciales inválidas, **when** se acumulen 5 intentos en 15 min por **IP + cuenta**,
    **then** se responde 429 con backoff exponencial y CAPTCHA desde el quinto intento; no se
    revela si el email existe (C-05).
  - **Given** una solicitud de recuperación, **when** se envíe, **then** el token expira, es de un
    solo uso y no aparece en logs.
- **Estimación:** 5 puntos · **MoSCoW:** Must · **Sprint:** S1 · **Dependencias:** FUN-02.

#### CUE-02 — Cuenta: pedidos, direcciones y datos personales

- **Como** cliente registrado, **quiero** ver mis pedidos, gestionar direcciones y descargar mis
  datos, **para** tener control de mi información.
- **Criterios de aceptación:**
  - **Given** mi cuenta, **when** abra "Mis pedidos", **then** veo estado, factura, tracking y
    acción "volver a comprar" sin ver datos de otros usuarios (test de autorización).
  - **Given** una dirección, **when** se elimine, **then** no afecta el snapshot de un pedido
    histórico.
  - **Given** una solicitud de datos, **when** se haga, **then** se exportan en formato legible
    y la petición queda registrada.
- **Estimación:** 5 puntos · **MoSCoW:** Should · **Sprint:** S4 · **Dependencias:** CUE-01.

#### CUE-03 — Reseñas verificadas y moderación

- **Como** comprador, **quiero** dejar una reseña solo si compré, **para** que la comunidad confíe
  en lo que lee.
- **Criterios de aceptación:**
  - **Given** un pedido entregado, **when** se solicite reseña, **then** se permite una reseña por
    variante y se marca "Compra verificada".
  - **Given** un usuario sin compra, **when** intente reseñar, **then** se rechaza.
  - **Given** una reseña con lenguaje inapropiado, **when** se modere, **then** se oculta, se
    registra la acción y se recalcula el rating público.
  - **Given** reseñas con foto, **when** se evalúe el alcance, **then** se difieren a Fase 2 (MVP
    solo texto verificado).
- **Estimación:** 5 puntos · **MoSCoW:** Should · **Sprint:** S7 · **Dependencias:** PED-01.

---

### Épica 9 — Administración (2 historias, 8 puntos)

#### ADM-01 — Roles, permisos y auditoría administrativa

- **Como** dueño del negocio, **quiero** dar acceso por rol a mi equipo, **para** que nadie cambie
  precios, stock o pedidos sin traza.
- **Criterios de aceptación:**
  - **Given** un usuario con rol de soporte, **when** intente editar precios, **then** se deniega.
  - **Given** una acción administrativa, **when** ocurra, **then** se registra actor, antes/después,
    IP y timestamp en `audit_logs`.
  - **Given** un cambio de rol, **when** se otorgue, **then** requiere aprobación de `forge-sentinel`
    y se revisa en el gate de seguridad.
- **Estimación:** 5 puntos · **MoSCoW:** Must · **Sprint:** S7 · **Dependencias:** CAT-01.

#### ADM-02 — Administración de cupones y campañas

- **Como** negocio, **quiero** crear cupones y campañas desde el admin, **para** lanzar promociones
  sin pedirle código al equipo.
- **Criterios de aceptación:**
  - **Given** un cupón, **when** se cree, **then** se definen tipo, valor, vigencia, usos y
    monto mínimo con validación de margen.
  - **Given** un cupón activo, **when** se edite, **then** los pedidos ya pagados conservan el
    descuento original (snapshot inmutable).
  - **Given** una campaña, **when** se programe, **then** se activa/desactiva automáticamente y
    se refleja en el evento de analytics correspondiente.
- **Estimación:** 3 puntos · **MoSCoW:** Should · **Sprint:** S7 · **Dependencias:** PRO-01.

---

### Épica 10 — Seguridad y cumplimiento (2 historias, 16 puntos)

#### LEG-01 — Consentimiento granular, newsletter y Consent Mode v2

- **Como** visitante, **quiero** decidir qué datos comparto, **para** cumplir la Ley 1581 y que el
  negocio mida con datos confiables.
- **Criterios de aceptación:**
  - **Given** el banner de cookies, **when** se muestre, **then** permite aceptar/rechazar por
    categorías, es revocable y registra versión, fecha y canal (nada de "aceptar todo" forzado).
  - **Given** un rechazo de analytics, **when** se navegue, **then** GTM no dispara tags y GA4
    opera en modo consentimiento sin señales prohibidas.
  - **Given** el newsletter, **when** se suscriba, **then** hay doble opt-in, fecha de
    nacimiento opcional y registro de la versión del aviso aceptado.
  - **Given** un cambio de política, **when** se publique, **then** la nueva versión queda
    hashada y los consentimientos antiguos siguen auditables.
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S7 · **Dependencias:** DIS-02.
- **Notas de calidad:** revisión obligatoria de `forge-sentinel`.

#### LEG-02 — Datos personales cifrados, derechos ARCO y páginas legales

- **Como** titular de datos, **quiero** que mi información esté protegida y poder ejercer mis
  derechos, **para** cumplir Ley 1581 / Decreto 1377 y Ley 1480.
- **Criterios de aceptación:**
  - **Given** teléfono, documento y snapshots de despacho, **when** se almacenen, **then** van
    cifrados AES-256-GCM con claves en gestor y búsqueda por índice ciego.
  - **Given** una solicitud de acceso, rectificación o supresión, **when** se atienda, **then** se
    anonimiza conservando solo lo exigido por la retención fiscal (5 años).
  - **Given** las páginas legales (privacidad, términos, envíos, retracto, libro de reclamaciones),
    **when** se publiquen, **then** están versionadas con fecha y hash y son accesibles desde el footer.
  - **Given** un log o traza, **when** se inspeccione, **then** no contiene PII en claro ni tokens.
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S7 · **Dependencias:** FUN-03, LEG-01.

---

### Épica 11 — Calidad y despliegue (7 historias, 35 puntos)

#### QUA-01 — Estrategia de pruebas, gates de CI y datos base

- **Como** equipo, **quiero** una estrategia de pruebas por capas y gates documentados, **para**
  que la calidad sea una puerta automática y no una opinión.
- **Criterios de aceptación:**
  - **Given** la estrategia, **when** se revise, **then** define cobertura por capa, fixtures,
    ambientes, matriz riesgo↔prueba y responsables (ver [`estrategia-pruebas.md`](./estrategia-pruebas.md)).
  - **Given** un PR, **when** se abra, **then** el gate documentado exige lint, typecheck, unit,
    integración mínima, build y presupuesto de performance antes del LGTM.
  - **Given** un change de producción, **when** se proponga, **then** incluye o mantiene tests;
    sin tests no hay aprobación.
- **Estimación:** 3 puntos · **MoSCoW:** Must · **Sprint:** S0 · **Dependencias:** FUN-01.

#### QUA-02 — Fixtures, suite unitaria e integración de dominio

- **Como** ingeniero, **quiero** fixtures deterministas y tests de dominio/API, **para** detectar
  regressiones antes del merge.
- **Criterios de aceptación:**
  - **Given** el precio/cupón/impuesto, **when** se calcule, **then** hay tests unitarios de bordes
    en `BIGINT` centavos (0, 1 centavo, máximo, redondeo `round_half_up`), IVA a 1900 basis points,
    fórmula canónica por línea y cuadre con el total (**sin «COP entero»**, C-02).
  - **Given** la BD de test, **when** corra integración, **then** usa transacciones aisladas y
    datos sintéticos (nunca datos reales de clientes).
  - **Given** la cobertura, **when** se mida en CI, **then** `packages/core` ≥80% y global ≥70%
    sin descensos sin justificación.
- **Estimación:** 3 puntos · **MoSCoW:** Must · **Sprint:** S4 · **Dependencias:** QUA-01, FUN-04.

#### QUA-03 — E2E Playwright: 21 escenarios críticos (incluye POS)

- **Como** PO y Qualis, **quiero** 21 flujos E2E en navegador real (móvil + desktop), **para**
  demostrar que el viaje de compra funciona de punta a punta, **incluida la venta POS (C-03)**.
- **Criterios de aceptación:**
  - **Given** el listado de 21 escenarios, **when** se ejecuten en staging, **then** pasan en
    Chromium móvil (375 px), tablet POS y desktop; incluyen invitado/registrado, cupón, pago
    aprobado/rechazado/PSE mock, COD, reembolso, tracking, retracto y **pedido POS (E2E-21)**.
  - **Given** un flujo de pago, **when** se ejecute, **then** usa fixtures de webhooks (no
    llamadas reales) y verifica idempotencia.
  - **Given** un test E2E, **when** falle, **then** se bloquea el release y se etiqueta con
    severidad y dueño.
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S8 · **Dependencias:** S4, S5, S6, S7.

#### QUA-04 — Carga, Core Web Vitals, QA visual y accesibilidad

- **Como** usuario móvil, **quiero** una tienda rápida, estable y accesible, **para** comprar sin
  fricción y sin barreras.
- **Criterios de aceptación:**
  - **Given** Lighthouse CI en móvil, **when** se mida Home/PLP/PDP/Checkout, **then** LCP <2,5 s,
    INP <200 ms, CLS <0,1 y score ≥90; sin regresión >10% entre releases.
  - **Given** k6 con 200 rps sostenidos, **when** se corra contra staging, **then** p95 API <400 ms
    y tasa de error <0,1% sin degradación.
  - **Given** axe-core y revisión manual, **when** se auditen flujos críticos, **then** 0
    violaciones críticas/serias y navegación completa por teclado.
  - **Given** screenshots de referencia, **when** haya cambio visual, **then** el diseñador aprueba
    la diferencia (regresión visual).
- **Estimación:** 5 puntos (C-11: 6 → 5) · **MoSCoW:** Must · **Sprint:** S8 · **Dependencias:** QUA-03, DIS-02.

#### SEG-01 — CSP, rate limiting, secretos y alcance SAQ-A

- **Como** sistema, **quiero** defensas perimetrales y secretos fuera del repo, **para** reducir
  superficie de ataque y mantener SAQ-A en pagos.
- **Criterios de aceptación:**
  - **Given** una respuesta HTTP, **when** se inspeccione, **then** incluye CSP estricta, HSTS y
    cabeceras de seguridad; sin scripts de terceros antes del consentimiento.
  - **Given** endpoints públicos (tracking, búsqueda, webhooks), **when** se abusen, **then** hay
    rate limiting por IP/sesión y 429 con mensaje claro.
  - **Given** los límites únicos de C-05, **when** se prueben, **then** login = **5 intentos /
    15 min por IP + cuenta** (backoff + CAPTCHA desde el quinto) y checkout = **20 peticiones /
    min por sesión** con `Idempotency-Key` obligatoria; no coexisten otros valores.
  - **Given** secretos, **when** se roten, **then** se hace sin redeploy y ningún valor aparece en
    repo, logs o mensajes de error.
  - **Given** el formulario de tarjeta, **when** se revise, **then** vive en dominio del proveedor;
    no hay PAN/CVV en nuestro DOM (documentación SAQ-A / SAQ-A-EP firmada por el proveedor).
- **Estimación:** 5 puntos · **MoSCoW:** Must · **Sprint:** S8 · **Dependencias:** FUN-02.

#### SEG-02 — OWASP ZAP, dependencias y revisión de seguridad

- **Como** `forge-sentinel`, **quiero** un escaneo y revisión antes del lanzamiento, **para** no
  liberar vulnerabilidades conocidas.
- **Criterios de aceptación:**
  - **Given** `npm audit`/equivalente, **when** se ejecute, **then** 0 vulnerabilidades críticas;
    las altas tienen Plan de mitigación y fecha.
  - **Given** OWASP ZAP baseline contra staging, **when** se ejecute, **then** no hay hallazgos
    críticos; los medios están documentados y aceptados por `forge-sentinel`.
  - **Given** un cambio en auth/pagos/PII, **when** se revise, **then** hay visto bueno explícito
    de `forge-sentinel` en el PR.
- **Estimación:** 3 puntos · **MoSCoW:** Must · **Sprint:** S8 · **Dependencias:** SEG-01.

#### OPS-01 — Runbook, rollback probado, canary y go-live

- **Como** operador, **quiero** un runbook probado y un despliegue gradual, **para** lanzar sin
  temor y revertir en minutos si algo falla.
- **Criterios de aceptación:**
  - **Given** el runbook, **when** ocurra un incidente, **then** contiene pasos para pedidos,
    reembolsos, facturas, pasarela caída, stock y contacto de on-call.
  - **Given** un rollback, **when** se ejecute en staging, **then** se completa en <2 min
    (redeploy de versión anterior) y migraciones expand/contract permiten el código previo.
  - **Given** el go-live, **when** se active, **then** canary 5% (24 h) → 25% (24 h) → 100%,
    con feature flag `checkout_enabled` para apagar pagos sin redeploy y monitoreo reforzado 72 h.
  - **Given** un incidente Sev-1/Sev-2, **when** se cierre, **then** hay postmortem sin culpables
    en ≤72 h con acciones y dueños.
- **Estimación:** 8 puntos · **MoSCoW:** Must · **Sprint:** S8 · **Dependencias:** QUA-03, SEG-02.

---

## 3. Fuera del MVP (Won't en esta versión — candidatos a Fase 2/3)

Estas ideas se registran para que el PO tenga panorama completo. **No se comprometen en S0–S8** y
requieren un nuevo Design Doc o enmienda antes de entrar a un sprint.

| Idea | MoSCoW | Razón de exclusión | Fase sugerida |
|---|---|---|---|
| BNPL directo Addi / Sistecrédito | Won't (MVP) | Contrato, homologación y conciliación propios | Fase 2 |
| Bundles "comprados juntos" con descuento | Won't (MVP) | Riesgo de margen y modelo de bundle | Fase 2 |
| Reseñas con foto, votos y Q&A | Won't (MVP) | Moderación de imágenes y storage extra | Fase 2 |
| Programa de referidos y cupón bidireccional | Won't (MVP) | Requiere atribución y dashboard | Fase 2 |
| Automatizaciones WhatsApp (abandono, entrega) | Won't (MVP) | Plantillas aprobadas por Meta | Fase 2 |
| Blog con CMS headless y A/B testing | Won't (MVP) | MVP usa MDX versionado; experimentación después | Fase 2 |
| Dashboard Metabase y alertas de anomalías | Won't (MVP) | Se carga con export y alertas básicas | Fase 2 |
| PWA instalable y push web | Won't (MVP) | Fase 3; web móvil cubre el 95% del caso | Fase 3 |
| Personalización/ML y suscripciones | Won't (MVP) | Requiere volumen de datos propios | Fase 3 |
| Integración contable/ERP completa | Won't (MVP) | MVP: factura DIAN + export CSV | Fase 2 |

---

## 4. Notas de refinamiento para el PO

1. Las historias de **13 puntos** (CAT-01, CAT-02, CAT-04, CHE-01, PAG-02) se descomponen en
   tareas verificables dentro del sprint; si en Planning aparece incertidumbre alta, se dividen
   en dos historias de 5–8 puntos y se renegocia el alcance con el PO. Todo valor de la escala es
   Fibonacci estricta: no existen historias de 6 ni de 11 puntos (C-11).
2. Las dependencias externas (Wompi, DIAN, transportadora, contenido) son **riesgos** gestionados
   en [`matriz-riesgos.md`](./matriz-riesgos.md); su retraso mueve el lanzamiento, no la DoD.
3. El contenido (fotos, fichas, precios, stock inicial de las dos sedes) es responsabilidad del
   cliente y entra como entrada de CAT-01/SUC-01; sin él no se puede aceptar CAT-01.
4. Toda historia aceptada debe tener una señal medible (evento, log, alerta o dashboard) según
   [`metricas-exito.md`](./metricas-exito.md). Sin métrica y fuente, no se da por terminada.
