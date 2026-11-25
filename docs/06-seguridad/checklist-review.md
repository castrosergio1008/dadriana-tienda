# Checklist de Revisión de Seguridad por PR — Adriana_tienda

| Campo | Valor |
|---|---|
| Aplicado por | `forge-sentinel` (gatekeeper de seguridad) |
| Cuándo | Todo PR que toque datos personales, auth, privilegios, secretos, pagos, endpoints, entrada de usuario, dependencias o infra |
| Salida | **OK** (seguro para liberar) o **Request changes** con findings priorizados |
| Referencias | `requisitos-seguridad.md` (SEC-0xx), `modelo-amenazas.md`, `cumplimiento-colombia.md`, `pagos-y-pci.md` |
| Fuente de decisiones | `docs/02-arquitectura/decisiones-comandante.md` (C-01…C-12) — manda en caso de conflicto |

> **BLOQUEANTE:** Sin el OK registrado de `forge-sentinel`, un cambio sensible **no se libera**. El Comandante puede arbitrar, pero la alerta queda documentada. Nadie aprueba su propio cambio.

---

## 1. Cómo usar esta checklist

1. `forge-reviewer` da LGTM de código primero; `forge-sentinel` revisa seguridad después.
2. Marcar cada ítem: ✅ conforme, ❌ fallo, **N/A** con justificación.
3. Los ítems **BLOQUEANTE** fallidos detienen el merge, sin importar el resto.
4. Emitir veredicto con findings en formato: `Severidad — file:line — riesgo — corrección`.
5. Si el cambio es trivial (typo, color) y no toca datos/auth/infra, basta el LGTM de `forge-reviewer`.

---

## 2. Checklist por categoría

### 2.1 Datos y exposición

| # | Pregunta de revisión | Req. | Bloqueante |
|---|---|---|---|
| D1 | ¿El cambio recoge nuevos campos de cliente? ¿Están documentados finalidad, base y retención? | SEC-009, SEC-029 | Sí |
| D2 | ¿Las respuestas JSON usan DTO/`select` explícito y nunca devuelven `passwordHash`, `tokenHash`, documento, teléfono completo ni IDs internos? | SEC-016 | Sí |
| D3 | ¿Los correos y notificaciones se generan desde la orden/sesión autenticada y no desde parámetros como `?email=`? | SEC-009 | Sí |
| D4 | ¿Se respeta la propiedad del recurso (`userId`, `cartToken`, `siteId`) en **toda** consulta por id? | SEC-002, SEC-031 | Sí |
| D5 | ¿Se cifran los campos sensibles (teléfono/documento) y se usan hashes ciegos para búsqueda? | SEC-012 | Sí |
| D6 | ¿Hay datos reales de clientes en fixtures, screenshots, staging o demo? | SEC-030 | Sí |
| D7 | ¿La eliminación/anonimización respeta retención fiscal y registra auditoría? | SEC-017, cumplimiento | No |

### 2.2 Autenticación y sesiones

| # | Pregunta | Req. | Bloqueante |
|---|---|---|---|
| A1 | ¿El JWT verifica firma, `exp`, `iss`, `aud` y rechaza `alg=none`? ¿Vigencia ≤ 15 min? | SEC-003 | Sí |
| A2 | ¿El refresh se rota en cada uso, guarda solo `tokenHash` y revoca la familia ante reutilización? | SEC-003 | Sí |
| A3 | ¿Las sesiones se revocan en logout, cambio de contraseña y cambio de rol? | SEC-004 | Sí |
| A4 | ¿Admin y Superadmin exigen MFA en MVP y reautenticación para acciones sensibles? ¿El Vendedor usa sesión de tablet de 8 h sin MFA (diferida a Fase 2, C-04)? | SEC-003, SEC-004, SEC-005 | Sí |
| A5 | ¿Los mensajes de login/registro/reset son uniformes (sin enumeración)? | SEC-003, SEC-007 | Sí |
| A6 | ¿Los hashes de contraseña usan Argon2id / bcrypt cost ≥ 12? | SEC-001 | Sí |
| A7 | ¿Cookies con `HttpOnly`, `Secure`, `SameSite` y prefijo `__Host-` donde aplique? | SEC-023 | Sí |
| A8 | ¿Access y refresh viajan en cookies `httpOnly` en storefront y panel admin, sin `Bearer` legible por JS (`Bearer` solo server-to-server)? | SEC-003, SEC-023 | Sí |
| A9 | ¿`SameSite=Strict` salvo la excepción documentada de la cookie de sesión de checkout en `Lax` para el retorno de Wompi (C-04/m1)? | SEC-010, SEC-023 | Sí |

### 2.3 Privilegios (autorización)

| # | Pregunta | Req. | Bloqueante |
|---|---|---|---|
| P1 | ¿La autorización está en servidor (middleware/Route Handler/Server Action) y no solo en la UI? | SEC-005 | Sí |
| P2 | ¿Existen tests negativos por rol: Cliente, Vendedor, Admin, Superadmin? | SEC-005 | Sí |
| P3 | ¿El scope por `siteId` se deriva de la sesión y no del body/query? | SEC-005, SEC-020, SEC-031 | Sí |
| P4 | ¿Los campos de control (`role`, `status`, `price`, `siteId`) no se aceptan desde el cliente? | SEC-006, SEC-020 | Sí |
| P5 | ¿Las acciones sensibles (reembolsos, roles, exportes) tienen permiso explícito, umbral y auditoría? | SEC-005, SEC-026 | Sí |
| P6 | ¿Los permisos de BD del nuevo código son mínimos (sin DDL ni DELETE en `audit_logs`)? | SEC-002, SEC-017 | Sí |

### 2.4 Secretos y configuración

| # | Pregunta | Req. | Bloqueante |
|---|---|---|---|
| S1 | ¿Ningún secreto real aparece en código, tests, logs, frontend o documentación? (Solo `<VALUE>`) | SEC-015 | Sí |
| S2 | ¿Las variables nuevas están documentadas en `.env.example` con placeholder y en el gestor de secretos? | SEC-015 | Sí |
| S3 | ¿No se usa `NEXT_PUBLIC_*` para nada sensible? | SEC-015 | Sí |
| S4 | ¿Staging y producción no comparten secretos ni BD; no hay restore de PII real a staging? | SEC-030 | Sí |
| S5 | ¿El escaneo de secretos (gitleaks/trufflehog) pasa en CI? | SEC-015 | Sí |
| S6 | ¿Se rotaron los secretos expuestos si hubo incidente o salida de personal? | SEC-015 | Sí |

### 2.5 Dependencias

| # | Pregunta | Req. | Bloqueante |
|---|---|---|---|
| DEP1 | ¿`pnpm audit` / SCA sin critical/high sin excepción firmada y vencida? | SEC-024 | Sí |
| DEP2 | ¿La nueva dependencia tiene maintainer activo, licencia compatible y lockfile actualizado? | SEC-024 | Sí |
| DEP3 | ¿SAST (Semgrep) sin hallazgos de seguridad sin tratar? | SEC-024 | Sí |
| DEP4 | ¿Las excepciones tienen dueño, justificación y fecha de expiración? | SEC-024 | Sí |

### 2.6 Validación, inyección y pagos

| # | Pregunta | Req. | Bloqueante |
|---|---|---|---|
| V1 | ¿Todo body/query/params/cookie se valida con Zod `.strict()` (allowlist, longitudes, rangos)? | SEC-006 | Sí |
| V2 | ¿Prisma parametrizado? ¿Sin concatenación de entrada en `$queryRaw`/`$executeRaw` y sin `update` con `req.body`? | SEC-006 | Sí |
| V3 | ¿Los precios, descuentos y totales se recalculan en servidor en **centavos BIGINT** (`*_cents`) con IVA `1900` bp, y nunca se confían al cliente (C-02)? | SEC-006 | Sí |
| V4 | ¿React escapa el contenido? ¿Sin `dangerouslySetInnerHTML` sin sanitizar y sin URLs `javascript:`? | SEC-008 | Sí |
| V5 | ¿Mutaciones protegidas con CSRF (`SameSite` + token + `Origin`)? | SEC-010 | Sí |
| V6 | ¿Redirects y URLs salientes validados contra allowlist (sin SSRF ni open redirect)? | SEC-014 | Sí |
| V7 | ¿Subida de imágenes valida magic bytes, tamaño, dimensiones y guarda en R2 sin ejecución y sin SVG sin sanitizar? | SEC-028 | Sí |
| V8 | ¿Errores públicos genéricos con `requestId` y sin stack/SQL/rutas? | SEC-007 | Sí |
| V9 | ¿Login a **5 intentos/15 min por IP+cuenta** con backoff y CAPTCHA, y checkout a **20 req/min por sesión** con `Idempotency-Key` (C-05)? ¿El endpoint nuevo respeta SEC-011? | SEC-011 | Sí |
| V10 | ¿Checkout sigue en modo redirect/hosted y no aparece PAN/CVV en código, logs ni BD? | SEC-025, PCI | Sí |
| V11 | ¿Webhook verifica HMAC sobre body crudo, timestamp, `event_id`, monto y moneda? | SEC-025 | Sí |
| V12 | ¿`Idempotency-Key` presente en `POST /api/v1/checkout`, pagos y reembolsos; doble clic bloqueado (C-06)? | SEC-025 | Sí |
| V13 | ¿Reembolsos con permiso por umbral, MFA (Admin/Superadmin), idempotencia y auditoría? | SEC-026 | Sí |
| V14 | ¿Los importes usan BIGINT centavos (`*_cents`) y el IVA se expresa como `1900` basis points, sin `1900` como `rate` decimal (C-02)? | SEC-006, SEC-025 | Sí |

### 2.7 Logging y auditoría

| # | Pregunta | Req. | Bloqueante |
|---|---|---|---|
| L1 | ¿Toda acción administrativa escribe `audit_logs` con actor, acción, entidad, before/after, IP y timestamp? | SEC-017 | Sí |
| L2 | ¿Los logs redactan contraseñas, tokens, cookies, PII, firma de webhook y datos de tarjeta? | SEC-018 | Sí |
| L3 | ¿`audit_logs` y `webhook_events` son append-only (sin UPDATE/DELETE desde la app)? | SEC-017 | Sí |
| L4 | ¿Cada respuesta incluye `requestId` correlacionable con el log? | SEC-018 | No |
| L5 | ¿Las alertas de seguridad (login fallido, reembolso, cambio de rol) están configuradas? | SEC-017, incidentes | No |
| L6 | ¿Toda mutación de `inventory_lots` registra `inventory_movements` inmutable con `lotId`/`siteId`/`expirationDate` y permite reconstruir lote → pedido (C-01)? | SEC-031 | Sí |

### 2.8 Privacidad y cumplimiento

| # | Pregunta | Req. | Bloqueante |
|---|---|---|---|
| PR1 | ¿El formulario muestra consentimiento sin premarcar, versionado y con enlace a la política? | SEC-029, Ley 1581 | Sí |
| PR2 | ¿Newsletter usa doble opt-in y revocatoria en un clic? | SEC-029 | Sí |
| PR3 | ¿GA4/GTM/píxeles no cargan antes del consentimiento de cookies? | SEC-029 | Sí |
| PR4 | ¿La política de privacidad menciona realmente todos los destinatarios (pasarela, transportadora, DIAN, analítica)? | Cumplimiento | Sí |
| PR5 | ¿El procedimiento SARA (10/15 días hábiles) sigue vigente y accesible? | Cumplimiento | No |
| PR6 | ¿Decisión RNBD documentada y textos legales revisados por el cliente? | Cumplimiento | No |

### 2.9 Headers, TLS y CI

| # | Pregunta | Req. | Bloqueante |
|---|---|---|---|
| H1 | ¿CSP estricta sin `unsafe-inline`/`unsafe-eval` salvo excepción aprobada? | SEC-022 | Sí |
| H2 | ¿HSTS, `nosniff`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy` presentes? | SEC-021, SEC-013 | Sí |
| H3 | ¿HTTPS forzado y rutas autenticadas con `Cache-Control: no-store`? | SEC-013, SEC-021 | Sí |
| H4 | ¿Pipeline con tests de seguridad, audit, SAST y escaneo de secretos en verde? | SEC-024, SEC-015 | Sí |
| H5 | ¿Se ejecutaron tests negativos de authz y de webhook en este PR? | SEC-005, SEC-025 | Sí |

---

## 3. Severidad de findings

| Severidad | Definición | Acción |
|---|---|---|
| **Critical** | Fuga de PII/secretos, elevación a Admin, webhook falseable, PAN/CVV en nuestro sistema, fraude monetario directo | **Bloquea release**. No se puede parchear en caliente sin corregir. |
| **High** | Authz ausente en endpoint, CSRF/XSS explotable, rate limit inexistente en login, auditoría borrable | **Bloquea release** salvo arbitraje del Comandante con fecha de vencimiento. |
| **Medium** | Header faltante, log con PII no crítico, retención ambigua, errores con detalle interno | Corregir en el PR o ticket con dueño antes del deploy. |
| **Low / nit** | Texto legal desactualizado, comentario, naming | Backlog; no bloquea. |

**Formato del finding:**

```text
[Critical] packages/core/payments/webhook.ts:42
Riesgo: la firma se compara con === sobre el body parseado, permite replay y fraude (OWASP A08).
Corrección: verificar HMAC-SHA256 sobre req.text() crudo con timingSafeEqual + timestamp de 5 min + unique(provider,event_id).
Estado: BLOQUEANTE — no aprueba hasta corregir y añadir test negativo.
```

---

## 4. Criterios para dar el OK

`forge-sentinel` emite **OK** solo si se cumplen **todas**:

1. Cero findings Critical y High abiertos.
2. Todos los ítems **BLOQUEANTE** aplicables marcados ✅ o N/A justificado.
3. Tests negativos ejecutados y en verde (roles, IDOR, webhook, validación).
4. Sin secretos reales en el diff ni en el bundle.
5. Cambios sensibles de pagos/datos acompañados de su documento (`pagos-y-pci.md`, `cumplimiento-colombia.md`) actualizado.
6. `forge-reviewer` ya dio LGTM; nadie aprueba su propio cambio.

Si falta alguno: **Request changes** con la lista priorizada y `file:line`.

---

## 5. Criterios para bloquear (resumen rápido)

| Situación | Veredicto |
|---|---|
| Endpoint admin sin autorización en servidor | **Request changes — Critical** |
| Webhook sin firma o sin idempotencia | **Request changes — Critical** |
| PAN/CVV o secreto en logs/repo/frontend | **Request changes — Critical** |
| Consulta con entrada del usuario concatenada en SQL | **Request changes — Critical** |
| Respuesta con `passwordHash`/documento de otro usuario | **Request changes — Critical** |
| Formulario con marketing premarcado o analítica antes de consentir | **Request changes — High** |
| Dependencia critical sin excepción firmada | **Request changes — High** |
| Falta un header de seguridad no crítico | Corrección antes de deploy; no bloquea si se agenda |

---

## 6. Registro de aprobación

```text
PR / commit:        <VALUE>
Archivos tocados:  <VALUE>
Categorías:        datos / auth / privilegios / secretos / dependencias / validación / logging / privacidad / pagos
Findings:          <VALUE>  (Critical: <VALUE>, High: <VALUE>, Medium: <VALUE>, Low: <VALUE>)
Ítems bloqueantes: todos ✅ / excepción: <VALUE>
Tests de seguridad: ✅ / ❌
Veredicto:         OK | Request changes
Aprobado por:      forge-sentinel
Fecha:             <VALUE>
Excepciones:       <VALUE>  (aprobadas por apex-forge, con vencimiento <VALUE>)
```

> **BLOQUEANTE:** Este registro es la evidencia de la fase 6 del pipeline. Sin él, `forge-infra` no debe promover el artefacto a producción.
