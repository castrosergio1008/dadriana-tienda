# Modelo Lógico de Datos (ERD) — Adriana_tienda

> **Estado:** Propuesta de diseño (fase de diseño). **No es implementación.**
> **Convención:** nombres de modelos en `camelCase`, tablas físicas en `snake_case` (ver
> `diccionario-datos.md`). Los campos `_cents` son `BIGINT` y se explican en el diccionario.
> **Fuente operativa:** decisiones C-01, C-02, C-08 y C-12 de
> `docs/02-arquitectura/decisiones-comandante.md`. Vocabulario único: `sites` / `site_id`.

---

## 1. Notación

| Símbolo Mermaid | Significado |
|---|---|
| `||` | exactamente uno |
| `o|` | cero o uno |
| `}o` / `o{` | cero o muchos |
| `}|` / `|{` | uno o muchos |
| `PK` | llave primaria · `FK` llave foránea · `UK` llave única |

Las relaciones **en línea punteada** (`..`) son dependencias blandas / referencias históricas
sin integridad referencial (snapshots). El resto son FK reales con `ON DELETE` documentado en
el diccionario de datos.

---

## 2. ERD completo

```mermaid
erDiagram
    USERS {
        UUID id PK
        String email UK
        UUID customer_id FK "nullable, 1:1 con CLIENTES"
        String password_hash
        String phone_encrypted
        String phone_hash UK
        String document_hash UK
        UserStatus status
        DateTime created_at
        DateTime updated_at
        DateTime deleted_at
    }
    ROLES {
        UUID id PK
        String name UK
        String description
    }
    PERMISSIONS {
        UUID id PK
        String code UK
    }
    ROLE_PERMISSIONS {
        UUID role_id PK FK
        UUID permission_id PK FK
    }
    USER_ROLES {
        UUID user_id PK FK
        UUID role_id PK FK
    }
    SESSIONS {
        UUID id PK
        UUID user_id FK
        String token_hash UK
        DateTime expires_at
        DateTime revoked_at
    }
    CUSTOMERS {
        UUID id PK
        String email UK
        String document_hash UK
        String full_name
        DateTime created_at
        DateTime updated_at
        DateTime deleted_at
    }
    ADDRESSES {
        UUID id PK
        UUID customer_id FK
        AddressType type
        String line1
        String city_code
        Boolean is_default
    }
    WISHLIST_ITEMS {
        UUID customer_id PK FK
        UUID product_id PK FK
        DateTime created_at
    }
    CONSENTS {
        UUID id PK
        UUID customer_id FK
        ConsentType type
        Boolean granted
        DateTime created_at
    }

    BRANDS {
        UUID id PK
        String slug UK
        String name
        Boolean is_active
    }
    CATEGORIES {
        UUID id PK
        UUID parent_id FK "subcategoría = categoría hija"
        String slug UK
        String path
        Int depth
        Boolean is_active
    }
    PRODUCTS {
        UUID id PK
        UUID brand_id FK
        String sku_base UK
        String slug UK
        String name
        ProductStatus status
        Int tax_rate_bp
        Json ingredients
        DateTime published_at
    }
    PRODUCT_CATEGORIES {
        UUID product_id PK FK
        UUID category_id PK FK
        Boolean is_primary
        Int position
    }
    ATTRIBUTES {
        UUID id PK
        String code UK
        AttributeType type
        Boolean is_filterable
        Boolean is_variant_axis
    }
    ATTRIBUTE_VALUES {
        UUID id PK
        UUID attribute_id FK
        String code
        String label
        String hex_color
    }
    PRODUCT_ATTRIBUTE_VALUES {
        UUID product_id PK FK
        UUID attribute_id PK FK
        UUID attribute_value_id PK FK
    }
    PRESENTATIONS {
        UUID id PK
        String code UK
        Decimal quantity
        MeasureUnit unit
        String label
    }
    PRODUCT_VARIANTS {
        UUID id PK
        UUID product_id FK
        UUID presentation_id FK
        String sku UK
        String barcode UK
        String name
        BigInt price_cents
        BigInt compare_at_price_cents
        BigInt cost_cents
        VariantStatus status
    }
    VARIANT_ATTRIBUTE_VALUES {
        UUID variant_id PK FK
        UUID attribute_id PK FK
        UUID attribute_value_id FK
    }
    MEDIA {
        UUID id PK
        String storage_key UK
        String url
        String mime_type
        Int width
        Int height
    }
    PRODUCT_MEDIA {
        UUID product_id PK FK
        UUID media_id PK FK
        UUID variant_id FK
        MediaRole role
        Int position
    }

    SITES {
        UUID id PK
        String code UK
        String name
        SiteType type
        Boolean is_pickup_point
        Boolean is_active
        Int priority
    }
    LOTS {
        UUID id PK
        UUID variant_id FK
        String lot_code
        Date manufactured_at
        Date expires_at
        LotStatus status
    }
    INVENTORY_BY_SITE {
        UUID variant_id PK FK "proyección (no fuente de verdad)"
        UUID site_id PK FK
        Int on_hand
        Int reserved
        Int safety_stock
        Int reorder_point
        DateTime updated_at
    }
    INVENTORY_LOTS {
        UUID lot_id PK FK "fuente de verdad (C-01)"
        UUID site_id PK FK
        Int on_hand
        Int reserved
        DateTime updated_at
    }
    INVENTORY_MOVEMENTS {
        UUID id PK
        UUID variant_id FK
        UUID lot_id FK
        UUID site_id FK
        InventoryMovementType type
        Int quantity_signed
        String reference_type
        UUID reference_id
        DateTime created_at
    }
    RESERVATIONS {
        UUID id PK
        UUID variant_id FK
        UUID lot_id FK
        UUID site_id FK
        UUID cart_id FK
        UUID order_id FK
        Int quantity
        ReserveStatus status
        DateTime expires_at
    }
    SITE_TRANSFERS {
        UUID id PK
        String code UK
        UUID from_site_id FK
        UUID to_site_id FK
        TransferStatus status
        UUID created_by FK
        UUID received_by FK
        DateTime received_at
    }
    SITE_TRANSFER_ITEMS {
        UUID transfer_id PK FK
        UUID variant_id PK FK
        UUID lot_id PK FK
        Int quantity
    }

    CARTS {
        UUID id PK
        String token UK
        UUID customer_id FK
        CartStatus status
        String coupon_code
        DateTime expires_at
        DateTime last_activity_at
    }
    CART_ITEMS {
        UUID id PK
        UUID cart_id FK
        UUID variant_id FK
        Int quantity
        BigInt unit_price_snapshot_cents
    }
    COUPONS {
        UUID id PK
        String code UK
        CouponType type
        Int value
        DiscountScope scope
        BigInt min_subtotal_cents
        DateTime starts_at
        DateTime ends_at
        Int usage_limit
    }
    COUPON_REDEMPTIONS {
        UUID id PK
        UUID coupon_id FK
        UUID order_id FK
        UUID customer_id FK
        BigInt amount_cents
        DateTime created_at
    }

    ORDERS {
        UUID id PK
        String number UK "AT-2026-000123 (C-12)"
        UUID customer_id FK
        String customer_email
        UUID site_owner_id FK
        OrderStatus status
        PaymentStatus payment_status
        FulfillmentType fulfillment_type
        BigInt subtotal_cents
        BigInt discount_total_cents
        BigInt shipping_total_cents
        BigInt tax_total_cents
        BigInt grand_total_cents
        String currency
        String idempotency_key UK
        Json shipping_address_snapshot
        DateTime placed_at
        DateTime paid_at
        DateTime expires_at
    }
    ORDER_ITEMS {
        UUID id PK
        UUID order_id FK
        UUID variant_id FK "nullable, SetNull"
        UUID lot_id FK "nullable, referencia historica"
        String sku
        String product_name
        BigInt unit_price_cents
        BigInt unit_discount_cents
        Int quantity
        Int tax_rate_bp
        BigInt tax_amount_cents
        BigInt line_total_cents
        Json product_snapshot
    }
    ORDER_STATUS_HISTORY {
        UUID id PK
        UUID order_id FK
        OrderStatus from_status
        OrderStatus to_status
        UUID actor_id FK
        DateTime created_at
    }
    PAYMENTS {
        UUID id PK
        UUID order_id FK
        PaymentProvider provider
        PaymentMethod method
        PaymentStatus status
        BigInt amount_cents
        String provider_payment_id
        DateTime paid_at
    }
    PAYMENT_ATTEMPTS {
        UUID id PK
        UUID payment_id FK
        UUID webhook_event_id FK
        TransactionType type
        TransactionStatus status
        BigInt amount_cents
        String provider_txn_id UK
        Json raw_payload
        DateTime created_at
    }
    WEBHOOK_EVENTS {
        UUID id PK
        String provider
        String event_id
        String event_type
        WebhookStatus status
        Boolean signature_valid
        Json payload
        Int attempts
        DateTime received_at
        DateTime processed_at
    }
    IDEMPOTENCY_KEYS {
        UUID id PK
        String key UK
        String scope
        String request_hash
        Int response_status
        Json response_body
        DateTime expires_at
    }
    SHIPMENTS {
        UUID id PK
        UUID order_id FK
        UUID origin_site_id FK
        String carrier
        String tracking_number
        ShipmentStatus status
        BigInt cost_cents
        Json address_snapshot
        DateTime shipped_at
        DateTime delivered_at
    }
    SHIPMENT_ITEMS {
        UUID shipment_id PK FK
        UUID order_item_id PK FK
        Int quantity
    }
    STORE_PICKUPS {
        UUID id PK
        UUID order_id UK FK
        UUID site_id FK
        PickupStatus status
        String pickup_code
        DateTime window_start
        DateTime window_end
        DateTime ready_at
        DateTime picked_up_at
        UUID picked_up_by FK
    }
    REFUNDS {
        UUID id PK
        UUID payment_id FK
        UUID order_id FK
        BigInt amount_cents
        RefundReason reason
        RefundStatus status
        String provider_refund_id
        Boolean restock
        DateTime created_at
    }
    INVOICES {
        UUID id PK
        UUID order_id FK
        UUID parent_invoice_id FK
        InvoiceType type
        InvoiceStatus status
        String cufe UK
        String number
        DateTime issued_at
    }
    NOTIFICATIONS {
        UUID id PK
        UUID customer_id FK
        UUID order_id FK
        NotificationChannel channel
        String template_code
        Json payload
        NotificationStatus status
        String provider_message_id
        DateTime sent_at
    }
    AUDIT_LOGS {
        UUID id PK
        UUID actor_id FK
        AuditActorType actor_type
        String action
        String entity_type
        String entity_id
        Json before
        Json after
        String ip
        DateTime created_at
    }
    SETTINGS {
        UUID id PK
        String key
        UUID site_id FK
        Json value
        String description
        Boolean is_secret_ref
        DateTime updated_at
    }
    OUTBOX_EVENTS {
        UUID id PK
        String aggregate_type
        String aggregate_id
        String event_type
        Json payload
        OutboxStatus status
        Int attempts
        DateTime available_at
    }

    USERS |o--o| CUSTOMERS : "se vincula a"
    USERS ||--o{ USER_ROLES : "tiene"
    ROLES ||--o{ USER_ROLES : "asignada a"
    ROLES ||--o{ ROLE_PERMISSIONS : "confiere"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "usada por"
    USERS ||--o{ SESSIONS : "abre"
    CUSTOMERS ||--o{ ADDRESSES : "registra"
    CUSTOMERS ||--o{ WISHLIST_ITEMS : "guarda"
    CUSTOMERS ||--o{ CONSENTS : "otorga"
    CUSTOMERS ||--o{ CARTS : "abre"
    CUSTOMERS ||--o{ ORDERS : "realiza"
    CUSTOMERS ||--o{ NOTIFICATIONS : "recibe"
    CUSTOMERS ||--o{ COUPON_REDEMPTIONS : "canojea"

    BRANDS ||--o{ PRODUCTS : "posee"
    CATEGORIES ||--o{ CATEGORIES : "padre de subcategoria"
    CATEGORIES ||--o{ PRODUCT_CATEGORIES : "clasifica"
    PRODUCTS ||--o{ PRODUCT_CATEGORIES : "pertenece a"
    PRODUCTS ||--o{ PRODUCT_ATTRIBUTE_VALUES : "describe"
    ATTRIBUTES ||--o{ ATTRIBUTE_VALUES : "domina"
    ATTRIBUTES ||--o{ PRODUCT_ATTRIBUTE_VALUES : "aplica a"
    ATTRIBUTE_VALUES ||--o{ PRODUCT_ATTRIBUTE_VALUES : "valor de"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "se ofrece como"
    PRESENTATIONS ||--o{ PRODUCT_VARIANTS : "define presentacion de"
    PRODUCT_VARIANTS ||--o{ VARIANT_ATTRIBUTE_VALUES : "tiene ejes de"
    ATTRIBUTES ||--o{ VARIANT_ATTRIBUTE_VALUES : "define eje"
    ATTRIBUTE_VALUES ||--o{ VARIANT_ATTRIBUTE_VALUES : "valor de eje"
    PRODUCTS ||--o{ PRODUCT_MEDIA : "muestra"
    MEDIA ||--o{ PRODUCT_MEDIA : "usada en"
    PRODUCT_VARIANTS |o--o{ PRODUCT_MEDIA : "etiqueta imagen especifica"
    WISHLIST_ITEMS }o--|| PRODUCTS : "apunta a"

    PRODUCT_VARIANTS ||--o{ LOTS : "se produce en"
    PRODUCT_VARIANTS ||--o{ INVENTORY_BY_SITE : "se cuenta en"
    SITES ||--o{ INVENTORY_BY_SITE : "posee"
    LOTS ||--o{ INVENTORY_LOTS : "se cuenta en (fuente de verdad)"
    SITES ||--o{ INVENTORY_LOTS : "posee por lote"
    INVENTORY_LOTS }o..|| INVENTORY_BY_SITE : "se agrega en la proyección, misma transacción (sin FK)"
    PRODUCT_VARIANTS ||--o{ INVENTORY_MOVEMENTS : "movimiento de"
    LOTS ||--o{ INVENTORY_MOVEMENTS : "movimiento de"
    SITES ||--o{ INVENTORY_MOVEMENTS : "registra"
    PRODUCT_VARIANTS ||--o{ RESERVATIONS : "aparta"
    LOTS ||--o{ RESERVATIONS : "aparta de"
    SITES ||--o{ RESERVATIONS : "aparta en"
    CARTS |o--o{ RESERVATIONS : "genera"
    ORDERS |o--o{ RESERVATIONS : "confirma"
    SITES ||--o{ SITE_TRANSFERS : "origen"
    SITES ||--o{ SITE_TRANSFERS : "destino"
    USERS |o--o{ SITE_TRANSFERS : "crea y recibe"
    SITE_TRANSFERS ||--o{ SITE_TRANSFER_ITEMS : "mueve"
    PRODUCT_VARIANTS ||--o{ SITE_TRANSFER_ITEMS : "transferido"
    LOTS ||--o{ SITE_TRANSFER_ITEMS : "transferido"

    CARTS ||--o{ CART_ITEMS : "contiene"
    PRODUCT_VARIANTS ||--o{ CART_ITEMS : "referencia"
    CARTS |o--o| COUPONS : "aplica codigo"
    COUPONS ||--o{ COUPON_REDEMPTIONS : "se canjea"
    CARTS |o--o| ORDERS : "se convierte en"
    ORDERS ||--o{ ORDER_ITEMS : "detalla"
    PRODUCT_VARIANTS |o--o{ ORDER_ITEMS : "referencia historica"
    LOTS |o--o{ ORDER_ITEMS : "lote vendido"
    ORDERS ||--o{ ORDER_STATUS_HISTORY : "registra"
    USERS |o--o{ ORDER_STATUS_HISTORY : "ejecuta"
    SITES ||--o{ ORDERS : "sede dueña"
    ORDERS ||--o{ PAYMENTS : "se paga con"
    PAYMENTS ||--o{ PAYMENT_ATTEMPTS : "intenta"
    WEBHOOK_EVENTS |o--o| PAYMENT_ATTEMPTS : "confirma intento"
    ORDERS ||--o{ COUPON_REDEMPTIONS : "registra descuento"
    ORDERS |o--o| SHIPMENTS : "se despacha"
    SITES ||--o{ SHIPMENTS : "origen del despacho"
    SHIPMENTS ||--o{ SHIPMENT_ITEMS : "empaqueta"
    ORDER_ITEMS ||--o{ SHIPMENT_ITEMS : "se envia en"
    ORDERS ||--o| STORE_PICKUPS : "se recoge en"
    SITES ||--o{ STORE_PICKUPS : "entrega pedido"
    USERS |o--o{ STORE_PICKUPS : "entrega en mostrador"
    PAYMENTS ||--o{ REFUNDS : "se revierte"
    ORDERS ||--o{ REFUNDS : "se revierte"
    ORDERS ||--o{ INVOICES : "se factura"
    INVOICES |o--o{ INVOICES : "nota credito sobre factura"
    ORDERS ||--o{ NOTIFICATIONS : "genera"
    USERS |o--o{ AUDIT_LOGS : "registra accion"
    SITES |o--o{ SETTINGS : "configuracion por sede"
```

---

## 3. Tablas de unión (sin entidad propia)

| Tabla | Llave primaria compuesta | Propósito |
|---|---|---|
| `user_roles` | `(user_id, role_id)` | Asignación RBAC de usuarios. |
| `role_permissions` | `(role_id, permission_id)` | Permisos por rol. |
| `product_categories` | `(product_id, category_id)` | Producto puede estar en varias categorías; `is_primary` marca la principal. |
| `product_attribute_values` | `(product_id, attribute_id, attribute_value_id)` | Facetas del producto (tipo de piel, tipo de cabello, activo, concern). |
| `variant_attribute_values` | `(variant_id, attribute_id)` | Ejes que diferencian SKUs (presentación, tono). |
| `product_media` | `(product_id, media_id, role)` | Galería multi-imagen con rol y posición; `variant_id` opcional. |
| `inventory_by_site` | `(variant_id, site_id)` | **Proyección** de disponibilidad por sede; se actualiza en la misma transacción que `inventory_lots`. |
| `inventory_lots` | `(lot_id, site_id)` | **Fuente de verdad** del stock exacto por lote y sede (C-01). |
| `site_transfer_items` | `(transfer_id, variant_id, lot_id)` | Líneas de transferencia. |
| `shipment_items` | `(shipment_id, order_item_id)` | Reparto de ítems en guías (envíos parciales). |

---

## 4. Subcategoría: decisión de modelado

> **Decisión:** **No existe tabla `subcategories`.** La subcategoría es una fila de
> `categories` con `parent_id` no nulo (`depth >= 1`) y `path` materializado
> (`/cabello/tratamiento/mascarilla`). Así se soporta profundidad arbitraria sin una tabla
> adicional y se alinea con el DESIGN_DOC §10.3. Los ejemplos del enunciado
> (facial / cabello / cuerpo) son `depth = 0`; "mascarilla capilar" es `depth = 2`.

---

## 5. Granularidad del inventario: decisión de modelado

> **Decisión (C-01, aprobada; ya no es un delta pendiente):** Existen **dos vistas del mismo
> stock**, actualizadas en la **misma transacción**:
>
> 1. `inventory_lots (lot_id, site_id)` → **fuente de verdad**. Aquí se aplica el `UPDATE`
>    atómico condicional (`reserved ≤ on_hand`) y se descuenta FEFO.
> 2. `inventory_by_site (variant_id, site_id)` → **solo una proyección** para consultas rápidas
>    de disponibilidad y listados. Debe cumplir `on_hand = Σ inventory_lots.on_hand` y
>    `reserved = Σ inventory_lots.reserved`.
>
> Un job de reconciliación diaria verifica la igualdad y alerta si hay desvío. Un `CHECK` en
> ambas tablas impide negativos y `reserved > on_hand`. No existe un modelo alternativo
> `inventory(variant_id, branch_id)`: el vocabulario único es `site_id` / `sites`.
>
> **FEFO cerrado por C-01:** aviso a 90 días, bloqueo de venta a 15 días y sin descuento
> automático en Fase 1 (la antigua pregunta DD-Q9 / RM-Q9 ya no está abierta).

---

## 6. ON DELETE y borrado

| Tipo | Política |
|---|---|
| Catálogo y personas | `deleted_at` (soft delete). Nunca borrado físico mientras existan pedidos. |
| Pedidos, pagos, ítems, facturas, auditoría, webhooks | **Inmutables**, sin `ON DELETE CASCADE` que permita eliminarlos. |
| Niños dependientes puros (`cart_items`, `shipment_items`, `order_status_history`) | `ON DELETE CASCADE` solo desde su padre directo. |
| Referencias históricas (`order_items.variant_id`, `audit_logs.actor_id`, `sessions.user_id`) | `ON DELETE SET NULL` / `RESTRICT` según corresponda; el snapshot conserva el dato. |

---

## 7. Deltas aprobados y adoptados

> Estos deltas **ya están decididos** por la tabla maestra `decisiones-comandante.md` y por el
> Design Doc enmendado; no quedan opciones conviviendo. Referencia: C-01, C-02, C-08, C-12.

| Tema | Decisión adoptada | Motivo / referencia |
|---|---|---|
| Personas | `users` + `customers` separados | Historial unificado de invitados y RBAC de panel desacoplado. |
| Dinero | `BigInt` `*_cents`, IVA `1900 basis points`, `round_half_up` por línea | Exactitud y compatibilidad con pasarelas en minor units (C-02). |
| Sedes | `sites` (2 tiendas físicas), clave `site_id` | El negocio tiene dos sedes que venden, no almacenes centrales; prohibido `branch_id`/`branches` (C-01). |
| Stock | `inventory_lots(lot_id, site_id)` fuente de verdad + `inventory_by_site` proyección en la misma transacción | Trazabilidad FEFO obligatoria en cosméticos (C-01). |
| Lotes y FEFO | `lots` + FEFO con aviso 90 días / bloqueo 15 días, sin descuento automático en Fase 1 | Requisito crítico del cliente; pregunta cerrada por C-01. |
| Transferencias / retiro | `site_transfers`, `store_pickups`; `READY_FOR_PICKUP` es estado de `orders.status` | Dos sedes + C-08. |
| Notificación / configuración | `notifications` + `settings` (+ outbox) | Separar entrega de mensaje de configuración de negocio. |
| Reembolsos | `refunds` propia, con `restock`, motivo y aprobación | Necesita trazabilidad DIAN. |
| Numeración y cupón | `AT-2026-000123`, `ADRIANA10` | Formato único en todos los ejemplos (C-12). |
| Venta POS | Pedido creado por `POST /checkout` con `channel = POS` | OPS-09 en MVP; sin segundo contrato de creación (C-03, C-06). |

---

## 8. Estados de pedido

`orders.status` usa exclusivamente los identificadores canónicos de C-08:
`PENDING_PAYMENT`, `PAID`, `PREPARING`, `PACKED`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`,
`DELIVERED`, `CANCELLED`, `REFUNDED`, `RETURN_REQUESTED` y `RETURN_REJECTED`.
La tabla de mapeo desde etiquetas UI y las transiciones están en `maquinas-estado.md` §2;
el contrato HTTP los expone igual en `api-rest.md` §6.1. `RETURN_REJECTED` es terminal.
