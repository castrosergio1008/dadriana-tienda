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

## 5. Estado de firmas

| Rol | Estado | Condición |
|---|---|---|
| `forge-reviewer` | REQUEST CHANGES → se solicitará re-review | B1–B3 corregidos y C-01…C-12 propagados |
| `forge-sentinel` | Pendiente | Debe emitir visto bueno explícito sobre C-01, C-02, C-04 y C-05 (datos, PII y auth) |
| `forge-qualis` | Pendiente | Firma al cerrar C-03 y C-11 en pruebas y plan de sprints |
| `forge-infra` | Pendiente | Firma al cerrar C-09 |
| `apex-forge` (Comandante) | ✅ **Approved** (24 nov 2026) | LGTM final 21/21 + firmas de diseño recibidas. Firma de go-live pendiente del Día D con evidencia en staging |
