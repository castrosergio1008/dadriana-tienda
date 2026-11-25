# Diccionario de Datos — Adriana_tienda

> **Estado:** Propuesta de diseño (fase de diseño). **No es implementación.**
> Tipos expresados en terminología PostgreSQL / Prisma. Todo `TIMESTAMPTZ` se almacena en UTC
> y se presenta en `America/Bogota`.
> **Fuente operativa:** decisiones C-01, C-02 y C-08 de
> `docs/02-arquitectura/decisiones-comandante.md`. Vocabulario único de sede: **`sites` /
> `site_id`** (C-01); quedan prohibidos `branch_id`, `branches` y `sucursal_id` como
> identificadores técnicos («sede» sigue siendo la etiqueta de negocio en español).

---

## 1. Convenciones de nombres

| Elemento | Regla | Ejemplo |
|---|---|---|
| Tabla física | `snake_case`, plural | `product_variants` |
| Modelo Prisma | `PascalCase`, singular | `ProductVariant` |
| Columna | `snake_case` | `expires_at` |
| Campo Prisma | `camelCase` + `@map` | `expiresAt @map("expires_at")` |
| Llave primaria | `id UUID` (uuid v7 cuando esté disponible; si no, uuid v4) | `id` |
| Llave foránea | `<entidad>_id UUID` | `site_id` |
| Campo monetario | `<concepto>_cents BIGINT` | `grand_total_cents` |
| Tasa/porcentaje | `<concepto>_bp INT` (basis points, 1 bp = 0,01 %) | `tax_rate_bp = 1900` ⇒ IVA 19 %; **nunca** `1900` como rate decimal |
| Booleano | `is_<adjetivo>` o `has_<sustantivo>` | `is_active` |
| Fecha de evento | `<verbo>_at` | `paid_at` |
| Fecha de vigencia | `<sustantivo>_at` / `_date` para fechas sin hora | `expires_at`, `expires_on DATE` |
| Snapshot | `<dato>_snapshot JSONB` | `shipping_address_snapshot` |
| Dato cifrado | `<dato>_encrypted TEXT` + `<dato>_hash VARCHAR(64)` para búsqueda ciega | `phone_encrypted`, `phone_hash` |
| Enums | `UPPER_SNAKE_CASE` | `PENDING_PAYMENT` |
| Índice | `<tabla>_<campos>_idx`, unique `<tabla>_<campos>_uq` | `orders_status_created_idx` |

---

## 2. Auditoría estándar

Toda tabla **transaccional o de catálogo** incluye:

| Campo | Tipo | Nulable | Default | Descripción |
|---|---|---|---|---|
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | Creación del registro (UTC). |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | Última modificación; lo gestiona la capa de aplicación. |
| `deleted_at` | `TIMESTAMPTZ` | SÍ | `NULL` | Soft delete. `NULL` = vigente. |

**Excepciones:** tablas de solo inserción (`audit_logs`, `webhook_events`,
`inventory_movements`, `order_status_history`, `outbox_events`, `idempotency_keys`) **no** tie-
nen `updated_at` ni `deleted_at`; son inmutables por diseño. Las tablas de unión tampoco lo
tienen salvo que se indique lo contrario.

> **Decisión:** Los pedidos, pagos, reembolsos y facturas **nunca se eliminan físicamente**.
> Para cumplir derechos de supresión (Ley 1581) se **anonimiza** el cliente vinculado y se
> conservan los importes por obligación tributaria (5 años). Ver `estrategia-datos.md`.

---

## 3. Decisión monetaria (justificada)

> **Decisión:** Todo importe se almacena como **entero en centavos** (`BIGINT`, sufijo
> `_cents`). Se descarta `NUMBER(12,2)` / `DECIMAL(12,2)`.

| Criterio | `DECIMAL(12,2)` | `BIGINT` centavos (elegido) |
|---|---|---|
| Exactitud | Sí | Sí (aritmética entera) |
| Arreglo con pasarelas | Requiere conversión | Wompi/ePayco ya trabajan en `amount_in_cents`; comparación 1:1 |
| Agregaciones e índices | Más costosos | Nativos, sin redondeo implícito |
| Riesgo de coma flotante | Ninguno si se usa `Decimal`, alto si se usa `float` | Nulo |
| Presentación | Directa | Dividir entre 100 **solo en la capa de presentación** con formato `es-CO` |

**Reglas de oro (C-02):**
1. Nunca se divide un importe antes de sumarlo. Todos los importes son `*_cents BIGINT`.
2. Todo redondeo es **`round_half_up` al centavo** y se aplica **por línea de pedido**, nunca
   sobre el total agregado.
3. `tax_rate_bp = 1900` significa **1900 basis points = IVA 19 %**. Queda prohibido usar
   `1900` como `rate` decimal. Los precios de catálogo son **con IVA incluido**.
4. Fórmula canónica: `base_cents = round_half_up(total_line_cents / 1,19)` y
   `iva_cents = total_line_cents - base_cents`. Equivalente entero:
   `base_cents = round_half_up(total_line_cents · 10000 / (10000 + tax_rate_bp))`.
   La suma de `base_cents + iva_cents` por línea debe cuadrar exactamente con
   `total_line_cents`.
5. La moneda siempre es `COP` (`CHAR(3)`); no se almacena tasa de cambio en el MVP.
6. `BIGINT` (no `INT`) evita desbordamiento en totales acumulados y conciliaciones.
7. Ejemplo: `total_line_cents = 119000` ⇒ `base_cents = 100000`, `iva_cents = 19000`,
   `tax_rate_bp = 1900`. Ningún importe se expresa en «COP enteros».

---

## 4. Identidad y acceso

### 4.1 `users`

| Campo | Tipo | Nulable | Default | Descripción / Restricción |
|---|---|---|---|---|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK. |
| `email` | `VARCHAR(254)` | NO | — | Único, minúsculas, validado por regex. |
| `email_verified_at` | `TIMESTAMPTZ` | SÍ | `NULL` | Verificación por enlace. |
| `customer_id` | `UUID` | SÍ | `NULL` | FK → `customers.id`, **único**. Vincula credencial con historial. |
| `password_hash` | `VARCHAR(255)` | SÍ | `NULL` | Argon2id; `NULL` si login federado. |
| `phone_encrypted` | `TEXT` | SÍ | `NULL` | AES-256-GCM. |
| `phone_hash` | `VARCHAR(64)` | SÍ | `NULL` | SHA-256 con pepper, único, búsqueda ciega. |
| `document_type` | `VARCHAR(10)` | SÍ | `NULL` | `CC`, `CE`, `PA`, `NIT`. |
| `document_number_encrypted` | `TEXT` | SÍ | `NULL` | Cifrado. |
| `document_hash` | `VARCHAR(64)` | SÍ | `NULL` | Único. |
| `status` | `UserStatus` | NO | `PENDING_VERIFICATION` | Ver máquinas de estado. |
| `accepts_marketing` | `BOOLEAN` | NO | `false` | Requiere consentimiento explícito. |
| `last_login_at` | `TIMESTAMPTZ` | SÍ | `NULL` | — |
| `created_at` / `updated_at` / `deleted_at` | — | — | — | Auditoría estándar. |

**Índices:** `uq(email)`, `uq(customer_id) WHERE customer_id IS NOT NULL`, `uq(phone_hash)`,
`uq(document_hash)`, `idx(status)`, `idx(created_at DESC)`, parcial
`idx(email) WHERE deleted_at IS NULL`.

### 4.2 `roles`, `permissions`, `user_roles`, `role_permissions`, `sessions`

| Tabla | Campo | Tipo | Nulable | Default | Descripción / Restricción |
|---|---|---|---|---|---|
| `roles` | `id` | `UUID` | NO | uuid | PK. |
| | `name` | `VARCHAR(60)` | NO | — | Único: `ADMIN`, `OPERATOR`, `SELLER`, `ACCOUNTANT`. |
| | `description` | `VARCHAR(255)` | SÍ | `NULL` | — |
| `permissions` | `id` | `UUID` | NO | uuid | PK. |
| | `code` | `VARCHAR(80)` | NO | — | Único: `catalog.write`, `orders.refund`, `inventory.transfer`. |
| `user_roles` | `user_id`, `role_id` | `UUID` | NO | — | PK compuesta; FK con `ON DELETE CASCADE`. |
| `role_permissions` | `role_id`, `permission_id` | `UUID` | NO | — | PK compuesta; FK con `ON DELETE CASCADE`. |
| `sessions` | `id` | `UUID` | NO | uuid | PK. |
| | `user_id` | `UUID` | NO | — | FK → `users.id` `CASCADE`. |
| | `token_hash` | `VARCHAR(128)` | NO | — | Único. Solo se guarda el hash del JWT de refresco. |
| | `ip`, `user_agent` | `VARCHAR(45)`, `VARCHAR(512)` | SÍ | `NULL` | — |
| | `expires_at`, `revoked_at` | `TIMESTAMPTZ` | NO / SÍ | — / `NULL` | Expiración y revocación. |

**Índices:** `idx(user_id)`, `idx(expires_at)`, parcial
`idx(token_hash) WHERE revoked_at IS NULL`.

### 4.3 `customers`

| Campo | Tipo | Nulable | Default | Descripción / Restricción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `email` | `VARCHAR(254)` | NO | — | Único; identidad unificada (invitado → registrado). |
| `full_name` | `VARCHAR(160)` | SÍ | `NULL` | Nombre canónico del cliente. |
| `document_hash` | `VARCHAR(64)` | SÍ | `NULL` | Único; búsqueda ciega. |
| `default_phone_hash` | `VARCHAR(64)` | SÍ | `NULL` | Para OTP / verificación. |
| `is_verified` | `BOOLEAN` | NO | `false` | Teléfono o email verificado. |
| `notes` | `TEXT` | SÍ | `NULL` | Notas internas de atención. |
| `created_at` / `updated_at` / `deleted_at` | — | — | — | Auditoría estándar. |

**Índices:** `uq(email)`, `uq(document_hash) WHERE document_hash IS NOT NULL`,
`idx(created_at DESC)`.

### 4.4 `addresses`

| Campo | Tipo | Nulable | Default | Descripción / Restricción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `customer_id` | `UUID` | NO | — | FK → `customers.id` `CASCADE`. |
| `type` | `AddressType` | NO | `SHIPPING` | `SHIPPING` / `BILLING`. |
| `label` | `VARCHAR(40)` | SÍ | `NULL` | "Casa", "Oficina". |
| `recipient_name` | `VARCHAR(120)` | NO | — | — |
| `phone_encrypted` / `phone_hash` | `TEXT` / `VARCHAR(64)` | NO / SÍ | — / `NULL` | Cifrado + índice ciego. |
| `line1`, `line2` | `VARCHAR(200)` | NO / SÍ | — / `NULL` | Dirección. |
| `city`, `city_code` | `VARCHAR(120)`, `VARCHAR(20)` | NO / SÍ | — | `city_code` DANE. |
| `department` | `VARCHAR(120)` | NO | — | — |
| `country_code` | `CHAR(2)` | NO | `CO` | ISO 3166-1. |
| `postal_code` | `VARCHAR(10)` | SÍ | `NULL` | — |
| `references` | `VARCHAR(255)` | SÍ | `NULL` | — |
| `is_default` | `BOOLEAN` | NO | `false` | Índice parcial: solo una por `(customer_id, type)`. |
| `created_at` / `updated_at` / `deleted_at` | — | — | — | Auditoría estándar. |

**Índices:** `idx(customer_id, type)`, `uq parcial (customer_id, type) WHERE is_default AND deleted_at IS NULL`.

### 4.5 `consents`

| Campo | Tipo | Nulable | Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `customer_id` | `UUID` | SÍ | `NULL` | FK → `customers.id` `SET NULL`. |
| `anonymous_id` | `VARCHAR(64)` | SÍ | `NULL` | Para visitantes. |
| `type` | `ConsentType` | NO | — | `TERMS`, `DATA_POLICY`, `MARKETING`, `COOKIES`. |
| `version` | `VARCHAR(20)` | NO | — | Versión del aviso de privacidad aceptado. |
| `granted` | `BOOLEAN` | NO | — | `true` = otorgado. |
| `ip`, `user_agent` | `VARCHAR(45)`, `VARCHAR(512)` | SÍ | `NULL` | Evidencia. |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | Inmutable. |

**Índices:** `idx(customer_id, type, created_at DESC)`, `idx(anonymous_id)`.

---

## 5. Catálogo

### 5.1 `brands`

`id UUID PK`, `slug VARCHAR(120) UK`, `name VARCHAR(120) NO`, `description TEXT?`,
`logo_url VARCHAR(600)?`, `is_active BOOLEAN DEFAULT true`, `sort_order INT DEFAULT 0`,
auditoría estándar. **Índices:** `uq(slug)`, `idx(is_active, sort_order)`.

### 5.2 `categories`

| Campo | Tipo | Nulable | Default | Descripción / Restricción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `parent_id` | `UUID` | SÍ | `NULL` | FK → `categories.id`; `NULL` = categoría raíz (facial/cabello/cuerpo). |
| `slug` | `VARCHAR(140)` | NO | — | Único. |
| `name` | `VARCHAR(140)` | NO | — | — |
| `path` | `VARCHAR(400)` | NO | — | Materializado, p. ej. `/cabello/tratamiento/mascarilla`. |
| `depth` | `INT` | NO | `0` | `CHECK (depth BETWEEN 0 AND 5)`. |
| `image_url`, `description` | `VARCHAR(600)?`, `TEXT?` | SÍ | `NULL` | — |
| `sort_order` | `INT` | NO | `0` | — |
| `is_active` | `BOOLEAN` | NO | `true` | — |
| auditoría | — | — | — | Estándar. |

**Índices:** `uq(slug)`, `idx(parent_id, sort_order)`, `idx(path)`, parcial
`idx(name) WHERE is_active`. **Restricción:** no se permite ciclo (validación en aplicación + path consistente).

### 5.3 `products`

| Campo | Tipo | Nulable | Default | Descripción / Restricción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `brand_id` | `UUID` | NO | — | FK → `brands.id` `RESTRICT`. |
| `sku_base` | `VARCHAR(60)` | NO | — | Único, código base del producto. |
| `slug` | `VARCHAR(180)` | NO | — | Único. |
| `name` | `VARCHAR(200)` | NO | — | — |
| `short_description` | `VARCHAR(400)` | SÍ | `NULL` | — |
| `description`, `how_to_use` | `TEXT` | SÍ | `NULL` | — |
| `ingredients` | `TEXT` | SÍ | `NULL` | Lista de ingredientes (texto legal del envase). |
| `active_ingredients` | `JSONB` | SÍ | `NULL` | `[{"name":"Ácido hialurónico","concentration":"2%"}]`. |
| `specifications` | `JSONB` | SÍ | `NULL` | Datos técnicos. |
| `status` | `ProductStatus` | NO | `DRAFT` | `DRAFT`, `ACTIVE`, `ARCHIVED`. |
| `tax_rate_bp` | `INT` | NO | `1900` | `CHECK (tax_rate_bp >= 0 AND tax_rate_bp <= 10000)`. |
| `requires_batch` | `BOOLEAN` | NO | `true` | *true* por defecto: cosméticos controlan lote. |
| `is_featured` | `BOOLEAN` | NO | `false` | — |
| `search_vector` | `TSVECTOR` | NO | generado | `tsvector('spanish')`, ver DDL complementario. |
| `published_at` | `TIMESTAMPTZ` | SÍ | `NULL` | — |
| auditoría | — | — | — | Estándar (soft delete). |

**Índices:** `uq(sku_base)`, `uq(slug)`, `idx(brand_id, status)`,
`idx(status, published_at DESC)`, `idx(is_featured)`, `GIN(search_vector)`,
`GIN(name gin_trgm_ops)`.

### 5.4 `product_categories`

`product_id UUID PK FK CASCADE`, `category_id UUID PK FK CASCADE`, `is_primary BOOLEAN DEFAULT
false`, `position INT DEFAULT 0`. **Índices:** `idx(category_id, position)`, parcial
`uq(product_id) WHERE is_primary`.

### 5.5 `attributes`, `attribute_values`, `product_attribute_values`, `variant_attribute_values`

| Tabla | Campos relevantes | Descripción |
|---|---|---|
| `attributes` | `id PK`, `code UK` (`skin_type`, `hair_type`, `concern`, `tone`, `active_ingredient`), `name`, `type AttributeType`, `is_filterable BOOLEAN`, `is_variant_axis BOOLEAN`, `sort_order INT` | Catálogo controlado de facetas. |
| `attribute_values` | `id PK`, `attribute_id FK CASCADE`, `code`, `label`, `hex_color CHAR(7)?`, `sort_order` | `uq(attribute_id, code)`. |
| `product_attribute_values` | `(product_id, attribute_id, attribute_value_id)` PK, 3 FK | `idx(attribute_id, attribute_value_id)`. Responde filtros "tipo de piel grasa". |
| `variant_attribute_values` | `(variant_id, attribute_id)` PK, `attribute_value_id FK` | Ejes que diferencian SKU. `uq(variant_id, attribute_id)`. |

**Nota:** No hay tallas. El eje principal es `presentation`; `tone` y `hair_type` son opcionales.

### 5.6 `presentations`

| Campo | Tipo | Nulable | Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `code` | `VARCHAR(40)` | NO | — | Único: `ML_50`, `ML_400`, `G_200`, `UNIDAD`. |
| `quantity` | `DECIMAL(10,3)` | NO | — | Cantidad numérica (50, 0.5). |
| `unit` | `MeasureUnit` | NO | — | `ML`, `L`, `G`, `KG`, `UNITS`. |
| `label` | `VARCHAR(60)` | NO | — | Etiqueta para cliente: "50 ml". |

**Índice:** `uq(code)`. **Regla:** `label` se genera desde `quantity` + `unit` salvo excepción
documentada.

### 5.7 `product_variants`

| Campo | Tipo | Nulable | Default | Descripción / Restricción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `product_id` | `UUID` | NO | — | FK → `products.id` `CASCADE`. |
| `presentation_id` | `UUID` | NO | — | FK → `presentations.id` `RESTRICT`. |
| `sku` | `VARCHAR(60)` | NO | — | Único, SKU vendible. |
| `barcode` | `VARCHAR(60)` | SÍ | `NULL` | Único cuando no es nulo (EAN-13). |
| `name` | `VARCHAR(160)` | NO | — | "50 ml · Tono 5.3". |
| `price_cents` | `BIGINT` | NO | — | `CHECK (price_cents >= 0)`, IVA incluido. |
| `compare_at_price_cents` | `BIGINT` | SÍ | `NULL` | Precio "antes"; debe ser `> price_cents` si existe. |
| `cost_cents` | `BIGINT` | SÍ | `NULL` | Costo interno para margen. |
| `weight_grams` | `INT` | NO | `0` | Para cotización de envío. |
| `status` | `VariantStatus` | NO | `ACTIVE` | `ACTIVE`, `OUT_OF_STOCK`, `DISCONTINUED`. |
| `is_default` | `BOOLEAN` | NO | `false` | Único por producto. |
| `position` | `INT` | NO | `0` | — |
| auditoría | — | — | — | Estándar. |

**Índices:** `uq(sku)`, `uq(barcode) WHERE barcode IS NOT NULL`, `idx(product_id, position)`,
`idx(status)`, parcial `uq(product_id) WHERE is_default`.

### 5.8 `media`, `product_media`

| Tabla | Campos | Descripción |
|---|---|---|
| `media` | `id PK`, `storage_key UK VARCHAR(400)`, `url VARCHAR(600)`, `mime_type`, `width INT?`, `height INT?`, `bytes INT?`, `alt VARCHAR(255)?`, `blurhash VARCHAR(60)?`, `checksum VARCHAR(64)?`, `created_at` | Objeto físico en R2; derivados AVIF se generan fuera de la BD. |
| `product_media` | `(product_id, media_id, role)` PK, `variant_id UUID? FK SET NULL`, `position INT` | `role`: `GALLERY`, `SWATCH`, `DETAIL`, `VIDEO`. `idx(product_id, role, position)`. |

---

## 6. Sedes e inventario

> **C-01:** la fuente de verdad del stock es `inventory_lots(lot_id, site_id)`.
> `inventory_by_site(variant_id, site_id)` es **solo una proyección** derivada, actualizada
> **en la misma transacción** que el `UPDATE` atómico sobre `inventory_lots`
> (`reserved ≤ on_hand`). Toda referencia técnica a la sede usa `site_id` / `sites`.

### 6.1 `sites`

| Campo | Tipo | Nulable | Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `code` | `VARCHAR(20)` | NO | — | Único: `SDE-01`, `SDE-02`. |
| `name` | `VARCHAR(120)` | NO | — | Nombre comercial de la tienda. |
| `type` | `SiteType` | NO | `STORE` | `STORE`, `DISTRIBUTION_CENTER`. MVP: 2 `STORE`. |
| `address`, `city`, `department` | `VARCHAR(255)`, `VARCHAR(120)`, `VARCHAR(120)` | SÍ | `NULL` | — |
| `phone` | `VARCHAR(30)` | SÍ | `NULL` | — |
| `is_pickup_point` | `BOOLEAN` | NO | `true` | — |
| `is_sales_point` | `BOOLEAN` | NO | `true` | Venta en mostrador. |
| `priority` | `INT` | NO | `100` | Orden de asignación de reservas. |
| `is_active` | `BOOLEAN` | NO | `true` | — |
| auditoría | — | — | — | Estándar. |

**Índice:** `uq(code)`, `idx(is_active, priority)`.

### 6.2 `lots`

| Campo | Tipo | Nulable | Default | Descripción / Restricción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `variant_id` | `UUID` | NO | — | FK → `product_variants.id` `RESTRICT`. |
| `lot_code` | `VARCHAR(60)` | NO | — | Código del fabricante. |
| `manufactured_at` | `DATE` | SÍ | `NULL` | — |
| `expires_at` | `DATE` | SÍ | `NULL` | `NULL` = sin vencimiento declarado (tratado como último en FEFO). Umbrales aprobados (C-01): aviso a 90 días, bloqueo de venta a 15 días, sin descuento automático en Fase 1. |
| `received_at` | `DATE` | NO | — | Recepción en Adriana. |
| `supplier` | `VARCHAR(120)` | SÍ | `NULL` | — |
| `invoice_number` | `VARCHAR(60)` | SÍ | `NULL` | Factura de compra. |
| `status` | `LotStatus` | NO | `ACTIVE` | `ACTIVE`, `BLOCKED`, `EXPIRED`, `QUARANTINE`. |
| `blocked_reason` | `VARCHAR(255)` | SÍ | `NULL` | Obligatorio si `status = BLOCKED`. |
| auditoría | — | — | — | Estándar. |

**Índices:** `uq(variant_id, lot_code)`, `idx(expires_at)`, parcial
`idx(variant_id, expires_at) WHERE status = 'ACTIVE' AND expires_at IS NOT NULL`.

### 6.3 `inventory_lots` (fuente de verdad)

| Campo | Tipo | Nulable | Default | Descripción / Restricción |
|---|---|---|---|---|
| `lot_id` | `UUID` | NO | — | PK compuesta, FK → `lots.id` `RESTRICT`. |
| `site_id` | `UUID` | NO | — | PK compuesta, FK → `sites.id` `RESTRICT`. |
| `on_hand` | `INT` | NO | `0` | `CHECK (on_hand >= 0)`. |
| `reserved` | `INT` | NO | `0` | `CHECK (reserved >= 0 AND reserved <= on_hand)`. |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | — |

**Índice:** `idx(site_id)`, `idx(lot_id)`. **Rol:** fuente de verdad (C-01). Aquí se aplica
el `UPDATE` condicional anti-sobreventa y se descuenta FEFO; la proyección `inventory_by_site`
se actualiza en la misma transacción.

### 6.4 `inventory_by_site` (proyección)

| Campo | Tipo | Nulable | Default | Descripción |
|---|---|---|---|---|
| `variant_id` | `UUID` | NO | — | PK compuesta, FK → `product_variants.id`. |
| `site_id` | `UUID` | NO | — | PK compuesta, FK → `sites.id`. |
| `on_hand` | `INT` | NO | `0` | Suma de lotes. |
| `reserved` | `INT` | NO | `0` | Suma de lotes. |
| `safety_stock` | `INT` | NO | `0` | Stock de seguridad no vendible. |
| `reorder_point` | `INT` | NO | `5` | Dispara alerta. |
| `updated_at` | `TIMESTAMPTZ` | NO | `now()` | — |

**Índice:** `idx(site_id)`, `idx(variant_id, on_hand)`. **Regla:** columna calculada
`available = on_hand - reserved - safety_stock` (no se persiste; se expone en API).
**Invariante (C-01):** `on_hand = Σ inventory_lots.on_hand` y
`reserved = Σ inventory_lots.reserved` para el mismo `(variant_id, site_id)` tras cada
transacción; un job diario detecta desvíos. Esta tabla **nunca** es la fuente de verdad.

### 6.5 `inventory_movements`

| Campo | Tipo | Nulable | Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK, inmutable. |
| `variant_id` | `UUID` | NO | — | FK → `product_variants.id`. |
| `lot_id` | `UUID` | NO | — | FK → `lots.id`. |
| `site_id` | `UUID` | NO | — | FK → `sites.id`. |
| `type` | `InventoryMovementType` | NO | — | Ver enums. |
| `quantity_signed` | `INT` | NO | — | `> 0` entrada, `< 0` salida, nunca 0. |
| `reference_type` | `VARCHAR(40)` | SÍ | `NULL` | `order`, `reservation`, `transfer`, `adjustment`. |
| `reference_id` | `UUID` | SÍ | `NULL` | ID del agregado origen. |
| `created_by` | `UUID` | SÍ | `NULL` | Usuario o `SYSTEM`. |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — |

**Índices:** `idx(variant_id, created_at DESC)`, `idx(reference_type, reference_id)`,
`idx(lot_id, site_id, created_at DESC)`.

### 6.6 `reservations`

| Campo | Tipo | Nulable | Default | Descripción / Restricción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `variant_id` | `UUID` | NO | — | FK → `product_variants.id`. |
| `lot_id` | `UUID` | NO | — | FK → `lots.id`. |
| `site_id` | `UUID` | NO | — | FK → `sites.id`. |
| `cart_id` | `UUID` | SÍ | `NULL` | FK → `carts.id` `CASCADE`. |
| `order_id` | `UUID` | SÍ | `NULL` | FK → `orders.id` `CASCADE`. |
| `quantity` | `INT` | NO | — | `CHECK (quantity > 0)`. |
| `status` | `ReserveStatus` | NO | `ACTIVE` | `ACTIVE`, `CONFIRMED`, `RELEASED`, `EXPIRED`. |
| `expires_at` | `TIMESTAMPTZ` | NO | — | TTL desde creación (30 min por defecto). |
| `created_at` | `TIMESTAMPTZ` | NO | `now()` | — |

**Índices:** `idx(status, expires_at)`, `idx(variant_id, site_id)`,
`idx(cart_id)`, `idx(order_id)`. **Restricción:** exactamente uno de `cart_id` / `order_id`
debe estar presente (CHECK).

### 6.7 `site_transfers`, `site_transfer_items`

| Tabla | Campos | Descripción |
|---|---|---|
| `site_transfers` | `id PK`, `code UK`, `from_site_id FK`, `to_site_id FK` (`CHECK from <> to`), `status TransferStatus`, `created_by FK`, `received_by FK?`, `shipped_at?`, `received_at?`, `notes?`, auditoría | `DRAFT → IN_TRANSIT → RECEIVED`; `CANCELLED` solo desde `DRAFT/IN_TRANSIT`. |
| `site_transfer_items` | `(transfer_id, variant_id, lot_id)` PK, `quantity INT > 0`, `received_quantity INT?` | Una línea por lote; permite diferencias al recibir. |

**Índices:** `idx(status, created_at DESC)`, `idx(from_site_id)`, `idx(to_site_id)`.

---

## 7. Carrito, cupones y venta

### 7.1 `carts`, `cart_items`

| Tabla | Campo | Tipo | Descripción |
|---|---|---|---|
| `carts` | `id` | `UUID PK` | — |
| | `token` | `VARCHAR(64) UK` | Cookie firmada del invitado. |
| | `customer_id` | `UUID FK?` | FK → `customers.id` `SET NULL`. |
| | `status` | `CartStatus` | `ACTIVE`, `CONVERTED`, `MERGED`, `ABANDONED`, `EXPIRED`. |
| | `fulfillment_type` | `FulfillmentType?` | Decidido en checkout. |
| | `site_id` | `UUID FK?` | Sede elegida para retiro. |
| | `coupon_code` | `VARCHAR(40)?` | — |
| | `expires_at` | `TIMESTAMPTZ` | TTL de carrito (7 días). |
| | `last_activity_at` | `TIMESTAMPTZ` | Para limpieza. |
| | auditoría | — | Sin `deleted_at`. |
| `cart_items` | `id` | `UUID PK` | — |
| | `cart_id`, `variant_id` | `UUID FK` | `uq(cart_id, variant_id)`. |
| | `quantity` | `INT` | `CHECK (quantity BETWEEN 1 AND 99)`. |
| | `unit_price_snapshot_cents` | `BIGINT` | Precio en centavos mostrado al agregar; se revalida en checkout (C-02). |

**Índices:** parcial `uq(customer_id) WHERE status='ACTIVE' AND customer_id IS NOT NULL`,
`idx(status, last_activity_at)`, `idx(variant_id)`.

### 7.2 `coupons`, `coupon_redemptions`

| Campo | Tipo | Nulable | Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `code` | `VARCHAR(40)` | NO | — | Único, normalizado en mayúsculas. Ejemplo único en documentación: `ADRIANA10` (C-12). |
| `type` | `CouponType` | NO | — | `PERCENT`, `FIXED`, `FREE_SHIPPING`. |
| `value` | `INT` | NO | — | `PERCENT` en bp (1000 = 10 %; p. ej. `ADRIANA10`), `FIXED` en centavos. |
| `scope` | `DiscountScope` | NO | `ALL` | `ALL`, `PRODUCT`, `CATEGORY`, `BRAND`. |
| `scope_ids` | `UUID[]` | NO | `{}` | IDs según `scope`. |
| `min_subtotal_cents` | `BIGINT` | SÍ | `NULL` | — |
| `max_discount_cents` | `BIGINT` | SÍ | `NULL` | Tope para `PERCENT`. |
| `starts_at`, `ends_at` | `TIMESTAMPTZ` | NO | — | `CHECK (ends_at > starts_at)`. |
| `usage_limit`, `usage_limit_per_customer` | `INT` | SÍ | `NULL` | — |
| `used_count` | `INT` | NO | `0` | Contador; se actualiza en transacción. |
| `first_purchase_only` | `BOOLEAN` | NO | `false` | — |
| `stackable` | `BOOLEAN` | NO | `false` | — |
| `is_active` | `BOOLEAN` | NO | `true` | — |
| auditoría | — | — | — | Estándar (sin `deleted_at`). |

`coupon_redemptions`: `id PK`, `coupon_id FK`, `order_id FK CASCADE`, `customer_id FK?`,
`amount_cents BIGINT`, `created_at`. **Índices:** `uq(coupon_id, order_id)`,
`idx(customer_id)`, `idx(order_id)`, `idx(is_active, starts_at, ends_at)` en `coupons`.

### 7.3 `orders`

| Campo | Tipo | Nulable | Default | Descripción / Restricción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `number` | `VARCHAR(30)` | NO | — | Único, formato `AT-2026-000123` (C-12), desde secuencia; online y POS comparten numeración. |
| `customer_id` | `UUID` | NO | — | FK → `customers.id` `RESTRICT`. |
| `customer_email` | `VARCHAR(254)` | NO | — | Copia del email para búsqueda operativa (el resto del customer va en snapshot). |
| `site_owner_id` | `UUID` | NO | — | FK → `sites.id` `RESTRICT`. Sede dueña del pedido. |
| `status` | `OrderStatus` | NO | `PENDING_PAYMENT` | Estados canónicos C-08 y tabla de mapeo en `maquinas-estado.md` §2.1.1. `READY_FOR_PICKUP` vive aquí, no en `store_pickups.status`. |
| `payment_status` | `PaymentStatus` | NO | `PENDING` | Desnormalizado para consultas. |
| `fulfillment_type` | `FulfillmentType` | NO | — | `SHIPPING`, `STORE_PICKUP`. |
| `channel` | `SalesChannel` | NO | `ONLINE` | `ONLINE`, `POS`. |
| `currency` | `CHAR(3)` | NO | `COP` | — |
| `subtotal_cents`, `discount_total_cents`, `shipping_total_cents`, `tax_total_cents`, `grand_total_cents` | `BIGINT` | NO / NO / NO / NO / NO | `0` / `0` / `0` / `0` / — | Todos con `CHECK (>= 0)`; `grand_total = subtotal - discount + shipping`; IVA por línea con `round_half_up` y `tax_rate_bp = 1900` (§3). |
| `coupon_code` | `VARCHAR(40)` | SÍ | `NULL` | — |
| `applied_promotions` | `JSONB` | SÍ | `NULL` | Auditoría de promociones. |
| `customer_snapshot` | `JSONB` | NO | — | Nombre, email, documento cifrado. |
| `shipping_address_snapshot` | `JSONB` | SÍ | `NULL` | Cifrado en aplicación. Requerido si `SHIPPING`. |
| `billing_address_snapshot` | `JSONB` | SÍ | `NULL` | Para facturación. |
| `notes`, `internal_notes` | `VARCHAR(1000)` | SÍ | `NULL` | Cliente / operación. |
| `idempotency_key` | `VARCHAR(80)` | SÍ | `NULL` | Único; viene del checkout. |
| `placed_at`, `confirmed_at`, `paid_at`, `cancelled_at` | `TIMESTAMPTZ` | SÍ | `NULL` | Trazabilidad. |
| `expires_at` | `TIMESTAMPTZ` | SÍ | `NULL` | Igual al TTL de la reserva. |
| `created_at`, `updated_at` | — | NO | — | Sin `deleted_at`. |

**Índices:** `uq(number)`, `uq(idempotency_key) WHERE NOT NULL`,
`idx(customer_id, created_at DESC)`, `idx(status, created_at DESC)`,
`idx(site_owner_id, status, created_at DESC)`, `idx(payment_status)`, `idx(email en snapshot)`
vía columna `customer_email VARCHAR(254)` derivada.

### 7.4 `order_items`

| Campo | Tipo | Nulable | Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `order_id` | `UUID` | NO | — | FK → `orders.id` `CASCADE`. |
| `variant_id` | `UUID` | SÍ | `NULL` | FK → `product_variants.id` `SET NULL` (histórico). |
| `lot_id` | `UUID` | SÍ | `NULL` | Referencia histórica del lote vendido (sin CASCADE). |
| `sku`, `product_name`, `variant_name`, `brand_name`, `image_url` | `VARCHAR` | NO/SÍ | — | Snapshot inmutable. |
| `unit_price_cents`, `unit_discount_cents` | `BIGINT` | NO | — / `0` | IVA incluido. |
| `quantity` | `INT` | NO | — | `> 0`. |
| `tax_rate_bp`, `tax_amount_cents` | `INT`, `BIGINT` | NO | `1900`, `0` | `1900` = **basis points** (19 %), nunca rate decimal; IVA incluido. |
| `line_total_cents` | `BIGINT` | NO | — | `(unit_price - unit_discount) * quantity`; `base_cents = round_half_up(line_total_cents / 1,19)`; `tax_amount_cents = line_total_cents - base_cents`. |
| `product_snapshot` | `JSONB` | NO | — | Ingredientes, presentación, atributos. |
| `unit_cost_cents` | `BIGINT` | SÍ | `NULL` | Para margen. |

**Índices:** `idx(order_id)`, `idx(variant_id)`.

### 7.5 `order_status_history`

`id PK`, `order_id FK CASCADE`, `from_status OrderStatus?`, `to_status OrderStatus`,
`reason VARCHAR(255)?`, `actor_id UUID?`, `actor_type AuditActorType`, `created_at`.
**Índice:** `idx(order_id, created_at)`. Inmutable.

---

## 8. Pagos, webhooks y logística

### 8.1 `payments`

| Campo | Tipo | Nulable | Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | uuid | PK. |
| `order_id` | `UUID` | NO | — | FK → `orders.id` `CASCADE` (nunca se elimina en la práctica). |
| `provider` | `PaymentProvider` | NO | — | `WOMPI`, `EPAYCO`, `CASH`, `MANUAL`. `MERCADO_PAGO` eliminado (C-12). |
| `method` | `PaymentMethod` | NO | — | `CARD`, `PSE`, `NEQUI`, `CASH_ON_DELIVERY`, `BNPL_WOMPI`… |
| `status` | `PaymentStatus` | NO | `PENDING` | — |
| `amount_cents` | `BIGINT` | NO | — | debe igualar `orders.grand_total_cents`. |
| `provider_payment_id` | `VARCHAR(120)` | SÍ | `NULL` | `uq(provider, provider_payment_id)`. |
| `provider_reference` | `VARCHAR(120)` | SÍ | `NULL` | — |
| `installments` | `INT` | SÍ | `NULL` | BNPL / tarjeta. |
| `failure_code`, `failure_message` | `VARCHAR(60)`, `VARCHAR(500)` | SÍ | `NULL` | Mensaje seguro (sin PII). |
| `provider_fee_cents` | `BIGINT` | SÍ | `NULL` | Conciliación. |
| `checkout_url` | `VARCHAR(600)` | SÍ | `NULL` | Hosted checkout; se purga tras 30 días. |
| `paid_at`, `expires_at` | `TIMESTAMPTZ` | SÍ | `NULL` | — |
| `created_at`, `updated_at` | — | NO | — | — |

**Índices:** `uq(provider, provider_payment_id)`, `idx(order_id)`, `idx(status, created_at DESC)`.
**Prohibido:** número de tarjeta, CVV, PAN, datos de PSE. Ver `flujos-pagos.md`.

### 8.2 `payment_attempts`

`id PK`, `payment_id FK CASCADE`, `webhook_event_id FK?`, `type TransactionType`, `status
TransactionStatus DEFAULT PENDING`, `amount_cents BIGINT`, `provider_txn_id VARCHAR(120) UK?`,
`error_code?`, `raw_payload JSONB?` (sanitizado), `created_at`. **Índices:**
`idx(payment_id, created_at DESC)`, `uq(provider_txn_id) WHERE NOT NULL`.

### 8.3 `webhook_events`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `UUID PK` | — |
| `provider` | `VARCHAR(60)` | `WOMPI`, `EPAYCO`. `mercado-pago` no activo (C-12). |
| `event_id` | `VARCHAR(160)` | `uq(provider, event_id)`: idempotencia. |
| `event_type` | `VARCHAR(80)` | `transaction.updated`. |
| `signature_valid` | `BOOLEAN` | `false` ⇒ `IGNORED` + alerta. |
| `payload` | `JSONB` | Sanitizado (sin tokens). |
| `headers` | `JSONB?` | Solo cabeceras necesarias; se purgan en 30 días. |
| `status` | `WebhookStatus` | `RECEIVED`, `PROCESSING`, `PROCESSED`, `FAILED`, `IGNORED`. |
| `attempts`, `last_error` | `INT`, `TEXT?` | — |
| `received_at`, `processed_at` | `TIMESTAMPTZ` | — |

**Índice:** `uq(provider, event_id)`, `idx(status, received_at)`.

### 8.4 `idempotency_keys`

`id PK`, `key VARCHAR(80) UK`, `scope VARCHAR(60)` (`checkout.create`, `refund.create`),
`request_hash VARCHAR(64)`, `response_status INT?`, `response_body JSONB?`, `created_at`,
`expires_at`. **Índice:** `idx(expires_at)`. Se purga con TTL de 24 h.

### 8.5 `shipments`, `shipment_items`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `UUID PK` | — |
| `order_id` | `UUID FK` | — |
| `origin_site_id` | `UUID FK` | Sede que despacha. |
| `carrier`, `service` | `VARCHAR(60)` | Transportadora. |
| `tracking_number`, `tracking_url`, `label_url` | `VARCHAR` | — |
| `status` | `ShipmentStatus` | `PENDING`, `READY`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`, `RETURNED`. |
| `cost_cents`, `weight_grams` | `BIGINT`, `INT` | — |
| `address_snapshot` | `JSONB` | Cifrado. |
| `estimated_delivery_at`, `shipped_at`, `delivered_at` | `TIMESTAMPTZ?` | — |
| auditoría | — | Estándar. |

`shipment_items`: `(shipment_id, order_item_id)` PK, `quantity INT > 0`. **Índices:**
`idx(order_id)`, `idx(tracking_number)`, `idx(status, created_at DESC)`.

### 8.6 `store_pickups`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `UUID PK` | — |
| `order_id` | `UUID FK UK` | Relación 1:1 con el pedido. |
| `site_id` | `UUID FK` | Sede de retiro (puede diferir de la sede dueña). |
| `status` | `PickupStatus` | `SCHEDULED`, `READY`, `PICKED_UP`, `EXPIRED`, `CANCELLED`. |
| `pickup_code` | `VARCHAR(12)` | Código de 6 dígitos mostrado al cliente. |
| `window_start`, `window_end` | `TIMESTAMPTZ` | Ventana acordada. |
| `ready_at`, `picked_up_at` | `TIMESTAMPTZ?` | — |
| `picked_up_by` | `UUID FK?` | Usuario de sede que entrega. |
| `id_verified` | `BOOLEAN DEFAULT false` | Requiere documento + número de pedido. |
| `notes` | `VARCHAR(500)?` | — |

**Índices:** `uq(order_id)`, `idx(site_id, status, window_start)`, `idx(pickup_code)`.

### 8.7 `refunds`

`id PK`, `payment_id FK`, `order_id FK`, `amount_cents BIGINT > 0`, `reason RefundReason`,
`status RefundStatus` (`REQUESTED`, `APPROVED`, `PROCESSING`, `COMPLETED`, `REJECTED`, `FAILED`),
`provider_refund_id VARCHAR(120)?`, `restock BOOLEAN DEFAULT false`, `notes TEXT?`,
`approved_by UUID?`, `created_at`, `completed_at`. **Índice:** `idx(order_id)`,
`idx(payment_id)`, `uq(provider_refund_id) WHERE NOT NULL`.

### 8.8 `invoices`

`id PK`, `order_id FK`, `parent_invoice_id FK?` (nota crédito), `type InvoiceType`,
`status InvoiceStatus`, `number VARCHAR(30)?`, `prefix VARCHAR(10)?`, `cufe VARCHAR(120) UK?`,
`xml_url`, `pdf_url`, `dian_status?`, `retry_count INT DEFAULT 0`, `issued_at?`, auditoría.
**Índices:** `uq(prefix, number)`, `idx(order_id)`, `idx(status, created_at DESC)`.

---

## 9. Plataforma

### 9.1 `notifications`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `UUID PK` | — |
| `customer_id` | `UUID FK?` | — |
| `order_id` | `UUID FK?` | — |
| `channel` | `NotificationChannel` | `EMAIL`, `WHATSAPP`, `SMS`, `PUSH`, `IN_APP`. |
| `template_code` | `VARCHAR(80)` | Plantilla versionada, nunca texto libre del dominio. |
| `payload` | `JSONB` | Datos mínimos para renderizar; sin PAN ni tokens. |
| `status` | `NotificationStatus` | `PENDING`, `SENT`, `FAILED`, `BOUNCED`, `SKIPPED`. |
| `provider_message_id` | `VARCHAR(120)?` | — |
| `attempts` | `INT DEFAULT 0` | — |
| `sent_at`, `created_at` | `TIMESTAMPTZ` | — |

**Índice:** `idx(order_id)`, `idx(status, created_at DESC)`, `idx(customer_id, created_at DESC)`.

### 9.2 `audit_logs`

`id PK`, `actor_id UUID?`, `actor_type AuditActorType`, `action VARCHAR(80)`,
`entity_type VARCHAR(60)`, `entity_id VARCHAR(80)?`, `before JSONB?`, `after JSONB?`,
`ip VARCHAR(45)?`, `user_agent VARCHAR(512)?`, `previous_hash VARCHAR(64)?`,
`hash VARCHAR(64)` (cadena de integridad), `created_at`. Inmutable.
**Índices:** `idx(entity_type, entity_id, created_at DESC)`, `idx(actor_id, created_at DESC)`,
`idx(action, created_at DESC)`.

### 9.3 `settings`

`id PK`, `key VARCHAR(80)`, `site_id UUID? FK` (`NULL` = global), `value JSONB`, `description
VARCHAR(255)?`, `is_secret_ref BOOLEAN DEFAULT false` (si `true`, `value` contiene solo la ruta
del gestor de secretos, nunca el secreto), `updated_by UUID?`, `updated_at`.
**Índice:** `uq(key, site_id)` con `NULLS NOT DISTINCT` (o índice parcial global).

### 9.4 `outbox_events`

`id PK`, `aggregate_type VARCHAR(60)`, `aggregate_id VARCHAR(80)`, `event_type VARCHAR(80)`,
`payload JSONB`, `status OutboxStatus DEFAULT PENDING`, `attempts INT DEFAULT 0`,
`available_at TIMESTAMPTZ DEFAULT now()`, `processed_at?`, `last_error TEXT?`, `created_at`.
**Índice:** `idx(status, available_at)`, `idx(aggregate_type, aggregate_id)`.

### 9.5 `wishlist_items`

`(customer_id, product_id)` PK, `created_at`. **Índice:** `idx(product_id)`.

---

## 10. Enums (resumen)

| Enum | Valores |
|---|---|
| `UserRole` | `ADMIN`, `OPERATOR`, `SELLER`, `ACCOUNTANT`, `CUSTOMER` |
| `UserStatus` | `PENDING_VERIFICATION`, `ACTIVE`, `INACTIVE`, `BLOCKED` |
| `ProductStatus` | `DRAFT`, `ACTIVE`, `ARCHIVED` |
| `VariantStatus` | `ACTIVE`, `OUT_OF_STOCK`, `DISCONTINUED` |
| `MeasureUnit` | `ML`, `L`, `G`, `KG`, `UNITS` |
| `SiteType` | `STORE`, `DISTRIBUTION_CENTER` |
| `LotStatus` | `ACTIVE`, `BLOCKED`, `EXPIRED`, `QUARANTINE` |
| `InventoryMovementType` | `PURCHASE`, `SALE`, `ADJUSTMENT`, `TRANSFER_OUT`, `TRANSFER_IN`, `RESERVATION`, `RESERVATION_RELEASE`, `RETURN`, `DAMAGE`, `EXPIRATION_WRITE_OFF` |
| `ReserveStatus` | `ACTIVE`, `CONFIRMED`, `RELEASED`, `EXPIRED` |
| `TransferStatus` | `DRAFT`, `IN_TRANSIT`, `RECEIVED`, `CANCELLED` |
| `CartStatus` | `ACTIVE`, `CONVERTED`, `MERGED`, `ABANDONED`, `EXPIRED` |
| `OrderStatus` (C-08) | `PENDING_PAYMENT`, `PAID`, `PREPARING`, `PACKED`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `REFUNDED`, `RETURN_REQUESTED`, `RETURN_REJECTED`. Etiquetas UI en español: `maquinas-estado.md` §2.1.1 |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED`, `VOIDED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `CHARGEBACK` |
| `PaymentProvider` | `WOMPI`, `EPAYCO`, `CASH`, `MANUAL` (`MERCADO_PAGO` eliminado, C-12) |
| `PaymentMethod` | `CARD`, `PSE`, `NEQUI`, `DAVIPLATA`, `BANK_TRANSFER`, `CASH_ON_DELIVERY`, `CASH_CORRESPONSAL`, `BNPL_WOMPI` |
| `FulfillmentType` | `SHIPPING`, `STORE_PICKUP` |
| `SalesChannel` | `ONLINE`, `POS` |
| `ShipmentStatus` | `PENDING`, `READY`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`, `RETURNED` |
| `PickupStatus` | `SCHEDULED`, `READY`, `PICKED_UP`, `EXPIRED`, `CANCELLED` |
| `CouponType` / `DiscountScope` | `PERCENT`, `FIXED`, `FREE_SHIPPING` / `ALL`, `PRODUCT`, `CATEGORY`, `BRAND` |
| `RefundReason` | `CUSTOMER_REQUEST`, `OUT_OF_STOCK`, `LATE_PAYMENT`, `DAMAGED`, `FRAUD`, `DUPLICATE`, `OPERATIONAL` |
| `NotificationChannel` | `EMAIL`, `WHATSAPP`, `SMS`, `PUSH`, `IN_APP` |
| `WebhookStatus` / `OutboxStatus` | `RECEIVED`, `PROCESSING`, `PROCESSED`, `FAILED`, `IGNORED` / `PENDING`, `PROCESSING`, `PROCESSED`, `FAILED` |

---

## 11. DDL complementario (documental, no implementación)

> **MODELO DOCUMENTAL — no implementación.** Restricciones que Prisma no expresa y que deben
> incluirse en la migración SQL revisada por `forge-reviewer`.

```sql
-- Integridad de inventario
ALTER TABLE inventory_lots ADD CONSTRAINT inventory_lots_non_negative
  CHECK (on_hand >= 0 AND reserved >= 0 AND reserved <= on_hand);
ALTER TABLE inventory_by_site ADD CONSTRAINT inventory_by_site_non_negative
  CHECK (on_hand >= 0 AND reserved >= 0 AND reserved <= on_hand);

-- Una reserva pertenece a un carrito O a una orden, nunca a ambos
ALTER TABLE reservations ADD CONSTRAINT reservations_owner_check
  CHECK ((cart_id IS NOT NULL AND order_id IS NULL) OR
         (cart_id IS NULL AND order_id IS NOT NULL));

-- Transferencias entre sedes distintas
ALTER TABLE site_transfers ADD CONSTRAINT site_transfers_distinct_sites
  CHECK (from_site_id <> to_site_id);

-- Lote bloqueado debe tener motivo
ALTER TABLE lots ADD CONSTRAINT lots_blocked_requires_reason
  CHECK (status <> 'BLOCKED' OR blocked_reason IS NOT NULL);

-- Monetario no negativo (todos los importes son BIGINT en centavos, C-02)
ALTER TABLE order_items ADD CONSTRAINT order_items_amounts_non_negative
  CHECK (unit_price_cents >= 0 AND unit_discount_cents >= 0 AND line_total_cents >= 0);
ALTER TABLE products ADD CONSTRAINT products_tax_rate_bp_valid
  CHECK (tax_rate_bp >= 0 AND tax_rate_bp <= 10000); -- 1900 bp = 19 %, nunca rate decimal

-- Búsqueda full-text en español (fallback de Meilisearch)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX products_search_vector_idx ON products USING GIN (search_vector);
CREATE INDEX products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);

-- Numeración de pedidos: formato único AT-2026-000123 (C-12), compartido con POS
CREATE SEQUENCE order_number_seq START 1000;
```
