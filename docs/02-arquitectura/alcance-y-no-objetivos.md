# Alcance del MVP y No-objetivos — Adriana Tienda

| Campo | Valor |
|---|---|
| **Autor** | `forge-architect` (Staff Engineer, APEX FORGE) |
| **Estado** | Draft — pendiente de aprobación del Comandante `apex-forge` |
| **Fecha** | 23 de noviembre de 2026 |
| **Decisiones aplicadas** | [decisiones-comandante.md](./decisiones-comandante.md) — C-01 (lotes/FEFO y `site_id`), C-03 (`OPS-09` en Sprint 6), C-04 (auth), C-12 (enlaces y precedencia) |
| **Relacionados** | [design-doc.md §2](./design-doc.md), [requisitos-funcionales.md](../01-requisitos/requisitos-funcionales.md), [historias-usuario.md](../01-requisitos/historias-usuario.md) |

> **Precedencia:** manda [decisiones-comandante.md](./decisiones-comandante.md); el [design-doc.md](./design-doc.md) (Draft) absorbe al `DESIGN_DOC.md` v1.0 de la raíz (C-12).

> **Principio:** un no-objetivo no es una promesa diferida disfrazada; es una decisión de no gastar esfuerzo hoy. Todo lo que se excluye tiene un motivo y, cuando aplica, una fase posterior donde se reevaluará con datos.

---

## 1. Lo que SÍ entra en el MVP (áncora de alcance)

Para que un recorte no desfigure el producto, estas son las líneas rojas **incluidas**:

| Área | Incluido en MVP | RF / HU |
|---|---|---|
| Storefront | Home, PLP con filtros y URL, PDP con variantes, búsqueda con autocompletado, carrito, checkout de una página, confirmación, tracking público | RF-001..RF-025 · HU-001..HU-008, HU-012 |
| **`sites` e inventario** | 2 `sites` configurables (etiqueta UI «sucursales»), **`inventory_lots` con FEFO** y proyección `inventory_by_site`, reservas TTL, click & collect, fulfillment por `site_id`, transferencias, ajustes y conteo | RF-048..RF-055, RF-057..RF-060, RF-078..RF-081 · `INV-01`, HU-015..HU-018 |
| **Venta en tienda** | Pedido POS web con `site_id` del vendedor, mismos catálogo y precios en centavos, historial unificado; **E2E gate de release** | RF-036, RF-041, RF-056 · `OPS-09` (8 pts, Sprint 6, depende de `INV-01`) |
| Pagos | Wompi (tarjeta, PSE, Nequi, Daviplata, efectivo, BNPL nativo), webhooks idempotentes, conciliación, ePayco como plan B en staging, COD con reglas | RF-026..RF-033 · HU-009..HU-011 |
| Pedidos | Máquina de estados, factura DIAN vía proveedor, guías y tracking, retracto de 5 días hábiles | RF-034..RF-041, RF-074..RF-076 · HU-013, HU-014, HU-024 |
| Cuenta y legal | Registro/login (email + Google), direcciones, consentimientos Ley 1581, términos y políticas | RF-042..RF-047, RF-077 · HU-020, HU-021 |
| Admin | RBAC con ámbito de sede, MFA, auditoría inmutable, gestión de catálogo/pedidos/inventario | RF-062..RF-068 · HU-022, HU-023 |
| Calidad | WCAG 2.2 AA, CWV en verde, tests, CI, canary y rollback | RNF-001..RNF-032 |

> C-01 y C-03 son líneas rojas: sin lotes/FEFO no hay trazabilidad de cosméticos y `OPS-09` se entrega en Sprint 6 con su escenario E2E como gate de release.

---

## 2. No-objetivos del MVP (Won't en esta entrega)

| # | No se hará en MVP | Por qué no | Cuándo se reevaluará |
|---|---|---|---|
| N-01 | **Marketplace multi-vendedor** | El negocio es marca/retail propio. Multi-vendor multiplica complejidad fiscal (facturación por vendedor), logística y resolución de disputas. | Solo con nueva unidad de negocio; requiere Design Doc nuevo. |
| N-02 | **Multi-moneda y multi-idioma** | Mercado único: Colombia, COP, español. Se modela `currency`/`locale` para no bloquear el futuro, pero no se construye selector. | Expansión regional (México/Chile). |
| N-03 | **Suscripciones y recompra programada** | Requiere volumen y lógica de cobro recurrente, conciliación y cancelación que no existen hoy. | Fase 3, si la recurrencia supera umbral medido. |
| N-04 | **App nativa iOS/Android** | PWA + web móvil cubre la mayoría del caso con un solo codebase; el prototipo ya validó la experiencia móvil. | Fase 3, si >50% de recurrencia es móvil. |
| N-05 | **Motor propio de facturación DIAN** | Riesgo regulatorio y de habilitación muy alto frente a un proveedor tecnológico habilitado. | Nunca propio; solo cambiar de proveedor. |
| N-06 | **Microservicios / service mesh** | Con 2 sedes y ~1.000 pedidos/mes, la reserva de stock debe ser una transacción local ACID, no una saga distribuida. | >100.000 pedidos/mes o equipos >20 personas. |
| N-07 | **Búsqueda vectorial / semántica / ML** | Meilisearch con sinónimos en español y tolerancia a errores cubre 300–800 SKUs; los embeddings necesitan volumen y pipeline de datos. | Fase 3, con datos propios de búsqueda. |
| N-08 | **Personalización predictiva ("tu rutina")** | Requiere historial y segmentación que hoy no existen. | Fase 3. |
| N-09 | **Programa de lealtad por puntos y niveles** | Desvía esfuerzo de la conversión base; MVP cubre cupones y registro con descuento. | Fase 2/3. |
| N-10 | **Bundles "comprados juntos" con descuento** | Implica modelo de bundle, pricing compuesto y reglas de apilamiento con riesgo de margen. | Fase 2; MVP solo "relacionados" sin descuento. |
| N-11 | **Chat en vivo propio** | WhatsApp Business cubre la atención con menos costo y mejor adopción local. | Fase 3. |
| N-12 | **Integración contable/ERP completa** | MVP entrega factura DIAN + export CSV; sincronizar ERP requiere conocer cuál existe (`DD-Q1`). | Fase 2, vía adaptador. |
| N-13 | **Reseñas con foto, votos y preguntas** | Moderación de imágenes y storage adicionales; MVP lanza reseñas de texto verificadas. | Fase 2. |
| N-14 | **A/B testing y experimentación** | Requiere tráfico y una capa de feature flags más madura; se usa banderas solo para release. | Fase 2. |
| N-15 | **PWA instalable, push web y offline** | Mejora incremental; no bloquea la propuesta de valor transaccional. | Fase 3. |
| N-16 | **Hardware POS, impresora de tickets y modo offline de tienda** | El MVP registra la venta en un panel web usable en tablet con conectividad; la contingencia sin internet es papel + conciliación. | Fase 2, si el cliente requiere terminales. |
| N-17 | **Devoluciones self-service** | Requiere reglas de elegibilidad, etiquetas y verificación de estado del producto; MVP usa solicitud con aprobación manual. | Fase 2. |
| N-18 | **Cupones apilables complejos y motor de promociones tipo ERP** | Alto riesgo de margen y de bugs; MVP permite 1 cupón + promociones automáticas no acumulables. | Fase 2. |
| N-19 | **Addi / Sistecrédito por integración directa** | Contrato, homologación y conciliación propios; el BNPL nativo de Wompi cubre el MVP sin ese costo. | Fase 2, si hay contrato. |
| N-20 | **Routing inteligente por proximidad geográfica** | Con 2 sedes basta prioridad configurable + disponibilidad; el routing por GPS necesita datos y reglas más complejas. | Fase 2. |

---

## 3. Diferido dentro de la arquitectura (no bloqueante)

Estas decisiones **no se construyen**, pero su ausencia no debe obligar a reescribir el sistema cuando lleguen:

| Previsión | Cómo se deja la puerta abierta |
|---|---|
| Segunda marca o tenant | `currency`, `locale` y `brandId` modelados; sin lógica multi-tenant activa |
| Backend separado | `packages/core` sin dependencia de Next.js; contrato `/api/v1` versionado con OpenAPI |
| Otro proveedor de pagos | Puerto `createIntent / getStatus / refund / verifyWebhook` + adaptadores |
| Otro proveedor DIAN o transportadora | Adaptadores en el worker; nunca lógica de proveedor en el dominio |
| Más sedes | `sites` + `inventory_lots(lot_id, site_id)` y `user_sites`: agregar sede es operación de datos (C-01) |
| App nativa futura | JWT + REST versionado reutilizables; la sesión del storefront va en cookie `httpOnly` y `Bearer` queda reservado a servidor a servidor (C-04) |

---

## 4. Supuestos que, si cambian, cambian el alcance

| # | Supuesto | Impacto si es falso | Confirmación |
|---|---|---|---|
| S1 | Catálogo propio con autorización de venta online y sin MAP pricing restrictivo | Rediseño de catálogo y precios | Cliente (S0) |
| S2 | 300–800 SKUs al lanzamiento; fotos ≥800 px provistas por el cliente | Ajuste de carga y riesgo de CWV (R2/R7) | Cliente (Sprint 1) |
| S3 | No hay POS/ERP que deba integrarse en MVP (el panel POS web reemplaza el proceso) | +Adaptador de sincronización y UAT con el sistema externo | Cliente + Comandante (`DD-Q1`, S0) |
| S4 | Wompi disponible con checkout hospedado y webhooks desde Sprint 5 | Activar plan B ePayco; posible retraso | Finanzas ([ADR-002](./adr/ADR-002-estrategia-pagos.md)) |
| S5 | Proveedor DIAN y resolución de numeración vigentes | Riesgo R4; contingencia documentada | Cliente (`DD-Q2`, S0) |
| S6 | Tráfico inicial 10–50k sesiones/mes; ticket COP 180–250k | Dimensionamiento de infra y umbrales de riesgo | Cliente (S0) |
| S7 | Logística con 1–3 transportadoras o agregador | Definir adaptador de guías | Cliente + `forge-infra` (`DD-Q5`) |

> **Decisión:** el alcance del MVP se congela al final del Sprint 0. Cualquier inclusión posterior pasa por el Comandante, se estima en puntos y **desplaza** otra historia del sprint; no se añade trabajo "gratis".

> **Pregunta abierta `DD-Q15`** (ID canónico en [design-doc.md §10](./design-doc.md)): entre N-16 (sin hardware POS) y N-10 (sin bundles), ¿cuál prefiere el cliente que se incluya antes en Fase 2? Responde: Cliente (Sprint Review 1).
