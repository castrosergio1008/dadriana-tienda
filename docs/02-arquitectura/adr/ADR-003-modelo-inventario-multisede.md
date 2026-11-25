# ADR-003 — Inventario multi-sede: lotes con FEFO como fuente de verdad y proyección por sede

| Campo | Valor |
|---|---|
| **Estado** | Enmendado por `C-01` — pendiente de aprobación del Comandante y de `forge-sentinel` |
| **Fecha** | 23 de noviembre de 2026 |
| **Decisores** | `forge-architect`, `apex-forge` |
| **Relacionados** | [decisiones-comandante.md](../decisiones-comandante.md) (C-01, C-03), [ADR-002](./ADR-002-estrategia-pagos.md), [ADR-004](./ADR-004-estrategia-datos-prisma.md), [ADR-005](./ADR-005-autenticacion-sesiones.md), [design-doc.md §4.3](../design-doc.md), RF-048..RF-061 y RF-078..RF-081 |

## Contexto

Adriana Tienda tiene **dos sedes físicas** (etiqueta UI «sucursales»; identificador canónico **`sites` / `site_id`**). El cliente declaró esto como crítico: inventario por sede, retiro en tienda, venta desde tienda física (historia `OPS-09`, Sprint 6), transferencias entre sedes y unificación de clientes y pedidos. El prototipo S0 muestra «Recoge gratis hoy en tienda» como texto estático; en producción esa afirmación debe ser **verdadera para una sede concreta**.

Concurrentemente escriben sobre el mismo saldo: el checkout web, el panel POS del vendedor, los ajustes de inventario y las transferencias. Además, los productos son cosméticos con vencimiento: la trazabilidad por lote es exigible y vender una unidad próxima a expirar es un riesgo legal y de reputación.

La versión anterior de este ADR describía `inventory(variant_id, branch_id)` sin lotes. Esa formulación se **retira**: contradecía el modelo de datos ya desarrollado y no resolvía FEFO. El Comandante resolvió la contradicción en `C-01`.

## Decisión

> **Decisión (C-01):** la fuente de verdad es **`inventory_lots(lot_id, site_id)`** con selección **FEFO** (*first expired, first out*). **`inventory_by_site(variant_id, site_id)` es solo una proyección derivada**, actualizada en la misma transacción, con `on_hand = Σ lots.on_hand` y `reserved = Σ lots.reserved`. No existe un stock global escribible. Vocabulario único: `site_id` / `sites`; quedan prohibidos `branch_id`, `branches` y `sucursal_id` como identificadores técnicos (se conservan como etiqueta UI en español).

| Regla | Detalle |
|---|---|
| Clave de inventario | Fuente de verdad `(lot_id, site_id)`; proyección `(variant_id, site_id)`. Ambas con `on_hand`, `reserved` e `in_transit` enteros ≥ 0 |
| Restricción DB | `CHECK (reserved ≤ on_hand)` en lotes y proyección; `on_hand < 0` imposible |
| Selección FEFO | Lotes activos del `site_id` ordenados por `expiry_date ASC`; se omite lotes bloqueados y se elige el primero con saldo suficiente (RF-079) |
| Vencimientos | **Aviso al operador a 90 días** (RF-080); **bloqueo de venta a 15 días** (RF-081); **sin descuento automático en Fase 1** |
| Reserva | Se crea en la **misma transacción** que el pedido `PENDING_PAYMENT`; TTL 30 min; job la expira y libera lote y proyección |
| Anti-sobreventa | `UPDATE inventory_lots SET reserved = reserved + :qty WHERE lot_id=:l AND site_id=:s AND on_hand − reserved >= :qty`; solo una de dos escrituras concurrentes tiene éxito |
| Integridad de la proyección | La misma transacción actualiza `inventory_by_site`; job diario de reconciliación con alerta de desvío |
| Retiro en tienda | Reserva en la `site_id` elegida por el cliente + código de retiro; estados canónicos `PAID → PREPARING → READY_FOR_PICKUP → DELIVERED` (`orders.status`, no derivado de `store_pickups.status`) |
| Despacho | `site_id` de fulfillment por prioridad configurable y disponibilidad; se persiste `fulfillment_site_id`; si no hay stock completo, se ofrece split o alternativa **antes de cobrar** (`DD-Q4`, abierta) |
| POS | Pedido `channel = POS`, sede del vendedor, mismos precios e IVA en centavos; descuenta el lote FEFO de esa sede y comparte historial del cliente. Implementado por **`OPS-09 — Registro de venta presencial`** (8 pts, **Sprint 6**, depende de la historia de lotes; gate E2E de release, C-03) |
| Transferencias | `DRAFT → IN_TRANSIT → RECEIVED/CANCELLED`; origen `on_hand− / in_transit+`, destino `in_transit− / on_hand+`; siempre balanceado y auditado |
| Movimientos | Inmutables: actor, sede, lote, motivo, cantidad, timestamp, `requestId`; conteo físico requiere aprobación |

La tabla completa «etiqueta UI en español → identificador canónico inglés» está en el [design-doc.md §4.4.1](../design-doc.md). Los nombres en español de RF y ADR son **etiquetas de UI**, nunca IDs.

## Consecuencias

**Positivas**
- La promesa «recoge hoy en la Sede 1» se basa en el saldo real **por lote** de esa sede.
- Trazabilidad completa del lote vendido: exigible para cosméticos y necesaria en devoluciones.
- Lotes próximos a vencerse se bloquean automáticamente antes de llegar al cliente.
- Web, POS y transferencias concurren sobre un mismo saldo con una transacción local ACID: no se necesitan sagas ni locks distribuidos.
- La sobreventa se previene en la base de datos, no solo en la capa de aplicación.
- Agregar una tercera o quinta sede es un cambio de datos, no de código.

**Negativas / costos**
- **Fragmentación de disponibilidad:** una sede puede agotar un SKU mientras otra tiene stock. Se mitiga con split entre sedes, alertas de stock mínimo y transferencias.
- Más filas (`inventory_lots`) y más escrituras por pedido: la proyección y el job de reconciliación son responsabilidad operativa nueva.
- El job de expiración de reservas y el bloqueo por vencimiento exigen monitors y runbook.
- El picking con split entre sedes complica la logística: queda como `DD-Q4` para el negocio.

**Neutras**
- El stock agregado del storefront es `SUM(inventory_by_site.on_hand − reserved)`: útil para mostrar disponibilidad nacional, nunca para prometer retiro ni para decidir FEFO.

## Alternativas

| Alternativa | Por qué se descartó |
|---|---|
| **Stock global único** con disponibilidad por sede calculada | No puede garantizar retiro en una sede específica; las transferencias serían solo contables, sin trazabilidad física. |
| **Stock por `(variant_id, site_id)` sin lotes** (formulación anterior de este ADR) | No permite FEFO, ni bloqueo por vencimiento, ni trazabilidad legal de cosméticos. **Retirada por C-01**. |
| **Stock separado sin reservas** (desconte al pagar) | Ventana de sobreventa entre carrito y webhook; con PSE y BNPL la ventana es de minutos. |
| **Reserva global con asignación posterior de sede** | El cliente eligió una sede; asignar otra después rompe la promesa y obliga a transferencias reactivas. |
| **Inventorios independientes por canal** (web vs. POS) | Duplica saldos para el mismo producto físico; imposible unificar operación sin conciliación manual constante. |
| **Bloquear con `SELECT ... FOR UPDATE` sobre toda la tabla** | Correcto pero innecesariamente costoso; el `UPDATE` condicional logra lo mismo con mejor concurrencia. |

## Estado

**Enmendado por `C-01`**. Requiere aprobación de `apex-forge` y validación de `forge-qualis` del test de concurrencia (100 intentos sobre el último lote → exactamente 1 reserva) como gate de release, además del E2E de `OPS-09` (C-03).

> **Abierta (`DD-Q4`):** ¿el negocio acepta el **split entre sedes** para pedidos de envío a domicilio en el MVP, o prefiere mostrar «no disponible»? Responde: Cliente + Admin de operación (Sprint 3).
