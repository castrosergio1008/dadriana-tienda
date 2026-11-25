# Visto bueno de seguridad sobre el DISEÑO — Adriana_tienda

| Campo | Valor |
|---|---|
| Emitido por | `forge-sentinel` (Sentinel de APEX FORGE) |
| Fecha | **23 de noviembre de 2026** |
| Alcance | **Diseño/documentación** de `docs/06-seguridad/*`, enmendado según `docs/02-arquitectura/decisiones-comandante.md` (C-01…C-12) |
| Decisiones evaluadas | C-01 (lotes/FEFO), C-02 (centavos e IVA), C-04 (cookies/SameSite/MFA), C-05 (rate limits); confirmación SAQ-A y HMAC |
| **Veredicto** | **OK CONDICIONADO — seguro para avanzar el diseño; NO autoriza go-live** |
| Condición | Implementación **verificada en staging** de todos los requisitos BLOQUEANTES listados en §5, más LGTM de `forge-reviewer` sobre el código |

> **Este OK es de DISEÑO, no de código.** A la fecha de emisión **no existe código de producción**: no se revisó ningún PR, artefacto desplegado ni entorno. En consecuencia, **no constituye la aprobación de la fase 6 del pipeline** para ningún cambio concreto; esa aprobación se emitirá PR a PR con `checklist-review.md` una vez exista implementación.

---

## 1. Veredicto

**OK CONDICIONADO.** Las contradicciones de seguridad señaladas en `docs/08-review/lgtm-documentacion.md` (M1, m1, m8 y M2) quedan resueltas en `docs/06-seguridad/*` conforme a la tabla maestra del Comandante. El diseño es coherente, auditable y verificable.

La condición es explícita: **ningún requisito BLOQUEANTE se da por cumplido en este documento**. Todos los listados en §5 deben estar implementados y probados en **staging** antes de promover a producción, y cada PR sensible debe obtener además el LGTM de `forge-reviewer` y el registro de `forge-sentinel` en `checklist-review.md`.

---

## 2. Pronunciamiento por decisión

### C-01 — Inventario por lotes, FEFO y trazabilidad — **OK, con observación**

- Aceptado: la fuente de verdad es `inventory_lots(lot_id, site_id)` con FEFO; `inventory_by_site(variant_id, site_id)` queda como proyección derivada actualizada en la misma transacción; anti-sobreventa mediante `UPDATE` atómico condicional (`reserved ≤ on_hand`).
- Vocabulario `site_id` / `sites` adoptado en todos los artefactos de seguridad; `branch_id`, `branches` y `sucursal_id` aparecen **solo** en la cláusula de prohibición (`requisitos-seguridad.md:304`), no como identificadores vivos.
- Se añadió **SEC-031** como requisito BLOQUEANTE de auditoría de movimientos de lotes (`requisitos-seguridad.md:320-326`), con `inventory_movements` append-only y traza lote → pedido → cliente; se reflejó en el modelo de amenazas (A6, §3.7, R12) y en la checklist (L6).
- **Observación:** verificar en staging los permisos de BD que hacen `inventory_movements` append-only y la prueba de concurrencia sobre un mismo lote. Los umbrales FEFO aprobados (aviso 90 días / bloqueo 15 días, sin descuento automático) quedan registrados; **sin esto no hay trazabilidad cosmética posible**.

### C-02 — BIGINT en centavos e IVA 1900 bp — **OK, con observación**

- Aceptado: todos los importes `*_cents` (BIGINT), IVA 19 % como `1900` basis points, prohibido `1900` como `rate` decimal. Fórmula canónica y ejemplo numérico en `pagos-y-pci.md:140-150`; validación de frontera en `requisitos-seguridad.md:93`; checklist V3/V14.
- **Observación:** la verificación debe incluir el redondeo `round_half_up` **por línea** y que la suma de `baseCents + ivaCents` cuadre con el total; un error aquí es un finding de integridad monetaria. La tabla de comisión de pasarela se mantiene **sin IVA** (C-09), sin `× 1,19`.

### C-04 — Cookies, SameSite y MFA — **OK, con observación**

- Aceptado: access y refresh en cookies `httpOnly`/`Secure` en storefront y panel admin; sin access token legible desde JavaScript; `Authorization: Bearer` exclusivamente servidor-a-servidor (`requisitos-seguridad.md:52`, `:237`).
- Aceptado: `SameSite=Strict` por defecto, con **única excepción documentada** de `SameSite=Lax` en la cookie de sesión de checkout para el retorno desde Wompi (`SEC-010`, `SEC-023`, `modelo-amenazas.md:97`, checklist A9).
- Aceptado y sin ambigüedad: **MFA en MVP para Admin y Superadmin**; **Vendedores con sesión de tablet de 8 h sin MFA, MFA diferida a Fase 2** (`SEC-003`, `SEC-004`, RBAC, `modelo-amenazas.md:167,174`, checklist A4). Ya no aparece «MFA obligatorio para Vendedor» en el texto vigente.
- **Observación / riesgo registrado:** la MFA del Vendedor diferida a Fase 2 es un **riesgo aceptado para el MVP**, compensado por sesión de tablet de 8 h, reautenticación para acciones sensibles y auditoría inmutable. Debe comunicarse al cliente y quedar documentado como decisión C-04, no como olvido. Verificar en staging con DevTools que no existe `Bearer` accesible desde JS y que la excepción `Lax` no se filtra a otras cookies.

### C-05 — Rate limits — **OK, con observación de propagación**

- Unificados en `SEC-011`: **login 5 intentos / 15 min por IP+cuenta** con backoff exponencial y **CAPTCHA tras el quinto intento**; **checkout 20 peticiones / min por sesión** con `Idempotency-Key` obligatoria. No queda ningún otro valor para esos dos flujos en `docs/06-seguridad/*`; reflejado en modelo de amenazas, checklist V9 y `plan-seguridad.md:105`.
- **Observación:** la tabla maestra exige propagar los mismos valores a `api-rest.md`, RNF-016 y ADR-005, que están **fuera de mi alcance de edición**. Este OK asume esa propagación; si aparece `10/min`, `30 req/min` u otro valor en esos artefactos, el diseño vuelve a estar en contradicción y retiro el visto bueno.

---

## 3. Confirmación SAQ-A y HMAC de webhooks

**Sigue vigente, sin cambios de alcance.**

- **SAQ-A:** se mantiene el checkout-hosted/redirect a Wompi (plan B ePayco, mismo patrón). PAN, CVV, banda magnética y PIN **nunca** llegan a nuestro servidor, logs ni BD; solo se aceptan referencia, `amountCents`, estado y últimos 4. Cualquier cambio a widget embebido o formulario propio eleva el alcance a SAQ-A-EP/SAQ-D y **detiene el lanzamiento** (`pagos-y-pci.md:12,41-50`). La decisión C-02 (centavos) no altera este alcance: la pasarela recibe `minor units`, que es exactamente nuestro `*_cents`.
- **HMAC de webhooks:** se mantienen todos los controles de `pagos-y-pci.md §4` y SEC-025: HMAC-SHA256 sobre **raw body**, `timingSafeEqual` (prohibido `===`), secreto por entorno (`<VALUE>`), tolerancia de **5 min**, `unique(provider, event_id)`, comparación de `amountCents`/moneda y transiciones válidas, `401` si firma inválida y redacción de la firma en logs. R1 sigue marcado como **BLOQUEANTE**. El único cambio en ese documento es terminológico (monto → `amountCents`) y de endpoint canónico (`POST /api/v1/checkout`, C-06); **no se ha debilitado ningún control**.

---

## 4. Secretos y marcadores

- Revisados los 7 documentos preexistentes de `docs/06-seguridad/*`: **no hay secretos reales**. Todas las credenciales, tokens y llaves aparecen como `<VALUE>` o `<DOMINIO>` (`requisitos-seguridad.md §2.3`, plantillas de comunicación y registro). No se introdujo ningún valor real en la enmienda.
- Todos los marcadores **BLOQUEANTE** se conservan y se añade uno nuevo (SEC-031). Las tablas de verificación de `plan-seguridad.md`, `checklist-review.md` y `cumplimiento-colombia.md` siguen con sus bloqueantes marcados; las excepciones (backups, canal `security@`, simulacro) mantienen su plazo de 30/60 días.

---

## 5. Requisitos BLOQUEANTES a verificar en STAGING antes del go-live

| # | Requisito | Evidencia exigida en staging | Ref. |
|---|---|---|---|
| 1 | SEC-001/002/006 — hashes Argon2id/bcrypt ≥12, propiedad del recurso por `siteId`, validación Zod `.strict()` | Tests negativos con dos usuarios y dos `sites` | `requisitos-seguridad.md:35-48,88-98` |
| 2 | **SEC-003/023** — cookies `httpOnly` de access/refresh, sin `Bearer` en JS, `SameSite=Strict` + excepción `Lax` solo en retorno Wompi | Inspección `Set-Cookie` y consola del navegador en storefront, admin y callback | `:50-58,227-240` |
| 3 | **SEC-003/004** — MFA Admin/Superadmin en MVP; sesión de tablet de 8 h para Vendedores | Test de acceso sin MFA al admin (debe fallar) y de tablet de 8 h (debe funcionar) | `:50-65` |
| 4 | SEC-005 — RBAC server-side de 4 roles con alcance por `siteId` | Matriz de tests negativos 403 reales, no UI oculta | `:67-88` |
| 5 | **SEC-011** — login 5/15 min IP+cuenta + backoff + CAPTCHA; checkout 20 req/min + `Idempotency-Key` | Script de 10 logins fallidos y de 21 peticiones de checkout | `:152-170` |
| 6 | **SEC-020/031** — `inventory_lots(lot_id, site_id)`, FEFO, `inventory_movements` append-only y traza lote → pedido | Test de concurrencia, consulta de trazabilidad, intento de UPDATE/DELETE desde la app (debe fallar) | `:302-326` |
| 7 | **SEC-025** — HMAC SHA-256 raw body, `timingSafeEqual`, 5 min, `unique(provider,event_id)`, `amountCents`/moneda | Webhook con firma inválida → 401; duplicado → 200 sin efectos | `:265-273`, `pagos-y-pci.md:79-96` |
| 8 | SEC-012/013/015/016/017/018/021/022 — PII cifrada, TLS/HSTS, secretos en gestor, DTO mínimos, auditoría append-only, logs redactados, headers y CSP | `curl -I`, escaneo TLS, revisión de grants, grep de secretos, payloads de prueba | `requisitos-seguridad.md:113-225,275-288` |
| 9 | SEC-024/029/030 — SCA sin critical/high, consentimiento sin premarcar y analítica bloqueada, separación de entornos sin PII real | Pipeline en verde, red sin píxeles antes de consentir, revisión de entornos | `:235-258,301-319` |
| 10 | SAQ-A — cero PAN/CVV en servidor, logs, BD o bundle | Revisión del bundle y de logs de checkout/pago | `pagos-y-pci.md:41-67` |
| 11 | R1–R6, R8 y R12 mitigados; SEC-019 (PITR 7 días + dump 30 días) y restore probado | Bitácora de restore y matriz de riesgo en verde | `modelo-amenazas.md:213-229`, `requisitos-seguridad.md:290-294` |

> Cualquier estado ☐ de esta tabla al momento del despliegue = **Request changes**, no go-live. El Comandante puede arbitrar un riesgo residual, pero la alerta queda registrada con fecha de vencimiento.

---

## 6. Condiciones que el Comandante debe comunicar

1. **Al cliente:** la MFA del Vendedor se difiere a Fase 2 (C-04); en el MVP se compensa con sesión de tablet de 8 h, reautenticación para acciones sensibles y auditoría. Es una decisión aceptada, no un pendiente oculto.
2. **A `forge-architect` / `forge-backend`:** este OK cubre solo `docs/06-seguridad/*`. Deben confirmar que `api-rest.md`, `ADR-005`, RNF-016 y el Design Doc ya usan cookies `httpOnly`, la excepción `Lax`, MFA Admin/Superadmin y los valores 5/15 min y 20 req/min. Sin esa propagación, el visto bueno queda condicionado.
3. **A `forge-reviewer` / `forge-qualis`:** la aprobación de fase 6 se emitirá PR a PR con `checklist-review.md`; los tests negativos de authz, IDOR, webhook, FEFO y validación son requisito de ese registro.
4. **Algunos plazos siguen fuera del MVP:** canal `security@` y página `/seguridad` (30 días), simulacro SEV1 (60 días), conciliación y evidencia de chargeback (30 días). No son bloqueantes de este OK de diseño.

---

## 7. Límite de la firma

Este documento **no aprueba código, despliegue ni go-live**. Aprueba únicamente que el diseño de seguridad es consistente con las decisiones C-01, C-02, C-04 y C-05 y con el estándar OWASP ASVS 4.0 L2 / Top 10 2021. La aprobación efectiva de seguridad se produce cuando se completen la §5 en staging y el registro de `checklist-review.md` por PR.

| Rol | Resultado |
|---|---|
| `forge-sentinel` | **OK CONDICIONADO (diseño)** — 23 de noviembre de 2026 |
| `forge-reviewer` | Pendiente — LGTM de código cuando exista |
| `apex-forge` (Comandante) | Firma el go-live tras LGTM + verificación en staging |
