# Runbook — MVP D'Adriana Tienda (vitrina + WhatsApp)

| Campo | Valor |
|---|---|
| **Versión** | `mvp-runbook/v1` — 25 de noviembre de 2026 |
| **Dueño** | `forge-infra` (operación) con `forge-qualis` (fiabilidad) |
| **Aprobadores** | `forge-infra` + `forge-sentinel` + `forge-reviewer` + `apex-forge` |
| **Fuente de verdad** | [Design Doc MVP §10](../02-arquitectura/design-doc-mvp.md) y [ADR-MVP-005](../02-arquitectura/adr-mvp/ADR-MVP-005.md) |
| **Estado** | Procedimiento propuesto; ejecutable solo tras LGTM final y aprobación del Comandante |

> **Declaración de alcance (F-10):** `docs/07-infra/checklist-lanzamiento.md` pertenece al **diseño transaccional** (carrito, pagos, DIAN, pedidos, logística, panel) y **no aplica al MVP**. Para este MVP se usa este runbook. Tampoco se heredan las variables de pago, DIAN, GA4 ni Sentry definidas en `docs/07-infra/arquitectura-despliegue.md:284-297`: si existen en la consola de Vercel, se documentan como no usadas y se eliminan.

---

## 1. Dueños y responsabilidades

| Área | Dueño | Responsabilidad en el runbook |
|---|---|---|
| Repositorio y required checks | `forge-infra` + `forge-reviewer` | `main` protegido, PR + 1 LGTM, CODEOWNERS, sin autoaprobación |
| Configuración de Vercel | `forge-infra` | Framework Preset, Root Directory, Production Branch, Previews, Deployment Protection, `vercel.json` |
| Base de datos y backup | `forge-infra` (con titularidad confirmada por el cliente, Q-MVP-03) | Proveedor, PITR, ensayo de restore en Preview |
| Seguridad y cabeceras | `forge-sentinel` | CSP `report-only` → `enforce`, HMAC pepper, `.gitignore`, protección y `noindex` |
| Calidad y release | `forge-qualis` | 28 E2E ×3, cuarentena de flaky, acta de rollback, SLO y postmortem |
| Go / No-Go | `apex-forge` (Comandante) | Aprobación final; sin acta cronometrada no hay Go-Live |
| Moderación de reseñas | Operación del cliente (Q-MVP-02) | Baja/rectificación por `wa.me`, borrado por menor, plazos 10/15 días hábiles |

---

## 2. Configuración versionada y entornos

```text
Repo:          git@github.com:castrosergio1008/dadriana-tienda.git
Rama:          main (producción)
Vercel:        proyecto dadriana-tienda
Framework:     Next.js (Preset)
Root Directory:.
Production Branch: main
PR Previews:   ON
Deployment Protection: ON en Previews y en Production pre-go-live
Canonical:     https://dadriana-tienda.vercel.app (Q-MVP-04 abierta, sin dominio propio)
```

La configuración vive en `vercel.json`, `next.config.*` y en este runbook. Los clicks en la consola son solo **verificación**; cualquier cambio manual debe replicarse en el repositorio en el mismo PR (F-2).

| Entorno | Datos | Protección | Cabeceras | `DATABASE_URL` |
|---|---|---|---|---|
| Development | Ficticios, locales | Local | `report-only` | Local; nunca productiva |
| Preview (PR) | Ficticios, sembrados y aislados | Vercel Authentication/SSO, **sin contraseñas compartidas** | `X-Robots-Tag: noindex`, `report-only` → `enforce` | **SÍ existe**, separada de Production |
| Production pre-go-live | Sin contenido indexable | **Deployment Protection ON** | `X-Robots-Tag: noindex`, `report-only` → `enforce` | **NO CREAR TODAVÍA** |
| Production post-go-live | Reales autorizados (Q-MVP-08) | Retirada solo tras A2 | `enforce`, sin `noindex` | Creada con el checklist §4 |

**Inventario cerrado de variables (A1 + excepción autorizada por el Comandante, DD-MVP-21):**

| Variable | Tipo | Regla |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Pública | Canonical/OG/sitemap; temporal `https://dadriana-tienda.vercel.app` hasta Q-MVP-04 |
| `DATABASE_URL` | **Secreta** | Solo Vercel Encrypted Environment Variables; Preview ficticia; Production diferida |
| `REVIEW_HASH_PEPPER` | **Secreta — excepción DD-MVP-21** | Exclusiva de Vercel Encrypted Environment Variables; no es pública, no va en `app_config` ni se commitea; `.env.example` solo con `<VALUE>`; valor distinto por entorno; historial de versiones en §2.1 |

Eliminadas y **no usadas**: `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_FACEBOOK_URL` (contenido desde `app_config`). Si ya existen en la consola, borrarlas y anotar la fecha en el acta de release. `CONSENT_VERSION` y `POLICY_VERSION` son valores de `app_config`/política publicada, **no** variables de entorno.

### 2.1 Rotación de `REVIEW_HASH_PEPPER` (DD-MVP-22)

El formato es **`HMAC-SHA256(peppers[version], valor)`**. `reviews` persiste `email_hmac_key_version` e `ip_hmac_key_version` junto a los hashes. **La baja/rectificación verifica con la versión persistida, nunca con la vigente**: si se rota sin este procedimiento, la comparación se rompe.

1. Publicar el pepper nuevo como versión `N+1` en Vercel Encrypted Environment Variables (por entorno).
2. Conservar la clave anterior como `REVIEW_HASH_PEPPER_PREVIOUS` —o historial versionado equivalente en Vercel— **solo durante la ventana de rotación**. No es una cuarta variable permanente: se retira al terminar el paso 4.
3. Rehashear en **escritura** (nuevas reseñas usan `N+1`) y en **lectura/verificación** (las antiguas se recalculan con su versión guardada). No sobrescribir las versiones persistidas.
4. Verificar que `MVP-E2E-18` y `MVP-E2E-20` pasan antes y después de la rotación; retirar `REVIEW_HASH_PEPPER_PREVIOUS` y cerrar el registro.

Registro obligatorio (una fila por rotación):

| Fecha | Versión anterior → nueva | Responsable | Verificación E2E-18/-20 | `PREVIOUS` retirado |
|---|---|---|---|---|
| _pendiente de primera rotación_ | — | — | — | — |

---

## 3. Despliegue

### 3.1 Pull Request → Preview

1. El PR pasa los required checks: `lint`, `typecheck`, `unit`, `integration` (PostgreSQL efímera con fixtures sintéticas), `build`, `gitleaks`, `bundle budget` y smoke E2E marcados ●.
2. `main` exige PR + 1 LGTM de `forge-reviewer`; si el PR toca datos, secretos o cabeceras, además OK de `forge-sentinel`. **El autor no puede aprobarse a sí mismo.**
3. Vercel crea el Preview desde la integración Git. Verificar: protección SSO activa, `noindex`, `DATABASE_URL` de Preview (ficticia) y cabeceras con `curl -I`.
4. Ejecutar en Preview los 28 E2E ×1, axe 0 críticas/serias, TTFB p75 < 800 ms, p95 de búsqueda < 300 ms con catálogo fixture y proxy de laboratorio (TBT/Lighthouse + trazas de carrusel, filtros y formulario).
5. Nunca usar credenciales productivas en Preview.

### 3.2 Merge a `main` → Production protegida

1. Merge tras required checks y LGTM. Vercel despliega `main` en `https://dadriana-tienda.vercel.app`.
2. **No retirar** Deployment Protection ni `X-Robots-Tag: noindex`; el formulario público sigue deshabilitado hasta §4.
3. Ejecutar el smoke de 7 superficies (§5) y registrar `requestId` de las respuestas.
4. Adjuntar al release: evidencia de gitleaks limpio, `.gitignore` con `.env*` y `!.env.example`, axe + auditoría manual de teclado/lector, 28 E2E ×3 y acta de rollback ensayado (§6).

### 3.3 Configuración de cabeceras (verificación)

```bash
curl -I https://dadriana-tienda.vercel.app
```

Comprobar: ausencia de `X-Powered-By`; `Referrer-Policy: strict-origin-when-cross-origin`; `X-Frame-Options: DENY`; `X-Content-Type-Options: nosniff`; `Permissions-Policy: camera=(), microphone=(), geolocation=()`; HSTS; `Content-Security-Policy-Report-Only` con `report-uri` **sin PII**; `X-Robots-Tag: noindex` mientras A2 esté vigente. Repetir `curl -I` en el host temporal y en el dominio definitivo cuando se resuelva Q-MVP-04.

**Promoción de CSP a `enforce`:** solo tras ≥ 7 días de reportes sin violaciones reales, E2E completo en verde bajo `report-only` y LGTM de `forge-sentinel` + `forge-infra`. Tras el cambio, repetir MVP-E2E-25; si falla, volver a `report-only` y abrir issue.

---

## 4. Checklist para abrir Production (10 pasos)

Ejecutar **en orden**. Hasta terminar el paso 10, Production sigue protegida y con `noindex`.

1. Cerrar Q-MVP-01 por escrito: mecanismo de actualización de disponibilidad, quién lo opera y decisión sobre panel mínimo (por defecto consola SSO+MFA, SEC-MVP-015); sin este cierre no se abre Production (§12.2 del Design Doc). Registrar la evidencia.
2. Cerrar Q-MVP-03 por escrito: proveedor (propuesta Neon), titularidad de la cuenta y región confirmadas por el cliente.
3. Cerrar Q-MVP-04 o aceptar por escrito el canonical temporal; cerrar Q-MVP-08 con datos reales autorizados.
4. Vercel y BD con SSO + MFA, privilegios mínimos y dueño técnico asignado; sin contraseñas compartidas.
5. Verificar backup/PITR y **ensayar restore en Preview** (§7), con evidencia del resultado.
6. Migraciones probadas en BD efímera y en Preview con datos ficticios; reversión ensayada (`expand → contract`).
7. Política de privacidad, consentimiento versionado y procedimiento de baja/rectificación por `wa.me` revisados por `forge-sentinel` (RF-MVP-046, A3).
8. Cerrar Q-MVP-02 por escrito: moderador designado (persona y criterios) y procedimiento de borrado por menor documentado (A5, excepción al consentimiento), con verificación de baja por correo HMAC (A3).
9. OK explícito registrado de `forge-infra` y `forge-sentinel`; gitleaks limpio y `.gitignore` con `!.env.example`.
10. Crear `DATABASE_URL` en Vercel Production como secreta; ejecutar smoke de 7 superficies; **solo entonces** retirar Deployment Protection y `noindex`, y habilitar el formulario público. Registrar hora y firmas.

---

## 5. Smoke post-deploy y post-rollback (7 superficies)

Ejecutar siempre después de un despliegue en `main` y después de cualquier rollback. Si una superficie falla, **No-Go** hasta corregir.

| # | Superficie | Comprobación |
|---|---|---|
| 1 | **Home** | 200, identidad nueva, carrusel sin autoplay, precio/disponibilidad coherentes |
| 2 | **PLP** | `/piel` y `/cabello`: 200, filtros desde URL, sinónimo `shampoo`, estado vacío con 3 alternativas |
| 3 | **PDP** | 200, SKU, precio COP, `wa.me` con número de `app_config`, solo reseñas `approved` |
| 4 | **`wa.me`** | Destino `https://wa.me/57…` con `rel="noopener noreferrer"`; sin PII; inyección por query/hash/referrer/reseña ignorada |
| 5 | **Reseñas** | Ninguna pendiente/rechazada visible; HTML `no-store, private`; enlace neutral de baja/corrección presente |
| 6 | **Tiendas** | Activas/inactivas desde `app_config`; número por tienda correcto; redes con allowlist de hostname exacto |
| 7 | **Cabeceras** | `curl -I`: sin `X-Powered-By`, CSP según fase, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, HSTS y `noindex` si aplica |

Complemento por release: sonda E2E sintética sin PII (MVP-E2E-27), 28 E2E ×3 con cuarentena de flaky, y verificación de los 8 bloqueantes `SEC-MVP`.

---

## 6. Rollback (< 2 min) y acta

**Disparadores:** 5xx por encima del SLO (99,5 % / 30 días ≈ 216 min de presupuesto) o aparición de una reseña pendiente en superficie pública.

1. **Detectar y declarar** el incidente con hora exacta y superficie afectada.
2. **Revertir** con *Instant Rollback* de Vercel al deployment anterior. No ejecutar migraciones destructivas: el código anterior debe seguir leyendo el esquema (`expand → contract`).
3. Si el problema es una reseña indebida, marcarla `rejected` o borrarla desde la consola SSO+MFA; si es menor, aplicar borrado de reseña, correo HMAC y metadatos (A5).
4. **Smoke post-rollback de 7 superficies** (§5).
5. **Acta cronometrada** (plantilla abajo). **Sin acta no hay Go-Live.**

```text
ACTA DE ROLLBACK — MVP D'Adriana Tienda
Fecha:
Detección (hora):
Disparador: [ ] 5xx sobre SLO  [ ] Reseña pendiente visible
Superficie afectada:
Deployment anterior (ID):
Hora de reversión:
Duración total (objetivo < 2 min):
Smoke 7 superficies: [ ] OK  [ ] Falló (detalle):
Responsable:
Resultado: [ ] Estable  [ ] Requiere corrección
Firma forge-qualis / forge-infra:
```

---

## 7. Backup, restore y base de datos

- La BD de **Preview existe siempre** con datos ficticios sembrados y aislados; nunca apunta a Production.
- Antes del go-live, **ensayar un restore en Preview** desde el backup/PITR del proveedor y verificar que el catálogo y las reseñas de prueba quedan coherentes (F-12). Adjuntar evidencia al paso 5 de §4.
- Las migraciones se ejecutan primero en PostgreSQL efímera de CI y luego en Preview; patrón `expand → contract` para permitir rollback sin pérdida.
- `DATABASE_URL` de Production solo se crea en el paso 10 de §4. Si no existe, **no hay formulario público ni contenido indexable**.

---

## 8. Monitoreo y alertas honestas

| Señal | Fuente | Acción |
|---|---|---|
| Errores 5xx y `requestId` | Logs estructurados de Vercel | Correlacionar y escalar si supera SLO |
| Disponibilidad | *Uptime check* cada 5 min | Si supera presupuesto, aplicar §6 |
| CWV / INP p75 | Speed Insights, ventana 7–28 días post-deploy | El criterio post-deploy **sustituye al «Continuo» de RNF-MVP-002 y `forge-qualis` lo acepta**; INP no se promete en Preview; allí se usa proxy TBT/Lighthouse |
| TTFB / búsqueda | Verificación en Preview y release | TTFB p75 < 800 ms; p95 búsqueda < 300 ms |
| Enlace `wa.me` | **Sonda E2E sintética sin PII por release** | No existe alerta de apertura: no hay endpoint ni telemetría de servidor (A8) |
| Cumplimiento de cabeceras | `curl -I` por release y tras cambios de config | Deriva ⇒ corregir `vercel.json`/`next.config.*` |

**Sin PII en logs:** correo e IP solo `HMAC-SHA256(peppers[version], valor)` con pepper secreto y rotatable en Vercel; sin token en URL, query ni `Referer`. La verificación de baja/rectificación usa la versión persistida en `reviews`; cualquier rotación se ejecuta y registra según §2.1 (A4, DD-MVP-22).

**SLO y *feature freeze*:** 99,5 % / 30 días ≈ 216 min. Si en la primera quincena se consume > 50 % del presupuesto, se congela nueva funcionalidad hasta estabilizar. No se aplican el 99,9 %/43,2 min ni el canary 5/25/100 del diseño anterior.

**Incidentes Sev-1/Sev-2:** postmortem **sin culpables en ≤ 72 h**, con línea de tiempo, causa raíz y acciones correctoras.

---

## 9. Operación de reseñas (recordatorio de seguridad)

- Moderación desde consola Vercel/BD con SSO + MFA; sin `/admin`, sin login propio.
- Consulta pública filtrada por `status=approved`; HTML `no-store, private`; revalidar tras moderar; `sitemap.xml` incluye **todas las páginas públicas** y **solo excluye reseñas pendientes/rechazadas** (H-7).
- Baja/rectificación por enlace `wa.me` neutral; verificación manual contra correo HMAC **con la versión persistida**, válida tras rotar (§2.1); ≤ 10 días hábiles (consultas) y ≤ 15 (reclamos); sin token ni documento de identidad (A3/DD-MVP-22).
- Menor detectado ⇒ borrado de reseña, correo HMAC y metadatos; excepción explícita a conservar evidencia de consentimiento (A5).
- Redes con `new URL()`, `protocol === 'https:'` y hostname exacto; sin IDs internos en JSON público ni enlaces de usuarios en reseñas (H-9).

---

## 10. Referencias

- [Design Doc MVP](../02-arquitectura/design-doc-mvp.md) — fuente de verdad del alcance y de las 22 decisiones `DD-MVP`.
- [ADR-MVP-001](../02-arquitectura/adr-mvp/ADR-MVP-001.md), [002](../02-arquitectura/adr-mvp/ADR-MVP-002.md), [003](../02-arquitectura/adr-mvp/ADR-MVP-003.md), [004](../02-arquitectura/adr-mvp/ADR-MVP-004.md), [005](../02-arquitectura/adr-mvp/ADR-MVP-005.md).
- [Requisitos MVP](../01-requisitos/mvp-requisitos.md) — el «qué» aprobado.
- `docs/07-infra/checklist-lanzamiento.md` — **no aplica al MVP** (diseño transaccional).
- `docs/07-infra/arquitectura-despliegue.md:284-297` — variables **no heredadas**.
