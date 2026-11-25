# Opciones de Arquitectura Evaluadas — Adriana Tienda

| Campo | Valor |
|---|---|
| **Autor** | `forge-architect` (Staff Engineer, APEX FORGE) |
| **Estado** | Draft — insumo para el [design-doc.md §5](./design-doc.md) |
| **Fecha** | 23 de noviembre de 2026 |
| **Decisor** | `apex-forge` (Comandante) |
| **Decisiones aplicadas** | [decisiones-comandante.md](./decisiones-comandante.md) — C-01 (lotes/FEFO), C-03 (POS en MVP), C-12 (enlaces y precedencia) |
| **Relacionados** | [design-doc.md §5](./design-doc.md), [ADR-004](./adr/ADR-004-estrategia-datos-prisma.md), [alcance-y-no-objetivos.md](./alcance-y-no-objetivos.md) |

> **Precedencia:** manda [decisiones-comandante.md](./decisiones-comandante.md); el [design-doc.md](./design-doc.md) (Draft) absorbe al `DESIGN_DOC.md` v1.0 de la raíz (C-12).

## 1. Criterios de evaluación

Los criterios se ponderan según la prioridad de decisión de APEX FORGE: **correctitud → mantenibilidad → rendimiento → velocidad de entrega**. El peso de la correctitud (multi-sede + impuestos + pagos) es el más alto porque un error ahí cuesta dinero real y confianza del cliente.

| # | Criterio | Peso | Justificación del peso |
|---|---|---:|---|
| C1 | **Correctitud multi-sede / POS / transferencias** | 20% | Requisito crítico del cliente: 2 sedes físicas, retiro, venta en tienda, stock consistente. |
| C2 | **Costo total de propiedad (TCO)** | 20% | Negocio de 300–800 SKUs y ~1.000 pedidos/mes; plataformas y comisiones erosionan margen. |
| C3 | **Velocidad de entrega (time-to-market)** | 15% | Cliente ya aprobó el prototipo S0 y quiere bases profesionales, no años de plataforma. |
| C4 | **Control de checkout y experiencia (WCAG/CWV)** | 15% | La tesis de producto es ganar en móvil con velocidad y confianza; no podemos heredar un checkout cerrado. |
| C5 | **Rendimiento (Core Web Vitals)** | 10% | Meta LCP < 2,5 s, INP < 200 ms, CLS < 0,1. |
| C6 | **Mantenibilidad y testabilidad** | 10% | TypeScript strict, tests, ADRs, rollback fácil; equipo pequeño. |
| C7 | **Escalabilidad (crecimiento a 5 sedes / 2.000 SKUs)** | 5% | Importante pero no urgente; se resuelve con el modelo de datos, no con microservicios. |
| C8 | **Cumplimiento DIAN / datos personales** | 5% | Se resuelve con adaptadores y gobernanza; ninguna opción lo regala. |

> **Decisión:** la opción ganadora debe permitir **extraer piezas después** sin reescribir el dominio. Se prefiere una decisión reversible ("haz fácil el cambio de opinión", Jeff Dean) sobre una arquitectura "perfecta" pero costosa de revertir. Por **C-01** el modelo de inventario es **`inventory_lots(lot_id, site_id)` con FEFO** y `inventory_by_site` como proyección; la alternativa «stock por variante+sede sin lotes» quedó rechazada por falta de trazabilidad de cosméticos ([design-doc.md §5](./design-doc.md)).

---

## 2. Opción A — Monolito modular Next.js + PostgreSQL en Vercel/Neon **(recomendada)**

### Descripción
Un solo repositorio (monorepo administrado con pnpm workspaces) con dos procesos desplegables:

- `apps/web`: Next.js 15 (App Router, RSC, ISR/PPR, Server Actions, Route Handlers `/api/v1`). Contiene storefront, panel admin y webhooks entrantes.
- `apps/worker`: Node 22 + BullMQ para jobs asíncronos (facturación DIAN, correos, WhatsApp, conciliación, indexación, expiración de reservas).
- `packages/core`: lógica de dominio pura y tipada (catálogo, precios, IVA, carrito, pedidos, pagos, inventario multi-sede, reglas de transferencia). **Sin dependencias de framework.**
- `packages/ui`: design system con React 19 + Tailwind v4 + primitivas Radix.

PostgreSQL (Neon) es la fuente de verdad; Redis para caché, colas, idempotencia y sesiones; Meilisearch como índice derivado; R2 + Cloudflare para media, CDN y WAF.

### Pros
- **Transacciones ACID simples** para la operación más delicada: reserva de stock + creación de pedido + idempotencia en una sola transacción.
- Dominio compartido entre web y worker sin duplicar reglas de IVA, reservas ni estados.
- RSC + ISR dan el mejor presupuesto de JS y LCP de las opciones sin backend propio.
- Preview deploys y rollback instantáneo en Vercel; alineado con el stack de Digitaldevs.
- Un solo despliegue observable: `requestId` correlaciona web, worker y proveedores.
- Agregar una quinta sede es un cambio de datos; extraer un microservicio después es posible porque `packages/core` ya está desacoplado.

### Contras
- El worker requiere un segundo proceso (Fly.io/Railway) y Redis gestionado: ~USD 60–120/mes adicionales.
- Vercel tiene límites de duración de función; por eso los jobs van al worker, no a Route Handlers.
- Riesgo de acoplamiento si el equipo no disciplina las capas → mitigado con reglas de importación en ESLint y [ADR-004](./adr/ADR-004-estrategia-datos-prisma.md).

### Motivo de elección
Es la única opción que resuelve el requisito crítico multi-sede con **una transacción**, mantiene el control total del checkout y cumple el stack y el presupuesto de rendimiento. Costo y velocidad equilibrados.

---

## 3. Opción B — Frontend Next.js + backend Express separado + PostgreSQL

### Descripción
Next.js actúa solo como BFF/storefront y consume una API REST Express (Node) desplegada aparte (Docker en Fly.io/Railway/Render), con su propia base PostgreSQL y Redis. Contrato OpenAPI/Swagger entre ambos. `packages/core` vive en el backend.

### Pros
- Separación física clara entre UI y dominio; el backend puede escalarse independientemente.
- Equipos distintos pueden trabajar sin pisarse; el worker puede ser otro proceso del mismo cluster.
- API REST documentada con Swagger es natural y reutilizable para futuras apps o integraciones.

### Contras
- **Dos despliegues, dos URLs, dos pipelines** y dos superficies de seguridad para un equipo de ~4,7 FTE.
- Cada petición del storefront añade un salto de red hacia el backend; el TTFB y el INP empeoran frente a RSC/Server Actions.
- Duplicidad de modelos de vista (DTO) y mayor riesgo de desincronización de tipos si no se genera un cliente tipado.
- No aporta nada a la corrección multi-sede: la transacción sigue siendo en PostgreSQL, igual que en A.
- Costo de infra superior (~USD 80–180/mes adicionales) sin beneficio de negocio en el MVP.

### Motivo de rechazo
Aporta una separación organizacional que hoy no necesitamos y **penaliza el rendimiento**, que es una de nuestras ventajas competitivas. Es la opción de migración natural **si** en el futuro el equipo se divide o aparece un segundo cliente (app nativa, marketplace); se documenta como camino de evolución, no como punto de partida.

---

## 4. Opción C — Microservicios (catálogo, carrito, pagos, inventario, pedidos, notificaciones)

### Descripción
Servicios independientes con bases de datos propias, comunicación por eventos (Kafka/RabbitMQ), API gateway, service mesh y trazas distribuidas. Cada servicio desplegado y escalado por separado.

### Pros
- Escalabilidad y aislamiento de fallos máximos: una caída de notificaciones no afecta el checkout.
- Equipos grandes pueden trabajar en paralelo con autonomía de release.
- Ideal para volumen de millones de pedidos o múltiples marcas/tenant.

### Contras
- **Consistencia distribuida**: una reserva de stock que cruza inventario → pedidos → pagos requiere saga, compensaciones y locks distribuidos. Exactly lo que queremos evitar con 2 sedes.
- Complejidad operativa desproporcionada: observabilidad distribuida, service discovery, secretos por servicio, despliegues coordinados, pruebas de contrato.
- Latencia añadida entre servicios en el critical path del checkout.
- Costo de infra y de conocimiento muy superior al beneficio con 1.000 pedidos/mes.
- Velocidad de entrega: semanas extra antes del primer release.

### Motivo de rechazo
**Rechazada explícitamente.** Resuelve un problema de escala que hoy no existe y introduce riesgo de sobreventa y de consistencia justo en el requisito crítico. Se reconsideraría solo con >100.000 pedidos/mes, múltiples unidades de negocio o equipos >20 personas — ninguna de esas condiciones está presente.

---

## 5. Opción D — Headless commerce (Shopify / Medusa / VTEX)

### Descripción
Plataforma de comercio como fuente de verdad de catálogo, carrito y checkout, consumida desde un frontend Next.js propio. Se evaluaron Shopify (SaaS), Medusa (open source) y VTEX (la referencia del mercado).

### Pros
- Time-to-market corto: checkout, carrito, cuentas y administración ya resueltos.
- Shopify tiene ecosistema de apps y robustez probada; Medusa es Node/TS y sin licencia.
- Menos código propio que mantener en las primeras semanas.

### Contras (comunes)
- **Multi-sede real no es nativo**: Shopify Locations cubre inventario básico, pero transferencias con `in_transit`, venta POS unificada y reglas de fulfillment por sede requieren apps o código custom, con costos y límites de la plataforma.
- Checkout de Shopify no es totalmente personalizable fuera de Plus (costo alto); Medusa exige construir igualmente storefront, admin, DIAN, PSE y transportadoras.
- Facturación DIAN y cumplimiento colombiano vía apps de terceros o desarrollo custom de todos modos.
- Comisiones por transacción + apps + suscripción → TCO superior; datos y SEO condicionados por la plataforma.
- VTEX es exactamente la plataforma de la referencia: su resultado observable (HTML pesado, PDP lento, URLs con query params) demuestra que "tener VTEX" no garantiza la experiencia que queremos superar.

### Motivo de rechazo
**Rechazada.** La plataforma resuelve el 60% fácil del e-commerce y deja el 40% difícil (multi-sede, DIAN, checkout a medida, rendimiento) como trabajo custom de todos modos, pero pagando además licencia y comisiones. Para una operación de 2 sedes y catálogo propio, el monolito modular da más control por menos dinero. Medusa queda como **plan de contingencia técnica** si en Sprint 1 se demuestra que construir el core supera el cronograma en >30%.

---

## 6. Matriz de decisión ponderada

Escala 1–10 (10 = mejor). Puntaje total = Σ (criterio × peso).

| Criterio | Peso | **A. Monolito modular** | **B. Next + Express** | **C. Microservicios** | **D. Headless** |
|---|---:|---:|---:|---:|---:|
| C1. Correctitud multi-sede / POS | 20% | **9** (1,80) | 8 (1,60) | 9 (1,80) | 6 (1,20) |
| C2. Costo total de propiedad | 20% | **9** (1,80) | 7 (1,40) | 4 (0,80) | 5 (1,00) |
| C3. Velocidad de entrega | 15% | 8 (1,20) | 7 (1,05) | 4 (0,60) | **9** (1,35) |
| C4. Control de checkout / UX | 15% | **10** (1,50) | 9 (1,35) | 9 (1,35) | 5 (0,75) |
| C5. Rendimiento (CWV) | 10% | **9** (0,90) | 8 (0,80) | 8 (0,80) | 7 (0,70) |
| C6. Mantenibilidad / tests | 10% | **9** (0,90) | 8 (0,80) | 5 (0,50) | 6 (0,60) |
| C7. Escalabilidad | 5% | 7 (0,35) | 7 (0,35) | **10** (0,50) | 8 (0,40) |
| C8. Cumplimiento DIAN / datos | 5% | **9** (0,45) | 8 (0,40) | 6 (0,30) | 5 (0,25) |
| **PUNTAJE TOTAL** | **100%** | **🏆 8,90** | **7,75** | **6,65** | **6,25** |

### Lectura de la matriz

- A gana porque lidera en los criterios de mayor peso (correctitud multi-sede y TCO) **sin perder** en control de checkout, rendimiento ni mantenibilidad.
- C pierde por TCO y mantenibilidad, no por correctitud: técnicamente es correcto, pero económicamente injustificable para este volumen.
- D pierde por control y cumplimiento: es la más rápida de entregar, pero la que menos control nos da sobre el requisito crítico (2 sedes) y sobre DIAN.
- B es la **segunda mejor** y el plan de evolución documentado: si el equipo crece o aparece una app nativa, se extrae `packages/core` detrás de la API Express sin reescribir reglas de negocio.

---

## 7. Análisis de sensibilidad

¿Cambia la recomendación si cambian los supuestos?

| Escenario | Efecto en el ranking | Conclusión |
|---|---|---|
| Tráfico 10× (500k sesiones/mes) | A sigue ganando; el cuello está en DB/CDN, no en el número de procesos | Escalar Neon + Redis, no microservicios. |
| 10 sedes en vez de 2 | A sigue ganando; el modelo `inventory_lots(lot_id, site_id)` + FEFO aguanta | Agregar sedes sigue siendo cambio de datos (C-01). |
| Equipo >20 personas, varios squads | B sube y puede empatar | Extraer backend Express detrás de OpenAPI. |
| Exitosa venta a 3 marcas distintas (multi-tenant) | C/D suben | Reevaluar con un nuevo Design Doc, nunca "de pasada". |
| Presupuesto recortado 40% | D sube por time-to-market, pero sigue perdiendo por multi-sede | Reducir alcance (ver [alcance-y-no-objetivos.md](./alcance-y-no-objetivos.md)), no cambiar de arquitectura. |

---

## 8. Recomendación final

> **Decisión:** adoptar la **Opción A — monolito modular Next.js 15 + PostgreSQL (Neon) en Vercel**, con `packages/core` como dueño de las reglas de dominio, worker separado para jobs asíncronos y adaptadores para pagos, DIAN y logística. La Opción B queda registrada como ruta de extracción futura; C y D se rechazan con los motivos documentados arriba.

> **Pregunta abierta `DD-Q8`** (ID canónico en [design-doc.md §10](./design-doc.md)): ¿existe alguna restricción contractual o de infraestructura del cliente (por ejemplo, obligación de desplegar en AWS, o proveedor DIAN que exige IP fija) que invalide Vercel/Neon? Responde: Cliente + `forge-infra` (S0). Si exige IP fija, el worker ya corre en Fly.io/Railway y puede servir de salida constante sin cambiar el monolito.
