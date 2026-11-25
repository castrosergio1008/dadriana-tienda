# Adriana Tienda — Plan Maestro APEX FORGE

> **Estado del proyecto:** Fase 1 (Diseño) **APROBADA** el 24 de nov de 2026 · Design Doc `Approved` · LGTM 21/21 · **aún no se ha escrito código de producción** · listo para Fase 2
> **Fecha:** 23 de noviembre de 2026
> **Regla de oro:** no se escribe ni una línea de código de producción hasta que el Design Doc pase a **Approved**. Los esquemas, contratos y maquetas de este repositorio son artefactos de diseño, no implementación.
> **Fuente de decisiones:** `docs/02-arquitectura/decisiones-comandante.md` (C-01…C-15). Ante cualquier conflicto, manda ahí.

---

## 1. Panorama ejecutivo

El prototipo aprobado se convierte en una tienda real para Colombia: belleza facial, capilar y corporal, en COP y español, con **dos sucursales físicas** tratadas como ciudadanos de primera clase.

| Lo que pediste | Lo que el equipo diseñó |
|---|---|
| Base sólida y profesional | Design Doc, 6 ADRs, 9 diagramas, matriz de 4 arquitecturas y decisión justificada |
| Documentar todo y definir requisitos | 81 requisitos funcionales, 32 no funcionales, 27 historias de diseño y un backlog de 42 historias / 280 puntos |
| Diagramas y escoger la mejor arquitectura | Monolito modular Next.js 15 + `packages/core` + PostgreSQL, ganador con 8,90/10 |
| Diseños con Tailwind y HTML | Sistema de diseño + wireframes + **10 maquetas estáticas** listas para abrir en el navegador |
| Wireframes de navegación | Mapa del sitio, 4 flujos de usuario y wireframes en 375 / 768 / 1440 px |
| Catálogo e imagen de marca | Identidad verde/dorada aprobada, guía fotográfica, fichas con **lotes y vencimientos (FEFO)** |
| Pasarela fácil, sin dolor | Wompi (checkout hospedado: tarjeta, PSE, Nequi, Daviplata, efectivo y BNPL), ePayco como plan B, **cero datos de tarjeta en nuestro servidor (SAQ-A)** |
| Control de pedidos | 11 estados canónicos, panel de operación, retiro en tienda, despacho y trazabilidad |
| Estructura de base de datos y modelos | ~50 tablas, ERD, diccionario, modelo Prisma documental, 38 reglas de negocio y 6 máquinas de estado |
| Seguridad desde el día 1 | 31 requisitos SEC, modelo STRIDE, cumplimiento Ley 1581, plan de incidentes y checklist de bloqueo |
| Asesoría de hosting y despliegue | Vercel + Neon (São Paulo) + Cloudflare, ~USD 334/mes, canary 5 % → 25 % → 100 %, rollback < 2 min |
| Metodología Scrum | Sprints quincenales, 17 semanas al MVP, DoR/DoD, 20 riesgos y métricas con fuente de datos |

---

## 2. Las decisiones que ya están tomadas

| # | Decisión | Por qué |
|---|---|---|
| D1 / C-01 | **Monolito modular** (Next.js 15 + `packages/core` + worker) en lugar de microservicios | Una sola transacción ACID resuelve reserva + pedido + idempotencia; extraer servicios después no reescribe el dominio |
| D2 | **Wompi** con checkout hospedado; ePayco detrás del mismo adaptador | Cubre PSE y billeteras colombianas, reduce fricción y nos mantiene en SAQ-A |
| D3 / C-01 | **Stock por sede con lotes y FEFO**: fuente de verdad `inventory_lots(lot_id, site_id)`, proyección `inventory_by_site` | Evita sobreventa y garantiza la trazabilidad exigible a cosméticos; vocabulario único `site_id` |
| D4 / C-02 | **Dinero en BIGINT centavos**, IVA 19 % = 1900 bp derivado por línea | Cuadra exacto con Wompi y evita errores de coma flotante |
| D6 / C-04 | **JWT de 15 min + refresh rotatorio** en cookies `httpOnly`, RBAC con ámbito de sede y MFA para Admin/Superadmin | Panel admin y dos tiendas requieren autorización en servidor, no solo en la UI |
| D7 / C-09 | **PostgreSQL (Neon) en São Paulo + Vercel + Cloudflare**, TRM de planeación 4.000, PITR 7 días + dump frío 30 días | Mejor equilibrio coste/latencia/escalado para Colombia; 9,05/10 en la matriz |
| D8 | **Scrum de 2 semanas, 17 semanas al MVP** | 8 sprints con incremento demostrable y beta cerrada en la semana 15 |
| C-03 | **Venta POS dentro del MVP** (`OPS-09`, Sprint 6) con su escenario E2E como gate de release | Es una de las tres razones de ser del modelo multi-sede |
| C-13 | **Sin estados residuales**: pago tardío ⇒ `PENDING_PAYMENT` + `reviewRequired`; envío ⇒ `OUT_FOR_DELIVERY` | Máquina de estados monotónica y única en todos los documentos |

---

## 3. Mapa de la documentación

### `01-requisitos/` — el qué vamos a construir
- `requisitos-funcionales.md` — RF-001 a RF-081 en 11 dominios, con prioridad MoSCoW.
- `requisitos-no-funcionales.md` — RNF-001 a RNF-032: rendimiento, accesibilidad, seguridad, disponibilidad.
- `historias-usuario.md` — 8 épicas y 27 historias con criterios de aceptación (perspectiva de diseño).

### `02-arquitectura/` — cómo lo vamos a construir
- `design-doc.md` — el documento rector (10 secciones + resumen ejecutivo).
- `decisiones-comandante.md` — **tabla maestra C-01…C-15**; manda en caso de conflicto.
- `opciones-arquitectura.md` — 4 opciones ponderadas y por qué gana la elegida.
- `diagramas.md` — C4, componentes, secuencias, estados y despliegue (Mermaid).
- `alcance-y-no-objetivos.md` — 20 cosas que **no** haremos en el MVP.
- `adr/ADR-001` … `ADR-006` — decisiones arquitecturales registradas.

### `03-disenos/` — lo que vas a ver
- `sistema-diseno.md` — paleta, tipografías, tokens, componentes y accesibilidad.
- `wireframes-navegacion.md` — mapa del sitio, flujos y wireframes por breakpoints.
- `guia-imagenes-contenido.md` — fotografía, especificaciones WebP, alt y tono de voz.
- `maquetas/` — **10 pantallas HTML + Tailwind**. Abre `maquetas/index.html` en el navegador para empezar; el `README.md` de la carpeta las enumera. Son maquetas de revisión: no tienen lógica ni son código de producción.

### `04-datos/` — la base de datos y las reglas
- `modelo-conceptual.md`, `modelo-logico-er.md`, `diccionario-datos.md`, `modelo-prisma-documental.md`.
- `maquinas-estado.md` — pedido, pago, reserva, envío, retiro y lote.
- `reglas-negocio.md` — RN-001 a RN-038 (precios, stock, cupones, reembolsos).
- `api-rest.md` — contrato `/api/v1` por dominios.
- `flujos-pagos.md` — pago, webhooks firmados, idempotencia y conciliación.
- `estrategia-datos.md` — migraciones, seeds, auditoría, retención y backups.

### `05-scrum/` — cómo trabajaremos
- `metodologia-scrum.md`, `backlog-inicial.md`, `plan-sprints.md`, `definicion-terminado.md`, `estrategia-pruebas.md`, `matriz-riesgos.md`, `metricas-exito.md`, `visto-bueno-qualis.md`.

### `06-seguridad/` — cómo no nos equivocamos
- `plan-seguridad.md`, `modelo-amenazas.md`, `requisitos-seguridad.md` (SEC-001…SEC-031), `cumplimiento-colombia.md`, `pagos-y-pci.md`, `plan-respuesta-incidentes.md`, `checklist-review.md`, `visto-bueno-diseno.md`.

### `07-infra/` — dónde vive y cómo se libera
- `analisis-hosting.md`, `arquitectura-despliegue.md`, `plan-despliegue.md`, `monitoreo-y-alertas.md`, `backups-y-recuperacion.md`, `checklist-lanzamiento.md`, `presupuesto.md`, `visto-bueno-infra.md`.

### `08-review/` — el gate de calidad
- `lgtm-documentacion.md` — review inicial (REQUEST CHANGES) y su re-review final.

---

## 4. Plan de entregas (Scrum)

| Sprint | Puntos | Objetivo |
|---|---|---|
| S0 | 11 | Cimentación: decisiones, entornos, diseño base, ruta crítica (Wompi, DIAN, sedes) |
| S1 | 31 | Catálogo base |
| S2 | 34 | Búsqueda, filtros, fichas de producto e `INV-01` |
| S3 | 34 | Carrito, checkout y retiro en tienda |
| S4 | 34 | Pagos, webhooks, facturación y confirmación |
| S5 | 39 | Pedidos, despacho e inventario **FEFO** (`INV-03`) |
| S6 | 34 | Inventario, transferencias y **venta POS** (`OPS-09`) |
| S7 | 34 | Cuenta de cliente, administración y **beta cerrada** |
| S8 | 29 | Seguridad, rendimiento, 21 E2E, canary 5 % → 25 % → 100 % y **go-live** |

Backlog total: **42 historias / 280 puntos**, estimación Fibonacci estricta. Las 27 historias / 151 puntos de `historias-usuario.md` son el núcleo de diseño; el listado completo y priorizado vive en `backlog-inicial.md`.

---

## 5. Lo que necesitamos que confirmes antes de escribir código

Decisiones de negocio que el equipo no puede tomar por ti. Usan IDs con prefijo `RM-Qn` para no colisionar con los `DD-Qn` del Design Doc. Las cuatro primeras son **ruta crítica** del Sprint 0.

| # | Decisión | Dueño | Cuándo |
|---|---|---|---|
| RM-Q1 | ¿Existe POS/ERP actual (Siigo, Alegra, World Office) que deba integrarse, o el registro de venta web reemplaza el proceso en el MVP? | Cliente | Sprint 0 |
| RM-Q2 | ¿Proveedor tecnológico DIAN y resolución de numeración vigentes? ¿Quién asume el coste? | Cliente + Finanzas | Sprint 0 |
| RM-Q3 | ¿Quién posee/paga Vercel, Neon, Cloudflare y Wompi y cuál es el dominio definitivo? | Cliente | Sprint 0 |
| RM-Q4 | ¿Quién ejerce formalmente como Product Owner y asiste al Sprint Review cada dos semanas? | Cliente | Sprint 0 |
| RM-Q5 | Confirmar redirect completo a Wompi (SAQ-A) y proscribir campos de tarjeta propios | Cliente + sentinel | Sprint 1 |
| RM-Q6 | Umbrales de negocio: envío gratis (COP 150.000), monto máximo de contraentrega y TTL de reserva (30 min) | Cliente | Sprint 1 |
| RM-Q7 | ¿Se permite dividir un envío a domicilio entre las dos sedes en el MVP? | Cliente + Operación | Sprint 3 |
| RM-Q8 | Titularidad de datos, política de privacidad, decisión RNBD y plazos de retención con contador/abogado | Cliente + legal | Sprint 1 |

**Ya cerradas por el Comandante:** FEFO y vencimientos (C-01), PITR y TRM (C-09), MFA de vendedores diferida a Fase 2 con sesión de tablet de 8 h (C-04).

---

## 6. Ruta crítica y próximos pasos

1. **Obtener RM-Q1…RM-Q4** — sin POS/DIAN/cuentas/dominio, catálogo → checkout → pago → factura se desplaza semana por semana.
2. ~~LGTM final del Gatekeeper y aprobación del Design Doc~~ — ✅ **hecho el 24 de nov de 2026** (`docs/08-review/re-review-final.md`).
3. **Obtener las respuestas pendientes** RM-Q1…RM-Q8 y abrir el Sprint 0: sandbox de Wompi, cuenta de transportadora, datos de las dos sedes y entornos Vercel/Neon.
4. **Fase 2 ya autorizada**: planificación detallada y construcción por `forge-frontend` y `forge-backend`, con tests del que construye, review obligatorio y CI en verde.

> **Nota de proceso:** nadie aprueba su propio trabajo. Todo cambio necesita LGTM de `forge-reviewer`; los cambios que tocan pagos, datos personales o privilegios necesitan además el OK de `forge-sentinel`. No se hace commit ni push sin tu autorización explícita.
