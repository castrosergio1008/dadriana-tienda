# Requisitos de Seguridad — Adriana_tienda

| Campo | Valor |
|---|---|
| Propietario | `forge-sentinel` |
| Objetivo | OWASP ASVS 4.0 **nivel 2**; cobertura del OWASP Top 10 2021 |
| Convención | `SEC-0xx`; cada requisito lleva estado, trazabilidad y verificación |
| Placeholders | Toda variable de entorno se muestra como `<VALUE>`; **nunca** se documentan valores reales |
| Fuente de decisiones | `docs/02-arquitectura/decisiones-comandante.md` (C-01…C-12) — manda en caso de conflicto |

> **BLOQUEANTE:** Los requisitos marcados así deben estar implementados y verificados en staging antes de publicar a producción.

---

## 1. Trazabilidad OWASP Top 10 2021 → requisitos

| OWASP 2021 | Riesgo | Requisitos |
|---|---|---|
| A01 Broken Access Control | IDOR, escalada, RBAC débil | SEC-002, SEC-005, SEC-010, SEC-016, SEC-020, SEC-031 |
| A02 Cryptographic Failures | PII sin cifrar, TLS débil, secretos | SEC-009, SEC-012, SEC-013, SEC-015, SEC-016 |
| A03 Injection | SQLi, XSS, mass assignment | SEC-006, SEC-008, SEC-014, SEC-028 |
| A04 Insecure Design | Falta de rate limit, flujos sin idempotencia | SEC-011, SEC-019, SEC-025, SEC-028, SEC-030 |
| A05 Security Misconfiguration | Headers, errores, entornos | SEC-007, SEC-021, SEC-022, SEC-023, SEC-030 |
| A06 Vulnerable and Outdated Components | Dependencias | SEC-024 |
| A07 Identification and Auth Failures | Contraseñas, JWT, MFA, fuerza bruta | SEC-001, SEC-003, SEC-004, SEC-007, SEC-011, SEC-023 |
| A08 Software and Data Integrity Failures | Webhooks, firmas, deserialización | SEC-025, SEC-026, SEC-027 |
| A09 Security Logging and Monitoring Failures | Logs, auditoría, PII en logs | SEC-017, SEC-018, SEC-027, SEC-031 |
| A10 SSRF | Redirects, fetches a proveedores | SEC-014 |

---

## 2. Catálogo de requisitos

### 2.1 Autenticación y sesiones

#### SEC-001 — Política de contraseñas y hashes
- Almacenar contraseñas con **Argon2id** (parámetros revisados por `forge-sentinel`) o bcrypt cost ≥ 12. **Prohibido** MD5/SHA1/SHA256 simples.
- Mínimo 12 caracteres; sin composición obligatoria de símbolos (mejor passphrases); verificar contra lista de contraseñas comunes.
- Nunca enviar la contraseña por email; el reset usa token de un solo uso con expiración de 30 min.
- **ASVS:** 2.4.1, 8.3.1. **Verificación:** test de que el hash en BD no es reversible ni igual al plaintext.
- Estado: ☐ **BLOQUEANTE**

#### SEC-002 — Mínimo privilegio y propiedad del recurso
- Un usuario solo accede a sus propios recursos. Toda consulta por `id` incluye condición de propiedad (`userId`, `cartToken` o `siteId` según rol).
- Roles de BD separados: `app_rw` (operación), `migrator` (DDL), `readonly` (reportes). El worker usa credencial propia.
- Los campos de control (`role`, `status`, `passwordHash`, `siteId`) **nunca** se aceptan desde el body de una mutación de cliente.
- **ASVS:** 1.1.2, 4.1.1, 4.2.1. **Verificación:** tests negativos de IDOR con dos usuarios y dos sedes.
- Estado: ☐ **BLOQUEANTE**

#### SEC-003 — JWT, refresh, expiración, rotación y MFA
- **Access token** JWT firmado (RS256 o EdDSA), vigencia **15 min**, claims obligatorias `iss`, `aud`, `sub`, `iat`, `exp`, `jti`, `role`. Verificar firma, `exp`, `iss` y `aud` en **cada** petición; rechazar `alg=none`.
- **Transporte (C-04):** en **storefront y panel admin**, tanto el access token como el refresh token viajan en **cookies `httpOnly`/`Secure`**. No existe un access token legible desde JavaScript. `Authorization: Bearer` queda **exclusivamente** para integraciones servidor a servidor (webhooks, worker, DIAN) y se documenta como tal en el contrato.
- **Refresh token** opaco de 256 bits, vigencia **7 días**, guardado solo como `tokenHash` en `sessions` (`Session.tokenHash`). Se guarda en cookie `HttpOnly/Secure/SameSite=Strict`.
- **Rotación en cada uso:** al refrescar se emite un nuevo refresh y se revoca el anterior; si se detecta reutilización de un token ya rotado, se revoca **toda la familia** de sesiones del usuario y se envía alerta.
- **MFA (C-04):** obligatorio **en MVP para Admin y Superadmin** (TOTP, con códigos de recuperación de un solo uso). Los **Vendedores** usan una **sesión de tablet de 8 h sin MFA en MVP**; su MFA se difiere a **Fase 2**. Opcional para Cliente; recomendado al cambiar datos sensibles. **No queda ambigüedad: el Vendedor no requiere MFA en el MVP.**
- Verificación de email antes de habilitar cuentas con privilegios. Cambio de email/contraseña requiere token de un solo uso y notificación al correo anterior.
- **ASVS:** 3.1.1, 3.2.1, 3.3.1, 3.4.1, 3.5.1, 3.7.1. **Verificación:** test de expiración, de reutilización de refresh, de acceso sin MFA al admin y de que la sesión de tablet del Vendedor funciona sin MFA en MVP.
- Estado: ☐ **BLOQUEANTE**

#### SEC-004 — Gestión del ciclo de vida de sesiones
- `Session.expiresAt` y `revokedAt` se respetan en cada request. Logout revoca la sesión en BD (no solo borra la cookie).
- Cerrar sesiones al cambiar contraseña o rol. Registrar `lastLoginAt`, IP y `userAgent` (sin PII sensible en logs; ver SEC-018).
- Sesiones inactivas del panel admin (Admin/Superadmin) expiran a las **8 h**; los **Vendedores** usan una **sesión de tablet de 8 h** sin MFA en MVP (C-04, MFA diferida a Fase 2). Reautenticación exigida para reembolsos, exportes y cambio de roles.
- **ASVS:** 3.3.2, 3.3.3. **Verificación:** test de que una sesión revocada no autoriza.
- Estado: ☐ **BLOQUEANTE**

#### SEC-005 — Autorización RBAC en servidor
Roles definidos: **Cliente**, **Vendedor**, **Admin**, **Superadmin**. Permisos granulares (`catalog.write`, `orders.read`, `orders.refund`, `inventory.adjust`, `users.role.write`, `audit.read`, `exports.run`).

| Acción | Cliente | Vendedor | Admin | Superadmin |
|---|---|---|---|---|
| Ver catálogo / comprar | ✅ | ✅ | ✅ | ✅ |
| Ver sus propios pedidos | ✅ | ✅ | ✅ | ✅ |
| Ver pedidos de **su sede** | ❌ | ✅ | ✅ | ✅ |
| Ver pedidos de **todas las sedes** | ❌ | ❌ | ✅ | ✅ |
| Editar catálogo / precios | ❌ | ❌ | ✅ | ✅ |
| Ajustar inventario de su sede | ❌ | ✅ (hasta umbral) | ✅ | ✅ |
| Transferir inventario entre sedes | ❌ | ❌ | ✅ | ✅ |
| Reembolsos hasta `<VALUE>` COP | ❌ | ❌ | ✅ | ✅ |
| Reembolsos sobre `<VALUE>` COP | ❌ | ❌ | ❌ | ✅ + MFA |
| Gestionar roles / usuarios | ❌ | ❌ | ❌ | ✅ + MFA |
| Exportar BD / ver auditoría | ❌ | ❌ | ❌ | ✅ + MFA |

- La autorización se ejecuta en **middleware de servidor** que cubre Route Handlers y Server Actions, no solo en componentes de UI.
- El scope por sede se deriva de la sesión del usuario, **nunca** de un parámetro del cliente.
- Cambiar el rol de un usuario solo vía `users.role.write` con MFA y auditoría `before/after`.
- Según C-04, las celdas «✅ + MFA» aplican solo a Admin/Superadmin en MVP; el Vendedor opera con sesión de tablet de 8 h y su MFA se difiere a Fase 2.
- **ASVS:** 4.1.1, 4.1.2, 4.2.1, 4.3.1. **Verificación:** matriz de tests negativos por rol y por sede (un Vendedor de sede A no ve sede B).
- Estado: ☐ **BLOQUEANTE**

#### SEC-006 — Validación de entrada, SQLi y mass assignment
- Todo `body`, `query`, `params`, `cookie` y `header` se valida con **Zod** en la frontera. Allowlist de campos; rechazar campos desconocidos (`.strict()`).
- Longitudes y rangos explícitos (p. ej. `q` ≤ 100 chars, `limit` ≤ 50, montos positivos en **centavos BIGINT** `*_cents`; IVA 19 % como `1900` basis points, C-02). Normalizar Unicode.
- **SQLi:** usar Prisma y sus APIs parametrizadas. `$queryRaw`/`$executeRaw` solo con template tag y revisión explícita; **prohibida** concatenación de entrada del usuario.
- **Mass assignment:** construir el objeto de `update` con campos explícitos, nunca `prisma.user.update({ data: req.body })`.
- **Precios y descuentos:** se recalculan siempre en servidor desde la BD; el cliente nunca envía el total.
- **ASVS:** 5.1.1, 5.2.1, 5.3.1, 5.4.1, 6.2.1. **Verificación:** tests con payloads `' OR 1=1--`, `<script>`, campos extras y montos alterados.
- Estado: ☐ **BLOQUEANTE**

#### SEC-007 — Manejo de errores sin fugas
- Respuesta pública: `{ error: { code, message }, requestId }`; mensajes genéricos y en español. **Nunca** `stack`, SQL, rutas de archivos, nombres de tablas ni mensajes de librería.
- Registrar el error completo solo en el log interno con `requestId` correlacionable.
- Mensajes de login/registro uniformes para evitar enumeración (ver SEC-003).
- **ASVS:** 7.1.1, 7.3.1. **Verificación:** forzar 500 y revisar que la respuesta no filtre información.
- Estado: ☐ **BLOQUEANTE**

### 2.2 Protección de datos y criptografía

#### SEC-008 — Prevención de XSS
- React escapa por defecto. **Prohibido** `dangerouslySetInnerHTML` salvo contenido sanitizado con librería mantenida y allowlist (DOMPurify) en servidor.
- No insertar datos del usuario en `href`/`src` sin validar esquema (`http/https`); bloquear `javascript:`.
- CSP estricta (SEC-022) como segunda línea.
- **ASVS:** 5.3.3. **Verificación:** almacenar `<img onerror=...>` en reseña y confirmar que se muestra como texto.
- Estado: ☐ **BLOQUEANTE**

#### SEC-009 — Protección de PII en respuestas y comunicaciones
- Los DTOs incluyen solo campos necesarios: **nunca** `passwordHash`, `tokenHash`, `documentNumber`, `phone` completo ni IDs internos ajenos al cliente.
- Los emails transaccionales se generan desde la orden autenticada; `GET /orders/:number?email=` exige verificación adicional (token magic link), no solo el email en query.
- Aplicar minimización: solo recoger document/cumpleaños si es necesario para facturación o promoción, con consentimiento.
- **ASVS:** 8.1.1, 8.3.3, 13.1.1. **Verificación:** revisar JSON de `/orders` y emails de prueba.
- Estado: ☐ **BLOQUEANTE**

#### SEC-012 — Cifrado en reposo
- Teléfono y documento de identidad: **AES-256-GCM** en aplicación con clave del gestor (`DATA_ENCRYPTION_KEY=<VALUE>`); guardar `phoneHash`/`documentHash` (HMAC-SHA256 con clave separada `HASH_KEY=<VALUE>`) como índice ciego.
- Cifrado de disco/BD gestionado (Neon/TLS + encrypt-at-rest) y backups cifrados (SEC-019).
- Rotación de claves con versión (`keyVersion`) y procedimiento documentado.
- **ASVS:** 8.1.2, 8.1.3. **Verificación:** consultar BD directamente y confirmar que no aparece el documento en claro.
- Estado: ☐ **BLOQUEANTE**

#### SEC-013 — TLS 1.2+ y HSTS
- Todo el tráfico por **HTTPS** con TLS 1.2 como mínimo (preferir 1.3); redirección 301 de HTTP a HTTPS.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (preload solo tras validar subdominios).
- Renovación automática de certificados; alerta antes de expirar.
- **ASVS:** 9.1.1, 9.1.2. **Verificación:** `curl -I` y escaneo SSL Labs con calificación A.
- Estado: ☐ **BLOQUEANTE**

#### SEC-016 — Exposición mínima de datos
- Nunca devolver el modelo completo de Prisma. Usar `select` explícito o mapeadores DTO.
- Cabeceras de respuesta sin `X-Powered-By`; desactivar el directorio de Next.js en producción.
- Los exportes administrativos se limitan a Superadmin, se registran en auditoría y se entregan por canal autenticado.
- **ASVS:** 4.1.3, 8.3.1. **Verificación:** revisar el payload de todos los endpoints con un usuario de prueba.
- Estado: ☐ **BLOQUEANTE**

### 2.3 Configuración y frontera

#### SEC-010 — Protección CSRF
- Cookies `SameSite=Strict` por defecto más token CSRF (`double submit` firmado) en todas las mutaciones vía Route Handlers y Server Actions. **Única excepción documentada (C-04/m1):** la cookie de sesión de checkout usa `SameSite=Lax` solo para el retorno desde Wompi (callback de pago).
- Verificar `Origin`/`Sec-Fetch-Site` en mutaciones; rechazar cross-site.
- Los webhooks **no** usan cookies: se autentican por firma HMAC (SEC-025).
- **ASVS:** 4.2.2, 4.2.3. **Verificación:** petición POST con Origin externo debe devolver 403.
- Estado: ☐ **BLOQUEANTE**

#### SEC-011 — Rate limiting y anti-fuerza-bruta
**Valores únicos (C-05).** Login y checkout tienen una sola cifra vigente en toda la documentación: **5 intentos / 15 min por IP+cuenta** y **20 peticiones / min por sesión**, respectivamente. No coexistirán otros valores para estos dos flujos. Redis + Cloudflare; el resto se ajusta con datos reales.

| Endpoint | Límite | Ventana |
|---|---|---|
| Login | **5 intentos por IP+cuenta** | **15 min** + backoff exponencial + CAPTCHA tras el 5.º intento |
| Checkout (`POST /api/v1/checkout`) | **20 peticiones por sesión** | **1 min** + `Idempotency-Key` obligatoria |
| Registro | 3 por IP | 1 h |
| Reset de contraseña | 3 por cuenta | 1 h |
| `/api/v1/search` | 60 por IP | 1 min |
| `/api/v1/orders` (consulta GET) | 10 por sesión | 1 h |
| Webhooks | 100 por IP/proveedor | 1 min |
| API general | 120 por token/IP | 1 min |

- Bloqueo temporal tras el quinto fallo; desbloqueo por email verificado. **CAPTCHA tras el quinto intento** (sin cookies de terceros).
- Respuesta `429` con `Retry-After`; no revelar si la cuenta existe.
- **ASVS:** 2.2.1, 4.0.1, 11.1.4. **Verificación:** script de 10 logins fallidos seguidos de otro correcto (confirmando backoff + CAPTCHA) y prueba de 21 peticiones de checkout en un minuto → la última devuelve `429`.
- Estado: ☐ **BLOQUEANTE**

#### SEC-014 — Redirects abiertos y SSRF
- Parámetros de retorno (`returnTo`, `next`) se validan contra allowlist de rutas internas; prohibido `//evil.com` y esquemas `javascript:`/`data:`.
- Toda URL que la app consulte (transportadoras, imágenes remotas, proveedores) pasa por allowlist de hosts, sin seguir redirects a hosts no permitidos, con timeout y sin credenciales.
- Solicitudes salientes desde IP privada/metadata (`169.254.x.x`, RFC1918) bloqueadas.
- **ASVS:** 5.3.4, 12.6.1. **Verificación:** probar `?next=https://evil.example`.
- Estado: ☐ **BLOQUEANTE**

#### SEC-015 — Gestión de secretos
- Secretos **solo** en gestor (Vercel Environment Variables / Fly Secrets). Nombres y ejemplos con placeholders:

```dotenv
DATABASE_URL=<VALUE>
REDIS_URL=<VALUE>
JWT_PRIVATE_KEY=<VALUE>
JWT_PUBLIC_KEY=<VALUE>
DATA_ENCRYPTION_KEY=<VALUE>
HASH_KEY=<VALUE>
WOMPI_EVENTS_SECRET=<VALUE>
WOMPI_INTEGRITY_SECRET=<VALUE>
EPAYCO_API_KEY=<VALUE>
DIAN_API_TOKEN=<VALUE>
RESEND_API_KEY=<VALUE>
WHATSAPP_ACCESS_TOKEN=<VALUE>
```

- `.env*` en `.gitignore`; plantilla `.env.example` sin valores reales.
- **Prohibido** usar `NEXT_PUBLIC_*` para secretos: todo lo que va al bundle es público.
- Rotación cada 90 días y ante incidente; `integrations.config` guarda **referencias**, nunca secretos en claro.
- Escaneo de secretos en CI (gitleaks/trufflehog) y en el historial antes del primer release.
- **ASVS:** 2.10.1, 6.4.1, 14.2.1. **Verificación:** grep del repo/bundle por patrones de clave; revisar que staging y producción no comparten secretos.
- Estado: ☐ **BLOQUEANTE**

#### SEC-018 — Logs seguros
- Logs estructurados (pino) con `requestId`, nivel, ruta y duración. **Redactar** por configuración: `password`, `token`, `authorization`, `cookie`, `documentNumber`, `phone`, `email` en payloads sensibles, `x-webhook-signature`, PAN/CVV.
- No loguear bodies completos de checkout, ni headers completos de webhooks.
- Acceso a logs restringido y retention definida (`<VALUE>` días).
- **ASVS:** 7.1.1, 7.2.1. **Verificación:** generar login, pago y webhook de prueba y revisar que no aparezcan secretos/PII.
- Estado: ☐ **BLOQUEANTE**

#### SEC-021 — Cabeceras de seguridad
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` y `Content-Security-Policy: frame-ancestors 'none'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(self)`
- `Cache-Control: no-store` en rutas autenticadas y de checkout; `Cross-Origin-Opener-Policy: same-origin` donde aplique.
- **ASVS:** 14.4.1, 14.4.3. **Verificación:** `curl -I` sobre storefront, admin y API.
- Estado: ☐ **BLOQUEANTE**

#### SEC-022 — Content Security Policy
- CSP restrictiva: `default-src 'self'; script-src 'self' <nonce>; style-src 'self' 'nonce-<VALUE>'; img-src 'self' https://cdn.<DOMINIO> data:; connect-src 'self' https://api.<DOMINIO>; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`.
- **Prohibido** `unsafe-inline` y `unsafe-eval` sin excepción documentada y aprobada por `forge-sentinel`. GA4/GTM se cargan vía nonce y dominio explícito, nunca con comodín.
- Modo `report-only` en staging, enforzar en producción.
- **ASVS:** 14.4.1. **Verificación:** consola del navegador sin violaciones; test de inyección no ejecuta.
- Estado: ☐ **BLOQUEANTE**

#### SEC-023 — Atributos de cookies
| Cookie | HttpOnly | Secure | SameSite | Max-Age |
|---|---|---|---|---|
| Sesión (access/refresh) — storefront y admin | Sí | Sí | Strict | 15 min (access) / 7 días (refresh) |
| Sesión de checkout (retorno Wompi) | Sí | Sí | **Lax — excepción documentada (C-04/m1)** | 30 min |
| Carrito anónimo | Sí | Sí | Lax | `<VALUE>` días |
| Consentimiento | Sí | Sí | Lax | 6 meses |
| CSRF | Sí | Sí | Strict | sesión |

- Prefijo `__Host-` en cookies de sesión (exige `Secure`, `Path=/`, sin `Domain`).
- Access y refresh son `httpOnly` en storefront y panel admin; **no se exponen a JavaScript**. `Authorization: Bearer` solo en integraciones servidor a servidor (C-04).
- `SameSite=Strict` es el valor por defecto. **Excepción:** solo la cookie de sesión de checkout usa `Lax` durante el retorno desde Wompi; el token CSRF y el resto permanecen en `Strict`.
- **ASVS:** 3.3.2, 4.2.2. **Verificación:** inspeccionar `Set-Cookie` en DevTools, incluido el flujo de retorno de Wompi.
- Estado: ☐ **BLOQUEANTE**

#### SEC-024 — Dependencias y SCA
- `pnpm audit` en CI; falla el build ante vulnerabilidades **critical/high** sin excepción firmada por `forge-sentinel` con fecha de vencimiento.
- Renovate/Dependabot semanal; actualizaciones mayores revisadas por `forge-architect`.
- Lockfile versionado; **prohibido** `npm install` sin lockfile en CI.
- Revisión de nuevas dependencias: maintainer, última versión, tamaño, licencia y necesidad. SAST (Semgrep) en CI.
- **ASVS:** 6.2.1, 6.3.1. **Verificación:** pipeline en verde con reporte de audit adjunto.
- Estado: ☐ **BLOQUEANTE**

#### SEC-028 — Subida de imágenes
- Formatos permitidos: JPEG, PNG, WebP, AVIF. Validar **magic bytes**, no solo `Content-Type` ni extensión. **SVG no permitido** (riesgo XSS) salvo sanitización explícita aprobada.
- Tamaño máximo `<VALUE>` MB (p. ej. 5 MB); dimensiones máximas `<VALUE>` px; límite de archivos por producto.
- Nombre aleatorio UUID, sin conservar el nombre del usuario. Ruta en Cloudflare R2 bajo prefijo controlado; **sin ejecución** de archivos; `Content-Disposition` y `nosniff`.
- Derivados AVIF/WebP en CDN con dominio propio; metadatos EXIF eliminados; no se sirve contenido desde dominio de usuario.
- Escaneo antivirus opcional en el worker antes de publicar; rechazo si falla.
- **ASVS:** 12.1.1, 12.2.1, 12.3.1. **Verificación:** subir un `.php` renombrado a `.png` y confirmar rechazo por magic bytes.
- Estado: ☐ **BLOQUEANTE**

#### SEC-030 — Configuración segura y separación de entornos
- `NODE_ENV=production`, debug desactivado, sin source maps públicas, sin endpoints de prueba en producción.
- Desarrollo, staging y producción con BD, Redis y secretos diferentes. **Prohibido** restaurar un dump de producción con PII real en staging; si es imprescindible, se anoniza.
- WAF en modo bloqueo en producción; Cloudflare con bot management y reglas para `/admin` y `/api`.
- **ASVS:** 14.1.1, 14.2.1, 14.3.1. **Verificación:** revisar variables de entorno del deploy y que `/debug` no exista.
- Estado: ☐ **BLOQUEANTE**

### 2.4 Pagos, integridad y auditoría

#### SEC-025 — Pagos, firma de webhook e idempotencia
- Checkout-hosted/redirect: PAN y CVV **nunca** llegan al servidor (ver `pagos-y-pci.md`).
- Webhooks: HMAC SHA-256 sobre el **body crudo**, comparación `timingSafeEqual`, secreto por entorno, ventana de tolerancia de 5 min, `unique(provider,event_id)`, verificación de monto/moneda y de transición válida.
- `Idempotency-Key` obligatorio en `POST /api/v1/checkout` (único crear-pedidos, C-06), `/payments` y `/refunds`. Doble clic bloqueado en UI y en servidor; checkout limitado a 20 req/min por sesión (SEC-011).
- **ASVS:** 5.1.4, 10.3.1, 12.5.1. **Verificación:** webhook con firma inválida → 401; duplicado → 200 sin efectos.
- Estado: ☐ **BLOQUEANTE**

#### SEC-026 — Conciliación y reembolsos seguros
- Job de reconciliación cada 10 min para transacciones `PENDING` > 5 min.
- Reembolsos solo al método original, con validación de monto ≤ pagado, permiso por umbral (SEC-005), MFA y auditoría.
- Reembolsos automáticos por stock agotado generan nota crédito y cupón, con alerta a operación.
- **Verificación:** test de reembolso mayor al pagado debe fallar.
- Estado: ☐ **BLOQUEANTE**

#### SEC-017 — Logging y auditoría inmutable
- Toda acción administrativa escribe `audit_logs` con `actorId`, `actorType`, `action`, `entityType`, `entityId`, `before`, `after`, IP, userAgent y timestamp.
- `audit_logs` y `webhook_events` son **append-only** a nivel de permisos de BD (sin UPDATE/DELETE para la app); export diario a almacenamiento con retención (WORM/object lock) y hash encadenado.
- Retención: `<VALUE>` días (definir con criterio fiscal/legal). Acceso solo Superadmin, con auditoría del acceso.
- La trazabilidad cosmética se apoya en esta auditabilidad: todo movimiento de `inventory_lots` queda registrado en `inventory_movements` inmutable (SEC-031, C-01).
- **ASVS:** 7.1.1, 7.2.1, 7.3.1, 10.2.1. **Verificación:** intentar `DELETE` desde la app debe fallar; consultar hash chain.
- Estado: ☐ **BLOQUEANTE**

#### SEC-027 — Evidencia de compra y chargebacks
- Registrar `Consent` (tipo, versión, granted, IP, userAgent, fecha), snapshot de orden (precio, dirección, cliente) y evento de pago.
- Ante chargeback: congelar liquidación, preservar evidencia, no reembolsar dos veces y responder en los plazos de la pasarela.
- **Verificación:** reconstruir el historial completo de una orden de prueba.
- Estado: ☐ **BLOQUEANTE**

#### SEC-019 — Backups y recuperación
- Backups automáticos cifrados de PostgreSQL: **PITR de 7 días + dump frío diario con retención de 30 días** para MVP (C-09). La ampliación a PITR de 30 días es una mejora aprobable por el cliente, no un requisito bloqueante.
- Prueba de restore **trimestral** documentada; responsable `forge-infra`.
- **Verificación:** bitácora del último restore exitoso.
- Estado: ☐ (exigido para go-live)

#### SEC-020 — Inventario por lotes, FEFO y sedes (`site_id`)
- La fuente de verdad es **`inventory_lots(lot_id, site_id)`** con selección **FEFO**; `inventory_by_site(variant_id, site_id)` es solo una **proyección derivada**, actualizada en la misma transacción. El anti-sobreventa es el `UPDATE` atómico condicional sobre `inventory_lots` con `reserved ≤ on_hand` (C-01).
- Vocabulario único: **`site_id` / `sites`**. Quedan prohibidos `branch_id`, `branches` y `sucursal_id` como identificadores técnicos; «sucursal» se conserva solo como etiqueta UI en español.
- Los permisos de la matriz RBAC se evalúan sobre `siteId` derivado de la sesión, nunca del cuerpo de la petición.
- Toda mutación de stock crea `inventory_movements` con `createdById` y motivo; la auditoría de movimientos de lotes se detalla en **SEC-031**. Ajustes sobre `<VALUE>` unidades requieren aprobación de Admin.
- Transferencias entre `sites` requieren doble confirmación (origen y destino).
- Reservas (`reservations`) con `expiresAt` y liberación automática; el `siteId` de una orden se valida contra inventario disponible en transacción atómica sobre lotes.
- **Verificación:** Vendedor de un `site` no puede ajustar otro; transferencia sin aprobación se rechaza; dos pedidos concurrentes sobre el mismo lote no sobrevenden.
- Estado: ☐ **BLOQUEANTE**

#### SEC-029 — Consentimiento, privacidad y cookies
- Consentimiento granular y revocable para: términos, tratamiento de datos, marketing (email/WhatsApp) y cookies analíticas/marketing. Checkboxes **sin premarcar**.
- Double opt-in para newsletter; cada `Consent` queda registrado con versión de la política.
- Banner de cookies con categorías; GA4/GTM y píxeles no se cargan hasta aceptar la categoría correspondiente. Preferencia revocable desde el footer.
- Política de privacidad y aviso de tratamiento publicados; derechos del titular gestionables (ver `cumplimiento-colombia.md`).
- **ASVS:** 8.1.1, 13.1.1, 14.2.1. **Verificación:** sin aceptar cookies, no hay píxeles de terceros en la red.
- Estado: ☐ **BLOQUEANTE**

#### SEC-031 — Trazabilidad de lotes, FEFO y auditoría de movimientos (C-01)
- La fuente de verdad del inventario es `inventory_lots(lot_id, site_id)` con selección **FEFO**; `inventory_by_site(variant_id, site_id)` es una proyección derivada actualizada en la misma transacción. Vocabulario único `site_id` / `sites` (C-01).
- **Auditoría de movimientos de lotes (cosméticos):** cada entrada, salida, reserva, liberación, ajuste o transferencia escribe un `inventory_movements` **append-only** con `lotId`, `siteId`, `variantId`, `expirationDate`, cantidad antes/después, motivo, `createdById`, `orderId` cuando aplica y timestamp. Debe poder reconstruirse el lote exacto despachado en un pedido y su vencimiento (trazabilidad exigible a cosméticos).
- Umbrales FEFO del MVP: aviso a **90 días**, bloqueo de venta a **15 días** del vencimiento; sin descuento automático en Fase 1 (C-01).
- Rechazar la venta de lotes vencidos o fuera de umbral, con registro del evento.
- **ASVS:** 4.1.1, 7.2.1, 8.3.3. **Verificación:** traza lote → pedido → cliente en datos de prueba; intento de `UPDATE`/`DELETE` sobre `inventory_movements` desde la app debe fallar; test de concurrencia sobre el mismo lote.
- Estado: ☐ **BLOQUEANTE**

---

## 3. Matriz de verificación por capa

| Capa | Controles | Evidencia en CI |
|---|---|---|
| Borde (Cloudflare) | SEC-011, SEC-013, SEC-030 | Reglas WAF exportadas, escaneo TLS |
| Aplicación (Next.js) | SEC-003…SEC-010, SEC-021…SEC-023, SEC-028 | Tests de authz/validación, `curl -I`, CSP report-only |
| Dominio (`packages/core`) | SEC-002, SEC-006, SEC-020, SEC-025…SEC-027, SEC-031 | Tests unitarios de reglas, FEFO y máquina de estados |
| Datos (Postgres/Redis) | SEC-012, SEC-015, SEC-017, SEC-019, SEC-031 | Revisión de grants (incl. `inventory_movements` append-only), restore test |
| Proveedores | SEC-014, SEC-025, SEC-026 | Tests de firma e idempotencia con mocks |

---

## 4. Aceptación

| Rol | Criterio |
|---|---|
| Ingeniero | Todos los SEC aplicables pasan en local y la suite incluye tests negativos |
| `forge-reviewer` | LGTM de código y tests |
| `forge-sentinel` | Checklist de `checklist-review.md` completo; veredicto OK |
| `apex-forge` | Firma el go-live; cualquier excepción queda con fecha de vencimiento |
