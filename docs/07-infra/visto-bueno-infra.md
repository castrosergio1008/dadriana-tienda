# Visto bueno de infraestructura — Adriana Tienda

| Campo | Valor |
|---|---|
| **Emisor** | `forge-infra` (Plataforma e Infraestructura, APEX FORGE) |
| **Fecha** | 23 de noviembre de 2026 |
| **Veredicto** | **APROBADO DE DISEÑO** (diseño de infraestructura y costes) |
| **Alcance** | Cierre de **C-09** (TRM, costes, comisión de pasarela sin IVA y PITR) y **C-12** (precedencia del Design Doc y enlaces) dentro de `docs/07-infra/` |
| **Autoridad aplicada** | [decisiones-comandante.md](../02-arquitectura/decisiones-comandante.md) (tabla ejecutoria) y [design-doc.md](../02-arquitectura/design-doc.md) como Diseño canónico (absorbe al raíz `DESIGN_DOC.md` v1.0) |
| **Originado por** | REQUEST CHANGES en [lgtm-documentacion.md](../08-review/lgtm-documentacion.md) |

> **Advertencia explícita:** esta es una aprobación de **diseño**, **NO** de despliegue real,
> NO de go-live y NO de contratación. Ningún deploy queda autorizado por este documento: el
> go-live requiere el checklist en verde, las firmas de `forge-reviewer`, `forge-sentinel`,
> `forge-qualis` y la firma final del Comandante `apex-forge`. Tampoco sustituye las decisiones
> C-01…C-08 ni C-10/C-11, que permanecen bajo sus dueños.

---

## 1. Hosting recomendado (aprobado en diseño)

**Recomendación: Vercel + Neon São Paulo + Cloudflare**, tal como se justifica en
[analisis-hosting.md §7](analisis-hosting.md) (matriz ponderada: 9,05 frente a 8,26 de la
siguiente mejor opción).

| Capa | Elección | Razón de la firma |
|---|---|---|
| Web / SSR | **Vercel Pro** (2 seats) | Ajuste a Next.js 15, preview por PR, rollback instantáneo |
| Base de datos | **Neon Launch, Postgres 16, `aws-sa-east-1` (São Paulo)** | Latencia ~40–90 ms desde Colombia, PITR 7 días, scale-to-zero |
| Edge / DNS / WAF / media | **Cloudflare Pro + R2** | POP BOG, WAF/bot management, egress sin coste |
| Caché / colas | Upstash Redis | Sin servidores que administrar |
| Búsqueda | Meilisearch Cloud (alternativa Fase 2 en Hetzner) | Reconstruible desde Postgres |
| Worker | Fly.io, contenedor reproducible | Imagen etiquetada por SHA/tag, sin `latest` |
| Observabilidad | Sentry + Vercel Analytics + Better Stack (+ UptimeRobot) | Errores, CWV, logs, uptime y on-call |

Topología detallada en [arquitectura-despliegue.md](arquitectura-despliegue.md); pipeline,
gates y rollback en [plan-despliegue.md](plan-despliegue.md); SLOs y alertas en
[monitoreo-y-alertas.md](monitoreo-y-alertas.md).

---

## 2. Coste mensual estimado corregido

TRM única de planeación: **COP 4.000/USD** (estimación; se actualizará con la **TRM vigente
el día de firma**). El valor 3.317/USD de `cotizacion/` es cotización referencial del
proveedor y **no se usa en el presupuesto** (C-09). Desglose completo en
[presupuesto.md](presupuesto.md).

| Horizonte | USD/mes (base) | COP/mes a TRM 4.000 | Observación |
|---|---:|---:|---|
| Meses 1–3 | **334** (rango 250–470) | **1.336.000** (1,0–1,88 M) | Plataforma completa; sin comisión de pasarela ni envíos |
| Meses 4–12 | **412** (rango 350–500) | **1.648.000** (1,4–2,0 M) | Crecimiento y mayor volumen de mensajería/facturación |
| Campañas | +40–120 adicionales | +160.000–480.000 | Picos temporales |
| One-time | 62–962 | 248.000–3.848.000 | Dominio, DIAN y auditoría opcional |
| Variable (1.000 pedidos) | **≈1.194** | **≈4.775.000** | Comisión de pasarela **sin IVA**, 3,59% sobre el 70% del GMV |

**Comisión sin IVA (C-09):** los importes publicados (COP 6.825 sobre un ticket de
COP 190.000 ≈ 3,59%) son previos a IVA. Se eliminaron el ajuste de impuesto y el rótulo de
impuesto incluido para evitar doble conteo. Take rate resultante: **3,59% del GMV pagado con
tarjeta/PSE** y
**≈2,51% del GMV total**; objetivo < 3,7% del GMV pagado, monitorizado en
`monitoreo-y-alertas.md`.

**No incluido en la base:** PITR de 30 días (+USD 50–100/mes, ver §3), standby en segunda
región (Fase 2, +USD 40–90/mes), impuestos/retenciones de facturación de proveedores y horas
de ingeniería.

---

## 3. Decisión PITR (C-09)

**MVP aprobado en diseño: PITR de 7 días + dump frío diario con retención de 30 días**, con
copias semanales (90 días) y mensuales (12 meses) como capas adicionales. RPO ≤ 5 min y
RTO ≤ 60 min se mantienen; el restore real en entorno aislado es condición de go-live.
Detalle en [backups-y-recuperacion.md §2 y §4](backups-y-recuperacion.md).

La ampliación a **PITR de 30 días** (USD 50–100/mes / COP 200.000–400.000, según plan)
queda como **mejora aprobable por el cliente**, **NO como requisito bloqueante** del MVP ni
del lanzamiento. Si se aprueba, se revisa el plan de Neon o se evalúa RDS Multi-AZ; no está
presupuestada en las cifras de la §2.

---

## 4. Condiciones para el go-live (no concedidas por esta firma)

| # | Condición | Dueño | Evidencia |
|---:|---|---|---|
| 1 | **Dominio definitivo** con DNS autoritativo en Cloudflare, TLS válido y `www`/`admin`/`api`/`staging`/`status` como código | `forge-infra` | Registros y certificados verificados en [checklist-lanzamiento.md](checklist-lanzamiento.md) §B |
| 2 | **Titularidad de cuentas** Vercel, Neon, Cloudflare y Wompi definida por escrito (dueño, facturación, MFA y roles), sin credenciales compartidas ni secretos en el repo | Comandante + `forge-sentinel` | Nombres de roles y auditoría de accesos |
| 3 | **Rollback probado**: alias a deployment anterior < 5 min, imagen previa del worker con replay de outbox y restore PITR real ejecutado con resultado OK | `forge-infra` | [plan-despliegue.md](plan-despliegue.md) §7 + registro de [backups-y-recuperacion.md](backups-y-recuperacion.md) §8 |
| 4 | **Canary firmado por `forge-qualis`**: 5% / 24 h → 25% / 24 h → 100%, con SLOs en verde, rollback listo en cada ventana y monitoreo reforzado 72 h | `forge-qualis` | Plan de pruebas y acta de canary |
| 5 | CI en verde + LGTM de `forge-reviewer`; cobertura y gates de calidad sin regresión; secretos sólo en GitHub Environments/Vercel | `forge-infra` + `forge-reviewer` | Checks requeridos en `main` |
| 6 | TRM de cierre recalculada con la vigente el día de firma; PITR 7 días + dump 30 días activos y verificados | Comandante + `forge-infra` | Presupuesto revisado y acta de restore |

La ausencia de cualquiera de estas condiciones es **NO-GO** para abrir el checkout al público
(checklist §2). Se permite catálogo en solo lectura con `checkout_enabled=false`.

---

## 5. Verificación aritmética de esta enmienda

| Comprobación | Resultado |
|---|---|
| Matriz de decisión (pesos suman 100%) | 9,05 / 8,26 / 6,94 / 7,20 / 4,91 — **cuadra** |
| Análisis de sensibilidad | Opción 1 = 8,88; VPS = 5,63; RDS = **7,68** (se corrigió el 8,10 publicado, que no cuadraba) |
| Presupuesto meses 1–3 | 40+25+15+40+25+5+15+20+26+20+0+30+70+3+0 = **334 USD** → **1.336.000 COP** |
| Presupuesto meses 4–12 | 40+35+20+40+25+8+20+30+26+25+0+50+90+3+0 = **412 USD** → **1.648.000 COP** |
| Costes one-time | 12 + (50–150) + (300–800) = **62–962 USD** → 248.000–3.848.000 COP |
| Comisión de pasarela | 190.000.000 × 70% × 3,59% = **4.774.700 COP ≈ 1.194 USD**; ≈2,51% del GMV total |
| TRM | 334 × 4.000 = 1.336.000; 412 × 4.000 = 1.648.000; (50–100) × 4.000 = 200.000–400.000 |

---

## 6. Firma

| Rol | Nombre | Estado | Fecha |
|---|---|---|---|
| `forge-infra` | `<NOMBRE>` | **APROBADO DE DISEÑO** — C-09 y C-12 cerrados en `docs/07-infra/` | 23-nov-2026 |

**Límite de la firma:** aprueba el diseño de hosting, costes, TRM y política de backups; no
autoriza despliegues, no contrata proveedores y no sustituye el visto bueno de `forge-sentinel`
(datos, auth y pagos) ni la firma de liberación de `forge-qualis` y del Comandante. Las
decisiones C-04 y C-05 siguen bajo sus dueños y deben estar propagadas en los artefactos
correspondientes antes del release.
