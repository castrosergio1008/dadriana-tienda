# Reglas de Negocio — Adriana_tienda

> **Estado:** Propuesta de diseño (fase de diseño). **No es implementación.**
> Cada regla es verificable y se traduce a un test. Formato: **entradas → salidas → excepción**.
> Los valores entre corchetes son parámetros de `settings` (configurables sin deploy).

---

## 1. Precios, impuestos y descuentos

> **Decisión:** IVA incluido en el precio de etiqueta, importes en centavos, redondeo half-up
> por línea y orden fijo de descuentos (promoción → cupón → envío gratis).

### RN-001 — Precio con IVA incluido

> El precio de catálogo **ya incluye** el 19 % de IVA. El impuesto se **deriva** del total, no
> se adiciona al final. `tax_rate_bp = 1900` **basis points** (19 %), nunca `1900` como tasa
> decimal (C-02). Todos los importes son `BIGINT` en centavos (`*_cents`).

| | |
|---|---|
| **Entradas** | `total_line_cents` (IVA incluido), `tax_rate_bp = 1900`. |
| **Salidas** | `base_cents = round_half_up(total_line_cents / 1,19)`; `iva_cents = total_line_cents - base_cents`. |
| **Ejemplo** | COP 119.000 → base 100.000 + IVA 19.000. |
| **Excepción** | Producto exento (`tax_rate_bp = 0`) ⇒ `iva_cents = 0`. Requiere aprobación de contabilidad y auditoría. |

### RN-002 — Precio de oferta

| | |
|---|---|
| **Entradas** | `price_cents`, `compare_at_price_cents`, `starts_at`, `ends_at` de la promoción. |
| **Salidas** | Se cobra `price_cents`; se muestra `compare_at_price_cents` tachado solo si es `> price_cents` y la promoción está vigente. |
| **Excepción** | `compare_at_price <= price` ⇒ se ignora el precio tachado y se alerta al operador. Nunca se muestra un "antes" falso. |

### RN-003 — Aplicación de descuentos

> Orden fijo: **promoción automática → cupón → envío gratis**. El cupón se aplica sobre el
> subtotal ya descontado por promociones. No se permite apilamiento salvo `stackable = true`.

| | |
|---|---|
| **Entradas** | Ítems del carrito, promociones vigentes, código de cupón. |
| **Salidas** | `unit_discount_cents` por línea + `discount_total_cents`, con `applied_promotions` como auditoría. |
| **Excepción** | Cupón no apilable sobre promoción automática ⇒ se aplica el de **mayor beneficio** y se informa al cliente. |

### RN-004 — Cálculo del total del pedido

| | |
|---|---|
| **Entradas** | `subtotal`, `discount_total`, `shipping_total`, `tax_total`. |
| **Salidas** | `grand_total_cents = subtotal - discount_total + shipping_total` (el IVA **no** se suma: ya está incluido); `tax_total = Σ iva_cents` por línea, calculado con RN-001 **después** de descuento. |
| **Ejemplo** | Subtotal 119.000, descuento 11.900 (`ADRIANA10`, 10 %) ⇒ total con IVA incluido 107.100; base gravable 90.000 + IVA 17.100; total final 107.100 + envío. |
| **Excepción** | `grand_total <= 0` ⇒ se rechaza el checkout (no se permiten pedidos de valor cero salvo cupón 100 % aprobado por admin). |

### RN-005 — Costo de envío

| | |
|---|---|
| **Entradas** | Ciudad/departamento, `weight_grams`, `subtotal`, reglas de cobertura. |
| **Salidas** | `shipping_total_cents`, transportadora y `estimated_delivery_at`. Gratis si `subtotal >= [free_shipping_threshold_cents]` o cupón `FREE_SHIPPING`. |
| **Excepción** | Zona no cubierta ⇒ se ofrece solo retiro en tienda; si no hay retiro posible, se bloquea el checkout con mensaje claro. |

### RN-006 — Redondeo

| | |
|---|---|
| **Entradas** | Importes con decimales derivados de porcentajes. |
| **Salidas** | Redondeo **`round_half_up` al centavo**, aplicado **por línea** (`base_cents = round_half_up(total_line_cents / 1,19)`); nunca sobre el total agregado. |
| **Excepción** | Diferencia de 1 centavo entre `Σ líneas` y `grand_total` ⇒ se ajusta en la última línea y se registra en `applied_promotions`. |

### RN-007 — Revalidación de precio en checkout

| | |
|---|---|
| **Entradas** | `unit_price_snapshot_cents` del carrito, `price_cents` vigente de la variante. |
| **Salidas** | Se cobra el **menor** de ambos si el precio bajó; si subió, se cobra el precio vigente y se muestra aviso antes de pagar. |
| **Excepción** | Variante `DISCONTINUED`/`ARCHIVED` ⇒ se retira del checkout, se libera la reserva y se pide confirmación del cliente. |

---

## 2. Inventario, lotes y reservas

### RN-008 — Selección FEFO de lote

| | |
|---|---|
| **Entradas** | `variant_id`, `site_id`, `quantity`, fecha actual. |
| **Salidas** | Se seleccionan lotes `ACTIVE` con `expires_at >= hoy + [min_days_to_expire = 15]` ordenados por `expires_at ASC`, luego `received_at ASC`. Se aparta en varios lotes si hace falta. Umbrales aprobados y cerrados (C-01): aviso a **90 días**, bloqueo de venta a **15 días**, **sin descuento automático** en Fase 1. Se descuenta primero de `inventory_lots(lot_id, site_id)`, fuente de verdad. |
| **Ejemplo** | Lote A vence en 40 días, Lote B en 120 ⇒ se descuenta A primero (con etiqueta de vencimiento por estar a ≤ 90 días). |
| **Excepción** | Ningún lote cumple ⇒ sin stock; se ofrece la otra sede o se agota el SKU. Nunca se usa un lote vencido ni uno a ≤ 15 días. |

### RN-009 — Prevención de sobreventa

| | |
|---|---|
| **Entradas** | `(lot_id, site_id, quantity)`. |
| **Salidas** | `UPDATE inventory_lots SET reserved = reserved + q WHERE lot_id=$1 AND site_id=$2 AND on_hand - reserved >= q`. Si afecta 1 fila ⇒ reserva creada; también incrementa `inventory_by_site.reserved` en la misma transacción. |
| **Excepción** | 0 filas afectadas ⇒ `409 INSUFFICIENT_STOCK`; no se crea reserva ni pedido. Nunca se permite `reserved > on_hand` (CHECK en BD). |

### RN-010 — Límites de cantidad

| | |
|---|---|
| **Entradas** | `quantity` por línea, configuración `[max_qty_per_sku = 99]`. |
| **Salidas** | Carrito acepta `1..99` unidades por SKU. |
| **Excepción** | `quantity > 99` o `<= 0` ⇒ `422 INVALID_QUANTITY`. Compras mayores requieren contacto comercial (pedido especial). |

### RN-011 — Reserva temporal (TTL)

| | |
|---|---|
| **Entradas** | Checkout iniciado, `reserve_ttl_minutes = 30`. |
| **Salidas** | Reserva `ACTIVE` con `expires_at = now + 30 min`; orden con el mismo `expires_at`. Job cada 1 minuto expira y libera. |
| **Excepción** | Cliente paga después del TTL ⇒ RN-013. El TTL **no** se renueva automáticamente; solo un nuevo checkout crea una reserva nueva. |

### RN-012 — Reserva en carrito vs. checkout

| | |
|---|---|
| **Entradas** | Adición al carrito, inicio de checkout. |
| **Salidas** | El carrito **no** aparta stock; la reserva se crea solo al iniciar checkout. En checkout se revalidan precio, stock, cupón y dirección. |
| **Excepción** | Stock insuficiente en checkout ⇒ se muestra disponibilidad real por sede y se mantiene el carrito sin cambios. |

### RN-013 — Pago tardío tras expirar la reserva

| | |
|---|---|
| **Entradas** | Webhook `APPROVED` con `now > order.expires_at` y reserva `EXPIRED`. |
| **Salidas** | Se acepta el dinero (no se puede rechazar) y se fija `payment_status = PAID`, pero la orden **permanece en `PENDING_PAYMENT`** (no existe `PAID_NEEDS_REVIEW`). El job de TTL **no cancela** esa orden. Se re-reserva FEFO en `inventory_lots` en la misma transacción: con stock ⇒ `order.status = PAID`; sin stock ⇒ `order.status = REFUNDED` + reembolso + cupón de disculpa + alerta. Nunca se publica `PAID` sin stock asignado. |
| **Excepción** | Monto del webhook distinto al de la orden ⇒ no se confirma; se congela para revisión manual y se notifica a `forge-sentinel`. |

### RN-014 — Confirmación y descuento definitivo

| | |
|---|---|
| **Entradas** | Webhook aprobado verificado, reserva `ACTIVE`. |
| **Salidas** | En **una transacción**: reserva → `CONFIRMED`, `reserved -= q` y `on_hand -= q` en `inventory_lots` (fuente de verdad) **y en `inventory_by_site` (proyección)**, movimiento `SALE`, `payment.status = PAID`, `order.status = PAID`, outbox de factura y notificaciones. |
| **Excepción** | Reserva ya `CONFIRMED` (webhook duplicado) ⇒ se responde `200`, sin efectos. |

### RN-015 — Retiro en tienda

| | |
|---|---|
| **Entradas** | Pedido `PAID`, `fulfillment_type = STORE_PICKUP`, `site_id` elegido (vocabulario único `site_id` / `sites`), ventana horaria. |
| **Salidas** | `store_pickups` en `SCHEDULED`; al empacar → `READY` con código de 6 dígitos y aviso, y la orden pasa a `READY_FOR_PICKUP` (estado propio de `orders.status`); en mostrador se exigen código + documento → `PICKED_UP` con `picked_up_by` y la orden pasa a `DELIVERED`. |
| **Excepción** | Sede elegida sin stock físico ⇒ se propone la otra sede antes de empacar; si el cliente no acepta, se cancela con reembolso. |

### RN-016 — Retiro no realizado

| | |
|---|---|
| **Entradas** | `READY` por más de `[pickup_expiry_hours = 48]`. |
| **Salidas** | `EXPIRED`, se libera la reserva, se notifica al cliente y se decide: reprogramar o reembolsar (con cargo operativo si aplica). |
| **Excepción** | Retiro tardío autorizado por operador solo si el stock sigue apartado físicamente; se registra excepción en `audit_logs`. |

### RN-017 — Venta en tienda física (POS)

| | |
|---|---|
| **Entradas** | Vendedor con permiso `pos.sell`, `site_id`, ítems, método de pago presencial, `Idempotency-Key` (OPS-09, Sprint 6). |
| **Salidas** | `POST /api/v1/pos/sales` es un **alias de canal** de `POST /api/v1/checkout`: mismo handler, mismo esquema y misma clave de idempotencia; **no es un segundo contrato de creación**. Pedido con `channel = POS`, `site_owner_id = site_id`, `status = PAID`, factura y movimiento `SALE` inmediatos, `nextAction = { type: NONE, checkoutUrl: null }`. Descuento FEFO **atómico** sobre `inventory_lots` con actualización de `inventory_by_site` en la misma transacción; numeración compartida `AT-2026-000123`. |
| **Excepción** | Vendedor sin permiso `pos.sell` ⇒ se rechaza la operación. Stock insuficiente ⇒ `409 INSUFFICIENT_STOCK`, sin pedido ni movimiento. Nunca se usa una reserva web para una venta POS. |

### RN-018 — Despacho a domicilio

| | |
|---|---|
| **Entradas** | Pedido `PAID`, `fulfillment_type = SHIPPING`, dirección, peso, cobertura. |
| **Salidas** | `shipments` con origen = sede dueña, `status = READY`, etiqueta generada; al recoger → `IN_TRANSIT`. |
| **Excepción** | Dirección incompleta o fuera de cobertura ⇒ se retiene la guía y se contacta al cliente antes de enviar. |

### RN-019 — Envíos parciales

| | |
|---|---|
| **Entradas** | Pedido con varios ítems, faltantes en la sede dueña. |
| **Salidas** | Varias `shipments` con `shipment_items`; `order.status` no pasa a `OUT_FOR_DELIVERY` (ni a `DELIVERED`) hasta que se despache el último paquete. |
| **Excepción** | Cliente rechaza envíos parciales ⇒ se cancelan las líneas pendientes con reembolso proporcional. |

### RN-020 — Transferencia entre sedes

| | |
|---|---|
| **Entradas** | `(from_site, to_site, variant, lot, qty)`, usuario autorizado. |
| **Salidas** | `site_transfers` + líneas; al despachar: movimiento `TRANSFER_OUT` en origen; al recibir: `TRANSFER_IN` en destino. Ambos lados actualizan `inventory_lots` y su proyección. |
| **Excepción** | `from_site = to_site`, lote bloqueado/vencido o `qty > disponible` ⇒ se rechaza. Toda diferencia se registra como `ADJUSTMENT` con aprobación. |

### RN-021 — Recepción parcial de transferencia

| | |
|---|---|
| **Entradas** | `received_quantity` por línea. |
| **Salidas** | Si hay diferencia, se registran movimientos de ajuste en ambas sedes y se bloquea el cierre hasta aprobación de inventario. |
| **Excepción** | Diferencia > `[transfer_variance_tolerance = 0]` ⇒ alerta y `audit_logs` obligatoria. |

### RN-022 — Lote bloqueado

| | |
|---|---|
| **Entradas** | Cambio de `LotStatus` a `BLOCKED`/`QUARANTINE`. |
| **Salidas** | Se excluye de FEFO; se liberan reservas `ACTIVE` de ese lote; se notifica a operación. |
| **Excepción** | Lote ya vendido en pedidos en `OUT_FOR_DELIVERY` o `DELIVERED` ⇒ no se altera el pedido; se abre incidencia de calidad separada. |

### RN-023 — Lotes próximos a vencer

| | |
|---|---|
| **Entradas** | `expires_at`, `[near_expiry_days = 90]`, `[block_expiry_days = 15]`. |
| **Salidas** | `15 < días ≤ 90`: se vende FEFO con **etiqueta de vencimiento** en PDP/carrito y recordatorio al operador. `días ≤ 15`: bloqueo automático de venta. `días < 0`: `EXPIRED` + baja. |
| **Excepción** | Producto con `requires_batch = false` ⇒ no aplica control de vencimiento (debe estar justificado y auditado). |

### RN-024 — Devoluciones y reposición de stock

| | |
|---|---|
| **Entradas** | Pedido `RETURN_REQUESTED` con devolución verificada, estado físico del producto, lote original. |
| **Salidas** | Si está sellado y vigente ⇒ reposición al **mismo lote y sede dueña** con movimiento `RETURN` (actualizando `inventory_lots` y su proyección) y orden → `REFUNDED`; si no ⇒ orden → `RETURN_REJECTED` (terminal, sin reembolso) y baja `DAMAGE` si aplica. **Nunca** se vuelve a `DELIVERED`. |
| **Excepción** | Lote vencido durante el proceso ⇒ nunca se repone; se genera nota crédito y baja. |

---

## 3. Cupones, reembolsos y postventa

### RN-025 — Vigencia y límites del cupón

| | |
|---|---|
| **Entradas** | `code`, fecha actual, `usage_limit`, `usage_limit_per_customer`, `first_purchase_only`. |
| **Salidas** | Cupón válido si `is_active`, `starts_at <= now <= ends_at`, `used_count < usage_limit` y no excede el límite por cliente. El contador se incrementa en la misma transacción del pedido. |
| **Excepción** | Cualquier condición fallida ⇒ `422 COUPON_UNAVAILABLE` con motivo público ("cupón vencido", "cupón agotado"). |

### RN-026 — Alcance del cupón

| | |
|---|---|
| **Entradas** | `scope`, `scope_ids`, `min_subtotal_cents`, `max_discount_cents`. |
| **Salidas** | `PERCENT`: `value` en bp sobre la base elegida, tope `max_discount`; `FIXED`: `value` en centavos, nunca mayor que la base; `FREE_SHIPPING`: anula `shipping_total`. |
| **Excepción** | Subtotal menor al mínimo ⇒ se rechaza indicando el monto faltante. No se permite descuento negativo. |

### RN-027 — Reembolsos

| | |
|---|---|
| **Entradas** | `payment_id`, `amount_cents`, `reason`, aprobación de finanzas. |
| **Salidas** | `refunds` + `payment_attempts(REFUND)` + reverso en pasarela + nota crédito DIAN; el `PaymentStatus` pasa a `REFUNDED` o `PARTIALLY_REFUNDED`. |
| **Excepción** | `amount > saldo reembolsable` ⇒ se rechaza. Error de pasarela ⇒ estado `FAILED` con reintento manual; **nunca** se marca como reembolsado sin confirmación. |

### RN-028 — Derecho de retracto

| | |
|---|---|
| **Entradas** | `order.status = DELIVERED`, `delivered_at`, solicitud del cliente. |
| **Salidas** | Se acepta dentro de **5 días hábiles** (Ley 1480/2011); orden → `RETURN_REQUESTED`, se congela la liquidación y se emite guía de devolución. Solo resuelve a `REFUNDED` (verificada) o a `RETURN_REJECTED` (rechazada). |
| **Excepción** | Fuera del plazo o producto no vendible ⇒ orden → `RETURN_REJECTED`, **estado terminal**, con fundamento legal, notificación fundada, auditoría y ofrecimiento de soporte técnico/garantía. Nunca se regresa a `DELIVERED`. |

### RN-029 — Contraentrega (COD)

| | |
|---|---|
| **Entradas** | Método `CASH_ON_DELIVERY`, teléfono verificado, `subtotal <= [cod_max_amount = 30000000]`, zona habilitada. |
| **Salidas** | Pedido nace `PENDING_PAYMENT`; al confirmar recaudo de la transportadora ⇒ `PAID`. No se llama a la pasarela. |
| **Excepción** | Monto/teléfono/zona inválidos o cancelación en ruta ⇒ se rechaza o se cancela con costo logístico registrado. |

---

## 4. Pagos, idempotencia y seguridad

### RN-030 — Idempotencia de checkout

| | |
|---|---|
| **Entradas** | Header `Idempotency-Key` + hash de la petición. Aplica igual a `POST /checkout` y a su alias `POST /pos/sales` (C-06). |
| **Salidas** | Si la clave existe con el mismo hash ⇒ se devuelve la respuesta original (mismo `order_id`, mismo `number`), sin crear otro pedido ni reserva. |
| **Excepción** | Misma clave con distinto hash ⇒ `409 IDEMPOTENCY_CONFLICT`. Clave expirada (24 h) ⇒ se permite reutilización. |

### RN-031 — Verificación de webhooks

| | |
|---|---|
| **Entradas** | Cuerpo crudo, cabecera de firma, timestamp, secreto del proveedor (desde gestor de secretos). |
| **Salidas** | Firma válida + timestamp dentro de ventana ⇒ se procesa; se guarda `webhook_events` con `event_id` único. Duplicado ⇒ `200` y sin efectos. |
| **Excepción** | Firma inválida, replay o monto distinto ⇒ `IGNORED`, alerta de seguridad y sin cambio de estado. |

### RN-032 — Auditoría obligatoria

| | |
|---|---|
| **Entradas** | Cualquier acción administrativa o cambio de estado sensible. |
| **Salidas** | `audit_logs` con `actor`, `action`, `entity`, `before`, `after`, `ip`, `user_agent`, `hash` encadenado. |
| **Excepción** | Fallo al escribir auditoría ⇒ se **aborta** la operación (fail-closed). No se permite acción admin sin rastro. |

### RN-033 — Datos personales

| | |
|---|---|
| **Entradas** | Teléfono, documento, direcciones, snapshots. |
| **Salidas** | Cifrado AES-256-GCM en reposo + hash ciego para búsqueda; acceso solo por roles autorizados; consentimiento registrado en `consents`. |
| **Excepción** | Solicitud de supresión ⇒ anonimización del `Customer`, conservando importes y facturas por 5 años. Nunca se almacena PAN/CVV (ver `flujos-pagos.md`). |

### RN-034 — Notificaciones

| | |
|---|---|
| **Entradas** | Evento de dominio (pago aprobado, pedido listo, guía generada), preferencias de canal y consentimiento `MARKETING`. |
| **Salidas** | `notifications` + `outbox_events`; transaccionales siempre, promocionales solo con opt-in. Reintentos con backoff; baja definitiva tras `[notification_max_attempts = 5]`. |
| **Excepción** | Cliente sin consentimiento para marketing ⇒ `SKIPPED`, sin sanción ni reintento. |

### RN-035 — Sede dueña del pedido

| | |
|---|---|
| **Entradas** | `fulfillment_type`, sede seleccionada, disponibilidad FEFO. |
| **Salidas** | `STORE_PICKUP` ⇒ sede dueña = sede de retiro. `SHIPPING` ⇒ sede dueña = sede donde se confirmó la reserva (prioridad + stock). Queda fija tras el pago. |
| **Excepción** | Cambio de sede antes de empacar ⇒ requiere nueva reserva y se registra en el historial; después de `PACKED` no se permite sin aprobación. |

### RN-036 — Conciliación y cierre

| | |
|---|---|
| **Entradas** | Reporte de liquidación de la pasarela, `payments`, `payment_attempts`, recaudos COD. |
| **Salidas** | Cruce diario por `provider_payment_id`; diferencias a incidencias con alerta; cierre mensual vs. abonos bancarios. |
| **Excepción** | Diferencia no resuelta en `[reconciliation_sla_hours = 48]` ⇒ escalado a finanzas y bloqueo de liquidación de ese lote. |

### RN-037 — Autenticación del flujo de cliente

| | |
|---|---|
| **Entradas** | Credenciales en `POST /auth/login`, IP de origen y cuenta. |
| **Salidas** | Máximo **5 intentos en 15 min por IP + cuenta**, con backoff exponencial; a partir del sexto intento dentro de la ventana se exige **CAPTCHA**. Éxito ⇒ access token (`typ=access`, 15 min) y refresh token en cookies `httpOnly; Secure; SameSite=Strict`. **No se usa `Authorization: Bearer` en el flujo de cliente** (C-04). |
| **Excepción** | Retorno desde Wompi ⇒ única excepción documentada: la cookie temporal se emite con `SameSite=Lax` para que el navegador la envíe en el redirect; se conmuta de vuelta a `Strict` en la respuesta siguiente. `Bearer` queda restringido a comunicación servidor-a-servidor (webhooks, worker, DIAN). |

### RN-038 — Límite de frecuencia de checkout

| | |
|---|---|
| **Entradas** | `POST /checkout` y su alias `POST /pos/sales`, sesión/cliente, `Idempotency-Key`. |
| **Salidas** | **20 req/min por sesión**; exceso ⇒ `429 RATE_LIMITED` con `Retry-After`. General de IP: 120 req/min. |
| **Excepción** | Reintentos con la misma `Idempotency-Key` cuentan para el límite pero devuelven la respuesta original (RN-030); nunca crean un segundo pedido. |

---

## 5. Matriz de trazabilidad de reglas

| Regla | Entidades involucradas | Documento relacionado |
|---|---|---|
| RN-001..007 (precios, IVA 1900 bp, redondeo `round_half_up`) | `products`, `product_variants`, `order_items`, `cart_items`, `coupons` | `diccionario-datos.md` §3 |
| RN-008..014 (FEFO 90/15, fuente de verdad `inventory_lots`, pago tardío) | `lots`, `inventory_lots`, `inventory_by_site`, `reservations`, `orders` | `maquinas-estado.md` §2, §4 |
| RN-015..021 (retiro, POS/OPS-09, envíos, transferencias) | `store_pickups`, `shipments`, `site_transfers`, `orders` | `maquinas-estado.md` §2, §5; `api-rest.md` §5.1 |
| RN-022..024 (lotes, devolución y rechazo terminal) | `lots`, `inventory_movements`, `refunds`, `orders` | `maquinas-estado.md` §2, §6 |
| RN-025..029 (cupones, reembolsos, retracto, COD) | `coupons`, `refunds`, `orders` | `api-rest.md`, `flujos-pagos.md` |
| RN-030..034 (idempotencia, webhooks, auditoría, datos, notificaciones) | `idempotency_keys`, `webhook_events`, `audit_logs`, `consents` | `flujos-pagos.md` |
| RN-035..036 (sede dueña, conciliación) | `orders`, `sites`, `payments` | `estrategia-datos.md` |
| RN-037..038 (auth por cookies, backoff/CAPTCHA, rate limits) | `users`, `auth_credentials`, `orders`, `sessions` | `api-rest.md` §2, §3 |

**Rango completo documentado: RN-001..038** (coherente con `estrategia-datos.md` § Calidad).

---

## 6. Parámetros configurables (semillas de `settings`)

| Clave | Valor inicial | Descripción |
|---|---|---|
| `reserve_ttl_minutes` | `30` | Vigencia de la reserva. |
| `pickup_expiry_hours` | `48` | Tiempo para retirar en tienda. |
| `min_days_to_expire` | `15` | Mínimo para permitir venta FEFO (bloqueo de venta). |
| `near_expiry_days` | `90` | Umbral de aviso de vencimiento cercano; sin descuento automático en Fase 1. |
| `login_max_attempts` | `5` | Intentos de login por IP + cuenta antes de exigir CAPTCHA (RN-037). |
| `login_window_minutes` | `15` | Ventana de cómputo de intentos de login (RN-037). |
| `checkout_rate_limit_per_minute` | `20` | Máximo de req/min en `/checkout` y su alias POS (RN-038). |
| `general_rate_limit_per_minute` | `120` | Límite general por IP. |
| `free_shipping_threshold_cents` | `15000000` | COP 150.000. |
| `max_qty_per_sku` | `99` | Límite por línea. |
| `cod_max_amount_cents` | `30000000` | COP 300.000. |
| `transfer_variance_tolerance` | `0` | Diferencia permitida en recepción. |
| `notification_max_attempts` | `5` | Reintentos de entrega. |
| `reconciliation_sla_hours` | `48` | SLA de resolución de diferencias. |
