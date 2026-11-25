# Design Doc — E-commerce de belleza y cuidado capilar (Colombia)

| Campo | Valor |
|---|---|
| **Proyecto** | Adriana Tienda — e-commerce greenfield |
| **Autor** | `forge-architect` (Staff Engineer, APEX FORGE) |
| **Estado** | **Draft → In Review** (requiere aprobación del Comandante `apex-forge`) |
| **Decisor** | `apex-forge` (Comandante) |
| **Revisores requeridos** | `forge-reviewer` (diseño), `forge-sentinel` (pagos, datos personales, DIAN), `forge-qualis` (test/rollout), `forge-infra` (costos e infra) |
| **Fecha** | 11 de noviembre de 2026 |
| **Versión** | 1.0 |
| **Directorio** | `/home/digital2026/DIGITALDEVS/PROYECTOS/Adriana_tienda` (vacío: greenfield confirmado) |

> **Regla de oro del documento:** ninguna línea de código de aplicación se escribe antes de
> que este documento pase a **Approved**. El schema Prisma y las configuraciones mínimas
> incluidas aquí son artefactos de diseño, no implementación.

## Mapa de entregables

| # | Entregable solicitado | Sección |
|---|---|---|
| 1 | Resumen ejecutivo y objetivos medibles (KPIs) | §0 y §2 |
| 2 | Alcance MVP vs Fase 2 vs Fase 3 | §4 |
| 3 | Arquitectura con diagrama ASCII | §6 |
| 4 | Stack tecnológico y descarte de alternativas | §7 |
| 5 | Sistema de pagos para Colombia | §8 |
| 6 | UI/UX, design system, pantallas y wireframes | §9 |
| 7 | Base de datos: ER, Prisma, índices y decisiones | §10 |
| 8 | Plan por sprints, equipo y estimación | §11 |
| 9 | Riesgos, testing y plan de lanzamiento | §12 |
| 10 | Costos operativos mensuales | §13 |
| 11 | Decisiones abiertas para el cliente | §14 |

---

## 0. Resumen ejecutivo

Vamos a construir una tienda de belleza, cuidado personal y capilar para Colombia sobre un
**monolito modular** en Next.js 15 + PostgreSQL, con búsqueda dedicada (Meilisearch), pagos
agregados por **Wompi** (con ePayco como plan B, BNPL nativo de Wompi en MVP y Addi/Sistecrédito
por integración directa en Fase 2), facturación
electrónica DIAN vía proveedor tecnológico y una capa de operación logística con agregador de
transportadoras.

La referencia competitiva (Recamier, sobre VTEX IO) tiene una vitrina sólida pero deja siete
huecos explotables: **CTAs duplicados sin jerarquía, cero reseñas, cero venta cruzada, búsqueda
sin autocompletado ni tolerancia a errores, filtros por necesidad inexistentes, ausencia de
quick-add y de transparencia de stock/entrega, y URLs con query params de plataforma**. Nuestra
tesis de producto es simple: **ganar en móvil con velocidad, descubrimiento por necesidad y
confianza transaccional** (stock real, fecha de entrega estimada, reseñas verificadas, precios
con IVA y políticas claras).

No recomendamos Shopify, VTEX, Medusa ni WooCommerce para este caso: el costo total de
propiedad y el control sobre checkout, DIAN y datos favorecen un desarrollo a medida sobre el
stack Digitaldevs. El ahorro no está en construir barato, sino en **no pagar plataforma +
apps + comisiones de ecosistema cerrado** y en poder iterar el checkout sin límites de
plataforma.

**Inversión estimada (MVP):** 13–17 semanas realistas (rango 13 / 17 / 23) con un equipo de
~4,7 FTE del equipo APEX (sin contar 0,5 FTE de contenido del cliente). **Costo operativo de infraestructura:** USD 250–470/mes en régimen inicial
(≈ COP 1,0–1,8 M/mes con TRM de referencia 4.000 — *verificar TRM vigente*), más costos
variables por transacción.

---

## 1. Contexto y problema

### 1.1 El negocio

Tienda colombiana de belleza/cuidado personal y capilar, con catálogo estimado de **300–800
SKUs**, **8–15 marcas**, ~**20 categorías** con dos niveles de profundidad, variantes por
tamaño/tono y combos/packs. Venta nacional con envío por transportadoras y **recogida en
tienda opcional**. Precios en **COP con IVA incluido**.

### 1.2 El problema

El cliente no tiene canal transaccional propio. Depende de la vitrina de la referencia
(Recamier/VTEX) como vara de comparación, y su expectativa es **igualar o superar** esa
experiencia, con foco en conversión móvil (≥70% del tráfico esperado), Core Web Vitals en
verde y SEO técnico sólido.

La referencia resuelve la parte "escaparate" pero no la parte "decisión de compra":

| Debilidad observada en la referencia | Consecuencia en negocio |
|---|---|
| Dos CTAs "Agregar a la bolsa" sin jerarquía | Fricción y ambigüedad en el momento clave |
| Sin reseñas visibles | Falta de prueba social; el usuario sale a Google/Instagram |
| Sin "comprados juntos" ni bundles | AOV subóptimo |
| Búsqueda sin autocompletado ni tolerancia a errores | Pérdida de intención de compra |
| Sin filtros por necesidad (tipo de cabello, preocupación) | El usuario no encuentra por problema, solo por marca |
| Sin quick-add desde el listado | Más pasos hasta el carrito en móvil |
| Sin transparencia de stock/entrega | Abandono por incertidumbre |
| URLs con query params de VTEX | Mala higiene SEO, canibalización, difícil indexación |
| Consentimiento de cookies débil | Riesgo Ley 1581 y pérdida de señal en GA4 |

### 1.3 Supuestos documentados (a confirmar con el cliente)

| # | Supuesto | Impacto si es falso |
|---|---|---|
| S1 | Catálogo propio y marcas con autorización de venta online | Restricciones de canal, MAP pricing, posible rediseño de catálogo |
| S2 | 300–800 SKUs al lanzamiento | Ajusta esfuerzo de carga de datos y búsqueda |
| S3 | 1–3 bodegas/tiendas con inventario propio | Multi-bodega y lógica de asignación |
| S4 | No hay ERP/POS integrado hoy (o es reemplazable) | Si hay ERP, cambia el alcance de sincronización |
| S5 | Tráfico inicial 10–50 mil sesiones/mes | Dimensiona infraestructura y costos |
| S6 | Ticket promedio objetivo COP 180.000–250.000 | Define umbrales de contraentrega y antifraude |
| S7 | Operación logística con 1–3 transportadoras | Define agregador vs integración directa |
| S8 | BNPL disponible por contrato directo con Addi/Sistecrédito | Si no hay contrato, se difiere a Fase 2; el MVP usa el BNPL nativo de Wompi |
| S9 | Facturación electrónica vía proveedor tecnológico (no desarrollo propio) | Si se exige desarrollo propio, +6–10 semanas y habilitación DIAN |
| S10 | Contenido/fotografía provisto por el cliente o agencia | Si no existe, se necesita producción de contenido (costo aparte) |

---

### 1.4 Medición técnica de la referencia (nov-2026)

Medición propia con `curl` desde red latinoamericana, sin caché caliente:

| Plantilla | TTFB | Total | HTML sin comprimir | Observación |
|---|---|---|---|---|
| Home | 0,19 s | 0,36 s | **1,73 MB** | HTML sobredimensionado por islas de VTEX; 35 referencias JS/CSS |
| PLP (`/cuidado-capilar`) | 0,34 s | 0,42 s | 0,24 MB | Render server-side correcto, HTML razonable |
| PDP | 0,66 s | 1,37 s | 0,16 MB | El TTFB más alto del sitio: depende de APIs de catálogo en cascada |

Lectura: el servidor no es el problema; **el peso del documento y la cascada de datos en PDP
sí**. Nuestra meta es HTML de Home < 250 KB y TTFB p75 < 800 ms con caché en CDN, lo que deja
margen para LCP < 2,5 s en 4G. Este es el "listón" medible que debemos superar.

---

## 2. Objetivos y KPIs medibles

### 2.1 Objetivos de negocio (12 meses post-lanzamiento)

1. Canal propio transaccional con **≥30% de las ventas online** del negocio.
2. **CVR móvil ≥1,8%** (hipótesis; benchmark beauty/e-commerce Colombia ~1–2%, *verificar*).
3. **AOV ≥ COP 190.000** impulsado por bundles, cross-sell y umbral de envío gratis.
4. **Abandono de carrito ≤65%** (industria ~70%; *verificar*).
5. **Checkout completion ≥55%** de carritos que inician checkout.
6. **Recuperación ≥8%** de carritos abandonados vía email/WhatsApp.

### 2.2 Objetivos técnicos (no negociables)

| KPI | Meta | Medición |
|---|---|---|
| **LCP** (p75 móvil) | **< 2,5 s** | CrUX + Vercel Speed Insights + GA4 |
| **INP** (p75) | **< 200 ms** | CrUX / RUM |
| **CLS** (p75) | **< 0,1** | CrUX / RUM |
| TTFB (p75, HTML) | < 800 ms | RUM |
| JS en PDP (gzip) | ≤ 170 KB | Bundle analyzer en CI |
| Disponibilidad | **99,9%** mensual | Uptime checks |
| Tasa de error 5xx | < 0,1% de requests | Logs/APM |
| Pedidos pagados sin factura DIAN | 0 (con reintento < 15 min) | Monitor de facturación |
| Cobertura de tests | ≥70% líneas global; ≥80% en `packages/core`; 100% en flujos de pago | CI |
| Accesibilidad | WCAG 2.2 AA en flujos críticos | axe + auditoría manual |

### 2.3 KPIs de embudo (dashboard de negocio)

Sesiones → PDP views → add-to-cart rate → checkout init → pago aprobado → entrega.
Cada paso con su tasa, por dispositivo y por canal (orgánico, paid, email/WhatsApp,
referidos). Sin dato no hay decisión: **todo evento se instrumenta con GA4 + Consent Mode v2**.

---

## 3. No-objetivos (qué NO haremos)

| No-objetivo | Por qué |
|---|---|
| **Marketplace multi-vendedor** | El negocio es marca/retail propio; multi-vendor multiplica complejidad fiscal y de logística |
| **App nativa iOS/Android** | PWA + web móvil cubre el 95% del caso; app nativa es Fase 3 |
| **Desarrollo propio del motor de facturación DIAN** | Riesgo regulatorio y costo; se usa proveedor tecnológico habilitado |
| **Motor de reglas promocionales tipo ERP** | Se implementan reglas declarativas acotadas (cupón + promoción automática + bundle) |
| **Multi-idioma / multi-moneda** | Solo Colombia, COP. Se deja `currency` y `locale` modelados para no bloquear el futuro |
| **Personalización con ML en MVP** | Requiere volumen; Fase 3 con datos propios |
| **Suscripciones recurrentes de producto** | Fase 3; se modela `newsletter` y se deja la puerta abierta |
| **Integración con todos los ERP del mercado** | Solo el ERP que el cliente tenga (si existe) vía adaptador |
| **Búsqueda vectorial/semántica** | Meilisearch con sinónimos cubre el caso; embeddings en Fase 3 |
| **Programa de lealtad por puntos** | Fase 2/3; el MVP cubre cupones, referidos y registro con descuento |
| **"Comprados juntos" con descuento (bundle)** | Fase 2. El MVP incluye "relacionados" por categoría/necesidad, sin descuento combinado ni modelo de bundle |
| **Chat en vivo propio** | Se integra WhatsApp Business; chat in-house es Fase 3 |

---

## 4. Alcance por fases

### 4.1 MVP (lanzamiento) — 13–17 semanas

- Storefront completo: Home, PLP con filtros facetados, PDP con variantes y reseñas, buscador
  con autocompletado, carrito, checkout de una página, confirmación, cuenta, seguimiento,
  wishlist, páginas legales y blog mínimo (CMS headless o MDX).
- Catálogo: marcas, categorías (2 niveles), productos, variantes, atributos, imágenes
  optimizadas, inventario multi-bodega.
- Precios en COP con IVA incluido, cupones y promociones básicas (%, monto fijo, envío gratis).
- Pagos: tarjeta, PSE, Nequi, Daviplata, efectivo en corresponsales, contraentrega y **BNPL
  nativo de Wompi** (*Compra y Paga Después* / *SU+Pay*). Addi y Sistecrédito por integración
  directa entran en Fase 2.
- Pedidos: máquina de estados, historial, emails transaccionales, factura electrónica DIAN,
  guías y tracking con agregador logístico.
- Admin: catálogo, pedidos, inventario, cupones, reseñas (moderación), usuarios/roles, auditoría.
- SEO técnico: URLs limpias, sitemap, robots, canonical, JSON-LD (Product, BreadcrumbList,
  Organization, FAQ), hreflang no aplica.
- Legal: política de datos (Ley 1581), términos, cookies con consentimiento granular,
  derecho de retracto y reversión del pago (Ley 1480).

### 4.2 Fase 2 (post-lanzamiento, +6–8 semanas)

- BNPL Addi + Sistecrédito (si no entró en MVP).
- Programa de referidos con cupón bidireccional y tracking de atribución.
- Reseñas con foto, votos de utilidad, preguntas y respuestas.
- Bundles/"comprados juntos" con descuento automático y "frecuentemente comprados".
- Automatizaciones WhatsApp (carrito abandonado, confirmación, entrega) con plantillas
  aprobadas por Meta.
- Blog/contenido con CMS (editorial SEO), landings de campaña.
- A/B testing de PDP y checkout (feature flags + experimentación).
- Recuperación de carrito multicanal y cupones dinámicos.
- Dashboard de negocio (Metabase) y alertas de anomalías.

### 4.3 Fase 3 (evolución, +8–12 semanas)

- PWA instalable con push web y modo offline de catálogo.
- Personalización (recomendaciones por historial/segmento, "tu rutina").
- Suscripciones de producto (recompra programada).
- Lealtad por puntos y niveles.
- App nativa si los datos la justifican (>50% de recurrencia móvil).
- Expansión a marketplace o segunda marca (multi-tenant lógico).

### 4.4 Qué NO haremos en MVP y por qué (explícito)

| Excluido del MVP | Razón |
|---|---|
| BNPL directo (Addi/Sistecrédito) | Requiere contrato, homologación y conciliación propia; el BNPL nativo de Wompi sí entra en MVP sin costo de integración |
| Reseñas con foto | Moderación de imágenes y storage extra; se lanza con reseñas de texto verificadas |
| Multi-bodega avanzada (routing por proximidad) | MVP usa prioridad fija por bodega; el routing inteligente es Fase 2 |
| Cupones apilables complejos | Alto riesgo de margen y bugs; MVP permite 1 cupón + promociones automáticas no acumulables |
| Devoluciones self-service | MVP: solicitud por formulario/WhatsApp con aprobación manual |
| Integración contable completa | MVP: factura DIAN + export CSV; integración ERP en Fase 2 |

---

## 5. Requerimientos

### 5.1 Funcionales (resumen por dominio)

| Dominio | Requerimiento |
|---|---|
| Catálogo | Jerarquía de 2 niveles, marcas, atributos filtrables, variantes, combos, badges (Nuevo, -%, Bestseller) |
| Búsqueda | Autocompletado, tolerancia a errores, sinónimos, facetas, orden por relevancia/precio/rating |
| Carrito | Persistente para invitados y usuarios, merge al iniciar sesión, validación de stock, cupones |
| Checkout | Una página, resumen sticky, direcciones, envío calculado, múltiples métodos de pago |
| Pedidos | Estados, historial, cancelación, devolución, tracking público por número+email |
| Pagos | Tarjeta, PSE, Nequi, Daviplata, efectivo, contraentrega, BNPL nativo de Wompi; webhooks idempotentes; reembolsos |
| Facturación | Factura electrónica DIAN automática post-pago, nota crédito en reembolsos |
| Cuenta | Registro/login (email + Google), direcciones, pedidos, wishlist, reseñas, datos |
| Marketing | Cupones, promociones, referidos, newsletter con consentimiento, carrito abandonado |
| Admin | CRUD catálogo, inventario, pedidos, cupones, reseñas, roles, auditoría, exportes |
| Contenido | Blog, páginas legales, FAQ, banners administrables |
| Notificaciones | Email transaccional + WhatsApp para hitos de pedido |

### 5.2 No funcionales

- **Rendimiento:** presupuesto por página (ver §6.7). ISR/PPR para catálogo, streaming con
  Suspense, cero JS de terceros bloqueante.
- **Accesibilidad:** WCAG 2.2 AA; foco visible; navegación por teclado en menú, filtros y
  checkout; `aria-live` para cambios de carrito; `prefers-reduced-motion` respetado en todas
  las animaciones (CSS-first).
- **Privacidad:** Ley 1581 de 2012 y Decreto 1377 de 2013; consentimiento granular y
  revocable; minimización de datos; retención definida; derecho de acceso/rectificación/
  supresión; registro nacional de bases de datos (RNBD) cuando aplique.
- **Seguridad:** OWASP ASVS nivel 2; SAQ-A en pagos (nunca tocamos PAN); rate limiting;
  CSP estricta; secretos en gestor; auditoría de acciones administrativas.
- **Disponibilidad:** 99,9% objetivo; degradación elegante (si Meilisearch cae, búsqueda
  fallback a Postgres FTS; si el proveedor de pagos cae, se ofrece método alterno).
- **Escalabilidad:** 50k sesiones/mes y 1.000 pedidos/mes sin cambios de arquitectura.
- **Mantenibilidad:** TypeScript strict, capas explícitas (dominio/aplicación/infra),
  tests, migraciones versionadas, Conventional Commits.
- **Compatibilidad:** últimos 2 versiones de Chrome/Safari/Firefox/Edge + Safari iOS 16+.

### 5.3 Restricciones legales y regulatorias (Colombia)

| Norma | Implicación técnica |
|---|---|
| Ley 1581/2012 + Decreto 1377/2013 | Consentimiento informado, aviso de privacidad, gestión de revocatoria, RNBD |
| Ley 1480/2011 (Estatuto del Consumidor) | Precio total con IVA, información de entrega, **derecho de retracto (5 días hábiles)** en ventas a distancia, reversión del pago |
| Facturación electrónica DIAN | Factura de venta electrónica (UBL 2.1, CUFE), numeración autorizada, notas crédito, contingencia |
| Decisión Andina 516 / INVIMA | Etiquetado y registro sanitario de cosméticos; el catálogo debe portar datos de registro cuando aplique |
| Ley 527/1999 | Validez de mensajes de datos y firma electrónica |
| Protección al consumidor en precios | No mostrar precios "desde" engañosos; descuentos con precio anterior verificable |

---

## 6. Arquitectura propuesta

### 6.1 Vista general

Monolito modular en **un solo repositorio** (pnpm workspace) con dos procesos desplegables:
`web` (Next.js, storefront + admin + API interna) y `worker` (jobs asíncronos). La lógica de
dominio vive en `packages/core` y es compartida, de modo que web y worker no duplican reglas.
**No hay microservicios en el MVP**: 300–800 SKUs y 1.000 pedidos/mes no los justifican, y su
costo operativo (observabilidad distribuida, consistencia, despliegues) superaría el beneficio.

```
┌────────────────────────────── CLIENTES ──────────────────────────────┐
│  Navegador móvil/desktop (70%+ móvil) · PWA (F2) · Links WhatsApp    │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ HTTPS
                 ┌─────────────────▼──────────────────┐
                 │  Cloudflare                        │
                 │  DNS · CDN · WAF · Bot mgmt · R2   │
                 └─────────────────┬──────────────────┘
                                   │
   ┌───────────────────────────────▼──────────────────────────────────┐
   │  apps/web — Next.js 15 (App Router, RSC, ISR/PPR, Server Actions)│
   │  Storefront  ·  Admin  ·  Route Handlers /api/v1  ·  Auth        │
   └──┬──────────────┬───────────────┬───────────────┬───────────────┘
      │              │               │               │
┌─────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐ ┌──────▼──────────┐
│ PostgreSQL │ │   Redis    │ │ Meilisearch │ │  Cloudflare R2  │
│  (Neon)    │ │ caché/cola │ │  búsqueda   │ │ media + CDN     │
│  fuente    │ │ sesiones   │ │  facetas    │ │ derivados AVIF  │
│  de verdad │ │ idempot.   │ │  sinónimos  │ │ /WebP           │
└─────┬──────┘ └─────┬──────┘ └──────┬──────┘ └─────────────────┘
      │              │               │
      │       ┌──────▼───────┐       │
      │       │ apps/worker  │───────┘
      │       │ BullMQ       │
      │       │ jobs/outbox  │
      │       └──────┬───────┘
      │              │
┌─────▼──────────────▼───────────────────────────────────────────────┐
│  INTEGRACIONES EXTERNAS                                            │
│  Wompi (tarjeta/PSE/Nequi) · ePayco (plan B) · Addi/Sistecrédito   │
│  Facturación DIAN (proveedor tecnológico) · Agregador transportadoras│
│  Resend (email) · WhatsApp Cloud API · GA4/GTM · Sentry            │
└────────────────────────────────────────────────────────────────────┘
```

### 6.2 Componentes y responsabilidades

| Componente | Responsabilidad | Tecnología |
|---|---|---|
| `apps/web` | Render del storefront, admin, BFF interno, webhooks entrantes | Next.js 15 (Node runtime en rutas con Prisma) |
| `packages/core` | Dominio: catálogo, carrito, pedidos, pagos, precios, inventario, cupones | TypeScript strict, Prisma Client |
| `packages/ui` | Design system y componentes accesibles | React 19 + Tailwind v4 + Radix primitives |
| `apps/worker` | Jobs: indexación, imágenes, emails, facturas, guías, conciliación, carrito abandonado | Node 22 + BullMQ |
| PostgreSQL | Fuente de verdad transaccional | Neon (Postgres 16+) |
| Redis | Caché, rate limit, sesiones de carrito anónimo, colas, claves de idempotencia | Upstash o Redis gestionado |
| Meilisearch | Índice de búsqueda con facetas y tolerancia a errores | Meilisearch Cloud o self-host |
| R2 + Cloudflare | Objetos de media y CDN de imágenes | Cloudflare R2 + Image Resizing |
| Proveedor DIAN | Emisión de factura/nota crédito | API del proveedor (Factus/Alegra/Siigo/Cadena — *elegir*) |
| Agregador logístico | Cotización, guía, tracking | Envia.com / MiPaquete (*verificar*) |

### 6.3 Flujo de lectura (catálogo)

```
Usuario → Cloudflare (cache HTML/assets)
        → Next.js: ruta ISR (Home/PLP/PDP)
           ├─ hit de caché de ruta → respuesta < 100 ms
           └─ miss → Postgres (producto/facetas) o Redis (facetas cacheadas)
        → HTML streamed con Suspense (filtros y recomendaciones en paralelo)
```

- **Home y PDP:** ISR con `revalidateTag` por entidad (`product:{id}`, `plp:{categoryId}`).
- **PLP:** render en servidor de la primera página de resultados; filtros como segmentos de
  URL (`/cabello/tratamiento?marca=loreal&precio=50000-120000`) para SEO e indexabilidad.
- **Invalidación:** evento de dominio → `outbox_events` → worker → `revalidateTag` + borrado
  de claves Redis versionadas (`v:{n}:...`). Nunca invalidación "a mano" desde el admin sin
  evento.

### 6.4 Flujo de escritura (carrito y pedido)

```
[1] Add to cart (Server Action)
    → valida variante activa y stock disponible
    → upsert cart_item (carrito por cookie firmada o userId)
    → revalidateTag('cart:{id}') y devuelve estado optimista
[2] Checkout init (POST /api/v1/orders, Idempotency-Key)
    → revalida precios y stock
    → crea Order PENDING_PAYMENT + stock_reservations (TTL 30 min)
    → congela snapshots (precio, nombre, imagen, dirección, cliente)
[3] Pago
    → crea Payment PENDING + intención en proveedor
    → redirige a página hospedada del proveedor (SAQ-A)
[4] Webhook del proveedor
    → verifica firma → guarda webhook_event (unique provider+event_id)
    → encola procesamiento idempotente
    → transición de estado (máquina de estados, ver §8)
[5] Post-pago (outbox)
    → confirma reserva, descuenta inventario, emite factura DIAN,
      envía email/WhatsApp, crea borrador de guía, actualiza índice de búsqueda
```

### 6.5 Consistencia e idempotencia

- **Outbox transaccional** para todo evento de dominio (pedido pagado, stock cambiado,
  producto publicado). El worker consume con `jobId = outbox.id`.
- **Idempotency-Key** obligatoria en `POST /orders`, `POST /payments`, `POST /refunds`;
  tabla `idempotency_keys` con hash del request y respuesta almacenada (TTL 24 h).
- **Webhooks:** `unique(provider, event_id)`; si llega duplicado se responde `200` sin
  reprocesar. Estados monotónicos: un evento viejo no puede retroceder un pedido pagado.
- **Inventario:** `UPDATE inventory SET reserved = reserved + $1 WHERE variant_id = $2 AND
  warehouse_id = $3 AND on_hand - reserved >= $1` (actualización condicional atómica) +
  `CHECK (on_hand >= 0 AND reserved >= 0 AND reserved <= on_hand)`.

### 6.6 Búsqueda

Índice `products` en Meilisearch con documentos que incluyen variantes anidadas, marca,
categorías (slugs y nombres), atributos filtrables (`hair_type`, `concern`, `finish`,
`volume_ml`), `price_min`, `in_stock`, `rating_avg`, `bestseller_rank`.

- **Filtros facetados:** marca, categoría, precio, tipo de cabello, preocupación, tono,
  disponibilidad, rating, tamaño. Distribuciones de faceta servidas por Meilisearch.
- **Sinónimos en español:** `acondicionador ↔ crema de enjuague`, `champú ↔ shampoo`,
  `serum ↔ sérum`, `protector térmico ↔ termoprotector`.
- **Tolerancia a errores:** `minWordSizeForTypos` 4/8; nunca "sin resultados" sin alternativas
  (sugerencias + productos populares de la categoría).
- **Autocompletado:** endpoint `/api/v1/search/suggest` con debounce 150 ms, navegación por
  teclado, búsquedas recientes en `localStorage`, consultas populares desde Redis.
- **Fallback:** si Meilisearch no responde en 300 ms → Postgres FTS (`tsvector` en español +
  `pg_trgm` para similitud). Degradación visible solo en features avanzadas.

### 6.7 Presupuesto de rendimiento (por plantilla)

| Plantilla | JS (gzip) | Imágenes | Estrategia |
|---|---|---|---|
| Home | ≤ 150 KB | AVIF, `priority` solo en hero | ISR 300 s + tags; carruseles CSS scroll-snap |
| PLP | ≤ 160 KB | grid con `sizes` correctos, lazy | SSR primera página + navegación cliente |
| PDP | ≤ 170 KB | galería con `srcset`, LCP precargado | ISR 600 s + revalidación por stock |
| Carrito/Checkout | ≤ 190 KB | sin imágenes pesadas | dinámico, sin caché de ruta |

Reglas: fuentes self-hosted con `next/font` y `font-display: swap` (máx. 2 familias, 4 pesos),
sin librerías de animación, sin jQuery, GTM cargado **después del consentimiento** y en
`requestIdleCallback`, imágenes con dimensiones explícitas para CLS 0.

### 6.8 Contratos internos (convenciones)

- API REST interna versionada `/api/v1/*`; errores con envelope
  `{ error: { code, message, details? }, requestId }`.
- Paginación por cursor (`cursor`, `limit`), nunca offset profundo.
- Fechas ISO-8601 UTC; montos enteros en COP; IDs UUID v7 (ordenables por tiempo).
- Todo endpoint de escritura exige `Idempotency-Key` o es naturalmente idempotente.
- Server Actions solo para mutaciones del storefront autenticadas por sesión/cookie.

---

## 7. Stack tecnológico

### 7.1 Stack elegido (alineado a Digitaldevs)

| Capa | Elección | Versión | Justificación |
|---|---|---|---|
| Framework web | **Next.js (App Router)** | 15.x | RSC reduce JS en móvil; ISR/PPR para catálogo; Server Actions simplifican mutaciones; ecosistema Vercel |
| UI | **React** | 19.x | Requisito del stack; `useOptimistic`/`useActionState` para carrito |
| Lenguaje | **TypeScript** | 5.x, `strict` | Correctitud en dominio transaccional; sin `any` salvo frontera justificada |
| Estilos | **Tailwind CSS** | 4.x | Tokens vía `@theme`, CSS-first, cero runtime, bundle mínimo |
| Componentes | **Radix primitives** (headless) | última | Accesibilidad (focus trap, ARIA) sin imponer diseño |
| Backend | **Route Handlers + `packages/core`** | — | Monolito modular; sin capa Express extra en MVP |
| Worker | **Node 22 + BullMQ** | — | Jobs con reintentos, backoff y DLQ sobre Redis |
| ORM/DB | **Prisma + PostgreSQL 16** | — | Tipado end-to-end, migraciones versionadas, transacciones |
| Caché/colas | **Redis** | 7.x | Rate limit, sesiones, idempotencia, colas, facetas |
| Búsqueda | **Meilisearch** | 1.x | Typos, sinónimos, facetas, latencia sub-50 ms, costo bajo |
| Media | **Cloudflare R2 + Image Resizing** | — | Egress sin costo, CDN global, AVIF/WebP |
| Hosting | **Vercel (web) + Fly.io/Railway (worker)** | — | Preview deploys, rollback instantáneo; worker junto a Redis |
| CDN/WAF | **Cloudflare** | — | WAF, bot management, caché de assets, protección de origen |
| Tests | **Vitest + Playwright + Testing Library** | — | Unitario rápido, E2E real en móvil emulado |
| CI/CD | **GitHub Actions + Docker** | — | Pipeline estándar Digitaldevs; imagen del worker reproducible |
| Observabilidad | **Sentry + Vercel Analytics + logs estructurados (pino)** | — | Errores, trazas, Core Web Vitals reales |
| Email | **Resend** | — | API simple, plantillas React Email, buena entregabilidad |
| Mensajería | **WhatsApp Cloud API (Meta)** | — | Canal dominante en Colombia para confirmaciones |
| Analytics | **GA4 + GTM + Consent Mode v2** | — | Medición con cumplimiento de consentimiento |

### 7.2 Decisiones y descartes

#### ¿Por qué no Shopify?

- **Pros:** time-to-market (4–6 semanas), checkout maduro, apps de todo.
- **Contras:** costo mensual + comisión por transacción si no se usa Shopify Payments
  (no disponible plenamente en Colombia) + apps de pago; checkout **no personalizable** en
  planes no-Plus; lógica DIAN/transportadoras vía apps de terceros; datos y SEO condicionados
  por la plataforma; vendor lock-in en checkout y precios.
- **Veredicto:** rechazado. El requisito de "UI/UX igual o mejor" con checkout propio y
  control de márgenes no se sostiene sin Shopify Plus (costo alto, *verificar vigente*).

#### ¿Por qué no VTEX (la referencia)?

- **Pros:** robusto, OMS completo, marketplace, soporte enterprise.
- **Contras:** costo de plataforma + implementación + agencia; el modelo de IO impone su
  frontend y su ecosistema; la higiene SEO y la UX observadas en la referencia muestran que
  "tener VTEX" no garantiza el resultado; complejidad operativa desproporcionada para 800 SKUs.
- **Veredicto:** rechazado como plataforma; se toma como **benchmark de experiencia**, no como
  decisión técnica.

#### ¿Por qué no Medusa?

- **Pros:** open source, Node/TS, headless, sin licencia.
- **Contras:** el equipo igualmente debe construir storefront, admin y todas las integraciones
  locales (DIAN, PSE, contraentrega); su modelo de datos no cubre multi-bodega ni facturación
  colombiana; se suma una capa de abstracción a depurar sin ahorrar semanas reales.
- **Veredicto:** rechazado. Aporta poco sobre un monolito propio y añade dependencia de
  versiones y curva de aprendizaje.

#### ¿Por qué no WooCommerce?

- **Pros:** costo bajo, ecosistema enorme, hosting simple.
- **Contras:** rendimiento móvil y Core Web Vitals frágiles; seguridad dependiente de plugins;
  personalización de checkout vía plugins; deuda técnica y mantenimiento perpetuo; difícil de
  testear y de integrar con DIAN/pasarelas sin plugins de terceros.
- **Veredicto:** rechazado por rendimiento, seguridad y mantenibilidad.

#### Otras decisiones

| Decisión | Alternativas | Por qué gana la elegida |
|---|---|---|
| Monolito modular | Microservicios | Menos latencia, menos ops, transacciones ACID simples; se puede extraer un servicio luego |
| PostgreSQL | MongoDB | Precio/inventario/pedidos son relacionales y requieren integridad referencial y transacciones |
| Prisma | Drizzle / TypeORM | Migraciones claras, tipos generados, ecosistema maduro; Drizzle queda como alternativa si el rendimiento de queries críticas lo exige |
| Meilisearch | Typesense / Algolia / pg_trgm | Typos + sinónimos + facetas con costo bajo y self-host posible; Algolia es mejor pero caro a escala; pg_trgm se queda como fallback |
| Redis gestionado | Solo Postgres | Rate limiting, colas y caché de facetas necesitan latencia sub-ms |
| R2 | S3 | Egress sin costo y CDN Cloudflare integrado |
| Vercel | AWS/ECS propio | Preview deploys, ISR gestionado, rollback inmediato; menor carga de DevOps en MVP |

> **Nota de stack:** el AGENTS.md exige evaluar versiones mayores estables antes de iniciar.
> Next.js 15 / React 19 / Tailwind 4 son las versiones objetivo; si al iniciar existe una
> mayor estable (p. ej. Next 16), `forge-architect` hará la evaluación de adopción con
> criterios de estabilidad de ecosistema y se documentará como enmienda a este doc.

---
## 8. Pagos para Colombia

### 8.1 Estrategia

**Recomendación principal: Wompi (Bancolombia)** como pasarela agregadora primaria, con
**ePayco como plan B** y **Mercado Pago como tercera opción** para métodos alternos o
campañas. **BNPL (Addi y Sistecrédito) por integración directa**, porque son productos con
contrato, homologación y liquidación propios y las pasarelas no siempre los agregan
(*verificar disponibilidad vigente con cada proveedor*).

**Decisión de alcance:** el MVP **sí lleva BNPL sin contrato adicional**, usando el BNPL
nativo de Wompi (*Compra y Paga Después* para clientes Bancolombia y *SU+Pay* de 1 a 12
cuotas). La integración directa con **Addi y Sistecrédito** se difiere a Fase 2 porque exige
contrato, homologación y conciliación propia, y no bloquea la salida.

**Contraentrega** no pasa por pasarela: se modela como pedido con pago pendiente en efectivo,
con reglas de riesgo propias y conciliación contra la transportadora.

### 8.2 Por qué Wompi

| Criterio | Evaluación |
|---|---|
| Cobertura de métodos | Tarjeta crédito/débito nacional e internacional, PSE, Nequi, Daviplata, Botón Bancolombia, SU+Pay, efectivo en corresponsales, QR y BNPL nativo (*verificar*) |
| Confianza de marca | Respaldo Bancolombia; reduce fricción en checkout colombiano |
| DX / documentación | Sandbox, widget/checkout hospedado, webhooks firmados, SDKs |
| Costo | Sin mensualidad; 2,65% + COP 700 + IVA por transacción exitosa; QR al 1% (*verificar vigente*) |
| Conciliación | API de transacciones y reportes; buen soporte de estados |
| PCI | Checkout hospedado → **SAQ-A** sin tocar datos de tarjeta |
| Riesgo de dependencia | Medio; mitigado con plan B y capa anticorrupción de pagos |

### 8.3 Comparativa de pasarelas (tarifas publicadas — consulta oct-2026, **verificar vigente**)

| Proveedor | Tarjeta | PSE / billeteras | Efectivo | BNPL nativo | Desembolso | Notas |
|---|---|---|---|---|---|---|
| **Wompi** (Bancolombia) | 2,65% + COP 700 + IVA | Igual tarifa (PSE, Nequi, Daviplata, Botón Bancolombia, SU+Pay) | Sí (corresponsales) | **Sí** (*Compra y Paga Después*, SU+Pay 1–12 cuotas) | Siguiente día hábil | QR al 1%; tarjetas internacionales sin recargo; sin mensualidad |
| **ePayco** (Davivienda) | 2,64% + COP 690 + IVA (cuenta Davivienda, promo por volumen) · 2,68% + COP 900 estándar · 3,29% + COP 700 + IVA (otro banco) | Igual tarifa | Sí (Efecty y otros) | No | 24–72 h | PSE < COP 60.000: COP 2.000 + IVA fijo; 4 retiros gratis/mes con Davivienda, luego COP 6.500 + IVA |
| **Bold** | 2,99% + COP 900 + IVA (Visa/MC) · 3,29% + COP 900 (otras) | 2,89% + COP 900 + IVA | No | No | Día siguiente antes 10:00 en Cuenta Bold | A otro banco o instantáneo: 3,59% + COP 900; +1% tarjetas internacionales; tarifa para ventas ≤ COP 10 M/mes |
| **Mercado Pago** | 3,29% + COP 800 + IVA (inmediato) · 2,99% (7 días) · 2,79% (14 días) | Igual tarifa (PSE) | Sí (Efecty) | No | Inmediato / 7 / 14 días | Fuerte para cobros por link y redes; menos "local" en PSE |
| **PayU** (Rapyd) | 3,29% + COP 300 + IVA | Igual, con mínimos (PSE COP 450, Nequi COP 570) | Pago referenciado (mín. COP 9.900) | No publicado | 3 días hábiles | 3 retiros gratis/mes, luego COP 6.500 + IVA |
| **Credibanco Chebre** | 2,50% + COP 800 | — | — | No | Abonos diarios | Requiere red de adquirencia; útil si el negocio ya es cliente Credibanco |
| **Addi** (BNPL) | — | — | — | **Sí** | Según contrato | Aprobación inmediata; comisión merchant negociada (no publicada) |
| **Sistecrédito** (BNPL) | — | — | — | **Sí** | Según contrato | Base de crédito fuerte; integración y conciliación propias |

**Costo real de una venta de COP 190.000 (tarjeta, con IVA sobre la comisión):**

| Proveedor | Comisión | % efectivo |
|---|---|---|
| Wompi | COP 6.825 | 3,59% |
| ePayco (Davivienda) | COP 6.790 | 3,57% |
| Bold (Cuenta Bold) | COP 7.831 | 4,12% |
| Mercado Pago (inmediato) | COP 8.391 | 4,42% |
| PayU | COP 7.796 | 4,10% |

> **Fórmula aplicada:** `(tarifa% × COP 190.000 + cargo fijo) × 1,19`. Tarifas de lista
> publicadas por cada proveedor (consulta octubre 2026) y **antes de retenciones**. Cambian
> con frecuencia y hay tarifas negociadas por volumen: **validar por escrito antes de firmar**.
> No se usa ningún valor como compromiso contractual. Contraste principal: página oficial de
> planes y tarifas de Wompi; el resto, tarifas publicadas por cada pasarela.

### 8.4 Matriz de decisión (ponderada)

| Criterio | Peso | Wompi | ePayco | Mercado Pago | PayU |
|---|---|---|---|---|---|
| Cobertura de métodos | 30% | 10 | 9 | 7 | 9 |
| DX e integración | 20% | 9 | 7 | 8 | 7 |
| Costo total | 20% | 8 | 7 | 6 | 7 |
| Confiabilidad/soporte | 15% | 9 | 7 | 8 | 9 |
| Conciliación/reportes | 15% | 8 | 8 | 8 | 9 |
| **Total** | 100% | **8,6** | **7,9** | **7,3** | **8,2** |

Gana Wompi por equilibrio: cubre todos los métodos del MVP (tarjeta, PSE, Nequi, Daviplata,
efectivo, QR y BNPL nativo) con una sola integración. PayU queda como opción si el volumen
justifica mejores tarifas negociadas; ePayco se integra como **plan B** desde el día uno a
nivel de capa de pagos (no se activa en UI hasta necesitarlo).

### 8.5 Arquitectura de pagos (puerto/adaptador)

```
packages/core/payments/
├── payment-provider.port.ts      // interfaz: createIntent, getStatus, refund, verifyWebhook
├── providers/
│   ├── wompi.provider.ts         // implementación primaria
│   ├── epayco.provider.ts        // plan B
│   ├── addi.provider.ts          // BNPL (Fase 2)
│   ├── sistecredito.provider.ts  // BNPL (Fase 2)
│   └── cash-on-delivery.provider.ts
└── payment-state-machine.ts       // transiciones permitidas y efectos
```

La interfaz común evita que el dominio conozca a Wompi. Cambiar de proveedor = nuevo adaptador
+ configuración, sin tocar checkout ni pedidos. Esto cumple la regla de "haz fácil el cambio de
opinión".

### 8.6 Flujo de checkout (secuencia)

```
Cliente          Web (Next.js)        Core/DB            Wompi           Worker
   │                  │                  │                 │               │
   │─ Datos envío ───▶│                  │                 │               │
   │                  │─ quote envío ───▶│                 │               │
   │◀─ costo + ETA ───│                  │                 │               │
   │─ Pagar ─────────▶│─ POST /orders ──▶│                 │               │
   │                  │  (Idempotency-K) │─ Order PENDING │               │
   │                  │                  │─ reservations   │               │
   │                  │◀─ orderId ───────│                 │               │
   │                  │─ createIntent ──────────────────▶ │               │
   │◀─ redirect ──────│                  │                 │               │
   │─ Paga en Wompi ──────────────────────────────────────▶│               │
   │◀─ redirect back ──────────────────────────────────────│               │
   │                  │◀──────────── webhook ─────────────│               │
   │                  │─ verify HMAC ───▶│                 │               │
   │                  │                  │─ webhook_event  │               │
   │                  │                  │─ enqueue ──────────────────────▶│
   │                  │                  │                 │   transición  │
   │                  │                  │◀─ PAID + stock ─────────────────│
   │                  │                  │   factura DIAN, email, guía    │
   │◀─ confirmación ──│                  │                 │               │
```

### 8.7 Máquina de estados de pago

```
        createIntent
             │
             ▼
        ┌─────────┐   webhook APPROVED   ┌──────┐
        │ PENDING │─────────────────────▶│ PAID │
        └────┬────┘                      └──┬───┘
             │ DECLINED / ERROR             │ refund total
             ▼                              ▼
        ┌────────┐                     ┌──────────┐
        │ FAILED │                     │ REFUNDED │
        └────────┘                     └──────────┘
             │ timeout 30 min               │ refund parcial
             ▼                              ▼
        ┌────────┐                ┌────────────────────┐
        │ VOIDED │                │ PARTIALLY_REFUNDED │
        └────────┘                └────────────────────┘
                                        │ contracargo
                                        ▼
                                  ┌────────────┐
                                  │ CHARGEBACK │
                                  └────────────┘
```

Reglas:
- Un pago `PAID` **no** puede volver a `PENDING` (evento viejo ignorado y registrado).
- `FAILED` permite reintento con **nuevo** `Payment` (nunca reutilizar el mismo intent).
- Reembolso parcial permitido hasta el monto pagado; el total no puede excederlo.
- Cada transición genera un `PaymentTransaction` y un `OutboxEvent`.

### 8.8 Tokenización y PCI-DSS

- **Nunca** se reciben, procesan ni almacenan PAN, CVV ni pista de banda. El formulario de
  tarjeta vive en el dominio del proveedor (redirect) o en su iframe tokenizado.
- Con **redirect completo** el alcance es **SAQ-A**. Si se usa widget embebido en iframe,
  el alcance puede ser **SAQ-A-EP**: se decide por asesoría del proveedor y se documenta.
- Se almacenan únicamente: últimos 4 dígitos, franquicia, código de autorización y
  `provider_payment_id`.
- 3-D Secure se delega en el proveedor; se registra el resultado.
- Secretos en gestor (Vercel/Fly secrets + rotación); nunca en el repo ni en logs.
- Webhooks: verificación HMAC con secreto por entorno + ventana de tolerancia temporal
  (anti-replay) + comparación de monto/moneda antes de aceptar.

### 8.9 Idempotencia y fallos

| Escenario | Manejo |
|---|---|
| Webhook duplicado | `unique(provider, event_id)`; se responde 200 y se ignora |
| Webhooks fuera de orden | Se aplica solo si la transición es válida; si no, se registra como `IGNORED` |
| Webhook perdido | Job de reconciliación cada 10 min consulta transacciones `PENDING` > 5 min contra la API del proveedor |
| Timeout del cliente al pagar | La orden sigue `PENDING_PAYMENT`; el webhook manda. **Una sola ventana:** reserva y orden expiran juntas a los **30 min** → `CANCELLED` + liberación de stock |
| Webhook aprobado después de expirar (pago tardío) | Se acepta el dinero (no se puede rechazar), la orden pasa a `PAID_NEEDS_REVIEW`, se intenta re-reservar; si no hay stock → reembolso automático + cupón de disculpa y alerta a operación. Nunca se confirma entrega sin stock asignado |
| Pago aprobado y stock agotado en la carrera de compra | Se marca incidencia, se prioriza reabastecimiento o reembolso automático + cupón de disculpa (regla configurable) |
| Doble clic en "Pagar" | Botón bloqueado + `Idempotency-Key` + verificación de orden ya pagada |
| Proveedor caído | Se muestra método alterno (plan B activable por flag) y se registra incidente |
| Monto distinto al de la orden | Se rechaza el webhook, se alerta a `forge-sentinel`/operación |
| Reembolso | API del proveedor + `PaymentTransaction REFUND` + nota crédito DIAN + reposición opcional de stock |

### 8.10 Conciliación

1. Job diario descarga el reporte de liquidación del proveedor (API o archivo).
2. Se cruza por `provider_payment_id` y monto contra `payments`/`payment_transactions`.
3. Diferencias → tabla de incidencias + alerta en Slack/email con el detalle.
4. Cierre mensual: total recaudado por método vs. abonos bancarios; export a contabilidad.
5. Contraentrega: conciliación contra el recaudo reportado por la transportadora (archivo
   semanal), con provisión por novedades y devoluciones.

### 8.11 Contraentrega (COD)

- Disponible solo con reglas: monto máximo (p. ej. COP 300.000 — *definir con cliente*),
  zonas habilitadas, teléfono verificado (OTP por WhatsApp/SMS en primer pedido).
- Pedido nace `PENDING_PAYMENT` con `method = CASH_ON_DELIVERY`; pasa a `PAID` cuando la
  transportadora confirma recaudo (webhook o conciliación).
- Cancelación en ruta genera costo logístico: se registra en `shipments` y se factura según
  política.
- Riesgo de fraude: límite por cliente/mes, blocklist de direcciones, scoring simple
  (antigüedad de cuenta, historial, consistencia de datos).

### 8.12 Máquina de estados del pedido

El pago y el pedido son dos máquinas separadas que se sincronizan por eventos. Un pedido
**nunca** se confirma por la redirección del navegador: solo por webhook verificado o
conciliación.

```
                  POST /orders (reserva 30 min)
                            │
                            ▼
                     ┌──────────────┐  webhook APPROVED   ┌────────┐
                     │PENDING_PAYMENT│────────────────────▶│  PAID  │
                     └──┬────────┬───┘                     └───┬────┘
        expira 30 min   │        │ webhook DECLINED            │ picking
                        │        ▼                             ▼
                        │   ┌─────────┐                  ┌──────────┐
                        │   │ FAILED  │─ reintento ──┐   │PREPARING │
                        │   └─────────┘◀──────────────┘   └────┬─────┘
                        ▼                                      │ packing
                   ┌───────────┐                               ▼
                   │ CANCELLED │                          ┌────────┐
                   └───────────┘                          │ PACKED │
                                                          └───┬────┘
                                     guía generada            │
                                                              ▼
                                                         ┌─────────┐
                                                         │ SHIPPED │
                                                         └────┬────┘
                                       entrega confirmada     │
                                                              ▼
                                                        ┌───────────┐
                                                        │ DELIVERED │
                                                        └─────┬─────┘
                                    solicitud de retracto     │
                                                              ▼
                                                     ┌──────────────────┐
                                                     │ RETURN_REQUESTED │
                                                     └────┬────────┬────┘
                                        aprobado          │        │ rechazado
                                                          ▼        ▼
                                                     ┌────────┐  (vuelve a DELIVERED)
                                                     │RETURNED│
                                                     └────┬───┘
                                        reembolso         │
                                                          ▼
                                                     ┌──────────┐
                                                     │ REFUNDED │
                                                     └──────────┘

  Pago tardío tras expirar → PAID_NEEDS_REVIEW (ver §8.9) → PAID o REFUNDED
```

| Transición | Disparador | Efectos obligatorios |
|---|---|---|
| `PENDING_PAYMENT → PAID` | Webhook `APPROVED` verificado | Confirma reserva, descuenta inventario, encola DIAN + email + WhatsApp + borrador de guía |
| `PENDING_PAYMENT → CANCELLED` | TTL 30 min o cancelación del cliente | Libera reserva, no emite factura |
| `PAID → PREPARING` | Operación toma el pedido | Notifica "en preparación" |
| `PREPARING → PACKED` | Picking completado | Genera guía y etiqueta |
| `PACKED → SHIPPED` | Transportadora confirma recogida | Email/WhatsApp con tracking |
| `SHIPPED → DELIVERED` | Webhook o conciliación de transportadora | Habilita reseña verificada y solicita retracto |
| `DELIVERED → RETURN_REQUESTED` | Cliente radica retracto (Ley 1480, 5 días hábiles) | Congela liquidación; abre caso |
| `RETURN_REQUESTED → RETURNED` | Recepción y verificación física | Repone stock si aplica |
| `RETURNED → REFUNDED` | Reembolso aprobado | Reverso en pasarela + nota crédito DIAN + email |
| Cualquiera → `CANCELLED` | Solo antes de `SHIPPED` y con regla de negocio | Reembolso si ya había pago |

Reglas: cada transición escribe `OrderStatusHistory` (actor, motivo, timestamp) y un
`OutboxEvent`. Estados terminales: `DELIVERED`, `REFUNDED`, `CANCELLED`. Un pedido pagado
**no** puede volver a `PENDING_PAYMENT`.

---

## 9. UI/UX

### 9.1 Principios de diseño

1. **Móvil primero, no móvil "adaptado".** El layout se diseña a 375 px y se expande.
2. **Una acción primaria por pantalla.** Un solo CTA dominante; el resto es secundario y visualmente subordinado.
3. **Descubrimiento por necesidad, no solo por marca.** "Se me cae el cabello", "tengo frizz",
   "piel sensible" son entradas de primer nivel.
4. **Transparencia radical.** Stock real, fecha estimada de entrega, costo de envío y política
   de retracto visibles antes de pagar.
5. **Velocidad como feature de diseño.** Sin carruseles automáticos pesados, sin modales
   innecesarios, sin animaciones que bloqueen.
6. **Accesibilidad por defecto.** Contraste AA, foco visible, targets ≥44 px, `prefers-reduced-motion`.

### 9.2 Sistema de diseño (tokens)

| Token | Valor | Uso |
|---|---|---|
| `--color-ink` | `#1C1418` | Texto principal |
| `--color-primary` | `#7A1F3D` | CTA, links, marca (contraste AA sobre blanco) |
| `--color-primary-hover` | `#5E1730` | Hover/active |
| `--color-accent` | `#B8895A` | Detalles premium, badges |
| `--color-bg` | `#FDFBF9` | Fondo cálido |
| `--color-surface` | `#FFFFFF` | Tarjetas, inputs |
| `--color-muted` | `#6B5F63` | Texto secundario |
| `--color-border` | `#E8E1DD` | Bordes y divisores |
| `--color-success` | `#1E7A4C` | Stock disponible, pago aprobado |
| `--color-warning` | `#B26B00` | Stock bajo, pendiente |
| `--color-danger` | `#B3261E` | Error, agotado |
| `--font-display` | `Fraunces` (variable, 600) | Titulares editoriales |
| `--font-sans` | `Inter` (400/500/600) | UI y cuerpo |
| `--text-xs` … `--text-4xl` | 12 / 14 / 16 / 18 / 20 / 24 / 30 / 38 / 48 px | Escala tipográfica |
| `--space-1` … `--space-24` | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px | Espaciado (base 4) |
| `--radius-sm/md/lg/full` | 4 / 8 / 16 / 999 px | Radios |
| `--shadow-sm/md/lg` | sombras cálidas de baja opacidad | Elevación discreta |
| `--duration-fast/base/slow` | 120 / 200 / 320 ms | Motion |
| `--ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | Entradas |
| `--z-header/drawer/modal/toast` | 40 / 60 / 80 / 90 | Capas |

Configuración mínima (Tailwind v4, CSS-first):

```css
@import "tailwindcss";

@theme {
  --color-ink: #1C1418;
  --color-primary: #7A1F3D;
  --color-primary-hover: #5E1730;
  --color-accent: #B8895A;
  --color-bg: #FDFBF9;
  --color-surface: #FFFFFF;
  --color-muted: #6B5F63;
  --color-border: #E8E1DD;
  --font-display: "Fraunces", serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --radius-lg: 16px;
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 9.3 Grid y layout

- **Móvil (<640 px):** 4 columnas, gutter 16 px, margen 16 px.
- **Tablet (640–1024 px):** 8 columnas, gutter 24 px, margen 24 px.
- **Desktop (≥1024 px):** 12 columnas, gutter 24 px, contenedor máx. 1440 px, margen 32 px.
- **PLP:** rail de filtros fijo de 280 px en desktop; bottom-sheet en móvil.
- **PDP:** 7/5 (galería/info) en desktop; apilado con buy-box sticky en móvil.

### 9.4 Inventario de componentes

Header con mega-menú (Marcas + Categorías), buscador con overlay, botón bolsa con contador,
`ProductCard` (badge, rating, precio, quick-add), `VariantPicker` (swatches de tono y tamaño),
`FacetFilter` (checkbox, rango, chips activos), `QuantityStepper`, `StickyBuyBox`,
`CartDrawer`, `CheckoutSummary`, `AddressForm` (departamento/ciudad dependientes),
`PaymentMethodList`, `OrderTimeline`, `ReviewCard` con filtros, `ConsentBanner` granular,
`EmptyState`, `Skeleton` con dimensiones reservadas, `Toast` accesible.

### 9.5 Especificación pantalla por pantalla

#### 9.5.1 Home

- **Objetivo:** orientar en <5 s y llevar a categoría/producto.
- **Bloques:** hero LCP (imagen 21:9 desktop / 4:5 móvil, `priority` solo en esta), carrusel
  de marcas con scroll-snap (sin autoplay), "Compra por necesidad" (6 chips), "Los más
  vendidos" (4–8 cards con quick-add), banners de campaña, reseñas reales agregadas,
  newsletter con fecha de nacimiento y consentimiento, footer completo.
- **Móvil:** hero 4:5, chips en scroll horizontal, cards 2 columnas, quick-add visible
  siempre (no hover).
- **Aceptación:** LCP <2,5 s en 4G simulada; CLS 0; carrusel navegable por teclado.

#### 9.5.2 PLP (listado con filtros facetados)

- **Objetivo:** que el usuario encuentre por necesidad en ≤3 interacciones.
- **Elementos:** breadcrumb, H1 + contador, orden (relevancia, precio, novedad, rating),
  rail de facetas (marca, precio, necesidad, tipo de cabello, tono, disponibilidad, rating),
  chips de filtros activos con "limpiar todo", grid 2/3/4 columnas, quick-add, paginación
  "cargar más" con URL actualizable.
- **SEO:** cada combinación relevante es una URL limpia y canonicalizada; filtros no generan
  páginas infinitas indexables (solo las curadas: marca y categoría).
- **Estados:** vacío con sugerencias, carga con skeletons de altura fija, error con reintento.
- **Móvil:** filtros en bottom-sheet con "Aplicar (N)" sticky; orden en select nativo.

#### 9.5.3 PDP (producto)

- **Objetivo:** resolver dudas y convertir sin salir de la página.
- **Elementos:** breadcrumb, galería (1:1, thumbnails, zoom en desktop, swipe en móvil),
  marca, nombre, rating con link a reseñas, badges, precio con IVA y precio anterior tachado
  (solo si es real y verificable), selector de variantes (tamaño/tono con swatches y stock por
  variante), cantidad, **un solo CTA "Agregar a la bolsa"** sticky en móvil, wishlist,
  disponibilidad con ETA por ciudad, medios de pago aceptados, tabs (Detalles, Modo de uso,
  Ingredientes, Especificaciones), "Relacionados" (bundle "comprados juntos" en Fase 2), reseñas con filtros.
- **Reglas:** si una variante está agotada, se muestra deshabilitada con "avísame"; nunca se
  permite agregar sin stock.
- **Aceptación:** cambio de variante actualiza precio, imagen, stock y URL (`?variant=`) sin
  recargar; CTA único; LCP es la imagen principal.

#### 9.5.4 Buscador con autocompletado

- Overlay a pantalla completa en móvil, dropdown en desktop.
- Debounce 150 ms; resultados agrupados (Productos, Marcas, Categorías, Contenido).
- Navegación con flechas + Enter; `aria-activedescendant`.
- Búsquedas recientes (localStorage) y populares (Redis).
- Sin resultados: "Quizás quisiste decir…" + categorías sugeridas + productos top.

#### 9.5.5 Bolsa (cart drawer + página)

- Drawer lateral en desktop, bottom-sheet/full-screen en móvil.
- Ítems con imagen 64×64, nombre, variante, cantidad, precio, eliminar; subtotal;
  barra de progreso "te faltan $X para envío gratis"; CTA "Ir a pagar".
- Página `/bolsa` para carritos grandes, con cupón, nota de regalo y cross-sell.
- Persistencia: invitado por cookie firmada; merge al iniciar sesión (gana la cantidad mayor,
  nunca se duplica).

#### 9.5.6 Checkout (una página, resumen sticky)

- Pasos visuales: Contacto → Entrega → Pago (sin cambiar de URL; acordeón).
- Resumen sticky a la derecha (desktop) / colapsable arriba (móvil) con ítems, envío,
  descuentos y total.
- Direcciones con departamento → ciudad dependientes y validación de formato; opción
  "recoger en tienda" con selector de sede y horario.
- Métodos de pago con logos, comisión/condiciones claras y BNPL con simulador de cuotas.
- Campos mínimos; autocompletado nativo (`autocomplete="email"`, `cc-number` nunca en nuestro DOM).
- Manejo de errores inline, no en alertas; reintento sin perder datos.
- Aceptación: completar en <90 s en móvil con datos guardados; tasa de error de validación <5%.

#### 9.5.7 Confirmación

- Número de pedido, resumen, método de pago, ETA, dirección, botón "Seguir pedido" y
  "Descargar factura" (cuando DIAN la emita).
- Evento GA4 `purchase` con `transaction_id` (idempotente: no duplicar en refresh).
- Recordatorio de retracto y canales de soporte.

#### 9.5.8 Cuenta / Mis pedidos

- Login con email+password y Google; recuperación por email.
- Tabs: Pedidos, Direcciones, Wishlist, Reseñas, Datos y privacidad (descargar/eliminar datos).
- Pedidos con estado, tracking, factura y acción "volver a comprar".

#### 9.5.9 Seguimiento de pedido (público)

- Acceso con número de pedido + email (sin login), rate-limited.
- Timeline: Pagado → Preparando → En camino → Entregado, con transportadora y guía.
- Mapa/estado de la transportadora vía webhook; sin polling agresivo.

#### 9.5.10 Wishlist

- Requiere login (invitado ve CTA para guardar). Grid con quick-add y "mover a la bolsa".
- Compartir lista por link público opcional (Fase 2).

#### 9.5.11 Blog / Contenido

- Artículos con rutas limpias, autor, fecha, schema `Article`, relacionados con productos.
- Objetivo SEO: "rutina para cabello graso", "cómo usar ácido hialurónico".
- MDX o CMS headless (Sanity/Payload) — decisión en Fase 2; MVP con MDX versionado.

#### 9.5.12 Legales

- Política de tratamiento de datos (Ley 1581), términos y condiciones, política de envíos,
  cambios y devoluciones (retracto), preguntas frecuentes, libro de reclamaciones (enlace SIC).
- Versionadas con fecha y hash; el consentimiento registra la versión aceptada.

#### 9.5.13 Admin (operación)

- Dashboard de pedidos por estado, alertas de pago/factura/stock.
- CRUD de catálogo con edición masiva (CSV), gestión de media, inventario por bodega,
  cupones, reseñas, usuarios/roles, auditoría y exportes.
- Sin diseño "bonito": densidad y velocidad; tablas con filtros y atajos de teclado.

### 9.6 Wireframes ASCII

**Home (desktop):**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Logo]  Marcas▾ Cabello▾ Rostro▾ Cuerpo▾ Ofertas   [🔍 Buscar...]        │
│                                    ♡ Wishlist  ⇄ Seguir pedido  🛍(2)    │
├──────────────────────────────────────────────────────────────────────────┤
│ Anuncio: Envío gratis desde $150.000 · Recoge en tienda                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌────────────────────────────────────┐   Tu rutina, tu ritual          │
│   │        HERO (21:9, LCP)            │   Descubre tu tratamiento ideal  │
│   │                                    │   [ Ver colección → ]            │
│   └────────────────────────────────────┘                                 │
├──────────────────────────────────────────────────────────────────────────┤
│ MARCAS   [L'Oréal] [Vichy] [CeraVe] [La Roche] [Eucerin]  →  scroll-snap │
├──────────────────────────────────────────────────────────────────────────┤
│ COMPRA POR NECESIDAD                                                     │
│ [Caída] [Frizz] [Rizos] [Cabello graso] [Piel sensible] [Manchas]        │
├──────────────────────────────────────────────────────────────────────────┤
│ LOS MÁS VENDIDOS                                          [Ver todo →]    │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│ │  img    │ │  img    │ │  img    │ │  img    │   quick-add (+) siempre  │
│ │ marca   │ │ marca   │ │ marca   │ │ marca   │                          │
│ │ nombre  │ │ nombre  │ │ nombre  │ │ nombre  │                          │
│ │ ★4.8 32 │ │ ★4.6 11 │ │ ★4.9 8  │ │ ★4.7 21 │                          │
│ │ $89.900 │ │ $45.000 │ │ $120.000│ │ $67.500 │                          │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                          │
├──────────────────────────────────────────────────────────────────────────┤
│ [ Banner: nueva línea reparación ]  [ Banner: combos con 20% ]           │
├──────────────────────────────────────────────────────────────────────────┤
│ ★4.8 promedio · 1.240 reseñas verificadas   [leer reseñas]               │
├──────────────────────────────────────────────────────────────────────────┤
│ NEWSLETTER  [Email] [Celular] [Nacimiento] [✓ Autorizo] [Quiero mi 10%]  │
├──────────────────────────────────────────────────────────────────────────┤
│ FOOTER  Ayuda · Envíos · Retracto · Legales · Medios de pago · Redes     │
└──────────────────────────────────────────────────────────────────────────┘
```

**PLP (desktop):**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Header                                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│ Inicio / Cabello / Tratamiento                           128 productos    │
│ Tratamiento capilar                                                      │
├───────────────┬──────────────────────────────────────────────────────────┤
│ FILTROS       │ Ordenar [Relevancia ▾]                    [⊞] [☰]         │
│               │                                                          │
│ Marca (12)    │ ┌───────────┐ ┌───────────┐ ┌───────────┐                │
│ ☐ L'Oréal     │ │  img      │ │  img      │ │  img      │                │
│ ☐ Vichy       │ │ NUEVO     │ │ -15%      │ │           │                │
│ ☐ CeraVe      │ │ marca     │ │ marca     │ │ marca     │                │
│ ☐ Eucerin     │ │ nombre    │ │ nombre    │ │ nombre    │                │
│               │ │ ★4.8 (32) │ │ ★4.5 (11) │ │ ★4.9 (8)  │                │
│ Precio        │ │ $89.900   │ │ $45.000   │ │ $120.000  │                │
│ [──●────●──]  │ │ [Agregar] │ │ [Agregar] │ │ [Agregar] │                │
│               │ └───────────┘ └───────────┘ └───────────┘                │
│ Necesidad     │ ┌───────────┐ ┌───────────┐ ┌───────────┐                │
│ ☐ Caída       │ │  ...      │ │  ...      │ │  ...      │                │
│ ☐ Frizz       │ └───────────┘ └───────────┘ └───────────┘                │
│ ☐ Rizos       │                                                          │
│               │                  [ Cargar más ]                          │
│ Tipo cabello  │                                                          │
│ ☐ Graso       │  Texto SEO introductorio + FAQ colapsable                │
│ ☐ Seco        │                                                          │
│ ☐ Disponible  │                                                          │
└───────────────┴──────────────────────────────────────────────────────────┘
```

**PDP (desktop):**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Header                                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│ Inicio / Cabello / Tratamiento / Mascarilla Reparadora 400 ml            │
├─────────────────────────────┬────────────────────────────────────────────┤
│ ┌─────────────────────────┐ │ MARCA        ★4.8 (32 reseñas)             │
│ │                         │ │ Mascarilla Reparadora 400 ml               │
│ │    IMAGEN PRINCIPAL     │ │ [NUEVO]  [-15%]                            │
│ │        (1:1, LCP)       │ │ $76.415  ~~$89.900~~   IVA incluido        │
│ │                         │ │                                            │
│ └─────────────────────────┘ │ Tamaño  [250 ml] [400 ml ✓] [1 L]          │
│ [▪][▪][▪][▪]                │ Tono    [●][●][●][●]                       │
│                             │                                            │
│                             │ ✓ Disponible · llega mañana en Bogotá      │
│                             │ ✓ Recoge gratis hoy en tienda              │
│                             │                                            │
│                             │ ┌───────┐ ┌──────────────────────────────┐ │
│                             │ │ − 1 + │ │     AGREGAR A LA BOLSA       │ │
│                             │ └───────┘ └──────────────────────────────┘ │
│                             │ ♡ Guardar          ⇄ Comparar              │
│                             │ Paga con: tarjeta · PSE · Nequi · COD      │
│                             │ BNPL: Wompi SU+Pay (1–12 cuotas)           │
├─────────────────────────────┴────────────────────────────────────────────┤
│ [Detalles] [Modo de uso] [Ingredientes] [Especificaciones] [Reseñas 32]  │
├──────────────────────────────────────────────────────────────────────────┤
│ RELACIONADOS (misma necesidad)  [p1] [p2] [p3]          [Ver más]        │
├──────────────────────────────────────────────────────────────────────────┤
│ RESEÑAS ★4.8 · 32 · [Verificadas ✓] [Con texto]                          │
│ ★★★★★ "Me dejó el cabello suave" — Compra verificada · hace 2 semanas    │
├──────────────────────────────────────────────────────────────────────────┤
│ TAMBIÉN TE PUEDE GUSTAR   [4 productos]                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 9.7 Mejoras concretas frente a la referencia

| # | Referencia (Recamier/VTEX) | Nuestra propuesta | Impacto esperado |
|---|---|---|---|
| 1 | Dos CTAs "Agregar a la bolsa" | **Un CTA primario** + sticky en móvil | Menos fricción, más add-to-cart |
| 2 | Sin reseñas visibles | Reseñas verificadas, con fotos (F2), filtros y rating en card | +confianza, +CVR |
| 3 | Sin venta cruzada | Relacionados por necesidad en PDP (MVP) y bundle "comprados juntos" con descuento (F2) | +AOV 8–15% |
| 4 | Búsqueda básica | Autocompletado, sinónimos, tolerancia a errores, búsquedas populares | +búsquedas con clic |
| 5 | Filtros solo por categoría/marca | Facetas por **necesidad** (caída, frizz, tipo de cabello), tono, precio, rating, stock | +descubrimiento, -rebote |
| 6 | Sin quick-add en listado | Quick-add con selector de variante en sheet | -pasos hasta carrito |
| 7 | Sin stock/entrega visibles | Stock real + ETA por ciudad + recogida en tienda | -abandono por incertidumbre |
| 8 | URLs con query params de VTEX | URLs limpias y jerárquicas (`/cabello/tratamiento/mascarilla-x`) | +SEO, +CTR |
| 9 | Consentimiento débil | Banner granular + Consent Mode v2 + registro de versión | Cumplimiento Ley 1581 y datos confiables |
| 10 | Sin guía de tonos/tallas | Selector visual con swatches + "encuentra tu tono" | -devoluciones, +conversión |

### 9.8 Accesibilidad y motion

- Contraste mínimo 4,5:1 en texto y 3:1 en componentes; foco visible de 2 px con offset.
- Todos los controles operables con teclado; `Esc` cierra drawers; focus trap en modales.
- `aria-live="polite"` para "producto agregado a la bolsa" y cambios de precio.
- Animaciones CSS-first: transiciones de opacidad/transform, nunca `height`/`top`.
- `prefers-reduced-motion` desactiva parallax, autoplay y transiciones largas.
- Imágenes con `alt` significativo; decorativas con `alt=""`.

### 9.9 Tono y microcopy

Español Colombia, cercano y directo, sin diminutivos infantilizantes. "Bolsa" como nombre del
carrito (alineado con la categoría y la referencia), "Agregar a la bolsa", "Ir a pagar",
"Llega mañana", "Recoge hoy". Errores que explican y ofrecen salida: "No pudimos procesar el
pago. Tu pedido sigue reservado 30 minutos; intenta con otro método."

---
## 10. Modelo de datos

### 10.1 Principios de modelado

| Decisión | Regla |
|---|---|
| **Dinero** | `Int` en **COP entero** (sin centavos). Nunca `Float`. Porcentajes en **basis points** (`1500` = 15%) |
| **Precio en pedido** | **Snapshot inmutable** en `order_items` (precio, descuento, impuesto, nombre, SKU, imagen). El pedido no cambia si el catálogo cambia |
| **Soft delete** | `deletedAt` en catálogo y usuarios. Pedidos, pagos y facturas **nunca** se borran |
| **Multi-bodega** | `inventory` por `(variant, warehouse)`; reservas con TTL; asignación por prioridad de bodega |
| **Idempotencia** | `idempotency_keys` + `unique(provider, event_id)` en webhooks + `outbox_events` |
| **Concurrencia de stock** | Update condicional atómico + `CHECK (on_hand >= 0)` + `reserved <= on_hand` |
| **Categorías** | Árbol con `parentId` + `path` materializado (prefijo indexado); opción `ltree` si se requiere |
| **Variantes** | EAV controlado: `attributes` → `attribute_values` → `variant_attribute_values` |
| **Búsqueda** | Postgres es fuente de verdad; Meilisearch es índice derivado (nunca origen) |
| **PII** | Cifrado de aplicación **AES-256-GCM** en `phone`, `documentNumber` y snapshots de despacho; **índice ciego** (`*Hash` SHA-256 con pepper) para búsquedas; claves en KMS/gestor de secretos con rotación. Derecho de supresión = anonimización con retención legal de facturas (5 años, Estatuto Tributario) |
| **Auditoría** | Toda acción administrativa escribe `audit_logs` con `before/after` |
| **Timestamps** | `timestamptz` en UTC; la UI convierte a `America/Bogota` |

### 10.2 Diagrama ER (entidades principales)

```
                        ┌──────────┐        ┌──────────────┐
                        │  users   │───┬───▶│  addresses   │
                        └────┬─────┘   │    └──────────────┘
                             │         │    ┌──────────────┐
                             │         ├───▶│   sessions   │
                             │         │    └──────────────┘
                             │         │    ┌──────────────┐
                             │         ├───▶│  user_roles  │──▶ roles ──▶ role_permissions ──▶ permissions
                             │         │    └──────────────┘
                             │         │    ┌───────────────┐
                             │         ├───▶│ wishlist_items│──▶ products
                             │         │    └───────────────┘
                             │         │    ┌──────────────┐
                             │         └───▶│   consents   │
                             │              └──────────────┘
                             │
        ┌────────────┐       │        ┌──────────────┐        ┌───────────────┐
        │  brands    │──┐    │        │    carts     │───┐    │  warehouses   │
        └────────────┘  │    │        └──────────────┘   │    └───────┬───────┘
                        ▼    │               │           │            │
                   ┌─────────┴──┐             ▼           │            ▼
                   │  products  │◀────── cart_items ──────┘     ┌────────────┐
                   └──┬──┬──┬───┘                               │ inventory  │
                      │  │  │                                   └─────┬──────┘
      ┌───────────────┘  │  └──────────────┐                          │
      ▼                  ▼                 ▼                          ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐         ┌───────────────────┐
│ product_media│  │  variants    │  │  reviews     │         │inventory_movements│
└──────┬───────┘  └──┬───┬───┬───┘  └──────┬───────┘         └───────────────────┘
       │             │   │   │             │
       ▼             │   │   └──────┐      ▼
   ┌───────┐         │   │          │  ┌──────────────┐
   │ media │         │   │          │  │ review_votes │
   └───────┘         │   │          │  └──────────────┘
                     │   │          ▼
                     │   │   ┌───────────────────────┐
                     │   └──▶│variant_attribute_vals │──▶ attribute_values ──▶ attributes
                     │       └───────────────────────┘
                     │
                     ▼
              ┌──────────────┐        ┌──────────────┐
              │  order_items │◀───────│    orders    │───▶ order_status_history
              └──────┬───────┘        └───┬───┬───┬──┘
                     │                    │   │   └──────────▶ coupon_redemptions ──▶ coupons
                     ▼                    │   └──────────────▶ invoices
              ┌───────────────┐           ▼
              │ shipment_items│◀── shipments ──▶ payments ──▶ payment_transactions
              └───────────────┘
```

### 10.3 Schema Prisma de referencia

> Esquema de **diseño**. Antes de la primera migración se valida con `prisma validate` y
> `prisma migrate dev --create-only`; los `CHECK` y los índices parciales se añaden en la
> migración SQL (Prisma no los expresa).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ───────────────────────────── ENUMS ─────────────────────────────

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

enum WarehouseType {
  DISTRIBUTION_CENTER
  STORE
  THIRD_PARTY
}

enum InventoryMovementType {
  PURCHASE
  RECEIPT
  SALE
  RETURN
  ADJUSTMENT
  TRANSFER_OUT
  TRANSFER_IN
  DAMAGE
  RESERVATION
  RESERVATION_RELEASE
}

enum ReservationStatus {
  ACTIVE
  CONFIRMED
  RELEASED
  EXPIRED
}

enum CartStatus {
  ACTIVE
  CONVERTED
  ABANDONED
  MERGED
  EXPIRED
}

enum OrderStatus {
  DRAFT
  PENDING_PAYMENT
  PAID
  PAID_NEEDS_REVIEW
  PREPARING
  PACKED
  SHIPPED
  DELIVERED
  CANCELLED
  RETURN_REQUESTED
  RETURNED
  REFUNDED
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

enum PaymentProvider {
  WOMPI
  EPAYCO
  MERCADO_PAGO
  ADDI
  SISTECREDITO
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
  BNPL_WOMPI        // Compra y Paga Después / SU+Pay (MVP)
  BNPL_ADDI         // Fase 2
  BNPL_SISTECREDITO // Fase 2
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

enum ShipmentStatus {
  PENDING
  READY
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  FAILED
  RETURNED
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

enum PromotionType {
  AUTOMATIC
  COUPON
  BUNDLE
  FREE_SHIPPING
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
  HIDDEN
}

enum ConsentType {
  COOKIES
  MARKETING
  DATA_POLICY
  TERMS
}

enum NewsletterStatus {
  PENDING
  CONFIRMED
  UNSUBSCRIBED
  BOUNCED
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

enum AuditActorType {
  USER
  ADMIN
  SYSTEM
  INTEGRATION
}

// ─────────────────────── IDENTIDAD Y ACCESO ──────────────────────

model User {
  id               String     @id @default(uuid()) @db.Uuid
  email            String     @unique @db.VarChar(254)
  emailVerifiedAt  DateTime?
  phone            String?    @db.Text // cifrado en aplicación (AES-256-GCM)
  phoneHash        String?    @unique @db.VarChar(64) // índice ciego para búsqueda
  passwordHash     String?    @db.VarChar(255)
  firstName        String?    @db.VarChar(80)
  lastName         String?    @db.VarChar(80)
  documentType     String?    @db.VarChar(10)
  documentNumber   String?    @db.Text // cifrado en aplicación
  documentHash     String?    @unique @db.VarChar(64) // índice ciego
  birthDate        DateTime?  @db.Date
  status           UserStatus @default(PENDING_VERIFICATION)
  acceptsMarketing Boolean    @default(false)
  lastLoginAt      DateTime?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  deletedAt        DateTime?

  sessions          Session[]
  addresses         Address[]
  roles             UserRole[]
  carts             Cart[]
  orders            Order[]
  reviews           Review[]
  reviewVotes       ReviewVote[]
  wishlistItems     WishlistItem[]
  consents          Consent[]
  couponRedemptions CouponRedemption[]
  auditLogs         AuditLog[]

  @@index([status])
  @@index([createdAt])
  @@map("users")
}

model Session {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @db.Uuid
  tokenHash String    @unique @db.VarChar(128)
  ip        String?   @db.VarChar(45)
  userAgent String?   @db.VarChar(512)
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("sessions")
}

model Role {
  id          String  @id @default(uuid()) @db.Uuid
  name        String  @unique @db.VarChar(60)
  description String? @db.VarChar(255)

  users       UserRole[]
  permissions RolePermission[]

  @@map("roles")
}

model Permission {
  id   String @id @default(uuid()) @db.Uuid
  code String @unique @db.VarChar(80) // p.ej. catalog.write, orders.refund

  roles RolePermission[]

  @@map("permissions")
}

model RolePermission {
  roleId       String @db.Uuid
  permissionId String @db.Uuid

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
}

model UserRole {
  userId String @db.Uuid
  roleId String @db.Uuid

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}

model Address {
  id            String      @id @default(uuid()) @db.Uuid
  userId        String      @db.Uuid
  type          AddressType @default(SHIPPING)
  recipientName String      @db.VarChar(120)
  phone         String      @db.Text // cifrado en aplicación
  line1         String      @db.VarChar(200)
  line2         String?     @db.VarChar(200)
  city          String      @db.VarChar(120)
  cityCode      String?     @db.VarChar(20)
  department    String      @db.VarChar(120)
  countryCode   String      @default("CO") @db.Char(2)
  postalCode    String?     @db.VarChar(10)
  references    String?     @db.VarChar(255)
  isDefault     Boolean     @default(false)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  deletedAt     DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, type])
  @@map("addresses")
}

// ──────────────────────────── CATÁLOGO ───────────────────────────

model Brand {
  id             String    @id @default(uuid()) @db.Uuid
  slug           String    @unique @db.VarChar(120)
  name           String    @db.VarChar(120)
  description    String?   @db.Text
  logoUrl        String?   @db.VarChar(500)
  seoTitle       String?   @db.VarChar(160)
  seoDescription String?   @db.VarChar(320)
  sortOrder      Int       @default(0)
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  products Product[]

  @@index([isActive, sortOrder])
  @@map("brands")
}

model Category {
  id             String    @id @default(uuid()) @db.Uuid
  parentId       String?   @db.Uuid
  slug           String    @unique @db.VarChar(140)
  name           String    @db.VarChar(140)
  path           String    @db.VarChar(400) // /cabello/tratamiento
  depth          Int       @default(0)
  description    String?   @db.Text
  imageUrl       String?   @db.VarChar(500)
  seoTitle       String?   @db.VarChar(160)
  seoDescription String?   @db.VarChar(320)
  sortOrder      Int       @default(0)
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?

  parent   Category?         @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[]        @relation("CategoryTree")
  products ProductCategory[]

  @@index([parentId, sortOrder])
  @@index([path])
  @@map("categories")
}

model Product {
  id               String        @id @default(uuid()) @db.Uuid
  brandId          String        @db.Uuid
  sku              String        @unique @db.VarChar(60)
  slug             String        @unique @db.VarChar(180)
  name             String        @db.VarChar(200)
  shortDescription String?       @db.VarChar(400)
  description      String?       @db.Text
  howToUse         String?       @db.Text
  ingredients      String?       @db.Text
  specifications   Json?
  status           ProductStatus @default(DRAFT)
  isFeatured       Boolean       @default(false)
  bestsellerRank   Int?
  ratingAvg        Decimal       @default(0) @db.Decimal(2, 1)
  ratingCount      Int           @default(0)
  taxRateBp        Int           @default(1900) // 19% IVA en basis points
  searchKeywords   String[]
  seoTitle         String?       @db.VarChar(160)
  seoDescription   String?       @db.VarChar(320)
  publishedAt      DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  deletedAt        DateTime?

  brand           Brand                   @relation(fields: [brandId], references: [id])
  categories      ProductCategory[]
  variants        ProductVariant[]
  media           ProductMedia[]
  attributeValues ProductAttributeValue[]
  reviews         Review[]
  wishlistItems   WishlistItem[]

  @@index([brandId, status])
  @@index([status, publishedAt(sort: Desc)])
  @@index([isFeatured, bestsellerRank])
  @@map("products")
}

model ProductCategory {
  productId  String  @db.Uuid
  categoryId String  @db.Uuid
  isPrimary  Boolean @default(false)
  position   Int     @default(0)

  product  Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([productId, categoryId])
  @@index([categoryId])
  @@map("product_categories")
}

model Attribute {
  id            String        @id @default(uuid()) @db.Uuid
  code          String        @unique @db.VarChar(60) // hair_type, concern, tone, size
  name          String        @db.VarChar(120)
  type          AttributeType @default(SELECT)
  unit          String?       @db.VarChar(20)
  isFilterable  Boolean       @default(true)
  isVariantAxis Boolean       @default(false)
  sortOrder     Int           @default(0)

  values        AttributeValue[]
  productValues ProductAttributeValue[]
  variantValues VariantAttributeValue[]

  @@map("attributes")
}

model AttributeValue {
  id          String  @id @default(uuid()) @db.Uuid
  attributeId String  @db.Uuid
  code        String  @db.VarChar(60)
  value       String  @db.VarChar(120)
  hexColor    String? @db.Char(7) // swatches de tono
  sortOrder   Int     @default(0)

  attribute     Attribute                @relation(fields: [attributeId], references: [id], onDelete: Cascade)
  productValues ProductAttributeValue[]
  variantValues VariantAttributeValue[]

  @@unique([attributeId, code])
  @@index([attributeId, sortOrder])
  @@map("attribute_values")
}

model ProductAttributeValue {
  productId        String @db.Uuid
  attributeId      String @db.Uuid
  attributeValueId String @db.Uuid

  product        Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  attribute      Attribute      @relation(fields: [attributeId], references: [id])
  attributeValue AttributeValue @relation(fields: [attributeValueId], references: [id])

  @@id([productId, attributeId, attributeValueId])
  @@index([attributeId, attributeValueId])
  @@map("product_attribute_values")
}

model ProductVariant {
  id             String        @id @default(uuid()) @db.Uuid
  productId      String        @db.Uuid
  sku            String        @unique @db.VarChar(60)
  barcode        String?       @db.VarChar(60)
  name           String        @db.VarChar(160) // "400 ml", "Tono 5.3"
  price          Int // COP entero, IVA incluido
  compareAtPrice Int?
  cost           Int?
  weightGrams    Int           @default(0)
  dimensions     Json?
  status         VariantStatus @default(ACTIVE)
  isDefault      Boolean       @default(false)
  position       Int           @default(0)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?

  product         Product                 @relation(fields: [productId], references: [id], onDelete: Cascade)
  attributeValues VariantAttributeValue[]
  inventory       Inventory[]
  movements       InventoryMovement[]
  cartItems       CartItem[]
  orderItems      OrderItem[]
  reservations    StockReservation[]
  media           ProductMedia[]

  @@index([productId, position])
  @@index([status])
  @@map("product_variants")
}

model VariantAttributeValue {
  variantId        String @db.Uuid
  attributeId      String @db.Uuid
  attributeValueId String @db.Uuid

  variant        ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  attribute      Attribute      @relation(fields: [attributeId], references: [id])
  attributeValue AttributeValue @relation(fields: [attributeValueId], references: [id])

  @@id([variantId, attributeId])
  @@index([attributeId, attributeValueId])
  @@map("variant_attribute_values")
}

model Media {
  id         String   @id @default(uuid()) @db.Uuid
  storageKey String   @unique @db.VarChar(400)
  url        String   @db.VarChar(600)
  mimeType   String   @db.VarChar(100)
  width      Int?
  height     Int?
  bytes      Int?
  alt        String?  @db.VarChar(255)
  blurhash   String?  @db.VarChar(60)
  checksum   String?  @db.VarChar(64)
  createdAt  DateTime @default(now())

  productMedia ProductMedia[]
  reviewMedia  ReviewMedia[]

  @@map("media")
}

model ProductMedia {
  productId String    @db.Uuid
  mediaId   String    @db.Uuid
  variantId String?   @db.Uuid
  role      MediaRole @default(GALLERY)
  position  Int       @default(0)

  product Product         @relation(fields: [productId], references: [id], onDelete: Cascade)
  media   Media           @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  variant ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  @@id([productId, mediaId, role])
  @@index([productId, role, position])
  @@map("product_media")
}

// ─────────────────────────── INVENTARIO ──────────────────────────

model Warehouse {
  id            String        @id @default(uuid()) @db.Uuid
  code          String        @unique @db.VarChar(20)
  name          String        @db.VarChar(120)
  type          WarehouseType @default(DISTRIBUTION_CENTER)
  address       String?       @db.VarChar(255)
  city          String?       @db.VarChar(120)
  department    String?       @db.VarChar(120)
  phone         String?       @db.VarChar(20)
  isPickupPoint Boolean       @default(false)
  priority      Int           @default(100)
  isActive      Boolean       @default(true)

  inventory    Inventory[]
  movements    InventoryMovement[]
  reservations StockReservation[]

  @@index([isActive, priority])
  @@map("warehouses")
}

model Inventory {
  id          String   @id @default(uuid()) @db.Uuid
  variantId   String   @db.Uuid
  warehouseId String   @db.Uuid
  onHand      Int      @default(0)
  reserved    Int      @default(0)
  safetyStock Int      @default(0)
  updatedAt   DateTime @updatedAt

  variant   ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  warehouse Warehouse      @relation(fields: [warehouseId], references: [id])

  @@unique([variantId, warehouseId])
  @@index([warehouseId])
  @@map("inventory")
}

model InventoryMovement {
  id            String                @id @default(uuid()) @db.Uuid
  variantId     String                @db.Uuid
  warehouseId   String                @db.Uuid
  type          InventoryMovementType
  quantity      Int // firmado: + entrada, - salida
  reason        String?               @db.VarChar(255)
  referenceType String?               @db.VarChar(40) // order, adjustment, transfer
  referenceId   String?               @db.Uuid
  createdById   String?               @db.Uuid
  createdAt     DateTime              @default(now())

  variant   ProductVariant @relation(fields: [variantId], references: [id])
  warehouse Warehouse      @relation(fields: [warehouseId], references: [id])

  @@index([variantId, createdAt(sort: Desc)])
  @@index([referenceType, referenceId])
  @@map("inventory_movements")
}

model StockReservation {
  id          String            @id @default(uuid()) @db.Uuid
  variantId   String            @db.Uuid
  warehouseId String            @db.Uuid
  cartId      String?           @db.Uuid
  orderId     String?           @db.Uuid
  quantity    Int
  status      ReservationStatus @default(ACTIVE)
  expiresAt   DateTime
  createdAt   DateTime          @default(now())

  variant   ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  warehouse Warehouse      @relation(fields: [warehouseId], references: [id])
  cart      Cart?          @relation(fields: [cartId], references: [id], onDelete: Cascade)
  order     Order?         @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([status, expiresAt])
  @@index([variantId, warehouseId])
  @@index([orderId])
  @@map("stock_reservations")
}

// ───────────────────────── CARRITO Y PEDIDOS ─────────────────────

model Cart {
  id             String     @id @default(uuid()) @db.Uuid
  token          String     @unique @db.VarChar(64) // cookie firmada del invitado
  userId         String?    @db.Uuid
  status         CartStatus @default(ACTIVE)
  currency       String     @default("COP") @db.Char(3)
  couponCode     String?    @db.VarChar(40)
  note           String?    @db.VarChar(500)
  expiresAt      DateTime
  lastActivityAt DateTime   @default(now())
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  user         User?              @relation(fields: [userId], references: [id], onDelete: SetNull)
  items        CartItem[]
  reservations StockReservation[]

  @@index([userId, status])
  @@index([status, lastActivityAt])
  @@map("carts")
}

model CartItem {
  id                String   @id @default(uuid()) @db.Uuid
  cartId            String   @db.Uuid
  variantId         String   @db.Uuid
  quantity          Int
  unitPriceSnapshot Int
  addedAt           DateTime @default(now())
  updatedAt         DateTime @updatedAt

  cart    Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variant ProductVariant @relation(fields: [variantId], references: [id])

  @@unique([cartId, variantId])
  @@index([variantId])
  @@map("cart_items")
}

model Order {
  id                      String        @id @default(uuid()) @db.Uuid
  number                  String        @unique @db.VarChar(30) // ORD-2026-000123
  userId                  String?       @db.Uuid
  status                  OrderStatus   @default(PENDING_PAYMENT)
  paymentStatus           PaymentStatus @default(PENDING)
  currency                String        @default("COP") @db.Char(3)
  subtotal                Int
  discountTotal           Int           @default(0)
  shippingTotal           Int           @default(0)
  taxTotal                Int           @default(0)
  grandTotal              Int
  couponCode              String?       @db.VarChar(40)
  appliedPromotions       Json?         // auditoría de promociones automáticas aplicadas
  customerEmail           String        @db.VarChar(254)
  customerPhone           String?       @db.VarChar(20)
  shippingAddressSnapshot Json
  billingAddressSnapshot  Json?
  customerSnapshot        Json
  utm                     Json?
  source                  String?       @db.VarChar(40)
  notes                   String?       @db.VarChar(1000)
  internalNotes           String?       @db.VarChar(1000)
  idempotencyKey          String?       @unique @db.VarChar(80)
  placedAt                DateTime? // se fija al confirmar el pago, no al crear
  confirmedAt             DateTime?
  paidAt                  DateTime?
  cancelledAt             DateTime?
  expiresAt               DateTime? // expiración de la reserva de stock
  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt

  user          User?                @relation(fields: [userId], references: [id], onDelete: SetNull)
  items         OrderItem[]
  payments      Payment[]
  shipments     Shipment[]
  statusHistory OrderStatusHistory[]
  redemptions   CouponRedemption[]
  reviews       Review[]
  invoices      Invoice[]
  reservations  StockReservation[]

  @@index([userId, createdAt(sort: Desc)])
  @@index([status, createdAt(sort: Desc)])
  @@index([paymentStatus])
  @@index([customerEmail])
  @@map("orders")
}

model OrderItem {
  id              String  @id @default(uuid()) @db.Uuid
  orderId         String  @db.Uuid
  variantId       String? @db.Uuid
  productId       String? @db.Uuid // sin FK: referencia histórica
  sku             String  @db.VarChar(60)
  productName     String  @db.VarChar(200)
  variantName     String? @db.VarChar(160)
  brandName       String? @db.VarChar(120)
  imageUrl        String? @db.VarChar(600)
  unitPrice       Int
  unitDiscount    Int     @default(0)
  discountSource  String? @db.VarChar(60) // CUPON | PROMO_AUTO | BUNDLE | MANUAL
  quantity        Int
  taxRateBp       Int     @default(1900)
  taxAmount       Int     @default(0)
  lineTotal       Int
  unitCost        Int?
  productSnapshot Json

  order         Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variant       ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  shipmentItems ShipmentItem[]

  @@index([orderId])
  @@index([variantId])
  @@map("order_items")
}

model OrderStatusHistory {
  id          String      @id @default(uuid()) @db.Uuid
  orderId     String      @db.Uuid
  fromStatus  OrderStatus?
  toStatus    OrderStatus
  note        String?     @db.VarChar(500)
  createdById String?     @db.Uuid
  createdAt   DateTime    @default(now())

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId, createdAt])
  @@map("order_status_history")
}

// ──────────────────────────── PAGOS ──────────────────────────────

model Payment {
  id                String          @id @default(uuid()) @db.Uuid
  orderId           String          @db.Uuid
  provider          PaymentProvider
  method            PaymentMethod
  status            PaymentStatus   @default(PENDING)
  amount            Int
  currency          String          @default("COP") @db.Char(3)
  providerPaymentId String?         @db.VarChar(120)
  providerReference String?         @db.VarChar(120)
  installments      Int?
  authorizationCode String?         @db.VarChar(40)
  failureCode       String?         @db.VarChar(60)
  failureMessage    String?         @db.VarChar(500)
  providerFee       Int?
  rawPayload        Json?
  paidAt            DateTime?
  expiresAt         DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  order        Order                @relation(fields: [orderId], references: [id], onDelete: Cascade)
  transactions PaymentTransaction[]

  @@unique([provider, providerPaymentId])
  @@index([orderId])
  @@index([status, createdAt])
  @@map("payments")
}

model PaymentTransaction {
  id            String            @id @default(uuid()) @db.Uuid
  paymentId     String            @db.Uuid
  type          TransactionType
  status        TransactionStatus @default(PENDING)
  amount        Int
  providerTxnId String?           @unique @db.VarChar(120)
  errorCode     String?           @db.VarChar(60)
  rawPayload    Json?
  createdAt     DateTime          @default(now())

  payment Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  @@index([paymentId, createdAt])
  @@map("payment_transactions")
}

// ─────────────────────────── ENVÍOS ──────────────────────────────

model Shipment {
  id                  String         @id @default(uuid()) @db.Uuid
  orderId             String         @db.Uuid
  carrier             String         @db.VarChar(60)
  service             String?        @db.VarChar(60)
  trackingNumber      String?        @db.VarChar(80)
  trackingUrl         String?        @db.VarChar(500)
  status              ShipmentStatus @default(PENDING)
  cost                Int            @default(0)
  weightGrams         Int            @default(0)
  labelUrl            String?        @db.VarChar(500)
  addressSnapshot     Json
  estimatedDeliveryAt DateTime?
  shippedAt           DateTime?
  deliveredAt         DateTime?
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  order Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  items ShipmentItem[]

  @@index([orderId])
  @@index([trackingNumber])
  @@index([status, createdAt])
  @@map("shipments")
}

model ShipmentItem {
  shipmentId  String @db.Uuid
  orderItemId String @db.Uuid
  quantity    Int

  shipment  Shipment  @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
  orderItem OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)

  @@id([shipmentId, orderItemId])
  @@map("shipment_items")
}

// ─────────────────── CUPONES Y PROMOCIONES ───────────────────────

model Coupon {
  id                String        @id @default(uuid()) @db.Uuid
  code              String        @unique @db.VarChar(40)
  description       String?       @db.VarChar(255)
  type              CouponType
  value             Int // PERCENT en bp; FIXED en COP
  scope             DiscountScope @default(ALL)
  scopeIds          String[]
  minSubtotal       Int?
  maxDiscount       Int?
  startsAt          DateTime
  endsAt            DateTime
  usageLimit        Int?
  usageLimitPerUser Int?
  usedCount         Int           @default(0)
  firstPurchaseOnly Boolean       @default(false)
  stackable         Boolean       @default(false)
  isActive          Boolean       @default(true)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  redemptions CouponRedemption[]

  @@index([isActive, startsAt, endsAt])
  @@map("coupons")
}

model CouponRedemption {
  id        String   @id @default(uuid()) @db.Uuid
  couponId  String   @db.Uuid
  orderId   String   @db.Uuid
  userId    String?  @db.Uuid
  amount    Int
  createdAt DateTime @default(now())

  coupon Coupon @relation(fields: [couponId], references: [id])
  order  Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  user   User?  @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@unique([couponId, orderId])
  @@index([userId])
  @@map("coupon_redemptions")
}

model Promotion {
  id         String        @id @default(uuid()) @db.Uuid
  name       String        @db.VarChar(160)
  type       PromotionType
  conditions Json // { minSubtotal, categories[], brands[], products[], customerSegment }
  actions    Json // { discountBp, fixedAmount, freeShipping, giftVariantId }
  priority   Int           @default(100)
  stackable  Boolean       @default(false)
  startsAt   DateTime
  endsAt     DateTime
  isActive   Boolean       @default(true)
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  @@index([isActive, startsAt, endsAt, priority])
  @@map("promotions")
}

// ───────────────────── RESEÑAS Y WISHLIST ────────────────────────

model Review {
  id                 String       @id @default(uuid()) @db.Uuid
  productId          String       @db.Uuid
  userId             String       @db.Uuid
  orderId            String?      @db.Uuid
  rating             Int
  title              String?      @db.VarChar(160)
  body               String       @db.Text
  status             ReviewStatus @default(PENDING)
  isVerifiedPurchase Boolean      @default(false)
  helpfulCount       Int          @default(0)
  publishedAt        DateTime?
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  product Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  user    User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  order   Order?         @relation(fields: [orderId], references: [id], onDelete: SetNull)
  media   ReviewMedia[]
  votes   ReviewVote[]

  @@unique([userId, productId])
  @@index([productId, status, publishedAt(sort: Desc)])
  @@map("reviews")
}

model ReviewMedia {
  reviewId String @db.Uuid
  mediaId  String @db.Uuid
  position Int    @default(0)

  review Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  media  Media  @relation(fields: [mediaId], references: [id], onDelete: Cascade)

  @@id([reviewId, mediaId])
  @@map("review_media")
}

model ReviewVote {
  reviewId String @db.Uuid
  userId   String @db.Uuid
  value    Int // 1 = útil, -1 = no útil

  review Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([reviewId, userId])
  @@map("review_votes")
}

model WishlistItem {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  productId String   @db.Uuid
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@index([productId])
  @@map("wishlist_items")
}

// ──────────────── CONSENTIMIENTO Y NEWSLETTER ────────────────────

model Consent {
  id          String      @id @default(uuid()) @db.Uuid
  userId      String?     @db.Uuid
  anonymousId String?     @db.VarChar(64)
  type        ConsentType
  version     String      @db.VarChar(20)
  granted     Boolean
  ip          String?     @db.VarChar(45)
  userAgent   String?     @db.VarChar(512)
  createdAt   DateTime    @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, type, createdAt(sort: Desc)])
  @@index([anonymousId])
  @@map("consents")
}

model NewsletterSubscription {
  id             String           @id @default(uuid()) @db.Uuid
  email          String           @unique @db.VarChar(254)
  phone          String?          @db.VarChar(20)
  birthDate      DateTime?        @db.Date
  status         NewsletterStatus @default(PENDING)
  source         String?          @db.VarChar(40)
  consentId      String?          @db.Uuid
  confirmedAt    DateTime?
  unsubscribedAt DateTime?
  createdAt      DateTime         @default(now())

  @@index([status])
  @@map("newsletter_subscriptions")
}

// ─────────────── AUDITORÍA E INTEGRACIONES ───────────────────────

model AuditLog {
  id         String         @id @default(uuid()) @db.Uuid
  actorId    String?        @db.Uuid
  actorType  AuditActorType @default(USER)
  action     String         @db.VarChar(80)
  entityType String         @db.VarChar(60)
  entityId   String?        @db.VarChar(80)
  before     Json?
  after      Json?
  ip         String?        @db.VarChar(45)
  userAgent  String?        @db.VarChar(512)
  createdAt  DateTime       @default(now())

  actor User? @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([entityType, entityId])
  @@index([actorId, createdAt(sort: Desc)])
  @@map("audit_logs")
}

model Integration {
  id         String    @id @default(uuid()) @db.Uuid
  provider   String    @unique @db.VarChar(60)
  isActive   Boolean   @default(true)
  config     Json // referencias a secretos, nunca secretos en claro
  lastSyncAt DateTime?
  lastError  String?   @db.Text
  updatedAt  DateTime  @updatedAt

  @@map("integrations")
}

model WebhookEvent {
  id          String        @id @default(uuid()) @db.Uuid
  provider    String        @db.VarChar(60)
  eventId     String        @db.VarChar(160)
  eventType   String        @db.VarChar(80)
  payload     Json
  headers     Json?
  status      WebhookStatus @default(RECEIVED)
  attempts    Int           @default(0)
  lastError   String?       @db.Text
  receivedAt  DateTime      @default(now())
  processedAt DateTime?

  @@unique([provider, eventId])
  @@index([status, receivedAt])
  @@map("webhook_events")
}

model OutboxEvent {
  id            String       @id @default(uuid()) @db.Uuid
  aggregateType String       @db.VarChar(60)
  aggregateId   String       @db.VarChar(80)
  eventType     String       @db.VarChar(80)
  payload       Json
  status        OutboxStatus @default(PENDING)
  attempts      Int          @default(0)
  availableAt   DateTime     @default(now())
  processedAt   DateTime?
  lastError     String?      @db.Text
  createdAt     DateTime     @default(now())

  @@index([status, availableAt])
  @@index([aggregateType, aggregateId])
  @@map("outbox_events")
}

model Invoice {
  id               String        @id @default(uuid()) @db.Uuid
  orderId          String        @db.Uuid
  type             InvoiceType   @default(INVOICE)
  parentInvoiceId  String?       @db.Uuid // nota crédito/débito → factura origen
  provider         String        @db.VarChar(60)
  status           InvoiceStatus @default(PENDING)
  prefix           String?       @db.VarChar(10)
  number           String?       @db.VarChar(30)
  resolutionNumber String?       @db.VarChar(40) // resolución DIAN de numeración
  rangeFrom        Int?
  rangeTo          Int?
  resolutionValidFrom DateTime?
  resolutionValidTo   DateTime?
  cufe             String?       @unique @db.VarChar(120)
  xmlUrl           String?       @db.VarChar(600)
  pdfUrl           String?       @db.VarChar(600)
  dianStatus       String?       @db.VarChar(40)
  errorMessage     String?       @db.Text
  retryCount       Int           @default(0)
  issuedAt         DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  parentInvoice Invoice? @relation("InvoiceNotes", fields: [parentInvoiceId], references: [id], onDelete: SetNull)
  creditNotes   Invoice[] @relation("InvoiceNotes")

  @@unique([prefix, number])
  @@index([status, createdAt])
  @@index([orderId])
  @@map("invoices")
}

model IdempotencyKey {
  id             String   @id @default(uuid()) @db.Uuid
  key            String   @unique @db.VarChar(80)
  scope          String   @db.VarChar(60)
  requestHash    String   @db.VarChar(64)
  responseStatus Int?
  responseBody   Json?
  createdAt      DateTime @default(now())
  expiresAt      DateTime

  @@index([expiresAt])
  @@map("idempotency_keys")
}
```

### 10.4 DDL complementario (lo que Prisma no expresa)

```sql
-- Integridad de inventario
ALTER TABLE inventory
  ADD CONSTRAINT inventory_non_negative
  CHECK (on_hand >= 0 AND reserved >= 0 AND reserved <= on_hand);

-- Un carrito activo por usuario (índice parcial)
CREATE UNIQUE INDEX carts_one_active_per_user
  ON carts (user_id) WHERE status = 'ACTIVE' AND user_id IS NOT NULL;

-- Búsqueda full-text en español como fallback de Meilisearch
CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TABLE products
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(short_description, '')), 'B')
  ) STORED;
CREATE INDEX products_search_vector_idx ON products USING GIN (search_vector);
CREATE INDEX products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);

-- Un solo default por usuario y tipo de dirección
CREATE UNIQUE INDEX addresses_one_default
  ON addresses (user_id, type) WHERE is_default = TRUE AND deleted_at IS NULL;

-- Secuencia de numeración de pedidos
CREATE SEQUENCE order_number_seq START 1000;

-- Una reseña por compra (además de la única por usuario/producto)
CREATE UNIQUE INDEX reviews_one_per_order_product
  ON reviews (order_id, product_id) WHERE order_id IS NOT NULL;
```

### 10.5 Índices recomendados (justificación)

| Tabla | Índice | Consulta que resuelve |
|---|---|---|
| `products` | `(status, published_at DESC)` | Listados y sitemap |
| `products` | `(brand_id, status)` | PLP por marca |
| `product_variants` | `(product_id, position)` | PDP con variantes ordenadas |
| `inventory` | `unique(variant_id, warehouse_id)` | Disponibilidad por bodega |
| `inventory_movements` | `(variant_id, created_at DESC)` | Kardex |
| `carts` | parcial `(user_id) WHERE status='ACTIVE'` | Un carrito activo |
| `orders` | `(user_id, created_at DESC)` | Mis pedidos |
| `orders` | `(status, created_at DESC)` | Cola operativa del admin |
| `payments` | `unique(provider, provider_payment_id)` | Idempotencia y conciliación |
| `webhook_events` | `unique(provider, event_id)` | Anti-duplicado |
| `outbox_events` | `(status, available_at)` | Polling del worker |
| `reviews` | `(product_id, status, published_at DESC)` | PDP y moderación |
| `coupon_redemptions` | `unique(coupon_id, order_id)` | Límite de uso |
| `audit_logs` | `(entity_type, entity_id)` | Trazabilidad |

### 10.6 Estrategia de migraciones

- **Expand/contract**: nunca renombrar o eliminar una columna en el mismo deploy que cambia
  el código. Primero se añade, se despliega, se rellena y luego se elimina.
- Migraciones revisadas por `forge-reviewer` y probadas en una base con datos anonimizados.
- `prisma migrate deploy` en CI/CD; jamás `db push` en producción.
- Backups con PITR (Neon) + snapshot diario antes de migraciones grandes.

---
## 11. Plan de ejecución

### 11.1 Equipo y dedicación

| Rol | FTE | Responsabilidad | Cuándo |
|---|---|---|---|
| Tech Lead / Arquitecto | 0,4 | Decisiones, revisión de diseño, desbloqueo técnico | Todo el proyecto |
| Backend Engineer | 1,0 | Dominio, API, pagos, DIAN, integraciones | S1–S8 |
| Frontend Engineer | 1,0 | Storefront, design system, performance, a11y | S1–S8 |
| Fullstack / Integraciones | 0,6 | Admin, jobs, transportadoras, webhooks | S2–S8 |
| Diseñador UX/UI | 0,6 → 0,2 | Flujos, prototipo, design system, QA visual | S0–S6 |
| QA / QA Automation | 0,5 | Estrategia, E2E, regresión, release | S3–S8 |
| DevOps / SRE | 0,3 | CI/CD, entornos, observabilidad, runbook | S1–S8 |
| Producto / Comandante | 0,3 | Priorización, aceptación, stakeholders | Todo |
| Contenido y catálogo (cliente) | 0,5 | Fichas, fotos, precios, stock inicial | S2–S7 |

**Pico:** ~4,7 FTE del equipo APEX (+0,5 FTE de contenido del cliente, no computado).
**Esfuerzo:** ~61 personas-semana en el escenario optimista (13 sem) y ~80 en el realista
(17 sem). Los sprints descritos suman 17 semanas; el escenario de 13 semanas solo es posible
paralelizando S6–S7 y recortando "relacionados", blog y reseñas a Fase 2.

### 11.2 Supuestos de estimación

- Equipo dedicado y co-localizado en zona horaria; sin cambios de alcance mayores.
- El cliente entrega catálogo, fotos y textos en S2–S4 (si llega tarde, se desfasa el lanzamiento).
- Contratos de Wompi, DIAN y transportadora se inician en S0 (lead time 2–6 semanas).
- No hay integración con ERP en el MVP.
- Diseño visual aprobado antes de S2; cambios posteriores entran por change request.

### 11.3 Sprints (2 semanas, salvo S0)

| Sprint | Semanas | Alcance | Entregable demostrable |
|---|---|---|---|
| **S0 — Discovery** | 1 | Validación de supuestos, accesos, sandbox de pagos/DIAN, arquitectura detallada, backlog, prototipo de Home/PLP/PDP/Checkout, design tokens | Design Doc aprobado + Figma navegable + backlog estimado |
| **S1 — Fundaciones** | 2–3 | Monorepo, CI, Prisma baseline, auth (email + Google), layout/header/footer, tokens, Home con datos reales de muestra, observabilidad, preview deploys | Home desplegada en staging con Lighthouse >90 |
| **S2 — Catálogo y PLP** | 4–5 | Modelo de catálogo, admin CRUD, carga CSV, media pipeline, PLP con facetas Meilisearch, URLs limpias, sitemap/robots, JSON-LD | Navegar 300 SKUs por categoría/marca/necesidad |
| **S3 — PDP y búsqueda** | 6–7 | PDP con variantes, galería, stock/ETA, tabs, búsqueda con autocompletado y sinónimos, relacionados, reseñas (lectura) | Compra descubierta desde búsqueda hasta PDP |
| **S4 — Carrito y checkout UI** | 8–9 | Carrito invitado/autenticado, merge, cupones, wishlist, cuenta básica, checkout una página, direcciones, cotización de envío | Checkout completo hasta "pagar" (sin pasarela) |
| **S5 — Pagos** | 10–11 | Wompi tarjeta/PSE/Nequi, webhooks idempotentes, máquina de estados, contraentrega, emails transaccionales, página de confirmación | Pago aprobado end-to-end en sandbox |
| **S6 — Pedidos y logística** | 12–13 | Admin de pedidos e inventario, tracking público, DIAN, guías con transportadora, conciliación básica | Pedido pagado → factura → guía → entregado |
| **S7 — Marketing y cumplimiento** | 14–15 | Reseñas (escritura + moderación), promociones automáticas, newsletter, consentimiento granular, legales, SEO de contenido, a11y | Flujo completo con consentimiento y reseñas |
| **S8 — Hardening y lanzamiento** | 16–17 | E2E completo, carga, security review, UAT, performance pass, runbook, canary y go-live | Producción con canary al 5% |

### 11.4 Dependencias críticas e hitos

| Hito | Depende de | Fecha objetivo |
|---|---|---|
| H1 — Design Doc aprobado | Comandante + revisores | Fin S0 |
| H2 — Catálogo cargado (≥80%) | Cliente (contenido) | Fin S3 |
| H3 — Sandbox de pagos operativo | Wompi onboarding | Fin S0 |
| H4 — Proveedor DIAN contratado y habilitado | Cliente + proveedor | Fin S2 |
| H5 — Cuenta con transportadora | Cliente | Fin S4 |
| H6 — Checkout con pago real en staging | S5 | Fin S5 |
| H7 — UAT firmado por negocio | Cliente | Fin S8 |
| H8 — Go-live canary | H1–H7 | Semana 17 |

**Ruta crítica:** catálogo (contenido) → PLP/PDP → checkout → pagos → DIAN → UAT.
Un retraso de 2 semanas en el catálogo mueve el lanzamiento 2 semanas.

### 11.5 Criterios de aceptación por sprint (resumen)

| Sprint | Criterio de aceptación |
|---|---|
| S0 | Doc aprobado; prototipo navegable; cuentas sandbox creadas; backlog con historias y criterios |
| S1 | CI verde; deploy automático a staging; Home con LCP <2,5 s en 4G; auth funcional |
| S2 | 300 SKUs cargados; facetas responden <300 ms; URLs limpias indexables; 0 errores de hidratación |
| S3 | Cambio de variante sin recarga; autocompletado <150 ms; búsqueda tolera 1–2 typos; PDP LCP <2,5 s |
| S4 | Carrito persistente entre dispositivos; merge sin duplicados; cupón aplica y se revierte; checkout guarda estado |
| S5 | Pago aprobado/rechazado/pendiente probado; webhook duplicado no duplica pedido; email en <60 s |
| S6 | Factura DIAN emitida en <15 min; guía generada; tracking público correcto; inventario descuenta una sola vez |
| S7 | Reseña verificada solo con compra; consentimiento registra versión; axe sin errores críticos |
| S8 | 20 E2E en verde; k6 sin degradación a 200 rps; pentest básico sin hallazgos críticos; rollback probado |

### 11.6 Estimación total

| Escenario | MVP (semanas) | Versión completa F1+F2 (semanas) | Supuestos |
|---|---|---|---|
| **Optimista** | **13** | 21 | Contenido a tiempo, sin cambios de alcance, integraciones sin fricción |
| **Realista** | **17** | 26 | 1–2 semanas de retraso en contenido o contratos |
| **Pesimista** | **23** | 32 | DIAN/transportadora con demoras, cambios de alcance, rotación de equipo |

La **versión completa** (MVP + Fase 2: BNPL, referidos, reseñas con foto, bundles, WhatsApp
automation, blog CMS, A/B testing) añade **6–8 semanas** con el mismo equipo. Fase 3 (PWA,
personalización, suscripciones) es un proyecto aparte de **8–12 semanas**.

---

## 12. Riesgos, testing y lanzamiento

### 12.1 Riesgos técnicos y de negocio

| # | Riesgo | Prob. | Impacto | Mitigación | Dueño |
|---|---|---|---|---|---|
| R1 | Proveedor DIAN no habilitado a tiempo | Media | Alto | Contratar en S0; plan de contingencia con facturación manual temporal documentado; monitor de facturas pendientes | Comandante |
| R2 | Contenido/fotos incompletos al lanzamiento | Alta | Alto | Carga por CSV + placeholders; congelar catálogo en S7; lanzamiento por tandas de marcas | Cliente |
| R3 | Fricción de onboarding con Wompi | Media | Medio | Sandbox en S0; plan B ePayco ya integrado a nivel de puerto | Backend |
| R4 | Webhooks duplicados o fuera de orden | Media | Alto | Idempotencia en DB + máquina de estados + reconciliación periódica | Backend |
| R5 | Sobreventa por concurrencia de stock | Media | Alto | Reservas con TTL + update condicional + CHECK en DB + alerta de inventario negativo | Backend |
| R6 | Fraude en contraentrega | Alta | Medio | Límites por monto/zona/cliente, OTP, blocklist, scoring, confirmación por WhatsApp | Negocio + Backend |
| R7 | Core Web Vitals en rojo por imágenes | Media | Alto | Pipeline AVIF/WebP, `sizes` correctos, presupuesto en CI, auditoría por release | Frontend |
| R8 | Dependencia de un solo proveedor de pagos | Baja | Alto | Adaptador multi-proveedor + plan B probado en staging | Arquitecto |
| R9 | Incumplimiento Ley 1581 (consentimiento) | Baja | Alto | Revisión de `forge-sentinel`, registro de versiones, política publicada, RNBD | Sentinel |
| R10 | Costos variables de pasarela erosionan margen | Media | Medio | Negociar tarifa por volumen, incentivar PSE/Nequi (menor costo), monitorear take rate | Negocio |
| R11 | Rotación de equipo / conocimiento concentrado | Media | Medio | Documentación, pair programming, ADRs, code review obligatorio | Tech Lead |
| R12 | Picos de tráfico en campañas | Media | Medio | ISR + CDN, pruebas de carga, colas para picos de pago, límites de rate | DevOps |
| R13 | Migración de datos desde planillas | Alta | Medio | Scripts de importación validados, dry-run, conciliación de SKUs y stock | Backend |
| R14 | Devoluciones y retracto mal gestionados | Media | Medio | Flujo documentado, estados, nota crédito, plazos legales visibles | Negocio |

### 12.2 Estrategia de testing

| Nivel | Herramienta | Qué cubre | Gate |
|---|---|---|---|
| **Unitaria** | Vitest | Cálculo de precios, impuestos, cupones, máquina de estados, reglas de stock, validaciones | ≥80% en `packages/core` |
| **Integración** | Vitest + Testcontainers (Postgres/Redis) | Repositorios, transacciones, idempotencia, reservas concurrentes | 100% de flujos críticos |
| **Contrato** | Fixtures de webhooks + schema validation (Zod) | Wompi, ePayco, DIAN, transportadora | Todos los eventos mapeados |
| **E2E** | Playwright (móvil + desktop) | Compra invitado/registrado, tarjeta aprobada/rechazada, PSE (mock), contraentrega, cupón, reembolso, tracking | 20 escenarios en verde |
| **Accesibilidad** | axe-core + revisión manual | Home, PLP, PDP, checkout | 0 violaciones críticas |
| **Performance** | Lighthouse CI + k6 | Presupuesto por plantilla; 200 rps sostenidos | Sin regresión >10% |
| **Seguridad** | `npm audit`, Semgrep, ZAP baseline | Dependencias, secretos, OWASP Top 10 | 0 críticos |
| **Regresión visual** | Playwright screenshots | Design system y plantillas | Aprobación del diseñador |

**Regla:** el que construye escribe los tests; `forge-qualis` valida la estrategia y firma el
release. Ningún sprint se acepta con tests rojos o cobertura en descenso.

### 12.3 Plan de lanzamiento

**T-4 semanas**
- Congelar alcance; UAT con negocio; carga de catálogo definitivo.
- Pruebas de carga y de caos (provider down, Redis down, Meilisearch down).
- Revisión de seguridad (`forge-sentinel`) y de código (`forge-reviewer`).

**T-2 semanas**
- Runbook de operación: pedidos, reembolsos, facturas, incidentes.
- Backups verificados (restore real, no teórico).
- Alertas y dashboards listos; on-call definido.

**T-1 semana**
- Canary interno (empleados) con pagos reales de bajo monto.
- Verificación de correos, WhatsApp, facturas y guías end-to-end.

**Día D**
1. Deploy a producción con feature flag `checkout_enabled = false`.
2. Smoke tests automatizados.
3. Canary 5% del tráfico durante 24 h (métricas: error rate, checkout success, LCP).
4. 25% durante 24 h → 100%.
5. Monitoreo reforzado 72 h.

**Rollback**
- **Código:** rollback instantáneo en Vercel al deployment anterior (<2 min).
- **Flags:** apagar checkout/pagos sin redeploy.
- **DB:** migraciones expand/contract → el código anterior sigue funcionando; nunca migración
  destructiva en el mismo release.
- **Datos:** PITR de Neon a un punto anterior si hay corrupción (RPO ≤5 min, RTO ≤1 h).

**SLOs**

| SLO | Objetivo | Ventana | Alerta |
|---|---|---|---|
| Disponibilidad storefront | 99,9% | 30 días | <99,95% en 1 h |
| Latencia p95 API | <400 ms | 7 días | >600 ms en 15 min |
| Checkout success rate | >97% (excluyendo rechazos del banco) | 24 h | <95% en 1 h |
| Procesamiento de webhook | p95 <60 s | 24 h | cola >100 o edad >5 min |
| Emisión de factura | p95 <15 min | 24 h | >30 min o 3 reintentos |
| Job failures | <1% | 24 h | >5% o DLQ con 10 ítems |

**Postmortem sin culpables** en ≤72 h para todo incidente Sev-1/Sev-2, con acciones
correctivas asignadas y fecha.

---

## 13. Costos operativos estimados

### 13.1 Supuestos

- Tráfico inicial: **20.000–50.000 sesiones/mes**, 70% móvil.
- Pedidos: **500–1.500/mes**, AOV COP 190.000.
- Imágenes: 300–800 SKUs × 6 imágenes ≈ **5.000 originales** (~40 GB con derivados).
- TRM de referencia: **COP 4.000/USD** (*verificar vigente*).
- Precios de proveedores: **referencias de mercado, verificar plan vigente**.

### 13.2 Infraestructura y servicios (mensual)

| Concepto | Plan / supuesto | USD/mes | COP/mes aprox. |
|---|---|---|---|
| Vercel | Pro, 2 seats | 40 | 160.000 |
| PostgreSQL (Neon) | Launch + uso | 25–50 | 100.000–200.000 |
| Redis (Upstash) | Pay-as-you-go | 10–30 | 40.000–120.000 |
| Meilisearch | Cloud Starter (o Hetzner €5) | 30–60 | 120.000–240.000 |
| Cloudflare | Pro + WAF | 25 | 100.000 |
| Cloudflare R2 | 50 GB + operaciones | 3–8 | 12.000–32.000 |
| Worker (Fly.io) | 1 máquina pequeña | 10–20 | 40.000–80.000 |
| Resend | 50k emails | 20 | 80.000 |
| Sentry | Team | 26 | 104.000 |
| Better Stack / logs | Starter | 0–29 | 0–116.000 |
| WhatsApp Cloud API | 1.000–3.000 conversaciones | 20–60 | 80.000–240.000 |
| Facturación electrónica DIAN | Proveedor tecnológico | 40–100 | 160.000–400.000 |
| Dominio + certificados | Amortizado | 3 | 12.000 |
| **Total base** | | **≈250–470** | **≈1,0–1,9 M** |

### 13.3 Costos variables (ejemplo con 1.000 pedidos/mes)

| Concepto | Cálculo | COP/mes | USD/mes aprox. |
|---|---|---|---|
| GMV | 1.000 × COP 190.000 | 190.000.000 | 47.500 |
| Comisión pasarela (≈3,6% efectivo, IVA incluido) | sobre 70% del GMV pagado con tarjeta/PSE | ≈4.700.000 | ≈1.175 |
| Costo BNPL (≈4–6%, F2 con Addi/Sistecrédito) | sobre 15% del GMV | ≈1.100.000–1.700.000 | ≈275–425 |
| Envío (subsidiado parcial) | 1.000 × COP 12.000 neto | ≈12.000.000 | ≈3.000 |
| Empaque | 1.000 × COP 2.000 | 2.000.000 | 500 |
| **Costo variable total** | | **≈20–21 M** | **≈5.000–5.250** |

> El envío y el empaque son costos de operación del negocio, no de la plataforma. La comisión
> de pasarela es el costo tecnológico variable relevante y debe monitorearse como **take rate**.

### 13.4 Costo de oportunidad de las alternativas

| Alternativa | Costo recurrente aproximado | Costo de implementación | Comentario |
|---|---|---|---|
| Shopify (Plus si se requiere checkout propio) | USD 2.000+/mes + apps | Medio | *Verificar vigente*; comisiones adicionales |
| VTEX IO | USD 1.500–3.000+/mes + agencia | Alto | *Verificar*; dependencia de partner |
| Medusa self-host | Infra similar + horas de dev | Alto | Se paga en tiempo de ingeniería |
| WooCommerce | USD 30–100/mes + plugins | Medio | Riesgo de performance y seguridad |
| **Nuestro stack** | **USD 250–470/mes** | **13–17 semanas** | Control total, sin comisión de plataforma |

---

## 14. Decisiones abiertas / preguntas para el cliente

1. **Catálogo y marcas:** ¿tenemos autorización de venta online de todas las marcas y hay
   restricciones de precio mínimo anunciado (MAP) o de canal?
2. **Facturación DIAN:** ¿existe proveedor tecnológico contratado y resolución de numeración
   vigente, o debemos seleccionarlo y tramitarlo nosotros? ¿Quién asume el costo?
3. **Inventario y ERP:** ¿cuántas bodegas/tiendas hay y existe un ERP/POS (Siigo, Alegra,
   World Office, otro) que deba sincronizarse? ¿Es requisito del MVP?
4. **Logística:** ¿hay cuentas corporativas con transportadoras? ¿Se usa agregador
   (Envia.com/MiPaquete) o integración directa? ¿Cómo funciona la recogida en tienda?
5. **BNPL:** ¿hay contrato vigente con Addi y/o Sistecrédito? ¿Qué comisión y plazo de
   liquidación ofrecen? Si no lo hay, arrancamos con el BNPL nativo de Wompi y lo dejamos
   para Fase 2.
6. **Contraentrega:** ¿se habilita desde el día uno? ¿Con qué monto máximo, zonas y política
   de cancelación en ruta?
7. **Contenido:** ¿quién produce fotografía, fichas técnicas, ingredientes y textos legales?
   ¿Hay banco de imágenes y registro sanitario INVIMA por producto?
8. **Presupuesto y fecha:** ¿cuál es el presupuesto aprobado y la fecha objetivo de
   lanzamiento? ¿Quién opera el día a día (admin, atención al cliente, logística) y con qué
   horario?

---

## Anexos

### A. Convenciones de API interna

```
GET    /api/v1/products?category=&brand=&cursor=&limit=
GET    /api/v1/products/:slug
GET    /api/v1/search?q=&facets=
GET    /api/v1/search/suggest?q=
POST   /api/v1/cart/items            (Idempotency-Key opcional)
PATCH  /api/v1/cart/items/:id
POST   /api/v1/orders                (Idempotency-Key obligatorio)
GET    /api/v1/orders/:number?email=
POST   /api/v1/payments              (Idempotency-Key obligatorio)
POST   /api/v1/refunds               (Idempotency-Key obligatorio)
POST   /api/v1/webhooks/:provider    (firma verificada)
```

Errores: `{ "error": { "code": "OUT_OF_STOCK", "message": "...", "details": {...} }, "requestId": "..." }`.

### B. Checklist de go-live

- [ ] Design Doc aprobado y congelado.
- [ ] Catálogo ≥95% con imagen, precio, stock y ficha.
- [ ] Pagos probados en producción con montos reales bajos.
- [ ] Factura DIAN emitida y validada en el portal de la DIAN.
- [ ] Guía y tracking generados con la transportadora real.
- [ ] Emails y WhatsApp con plantillas aprobadas.
- [ ] Legales publicados y consentimiento registrando versión.
- [ ] Sitemap enviado a Search Console; robots correcto.
- [ ] Core Web Vitals en verde en staging móvil.
- [ ] Backups y restore probados.
- [ ] Runbook, on-call y alertas activas.
- [ ] Rollback ejecutado en un simulacro.

### C. Glosario

| Término | Significado |
|---|---|
| **SKU** | Unidad de inventario vendible (variante) |
| **PDP / PLP** | Product Detail Page / Product Listing Page |
| **AOV** | Average Order Value (ticket promedio) |
| **CVR** | Conversion Rate |
| **BNPL** | Buy Now, Pay Later: nativo de Wompi (SU+Pay / Compra y Paga Después) y, en Fase 2, Addi y Sistecrédito |
| **SAQ-A** | Cuestionario de autoevaluación PCI-DSS para comercios que delegan el manejo de tarjeta |
| **CUFE** | Código Único de Factura Electrónica (DIAN) |
| **PSE** | Pago Seguro en Línea (transferencia bancaria) |
| **COD** | Cash on Delivery (contraentrega) |
| **Outbox** | Patrón de publicación confiable de eventos |
| **ISR / PPR** | Incremental Static Regeneration / Partial Prerendering |

### D. Referencias internas

- `AGENTS.md` — Constitución de APEX FORGE y stack Digitaldevs.
- Skill `apex-forge-design` — plantilla y proceso de Design Doc.
- Benchmark funcional: tienda Recamier (VTEX IO), analizado por el Comandante.
- Ley 1581 de 2012, Decreto 1377 de 2013, Ley 1480 de 2011.
- Documentación de Wompi, ePayco, Addi, Sistecrédito, DIAN (UBL 2.1) — *consultar versión vigente*.

---

## Aprobaciones

| Rol | Nombre | Estado | Fecha |
|---|---|---|---|
| Autor (Staff Engineer) | `forge-architect` | ✅ Draft entregado | 2026-11-11 |
| Comandante / Decisor | `apex-forge` | ⏳ Pendiente | — |
| Review de diseño | `forge-reviewer` | ⏳ Pendiente | — |
| Seguridad y datos | `forge-sentinel` | ⏳ Pendiente | — |
| Testing y release | `forge-qualis` | ⏳ Pendiente | — |
| Infraestructura y costos | `forge-infra` | ⏳ Pendiente | — |

> **Siguiente paso:** revisión del documento en sesión de diseño (60 min). Si se aprueba, se
> congela la versión 1.0 y el Comandante genera el plan de tareas del Sprint 0.



