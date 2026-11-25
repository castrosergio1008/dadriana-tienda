# Diagramas de Arquitectura — Adriana Tienda

| Campo | Valor |
|---|---|
| **Autor** | `forge-architect` (Staff Engineer, APEX FORGE) |
| **Estado** | Draft — complemento visual del `design-doc.md` |
| **Fecha** | 23 de noviembre de 2026 |
| **Notación** | Mermaid (bloques `mermaid`). Los diagramas C4 usan las etiquetas `C4Context` / `C4Container` de Mermaid. |
| **Decisiones aplicadas** | [decisiones-comandante.md](./decisiones-comandante.md) — C-01 (lotes/FEFO y `site_id`), C-03 (`OPS-09`), C-04 (auth), C-06 (`POST /api/v1/checkout`), C-08 (estados canónicos). |

> **Leyenda general:** los colores/etiquetas siguen la identidad aprobada (verde `#1E644C` = sistema propio; dorado `#B8895A` = integraciones; gris = actores). Las flechas indican **quién inicia** la interacción. Todo evento escrito en PostgreSQL pasa por `outbox_events` y es consumido por el worker. «Sucursal» es etiqueta UI; el identificador técnico es **`site_id`/`sites`**.

---

## 1. C4 — Nivel 1: Contexto del sistema

```mermaid
C4Context
    title Contexto del sistema — Adriana Tienda (Colombia, 2 sedes)
    Person(cliente, "Cliente final", "Compra desde web/móvil o presencialmente en una sede")
    Person(vendedor, "Vendedor tienda", "Opera una de las 2 sedes físicas: stock, retiros, pedidos POS")
    Person(admin, "Admin / Superadmin", "Operación central, catálogo, roles y auditoría")
    System(adriana, "Adriana Tienda", "E-commerce + operación multi-sede: catálogo, pagos, pedidos, inventario por sede")
    System_Ext(wompi, "Wompi", "Pasarela primaria: tarjeta, PSE, Nequi, Daviplata, efectivo, BNPL")
    System_Ext(epayco, "ePayco", "Pasarela plan B detrás del adaptador de pagos")
    System_Ext(dian, "Proveedor tecnológico DIAN", "Factura electrónica y notas crédito")
    System_Ext(logistica, "Transportadora / agregador", "Cotización, guías y tracking")
    System_Ext(comms, "Resend + WhatsApp Cloud", "Correo transaccional y mensajería")
    System_Ext(obs, "GA4 + Sentry + Cloudflare", "Analítica con consentimiento, errores, CDN y WAF")

    Rel(cliente, adriana, "Explora, compra, paga, retira o recibe a domicilio")
    Rel(vendedor, adriana, "Registra venta POS, confirma retiro, ajusta stock de su sede")
    Rel(admin, adriana, "Administra catálogo, pedidos, sedes, roles y auditoría")
    Rel(adriana, wompi, "Crea intención, verifica webhook, concilia y reembolsa")
    Rel(adriana, epayco, "Plan B: mismo contrato de pagos")
    Rel(adriana, dian, "Emite factura y nota crédito")
    Rel(adriana, logistica, "Genera guía y consulta tracking")
    Rel(adriana, comms, "Notifica hitos del pedido")
    Rel(cliente, obs, "Navegación medida con Consent Mode v2")
    Rel(adriana, obs, "Errores, trazas y Core Web Vitals")
```

**Leyenda (español):** el sistema Adriana Tienda es el único que concentra datos de clientes y saldos de inventario. Los sistemas en dorado son proveedores externos sustituibles mediante adaptadores. El cliente nunca interactúa directamente con DIAN ni con la transportadora.

---

## 2. C4 — Nivel 2: Contenedores

```mermaid
C4Container
    title Contenedores — Adriana Tienda

    Person(cliente, "Cliente", "Web móvil/desktop")
    Person(operador, "Vendedor / Admin", "Panel administrativo y POS web")

    Container_Boundary(sistema, "Adriana Tienda") {
        Container(web, "apps/web", "Next.js 15 · App Router · RSC", "Storefront, admin, Route Handlers /api/v1 y webhooks entrantes")
        Container(core, "packages/core", "TypeScript strict", "Dominio puro: IVA en centavos, precios, carrito, pedidos, pagos, lotes FEFO y transferencias")
        Container(ui, "packages/ui", "React 19 + Tailwind v4 + Radix", "Design system accesible, tokens verde/dorado")
        Container(worker, "apps/worker", "Node 22 + BullMQ", "Jobs: factura DIAN, correo, WhatsApp, conciliación, expiración de reservas, índice")
        ContainerDb(db, "PostgreSQL (Neon)", "Postgres 16", "Fuente de verdad: inventory_lots(lot_id, site_id) + proyección inventory_by_site; esquemas auth, catalog, inventory, orders, content, audit")
        ContainerDb(redis, "Redis", "7.x", "Caché, colas, idempotencia, denylist JWT, sesiones de carrito")
        Container(search, "Meilisearch", "1.x", "Índice derivado: facetas, sinónimos, tolerancia a errores")
        Container(r2, "Cloudflare R2", "Objetos + CDN", "Imágenes AVIF/WebP y assets estáticos")
    }

    Container_Ext(wompi, "Wompi", "Checkout hospedado · SAQ-A")
    Container_Ext(dian, "Proveedor DIAN", "Facturación electrónica")
    Container_Ext(comms, "Resend / WhatsApp", "Notificaciones")
    Container_Ext(ga, "GA4 / Sentry", "Medición y observabilidad")

    Rel(cliente, web, "HTTPS")
    Rel(operador, web, "HTTPS · cookie httpOnly SameSite=Strict · MFA Admin/Superadmin · tablet 8 h Vendedor")
    Rel(web, ui, "Renderiza")
    Rel(web, core, "Llama reglas de dominio")
    Rel(worker, core, "Reutiliza las mismas reglas")
    Rel(core, db, "Lee/escribe · transacciones ACID")
    Rel(core, redis, "Caché · colas · idempotencia")
    Rel(core, search, "Consulta e indexa (derivado)")
    Rel(worker, db, "Outbox y jobs")
    Rel(worker, wompi, "Conciliación y reembolsos")
    Rel(web, wompi, "Intención de pago + webhook")
    Rel(worker, dian, "Factura / nota crédito")
    Rel(worker, comms, "Correo y WhatsApp")
    Rel(web, r2, "Imágenes optimizadas")
    Rel(web, ga, "Eventos con consentimiento")
```

**Leyenda (español):** `apps/web` y `apps/worker` son los dos únicos procesos desplegables. `packages/core` no depende de Next.js: por eso puede extraerse detrás de una API Express en el futuro sin reescribir reglas. PostgreSQL es el único lugar donde un saldo de stock o un pedido es definitivo, y dentro de él `inventory_lots` manda sobre la proyección (C-01). El token de acceso del navegador viaja en cookie `httpOnly`; `Bearer` solo se usa servidor a servidor (C-04).

---

## 3. Componentes del frontend

```mermaid
flowchart TB
    subgraph App["Next.js App Router"]
        MW["Middleware<br/>cookie httpOnly · RBAC · siteIds · CSP<br/>Strict (Lax solo retorno Wompi)"]
        RSC["Server Components<br/>Home · PLP · PDP · cuenta"]
        SA["Server Actions<br/>carrito · cupones · direcciones"]
        RH["Route Handlers /api/v1<br/>checkout · webhooks · search"]
        ADM["Panel admin /admin/**<br/>pedidos · inventario · POS · transferencias"]
    end

    subgraph UI["packages/ui · design system"]
        TOK["Tokens<br/>verde #1E644C · dorado #B8895A<br/>Fraunces + Inter"]
        PRIM["Primitivas Radix<br/>tabs · drawer · bottom-sheet · foco"]
        A11Y["Accesibilidad<br/>aria-live · teclado · reduced-motion"]
        PERF["Rendimiento<br/>next/image · srcset · ISR · streaming Suspense"]
    end

    subgraph STATE["Estado del cliente"]
        CART["Carrito en cookie firmada<br/>+ merge al login"]
    end

    MW --> RSC
    MW --> ADM
    RSC --> UI
    SA --> UI
    RH --> UI
    ADM --> UI
    UI --> TOK
    UI --> PRIM
    UI --> A11Y
    UI --> PERF
    SA --> CART
    RH --> CART
    ADM --> RH
```

**Leyenda (español):** el middleware es la primera barrera del panel administrativo; la UI nunca decide permisos, solo los refleja. Las Server Actions y los Route Handlers revalidan autorización en servidor. El carrito del invitado vive en cookie firmada y se fusiona al iniciar sesión.

---

## 4. Componentes del backend

```mermaid
flowchart TB
    subgraph CORE["packages/core · dominio puro"]
        CAT["Catálogo y precios<br/>IVA 19% · cupones · snapshots"]
        CARTD["Carrito"]
        ORDER["Pedidos<br/>máquina de estados · numeración"]
        PAY["Pagos<br/>puerto + adaptadores Wompi/ePayco/COD"]
        INV["Inventario multi-sede<br/>inventory_lots · FEFO · vencimientos · reservas · transferencias"]
        AUTHZ["Autorización<br/>roles · siteIds · MFA Admin/Superadmin"]
        OUT["Outbox de eventos de dominio"]
    end

    subgraph INFRA["Infraestructura"]
        PRISMA["Repositorios Prisma · PostgreSQL"]
        REDIS["Redis · colas BullMQ · idempotencia · JWT denylist"]
        SEARCH["Adaptador Meilisearch + fallback FTS"]
    end

    subgraph ADAPTERS["Adaptadores externos (bordes)"]
        WOMPI["Wompi"]
        EPAYCO["ePayco · plan B"]
        DIAN["Facturación DIAN"]
        SHIP["Transportadora"]
        MAIL["Resend / WhatsApp"]
    end

    CARTD --> CAT
    ORDER --> CAT
    ORDER --> PAY
    ORDER --> INV
    INV --> OUT
    ORDER --> OUT
    PAY --> OUT
    CAT --> PRISMA
    INV --> PRISMA
    ORDER --> PRISMA
    CAT --> SEARCH
    PAY --> WOMPI
    PAY --> EPAYCO
    OUT --> REDIS
    REDIS --> DIAN
    REDIS --> SHIP
    REDIS --> MAIL
    AUTHZ -.->|"filtra todas las consultas"| ORDER
    AUTHZ -.-> INV
```

**Leyenda (español):** las flechas punteadas de `Autorización` son **filtros transversales**: un Vendedor solo consulta pedidos e inventario de su sede porque el repositorio añade `site_id` a la query, no porque la pantalla lo oculte. Los adaptadores externos están en el borde: cambiar de proveedor no toca el dominio. No existe adaptador `mercado-pago` (C-12).

---

## 5. Secuencia: checkout con pasarela y webhook

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant W as apps/web
    participant D as PostgreSQL
    participant R as Redis
    participant P as Wompi
    participant K as Worker

    C->>W: POST /api/v1/checkout (cookie httpOnly, Idempotency-Key, cartId, fulfillmentType)
    W->>W: Valida sesión, precios en *_cents, IVA 1900 bp y cupón
    W->>D: BEGIN TX
    W->>D: SELECT lotes activos del site_id ORDER BY expiry_date ASC (FEFO, ≥15 días)
    W->>D: UPDATE inventory_lots SET reserved+qty WHERE lot_id y site_id y on_hand-reserved >= qty
    W->>D: UPDATE inventory_by_site SET reserved+qty (misma TX)
    alt Sin stock suficiente
        D-->>W: 0 filas afectadas
        W-->>C: 409 "Sin disponibilidad en la sede elegida" + alternativas
    else Stock reservado
        W->>D: INSERT order PENDING_PAYMENT + order_items (snapshots en centavos) + reservation TTL 30 min + idempotency_key
        D-->>W: COMMIT
        W->>P: createIntent (monto en centavos, return_url, webhook_url)
        P-->>W: nextAction.checkoutUrl
        W-->>C: 201 con nextAction.checkoutUrl → redirección a Wompi
        C->>P: Paga con tarjeta / PSE / Nequi / cuotas
        P-->>C: Redirección de vuelta (status=approved; cookie checkout SameSite=Lax)
        Note over C,W: La redirección NO confirma el pedido
        P->>W: POST /webhooks/wompi (firma + event_id)
        W->>W: Verifica firma HMAC; Bearer solo S2S
        alt Firma inválida
            W-->>P: 401 + alerta a Sentry
        else Firma válida
            W->>D: INSERT webhook_event (unique provider+event_id)
            alt Evento duplicado
                D-->>W: Conflicto
                W-->>P: 200 sin reprocesar
            else Evento nuevo
                W->>R: Encola job con jobId = webhook_event.id
                W-->>P: 200 ACK inmediato
                R->>K: Entrega job
                K->>D: Transición PENDING_PAYMENT → PAID (estado monotónico)
                K->>D: Confirma lote FEFO: on_hand-qty, reserved-qty en inventory_lots + movement; actualiza proyección
                K->>D: INSERT outbox_events (factura, email, WhatsApp, guía)
                K->>K: Emite factura DIAN, notifica y crea borrador de guía
                K-->>C: Correo/WhatsApp con número de pedido y ETA
            end
        end
    end
```

**Leyenda (español):** `POST /api/v1/checkout` es el **único** endpoint de creación de pedido (C-06; no existe `POST /orders`). La reserva FEFO y el pedido nacen en **una sola transacción**, con la proyección actualizada en ella (C-01). El webhook se acknowledgea rápido y se procesa en el worker. La vuelta del navegador es informativa: nunca cambia el estado. `Idempotency-Key`, `unique(provider, event_id)` y la cookie `httpOnly` evitan cobros, pedidos duplicados y exposición del token (C-04).

---

## 6. Secuencia: retiro en tienda (click & collect)

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant W as Web / POS
    participant D as PostgreSQL
    participant K as Worker
    actor V as Vendedor de la sede

    C->>W: Checkout elige "Recoger en Sede 1" (site_id)
    W->>D: Reserva FEFO de lote en Sede 1 (TTL 30 min) + proyección
    W->>W: Pago vía Wompi (ver diagrama 5)
    D->>D: orders.status = PAID · reserva confirmada en Sede 1
    D->>K: outbox: "pedido listo para preparar en Sede 1"
    K->>V: Tarea en panel: preparar pedido + picking list
    V->>W: Marca PREPARANDO → READY_FOR_PICKUP
    W->>D: order_status_history con actor, site_id y timestamp
    D->>K: outbox: "listo para retiro"
    K-->>C: Correo/WhatsApp con código de retiro y horario
    C->>V: Se presenta en la sede con el código
    V->>W: Confirma entrega con código
    W->>D: UPDATE inventory_lots (on_hand-qty) + movimiento · orders.status = DELIVERED (fulfillmentType=STORE_PICKUP) + proyección
    D->>K: outbox: "entregado en tienda"
    K-->>C: Confirmación + solicitud de reseña verificada
```

**Leyenda (español):** la reserva garantiza que el **lote** existe en la `site_id` elegida, no en otra. `READY_FOR_PICKUP` es un estado propio de `orders.status`, no un derivado de `store_pickups.status` (C-08). El código de retiro es el control de entrega. El descuento definitivo de `on_hand` del lote ocurre al confirmar la entrega, aunque la reserva ya había apartado la unidad; el movimiento queda auditado con actor y sede.

---

## 7. Estados del pedido

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: POST /api/v1/checkout + reserva FEFO 30 min
    [*] --> PAID: venta POS cobrada en tienda (OPS-09)
    PENDING_PAYMENT --> PAID: Webhook APPROVED verificado
    PENDING_PAYMENT --> CANCELLED: TTL expira / cancelación / pago rechazado (libera lote)
    PENDING_PAYMENT --> REFUNDED: pago tardío sin stock (reembolso automático)

    PAID --> PREPARING: Operación toma el pedido
    PREPARING --> PACKED: Picking y empaque
    PACKED --> READY_FOR_PICKUP: fulfillmentType = STORE_PICKUP
    PACKED --> OUT_FOR_DELIVERY: fulfillmentType = HOME_DELIVERY
    READY_FOR_PICKUP --> DELIVERED: Vendedor confirma con código
    OUT_FOR_DELIVERY --> DELIVERED: Webhook o conciliación de transportadora

    DELIVERED --> RETURN_REQUESTED: Cliente (5 días hábiles, Ley 1480)
    RETURN_REQUESTED --> REFUNDED: Recepción verificada + nota crédito DIAN
    RETURN_REQUESTED --> RETURN_REJECTED: Retracto rechazado (terminal)

    PAID --> CANCELLED: cancelación con reembolso (aprobación)
    PAID --> REFUNDED: reembolso aprobado y ejecutado
    PREPARING --> CANCELLED: incidencia (aprobación)
    PACKED --> CANCELLED: incidencia (aprobación)

    DELIVERED --> [*]
    REFUNDED --> [*]
    CANCELLED --> [*]
    RETURN_REJECTED --> [*]
```

**Leyenda (español):** los identificadores son los canónicos de C-08; la tabla «etiqueta UI en español → identificador canónico» está en el [design-doc.md §4.4.1](./design-doc.md). Pago y pedido son máquinas distintas sincronizadas por eventos. Los estados son **monotónicos**: un pedido pagado nunca vuelve a `PENDING_PAYMENT`. Las dos ramas de entrega (`READY_FOR_PICKUP` y `OUT_FOR_DELIVERY`) convergen en `DELIVERED`. **`RETURN_REQUESTED → DELIVERED` se elimina**: el retracto rechazado termina en `RETURN_REJECTED` (terminal); `DELIVERED` deja de ser terminal solo cuando existe un `RETURN_REQUESTED`. `READY_FOR_PICKUP` es `orders.status`, no un derivado de `store_pickups.status`. El pago tardío se registra con bandera `reviewRequired` en `payments`, sin introducir estados duplicados en `orders.status`. Todo cambio escribe historial y outbox.

---

## 8. Flujo: reserva de inventario multi-sede

```mermaid
flowchart TD
    A["Cliente agrega variante V x2"] --> B["Checkout elige modalidad"]
    B -->|Retiro| C["site_id elegida por el cliente"]
    B -->|Envío a domicilio| D["site_id de fulfillment por prioridad + disponibilidad"]

    C --> FEFO{"SELECT lotes activos<br/>del site_id ORDER BY expiry_date ASC<br/>(FEFO, ≥15 días, omite bloqueados)"}
    D --> FEFO

    FEFO -->|"Sin lote con saldo"| F{"Otra sede<br/>tiene stock?"}
    F -->|Sí, retiro| G["Ofrecer cambiar de sede"]
    F -->|Sí, envío| H["Ofrecer otra sede de fulfillment o SPLIT"]
    F -->|No| I["Sin disponibilidad<br/>sugerir alternativas"]

    FEFO -->|"Lote L con saldo"| E{"UPDATE atómico inventory_lots<br/>reserved += 2 WHERE lot_id=L<br/>AND site_id=S AND on_hand-reserved >= 2"}
    E -->|"0 filas"| F
    E -->|"1 fila"| CH{"Canal?"}

    CH -->|Web| J["+ stock_reservation TTL 30 min<br/>+ proyección inventory_by_site<br/>(misma TX)"]
    J --> K["Pedido PENDING_PAYMENT (misma TX)"]

    CH -->|"POS (OPS-09)"| M
    K --> L{"Pago aprobado<br/>antes de 30 min?"}
    L -->|Sí| M
    L -->|No| N["Job expira la reserva<br/>reserved -= 2 · pedido CANCELLED"]

    M["inventory_lots + proyección:<br/>on_hand -= 2 · reserved -= 2<br/>+ inventory_movement<br/>→ pedido PAID"]

    M --> O{"Modalidad?"}
    O -->|Retiro| P["Entrega en sede con código<br/>READY_FOR_PICKUP → DELIVERED"]
    O -->|Envío| Q["Guía + tracking<br/>OUT_FOR_DELIVERY → DELIVERED"]

    T["Admin: transferencia Sede1 → Sede2"] --> U["DRAFT → IN_TRANSIT<br/>origen on_hand- / in_transit+"]
    U --> V["RECEIVED en destino<br/>destino in_transit- / on_hand+"]
```

**Leyenda (español):** la fuente de verdad es `inventory_lots(lot_id, site_id)` (C-01): FEFO elige el lote activo con `expiry_date` más próxima del `site_id` correcto (aviso al operador a 90 días, bloqueo de venta a 15 días, RF-079..RF-081). El corazón es el `UPDATE` condicional atómico: si dos canales (web y POS, `OPS-09`) intentan tomar la última unidad, solo uno obtiene 1 fila afectada; el `CHECK (reserved ≤ on_hand)` en PostgreSQL es la última red de seguridad. `inventory_by_site` se actualiza en la **misma transacción** y es solo proyección (`on_hand = Σ lots.on_hand`). Los estados son los canónicos de C-08 (`PENDING_PAYMENT`, `PAID`, `CANCELLED`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`) y las transferencias usan `DRAFT → IN_TRANSIT → RECEIVED/CANCELLED`. El split y el cambio de sede son decisiones del cliente **antes** de cobrar, nunca después.

---

## 9. Despliegue

```mermaid
flowchart TB
    DEV["GitHub · trunk + PRs pequeños"] --> CI["GitHub Actions<br/>lint · typecheck · Vitest · Playwright · axe · Lighthouse · Docker build"]
    CI -->|verde| VERCEL["Vercel<br/>apps/web · preview deploys · rollback < 2 min"]
    CI -->|verde| FLY["Fly.io / Railway<br/>apps/worker · Docker · IP fija para DIAN/transportadoras"]
    CI -->|verde| R2["Cloudflare R2<br/>media AVIF/WebP"]

    USER["Clientes y operadores"] --> CF["Cloudflare · CDN · WAF · bot management"]
    CF --> VERCEL
    VERCEL --> NEON[("Neon PostgreSQL 16<br/>PITR 7d + dump frío 30d · multi-schema · réplica")]
    VERCEL --> REDIS[("Redis gestionado<br/>colas · caché · idempotencia")]
    VERCEL --> MEILI[("Meilisearch<br/>índice derivado")]
    VERCEL --> R2

    FLY --> NEON
    FLY --> REDIS
    FLY --> EXT["Wompi · ePayco · DIAN · transportadora · Resend · WhatsApp"]

    SENTRY["Sentry + Vercel Analytics + GA4"] -.->|telemetría| VERCEL
    SENTRY -.-> FLY
```

**Leyenda (español):** todo pasa por Cloudflare (CDN, WAF, protección de origen). El `web` se despliega en Vercel para ISR y rollback instantáneo; el `worker` corre en contenedor Docker con **IP fija**, útil si el proveedor DIAN o la transportadora exigen whititelist. PostgreSQL con **PITR de 7 días + dump frío diario con retención de 30 días (C-09)** es la única fuente de verdad (RPO ≤ 5 min, RTO ≤ 1 h); la ampliación a PITR de 30 días es una mejora aprobable por el cliente, no un requisito del MVP. El rollback de código es independiente del rollback de datos.

---

## Trazabilidad entre diagramas

| Escenario | Diagramas relacionados | Historias |
|---|---|---|
| Compra con pago en línea | 2, 4, 5, 7, 9 | HU-009, HU-011, HU-013 |
| Retiro en tienda | 1, 2, 6, 7, 8 | HU-016, HU-017 |
| Venta en tienda física (POS) | 1, 4, 7, 8 | `OPS-09`, HU-015, HU-019 |
| Transferencia entre sedes | 4, 8 | HU-018 |
| Seguridad del panel | 1, 3, 4 | HU-022, HU-023 |

> **`OPS-09 — Registro de venta presencial`** (8 pts, Sprint 6, depende de la historia de lotes/FEFO de EP-05) se planifica en el MVP por C-03; su escenario E2E de pedido POS es gate de release (ver `[design-doc.md §7](./design-doc.md)`).
