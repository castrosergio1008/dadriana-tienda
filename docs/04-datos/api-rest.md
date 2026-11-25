# Contrato API REST — Adriana_tienda `/api/v1`

> **Estado:** Propuesta de diseño (fase de diseño). **No es implementación.**
> Los JSON mostrados son **ejemplos documentales**. La especificación ejecutable (OpenAPI
> 3.1) se derivará de este contrato en la fase de construcción.
> **Fuente operativa:** decisiones C-01, C-02, C-03, C-04, C-05, C-06, C-08 y C-12 de
> `docs/02-arquitectura/decisiones-comandante.md`. Ante duda, manda esa tabla.

---

## 1. General

> **Decisión:** El API es el contrato único (OpenAPI-first) y usa JWT de corta duración +
> permisos RBAC revalidados en servidor. El checkout es *hosted*: este API nunca recibe datos
> de tarjeta.

| Item | Valor |
|---|---|
| Base URL | `https://{host}/api/v1` |
| Protocolo | HTTPS obligatorio (HSTS). Sin HTTP. |
| Formato | `application/json; charset=utf-8` |
| Idioma | `Accept-Language: es-CO` (por defecto). Mensajes de error en español. |
| Moneda | `COP`. Todos los importes son `*_cents` en `BIGINT` (minor units), p. ej. `grand_total_cents`. Ver `diccionario-datos.md` §3 (C-02). |
| Impuesto | IVA 19 % = `1900 basis points` (`tax_rate_bp`). Prohibido usar `1900` como `rate` decimal. Fórmula por línea: `base_cents = round_half_up(total_line_cents / 1,19)`; `iva_cents = total_line_cents - base_cents`. |
| Zona horaria | ISO-8601 UTC (`2026-11-23T14:30:00Z`). La UI convierte a `America/Bogota`. |
| Versionado | Prefijo de URL `/api/v1`. Cambios rompientes ⇒ `/api/v2` con al menos 90 días de solapamiento. |
| Correlación | Toda respuesta incluye `X-Request-Id`. El cliente puede enviar uno propio. |
| Contrato primero | Este documento se aprueba antes de implementar rutas. |

### 1.1 Autenticación (C-04)

- **Storefront y panel admin:** el **access token** (`typ=access`, vigencia 15 min) y el
  **refresh token** opaco (vigencia 7 días, rotación en cada uso y revocación en `sessions`)
  viajan **siempre en cookies `httpOnly; Secure`**. Ninguno es legible desde JavaScript.
- `SameSite=Strict` por defecto en todas las cookies de sesión. **Única excepción:** la cookie
  de sesión de checkout usa `SameSite=Lax` **solo en el retorno desde Wompi**
  (`/checkout/return`) para que el navegador envíe la cookie en el redirect cross-site; se
  revalida en servidor y se conmuta de vuelta a `Strict` en la siguiente respuesta.
- **`Authorization: Bearer` está prohibido en el flujo de cliente.** Queda reservado a
  integraciones **servidor a servidor** (worker/outbox, conciliación, DIAN) con un *service
  token* de corta duración y ámbito mínimo. Los webhooks de pasarela no usan JWT: usan firma
  HMAC (§11).
- `roles` y `permissions` viajan como *claims*; el servidor **siempre** revalida contra la BD
  en operaciones sensibles (no confía solo en la token).
- Rutas públicas: catálogo de lectura, creación de carrito de invitado, webhooks (firma HMAC),
  tracking público.
- Rutas de cliente: requieren cookie de sesión `typ=access` y `role=CUSTOMER`, o token de
  invitado para el carrito.
- Rutas admin: requieren permiso explícito (`catalog.write`, `orders.refund`, etc.). **MFA
  obligatorio en MVP para Admin y Superadmin**; los Vendedores usan sesión de tablet de 8 h
  sin MFA (MFA para vendedores se difiere a Fase 2).

### 1.2 Paginación

Cursor basado en clave (estable bajo escrituras):

```
GET /products?limit=20&cursor=eyJpZCI6Ii4uLiJ9
```

```json
{
  "data": [ { "id": "9f1c...", "name": "..." } ],
  "pagination": {
    "nextCursor": "eyJpZCI6Il4uLiJ9",
    "hasMore": true,
    "limit": 20
  }
}
```

`limit` por defecto 20, máximo 100. Parámetros inválidos ⇒ `400 INVALID_PAGINATION`.

### 1.3 Rate limiting

| Ámbito | Límite único (C-05) | Ventana | Respuesta al exceder |
|---|---|---|---|
| IP pública (general) | 120 req | 1 min | `429 RATE_LIMITED` + `Retry-After` |
| `POST /checkout` (y su alias POS `POST /pos/sales`) | **20 req** | **1 min por sesión**, con `Idempotency-Key` obligatoria | `429` + `Retry-After` |
| `POST /cart` | 30 req | 1 min por IP/cliente | `429` |
| `POST /payments/*` | 10 req | 1 min por orden | `429` |
| `POST /auth/login` | **5 intentos** | **15 min por IP + cuenta**, con backoff exponencial | `429` + **CAPTCHA tras el quinto intento** (RN-037) |
| `POST /coupons/validate` | 20 req | 1 min por cliente | `429` |
| Webhooks | 300 req | 1 min por proveedor | `429` (el proveedor reintenta) |

> Estos son los **únicos** valores vigentes; sustituyen a cualquier otra cifra en RNF-016,
> ADR-005 y SEC-011. El backoff de login es exponencial (1 s, 2 s, 4 s, 8 s, 16 s) y el
> contador se clave por `(ip, account)`; el CAPTCHA se exige a partir del sexto intento
> dentro de la ventana, es decir, **tras agotar los cinco permitidos**.

### 1.4 Idempotencia

- `Idempotency-Key` **obligatorio** en `POST /checkout` (y su alias de canal POS), `POST /payments`, `POST /refunds`.
- UUID v4 o cadena única de 80 caracteres; TTL 24 h.
- Misma clave + mismo body ⇒ se devuelve la respuesta cacheada con header `Idempotent-Replay: true`.
- Misma clave + body distinto ⇒ `409 IDEMPOTENCY_CONFLICT`.

### 1.5 Modelo de error

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "No hay unidades disponibles en la sede seleccionada.",
    "details": [{ "field": "items[0].quantity", "reason": "available_2_requested_3" }],
    "requestId": "req_01J...",
    "retryable": false
  }
}
```

| HTTP | `code` típico | Uso |
|---|---|---|
| 400 | `BAD_REQUEST`, `INVALID_PAGINATION` | Parámetros mal formados. |
| 401 | `UNAUTHENTICATED`, `TOKEN_EXPIRED` | Falta o expiró el JWT. |
| 403 | `FORBIDDEN`, `INSUFFICIENT_PERMISSION` | Rol sin permiso. |
| 404 | `NOT_FOUND` | Recurso inexistente (sin filtrar existencia de emails). |
| 409 | `CONFLICT`, `IDEMPOTENCY_CONFLICT`, `ORDER_STATE_CONFLICT` | Estado inválido. |
| 422 | `VALIDATION_ERROR`, `INSUFFICIENT_STOCK`, `COUPON_UNAVAILABLE` | Regla de negocio no cumplida. |
| 429 | `RATE_LIMITED` | Límite excedido. |
| 500 | `INTERNAL_ERROR` | Error interno; **sin stack trace ni datos sensibles**. |
| 503 | `SERVICE_UNAVAILABLE` | Pasarela/servicio aguas abajo caído; se ofrece método alterno. |

---

## 2. Esquemas documentales reutilizables

```json
{
  "Money": { "amountCents": 119000, "currency": "COP", "formatted": "$119.000" },
  "Address": {
    "id": "uuid",
    "type": "SHIPPING",
    "recipientName": "Adriana Pérez",
    "line1": "Cra. 7 # 71-21",
    "city": "Bogotá",
    "department": "Bogotá D.C.",
    "isDefault": true
  },
  "OrderItem": {
    "sku": "MAS-HIAL-50",
    "productName": "Mascarilla Hialurónico",
    "variantName": "50 ml",
    "quantity": 2,
    "unitPriceCents": 119000,
    "lineTotalCents": 238000,
    "lotCode": "LOT-2026-087"
  }
}
```

> **`amountCents` es `BIGINT` en minor units.** IVA incluido en el ejemplo:
> `119000 = base_cents 100000 + iva_cents 19000`, con `tax_rate_bp = 1900` (basis points).
> Ningún importe de este contrato se expresa en COP enteros (C-02).

---

## 3. Dominio: Catálogo (público)

| Método | Path | Descripción | Auth |
|---|---|---|---|
| GET | `/products` | Listado paginado y filtrable | pública |
| GET | `/products/{slug}` | Detalle con variantes, imágenes y disponibilidad por sede | pública |
| GET | `/brands` | Marcas activas | pública |
| GET | `/categories/tree` | Árbol facial/cabello/cuerpo + subcategorías | pública |
| GET | `/products/{slug}/availability` | Stock disponible por sede (solo cantidades, sin ubicación exacta) | pública |
| GET | `/search?q=&facet=` | Búsqueda (índice derivado; fallback Postgres FTS) | pública |

### GET `/products`

**Query:** `limit`, `cursor`, `category`, `brand`, `skinType`, `hairType`, `activeIngredient`,
`minPriceCents`, `maxPriceCents`, `onSale`, `siteId`, `sort` (`relevance|price_asc|price_desc|newest`).

**200 OK**

```json
{
  "data": [
    {
      "id": "1c0e...",
      "slug": "mascarilla-hialuronico-50ml",
      "name": "Mascarilla Hialurónico",
      "brand": { "name": "La Roche", "slug": "la-roche" },
      "category": { "name": "Mascarillas", "path": "/facial/tratamiento/mascarillas" },
      "defaultVariant": {
        "sku": "MAS-HIAL-50",
        "presentation": "50 ml",
        "priceCents": 119000,
        "compareAtPriceCents": 149000,
        "taxIncluded": true
      },
      "imageUrl": "https://cdn.../mascarilla-50ml.avif",
      "ratingAvg": 4.7,
      "ratingCount": 38
    }
  ],
  "pagination": { "nextCursor": null, "hasMore": false, "limit": 20 }
}
```

### GET `/products/{slug}/availability`

**200 OK**

```json
{
  "productId": "uuid",
  "variants": [
    {
      "sku": "MAS-HIAL-50",
      "sites": [
        { "siteCode": "SDE-01", "siteName": "Chapinero", "available": 12, "pickupAvailable": true },
        { "siteCode": "SDE-02", "siteName": "Chicó", "available": 3, "pickupAvailable": true }
      ]
    }
  ]
}
```

> **Nota:** Nunca se expone el número de lote ni la ubicación física en endpoints públicos.

---

## 4. Dominio: Carrito (público / cliente)

| Método | Path | Descripción |
|---|---|---|
| POST | `/cart` | Crea carrito invitado; devuelve cookie firmada `cart_token`. |
| GET | `/cart` | Obtiene el carrito vigente (cookie o JWT). |
| POST | `/cart/items` | Agrega ítem. Body: `{ sku, quantity }`. |
| PATCH | `/cart/items/{itemId}` | Cambia cantidad (`1..99`). |
| DELETE | `/cart/items/{itemId}` | Elimina ítem. |
| POST | `/cart/coupon` | Aplica código. Body: `{ code }`. |
| DELETE | `/cart/coupon` | Retira cupón. |
| POST | `/cart/merge` | Fusiona carrito invitado con el del cliente tras login. |

**POST `/cart/items` — 201 Created**

```json
{
  "cartId": "uuid",
  "item": { "id": "uuid", "sku": "MAS-HIAL-50", "quantity": 1, "unitPriceCents": 119000 },
  "cart": {
    "subtotalCents": 119000,
    "discountCents": 0,
    "grandTotalCents": 119000,
    "itemCount": 1
  }
}
```

**Errores:** `422 INVALID_QUANTITY`, `422 PRODUCT_UNAVAILABLE` (variante inactiva),
`404 VARIANT_NOT_FOUND`. El carrito **no** aparta stock (RN-012).

---

## 5. Dominio: Checkout y pagos

| Método | Path | Descripción | Idempotencia |
|---|---|---|---|
| POST | `/checkout/quote` | Cotiza envío, aplica cupón y calcula totales **sin** reservar. | no |
| POST | `/checkout` | **Único contrato de creación de pedido.** Confirma carrito: crea cliente/pedido/reserva y devuelve `orderId` + `nextAction.checkoutUrl`. | **sí** |
| POST | `/pos/sales` | Alias de canal para la venta presencial (OPS-09): delega en el **mismo handler** de `/checkout` con `channel: POS`; no define un segundo contrato de creación (§5.1). | **sí** |
| POST | `/payments` | Crea intención de pago con el proveedor elegido (agnóstico). | **sí** |
| GET | `/payments/{id}` | Estado del pago (para polling controlado). | no |
| POST | `/payments/{id}/retry` | Nuevo intento con el mismo pago. | **sí** |
| POST | `/refunds` | Solicita reembolso (solo admin/finanzas). | **sí** |

> **C-06:** `POST /api/v1/checkout` es el único endpoint de creación de pedido. No existe
> `POST /orders` ni otro contrato de creación; el pedido POS se crea por el mismo servicio.

### POST `/checkout/quote`

```json
{
  "cartId": "uuid",
  "fulfillmentType": "SHIPPING",
  "addressId": "uuid",
  "couponCode": "ADRIANA10"
}
```

**200 OK**

```json
{
  "quoteId": "qt_...",
  "expiresAt": "2026-11-23T15:00:00Z",
  "lines": [{ "sku": "MAS-HIAL-50", "quantity": 1, "unitPriceCents": 119000 }],
  "subtotalCents": 119000,
  "discountTotalCents": 17850,
  "shippingTotalCents": 9900,
  "taxTotalCents": 16150,
  "grandTotalCents": 111050,
  "fulfillment": {
    "type": "SHIPPING",
    "carrier": "Coordinadora",
    "estimatedDeliveryAt": "2026-11-26T18:00:00Z"
  }
}
```

### POST `/checkout`

**Headers:** `Idempotency-Key: 7f3b...`; la autenticación viaja en la **cookie de sesión
`httpOnly`** (o en la cookie de carrito de invitado). **No se envía `Authorization: Bearer`
desde el navegador** (C-04).

```json
{
  "cartId": "uuid",
  "quoteId": "qt_...",
  "fulfillmentType": "SHIPPING",
  "grandTotalCents": 111050,
  "addressId": "uuid-direccion-facturacion-y-entrega",
  "customer": {
    "email": "cliente@example.com",
    "fullName": "Ana Torres",
    "phone": "+573001234567",
    "documentType": "CC",
    "documentNumber": "1020304050"
  },
  "acceptsMarketing": false,
  "consentVersion": "2026-01",
  "notes": "Entregar en horas de la tarde"
}
```

> `grandTotalCents` es el total que el cliente aceptó en la cotización. El servidor lo
> **recalcula** y lo compara: si difiere, responde `409 STALE_QUOTE`. Es `BIGINT` en centavos,
> con IVA incluido calculado por línea según `diccionario-datos.md` §3 (C-02).

**201 Created**

```json
{
  "orderId": "uuid",
  "orderNumber": "AT-2026-000123",
  "status": "PENDING_PAYMENT",
  "paymentStatus": "PENDING",
  "reservationExpiresAt": "2026-11-23T15:00:00Z",
  "grandTotalCents": 111050,
  "nextAction": {
    "type": "HOSTED_CHECKOUT",
    "provider": "WOMPI",
    "checkoutUrl": "https://checkout.wompi.co/..."
  }
}
```

> Los estados devueltos son los identificadores canónicos de C-08 (§6.1). El tipo de pago
> no se confirma con el redirect: solo el webhook firmado cambia el estado (§11).

**Errores:** `409 IDEMPOTENCY_CONFLICT`, `409 STALE_QUOTE`, `422 INSUFFICIENT_STOCK`,
`422 COUPON_UNAVAILABLE`, `422 ADDRESS_OUT_OF_COVERAGE`, `503 PAYMENT_PROVIDER_UNAVAILABLE`
(se ofrece método alterno).

### 5.1 Registro de venta presencial (POS — OPS-09, C-03)

`POST /api/v1/pos/sales` es el **alias de canal** del único contrato de creación de pedido.
Usa el mismo handler, el mismo esquema de request/response, la misma `Idempotency-Key` y el
mismo `nextAction` que `POST /checkout`; **no constituye un segundo contrato de creación**
(C-06). Lo invoca el panel de tablet de la sede con permiso `pos.sell`.

```json
{
  "cartId": "uuid-carrito-pos",
  "channel": "POS",
  "siteId": "uuid-sede-01",
  "fulfillmentType": "STORE_PICKUP",
  "grandTotalCents": 119000,
  "customer": { "email": "cliente@example.com", "fullName": "Ana Torres" },
  "payment": { "method": "CASH_CORRESPONSAL", "reference": "REC-000451" },
  "sellerId": "uuid-vendedor"
}
```

**201 Created**

```json
{
  "orderId": "uuid",
  "orderNumber": "AT-2026-000124",
  "status": "PAID",
  "paymentStatus": "PAID",
  "siteId": "uuid-sede-01",
  "channel": "POS",
  "grandTotalCents": 119000,
  "nextAction": { "type": "NONE", "checkoutUrl": null }
}
```

**Reglas:** descuento FEFO atómico sobre `inventory_lots` en la misma transacción (RN-009),
sin reserva web previa (RN-017); comparte numeración con el canal online; emite factura y
movimiento `SALE` de inmediato. `viewer` sin `pos.sell` ⇒ `403 FORBIDDEN`; stock insuficiente
⇒ `422 INSUFFICIENT_STOCK`. La sesión de tablet dura 8 h y no exige MFA en MVP (C-04).

### POST `/payments`

```json
{
  "orderId": "uuid",
  "provider": "WOMPI",
  "method": "PSE",
  "installments": null,
  "returnUrl": "https://tienda.example.com/checkout/return"
}
```

**201 Created**

```json
{
  "paymentId": "uuid",
  "status": "PENDING",
  "provider": "WOMPI",
  "amountCents": 111050,
  "checkoutUrl": "https://checkout.wompi.co/...",
  "expiresAt": "2026-11-23T15:00:00Z"
}
```

> El proveedor lo decide el arquitecto; el contrato expone `provider` como **enum agnóstico**
> (`WOMPI`, `EPAYCO`, `CASH`, `MANUAL`). **`MERCADO_PAGO` no existe en el contrato (C-12):
> adaptador descartado, no activo en Fase 2.** **Nunca** se envían datos de tarjeta a este API:
> el checkout es *hosted*. Ver `flujos-pagos.md`.

---

## 6. Dominio: Pedidos (cliente)

| Método | Path | Descripción |
|---|---|---|
| GET | `/orders` | Historial del cliente autenticado (paginado). |
| GET | `/orders/{number}` | Detalle. Solo el dueño o admin con permiso. |
| GET | `/orders/{number}/status` | Estado resumido + historial público (sin notas internas). |
| POST | `/orders/{number}/cancel` | Cancela si `PENDING_PAYMENT` (o según RN). |
| POST | `/orders/{number}/return-request` | Radica retracto dentro de los 5 días hábiles; rechazo ⇒ `RETURN_REJECTED` (terminal). |
| GET | `/shipments/{trackingNumber}` | Tracking público (sin PII). |

**GET `/orders/{number}` — 200 OK**

```json
{
  "number": "AT-2026-000123",
  "status": "READY_FOR_PICKUP",
  "paymentStatus": "PAID",
  "fulfillmentType": "STORE_PICKUP",
  "site": { "code": "SDE-01", "name": "Chapinero" },
  "items": [{ "sku": "MAS-HIAL-50", "quantity": 1, "unitPriceCents": 119000, "lineTotalCents": 119000 }],
  "totals": {
    "subtotalCents": 119000,
    "discountTotalCents": 0,
    "shippingTotalCents": 0,
    "taxTotalCents": 19000,
    "grandTotalCents": 119000
  },
  "pickup": { "status": "READY", "code": "482913", "windowStart": "2026-11-23T16:00:00Z" },
  "timeline": [
    { "from": "PENDING_PAYMENT", "to": "PAID", "at": "2026-11-23T14:32:10Z" },
    { "from": "PAID", "to": "PREPARING", "at": "2026-11-23T15:10:00Z" },
    { "from": "PACKED", "to": "READY_FOR_PICKUP", "at": "2026-11-23T16:00:00Z" }
  ]
}
```

#### 6.1 Estados canónicos de pedido y etiquetas de UI (C-08)

Los identificadores de `orders.status` son **siempre** los de la columna central. El español
es solo la **etiqueta de UI**, nunca un valor de enum ni un identificador de transición.
`READY_FOR_PICKUP` es un estado propio de `orders.status`, **no** un derivado de
`store_pickups.status` (`READY` en ese subsistema es el disparador operativo).

| Etiqueta UI (español) | Identificador canónico | Subsistema dueño |
|---|---|---|
| Pendiente de pago | `PENDING_PAYMENT` | `orders.status` |
| Pagado | `PAID` | `orders.status` |
| En preparación | `PREPARING` | `orders.status` |
| Empaquetado | `PACKED` | `orders.status` |
| Listo para retiro | `READY_FOR_PICKUP` | `orders.status` (sincroniza `store_pickups.status = READY`) |
| En camino | `OUT_FOR_DELIVERY` | `orders.status` (el guía usa `shipments.status`) |
| Entregado / Entregado en tienda | `DELIVERED` | `orders.status` |
| Cancelado | `CANCELLED` | `orders.status` |
| Reembolsado | `REFUNDED` | `orders.status` |
| Devolución solicitada / Retracto | `RETURN_REQUESTED` | `orders.status` |
| Retracto rechazado | `RETURN_REJECTED` | `orders.status` (terminal) |

**Prohibidas:** `RETURN_REQUESTED → DELIVERED`, `PAID_NEEDS_REVIEW`, `SHIPPED`, `RETURNED`,
`DRAFT` y `PICKED_UP_READY` como estados de `orders.status`. Ver `maquinas-estado.md` §2.

---

## 7. Dominio: Clientes

| Método | Path | Descripción | Auth |
|---|---|---|---|
| POST | `/auth/register` | Crea usuario y vincula `customer_id`. | pública |
| POST | `/auth/login` | Establece access + refresh en cookies `httpOnly; Secure; SameSite=Strict` (5 intentos/15 min por IP+cuenta, backoff + CAPTCHA). | pública |
| POST | `/auth/logout` | Revoca la sesión y limpia ambas cookies. | cookie |
| POST | `/auth/refresh` | Rota el refresh token de la cookie. | cookie |
| POST | `/auth/forgot-password` | Enlace de recuperación (sin revelar existencia). | pública |
| GET | `/me` | Perfil del cliente. | JWT |
| PATCH | `/me` | Actualiza datos personales y consentimientos. | JWT |
| GET | `/me/addresses` | Direcciones. | JWT |
| POST | `/me/addresses` | Crea dirección (máx. 10). | JWT |
| PATCH | `/me/addresses/{id}` | Actualiza dirección. | JWT |
| DELETE | `/me/addresses/{id}` | Soft delete; no borra snapshots. | JWT |
| GET | `/me/favorites` | Favoritos / wishlist. | JWT |
| POST | `/me/favorites` | Agrega `{ productId }`. | JWT |
| DELETE | `/me/favorites/{productId}` | Quita de favoritos. | JWT |
| POST | `/me/data-export` | Solicita exportación (Ley 1581). | JWT |
| POST | `/me/data-deletion` | Solicita anonimización. | JWT |

**PATCH `/me` — 200 OK**

```json
{
  "id": "uuid",
  "email": "cliente@example.com",
  "fullName": "Ana Torres",
  "acceptsMarketing": true,
  "consents": [{ "type": "MARKETING", "version": "2026-01", "granted": true }]
}
```

---

## 8. Dominio: Sedes (`sites`)

| Método | Path | Descripción | Auth |
|---|---|---|---|
| GET | `/sites` | Lista de sedes activas con horarios y servicios. | pública |
| GET | `/sites/{code}` | Detalle de una sede. | pública |
| GET | `/sites/{code}/pickup-slots` | Ventanas de retiro disponibles. | pública/JWT |
| GET | `/admin/sites` | Administración de sedes. | `sites.read` |

**GET `/sites` — 200 OK**

```json
{
  "data": [
    {
      "code": "SDE-01",
      "name": "Adriana Chapinero",
      "city": "Bogotá",
      "services": ["PICKUP", "POS", "INVENTORY"],
      "hours": [{ "day": "LUN", "open": "09:00", "close": "19:00" }],
      "isPickupPoint": true
    },
    {
      "code": "SDE-02",
      "name": "Adriana Chicó",
      "city": "Bogotá",
      "services": ["PICKUP", "POS", "INVENTORY"],
      "isPickupPoint": true
    }
  ]
}
```

---

## 9. Dominio: Inventario (admin)

| Método | Path | Descripción | Permiso |
|---|---|---|---|
| GET | `/admin/inventory?siteId=&sku=` | Stock por sede (on_hand, reserved, available). | `inventory.read` |
| GET | `/admin/inventory/movements?sku=&lotId=` | Kardex paginado. | `inventory.read` |
| POST | `/admin/inventory/adjustments` | Ajuste manual con motivo. | `inventory.adjust` |
| GET | `/admin/lots?sku=&expiringDays=` | Lotes, vencimientos y alertas FEFO. | `inventory.read` |
| PATCH | `/admin/lots/{id}/status` | Bloquear/liberar lote (requiere motivo). | `inventory.block` |
| POST | `/admin/transfers` | Crea transferencia entre sedes. | `inventory.transfer` |
| POST | `/admin/transfers/{id}/ship` | Marca despachada (genera `TRANSFER_OUT`). | `inventory.transfer` |
| POST | `/admin/transfers/{id}/receive` | Recibe con cantidades (genera `TRANSFER_IN`). | `inventory.transfer` |
| GET | `/admin/inventory/alerts` | Bajo stock, lotes por vencer, discrepancias. | `inventory.read` |

**POST `/admin/transfers`**

```json
{
  "fromSiteId": "uuid-sede-01",
  "toSiteId": "uuid-sede-02",
  "items": [
    { "sku": "MAS-HIAL-50", "lotId": "uuid-lote", "quantity": 6 }
  ],
  "notes": "Reposición por venta en Chicó"
}
```

**201 Created**

```json
{
  "id": "uuid",
  "code": "TRF-2026-000034",
  "status": "DRAFT",
  "fromSite": "SDE-01",
  "toSite": "SDE-02",
  "items": [{ "sku": "MAS-HIAL-50", "lotCode": "LOT-2026-087", "quantity": 6 }]
}
```

---

## 10. Dominio: Admin (catálogo, pedidos, cupones, reportes, usuarios)

| Método | Path | Descripción | Permiso |
|---|---|---|---|
| POST | `/admin/products` | Crea producto (borrador). | `catalog.write` |
| PATCH | `/admin/products/{id}` | Actualiza producto. | `catalog.write` |
| POST | `/admin/variants` | Crea SKU con presentación y precio. | `catalog.write` |
| POST | `/admin/media` | Registra imagen (URL firmada de subida). | `catalog.write` |
| GET | `/admin/orders` | Cola operativa: filtros `status,siteId,fulfillmentType,from,to`. | `orders.read` |
| PATCH | `/admin/orders/{id}/status` | Transición explícita con `reason`. | `orders.write` |
| POST | `/admin/orders/{id}/notes` | Nota interna (auditada). | `orders.write` |
| POST | `/admin/pickups/{id}/confirm` | Confirma retiro con código y documento. | `orders.write` |
| POST | `/admin/shipments/{id}/label` | Genera etiqueta. | `orders.ship` |
| POST | `/admin/coupons` | Crea cupón. | `promotions.write` |
| PATCH | `/admin/coupons/{id}` | Actualiza cupón. | `promotions.write` |
| GET | `/admin/reports/sales?from=&to=&siteId=` | Ventas por sede/canal. | `reports.read` |
| GET | `/admin/reports/inventory-valuation` | Valoración de inventario. | `reports.read` |
| GET | `/admin/reports/payments` | Conciliación de pagos. | `reports.read` |
| GET | `/admin/users` | Usuarios y roles. | `users.read` |
| POST | `/admin/users/{id}/roles` | Asigna rol. | `users.write` |
| GET | `/admin/audit-logs?entity=&actor=&from=` | Auditoría (solo lectura, inmutable). | `audit.read` |
| GET | `/admin/settings` | Configuración (valores de secretos **nunca** se devuelven). | `settings.read` |
| PATCH | `/admin/settings/{key}` | Actualiza parámetro. | `settings.write` |

**PATCH `/admin/orders/{id}/status`**

```json
{ "toStatus": "PACKED", "reason": "Picking completado en SDE-01" }
```

**200 OK**

```json
{
  "orderId": "uuid",
  "status": "PACKED",
  "pickup": { "status": "READY", "code": "482913" },
  "transitionId": "uuid"
}
```

**Errores:** `409 ORDER_STATE_CONFLICT` con `allowedTransitions: ["CANCELLED"]`.

---

## 11. Dominio: Webhooks (entrantes)

| Método | Path | Descripción |
|---|---|---|
| POST | `/webhooks/payments/{provider}` | Eventos de pasarela (`wompi`, `epayco`). `mercado-pago` no está activo (C-12). |
| POST | `/webhooks/shipping/{carrier}` | Eventos de transportadora. |
| GET | `/health` | Health check (sin PII). |

**Cabeceras requeridas:** `X-Event-Id`, `X-Event-Type`, `X-Signature` (HMAC-SHA256),
`X-Timestamp`. El cuerpo crudo se usa para verificar la firma.

**200 OK (siempre que la firma sea válida, incluso duplicados)**

```json
{ "received": true, "eventId": "evt_123", "result": "PROCESSED" }
```

**401 Unauthorized** si firma inválida: `{ "error": { "code": "INVALID_SIGNATURE", "message": "Firma no válida." } }`.

> Los webhooks **no** autentican con JWT: usan firma HMAC con secreto rotado desde el gestor
> de secretos. El evento se persiste en `webhook_events` antes de procesarse.
>
> **`Authorization: Bearer` solo para servidor a servidor (C-04):** el worker/outbox, la
> conciliación y la integración DIAN presentan un *service token* de corta duración con ámbito
> mínimo en las rutas internas `/internal/**`. El storefront y el panel admin **nunca** usan
> `Bearer`: sus tokens viajan en cookies `httpOnly`.

---

## 12. Seguridad transversal

- **CORS** restringido a los orígenes de la tienda y del panel admin; con credenciales,
  nunca con `Authorization: Bearer` desde el navegador.
- **CSP** estricta en el frontend; cookies `httpOnly`, `Secure`, `SameSite=Strict` con la
  excepción documentada `SameSite=Lax` únicamente en el retorno de Wompi (C-04).
- **Sanitización** de todo input con esquema (zod en la frontera). Sin SQL dinámico: solo Prisma
  / consultas parametrizadas.
- **Redacción** de PII en logs: nunca email completo, teléfono, documento ni PAN.
- **Errores internos** se devuelven como `500 INTERNAL_ERROR`; el detalle queda en el log con
  `requestId`.
- **403 vs 404:** para recursos del cliente se devuelve `404` si no pertenece al usuario (no
  filtrar existencia).
- **Secretos:** `settings.isSecretRef = true` ⇒ solo ruta al gestor; ningún secreto en este API.

---

## 13. Criterios de aceptación del contrato

1. Toda ruta documentada tiene al menos un ejemplo de request y response **y** un caso de error.
2. Ninguna ruta de pago acepta datos de tarjeta.
3. `Idempotency-Key` produce exactamente un pedido ante reintentos; **no existe un segundo
   contrato de creación** y la ruta POS delega en `/checkout`.
4. Los importes devueltos son `BIGINT` en centavos con IVA incluido (1900 bp) y coinciden con
   la factura; no aparece `1900` como rate decimal.
5. Las rutas admin exigen permiso, no solo rol, y escriben `audit_logs`; Admin y Superadmin
   exigen MFA en MVP.
6. El contrato pasa validación OpenAPI 3.1 antes de la implementación (fase de construcción).
7. Ningún ejemplo de cliente contiene `Authorization: Bearer`; los tokens viajan en cookies
   `httpOnly` (`Strict`, salvo el retorno de Wompi).
8. Login respeta 5 intentos/15 min por IP+cuenta con backoff y CAPTCHA; checkout 20 req/min
   por sesión con `Idempotency-Key`.
9. Todos los ejemplos usan el **formato único** `AT-2026-000123` (patrón `AT-AAAA-XXXXXX`,
   numeración compartida online/POS) y el cupón `ADRIANA10`; no aparece `mercado-pago`
   como adaptador activo.
10. Los estados de pedido son los canónicos de C-08 y no existe `RETURN_REQUESTED → DELIVERED`.
