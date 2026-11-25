# Análisis de hosting — Adriana Tienda

| Campo | Valor |
|---|---|
| **Proyecto** | Adriana Tienda — e-commerce de belleza (Colombia) |
| **Autor** | `forge-infra` (Plataforma e Infraestructura, APEX FORGE) |
| **Estado** | Propuesta para decisión del Comandante `apex-forge` |
| **Fecha** | 23 de noviembre de 2026 |
| **Relación** | Diseño canónico: [design-doc.md](../02-arquitectura/design-doc.md) (absorbe el raíz `DESIGN_DOC.md` v1.0, decisión C-12). Complementos: [§3.2 RNF](../02-arquitectura/design-doc.md#32-no-funcionales), [§4.1 arquitectura](../02-arquitectura/design-doc.md#41-arquitectura-general), [§8 rollout y rollback](../02-arquitectura/design-doc.md#8-rollout-y-rollback), [presupuesto.md](presupuesto.md) |
| **Tipo de documento** | Diseño de infraestructura. **No contiene código de producción.** |

---

## 1. Propósito y alcance

El cliente pidió explícitamente asesoría en **la escogencia del hosting y el despliegue**. Este
documento responde esa pregunta con una comparativa ponderada de cinco alternativas reales,
una recomendación accionable y las condiciones bajo las cuales esa recomendación debe
revisarse. Los documentos complementarios están en `docs/07-infra/`:

| Documento | Contenido |
|---|---|
| `arquitectura-despliegue.md` | Topología, ambientes, DNS/TLS y caché |
| `plan-despliegue.md` | Pipeline, gates, release y rollback |
| `monitoreo-y-alertas.md` | Métricas, SLOs, umbrales y canales |
| `backups-y-recuperacion.md` | PITR, RPO/RTO y escenarios de desastre |
| `checklist-lanzamiento.md` | Go/No-Go y seguimiento 24/72 h |
| `presupuesto.md` | Costes por ambiente y servicio, meses 1–3 y 4–12 |

> **Convención monetaria (C-09):** todos los USD son estimaciones de mercado consultadas en
> noviembre de 2026 y deben verificarse al contratar. La **única TRM de planeación es
> COP 4.000/USD**, coherente con [presupuesto.md §1](presupuesto.md#1-supuestos) y con la
> [decisión C-09](../02-arquitectura/decisiones-comandante.md#c-09--costes-trm-y-pitr-resuelve-q11q12-m2).
> El documento comercial `cotizacion/` registró **COP 3.317/USD como cotización referencial
> del proveedor: NO se usó para calcular el presupuesto**. Todas las cifras son estimaciones y
> **se actualizarán con la TRM vigente el día de firma**.

---

## 2. Perfil de carga y requisitos que condicionan la decisión

| Dimensión | Valor previsto | Implicación de infraestructura |
|---|---|---|
| Tráfico inicial | 20.000–50.000 sesiones/mes, ~70% móvil | CDN + ISR desde el día uno; compute serverless barato |
| Picos | Hot Sale, Black Friday, Navidad (3–5× el tráfico base) | Escalado automático sin intervención; colas para picos de pago |
| Catálogo | 300–800 SKUs, ~5.000 imágenes con derivados | Storage de objetos con egress barato + transformación de imágenes |
| Pedidos | 500–1.500/mes, AOV COP 190.000 | Webhooks idempotentes, outbox, reintentos; no requiere microservicios |
| Procesos | `web` (Next.js 15, Node runtime con Prisma) + `worker` (BullMQ/Node 22) | Dos targets de despliegue con estrategias distintas |
| Datos | PostgreSQL transaccional, Redis, Meilisearch | PITR indispensable; búsqueda reconstruible desde DB |
| Región de usuarios | Colombia, con dos sucursales físicas | Latencia percibida desde Bogotá/Medellín es un criterio de primer orden |
| Cumplimiento | Ley 1581, Ley 1480, facturación DIAN, SAQ-A (pagos) | No tocar PAN; logs sin PII; retención y auditoría demostrables |
| Equipo | ~4,7 FTE de producto; DevOps parcial | Minimizar carga operativa: **managed services por encima de control total** |

**Requisitos no negociables para cualquier opción:** rollback verificable en < 5 min,
PITR con punto de restauración <= 5 min, secretos en variables de entorno/CI, CI en verde
antes de desplegar, y un entorno de staging con datos anonimizados.

---

## 3. Metodología de la matriz de decisión

- Criterios ponderados con pesos que suman **100%**, derivados de los requisitos anteriores.
- Cada opción se califica de **1 (deficiente) a 10 (excelente)**.
- Puntuación total = Σ(peso × calificación). Máximo teórico = 10,0.
- Las calificaciones son juicios de ingeniería para **este caso concreto**; no son rankings
  universales de proveedores.
- Coste = coste total estimado de la plataforma (web + DB + caché + búsqueda + media + WAF +
  worker + observabilidad básica). **No incluye** comisión de pasarela, envíos, facturación
  DIAN ni horas de ingeniería (salvo el aviso correspondiente en la opción 5).

| Criterio | Peso | Por qué pesa así |
|---|---:|---|
| Coste inicial (setup/migración) | 10% | Presupuesto de lanzamiento acotado |
| Coste mensual | 15% | Gasto recurrente de una pyme; impacto directo en margen |
| Latencia desde Colombia | 15% | 70% móvil y CWV son ventaja competitiva explícita |
| Escalado automático | 15% | Campañas con picos 3–5× sin intervención manual |
| Backups / PITR | 12% | Datos transaccionales; RPO/RTO agresivos |
| DX / ajuste a Next.js 15 | 12% | RSC, ISR, preview deploys: el stack ya está decidido |
| CI/CD y rollback | 10% | Cultura APEX: CI verde, deploys pequeños, reversibilidad |
| Soporte | 5% | Relevante en incidentes de campaña |
| Cumplimiento (DIAN/SAQ-A/privacidad) | 3% | Lo resuelve la arquitectura, no el hosting |
| Riesgo de vendor lock-in | 3% | Mitigado con estándares (Postgres, S3-compatible, contenedores) |

---

## 4. Matriz de decisión ponderada

| Criterio (peso) | (1) Vercel + Neon/Supabase | (2) Vercel + RDS (AWS) | (3) Railway/Render todo-en-uno | (4) Netlify + Supabase | (5) VPS/Hetzner + Docker |
|---|---:|---:|---:|---:|---:|
| Coste inicial (10%) | 9 → 0,90 | 6 → 0,60 | 9 → 0,90 | 8 → 0,80 | 4 → 0,40 |
| Coste mensual (15%) | 8 → 1,20 | 6 → 0,90 | 8 → 1,20 | 7 → 1,05 | 9 → 1,35 |
| Latencia Colombia (15%) | 9 → 1,35 | 9 → 1,35 | 6 → 0,90 | 7 → 1,05 | 6 → 0,90 |
| Escalado automático (15%) | 10 → 1,50 | 8 → 1,20 | 7 → 1,05 | 8 → 1,20 | 3 → 0,45 |
| Backups / PITR (12%) | 9 → 1,08 | 9 → 1,08 | 6 → 0,72 | 6 → 0,72 | 3 → 0,36 |
| DX / Next.js 15 (12%) | 10 → 1,20 | 10 → 1,20 | 7 → 0,84 | 7 → 0,84 | 4 → 0,48 |
| CI/CD y rollback (10%) | 10 → 1,00 | 10 → 1,00 | 7 → 0,70 | 8 → 0,80 | 4 → 0,40 |
| Soporte (5%) | 8 → 0,40 | 9 → 0,45 | 6 → 0,30 | 7 → 0,35 | 3 → 0,15 |
| Cumplimiento (3%) | 8 → 0,24 | 9 → 0,27 | 6 → 0,18 | 7 → 0,21 | 5 → 0,15 |
| Lock-in (3%) | 6 → 0,18 | 7 → 0,21 | 5 → 0,15 | 6 → 0,18 | 9 → 0,27 |
| **TOTAL** | **9,05** | **8,26** | **6,94** | **7,20** | **4,91** |

**Lectura:** la opción 1 gana con margen (9,05 vs 8,26). RDS es un segundo välido y
casi empatado en latencia, pero penalizado por coste y carga operativa. El todo-en-uno y
Netlify pierden por DX con Next.js 15 y por PITR. El VPS es el más barato en la factura y
el peor en coste total de propiedad.

**Análisis de sensibilidad.** Si se invierte la prioridad hacia coste (coste mensual 30%,
coste inicial 15%, latencia 15%, escalado 10%, backups 10%, DX 8%, CI/CD 7%, soporte 3%,
cumplimiento 1%, lock-in 1%), la opción 1 sigue liderando (8,88) frente a VPS (5,63) y
RDS (7,68; corrección aritmética de la cifra 8,10 publicada). La recomendación **no depende
de ponderar el coste por encima de la velocidad**.

---

## 5. Análisis detallado por opción

### 5.1 Opción 1 — Vercel + Neon (o Supabase) — **RECOMENDADA**

| Aspecto | Detalle |
|---|---|
| Web | Vercel Pro (2 seats), ISR/PPR nativo, preview por PR, rollback instantáneo |
| DB | **Neon Launch en `aws-sa-east-1` (São Paulo)**; Postgres 16, scale-to-zero, PITR 7 días (MVP, C-09) |
| Resto del stack | Upstash Redis, Meilisearch Cloud, Cloudflare (DNS/WAF/CDN) + R2, worker en Fly.io |
| Coste mensual estimado | **USD 250–470** (línea base planeada ≈ USD 334 ≈ **COP 1,34 M** a TRM 4.000) |
| Coste inicial | Bajo: conectar GitHub, variables de entorno, `prisma migrate deploy`. Sin servidores que aprovisionar |
| Latencia estimada desde Colombia | Cache hit en POP de Cloudflare: ~10–25 ms; DB en São Paulo: ~40–90 ms (validar con RUM) |
| Escalado | Serverless automático para `web`; Neon escala compute y puede dormir; colas absorben picos |
| PITR | **MVP (C-09): PITR 7 días + dump frío diario con retención 30 días.** Ampliar a PITR de 30 días (USD 50–100/mes) es mejora aprobable por el cliente, **no requisito bloqueante**; ver [backups-y-recuperacion.md §2](backups-y-recuperacion.md#2-inventario-y-política-de-backups) |

**Pros:** ajuste perfecto con Next.js 15 (RSC/ISR/Server Actions), preview deploy por PR,
rollback en < 2 min, región `sa-east-1` disponible en Neon, coste predecible a bajo volumen,
cero mantenimiento de servidores.

**Contras:** dependencia de Vercel para el runtime (mitigada por estándares: Next.js se
puede ejecutar en Node/Docker); costes de uso crecen con tráfico y funciones; la ventana de
PITR de 7 días se complementa con el dump frío diario de 30 días aprobado en C-09 (ampliar a
30 días de PITR es mejora opcional, no bloqueante).

**Cuándo elegirla:** es el escenario previsto. Cubre MVP y crece hasta ~100k sesiones/mes y
~5.000 pedidos/mes sin cambiar de arquitectura.

> Nota sobre Supabase: es una alternativa dentro de esta opción, pero su plan Pro (USD 25)
> incluye **backups diarios con 7 días de retención**; el add-on de PITR tiene coste
> adicional relevante (≈ USD 100/mes para 7 días según tarifa pública consultada). Para un
> sistema transaccional con RPO de minutos, **Neon resulta más conveniente en este caso**.

### 5.2 Opción 2 — Vercel + PostgreSQL administrado en AWS RDS

| Aspecto | Detalle |
|---|---|
| Web | Igual que la opción 1 |
| DB | RDS PostgreSQL en `sa-east-1`, `db.t4g.small`, Multi-AZ; snapshots automáticos + PITR |
| Coste mensual estimado | **USD 280–520** (≈ COP 1,12–2,08 M) |
| Latencia | Equivalente a Neon en región; buena desde Colombia |
| Escalado | Vertical/manual por clase de instancia; sin scale-to-zero |
| PITR | Hasta 35 días, muy maduro; restore a nueva instancia |

**Pros:** el motor y las operaciones son estándar AWS; retención larga y auditoría
enterprise; soporte y documentación excelentes; útil si el negocio ya tiene cuenta AWS.

**Contras:** paga por instancia encendida 24/7 (sin scale-to-zero),Multi-AZ duplica coste;
más configuración (subnets, security groups, parámetros, backups, failover); requiere
conocimientos AWS que el equipo no tiene asignados en el MVP.

**Cuándo elegirla:** si aparece un requisito contractual de retención >= 30 días con PITR,
residencia en AWS, o si la organización ya posee cuenta AWS con descuentos por volumen.

### 5.3 Opción 3 — Railway / Render todo-en-uno

| Aspecto | Detalle |
|---|---|
| Web + worker + Postgres + Redis + búsqueda | Un solo proveedor PaaS, despliegue desde GitHub |
| Coste mensual estimado | **USD 200–400** (≈ COP 0,8–1,6 M) |
| Latencia | Dependiente de la región elegida (muchas veces US East): peor que São Paulo desde Colombia |
| Escalado | Parcialmente automático; límites de plan y cold starts en algunos servicios |
| PITR | Backup automático limitado; PITR no siempre incluido o con retención corta |

**Pros:** una sola factura y un solo panel; excelente DX inicial; el worker vive al lado de
Redis, simplificando BullMQ.

**Contras:** ecosistema Next.js menos optimizado que Vercel (ISR/PPR no son nativos igual);
riesgo de cambios de precio o condiciones del plan; sin caché en POP cercano a Colombia; rollback menos
instantáneo; PITR y WAF quedan incompletos frente al diseño.

**Cuándo elegirla:** prototipos, MVP internos o si el equipo quiere **un único proveedor** y
acepta migrar el frente a Vercel más adelante. No es la recomendación para un lanzamiento
comercial con picos de campaña.

### 5.4 Opción 4 — Netlify + Supabase

| Aspecto | Detalle |
|---|---|
| Web | Netlify Pro con Next.js mediante adaptador; funciones serverless |
| DB | Supabase Pro: Auth, Storage, Postgres, dashboards |
| Coste mensual estimado | **USD 260–520** (≈ COP 1,04–2,08 M); con PITR add-on, extremo alto |
| Latencia | Supabase ofrece región `sa-east-1` en algunos planes (verificar); Netlify sin POP en Bogotá |
| Escalado | Bueno para funciones; coste por invocaciones menos predecible |
| PITR | Backups diarios 7 días incluidos; PITR real es add-on de pago |

**Pros:** gran DX para marketing/landings y formularios; Supabase agrega auth y storage;
buena documentación.

**Contras:** Next.js 15 con RSC/ISR es ciudadano de primera clase en Vercel, no aquí;
el add-on de PITR encarece; dos consolas con responsabilidades solapadas (Auth en Supabase
frente a Auth propio en el diseño); riesgo de duplicar modelo de datos.

**Cuándo elegirla:** si el proyecto fuera principalmente sitio de contenido/landings con
poco checkout transaccional. No es este caso.

### 5.5 Opción 5 — VPS/Hetzner + Docker (autogestionado)

| Aspecto | Detalle |
|---|---|
| Todo | VPS CX21/CPX21 + Docker Compose, Postgres, Redis, Meilisearch, Traefik, backups propios |
| Coste mensual estimado (factura) | **USD 120–250** (≈ COP 0,48–1,0 M) |
| Coste real de propiedad | +0,2–0,4 FTE de plataforma ≈ **USD 1.200–2.400/mes no incluidos** |
| Latencia | Depende de la región; Hetzner no tiene presencia en LATAM (normalmente EU) → penalizado |
| Escalado | Vertical y manual; sin auto-scaling sin construirlo |
| PITR | Debe implementarse (WAL-G + object storage) y probarse |
| Lock-in | El más bajo: contenedores estándar y Postgres propio |

**Pros:** control total, coste de factura bajo, salida fácil, útil para cargas estables y
predecibles.

**Contras:** el equipo debe mantener SO, parches, TLS, backups, failover, observabilidad y
capacidad de campaña. Un error de configuración de Postgres o de backups es un incidente
Sev-1. La latencia desde Colombia es la peor de las cinco opciones.

**Cuándo elegirla:** como **entorno de búsqueda/indexación** (el diseño ya contempla
Meilisearch self-host en Hetzner como abaratamiento) o más adelante si el volumen hace
antieconómicos los managed services. No para el lanzamiento.

---

## 6. Comparativa de coste mensual (plataforma completa)

| Opción | USD/mes estimado | COP/mes aprox. (TRM 4.000) | Observación |
|---|---:|---:|---|
| 1. Vercel + Neon | 250–470 (plan 334) | 1,0–1,9 M (plan 1,34 M) | Óptima relación coste/velocidad |
| 2. Vercel + RDS Multi-AZ | 280–520 | 1,12–2,08 M | +retención y operación AWS |
| 3. Railway/Render | 200–400 | 0,8–1,6 M | Barato, pero sin ISR nativo ni POP cercano |
| 4. Netlify + Supabase | 260–520 | 1,04–2,08 M | PITR encarece la factura |
| 5. VPS/Hetzner | 120–250 + ingeniería | 0,48–1,0 M + ingeniería | El coste de persona domina el TCO |

> Estos rangos son **referencias de mercado a nov-2026**, no cotizaciones. Verificar planes,
> créditos incluidos, impuestos y tarifas por región antes de contratar. El desglose por
> servicio y ambiente está en [presupuesto.md](presupuesto.md).

---

## 7. Recomendación y justificación

**Recomendación: opción 1 — Vercel + Neon en `aws-sa-east-1`, con Cloudflare delante.**

Topología recomendada (detalle en `arquitectura-despliegue.md`):

| Capa | Elección | Razón |
|---|---|---|
| Web / SSR | Vercel Pro | Preview por PR, ISR/PPR, rollback < 2 min |
| CDN / WAF / DNS | Cloudflare Pro (POP BOG) | Corta la distancia al usuario, WAF y bot management |
| Base de datos | Neon Launch, Postgres 16, `aws-sa-east-1` | Latencia LATAM, PITR, scale-to-zero, sin administración |
| Caché / colas | Upstash Redis | Latencia sub-ms, sin servidores |
| Búsqueda | Meilisearch Cloud (alternativa: Hetzner en Fase 2) | Facetas y sinónimos en español |
| Media | Cloudflare R2 + Image Resizing | Egress sin coste, AVIF/WebP |
| Worker | Fly.io (o Railway) | Contenedor reproducible junto a Redis |
| Observabilidad | Sentry + Vercel Analytics + Better Stack | Errores, CWV reales y uptime/logs |

**Justificación en una frase:** es la única alternativa que al mismo tiempo maximiza el
ajuste al stack ya decidido (Next.js 15), minimiza la carga operativa de un equipo pequeño
y mantiene la base de datos a ~40–90 ms de los clientes colombianos, con rollback y PITR
listos desde el primer día.

**Barreras de seguridad para que la recomendación siga siendo válida:**

1. Presupuesto de alertas en Vercel/Neon/Cloudflare al 80% del presupuesto mensual.
2. PITR de 7 días + dump frío diario (30 días) con un restore real verificado antes del
   go-live (no basta con estar activo), según C-09.
3. Proveedor de pagos con adaptador alterno (ePayco) y flag de kill-switch.
4. Los deployments a producción pasan por CI verde + LGTM de `forge-reviewer`.

---

## 8. Triggers para revisar la decisión

| Señal | Acción |
|---|---|
| > 100k sesiones/mes o > 5.000 pedidos/mes sostenidos | Reevaluar plan Vercel/Neon y considerar RDS con reserva |
| Cliente aprueba la mejora de PITR a 30 días (USD 50–100/mes, C-09) | Subir Neon a Scale o migrar a RDS Multi-AZ; **opcional, no bloqueante para el MVP** |
| Factura de egress/compute > 1,5× lo previsto 2 meses seguidos | Auditar caché, imágenes y funciones; evaluar R2/VPS para búsqueda |
| Restricción legal de residencia de datos en Colombia | Evaluar proveedor local; hoy ninguna opción ofrece región en CO (Cloudflare BOG es solo CDN) |
| Caída repetida de la pasarela primaria | Activar plan B (ePayco) y revisar SLO de pagos con `forge-qualis` |
| Equipo de plataforma >= 1 FTE dedicado | Reevaluar autogestión parcial (VPS para worker/búsqueda) |

---

## 9. Estrategia de salida (anti-lock-in)

Aunque se recomienda Vercel + Neon, la arquitectura se diseña para poder cambiar:

| Dependencia | Mitigación |
|---|---|
| Vercel | Next.js estándar, sin APIs propietarias en el dominio; Dockerfile del worker; posibilidad de `next start` en contenedor |
| Neon | Postgres estándar + Prisma; export `pg_dump` semanal a R2; la cadena de conexión es una variable de entorno |
| Cloudflare | DNS y assets exportables; imágenes con `next/image` y fallback a R2 público |
| Meilisearch | `packages/core` no depende del motor; fallback a Postgres FTS / `pg_trgm` ya previsto |
| Wompi | Puerto/adaptador de pagos con ePayco implementado como plan B |
| Proveedor DIAN | Integración detrás de una interfaz; salida por export UBL/XML propio |

**Regla de oro:** ningún proveedor puede convertirse en el único lugar donde vive una
decisión de negocio (precios, reglas de stock, estado de pedido). Esos datos viven en
Postgres y en `packages/core`.

---

## 10. Fuentes y verificación

| Fuente | Uso | Verificada |
|---|---|---|
| [design-doc.md](../02-arquitectura/design-doc.md) §3.2, §4.1 y §8 + [presupuesto.md](presupuesto.md) | RNF/SLOs, stack, rollout y costes (C-12) | 23-nov-2026 |
| Documentación oficial Vercel (planes y pricing) | USD 20/seat/mes Pro con crédito de uso | nov-2026 |
| Documentación oficial Neon (planes, regiones, PITR) | `aws-sa-east-1`, PITR hasta 7 días en Launch | nov-2026 |
| Documentación oficial Supabase (pricing, PITR) | Pro USD 25, backups 7 días, PITR como add-on | nov-2026 |
| Documentación oficial AWS RDS / Hetzner / Cloudflare | Rangos de coste y regiones | nov-2026 |

> **Resuelto (C-09):** TRM única de planeación (COP 4.000/USD) y política de backups del MVP
> (PITR 7 días + dump frío diario con 30 días de retención). **Pendiente para el go-live:**
> titularidad de las cuentas de Vercel/Neon/Cloudflare/Wompi y recalcular la TRM con la vigente
> el día de firma. Ver [checklist-lanzamiento.md](checklist-lanzamiento.md) y
> [decisiones-comandante.md](../02-arquitectura/decisiones-comandante.md).
