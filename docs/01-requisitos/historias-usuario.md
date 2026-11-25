# Historias de Usuario y Planificación Scrum — Adriana Tienda

| Campo | Valor |
|---|---|
| **Proyecto** | Adriana Tienda — e-commerce de belleza (facial, cabello, cuerpo), Colombia |
| **Autor** | `forge-architect` (Staff Engineer, APEX FORGE) |
| **Estado** | Draft — backlog inicial para refinamiento con el Comandante `apex-forge` |
| **Fecha** | 23 de noviembre de 2026 |
| **Metodología** | **Scrum**: sprints de 2 semanas, eventos y Definition of Done al final de este documento |
| **Decisiones aplicadas** | [decisiones-comandante.md](../02-arquitectura/decisiones-comandante.md) — C-01 (lotes/FEFO), C-02 (centavos), C-03 (`OPS-09` Sprint 6 + gate E2E), C-04/C-05 (auth y rate limits), C-11 (Fibonacci), C-12 (enlaces) |
| **Documentos relacionados** | [requisitos-funcionales.md](./requisitos-funcionales.md), [design-doc.md](../02-arquitectura/design-doc.md), [backlog-inicial.md](../05-scrum/backlog-inicial.md), [plan-sprints.md](../05-scrum/plan-sprints.md) |

> **Precedencia:** manda [decisiones-comandante.md](../02-arquitectura/decisiones-comandante.md); el [design-doc.md](../02-arquitectura/design-doc.md) (Draft) absorbe al `DESIGN_DOC.md` v1.0 de la raíz (C-12).

## Convenciones

- **Formato:** *Como `<actor>` quiero `<acción>` para `<beneficio>`.*
- **Estimación:** puntos de historia **Fibonacci estricto (1, 2, 3, 5, 8, 13)**; se prohíben los valores 6 y 11 (C-11; recálculo del backlog completo a cargo de `forge-qualis`). Un punto de historia ≈ 1 día de trabajo de un par de ingenieros.
- **Sprint sugerido:** orientativo; el Comandante reordena en la Planificación según dependencias y disponibilidad del equipo.
- **CA:** criterios de aceptación cortos y verificables. Todo story `M` debe pasar a *Done* con tests en verde.
- **Actores:** Cliente (comprador final), Vendedor tienda (operador de una de las 2 sedes), Admin (operación central), Superadmin (seguridad y configuración), Sistema (jobs/automatizaciones).

> **Decisión (C-01):** las historias de **sucursales, lotes e inventario (EP-05)** son dependencia crítica del checkout: se implementan **antes** de los stories de pago. `INV-01` (lotes/FEFO) precede a `HU-015` y `HU-016`; sin saldo FEFO por `site_id` no se puede prometer retiro ni evitar sobreventa.

> **Decisión (C-03):** `OPS-09 — Registro de venta presencial` (8 pts, **Sprint 6**, depende de `INV-01`) está en el MVP; su E2E de pedido POS es **gate de release**. Sustituye al antiguo `HU-019` (mismo alcance, sin duplicar historia).

---

## Mapa de épicas

| ID | Épica | Historias | Puntos | Objetivo de negocio |
|---|---|---:|---:|---|
| EP-01 | Catálogo y descubrimiento | 4 | 23 | Vitrina sólida y búsqueda que convierte |
| EP-02 | Carrito y checkout | 4 | 19 | Camino corto de compra en móvil |
| EP-03 | Pagos | 3 | 21 | Pago fácil, sin dolor y sin PCI |
| EP-04 | Pedidos y logística | 3 | 13 | Control de la operación y posventa |
| EP-05 | Sucursales, lotes e inventario (**crítico**) | 6 | 42 | 2 `sites` unificadas, lotes FEFO, retiro y venta POS (`OPS-09`) |
| EP-06 | Cuenta de cliente | 2 | 10 | Datos propios y consentimiento |
| EP-07 | Administración | 3 | 15 | Operación gobernada y auditada |
| EP-08 | Marketing y contenido | 2 | 8 | Marca, campañas y recuperación |
| **Total** | | **27** | **151** | Núcleo de diseño; el backlog completo de entrega es un inventario distinto (design-doc §4.7) |

---

## EP-01 — Catálogo y descubrimiento

### HU-001 — Publicar catálogo por categorías y marcas
**Como** Admin de catálogo **quiero** crear marcas, categorías de 2 niveles y productos con variantes **para** publicar el surtido real de la tienda con URLs limpias y SEO.
- **CA:** SKU único por variante; producto no se publica sin imagen y variante; breadcrumb y canonical coherentes; cambio de precio invalida caché por evento.
- **RF relacionados:** RF-001..RF-004. **Puntos:** 8. **Sprint:** 1–2.

### HU-002 — Comprar por necesidad
**Como** Cliente **quiero** filtrar el catálogo por necesidad, tipo de cabello y otros atributos **para** encontrar el producto adecuado sin conocer marcas.
- **CA:** chips del prototipo ("Caspa", "Rizos", "Piel sensible"…) mapean a atributos gobernados; facetas combinables; los filtros se reflejan en la URL.
- **RF relacionados:** RF-005, RF-011, RF-012. **Puntos:** 5. **Sprint:** 2.

### HU-003 — Encontrar productos con búsqueda tolerante
**Como** Cliente **quiero** escribir "shampoo" o "shampú" y ver sugerencias y resultados correctos **para** no perder la compra por un error de escritura.
- **CA:** autocompletado con debounce 150 ms y teclado; sinónimos en español; tolerancia a errores; estado vacío con alternativas; fallback a Postgres FTS si el índice falla.
- **RF relacionados:** RF-009, RF-010, RF-014. **Puntos:** 5. **Sprint:** 2–3.

### HU-004 — Ver ficha de producto confiable
**Como** Cliente **quiero** ver precio con IVA, variantes, stock real, ETA y campos de registro sanitario cuando aplique **para** decidir con información completa.
- **CA:** cambiar variante actualiza precio, imagen, disponibilidad y `?variant=` sin recargar; badge de descuento solo si el precio anterior es verificable; LCP precargado; CLS 0.
- **RF relacionados:** RF-006..RF-008, RF-060. **Puntos:** 5. **Sprint:** 2.

## EP-02 — Carrito y checkout

### HU-005 — Carrito persistente y sin fricción
**Como** Cliente invitado o registrado **quiero** que mi bolsa se conserve y se fusione al iniciar sesión **para** no perder productos seleccionados.
- **CA:** persistencia en cookie firmada; merge sin duplicados; stepper limitado al disponible de la sede de fulfillment; `aria-live` al agregar.
- **RF relacionados:** RF-015..RF-017. **Puntos:** 5. **Sprint:** 3.

### HU-006 — Elegir cómo recibir mi pedido
**Como** Cliente **quiero** elegir envío a domicilio o recoger en una de las dos sedes, viendo disponibilidad real y horarios, **para** saber exactamente cuándo y dónde tendré mi compra.
- **CA:** checkout de una página con pasos Contacto → Entrega → Pago; departamento → ciudad dependientes; sede de fulfillment asignada; si no hay stock completo se ofrece split/alternativa antes de cobrar.
- **RF relacionados:** RF-020..RF-023. **Puntos:** 8. **Sprint:** 3–4 (depende de EP-05).

### HU-007 — Pagar sin errores ni ambigüedad
**Como** Cliente **quiero** un checkout con validación inline y un único botón de pago claro **para** completar la compra sin confusión en móvil.
- **CA:** foco automático en el primer campo inválido; sin `alert()`; resumen sticky (colapsable en móvil) sincronizado; 0 errores de consola.
- **RF relacionados:** RF-024. **Puntos:** 3. **Sprint:** 4.

### HU-008 — Confirmación y prueba de compra
**Como** Cliente **quiero** recibir un número de pedido persistente, el ETA y mi factura cuando esté lista **para** tener constancia y poder rastrear.
- **CA:** número en DB (no aleatorio de `sessionStorage`); ver RF-025 y RF-075; botón de factura deshabilitado con mensaje hasta que DIAN responda.
- **RF relacionados:** RF-025, RF-075. **Puntos:** 3. **Sprint:** 6.

## EP-03 — Pagos

### HU-009 — Pagar con métodos colombianos
**Como** Cliente **quiero** pagar con tarjeta, PSE, Nequi, Daviplata o efectivo en corresponsales **para** usar el método que ya uso en Colombia.
- **CA:** redirección a checkout hospedado de Wompi; sin campos de tarjeta en nuestro dominio; todos los métodos probados en sandbox; capa de adaptador implementada.
- **RF relacionados:** RF-026, RF-033. **Puntos:** 8. **Sprint:** 5.

### HU-010 — Pagar en cuotas o contraentrega
**Como** Cliente **quiero** ver cuotas con SU+Pay o pagar en efectivo al recibir **para** comprar aunque no tenga tarjeta de crédito.
- **CA:** simulador de cuotas con costo total visible; COD con monto/zona/OTP; COD no emite factura hasta cobro.
- **RF relacionados:** RF-027, RF-028. **Puntos:** 5. **Sprint:** 5–6.

### HU-011 — Pagos seguros y reconciliados
**Como** Sistema **quiero** verificar webhooks firmados, deduplicarlos y reconciliar diariamente **para** que un pago nunca se pierda ni se cuente dos veces.
- **CA:** firma inválida → 401 + alerta; `unique(provider, event_id)`; evento viejo no retrocede el estado; job diario de conciliación con reporte de diferencias.
- **RF relacionados:** RF-029..RF-032. **Puntos:** 8. **Sprint:** 5–6.

## EP-04 — Pedidos y logística

### HU-012 — Seguir mi pedido
**Como** Cliente **quiero** consultar el estado con mi número de pedido y correo **para** saber si viene en camino o está listo para retiro sin llamar.
- **CA:** acceso público solo con ambos datos; sin fuga de datos con correo erróneo; línea de avance distinta para envío y para retiro.
- **RF relacionados:** RF-037. **Puntos:** 3. **Sprint:** 6.

### HU-013 — Operar el pedido desde preparación a entrega
**Como** Admin de operación **quiero** cambiar el estado del pedido con transiciones permitidas y generar guías **para** mantener el control sin errores ni saltos ilegales.
- **CA:** máquina de estados con historial inmutable; picking list por `site_id`; webhook de transportadora → `DELIVERED`; transición ilegal bloqueada; `RETURN_REJECTED` terminal.
- **RF relacionados:** RF-034, RF-035, RF-038. **Puntos:** 5. **Sprint:** 6–7.

### HU-014 — Devoluciones y retracto
**Como** Cliente **quiero** solicitar retracto dentro de los 5 días hábiles **para** ejercer mis derechos bajo la Ley 1480.
- **CA:** formulario solo dentro de plazo; aprobación manual; nota crédita DIAN y reembolso en pasarela; transiciones `RETURN_REQUESTED → REFUNDED` o `RETURN_REQUESTED → RETURN_REJECTED` (terminal), nunca `RETURN_REQUESTED → DELIVERED` (C-08).
- **RF relacionados:** RF-039, RF-040, RF-076. **Puntos:** 5. **Sprint:** 7.

## EP-05 — Sucursales, lotes e inventario multi-sede (**CRÍTICO**)

### INV-01 — Registrar lotes y seleccionar existencias con FEFO
**Como** Admin de inventario **quiero** registrar lotes por `site_id` con `expiry_date` y dejar que el sistema elija el primero en vencer **para** garantizar trazabilidad y no vender productos próximos a vencerse.
- **CA:** `inventory_lots(lot_id, site_id, expiry_date, on_hand, reserved)` es la fuente de verdad y `inventory_by_site` solo su proyección actualizada en la misma transacción; FEFO ordena por `expiry_date ASC` omitiendo lotes bloqueados; aviso a 90 días y bloqueo a 15 días (RF-078..RF-081); test unitario de selección y job diario de reconciliación de la proyección.
- **RF relacionados:** RF-049, RF-078..RF-081. **Puntos:** 8. **Sprint:** 2 (dependencia de HU-015, HU-016 y `OPS-09`).

### HU-015 — Ver y ajustar stock por sede
**Como** Vendedor tienda **quiero** ver y ajustar el inventario de mi sede con motivo obligatorio **para** que el stock mostrado al cliente sea real.
- **CA:** `disponible = on_hand - reserved` por **lote y `site_id`** (proyección `inventory_by_site`); restricción DB `0 ≤ reserved ≤ on_hand` en lote y proyección; todo ajuste genera `inventory_movement` inmutable con actor y `site_id`; mi `site_id` es el único que veo.
- **RF relacionados:** RF-048, RF-049, RF-057..RF-059. **Puntos:** 8. **Sprint:** 2–3.

### HU-016 — No vender lo que no hay (reservas)
**Como** Sistema **quiero** reservar stock por sede al crear el pedido y liberarlo si expira **para** evitar sobreventa con dos sedes y canales simultáneos.
- **CA:** reserva **FEFO sobre `inventory_lots`** en la misma transacción del pedido (`PENDING_PAYMENT`), con actualización de `inventory_by_site` en esa TX; TTL 30 min; `UPDATE` condicional atómica por `lot_id` + `site_id`; test de concurrencia: 100 intentos web+POS por la última unidad → 1 sola reserva; expiración libera `reserved`.
- **RF relacionados:** RF-050, RF-051, RF-079. **Puntos:** 8. **Sprint:** 3–4 (depende de `INV-01`; bloqueante de HU-006).

### HU-017 — Retirar en tienda (click & collect)
**Como** Cliente **quiero** recoger mi pedido pagado en la sede que elegí con un código **para** evitar costos de envío y obtener mi compra el mismo día.
- **CA:** reserva FEFO en la `site_id` elegida; código de retiro; flujo canónico `PAID → PREPARING → PACKED → READY_FOR_PICKUP → DELIVERED` (etiquetas UI en español en [design-doc.md §4.4.1](../02-arquitectura/design-doc.md)); `READY_FOR_PICKUP` es `orders.status`, no un derivado de `store_pickups.status`; el vendedor confirma con el código; se notifica al cliente al quedar listo.
- **RF relacionados:** RF-052, RF-053, RF-070. **Puntos:** 5. **Sprint:** 5.

### HU-018 — Transferir stock entre sedes
**Como** Admin de operación **quiero** transferir productos entre las dos sedes con trazabilidad **para** surtir una sede sin perder control del inventario.
- **CA:** estados canónicos `DRAFT → IN_TRANSIT → RECEIVED/CANCELLED`; descuento de origen e incremento de `in_transit`, luego incremento de destino; movimientos balanceados; audita quién autoriza y quién recibe.
- **RF relacionados:** RF-055. **Puntos:** 5. **Sprint:** 4–5.

### OPS-09 — Registro de venta presencial (antes HU-019)
**Como** Vendedor tienda **quiero** registrar una venta presencial con el mismo catálogo y precios, identificando al cliente, **para** que su compra en tienda aparezca en su historial junto con sus compras web.
- **CA:** pedido con `channel = POS` y `site_id` del vendedor; descuenta el **lote FEFO** de esa sede; importes en `*_cents` e IVA a 1900 bp iguales a la web; búsqueda de cliente por correo/documento unifica pedidos de todos los canales y sedes; formulario usable en tablet con sesión de 8 h; **el escenario E2E de pedido POS es gate de release** (design-doc §7).
- **RF relacionados:** RF-036, RF-041, RF-056. **Puntos:** 8. **Sprint:** **6** (depende de `INV-01`; C-03).

## EP-06 — Cuenta de cliente

### HU-020 — Crear cuenta y acceder
**Como** Cliente **quiero** registrarme con correo o Google y recuperar mi contraseña **para** ver mis pedidos y guardar mis datos.
- **CA:** OAuth sin exponer tokens al cliente; token de reset de un solo uso y 30 min; bloqueo tras 5 intentos fallidos en 15 min por IP+cuenta con backoff y CAPTCHA (C-05); sesión en cookie `httpOnly+Secure+SameSite=Strict` con excepción `Lax` en el retorno de Wompi (C-04).
- **RF relacionados:** RF-042, RF-043, RF-044. **Puntos:** 5. **Sprint:** 3.

### HU-021 — Gestionar mis datos y consentimientos
**Como** Cliente **quiero** ver y revocar mis consentimientos y gestionar mis datos personales **para** cumplir mis derechos bajo la Ley 1581.
- **CA:** consentimiento versionado con fecha y canal; revocar detiene campañas en ≤ 24 h; transaccionales no dependen de marketing; supresión anonimiza PII conservando la factura 5 años.
- **RF relacionados:** RF-045..RF-047, RF-077. **Puntos:** 5. **Sprint:** 7.

## EP-07 — Administración

### HU-022 — Panel con roles y ámbito de sede
**Como** Superadmin **quiero** asignar roles (Vendedor, Admin, Superadmin) y sede a cada operador **para** que cada uno vea solo lo que debe ver.
- **CA:** Vendedor ve únicamente su `site_id`; Admin ve todas; escalado de roles solo por Superadmin y auditado; **MFA obligatoria para Admin/Superadmin**, Vendedor con sesión de tablet de 8 h y MFA en Fase 2 (C-04); `Bearer` solo servidor a servidor (C-04); `/admin/**` bloqueado sin sesión.
- **RF relacionados:** RF-062, RF-066, RNF-015. **Puntos:** 5. **Sprint:** 1 y 7.

### HU-023 — Operación y auditoría
**Como** Admin **quiero** gestionar pedidos, cupones y reseñas con un registro inmutable de cada acción **para** operar con control y poder investigar incidentes.
- **CA:** filtros por estado/sede/canal/fecha; solo transiciones legales; `audit_logs` append-only con antes/después, actor, IP y `requestId`; exportables CSV con PII protegida.
- **RF relacionados:** RF-063, RF-064, RF-067, RF-068. **Puntos:** 5. **Sprint:** 7.

### HU-024 — Facturación automática
**Como** Admin financiero **quiero** que cada pedido pagado genere factura DIAN y nota crédito cuando corresponda **para** cumplir con la DIAN sin trabajo manual.
- **CA:** emisión p95 < 15 min; reintentos con backoff; cero pedidos pagados sin factura al cierre; nota crédito referencia la factura original.
- **RF relacionados:** RF-074..RF-076, RNF-026. **Puntos:** 5. **Sprint:** 6–7.

## EP-08 — Marketing y contenido

### HU-025 — Marca y contenido editable
**Como** Admin de contenido **quiero** gestionar banners, páginas legales, blog y FAQs con los tokens de marca **para** mantener una imagen sólida sin depender del código.
- **CA:** paleta verde `#1E644C` / dorado `#B8895A`, tipografías Fraunces e Inter del prototipo; cambios publicados sin deploy; textos legales versionados.
- **RF relacionados:** RF-007, RF-008, RF-077. **Puntos:** 3. **Sprint:** 7–8.

### HU-026 — Recuperar carritos y medir
**Como** Responsable de marketing **quiero** enviar cupones de recuperación con consentimiento y medir el embudo **para** mejorar la conversión con datos.
- **CA:** GA4 + Consent Mode v2; eventos de embudo por dispositivo y canal; envío solo con consentimiento vigente y frecuencia limitada; dashboard mínimo.
- **RF relacionados:** RF-071, RF-073. **Puntos:** 5. **Sprint:** 8.

---

## Scrum: marco de trabajo acordado

> **Decisión:** se trabaja en **sprints de 2 semanas** con roles y eventos definidos. El backlog se refina en el segundo jueves de cada sprint; el Comandante (`apex-forge`) actúa como Product Owner delegado y prioriza junto al cliente.

| Evento | Frecuencia | Duración (equipo ~4,7 FTE) | Salida |
|---|---|---|---|
| Sprint | 2 semanas | 10 días hábiles | Incremento potencialmente liberable |
| Sprint Planning | Inicio de sprint | 2 h | Sprint Goal + backlog del sprint |
| Daily Scrum | Diario | 15 min | Impedimentos y ajuste del plan |
| Refinement | Jueves de la segunda semana | 1,5 h | Historias claras, estimadas y con CA |
| Sprint Review | Fin de sprint | 1 h | Demo al cliente + feedback |
| Retrospectiva | Fin de sprint | 1 h | Acciones de mejora con dueño |

**Roles:** Product Owner (Comandante + cliente) · Scrum Master (rota entre ingenieros; facilita, no decide) · Development Team (frontend, backend, QA/DevOps, contenido del cliente a tiempo parcial).

### Definition of Done (DoD) — aplica a toda historia

1. Criterios de aceptación verificados y demo mostrada.
2. Código en inglés, TypeScript strict, linter y formatter en verde.
3. Tests unitarios/integración nuevos o actualizados; cobertura no disminuye.
4. E2E de flujo crítico en verde cuando aplique; axe sin violaciones críticas.
5. `forge-reviewer` dio LGTM; `forge-sentinel` aprobó si toca datos, auth o pagos.
6. Documentación/ADR actualizado si la decisión cambió.
7. Sin regresión de Core Web Vitals ni del presupuesto de JS.
8. Feature flag o migración reversible lista; despliegue a staging exitoso.

> **Pregunta abierta `DD-Q10`** (ID canónico en [design-doc.md §10](../02-arquitectura/design-doc.md)): ¿quién del cliente ejerce formalmente el rol de Product Owner y está disponible para Sprint Review cada dos semanas? Responde: Cliente (S0).

> **Pregunta abierta `DD-Q14`** (ID canónico en [design-doc.md §10](../02-arquitectura/design-doc.md)): ¿el equipo acepta **151 puntos** como núcleo de diseño para 8 sprints (~19 puntos/sprint), o preferimos un MVP más corto recortando EP-08 y parte de EP-07? Responde: Comandante + Cliente (Planificación S0). El backlog completo de entrega (**42 historias / 280 puntos**, cerrado por C-11) se gestiona aparte.

## Trazabilidad

| Artefacto | Relación con este documento |
|---|---|
| [requisitos-funcionales.md](./requisitos-funcionales.md) | RF implementados por cada historia, incluidos RF-078..RF-081 (lotes/FEFO) |
| [design-doc.md §4.7](../02-arquitectura/design-doc.md) | Núcleo de diseño (27 historias / 151 pts) frente al backlog completo de entrega |
| [plan-sprints.md](../05-scrum/plan-sprints.md) | Planificación de entrega; `OPS-09` debe figurar en Sprint 6 con su gate E2E |
| [decisiones-comandante.md](../02-arquitectura/decisiones-comandante.md) | C-01..C-12, fuente de verdad ante cualquier contradicción |
