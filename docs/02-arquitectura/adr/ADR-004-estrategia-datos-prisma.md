# ADR-004 — Estrategia de datos: PostgreSQL como fuente de verdad, multi-schema gobernado con Prisma

| Campo | Valor |
|---|---|
| **Estado** | Enmendado por `C-01`, `C-02` y `C-09` — pendiente de aprobación del Comandante y de `forge-sentinel` |
| **Fecha** | 23 de noviembre de 2026 |
| **Decisores** | `forge-architect`, `apex-forge`, `forge-sentinel` |
| **Relacionados** | [decisiones-comandante.md](../decisiones-comandante.md), [ADR-003](./ADR-003-modelo-inventario-multisede.md), [ADR-005](./ADR-005-autenticacion-sesiones.md), [design-doc.md §4.4](../design-doc.md) |

## Contexto

Necesitamos un almacén que garantice integridad transaccional para tres cosas delicadas: (1) reserva FEFO de stock + creación de pedido en la misma transacción, (2) idempotencia de webhooks y de escrituras, y (3) snapshots inmutables de precios e impuestos para facturación DIAN. Además hay datos personales (Ley 1581) y obligaciones fiscales de 5 años.

El stack de Digitaldevs prescribe PostgreSQL + Prisma. Se evaluó MongoDB y Drizzle antes de confirmar la elección. El prototipo S0 usa `localStorage`, por lo que no hay legacy de datos que migrar: es greenfield.

Las enmiendas `C-01`, `C-02` y `C-09` del Comandante fijan el vocabulario (`site_id`/`sites`), la representación monetaria (`BIGINT` centavos) y la retención de backups (PITR 7 días + dump frío 30 días).

## Decisión

> **Decisión:** **PostgreSQL 16 (Neon) es la única fuente de verdad**. Se modela con **Prisma ORM** usando esquemas lógicos separados (`auth`, `catalog`, `inventory`, `orders`, `content`, `audit`). Meilisearch es índice derivado; Redis es caché/colas. Ninguno de los dos puede contener el registro definitivo de un pedido o saldo. En `inventory`, la fuente de verdad es **`inventory_lots(lot_id, site_id)`** y `inventory_by_site(variant_id, site_id)` es proyección (C-01).

**Esquemas lógicos:**

| Esquema | Responsabilidad | Entidades clave |
|---|---|---|
| `auth` | Identidad y permisos | `users`, `roles`, `permissions`, `sessions`, `refresh_tokens`, `consents`, `user_sites` |
| `catalog` | Vitrina y precios | `brands`, `categories`, `products`, `variants`, `attributes`, `attribute_values`, `media`, `reviews` |
| `inventory` | Operación física de las 2 sedes | `sites`, `lots`, `inventory_lots` (**fuente de verdad**), `inventory_by_site` (**proyección**), `reservations`, `inventory_movements`, `site_transfers`, `site_transfer_items`, `store_pickups`, `stock_counts` |
| `orders` | Transacciones | `carts`, `cart_items`, `orders`, `order_items`, `order_status_history`, `payments`, `payment_transactions`, `shipments`, `invoices`, `coupons`, `redemptions` |
| `content` | Marketing y legal | `pages`, `banners`, `posts`, `faqs` |
| `audit` | Gobernanza | `audit_logs`, `webhook_events`, `outbox_events`, `idempotency_keys` |

**Reglas de modelado:**

| Regla | Detalle |
|---|---|
| Dinero (C-02) | Todos los importes son **`*_cents` (`BIGINT`)**. Porcentajes en *basis points*: **IVA 19 % = `vat_rate_bps = 1900`**; prohibido usar `1900` como `rate` decimal. Prohibidos `Float` y unidades principales |
| IVA | Precio con impuesto incluido, por línea: `base_cents = round_half_up(total_line_cents / 1.19)`, `iva_cents = total_line_cents − base_cents`; la suma debe cuadrar con `grandTotalCents` |
| Inventario (C-01) | FEFO sobre `inventory_lots`; `inventory_by_site` se actualiza en la misma transacción; job diario verifica la igualdad de agregados |
| Vencimientos (C-01) | Aviso a 90 días, bloqueo de venta a 15 días, sin descuento automático en Fase 1 |
| Estados (C-08) | `orders.status` usa los identificadores canónicos publicados en el [design-doc.md §4.4.1](../design-doc.md); los nombres en español son etiquetas UI |
| Snapshots | `order_items` guarda precio en centavos, SKU, nombre, imagen e impuestos; el pedido no cambia si el catálogo cambia |
| IDs | UUID v7 (ordenables por tiempo) |
| Tiempo | `timestamptz` en UTC; la UI convierte a `America/Bogota` |
| Borrado | *Soft delete* en catálogo y usuarios; pedidos, pagos, facturas y movimientos **nunca** se borran |
| Auditoría | `audit_logs` *append-only*: actor, rol, sede (`site_id`), acción, entidad, `before/after` con PII enmascarada, IP, `requestId` |
| Outbox | Todo evento de dominio escribe `outbox_events`; el worker consume con `jobId = outbox.id` |
| Idempotencia | `idempotency_keys` con hash de request y respuesta (TTL 24 h); `unique(provider, event_id)` en webhooks |
| PII | `phone`, `documentNumber` y snapshots de despacho cifrados AES-256-GCM; búsqueda por índice ciego SHA-256 con *pepper* en gestor de secretos; rotación de claves |
| Retención | Operativa 2 años; fiscal 5 años; supresión = anonimizar PII conservando la factura |
| Backups (C-09) | **PITR de 7 días + dump frío diario con retención de 30 días** para MVP; ampliar a PITR 30 días es mejora aprobable por el cliente, no bloqueante |
| Migraciones | Versionadas, reversibles, *expand → contract*; prohibida migración destructiva en el mismo release |

**Índices exigidos por el acceso:** `(lot_id, site_id)` en `inventory_lots`; `(variant_id, site_id)` único en `inventory_by_site`; índice de FEFO por `(site_id, expiry_date)` sobre lotes activos; `(site_id, status, created_at)` en `orders`; `(order_id, event_id)` en historial; índice parcial en reservas activas (`expires_at > now()`); `pg_trgm` + `tsvector` en español como fallback de búsqueda.

## Consecuencias

**Positivas**
- Una sola transacción cubre reserva FEFO, pedido, idempotencia y outbox: correctitud sin consistencia distribuida.
- Prisma genera tipos y migraciones claras; encaja con TypeScript strict y con `packages/core`.
- Los esquemas separados hacen explícito quién es dueño de cada dato y facilitan permisos por rol.
- `BIGINT` en centavos cuadra con los *minor units* de Wompi y con el desglose del IVA.
- PITR de 7 días cumple RPO ≤ 5 min / RTO ≤ 1 h sin infra propia; el dump frío cubre 30 días de retención.

**Negativas / costos**
- Prisma añade una capa de generación de cliente y puede requerir SQL crudo para queries muy específicas (facetas, reportes); se permite SQL crudo documentado en repositorios, nunca en el dominio.
- El cifrado de PII con índices ciegos aumenta complejidad de búsqueda y de migraciones.
- Lotes + proyección añaden escritura doble y un job de reconciliación; el test de concurrencia es gate de release.
- Los seis esquemas exigen disciplina de importaciones para no mezclar dominios; se refuerza con reglas de lint y revisión.
- Neon tiene límites de conexiones: se usa pooling (PgBouncer/Neon pooler) y el worker con pool pequeño.

**Neutras**
- Meilisearch y Redis siguen existiendo, pero son descartables y reconstruibles desde PostgreSQL en cualquier momento.

## Alternativas

| Alternativa | Por qué se descartó |
|---|---|
| MongoDB / Mongoose | Precio, stock, pedidos e impuestos requieren integridad referencial y transacciones multientidad; el documento dificulta auditoría y reportes fiscales. |
| Drizzle ORM | Más ligero y cercano a SQL, pero menos maduro en migraciones y tipos para un equipo que quiere velocidad y menor riesgo; se guarda como alternativa si una query crítica obliga a cambiar. |
| TypeORM | Decoradores, tipado más débil y migraciones menos predecibles que Prisma. |
| Un único esquema `public` | Funciona, pero mezcla identidad, catálogo y finanzas; dificulta permisos y razonamiento sobre auditoría. |
| Multi-base por dominio (una DB por esquema) | Rompe la transacción única de inventario + pedido; reintroduce consistencia distribuida. |
| `inventory(variant_id, branch_id)` sin lotes | Retirada por C-01: sin FEFO ni trazabilidad; además usaba un vocabulario de sede distinto. |

## Estado

**Enmendado por `C-01`, `C-02` y `C-09`**. Requiere aprobación de `apex-forge` y visto bueno de `forge-sentinel` para cifrado de PII, retención, auth y política de auditoría.

> **Pregunta abierta:** ¿la política de retención de 5 años para datos fiscales y 2 años para datos operativos coincide con la política interna del cliente? Responde: Cliente + `forge-sentinel`.
