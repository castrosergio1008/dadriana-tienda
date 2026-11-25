# Modelo Prisma Documental — Adriana_tienda

> ## ⚠️ MODELO DOCUMENTAL — no implementación
>
> Este archivo es un **artefacto de diseño**. No debe copiarse a un archivo `.prisma`
> ejecutable sin pasar por revisión de `forge-reviewer` y `forge-sentinel`, ni ejecutarse con
> `prisma migrate dev`. Está aquí para fijar relaciones, cardinalidades, enums, índices y
> decisiones de integridad antes de escribir código. Los `CHECK`, índices parciales y
> `tsvector` se documentan en `diccionario-datos.md` §11 y se añadirían en SQL de migración.

---

## 1. Convenciones visibles en el esquema

> **Decisión:** La sintaxis Prisma se usa aquí como **lenguaje de especificación**, no como
> código. Si se implementa, se hará en su propio archivo tras aprobación de diseño.

- `id String @id @default(uuid()) @db.Uuid`.
- Importes: `BigInt` con sufijo `Cents` → `BIGINT` en PostgreSQL. Ver justificación en el
  diccionario de datos.
- Tasas: `Int` con sufijo `Bp` (basis points). IVA = `1900 bp` (19 %), **nunca** `1900`
  como tasa decimal. Cálculo: `base_cents = round_half_up(total_line_cents / 1,19)` y
  `iva_cents = total_line_cents - base_cents` (C-02).
- Auditoría: `createdAt`, `updatedAt @updatedAt`, `deletedAt` (soft delete) donde aplica.
- Tablas en `snake_case` vía `@@map`; campos en `camelCase` vía `@map`.
- `onDelete`: `Cascade` solo para hijos puros; `SetNull` para referencias históricas;
  `Restrict` para catálogo/personas referenciadas por ventas.

---

## 2. Esquema (documental)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // referencia a variable de entorno; nunca un valor real
}

// ───────────────────────────── ENUMS ─────────────────────────────

enum UserRole {
  ADMIN
  OPERATOR
  SELLER
  ACCOUNTANT
  CUSTOMER
}

enum UserStatus {
  PENDING_VERIFICATION
  ACTIVE
  INACTIVE
  BLOCKED
}

enum AddressType {
  SHIPPING
  BILLING
}

enum ConsentType {
  TERMS
  DATA_POLICY
  MARKETING
  COOKIES
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum VariantStatus {
  ACTIVE
  OUT_OF_STOCK
  DISCONTINUED
}

enum AttributeType {
  SELECT
  MULTISELECT
  TEXT
  NUMBER
  BOOLEAN
}

enum MediaRole {
  GALLERY
  SWATCH
  DETAIL
  VIDEO
}

enum MeasureUnit {
  ML
  L
  G
  KG
  UNITS
}

enum SiteType {
  STORE
  DISTRIBUTION_CENTER
}

enum LotStatus {
  ACTIVE
  BLOCKED
  EXPIRED
  QUARANTINE
}

enum InventoryMovementType {
  PURCHASE
  SALE
  ADJUSTMENT
  TRANSFER_OUT
  TRANSFER_IN
  RESERVATION
  RESERVATION_RELEASE
  RETURN
  DAMAGE
  EXPIRATION_WRITE_OFF
}

enum ReserveStatus {
  ACTIVE
  CONFIRMED
  RELEASED
  EXPIRED
}

enum TransferStatus {
  DRAFT
  IN_TRANSIT
  RECEIVED
  CANCELLED
}

enum CartStatus {
  ACTIVE
  CONVERTED
  MERGED
  ABANDONED
  EXPIRED
}

enum FulfillmentType {
  SHIPPING
  STORE_PICKUP
}

enum SalesChannel {
  ONLINE
  POS
}

// C-08: estados canónicos en inglés de orders.status (11 valores).
// No existen como estados de pedido: DRAFT, PAID_NEEDS_REVIEW, SHIPPED, RETURNED,
// PICKED_UP_READY. Etiquetas UI en español: maquinas-estado.md §2.1.1.
enum OrderStatus {
  PENDING_PAYMENT
  PAID
  PREPARING
  PACKED
  READY_FOR_PICKUP
  OUT_FOR_DELIVERY
  DELIVERED
  RETURN_REQUESTED
  REFUNDED
  RETURN_REJECTED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  VOIDED
  REFUNDED
  PARTIALLY_REFUNDED
  CHARGEBACK
}

// C-12: el adaptador Mercado Pago no forma parte de la API; no se modela proveedor.
// Solo Wompi y ePayco (más efectivo/manual para POS) — ver api-rest.md §7 y
// diccionario-datos.md §10 (C-12).
enum PaymentProvider {
  WOMPI
  EPAYCO
  CASH
  MANUAL
}

enum PaymentMethod {
  CARD
  PSE
  NEQUI
  DAVIPLATA
  BANK_TRANSFER
  CASH_ON_DELIVERY
  CASH_CORRESPONSAL
  BNPL_WOMPI
}

enum TransactionType {
  AUTHORIZATION
  CAPTURE
  SALE
  REFUND
  VOID
  CHARGEBACK
}

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
}

// RETURNED se conserva SOLO como estado logístico de shipments (guía devuelta).
// No es un estado de orders.status (C-08); el retracto usa RETURN_REQUESTED /
// REFUNDED / RETURN_REJECTED en la orden.
enum ShipmentStatus {
  PENDING
  READY
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  FAILED
  RETURNED
}

enum PickupStatus {
  SCHEDULED
  READY
  PICKED_UP
  EXPIRED
  CANCELLED
}

enum CouponType {
  PERCENT
  FIXED
  FREE_SHIPPING
}

enum DiscountScope {
  ALL
  PRODUCT
  CATEGORY
  BRAND
}

enum RefundReason {
  CUSTOMER_REQUEST
  OUT_OF_STOCK
  LATE_PAYMENT
  DAMAGED
  FRAUD
  DUPLICATE
  OPERATIONAL
}

enum RefundStatus {
  REQUESTED
  APPROVED
  PROCESSING
  COMPLETED
  REJECTED
  FAILED
}

enum InvoiceType {
  INVOICE
  CREDIT_NOTE
  DEBIT_NOTE
}

enum InvoiceStatus {
  PENDING
  ISSUED
  SENT
  REJECTED
  CANCELLED
  CONTINGENCY
}

enum NotificationChannel {
  EMAIL
  WHATSAPP
  SMS
  PUSH
  IN_APP
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
  BOUNCED
  SKIPPED
}

enum AuditActorType {
  USER
  ADMIN
  SYSTEM
  INTEGRATION
}

enum WebhookStatus {
  RECEIVED
  PROCESSING
  PROCESSED
  FAILED
  IGNORED
}

enum OutboxStatus {
  PENDING
  PROCESSING
  PROCESSED
  FAILED
}

// ─────────────────────── IDENTIDAD Y ACCESO ───────────────────────

model User {
  id                       String       @id @default(uuid()) @db.Uuid
  email                    String       @unique @db.VarChar(254)
  emailVerifiedAt          DateTime?    @map("email_verified_at")
  customerId               String?      @unique @map("customer_id") @db.Uuid
  passwordHash             String?      @map("password_hash") @db.VarChar(255) // Argon2id
  phoneEncrypted           String?      @map("phone_encrypted") @db.Text
  phoneHash                String?      @unique @map("phone_hash") @db.VarChar(64)
  documentType             String?      @map("document_type") @db.VarChar(10)
  documentNumberEncrypted  String?      @map("document_number_encrypted") @db.Text
  documentHash             String?      @unique @map("document_hash") @db.VarChar(64)
  status                   UserStatus   @default(PENDING_VERIFICATION)
  acceptsMarketing         Boolean      @default(false) @map("accepts_marketing")
  lastLoginAt              DateTime?    @map("last_login_at")
  createdAt                DateTime     @default(now()) @map("created_at")
  updatedAt                DateTime     @updatedAt @map("updated_at")
  deletedAt                DateTime?    @map("deleted_at")

  customer        Customer?       @relation(fields: [customerId], references: [id], onDelete: SetNull)
  sessions        Session[]
  roles           UserRole[]
  auditLogs       AuditLog[]
  transferCreated SiteTransfer[]  @relation("TransferCreatedBy")
  transferReceived SiteTransfer[] @relation("TransferReceivedBy")
  pickupsHandled  StorePickup[]

  @@index([status])
  @@index([createdAt(sort: Desc)])
  @@map("users")
}

model Role {
  id          String @id @default(uuid()) @db.Uuid
  name        String @unique @db.VarChar(60)
  description String? @db.VarChar(255)

  users       UserRole[]
  permissions RolePermission[]

  @@map("roles")
}

model Permission {
  id   String @id @default(uuid()) @db.Uuid
  code String @unique @db.VarChar(80)

  roles RolePermission[]

  @@map("permissions")
}

model RolePermission {
  roleId       String @map("role_id") @db.Uuid
  permissionId String @map("permission_id") @db.Uuid

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
}

model UserRole {
  userId String @map("user_id") @db.Uuid
  roleId String @map("role_id") @db.Uuid

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}

model Session {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  tokenHash String    @unique @map("token_hash") @db.VarChar(128)
  ip        String?   @db.VarChar(45)
  userAgent String?   @map("user_agent") @db.VarChar(512)
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

model Customer {
  id               String    @id @default(uuid()) @db.Uuid
  email            String    @unique @db.VarChar(254)
  fullName         String?   @map("full_name") @db.VarChar(160)
  documentHash     String?   @unique @map("document_hash") @db.VarChar(64)
  defaultPhoneHash String?   @map("default_phone_hash") @db.VarChar(64)
  isVerified       Boolean   @default(false) @map("is_verified")
  notes            String?   @db.Text
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  deletedAt        DateTime? @map("deleted_at")

  user        User?               @relation
  addresses   Address[]
  carts       Cart[]
  orders      Order[]
  wishlist    WishlistItem[]
  consents    Consent[]
  redeemed    CouponRedemption[]
  notifications Notification[]

  @@index([createdAt(sort: Desc)])
  @@map("customers")
}

model Address {
  id              String      @id @default(uuid()) @db.Uuid
  customerId      String      @map("customer_id") @db.Uuid
  type            AddressType @default(SHIPPING)
  label           String?     @db.VarChar(40)
  recipientName   String      @map("recipient_name") @db.VarChar(120)
  phoneEncrypted  String      @map("phone_encrypted") @db.Text
  phoneHash       String?     @map("phone_hash") @db.VarChar(64)
  line1           String      @db.VarChar(200)
  line2           String?     @db.VarChar(200)
  city            String      @db.VarChar(120)
  cityCode        String?     @map("city_code") @db.VarChar(20)
  department      String      @db.VarChar(120)
  countryCode     String      @default("CO") @map("country_code") @db.Char(2)
  postalCode      String?     @map("postal_code") @db.VarChar(10)
  references      String?     @db.VarChar(255)
  isDefault       Boolean     @default(false) @map("is_default")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")
  deletedAt       DateTime?   @map("deleted_at")

  customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([customerId, type])
  @@map("addresses")
}

model Consent {
  id          String      @id @default(uuid()) @db.Uuid
  customerId  String?     @map("customer_id") @db.Uuid
  anonymousId String?     @map("anonymous_id") @db.VarChar(64)
  type        ConsentType
  version     String      @db.VarChar(20)
  granted     Boolean
  ip          String?     @db.VarChar(45)
  userAgent   String?     @map("user_agent") @db.VarChar(512)
  createdAt   DateTime    @default(now()) @map("created_at")

  customer Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)

  @@index([customerId, type, createdAt(sort: Desc)])
  @@index([anonymousId])
  @@map("consents")
}

// ──────────────────────────── CATÁLOGO ────────────────────────────

model Brand {
  id          String    @id @default(uuid()) @db.Uuid
  slug        String    @unique @db.VarChar(120)
  name        String    @db.VarChar(120)
  description String?   @db.Text
  logoUrl     String?   @map("logo_url") @db.VarChar(600)
  isActive    Boolean   @default(true) @map("is_active")
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  products Product[]

  @@index([isActive, sortOrder])
  @@map("brands")
}

model Category {
  id          String    @id @default(uuid()) @db.Uuid
  parentId    String?   @map("parent_id") @db.Uuid
  slug        String    @unique @db.VarChar(140)
  name        String    @db.VarChar(140)
  path        String    @db.VarChar(400)
  depth       Int       @default(0)
  description String?   @db.Text
  imageUrl    String?   @map("image_url") @db.VarChar(600)
  sortOrder   Int       @default(0) @map("sort_order")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  parent   Category?          @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[]         @relation("CategoryTree")
  products ProductCategory[]

  @@index([parentId, sortOrder])
  @@index([path])
  @@map("categories")
}

model Product {
  id                String        @id @default(uuid()) @db.Uuid
  brandId           String        @map("brand_id") @db.Uuid
  skuBase           String        @unique @map("sku_base") @db.VarChar(60)
  slug              String        @unique @db.VarChar(180)
  name              String        @db.VarChar(200)
  shortDescription  String?       @map("short_description") @db.VarChar(400)
  description       String?       @db.Text
  howToUse          String?       @map("how_to_use") @db.Text
  ingredients       String?       @db.Text
  activeIngredients Json?         @map("active_ingredients")
  specifications    Json?
  status            ProductStatus @default(DRAFT)
  taxRateBp         Int           @default(1900) @map("tax_rate_bp") // IVA 1900 bp (19 %), no tasa decimal
  requiresBatch     Boolean       @default(true) @map("requires_batch")
  isFeatured        Boolean       @default(false) @map("is_featured")
  publishedAt       DateTime?     @map("published_at")
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")
  deletedAt         DateTime?     @map("deleted_at")

  brand            Brand                   @relation(fields: [brandId], references: [id], onDelete: Restrict)
  categories       ProductCategory[]
  attributeValues  ProductAttributeValue[]
  variants         ProductVariant[]
  media            ProductMedia[]
  wishlistedBy     WishlistItem[]

  @@index([brandId, status])
  @@index([status, publishedAt(sort: Desc)])
  @@index([isFeatured])
  @@map("products")
}

model ProductCategory {
  productId  String  @map("product_id") @db.Uuid
  categoryId String  @map("category_id") @db.Uuid
  isPrimary  Boolean @default(false) @map("is_primary")
  position   Int     @default(0)

  product  Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([productId, categoryId])
  @@index([categoryId, position])
  @@map("product_categories")
}

model Attribute {
  id            String        @id @default(uuid()) @db.Uuid
  code          String        @unique @db.VarChar(60) // skin_type, hair_type, concern, tone
  name          String        @db.VarChar(120)
  type          AttributeType @default(SELECT)
  isFilterable  Boolean       @default(true) @map("is_filterable")
  isVariantAxis Boolean       @default(false) @map("is_variant_axis")
  sortOrder     Int           @default(0) @map("sort_order")

  values         AttributeValue[]
  productValues  ProductAttributeValue[]
  variantValues  VariantAttributeValue[]

  @@map("attributes")
}

model AttributeValue {
  id          String @id @default(uuid()) @db.Uuid
  attributeId String @map("attribute_id") @db.Uuid
  code        String @db.VarChar(60)
  label       String @db.VarChar(120)
  hexColor    String? @map("hex_color") @db.Char(7)
  sortOrder   Int    @default(0) @map("sort_order")

  attribute     Attribute                @relation(fields: [attributeId], references: [id], onDelete: Cascade)
  productValues ProductAttributeValue[]
  variantValues VariantAttributeValue[]

  @@unique([attributeId, code])
  @@index([attributeId, sortOrder])
  @@map("attribute_values")
}

model ProductAttributeValue {
  productId        String @map("product_id") @db.Uuid
  attributeId      String @map("attribute_id") @db.Uuid
  attributeValueId String @map("attribute_value_id") @db.Uuid

  product        Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  attribute      Attribute      @relation(fields: [attributeId], references: [id])
  attributeValue AttributeValue @relation(fields: [attributeValueId], references: [id])

  @@id([productId, attributeId, attributeValueId])
  @@index([attributeId, attributeValueId])
  @@map("product_attribute_values")
}

model Presentation {
  id       String      @id @default(uuid()) @db.Uuid
  code     String      @unique @db.VarChar(40) // ML_50, ML_400, G_200
  quantity Decimal     @db.Decimal(10, 3)
  unit     MeasureUnit
  label    String      @db.VarChar(60) // "50 ml"

  variants ProductVariant[]

  @@map("presentations")
}

model ProductVariant {
  id                   String        @id @default(uuid()) @db.Uuid
  productId            String        @map("product_id") @db.Uuid
  presentationId       String        @map("presentation_id") @db.Uuid
  sku                  String        @unique @db.VarChar(60)
  barcode              String?       @unique @db.VarChar(60)
  name                 String        @db.VarChar(160)
  priceCents           BigInt        @map("price_cents")
  compareAtPriceCents  BigInt?       @map("compare_at_price_cents")
  costCents            BigInt?       @map("cost_cents")
  weightGrams          Int           @default(0) @map("weight_grams")
  status               VariantStatus @default(ACTIVE)
  isDefault            Boolean       @default(false) @map("is_default")
  position             Int           @default(0)
  createdAt            DateTime      @default(now()) @map("created_at")
  updatedAt            DateTime      @updatedAt @map("updated_at")
  deletedAt            DateTime?     @map("deleted_at")

  product             Product                   @relation(fields: [productId], references: [id], onDelete: Cascade)
  presentation        Presentation              @relation(fields: [presentationId], references: [id], onDelete: Restrict)
  attributeValues     VariantAttributeValue[]
  media               ProductMedia[]
  lots                Lot[]
  inventoryBySite     InventoryBySite[]
  inventoryMovements  InventoryMovement[]
  reservations        Reservation[]
  transferItems       SiteTransferItem[]
  cartItems           CartItem[]
  orderItems          OrderItem[]

  @@index([productId, position])
  @@index([status])
  @@map("product_variants")
}

model VariantAttributeValue {
  variantId        String @map("variant_id") @db.Uuid
  attributeId      String @map("attribute_id") @db.Uuid
  attributeValueId String @map("attribute_value_id") @db.Uuid

  variant        ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  attribute      Attribute      @relation(fields: [attributeId], references: [id])
  attributeValue AttributeValue @relation(fields: [attributeValueId], references: [id])

  @@id([variantId, attributeId])
  @@map("variant_attribute_values")
}

model Media {
  id         String   @id @default(uuid()) @db.Uuid
  storageKey String   @unique @map("storage_key") @db.VarChar(400)
  url        String   @db.VarChar(600)
  mimeType   String   @map("mime_type") @db.VarChar(100)
  width      Int?
  height     Int?
  bytes      Int?
  alt        String?  @db.VarChar(255)
  blurhash   String?  @db.VarChar(60)
  checksum   String?  @db.VarChar(64)
  createdAt  DateTime @default(now()) @map("created_at")

  productMedia ProductMedia[]

  @@map("media")
}

model ProductMedia {
  productId String    @map("product_id") @db.Uuid
  mediaId   String    @map("media_id") @db.Uuid
  variantId String?   @map("variant_id") @db.Uuid
  role      MediaRole @default(GALLERY)
  position  Int       @default(0)

  product Product         @relation(fields: [productId], references: [id], onDelete: Cascade)
  media   Media           @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  variant ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  @@id([productId, mediaId, role])
  @@index([productId, role, position])
  @@map("product_media")
}

// ───────────────────── SEDE E INVENTARIO ──────────────────────────

model Site {
  id            String   @id @default(uuid()) @db.Uuid
  code          String   @unique @db.VarChar(20) // SDE-01, SDE-02
  name          String   @db.VarChar(120)
  type          SiteType @default(STORE)
  address       String?  @db.VarChar(255)
  city          String?  @db.VarChar(120)
  department    String?  @db.VarChar(120)
  phone         String?  @db.VarChar(30)
  isPickupPoint Boolean  @default(true) @map("is_pickup_point")
  isSalesPoint  Boolean  @default(true) @map("is_sales_point")
  priority      Int      @default(100)
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  inventoryBySite   InventoryBySite[]
  inventoryLots     InventoryLot[]
  movements         InventoryMovement[]
  reservations      Reservation[]
  transfersFrom     SiteTransfer[] @relation("TransferFrom")
  transfersTo       SiteTransfer[] @relation("TransferTo")
  ordersOwned       Order[]        @relation("OrderOwnerSite")
  shipments         Shipment[]     @relation("ShipmentOrigin")
  pickups           StorePickup[]
  settings          Setting[]

  @@index([isActive, priority])
  @@map("sites")
}

model Lot {
  id              String    @id @default(uuid()) @db.Uuid
  variantId       String    @map("variant_id") @db.Uuid
  lotCode         String    @map("lot_code") @db.VarChar(60)
  manufacturedAt  DateTime? @map("manufactured_at") @db.Date
  expiresAt       DateTime? @map("expires_at") @db.Date
  receivedAt      DateTime  @map("received_at") @db.Date
  supplier        String?   @db.VarChar(120)
  invoiceNumber   String?   @map("invoice_number") @db.VarChar(60)
  status          LotStatus @default(ACTIVE)
  blockedReason   String?   @map("blocked_reason") @db.VarChar(255)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  variant         ProductVariant       @relation(fields: [variantId], references: [id], onDelete: Restrict)
  inventoryLots   InventoryLot[]
  movements       InventoryMovement[]
  reservations    Reservation[]
  transferItems   SiteTransferItem[]

  @@unique([variantId, lotCode])
  @@index([expiresAt])
  @@map("lots")
}

// C-01: FUENTE DE VERDAD del inventario por sede. Toda reserva, salida FEFO o
// ajuste se escribe aquí primero. Clave (lot_id, site_id). FEFO: warning 90 días,
// bloqueo 15 días antes del vencimiento (RN-006).
model InventoryLot {
  lotId     String   @map("lot_id") @db.Uuid
  siteId    String   @map("site_id") @db.Uuid
  onHand    Int      @default(0) @map("on_hand")
  reserved  Int      @default(0)
  updatedAt DateTime @updatedAt @map("updated_at")

  lot  Lot  @relation(fields: [lotId], references: [id], onDelete: Restrict)
  site Site @relation(fields: [siteId], references: [id], onDelete: Restrict)

  @@id([lotId, siteId])
  // Índices del camino caliente FEFO: ver diccionario-datos.md §6.3.
  @@index([siteId])
  @@index([lotId])
  @@map("inventory_lots")
}

// C-01: PROYECCIÓN agregada por (variant_id, site_id). Se actualiza en la MISMA
// transacción que inventory_lots; nunca se escriba de forma aislada. safety_stock
// y reorder_point son configuración propia de esta proyección.
model InventoryBySite {
  variantId    String   @map("variant_id") @db.Uuid
  siteId       String   @map("site_id") @db.Uuid
  onHand       Int      @default(0) @map("on_hand")
  reserved     Int      @default(0)
  safetyStock  Int      @default(0) @map("safety_stock")
  reorderPoint Int      @default(5) @map("reorder_point")
  updatedAt    DateTime @updatedAt @map("updated_at")

  variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  site    Site           @relation(fields: [siteId], references: [id], onDelete: Restrict)

  @@id([variantId, siteId])
  @@index([siteId])
  @@map("inventory_by_site")
}

model InventoryMovement {
  id            String                @id @default(uuid()) @db.Uuid
  variantId     String                @map("variant_id") @db.Uuid
  lotId         String                @map("lot_id") @db.Uuid
  siteId        String                @map("site_id") @db.Uuid
  type          InventoryMovementType
  quantitySigned Int                  @map("quantity_signed") // + entrada, - salida
  referenceType String?               @map("reference_type") @db.VarChar(40)
  referenceId   String?               @map("reference_id") @db.Uuid
  createdById   String?               @map("created_by_id") @db.Uuid
  createdAt     DateTime              @default(now()) @map("created_at")

  variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Restrict)
  lot     Lot            @relation(fields: [lotId], references: [id], onDelete: Restrict)
  site    Site           @relation(fields: [siteId], references: [id], onDelete: Restrict)

  @@index([variantId, createdAt(sort: Desc)])
  @@index([referenceType, referenceId])
  @@index([lotId, siteId, createdAt(sort: Desc)])
  @@map("inventory_movements")
}

model Reservation {
  id        String        @id @default(uuid()) @db.Uuid
  variantId String        @map("variant_id") @db.Uuid
  lotId     String        @map("lot_id") @db.Uuid
  siteId    String        @map("site_id") @db.Uuid
  cartId    String?       @map("cart_id") @db.Uuid
  orderId   String?       @map("order_id") @db.Uuid
  quantity  Int
  status    ReserveStatus @default(ACTIVE)
  expiresAt DateTime      @map("expires_at")
  createdAt DateTime      @default(now()) @map("created_at")

  variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Restrict)
  lot     Lot            @relation(fields: [lotId], references: [id], onDelete: Restrict)
  site    Site           @relation(fields: [siteId], references: [id], onDelete: Restrict)
  cart    Cart?          @relation(fields: [cartId], references: [id], onDelete: Cascade)
  order   Order?         @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([status, expiresAt])
  @@index([variantId, siteId])
  @@index([cartId])
  @@index([orderId])
  @@map("reservations")
}

model SiteTransfer {
  id           String         @id @default(uuid()) @db.Uuid
  code         String         @unique @db.VarChar(30)
  fromSiteId   String         @map("from_site_id") @db.Uuid
  toSiteId     String         @map("to_site_id") @db.Uuid
  status       TransferStatus @default(DRAFT)
  createdById  String         @map("created_by_id") @db.Uuid
  receivedById String?        @map("received_by_id") @db.Uuid
  shippedAt    DateTime?      @map("shipped_at")
  receivedAt   DateTime?      @map("received_at")
  notes        String?        @db.VarChar(500)
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")

  fromSite   Site               @relation("TransferFrom", fields: [fromSiteId], references: [id], onDelete: Restrict)
  toSite     Site               @relation("TransferTo", fields: [toSiteId], references: [id], onDelete: Restrict)
  createdBy  User               @relation("TransferCreatedBy", fields: [createdById], references: [id], onDelete: Restrict)
  receivedBy User?              @relation("TransferReceivedBy", fields: [receivedById], references: [id], onDelete: SetNull)
  items      SiteTransferItem[]

  @@index([status, createdAt(sort: Desc)])
  @@index([fromSiteId])
  @@index([toSiteId])
  @@map("site_transfers")
}

model SiteTransferItem {
  transferId       String @map("transfer_id") @db.Uuid
  variantId        String @map("variant_id") @db.Uuid
  lotId            String @map("lot_id") @db.Uuid
  quantity         Int
  receivedQuantity Int?   @map("received_quantity")

  transfer SiteTransfer  @relation(fields: [transferId], references: [id], onDelete: Cascade)
  variant  ProductVariant @relation(fields: [variantId], references: [id], onDelete: Restrict)
  lot      Lot           @relation(fields: [lotId], references: [id], onDelete: Restrict)

  @@id([transferId, variantId, lotId])
  @@map("site_transfer_items")
}

// ─────────────────────── CARRITO Y CUPONES ───────────────────────

model Cart {
  id              String     @id @default(uuid()) @db.Uuid
  token           String     @unique @db.VarChar(64)
  customerId      String?    @map("customer_id") @db.Uuid
  status          CartStatus @default(ACTIVE)
  fulfillmentType FulfillmentType? @map("fulfillment_type")
  siteId          String?    @map("site_id") @db.Uuid
  couponCode      String?    @map("coupon_code") @db.VarChar(40)
  expiresAt       DateTime   @map("expires_at")
  lastActivityAt  DateTime   @default(now()) @map("last_activity_at")
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")

  customer     Customer?      @relation(fields: [customerId], references: [id], onDelete: SetNull)
  items        CartItem[]
  reservations Reservation[]
  order        Order?

  @@index([customerId, status])
  @@index([status, lastActivityAt])
  @@map("carts")
}

model CartItem {
  id                     String   @id @default(uuid()) @db.Uuid
  cartId                 String   @map("cart_id") @db.Uuid
  variantId              String   @map("variant_id") @db.Uuid
  quantity               Int
  unitPriceSnapshotCents BigInt   @map("unit_price_snapshot_cents")
  addedAt                DateTime @default(now()) @map("added_at")

  cart    Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Restrict)

  @@unique([cartId, variantId])
  @@map("cart_items")
}

// C-12: único ejemplo documental de cupón: ADRIANA10 (10 % = 1000 bp).
model Coupon {
  id                    String        @id @default(uuid()) @db.Uuid
  code                  String        @unique @db.VarChar(40) // ADRIANA10
  type                  CouponType
  value                 Int           // PERCENT en bp, FIXED en centavos
  scope                 DiscountScope @default(ALL)
  scopeIds              String[]      @map("scope_ids") @db.Uuid
  minSubtotalCents      BigInt?       @map("min_subtotal_cents")
  maxDiscountCents      BigInt?       @map("max_discount_cents")
  startsAt              DateTime      @map("starts_at")
  endsAt                DateTime      @map("ends_at")
  usageLimit            Int?          @map("usage_limit")
  usageLimitPerCustomer Int?          @map("usage_limit_per_customer")
  usedCount             Int           @default(0) @map("used_count")
  firstPurchaseOnly     Boolean       @default(false) @map("first_purchase_only")
  stackable             Boolean       @default(false)
  isActive              Boolean       @default(true) @map("is_active")
  createdAt             DateTime      @default(now()) @map("created_at")
  updatedAt             DateTime      @updatedAt @map("updated_at")

  redemptions CouponRedemption[]

  @@index([isActive, startsAt, endsAt])
  @@map("coupons")
}

model CouponRedemption {
  id          String   @id @default(uuid()) @db.Uuid
  couponId    String   @map("coupon_id") @db.Uuid
  orderId     String   @map("order_id") @db.Uuid
  customerId  String?  @map("customer_id") @db.Uuid
  amountCents BigInt   @map("amount_cents")
  createdAt   DateTime @default(now()) @map("created_at")

  coupon   Coupon    @relation(fields: [couponId], references: [id], onDelete: Restrict)
  order    Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  customer Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)

  @@unique([couponId, orderId])
  @@index([customerId])
  @@map("coupon_redemptions")
}

// ─────────────────────── PEDIDOS Y PAGOS ─────────────────────────

// C-12: numeración única online y POS, formato AT-2026-000123 desde secuencia.
// C-06: una sola creación; el canal POS es un alias de POST /checkout, channel=POS.
model Order {
  id                       String          @id @default(uuid()) @db.Uuid
  number                   String          @unique @db.VarChar(30) // AT-2026-000123
  customerId               String          @map("customer_id") @db.Uuid
  siteOwnerId              String          @map("site_owner_id") @db.Uuid
  cartId                   String?         @unique @map("cart_id") @db.Uuid
  status                   OrderStatus     @default(PENDING_PAYMENT)
  paymentStatus            PaymentStatus   @default(PENDING) @map("payment_status")
  fulfillmentType          FulfillmentType @map("fulfillment_type")
  channel                  SalesChannel    @default(ONLINE)
  currency                 String          @default("COP") @db.Char(3)
  customerEmail            String          @map("customer_email") @db.VarChar(254)
  subtotalCents            BigInt          @map("subtotal_cents")
  discountTotalCents       BigInt          @default(0) @map("discount_total_cents")
  shippingTotalCents       BigInt          @default(0) @map("shipping_total_cents")
  taxTotalCents            BigInt          @default(0) @map("tax_total_cents")
  grandTotalCents          BigInt          @map("grand_total_cents")
  couponCode               String?         @map("coupon_code") @db.VarChar(40)
  appliedPromotions        Json?           @map("applied_promotions")
  customerSnapshot         Json            @map("customer_snapshot")
  shippingAddressSnapshot  Json?           @map("shipping_address_snapshot")
  billingAddressSnapshot   Json?           @map("billing_address_snapshot")
  notes                    String?         @db.VarChar(1000)
  internalNotes            String?         @map("internal_notes") @db.VarChar(1000)
  idempotencyKey           String?         @unique @map("idempotency_key") @db.VarChar(80)
  placedAt                 DateTime?       @map("placed_at")
  confirmedAt              DateTime?       @map("confirmed_at")
  paidAt                   DateTime?       @map("paid_at")
  cancelledAt              DateTime?       @map("cancelled_at")
  expiresAt                DateTime?       @map("expires_at")
  createdAt                DateTime        @default(now()) @map("created_at")
  updatedAt                DateTime        @updatedAt @map("updated_at")

  customer       Customer           @relation(fields: [customerId], references: [id], onDelete: Restrict)
  siteOwner      Site               @relation("OrderOwnerSite", fields: [siteOwnerId], references: [id], onDelete: Restrict)
  cart           Cart?              @relation(fields: [cartId], references: [id], onDelete: SetNull)
  items          OrderItem[]
  statusHistory  OrderStatusHistory[]
  payments       Payment[]
  redemptions    CouponRedemption[]
  shipments      Shipment[]
  pickup         StorePickup?
  refunds        Refund[]
  invoices       Invoice[]
  notifications  Notification[]
  reservations   Reservation[]

  @@index([customerId, createdAt(sort: Desc)])
  @@index([status, createdAt(sort: Desc)])
  @@index([siteOwnerId, status, createdAt(sort: Desc)])
  @@index([paymentStatus])
  @@index([customerEmail])
  @@map("orders")
}

model OrderItem {
  id               String  @id @default(uuid()) @db.Uuid
  orderId          String  @map("order_id") @db.Uuid
  variantId        String? @map("variant_id") @db.Uuid
  lotId            String? @map("lot_id") @db.Uuid
  sku              String  @db.VarChar(60)
  productName      String  @map("product_name") @db.VarChar(200)
  variantName      String? @map("variant_name") @db.VarChar(160)
  brandName        String? @map("brand_name") @db.VarChar(120)
  imageUrl         String? @map("image_url") @db.VarChar(600)
  unitPriceCents   BigInt  @map("unit_price_cents")
  unitDiscountCents BigInt @default(0) @map("unit_discount_cents")
  quantity         Int
  taxRateBp        Int     @default(1900) @map("tax_rate_bp") // 1900 bp; base = round_half_up(line/1,19)
  taxAmountCents   BigInt  @default(0) @map("tax_amount_cents") // line_total_cents - base_cents
  lineTotalCents   BigInt  @map("line_total_cents")
  unitCostCents    BigInt? @map("unit_cost_cents")
  productSnapshot  Json    @map("product_snapshot")

  order         Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variant       ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  shipmentItems ShipmentItem[]

  @@index([orderId])
  @@index([variantId])
  @@map("order_items")
}

model OrderStatusHistory {
  id          String         @id @default(uuid()) @db.Uuid
  orderId     String         @map("order_id") @db.Uuid
  fromStatus  OrderStatus?   @map("from_status")
  toStatus    OrderStatus    @map("to_status")
  reason      String?        @db.VarChar(255)
  actorType   AuditActorType @default(SYSTEM) @map("actor_type")
  actorId     String?        @map("actor_id") @db.Uuid
  createdAt   DateTime       @default(now()) @map("created_at")

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId, createdAt])
  @@map("order_status_history")
}

model Payment {
  id                String        @id @default(uuid()) @db.Uuid
  orderId           String        @map("order_id") @db.Uuid
  provider          PaymentProvider
  method            PaymentMethod
  status            PaymentStatus @default(PENDING)
  amountCents       BigInt        @map("amount_cents")
  currency          String        @default("COP") @db.Char(3)
  providerPaymentId String?       @map("provider_payment_id") @db.VarChar(120)
  providerReference String?       @map("provider_reference") @db.VarChar(120)
  installments      Int?
  authorizationCode String?       @map("authorization_code") @db.VarChar(40)
  failureCode       String?       @map("failure_code") @db.VarChar(60)
  failureMessage    String?       @map("failure_message") @db.VarChar(500)
  providerFeeCents  BigInt?       @map("provider_fee_cents")
  checkoutUrl       String?       @map("checkout_url") @db.VarChar(600)
  rawPayload        Json?         @map("raw_payload")
  paidAt            DateTime?     @map("paid_at")
  expiresAt         DateTime?     @map("expires_at")
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  order    Order             @relation(fields: [orderId], references: [id], onDelete: Cascade)
  attempts PaymentAttempt[]
  refunds  Refund[]

  @@unique([provider, providerPaymentId])
  @@index([orderId])
  @@index([status, createdAt(sort: Desc)])
  @@map("payments")
}

model PaymentAttempt {
  id             String            @id @default(uuid()) @db.Uuid
  paymentId      String            @map("payment_id") @db.Uuid
  webhookEventId String?           @map("webhook_event_id") @db.Uuid
  type           TransactionType
  status         TransactionStatus @default(PENDING)
  amountCents    BigInt            @map("amount_cents")
  providerTxnId  String?           @unique @map("provider_txn_id") @db.VarChar(120)
  errorCode      String?           @map("error_code") @db.VarChar(60)
  rawPayload     Json?             @map("raw_payload")
  createdAt      DateTime          @default(now()) @map("created_at")

  payment      Payment        @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  webhookEvent WebhookEvent?  @relation(fields: [webhookEventId], references: [id], onDelete: SetNull)

  @@index([paymentId, createdAt(sort: Desc)])
  @@map("payment_attempts")
}

model WebhookEvent {
  id             String        @id @default(uuid()) @db.Uuid
  provider       String        @db.VarChar(60)
  eventId        String        @map("event_id") @db.VarChar(160)
  eventType      String        @map("event_type") @db.VarChar(80)
  signatureValid Boolean       @default(false) @map("signature_valid")
  payload        Json
  headers        Json?
  status         WebhookStatus @default(RECEIVED)
  attempts       Int           @default(0)
  lastError      String?       @map("last_error") @db.Text
  receivedAt     DateTime      @default(now()) @map("received_at")
  processedAt    DateTime?     @map("processed_at")

  attemptsLinked PaymentAttempt[]

  @@unique([provider, eventId])
  @@index([status, receivedAt])
  @@map("webhook_events")
}

model IdempotencyKey {
  id            String   @id @default(uuid()) @db.Uuid
  key           String   @unique @db.VarChar(80)
  scope         String   @db.VarChar(60)
  requestHash   String   @map("request_hash") @db.VarChar(64)
  responseStatus Int?    @map("response_status")
  responseBody  Json?    @map("response_body")
  createdAt     DateTime @default(now()) @map("created_at")
  expiresAt     DateTime @map("expires_at")

  @@index([expiresAt])
  @@map("idempotency_keys")
}

// ─────────────────────── LOGÍSTICA Y POSTVENTA ────────────────────

model Shipment {
  id                  String         @id @default(uuid()) @db.Uuid
  orderId             String         @map("order_id") @db.Uuid
  originSiteId        String         @map("origin_site_id") @db.Uuid
  carrier             String         @db.VarChar(60)
  service             String?        @db.VarChar(60)
  trackingNumber      String?        @map("tracking_number") @db.VarChar(80)
  trackingUrl         String?        @map("tracking_url") @db.VarChar(600)
  labelUrl            String?        @map("label_url") @db.VarChar(600)
  status              ShipmentStatus @default(PENDING)
  costCents           BigInt         @default(0) @map("cost_cents")
  weightGrams         Int            @default(0) @map("weight_grams")
  addressSnapshot     Json           @map("address_snapshot")
  estimatedDeliveryAt DateTime?      @map("estimated_delivery_at")
  shippedAt           DateTime?      @map("shipped_at")
  deliveredAt         DateTime?      @map("delivered_at")
  createdAt           DateTime       @default(now()) @map("created_at")
  updatedAt           DateTime       @updatedAt @map("updated_at")

  order  Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  origin Site           @relation("ShipmentOrigin", fields: [originSiteId], references: [id], onDelete: Restrict)
  items  ShipmentItem[]

  @@index([orderId])
  @@index([trackingNumber])
  @@index([status, createdAt(sort: Desc)])
  @@map("shipments")
}

model ShipmentItem {
  shipmentId  String @map("shipment_id") @db.Uuid
  orderItemId String @map("order_item_id") @db.Uuid
  quantity    Int

  shipment  Shipment  @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
  orderItem OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)

  @@id([shipmentId, orderItemId])
  @@map("shipment_items")
}

model StorePickup {
  id          String       @id @default(uuid()) @db.Uuid
  orderId     String       @unique @map("order_id") @db.Uuid
  siteId      String       @map("site_id") @db.Uuid
  status      PickupStatus @default(SCHEDULED)
  pickupCode  String       @map("pickup_code") @db.VarChar(12)
  windowStart DateTime     @map("window_start")
  windowEnd   DateTime     @map("window_end")
  readyAt     DateTime?    @map("ready_at")
  pickedUpAt  DateTime?    @map("picked_up_at")
  pickedUpBy  String?      @map("picked_up_by") @db.Uuid
  idVerified  Boolean      @default(false) @map("id_verified")
  notes       String?      @db.VarChar(500)
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  order     Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  site      Site  @relation(fields: [siteId], references: [id], onDelete: Restrict)
  pickedBy  User? @relation(fields: [pickedUpBy], references: [id], onDelete: SetNull)

  @@index([siteId, status, windowStart])
  @@index([pickupCode])
  @@map("store_pickups")
}

model Refund {
  id                String       @id @default(uuid()) @db.Uuid
  paymentId         String       @map("payment_id") @db.Uuid
  orderId           String       @map("order_id") @db.Uuid
  amountCents       BigInt       @map("amount_cents")
  reason            RefundReason
  status            RefundStatus @default(REQUESTED)
  providerRefundId  String?      @map("provider_refund_id") @db.VarChar(120)
  restock           Boolean      @default(false)
  notes             String?      @db.Text
  approvedBy        String?      @map("approved_by") @db.Uuid
  createdAt         DateTime     @default(now()) @map("created_at")
  completedAt       DateTime?    @map("completed_at")

  payment Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([paymentId])
  @@map("refunds")
}

model Invoice {
  id               String        @id @default(uuid()) @db.Uuid
  orderId          String        @map("order_id") @db.Uuid
  parentInvoiceId  String?       @map("parent_invoice_id") @db.Uuid
  type             InvoiceType   @default(INVOICE)
  status           InvoiceStatus @default(PENDING)
  prefix           String?       @db.VarChar(10)
  number           String?       @db.VarChar(30)
  cufe             String?       @unique @db.VarChar(120)
  xmlUrl           String?       @map("xml_url") @db.VarChar(600)
  pdfUrl           String?       @map("pdf_url") @db.VarChar(600)
  dianStatus       String?       @map("dian_status") @db.VarChar(40)
  retryCount       Int           @default(0) @map("retry_count")
  issuedAt         DateTime?     @map("issued_at")
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")

  order       Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  parent      Invoice?  @relation("InvoiceNotes", fields: [parentInvoiceId], references: [id], onDelete: SetNull)
  creditNotes Invoice[] @relation("InvoiceNotes")

  @@unique([prefix, number])
  @@index([orderId])
  @@index([status, createdAt(sort: Desc)])
  @@map("invoices")
}

// ───────────────── PLATAFORMA Y OBSERVABILIDAD ────────────────────

model WishlistItem {
  customerId String   @map("customer_id") @db.Uuid
  productId  String   @map("product_id") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at")

  customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  product  Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@id([customerId, productId])
  @@index([productId])
  @@map("wishlist_items")
}

model Notification {
  id                 String              @id @default(uuid()) @db.Uuid
  customerId         String?             @map("customer_id") @db.Uuid
  orderId            String?             @map("order_id") @db.Uuid
  channel            NotificationChannel
  templateCode       String              @map("template_code") @db.VarChar(80)
  payload            Json
  status             NotificationStatus  @default(PENDING)
  providerMessageId  String?             @map("provider_message_id") @db.VarChar(120)
  attempts           Int                 @default(0)
  sentAt             DateTime?           @map("sent_at")
  createdAt          DateTime            @default(now()) @map("created_at")

  customer Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)
  order    Order?    @relation(fields: [orderId], references: [id], onDelete: SetNull)

  @@index([orderId])
  @@index([status, createdAt(sort: Desc)])
  @@index([customerId, createdAt(sort: Desc)])
  @@map("notifications")
}

model AuditLog {
  id          String         @id @default(uuid()) @db.Uuid
  actorId     String?        @map("actor_id") @db.Uuid
  actorType   AuditActorType @default(USER) @map("actor_type")
  action      String         @db.VarChar(80)
  entityType  String         @map("entity_type") @db.VarChar(60)
  entityId    String?        @map("entity_id") @db.VarChar(80)
  before      Json?
  after       Json?
  ip          String?        @db.VarChar(45)
  userAgent   String?        @map("user_agent") @db.VarChar(512)
  previousHash String?       @map("previous_hash") @db.VarChar(64)
  hash        String         @db.VarChar(64)
  createdAt   DateTime       @default(now()) @map("created_at")

  actor User? @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([entityType, entityId, createdAt(sort: Desc)])
  @@index([actorId, createdAt(sort: Desc)])
  @@index([action, createdAt(sort: Desc)])
  @@map("audit_logs")
}

model Setting {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @db.VarChar(80)
  siteId      String?  @map("site_id") @db.Uuid
  value       Json
  description String?  @db.VarChar(255)
  isSecretRef Boolean  @default(false) @map("is_secret_ref") // value = ruta al gestor de secretos
  updatedBy   String?  @map("updated_by") @db.Uuid
  updatedAt   DateTime @updatedAt @map("updated_at")

  site Site? @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@unique([key, siteId])
  @@map("settings")
}

model OutboxEvent {
  id            String       @id @default(uuid()) @db.Uuid
  aggregateType String       @map("aggregate_type") @db.VarChar(60)
  aggregateId   String       @map("aggregate_id") @db.VarChar(80)
  eventType     String       @map("event_type") @db.VarChar(80)
  payload       Json
  status        OutboxStatus @default(PENDING)
  attempts      Int          @default(0)
  availableAt   DateTime     @default(now()) @map("available_at")
  processedAt   DateTime?    @map("processed_at")
  lastError     String?      @map("last_error") @db.Text
  createdAt     DateTime     @default(now()) @map("created_at")

  @@index([status, availableAt])
  @@index([aggregateType, aggregateId])
  @@map("outbox_events")
}
```

---

## 3. Notas de implementación futura (fuera de este documento)

1. `prisma validate` y `prisma migrate diff` antes de cualquier migración; `CHECK` y
   `tsvector` se añaden en SQL revisionado (`diccionario-datos.md` §11).
2. La relación 1:1 `User.customerId` requiere índice único (ya declarado) y validación de
   que un cliente no quede sin credenciales y viceversa.
3. `OrderItem.lotId` es referencia histórica **sin FK real** en el modelo físico final: se
   conserva el código de lote en `product_snapshot` por si el lote se purga.
4. `Setting.isSecretRef = true` implica que `value` es solo una ruta (`secret://...`), nunca
   un secreto. `forge-sentinel` debe revisar cualquier cambio en este modelo.
5. Los enums `UserRole` y los permisos RBAC son complementarios: el rol agrupa, el permiso
   autoriza la acción concreta en la API.
