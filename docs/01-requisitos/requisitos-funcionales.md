# Requisitos Funcionales — Adriana Tienda

| Campo | Valor |
|---|---|
| **Proyecto** | Adriana Tienda — e-commerce de belleza (facial, cabello, cuerpo) para Colombia |
| **Fase** | Fase 1 — Diseño (antes de escribir código de producción) |
| **Autor** | `forge-architect` (Staff Engineer, APEX FORGE) |
| **Estado** | Draft — pendiente de aprobación del Comandante `apex-forge` |
| **Fecha** | 23 de noviembre de 2026 |
| **Decisiones aplicadas** | [decisiones-comandante.md](../02-arquitectura/decisiones-comandante.md) — C-01 (lotes/FEFO), C-02 (centavos), C-03 (POS `OPS-09`), C-04/C-05 (auth y rate limits), C-07 (`DD-Qn`), C-08 (estados canónicos), C-11/C-12 |
| **Documentos relacionados** | [design-doc.md](../02-arquitectura/design-doc.md), [diagramas.md](../02-arquitectura/diagramas.md), [requisitos-no-funcionales.md](./requisitos-no-funcionales.md), [historias-usuario.md](./historias-usuario.md) |

> **Precedencia:** en caso de duda, manda [decisiones-comandante.md](../02-arquitectura/decisiones-comandante.md) y el [design-doc.md](../02-arquitectura/design-doc.md) (Draft), que absorbe al `DESIGN_DOC.md` v1.0 de la raíz (C-12).

## Convenciones de lectura

**Prioridad MoSCoW** (aplicada al MVP):

| Letra | Significado | Regla práctica |
|---|---|---|
| **M** — Must | Imprescindible | Sin esto no se lanza. Bloqueante de go-live. |
| **S** — Should | Importante | Se hace si el sprint lo permite; su ausencia degrada la experiencia, no bloquea. |
| **C** — Could | Deseable | Mejora marginal. Se atiende después de los Must y Should. |
| **W** — Won't (esta entrega) | Fuera de alcance del MVP | Documentado para evitar *scope creep*. Ver `alcance-y-no-objetivos.md`. |

**Criterio de aceptación (CA):** condición observable y verificable en QA. Todo RF **M** debe tener al menos un CA cubierto por un test automatizado o por UAT firmada por el negocio.

> **Decisión (C-02):** los precios se muestran **siempre en COP con IVA (19%) incluido** y todos los importes se almacenan como **`BIGINT` en centavos** (`*_cents`). El IVA se expresa como **`vat_rate_bps = 1900`** (*basis points*) y se desglosa por línea de pedido con `base_cents = round_half_up(total_line_cents / 1.19)` y `iva_cents = total_line_cents − base_cents`; la suma cuadra exactamente con el total y se reporta en la factura electrónica. Ver RF-074.

> **Decisión (C-01):** la fuente de verdad es **`inventory_lots(lot_id, site_id)`** con selección **FEFO** (2 sedes físicas; «sucursal» es solo etiqueta UI, el identificador técnico es `site_id`/`sites`). `inventory_by_site(variant_id, site_id)` es **solo una proyección derivada**, actualizada en la misma transacción; no existe un stock global escribible. Aviso al operador a 90 días del vencimiento y bloqueo de venta a 15 días. Ver RF-048..RF-061 y RF-078..RF-081.

> **Convención de estados (C-08):** los nombres en español son **etiquetas UI**; los identificadores canónicos viven en `orders.status` y son `PENDING_PAYMENT`, `PAID`, `PREPARING`, `PACKED`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `REFUNDED`, `RETURN_REQUESTED` y `RETURN_REJECTED`. Tabla única de mapeo «etiqueta UI → identificador canónico»: [design-doc.md §4.4.1](../02-arquitectura/design-doc.md). `RETURN_REJECTED` es terminal; no existe la transición `RETURN_REQUESTED → DELIVERED`.

---

## 1. Catálogo (RF-001 a RF-008)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-001 | Jerarquía de categorías de 2 niveles (p. ej. Cabello › Tratamientos) con URLs limpias y *slug* único. | M | Se pueden crear, editar y ordenar categorías; el breadcrumb refleja la jerarquía; `/cabello/tratamientos` devuelve 200 y canonical propio. |
| RF-002 | Gestión de marcas con logo, descripción y metadatos SEO. | M | Alta de marca con campos obligatorios validados; el logo se sirve desde CDN en AVIF/WebP; ficha de marca enlazable. |
| RF-003 | Alta de productos con nombre, SKU único, descripción, ingredientes, modo de uso, registro INVIMA cuando aplique y state (borrador/activo/archivado). | M | SKU único a nivel de variante; un producto no se publica sin al menos una variante y una imagen; campos de registro sanitario visibles en PDP cuando existan. |
| RF-004 | Variantes por tamaño y tono con precio, SKU, imagen y stock propios. | M | Cambiar de variante en PDP actualiza precio, imagen, disponibilidad y URL `?variant=` sin recargar; el precio de tarjeta corresponde a la variante de entrada con stock. |
| RF-005 | Atributos filtrables gobernados (tipo de cabello, necesidad/preocupación, acabado, volumen ml, tono). | M | Los atributos se administran desde el panel; solo valores autorizados aparecen como filtros; el catálogo del prototipo usa "comprar por necesidad" como eje principal. |
| RF-006 | Imágenes optimizadas (AVIF/WebP, `srcset`, dimensiones explícitas) y galería con thumbnail. | M | Todas las imágenes tienen ancho/alto declarado (CLS 0); se genera derivado AVIF; la imagen LCP se precarga en PDP. |
| RF-007 | Badges de marca: Nuevo, Bestseller y descuento real con precio anterior verificable. | S | El badge de descuento solo aparece si `precioAnterior > precioActual`; se muestra tachado el precio anterior. |
| RF-008 | Relacionados por categoría/necesidad y contenido editorial en PDP (tabs Detalles, Modo de uso, Ingredientes, Especificaciones). | S | Al menos 4 relacionados por producto; tabs navegables con teclado (Flechas/Home/End) y ARIA correcto. |

## 2. Búsqueda y filtros (RF-009 a RF-014)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-009 | Búsqueda de texto sobre nombre, marca, SKU y sinónimos en español (`champú ↔ shampoo`, `sérum ↔ serum`). | M | Consulta "shampoo" devuelve productos "champú"; tolerancia a errores tipográficos; resultados ordenados por relevancia. |
| RF-010 | Autocompletado con sugerencias de producto, marca y consultas populares, navegable por teclado. | M | Debounce 150 ms; `ArrowDown/Up` + `Enter` funciona; `Esc` cierra; accesible con lector de pantalla. |
| RF-011 | Facetas en PLP: marca, precio, necesidad, tipo de cabello, calificación, disponibilidad y tono. | M | Filtros combinables; contador de resultados se actualiza; distribución de faceta servida por el índice de búsqueda. |
| RF-012 | Filtros reflejados en la URL (segmentos/query) para ser indexables y compartibles. | M | Copiar la URL de una PLP filtrada y abrirla en otro navegador reproduce exactamente los filtros. *(El prototipo S0 aún no lo hace.)* |
| RF-013 | Orden por relevancia, precio ↑/↓, novedad y mejor calificados. | M | Cambiar orden actualiza resultados y conserva filtros activos. |
| RF-014 | Estado vacío con alternativas: sugerencias de corrección y productos populares de la categoría. | S | Nunca se muestra un listado vacío sin al menos 3 alternativas clicables. |

## 3. Carrito (RF-015 a RF-019)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-015 | Carrito persistente para invitado (cookie firmada) y para usuario autenticado. | M | El carrito sobrevive a recarga; al iniciar sesión se fusiona con el carrito de la cuenta sin duplicar SKUs. |
| RF-016 | Agregar, cambiar cantidad y eliminar ítems con validación de stock **de la sede/fulfillment seleccionado**. | M | El stepper no supera el disponible; si el stock cae por debajo de la cantidad, se avisa y se ajusta antes de pagar. |
| RF-017 | Quick-add desde PLP y barra de compra sticky en PDP móvil. | M | Agregar desde tarjeta actualiza contador, subtotal y barra de envío gratis sin navegar; anuncio `aria-live`. |
| RF-018 | Barra de progreso hacia envío gratis (umbral COP 150.000) y cálculo de envío estimado por ciudad. | S | El umbral y el mensaje son configurables por admin; el cálculo usa tarifas vigentes o regla fija documentada. |
| RF-019 | Aplicación de un cupón a la vez con validación de vigencia, mínimo y acumulabilidad. | S | Cupón inválido muestra error inline; `ADRIANA10` y `ENVIOGRATIS` del prototipo se migran como datos reales, no código. |

## 4. Checkout (RF-020 a RF-025)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-020 | Checkout de una sola página con pasos Contacto → Entrega → Pago y resumen sticky (colapsable en móvil). | M | No hay cambio de URL entre pasos; el resumen refleja carrito, descuento, envío, IVA y total en tiempo real. |
| RF-021 | Dirección dependiente departamento → ciudad, con barrio e indicaciones. | M | Listado completo de Colombia; cambiar departamento reinicia ciudad; campos obligatorios validados inline. |
| RF-022 | Modalidad **Recoger en tienda (click & collect)**: elegir sucursal, ver horario y disponibilidad real de esa sede. | M | Solo se pueden elegir sedes con stock reservable para todas las variantes; la confirmación muestra dirección, horario y código de retiro. |
| RF-023 | Modalidad **Envío a domicilio** con selección de sede de despacho (fulfillment) y ETA por ciudad. | M | El sistema propone sede de fulfillment con stock; si una sede no cubre todo el pedido, ofrece split o alternativa clara antes de pagar. |
| RF-024 | Validación inline por campo sin `alert()` y foco automático en el primer campo inválido. | M | Pagar con pasos incompletos salta al primer error y enfoca el input; `aria-invalid="true"`. *(Ya corregido en el prototipo, ronda 2.)* |
| RF-025 | Confirmación de pedido con número, resumen, ETA, método de entrega y acciones "Rastrear" / "Descargar factura" (cuando ya emitida). | M | El número de pedido es persistente en DB (no aleatorio de `sessionStorage`); la factura se habilita cuando el webhook de pago aprueba y DIAN responde. |

## 5. Pagos (RF-026 a RF-033)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-026 | Pasarela primaria **Wompi** con checkout hospedado/redirección: tarjeta crédito/débito, PSE, Nequi, Daviplata, Botón Bancolombia y efectivo en corresponsales. | M | El checkout redirige a dominio de Wompi; la aplicación nunca recibe PAN; se admiten todos los métodos listados en sandbox y producción. |
| RF-027 | BNPL nativo de Wompi (SU+Pay / Compra y Paga Después) con simulador de cuotas. | S | El simulador muestra cuota, número de pagos y costo total antes de redirigir; Addi/Sistecrédito directos quedan fuera del MVP. |
| RF-028 | **Contraentrega (COD)** como método propio con reglas de riesgo (monto máximo, zonas, cliente, OTP). | S | Pedido COD arranca en `PENDING_PAYMENT` con método `COD` (C-08); no se emite factura hasta el cobro confirmado → `PAID`; supera el monto máximo → se bloquea. |
| RF-029 | Webhooks firmados e idempotentes: verificación de firma, deduplicación por `(proveedor, event_id)` y procesamiento asíncrono. | M | Un webhook duplicado responde 200 sin reprocesar; un evento viejo no retrocede un pedido pagado; firma inválida → 401 y alerta. |
| RF-030 | El pedido **nunca** se confirma por la redirección del navegador, solo por webhook verificado o conciliación. | M | Volver al sitio con `?status=approved` sin webhook no cambia el estado a `PAID`. |
| RF-031 | Reembolsos totales y parciales con nota crédita DIAN y reversión en pasarela. | S | El reembolso genera `REFUND` en Wompi y nota crédito; el estado del pedido pasa a `REFUNDED` solo tras confirmación. |
| RF-032 | Conciliación diaria de transacciones contra el proveedor con detección de pagos aprobados no contabilizados. | M | Job diario produce reporte de diferencias; toda diferencia abre alerta y fija `reviewRequired = true` en `payments` (C-08: sin estados duplicados en `orders.status`). |
| RF-033 | Capa de abstracción de pagos (puerto/adaptador) que permita activar **ePayco como plan B** sin tocar checkout ni pedidos. | M | Existe un único contrato `createIntent / getStatus / refund / verifyWebhook`; ePayco implementa el contrato en staging aunque no esté activo en UI. |

## 6. Pedidos y logística (RF-034 a RF-041)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-034 | Máquina de estados de pedido con historial inmutable (actor, motivo, timestamp). | M | Transiciones monotónicas; todo cambio escribe `order_status_history` y un evento de outbox; estados terminales: `DELIVERED`, `REFUNDED`, `CANCELLED` y `RETURN_REJECTED` (C-08). |
| RF-035 | Snapshot inmutable de precio, nombre, SKU, imagen, impuestos y dirección en cada línea del pedido. | M | Cambiar el catálogo después de la compra no altera pedidos históricos ni facturas. |
| RF-036 | Pedido desde **tienda física (POS web)** creado por un Vendedor con `site_id` asignado (historia `OPS-09`, 8 pts, Sprint 6; C-03). | M | El vendedor selecciona cliente (o invitado), sede, ítems y método de pago; el pedido queda unificado en el mismo historial del cliente y descuenta el **lote FEFO** de esa sede; el escenario E2E de pedido POS es gate de release. |
| RF-037 | Seguimiento público por número de pedido + correo de compra. | M | Sin sesión, con ambos datos correctos se ve estado, transportadora, guía y ETA; correo erróneo nunca revela datos del pedido. |
| RF-038 | Gestión de guías y tracking con transportadora (agregador o integración directa). | S | Generar guía crea etiqueta y evento; el webhook de entrega mueve el pedido a `DELIVERED`. |
| RF-039 | Solicitud de retracto (Ley 1480, 5 días hábiles) con aprobación manual en MVP. | M | Formulario disponible desde el pedido entregado dentro del plazo; fuera de plazo se explica el motivo; transiciones `RETURN_REQUESTED → REFUNDED` o `RETURN_REQUESTED → RETURN_REJECTED` (terminal). **No existe `RETURN_REQUESTED → DELIVERED`** (C-08). |
| RF-040 | Cancelación de pedido antes del despacho con liberación de reserva y reembolso si ya se pagó. | M | Cancelar antes de `OUT_FOR_DELIVERY` libera el lote reservado; cancelar después bloquea la acción y muestra contacto. |
| RF-041 | Unificación de pedidos web y de tienda en un solo historial por cliente (incluido invitado identificado por documento/correo). | M | Buscar un cliente en admin muestra pedidos de todas las sedes y canales con el campo `canal` (WEB / POS / MARKETPLACE_FUTURO). |

## 7. Cuenta de cliente (RF-042 a RF-047)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-042 | Registro y login con correo + contraseña y con Google (OAuth). | M | Validación de correo, política de contraseña; **bloqueo tras 5 intentos fallidos en 15 min por IP+cuenta**, backoff y CAPTCHA (C-05); sesión en cookie `httpOnly` `SameSite=Strict` (excepción `Lax` en el retorno de Wompi, C-04); el proveedor OAuth no expone tokens al cliente. |
| RF-043 | Recuperación de contraseña por correo con token de un solo uso y caducidad. | M | Token de 30 min, uso único, no reutilizable tras reset. |
| RF-044 | Direcciones guardadas (múltiples, una principal). | S | Alta/edición/eliminación; la dirección elegida se snapshottea en el pedido. |
| RF-045 | Historial y detalle de pedidos propios, con descarga de factura cuando exista. | M | Solo se pueden ver pedidos propios; intentar acceder a otro pedido devuelve 404 (no 403, para no filtrar existencia). |
| RF-046 | Wishlist persistente con página propia. | S | Favoritos sobreviven a sesión; se pueden agregar al carrito desde la wishlist. *(En el prototipo S0 solo hay feedback de contador.)* |
| RF-047 | Gestión de consentimientos (Ley 1581): aceptar/rechazar marketing, revocar en cualquier momento y ver versión de la política aceptada. | M | Cada consentimiento guarda fecha, versión y canal; revocar deja de enviar campañas en ≤24 h; los correos transaccionales no dependen del consentimiento de marketing. |

## 8. Sucursales, lotes e inventario multi-sede (RF-048 a RF-061) — **CRÍTICO**

> Los requisitos específicos de lotes, FEFO y vencimientos están en la [§12](#12-lotes-vencimientos-y-fefo-rf-078-a-rf-081).

> **Vocabulario (C-01):** «sucursal» es únicamente la **etiqueta UI** en español; el identificador técnico es **`site_id`/`sites`**. Quedan prohibidos `branch_id`, `branches` y `sucursal_id` como identificadores.

> **Decisión (C-01):** la fuente de verdad es **`inventory_lots(lot_id, site_id)`** con selección **FEFO**; `disponible = on_hand - reserved` por **lote y `site_id`**. `inventory_by_site(variant_id, site_id)` es **solo una proyección derivada**, actualizada en la misma transacción (`on_hand = Σ lots.on_hand`, `reserved = Σ lots.reserved`). No existe un "stock global" escribible.

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-048 | Dos `sites` (2 sedes físicas; etiqueta UI «sucursales») configurables con nombre, dirección, horario, teléfono, coords y estado (activa/inactiva). | M | Admin crea/edita sedes; el checkout solo ofrece `sites` activas; cada usuario operativo tiene `site_id` asignado. |
| RF-049 | Registro de inventario por **lote** en `inventory_lots(lot_id, site_id)` con `on_hand`, `reserved` y `expiry_date`; `inventory_by_site(variant_id, site_id)` es proyección derivada. | M | Restricción DB `0 ≤ reserved ≤ on_hand` en lotes y proyección; nunca `on_hand < 0`; job diario de reconciliación con alerta de desvío; el formulario de ajuste exige motivo. |
| RF-050 | Reserva temporal de stock por **lote FEFO** en la `site_id` al iniciar checkout, con TTL de 30 minutos. | M | La reserva se crea en la misma transacción que el pedido `PENDING_PAYMENT`; expirar libera `reserved`; el contador visible al cliente es `on_hand - reserved` de la proyección. |
| RF-051 | Prevención de sobreventa mediante actualización condicional atómica sobre `inventory_lots`. | M | `UPDATE inventory_lots SET reserved = reserved + :qty WHERE lot_id=:l AND site_id=:s AND on_hand - reserved >= :qty`; 100 intentos concurrentes por la última unidad (web + POS) producen exactamente 1 reserva exitosa (test de integración). |
| RF-052 | Click & collect: reserva FEFO en la **`site_id` elegida por el cliente** y código de retiro de 4–6 dígitos. | M | El código se muestra en confirmación y correo; la sede solo entrega si el pedido está `READY_FOR_PICKUP`; Esc expira la reserva. |
| RF-053 | Flujo de retiro en tienda: `PAID → PREPARING → PACKED → READY_FOR_PICKUP → DELIVERED`. | M | El vendedor confirma la entrega con el código; el estado se escribe con actor y `site_id`; se notifica al cliente al quedar listo. `READY_FOR_PICKUP` es `orders.status`, no un derivado de `store_pickups.status` (C-08). |
| RF-054 | Despacho a domicilio con **`site_id` de fulfillment** asignada automáticamente por regla de prioridad configurada (y disponibilidad FEFO). | M | El algoritmo elige `site_id` con stock completo; se registra `fulfillment_site_id` en el pedido; si no hay sede con stock completo, el checkout ofrece split o alternativa antes de cobrar. |
| RF-055 | Transferencias entre sedes con estado `DRAFT → IN_TRANSIT → RECEIVED / CANCELLED` y auditoría de quien autoriza. | M | Al crearla se reserva en origen; al marcarse en tránsito se descuenta `on_hand` de origen y aumenta `in_transit`; al recibirse aumenta `on_hand` de destino y baja `in_transit`. Movimientos siempre balanceados. |
| RF-056 | Venta desde tienda física (POS, `OPS-09`) descuenta el **lote FEFO** de la `site_id` del vendedor y usa el mismo catálogo y precios en centavos. | M | Un pedido POS reduce `on_hand` del lote de su sede; el precio y el IVA (1900 bp) son idénticos a la web salvo promoción autorizada; el pedido aparece en el historial unificado. |
| RF-057 | Ajustes de inventario (entrada, salida, mermas, corrección) con motivo obligatorio y aprobación según monto. | M | Todo ajuste genera `inventory_movement` inmutable con actor, sede y motivo; ajustes negativos grandes requieren Superadmin. |
| RF-058 | Conteo físico por sede con diferencias revisables antes de aplicar. | S | Se genera un conteo, se capturan cantidades, se muestra diferencia vs. sistema y solo se aplica tras confirmación. |
| RF-059 | Umbrales de stock mínimo por sede y alertas al operador. | S | Al quedar por debajo del mínimo se crea tarea/alerta visible en admin; el storefront puede ocultar "disponible" cuando aplica. |
| RF-060 | Disponibilidad por sede visible en PDP ("Recoge gratis hoy en Sede X") y en checkout. | S | La disponibilidad mostrada coincide con `on_hand - reserved` al momento de renderizar; nunca se promete stock inexistente. |
| RF-061 | Reporte de inventario consolidado y por sede, exportable a CSV. | S | El reporte total es la suma de sedes e incluye `in_transit`; se exporta con columnas SKU, sede, on_hand, reserved, in_transit. |

## 9. Administración (RF-062 a RF-068)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-062 | Panel admin protegido con RBAC y ámbito de `site_id` para Vendedor. | M | Vendedor solo ve su `site_id`; Admin ve todas; Superadmin gestiona roles y usuarios; rutas `/admin/**` inaccesibles sin sesión válida; **MFA obligatoria para Admin/Superadmin**, Vendedor con sesión de tablet de 8 h y MFA diferida a Fase 2 (C-04); `Bearer` solo servidor a servidor (C-04). |
| RF-063 | CRUD de catálogo, marcas, categorías, atributos, cupones y reseñas (moderación). | M | Toda mutación escribe auditoría; los cambios de precio invalidan caché vía evento de dominio. |
| RF-064 | Gestión de pedidos: filtros por estado, sede, canal y fecha; cambio de estado permitido por la máquina. | M | No se pueden aplicar transiciones ilegales; cada cambio registra actor; se puede imprimir picking list por sede. |
| RF-065 | Gestión de sucursales, inventario, reservas y transferencias. | M | Ver `RF-048`–`RF-061`; las acciones sensibles piden confirmación. |
| RF-066 | Gestión de usuarios internos y roles (Cliente, Vendedor tienda, Admin, Superadmin). | M | Un Vendedor no puede escalar a Admin; cambiar rol requiere Superadmin y se audita. |
| RF-067 | Registro de auditoría consultable (actor, acción, entidad, antes/después, sede, IP, `requestId`). | M | Los logs son *append-only*; se pueden filtrar por actor y fecha; nadie desde la UI puede borrarlos. |
| RF-068 | Exportables CSV de pedidos, inventario y clientes (con consentimiento y minimización de PII). | S | Los exportes respetan permisos; los campos sensibles se enmascaran o cifran según política; se registra quién exportó. |

## 10. Notificaciones (RF-069 a RF-073)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-069 | Correo transaccional en hitos: pedido recibido, pago aprobado, listo para retiro, en ruta, entregado, retracto. | M | Se envía vía worker con reintentos; el evento se genera por outbox; existe plantilla versionada por idioma/canal. |
| RF-070 | WhatsApp Cloud API para confirmación de pedido, listo para retiro y entrega (plantillas aprobadas por Meta). | S | Fallar WhatsApp no bloquea el correo; se registra entrega/lectura cuando el proveedor lo reporta. |
| RF-071 | Correos de carrito abandonado y cupón de recuperación, sujetos a consentimiento. | S | Solo se envían con consentimiento de marketing vigente; frecuencia máxima configurable; opt-out inmediato. |
| RF-072 | Notificaciones internas al operador: stock bajo, webhook fallido, factura pendiente, diferencia de conciliación. | M | La alerta llega al canal definido (email/Slack); se puede silenciar con acknowledged_by. |
| RF-073 | Preferencias de notificación del cliente (canales y tipos), revocables. | S | Cambiar preferencias surte efecto en ≤24 h; se guarda versión y fecha. |

## 11. Facturación y cumplimiento (RF-074 a RF-077)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-074 | Cálculo y desglose de IVA 19% (`vat_rate_bps = 1900`) sobre precios con impuesto incluido, por línea de pedido, en centavos (C-02). | M | `base_cents = round_half_up(total_line_cents / 1.19)`, `iva_cents = total_line_cents − base_cents`; la suma de bases e IVA cuadra exactamente con el total en `*_cents`; test unitario con casos límite. |
| RF-075 | Factura electrónica DIAN automática tras pago aprobado, vía proveedor tecnológico habilitado. | M | Se emite en p95 < 15 min; si falla, reintento con backoff y alerta; cero pedidos pagados sin factura al cierre del día. |
| RF-076 | Nota crédito DIAN en reembolsos y cancelaciones posteriores al pago. | S | La nota crédito referencia la factura original; se envía al correo del cliente. |
| RF-077 | Aviso de privacidad, términos, política de cookies con consentimiento granular y control de datos (acceso/rectificación/supresión). | M | Consentimiento versionado y revocable; supresión anonimiza PII conservando la factura 5 años por obligación tributaria. |

## 12. Lotes, vencimientos y FEFO (RF-078 a RF-081) — **CRÍTICO (C-01)**

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-078 | Fuente de verdad de inventario **por lote** con `site_id`, fecha de vencimiento y saldo. | M | Toda entrada crea/actualiza `inventory_lots(lot_id, site_id, expiry_date, on_hand, reserved)`; la disponibilidad publicada sale de la proyección `inventory_by_site` y nunca de un saldo global; queda trazabilidad por lote hasta la venta. |
| RF-079 | Selección **FEFO** para reservas, ventas POS y transferencias. | M | Se ordenan los lotes activos del `site_id` por `expiry_date ASC`, se omiten lotes bloqueados y se reserva del primero con saldo suficiente; test unitario con varios lotes del mismo `variant_id`; la concurrencia se resuelve con el `UPDATE` condicional de RF-051. |
| RF-080 | Aviso al operador cuando un lote esté a **90 días** del vencimiento. | M | Job diario detecta lotes en el umbral y crea alerta visible en admin con `site_id`, variante y cantidad; la alerta es accionable (`acknowledged_by`). |
| RF-081 | **Bloqueo de venta** de lotes a **15 días** del vencimiento; sin descuento automático en Fase 1. | M | Un lote en el umbral no es elegible para FEFO ni aparece en disponibilidad; aplica también al POS; no se crea precio rebajado automáticamente en el MVP. |

> Los RF-078..RF-081 cierran la pregunta `DD-Q9` por decisión `C-01` (antes `RM-Q9`, abierta en el README). La historia de backlog asociada está en [historias-usuario.md](./historias-usuario.md) (EP-05).

---

## Trazabilidad y próximos pasos

| Artefacto | Relación con este documento |
|---|---|
| [requisitos-no-funcionales.md](./requisitos-no-funcionales.md) | Complementa con presupuestos medibles de rendimiento, a11y, seguridad y disponibilidad. |
| [historias-usuario.md](./historias-usuario.md) | Convierte cada RF en historias estimadas y planificables en Scrum, incluida `OPS-09`. |
| [design-doc.md §3 y §4](../02-arquitectura/design-doc.md) | Documenta cómo se satisfacen estos RF y qué se excluye del MVP. |
| [design-doc.md §4.4.1](../02-arquitectura/design-doc.md) | Tabla única «etiqueta UI → identificador canónico» de estados de pedido (C-08). |
| [diagramas.md](../02-arquitectura/diagramas.md) | Secuencias de checkout, retiro en tienda, estados de pedido y reserva FEFO multi-sede. |
| [decisiones-comandante.md](../02-arquitectura/decisiones-comandante.md) | C-01..C-12: fuente de verdad de este documento ante cualquier contradicción. |

> **Pregunta abierta `DD-Q1`** (ID canónico en [design-doc.md §10](../02-arquitectura/design-doc.md)): ¿la venta en tienda física requiere integración con un POS/ERP existente (Siigo, Alegra, World Office u otro) o el pedido POS web del RF-036 reemplaza ese proceso durante el MVP? Responde: Cliente + Comandante (S0).

> **Pregunta abierta `DD-Q3`** (ID canónico en [design-doc.md §10](../02-arquitectura/design-doc.md)): ¿el umbral de envío gratis (COP 150.000 del prototipo), el monto máximo de contraentrega y el TTL de reserva (30 min) son aceptados por el negocio? Responde: Cliente + Admin de operación (Sprint 1, refinement).

> `DD-Q9` (lotes/FEFO) quedó **cerrada por C-01**; `DD-Q11` (TRM/PITR) por C-09 y `DD-Q12` (MFA vendedores) por C-04. No se reabren aquí.
