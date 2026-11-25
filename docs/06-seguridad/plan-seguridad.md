# Plan de Seguridad — Adriana_tienda

| Campo | Valor |
|---|---|
| Proyecto | Adriana_tienda — e-commerce de belleza (facial, cabello, cuerpo), Colombia, COP (BIGINT centavos, IVA 1900 bp, C-02) |
| Propietario del documento | `forge-sentinel` (APEX FORGE) |
| Estado | Propuesto — revisión del Comandante (`apex-forge`) pendiente |
| Referencias | OWASP Top 10 2021, OWASP ASVS 4.0 nivel 2, PCI DSS SAQ-A, Ley 1581/2012, Decreto 1377/2013, Ley 1273/2009 |
| Alcance | Storefront, panel administrativo, APIs internas, pasarela y webhooks, inventario por lotes y `site_id` (dos sedes, FEFO, C-01), base de datos y CI/CD |

> **Este documento es la carta de presentación de seguridad del aplicativo.** Define la visión, los principios, los responsables, las fases y la puerta de aprobación que `forge-sentinel` aplica antes de cada publicación. La configuración detallada está en `requisitos-seguridad.md`; el análisis de amenazas en `modelo-amenazas.md`.

---

## 1. Visión general

Seguridad no es una fase final ni un parche: es una propiedad del sistema que se decide en el diseño y se verifica en cada cambio. Adriana_tienda maneja **datos personales de clientes**, **dinero** y **privilegios administrativos** sobre catálogo, precios, inventario por lotes y `site_id` (dos sedes, FEFO) y pedidos. Un fallo en cualquiera de esos tres ejes afecta la reputación de la empresa y su cumplimiento legal.

La visión es llegar al lanzamiento con:

1. **Superficie de pago mínima:** el aplicativo nunca ve PAN ni CVV (checkout-hosted de la pasarela, alcance SAQ-A).
2. **Acceso administrativo de confianza cero:** toda acción privilegiada se autentica, autoriza, registra y es auditables.
3. **Datos personales protegidos por diseño:** minimización, cifrado, consentimiento granular, retención y supresión.
4. **Evidencia continua:** CI con SCA, tests de seguridad, auditoría inmutable y monitoreo con respuesta ante incidentes.

> **BLOQUEANTE:** No se publica a producción sin el visto bueno explícito de `forge-sentinel` registrado en `checklist-review.md`. El Comandante puede arbitrar, pero la alerta de riesgo queda documentada.

---

## 2. Principios rectores

| Principio |Cómo se aplica en Adriana_tienda |
|---|---|
| **Defense in depth (defensa en profundidad)** | Cloudflare (WAF/BOT/rate limit) → Next.js (validación, CSP, CSRF) → capa de dominio (reglas de negocio y RBAC) → PostgreSQL (restricciones, transacciones) → auditoría y monitoreo. Ningún control es el único. |
| **Least privilege (mínimo privilegio)** | Cada rol (Cliente, Vendedor, Admin, Superadmin) solo tiene los permisos necesarios. El worker usa credenciales distintas de la web. La BD del admin no es la del bot de conciliación. |
| **Zero trust para el panel admin** | El admin no se considera de confianza por estar "detrás" de un login: **MFA obligatorio en MVP para Admin y Superadmin**, sesiones de 8 h (Vendedores: sesión de tablet de 8 h con MFA diferida a Fase 2, C-04), reautenticación para acciones sensibles (reembolsos, cambio de rol, exportación), IP/device awareness y auditoría de cada acción. |
| **Nunca confiar en la entrada** | Todo parámetro de query, body, cookie, header, archivo o webhook se valida con esquema (Zod) en la frontera, antes de tocar el dominio. |
| **Fail-safe por defecto** | Si falla la verificación de firma, el rate limit, el bloqueo de stock o la validación, la operación se **rechaza**, no se deja pasar. |
| **Privacidad por diseño y por defecto** | No se recogen campos que no se usan; el checkbox de marketing no viene premarcado; los datos sensibles se cifran y se indexan con hash ciego. |
| **Shift-left** | Los controles se escriben y se prueban en diseño y construcción, no se delegan al penetration test final. |
| **Separación de entornos** | Desarrollo, staging y producción con secretos, BD y claves distintas. Nunca se usa datos reales de clientes en staging. |
| **Auditabilidad** | Toda acción administrativa y todo evento de pago deja huella inmutable (`audit_logs`, `webhook_events`). Sin auditoría no hay no-repudio. |

---

## 3. Responsables (RACI de seguridad)

| Rol | Responsabilidad en seguridad | Responsable (R) | Aprobador (A) | Consultado (C) |
|---|---|---|---|---|
| `apex-forge` (Comandante) | Arbitra decisiones, acepta riesgos residuales, firma el go-live | — | ✅ | ✅ |
| `forge-architect` | Diseña controles, límites de confianza y requisitos antes del código | ✅ | | ✅ |
| `forge-backend` / `forge-frontend` | Implementan validación, auth, RBAC, cifrado, headers y tests | ✅ | | |
| `forge-qualis` | Define suites de seguridad, ejecuta tests y valida rollout/rollback | ✅ | | ✅ |
| `forge-reviewer` | Gatekeeper de código: LGTM de cada PR | ✅ | | |
| **`forge-sentinel`** | Dueño del modelo de amenazas, checklist, aprobación de seguridad y respuesta a incidentes | ✅ | ✅ | |
| `forge-infra` | Secretos en gestor, TLS, WAF, CI, backups, monitoreo | ✅ | | ✅ |
| Cliente (negocio) | Define quién opera cada rol, política de retención y responde solicitudes del titular | | | ✅ |

> **BLOQUEANTE:** El mismo ingeniero que escribe un cambio sensible no puede aprobarlo. Se requiere LGTM de `forge-reviewer` **y** OK de `forge-sentinel`.

---

## 4. Fases del pipeline y controles de seguridad

El modelo sigue las 8 fases de la constitución APEX FORGE. La seguridad se incrusta en cada una:

| # | Fase | Control de seguridad | Entregable de seguridad |
|---|---|---|---|
| 1 | **Diseño** | Modelo de amenazas (STRIDE), definición de límites de confianza, clasificación de datos, decisión SAQ-A, diseño RBAC y consentimiento | `modelo-amenazas.md`, `requisitos-seguridad.md`, sección de seguridad del Design Doc |
| 2 | **Planificación** | Cada tarea lleva criterios de aceptación de seguridad y un requisito SEC-xxx asociado | Backlog con etiquetas `seguridad` y `bloqueante` |
| 3 | **Construcción** | Validación en frontera, Prisma parametrizado, cookies seguras, secretos por entorno, cifrado de PII, sin secretos en repo | Código + tests unitarios de control |
| 4 | **Auto-testing** | Tests de authz (intentar acceder con rol equivocado), de firma de webhook, de idempotencia, de validación y de headers | Suite verde en CI |
| 5 | **Code review** | `forge-reviewer` aplica revisión general; `forge-sentinel` aplica `checklist-review.md` en cambios sensibles | LGTM + registro de checklist |
| 6 | **Revisión de seguridad** | Veredicto **OK** o **Request changes** con findings priorizados y `file:line` | Veredicto firmado en el PR |
| 7 | **CI** | `pnpm audit`, SCA, SAST, chequeo de secretos (gitleaks/trufflehog), build y tests | Pipeline verde; artefacto inmutable |
| 8 | **Release y operación** | Deploy canary, TLS/HSTS activos, WAF en modo bloqueo, monitoreo, runbook de incidentes y plan de rollback | Go-live con bitácora y `plan-respuesta-incidentes.md` |

### 4.1 Puertas (gates) obligatorias

- **Gate de diseño:** sin modelo de amenazas aprobado no se crea la ruta de checkout ni el panel admin.
- **Gate de código:** sin tests de autorización no se mergea ningún endpoint admin.
- **Gate de pagos:** sin verificación HMAC + idempotencia + comparación de monto no se activa el webhook de Wompi/ePayco en producción.
- **Gate de datos:** sin política de privacidad, banner de cookies y registro de consentimiento no se publica el formulario de newsletter ni GA4/GTM.
- **Gate de release:** sin rotación de secretos de prueba y sin `.env` fuera del repositorio no se publica.

---

## 5. Checklist de aprobación de seguridad antes de publicar

`forge-sentinel` marca cada ítem. Cualquier **BLOQUEANTE** sin cumplir detiene el deploy.

| # | Control | Estado | Bloqueante |
|---|---|---|---|
| 1 | Modelo de amenazas revisado y mitigaciones relevantes implementadas | ☐ | Sí |
| 2 | Todos los requisitos `SEC-0xx` marcados como **BLOQUEANTE** verificados en producción | ☐ | Sí |
| 3 | Autenticación: cookies `httpOnly` para access/refresh (`Bearer` solo server-to-server), JWT con expiración corta, refresh rotado, sesiones revocables, MFA en Admin/Superadmin (MVP) y sesión de tablet de 8 h para Vendedores (C-04) | ☐ | Sí |
| 4 | Autorización: RBAC de los cuatro roles probado con tests negativos (403 reales, no solo UI oculta) | ☐ | Sí |
| 5 | Checkout-hosted activo: **cero** PAN/CVV en servidor, logs o BD; SAQ-A documentado | ☐ | Sí |
| 6 | Webhooks con firma HMAC, tolerancia temporal, idempotencia y validación de monto/moneda | ☐ | Sí |
| 7 | Secretos solo en gestor (Vercel/Fly), rotados desde staging; `.env` en `.gitignore`; sin secretos en logs ni frontend | ☐ | Sí |
| 8 | TLS 1.2+ y HSTS activos en dominio y subdominios; CSP sin `unsafe-inline` salvo justificación | ☐ | Sí |
| 9 | PII sensible cifrada (teléfono/documento) e índices ciegos; respuestas JSON sin hashes ni campos internos | ☐ | Sí |
| 10 | Consentimiento granular registrado, política de privacidad y banner de cookies publicados | ☐ | Sí |
| 11 | Subida de imágenes: validación de tipo real/tamaño, almacenamiento en R2 sin ejecución, dominio CDN propio | ☐ | Sí |
| 12 | Rate limiting (login 5/15 min por IP+cuenta con backoff y CAPTCHA; checkout 20 req/min por sesión, C-05), anti-fuerza-bruta y protección de checkout contra doble envío | ☐ | Sí |
| 13 | `pnpm audit` / SCA sin vulnerabilidades critical o high sin excepción firmada | ☐ | Sí |
| 14 | Auditoría inmutable de acciones admin y eventos de pago; logs sin PII sensible | ☐ | Sí |
| 15 | Backups cifrados probados (restore) y plan de rollback verificado | ☐ | No (pero exigido para go-live) |
| 16 | Runbook de incidentes y canal `security@<DOMINIO>` publicados | ☐ | No (exigido en 30 días) |
| 17 | Datos de prueba: ningún dato real de clientes en staging/demo | ☐ | Sí |

### 5.1 Registro de aprobación

```
PR / deploy:        <VALUE>
Veredicto:          OK | Request changes
Findings:           <VALUE>   (ver checklist-review.md)
Aprobado por:       forge-sentinel
Fecha:              <VALUE>
Excepciones:        <VALUE>   (riesgo aceptado por apex-forge, con fecha de vencimiento)
```

---

## 6. Operación continua

- **Rotación de secretos:** cada 90 días y ante cualquier incidente o salida de personal.
- **Revisión de dependencias:** semanal automatizada (Renovate/Dependabot) + `pnpm audit` en CI.
- **Revisión de accesos:** mensual; baja inmediata de usuarios inactivos y de roles temporales.
- **Revisión de logs de auditoría:** semanal; alerta ante acciones sensibles fuera de horario.
- **Revisión del modelo de amenazas:** cada cambio de arquitectura, de pasarela o de regulación, y al menos dos veces al año.
- **Simulacro de incidente:** una vez al año antes del aniversario del lanzamiento.

---

## 7. Documentos relacionados

| Documento | Contenido |
|---|---|
| `modelo-amenazas.md` | STRIDE, activos, límites de confianza, matriz de riesgo |
| `requisitos-seguridad.md` | Catálogo SEC-001… alineado con OWASP/ASVS |
| `cumplimiento-colombia.md` | Ley 1581/1273, consentimiento, cookies, retención, RNBD |
| `pagos-y-pci.md` | SAQ-A, tokenización, webhooks, fraude, chargebacks |
| `plan-respuesta-incidentes.md` | Clasificación, equipo, pasos, plantillas |
| `checklist-review.md` | Checklist por PR y criterios de OK / bloqueo |
