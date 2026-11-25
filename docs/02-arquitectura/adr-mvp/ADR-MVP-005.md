# ADR-MVP-005 — Despliegue, entornos protectores y CI/CD del MVP

| Campo | Valor |
|---|---|
| **ID** | `ADR-MVP-005` |
| **Estado** | **Proposed** — pendiente de `forge-infra`, `forge-sentinel`, `forge-reviewer` y `apex-forge` |
| **Fecha** | 25 de noviembre de 2026 |
| **Decisores** | `forge-architect` + `forge-infra` + `apex-forge` |
| **Relacionado** | `DD-MVP-13`, `DD-MVP-15`, `DD-MVP-18`, `DD-MVP-20`, `DD-MVP-21`, `DD-MVP-22`, [Design Doc MVP §8.2 y §10](../design-doc-mvp.md), [Runbook MVP](../../07-infra/runbook-mvp.md), A1/A2/A4/A6/A7/A8, F-1…F-9 |

## Contexto

El MVP se despliega en el proyecto de Vercel **`dadriana-tienda`** sobre el repositorio `git@github.com:castrosergio1008/dadriana-tienda.git` (rama `main`). Hoy **no hay dominio propio** (Q-MVP-04 abierta), por lo que el canonical temporal es `https://dadriana-tienda.vercel.app`. Los hallazgos de `forge-infra` (F-1…F-9) y los arbitrajes del Comandante (A1, A2, A6, A7, A8) exigen dejar por escrito la configuración de entornos, la protección de Production pre-go-live, el inventario cerrado de variables y el pipeline de CI/CD, en lugar de depender de clics en la consola o de supuestos heredados del diseño transaccional.

El diseño anterior define un despliegue con pagos, DIAN, GA4, Sentry, canary 5/25/100 y SLO 99,9 % / 43,2 min. Esas decisiones **no aplican** al MVP (N-MVP-01/03/17, QA-07): no hay transacciones, no hay analítica de personas y el volumen esperado no justifica banderas de despliegue.

## Decisión

1. **Configuración de Vercel versionada (F-2):** Framework Preset `Next.js`, Root Directory `.`, Production Branch `main`, **PR Previews ON** y **Deployment Protection ON en Previews y en Production pre-go-live**. Los valores viven en `vercel.json` y en el runbook; la consola solo verifica, no es fuente de verdad. Previews usan **Vercel Authentication/SSO**, sin contraseñas compartidas.
2. **Inventario cerrado de variables (A1 + excepción autorizada DD-MVP-21, F-4/F-5):** `NEXT_PUBLIC_SITE_URL` (pública, canonical temporal), `DATABASE_URL` (secreta) y **`REVIEW_HASH_PEPPER` (secreta, excepción explícita al Comandante)**, exclusiva de Vercel Encrypted Environment Variables; no es pública, no va en `app_config` ni se commitea, y `.env.example` solo contiene `<VALUE>`. La `DATABASE_URL` de **Preview sí existe**, siempre con datos ficticios y aislados; la de **Production no se crea** hasta el checklist de 10 pasos. Se eliminan `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_INSTAGRAM_URL` y `NEXT_PUBLIC_FACEBOOK_URL`: si ya están en la consola, **no se usan y pueden borrarse**. **No se heredan** las variables de pago, DIAN, GA4 ni Sentry de `docs/07-infra/arquitectura-despliegue.md:284-297`. La rotación del pepper (DD-MVP-22) conserva la versión anterior como `REVIEW_HASH_PEPPER_PREVIOUS` solo durante la ventana, rehashea en escritura/lectura y registra fecha + versión + responsable en el runbook; la verificación de baja/rectificación usa la versión persistida en `reviews`.
3. **Producción protegida hasta go-live (A2/H-6/F-1/F-6):** Deployment Protection y `X-Robots-Tag: noindex` activos en Production mientras no se cierren Q-MVP-03/04/08 y se cree `DATABASE_URL` de Production. No se publica contenido indexable ni se habilita el formulario público antes de eso.
4. **Cabeceras y configuración como código (A6/H-4/F-7/H-10/F-3):** `next.config.*` y `vercel.json` fijan `poweredByHeader: false`, CSP `report-only` con `report-uri` sin PII y criterio documentado de promoción a `enforce` (7 días sin violaciones, E2E verde y LGTM de `forge-sentinel` + `forge-infra`), `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `upgrade-insecure-requests` y HSTS verificado con `curl -I` en el host temporal y en el dominio definitivo.
5. **CI/CD del MVP = fases 2–8 del pipeline APEX FORGE del MVP (F-8/F-9), NO el producto Fase 2.** Workflow en `.github/workflows/` con jobs `lint`, `typecheck`, `unit`, `integration` (PostgreSQL efímera por job con fixtures sintéticas), `build`, `gitleaks` y `bundle budget`; la promoción a Preview ejecuta E2E y axe. `main` protegido: PR + required checks en verde + 1 LGTM de `forge-reviewer`; cambios en datos, secretos o cabeceras requieren además OK de `forge-sentinel`. Sin autoaprobación del autor. `CODEOWNERS` por rutas. Preferir integración Git de Vercel; `VERCEL_TOKEN` solo como GitHub Secret si hiciera falta, nunca en el repo ni en logs.
6. **Versión y observabilidad (A7/A8):** Next fijado `>=15.5.29 <16`; migrar a 16 solo con ADR nuevo en Fase 2. Monitorización con logs estructurados y `requestId`, 5xx y Speed Insights; **sin alerta de apertura de `wa.me`**, sustituida por sonda E2E sintética sin PII por release.
7. **Rollout y recuperación (QA-06/QA-07):** despliegue directo desde `main`, sin canary del diseño anterior. Rollback objetivo < 2 min con disparadores (5xx sobre SLO o reseña pendiente visible), smoke post-rollback en 7 superficies y acta cronometrada; sin acta no hay Go-Live. SLO 99,5 % / 30 días ≈ 216 min con *feature freeze* si se consume > 50 % en la primera quincena.
8. **Procedimiento operativo:** [`docs/07-infra/runbook-mvp.md`](../../07-infra/runbook-mvp.md). `docs/07-infra/checklist-lanzamiento.md` pertenece al diseño transaccional y **no aplica al MVP**.

## Consecuencias

**Positivas**

- La configuración es auditable por diff: no hay deriva silenciosa entre consola y repositorio.
- Previews con datos ficticios permiten probar sin exponer contenido real; Production protegida evita publicar antes de tiempo.
- El pipeline versionado hace cumplir las fases 2–8 del APEX FORGE sin codear el producto de Fase 2.
- La ausencia de variables heredadas reduce secretos y superficie de cumplimiento (SEC-MVP-021/-024…026).
- Rollback simple y medible, adecuado a una vitrina sin transacciones.

**Negativas / costes aceptados**

- Mantener protección y `noindex` retrasa la indexación hasta resolver Q-MVP-03/04/08: es deliberado.
- Sin canary, un despliegue defectuoso afecta al 100 % del tráfico; se compensa con rollback < 2 min, smoke de 7 superficies y acta.
- La integración Git de Vercel concentra el despliegue en `main`: exige disciplina de required checks y CODEOWNERS.
- La migración a Next 16 queda como deuda vigilada con ADR propio en Fase 2.

## Alternativas evaluadas

| Alternativa | Por qué se rechaza |
|---|---|
| **Configurar todo con clicks en la consola, sin `vercel.json` ni runbook** | No es reproducible ni revisable; F-2 exige configuración versionada y `forge-reviewer` no podría verificarla. |
| **Heredar las variables de pago/DIAN/GA4/Sentry del diseño anterior** | Viola N-MVP-01/03/17 y los bloqueantes SEC-MVP-024…026; además introduce secretos sin uso (F-4/F-5). |
| **Publicar Production sin protección con datos ilustrativos para «ver avances»** | A2 prohíbe contenido indexable y formulario público antes de cerrar Q-MVP-03/04/08 y crear `DATABASE_URL`; SEC-MVP-007 quedaría expuesto. |
| **Canary 5 % → 25 % → 100 % y SLO 99,9 % del diseño anterior** | Copia decisiones de un producto transaccional que no existe en el MVP; QA-07 fija 99,5 %/216 min y rollout directo (F-11). |
| **Alertar la apertura del enlace `wa.me` con telemetría propia** | No hay endpoint ni telemetría de servidor: sería una alerta falsa. A8 la sustituye por sonda E2E sin PII. |

## Estado

**Proposed.** Requiere OK de `forge-infra` (configuración, entornos y CI/CD), `forge-sentinel` (variables, excepción `REVIEW_HASH_PEPPER`, cabeceras y protección), `forge-qualis` (rollback, SLO y sonda) y LGTM de `forge-reviewer`; la aprobación final corresponde a `apex-forge`. Ningún cambio en este ADR autoriza por sí solo crear la `DATABASE_URL` de Production ni retirar la protección.
