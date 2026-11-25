# Estrategia de Datos — Adriana_tienda

> **Estado:** Propuesta de diseño (fase de diseño). **No es implementación.**
> Complemento operativo de los documentos del modelo. Todo lo aquí descrito entra al pipeline
> de las 8 fases de APEX FORGE antes de ejecutarse en producción.
> **Fuente operativa:** decisiones C-01, C-02, C-03 y C-09 de
> `docs/02-arquitectura/decisiones-comandante.md`. Vocabulario único: **`site_id` / `sites`**.

---

## 1. Migraciones versionadas

> **Decisión:** **Prisma Migrate con migraciones generadas y revisadas**, aplicadas en CI/CD
> con `migrate deploy`. Queda prohibido `db push` en staging y producción.

| Regla | Detalle |
|---|---|
| Una migración = un cambio lógico | No mezclar "añadir tabla" con "cambiar índice de otra". Mensaje Conventional Commit. |
| Expand / contract | 1) añadir columna nullable, 2) desplegar código que la escribe y la lee con fallback, 3) backfill, 4) hacerla NOT NULL y quitar la vieja en otra migración. Nunca renombrar en el mismo deploy. |
| Formato de nombre | `YYYYMMDDHHMMSS_descripcion_corta` (lo genera Prisma). |
| Revisión | `forge-reviewer` aprueba el SQL; `forge-sentinel` aprueba si toca PII, pagos o privilegios. |
| Prueba pre-deploy | Aplicar la migración en una copia con **datos anonimizados** de producción; ejecutar `EXPLAIN` de las consultas calientes. |
| Backfill | Por lotes de 1.000 filas con pausa, registrando progreso. Nunca un `UPDATE` masivo en hora pico. |
| Bloqueo | DDL sobre tablas grandes se planifica fuera de horario comercial; se usa `CREATE INDEX CONCURRENTLY` cuando aplique. |
| Rollback | Cada migración lleva un `down.sql` documentado. Si el rollback no es seguro, se decide un *forward fix* y se documenta. |
| CHECK / índices parciales | Prisma no los expresa: van en SQL complementario (`diccionario-datos.md` §11) revisado a mano. |

**Orden sugerido de despliegue de esquema (hitos):**

1. Identidad + sedes + catálogo base.
2. Lotes + inventario + reservas (con `CHECK` y locks).
3. Carrito + cupones + pedidos.
4. Pagos + webhooks + idempotencia + outbox.
5. Logística + facturación + notificaciones.
6. Auditoría + métricas + índices de reporte.

---

## 2. Seeds

> **Decisión:** Los seeds son **idempotentes** (upsert por clave natural) y están separados en
> `core` (obligatorios) y `demo` (solo staging/desarrollo; jamás en producción).

| Seed | Contenido | Entorno |
|---|---|---|
| `001_roles_permissions` | Roles `ADMIN`, `OPERATOR`, `SELLER`, `ACCOUNTANT`, `CUSTOMER` y catálogo de permisos. | todos |
| `002_sites` | Las dos sedes reales (`SDE-01`, `SDE-02`) con dirección, horarios y prioridad. | todos |
| `003_categories` | Árbol facial / cabello / cuerpo con `path` materializado. | todos |
| `004_presentations` | `ML_30`, `ML_50`, `ML_200`, `ML_400`, `G_200`, `UNIDAD`. | todos |
| `005_attributes` | `skin_type`, `hair_type`, `concern`, `tone`, `active_ingredient` y sus valores. | todos |
| `006_settings` | Parámetros de `reglas-negocio.md` §6 (TTL, umbrales, topes). | todos |
| `010_admin_user` | Usuario admin inicial desde variables de entorno; **sin contraseña en el repo**. | todos |
| `020_demo_brands_products` | 20 productos de muestra con imágenes y lotes. | solo staging/dev |
| `021_demo_customers_orders` | Clientes y pedidos sintéticos, **sin datos reales**. | solo staging/dev |

**Reglas de seeds:**
- Nunca generan pedidos en `PAID` sin `payment_attempts` coherente (los reportes se validan con datos realistas).
- Los lotes demo incluyen vencimientos futuros y uno próximo a vencer para probar FEFO con
  los umbrales aprobados: aviso a 90 días, bloqueo de venta a 15 días (C-01 / RN-023).
- Los pedidos demo incluyen al menos una venta POS (`channel = POS`, `site_owner_id` de la
  sede vendedora, pago `MANUAL`/`CASH`, `status = PAID`) para validar OPS-09 (C-03).
- Todos los importes demo son `*_cents BIGINT` con IVA incluido a 1900 bp (C-02).
- El admin inicial se crea con password temporal que debe cambiarse en primer login.

---

## 3. Política de auditoría

| Elemento | Política |
|---|---|
| Qué se audita | Todo cambio en catálogo, precios, inventario, pedidos, pagos, reembolsos, cupones, roles, permisos y settings. |
| Dónde | `audit_logs` con `before`/`after` (JSONB redactado) + `hash` encadenado con el registro anterior. |
| Quién | `actor_type` (`USER`, `ADMIN`, `SYSTEM`, `INTEGRATION`) + `actor_id`. Las acciones del sistema llevan `trace_id`. |
| Inmutabilidad | Sin `UPDATE`/`DELETE` desde la aplicación; solo privilegio de BD para el rol de mantenimiento. |
| Fail-closed | Si falla la escritura de auditoría, se aborta la operación (RN-032). |
| Redacción | Se eliminan teléfono, documento, PAN y tokens antes de guardar `before`/`after`. |
| Consulta | `GET /admin/audit-logs`, paginado, con filtros por entidad, actor y fecha. |
| Alertas | Cambios de rol, `settings.isSecretRef`, reembolsos > umbral y liberación de lotes bloqueados ⇒ notificación inmediata a `forge-sentinel`. |

---

## 4. Retención de datos

> **Decisión:** Retención **por clase de dato**, con anonimización cuando la norma permite
> conservar el hecho económico pero no la identidad. Base: Ley 1581/2012 (Habeas Data),
> Ley 1480/2011 (Estatuto del Consumidor) y obligaciones tributarias colombianas.
> **Los plazos exactos deben ser confirmados por el asesor legal del cliente.**

| Clase de dato | Retención propuesta | Acción al vencer |
|---|---|---|
| Facturas, pagos, impuestos, `order_items` | 5 años desde el cierre del ejercicio | Conservar importes; anonimizar cliente. |
| Pedidos con PII en snapshots | 5 años (misma base fiscal) | Sustituir nombre/teléfono/dirección por valores neutros. |
| Webhooks y payloads crudos | 30 días | Borrado físico. |
| Idempotency keys | 24 h | Borrado físico. |
| Outbox events procesados | 90 días | Borrado físico. |
| Notificaciones | 12 meses | Borrado de payload; conservar conteos. |
| Auditoría administrativa | 3 años (ampliable a 5 si hay investigación) | Archivado frío; nunca borrado sin aprobación legal. |
| Consentimientos | Vigencia del tratamiento + 5 años como evidencia | Archivado. |
| Carritos abandonados | 30 días desde `last_activity_at` | Borrado físico. |
| Sesiones expiradas | 30 días | Borrado físico. |
| `audit_logs` con PII accidental | Corrección inmediata + incidente | Redacción y registro del evento. |

**Derechos del titular:** acceso, rectificación, supresión y revocatoria se gestionan desde
`/me/data-export` y `/me/data-deletion`; el flujo genera una tarea auditada y nunca elimina
facturas ni movimientos contables.

---

## 5. Backups y recuperación

| Mecanismo | Configuración propuesta |
|---|---|
| PITR (*point-in-time recovery*) | Habilitado (Neon/Postgres gestionado), ventana 7 días. |
| Snapshot diario | 03:00 America/Bogota, retención 30 días. |
| Snapshot pre-migración | Obligatorio antes de migraciones con DDL o backfill. |
| Replicación | Réplica de lectura para reportes si el volumen lo justifica (no en MVP). |
| RPO objetivo | ≤ 5 min con PITR. |
| RTO objetivo | ≤ 60 min para restaurar la BD completa en staging. |
| Pruebas de restauración | Mensuales en entorno aislado, con verificación de integridad (`CHECK` + conteos). |
| Cifrado | En reposo (KMS del proveedor) y en tránsito (TLS 1.2+). |
| Secretos | En gestor (KMS/Vault); rotación trimestral; nunca en variables committeadas. |

> **Decisión:** Ante un incidente de datos, se prioriza **restaurar a un punto limpio** y
> reconciliar pagos con la pasarela, antes que intentar reparaciones manuales en producción.

---

## 6. Índices y rendimiento

### 6.1 Caminos calientes

| Consulta | Índice que la resuelve |
|---|---|
| PLP por categoría/marca, ordenado | `products(status, published_at DESC)`, `products(brand_id, status)`, `product_categories(category_id, position)` |
| PDP con variantes e imágenes | `product_variants(product_id, position)`, `product_media(product_id, role, position)` |
| Búsqueda por texto | `GIN(search_vector)` + `GIN(name gin_trgm_ops)`; Meilisearch como índice derivado |
| Disponibilidad en checkout | `inventory_lots(lot_id, site_id)` PK (**fuente de verdad**) + `inventory_by_site(variant_id, site_id)` PK (**proyección**, misma transacción) |
| FEFO (elegir lote) | `lots(variant_id, expires_at)` parcial `WHERE status='ACTIVE'` + `inventory_lots(lot_id, site_id)` para reservar |
| Kardex por SKU | `inventory_movements(variant_id, created_at DESC)` |
| Cola operativa del admin | `orders(site_owner_id, status, created_at DESC)` |
| "Mis pedidos" | `orders(customer_id, created_at DESC)` |
| Conciliación de pagos | `unique(payments.provider, provider_payment_id)` |
| Anti-duplicado de webhooks | `unique(webhook_events.provider, event_id)` |
| Worker de outbox | `outbox_events(status, available_at)` |
| Reporte de ventas por sede/fecha | `orders(site_owner_id, created_at DESC)` + `order_items(order_id)` |

### 6.2 Reglas de rendimiento

- **Sin N+1:** cargar variantes, imágenes e inventario con `include`/`select` explícitos o
  consultas por lote (`WHERE id IN (...)`).
- **Cursor antes que OFFSET** en listados grandes; `OFFSET` solo en admin con máximo 5 páginas.
- **Snapshots** para no hacer JOINs con catálogo en el histórico de pedidos.
- **Proyección por sede** para responder disponibilidad sin sumar todos los lotes en el PDP.
- **`EXPLAIN ANALYZE`** obligatorio en toda query nueva que toque `orders`, `inventory_lots` o
  `payments`; se documenta el plan en la PR.
- **Pool de conexiones** limitado (p. ej. 10 por instancia) con statement_timeout de 5 s en
  transversal y 15 s en reportes.
- **Caché:** Redis para sesiones, rate limiting y facetas; invalidación por evento outbox.
  Nunca cachear stock disponible por más de 30 s.
- **Particionamiento:** no requerido para 1.000 pedidos/mes; se evalúa si `audit_logs` o
  `webhook_events` superan 50 M filas.

---

## 7. Multi-sede: propiedad y coherencia

> **Decisión — sede dueña:** El pedido tiene `site_owner_id` **inmutable tras el pago**.
>
> - `STORE_PICKUP` → la sede dueña es **la sede de retiro** elegida por el cliente.
> - `SHIPPING` → la sede dueña es **la sede que ganó la reserva FEFO** (mayor prioridad con
>   stock suficiente en lotes vigentes).
> - `POS` → la sede dueña es la sede que realiza la venta.
>
> La sede dueña prepara, factura y responde por la entrega. Otra sede puede **colaborar**
> mediante una transferencia, pero no cambia la propiedad del pedido.

| Situación | Comportamiento |
|---|---|
| Cliente cambia de sede de retiro antes de empacar | Se libera la reserva antigua, se crea otra en la nueva sede, se actualiza `site_owner_id` y se escribe auditoría + historial. |
| Cambio después de `PACKED` | No permitido sin aprobación de operación; si se autoriza, se documenta y se reemite guía/código de retiro. |
| Stock insuficiente en la sede dueña | Se intenta transferencia interna (RN-020) antes de cancelar; el pedido mantiene su sede dueña. |
| Cliente ve disponibilidad | Consulta ambas sedes; el carrito solo se vincula a la sede que finalmente se reserve en checkout. |
| Reportes | Toda venta se atribuye a `site_owner_id`; las transferencias **no** cuentan como venta. |
| Concurrencia entre sedes | Lock de fila (`SELECT ... FOR UPDATE`) sobre `inventory_lots`; el update condicional de RN-009 es la última línea de defensa. |
| Diferencias de inventario | Job diario verifica `inventory_by_site = Σ inventory_lots` por sede; desviación ⇒ incidencia. |

### 7.1 Matriz de responsabilidades por sede

| Proceso | Sede dueña | Otra sede |
|---|---|---|
| Apartar stock | Sí (FEFO en sus lotes) | Puede ser origen de transferencia |
| Preparar / empacar | Sí | No |
| Emitir factura | Sí | No |
| Entregar en mostrador | Solo si `STORE_PICKUP` en esa sede | No |
| Despachar envío | Sí (origen de la guía) | No |
| Reponer por devolución | Sí, al mismo lote | No |

---

## 8. Observabilidad de datos

| Métrica | Alerta |
|---|---|
| `inventory_negative_rows` | > 0 ⇒ crítico (CHECK violado o writing directo). |
| `inventory_projection_drift` | Cualquier desviación entre proyección y lotes. |
| `reservations_expired_per_minute` | > 10 sostenido 5 min ⇒ revisar pasarela/TTL. |
| `webhooks_failed` / `ignored` | > 3 en 5 min ⇒ revisar firma o montos. |
| `outbox_pending_age_seconds` | > 300 s ⇒ worker caído. |
| `payments_pending_age_seconds` | > 900 s ⇒ posible webhook perdido. |
| `orders_paid_without_stock` | > 0 ⇒ incidencia inmediata (RN-013). |
| `audit_log_write_failures` | > 0 ⇒ fail-closed, revisar permisos. |

---

## 9. Puertas de calidad (APEX FORGE)

| Puerta | Responsable | Criterio |
|---|---|---|
| Diseño del modelo aprobado | `forge-architect` + `forge-backend` | Este set de documentos consistente con el DESIGN_DOC. |
| Revisión de migraciones | `forge-reviewer` | SQL revisado, rollback documentado, tests de integración verdes. |
| Seguridad | `forge-sentinel` | Cifrado, RBAC, secretos, webhooks y PII revisados. |
| Calidad | `forge-qualis` | Tests de reglas RN-001..038 y de concurrencia de stock, incluido el E2E de venta POS (OPS-09). |
| CI/CD | `forge-infra` | `migrate deploy` en pipeline; snapshot previo; sin `db push`. |
| Liberación | `forge-qualis` + `forge-infra` | Canary, monitoreo de las métricas §8 y plan de rollback. |

---

## 10. Puntos abiertos para confirmación

1. **Plazos legales exactos** de retención y criterios de anonimización (asesoría jurídica del cliente).
2. **Regla de cambio de sede** después de empacar y manejo de reprogramaciones de retiro.

> **Cerrado por C-01 (ya no está pendiente):** la política de lotes próximos a vencer queda
> aprobada para el MVP con **aviso a 90 días**, **bloqueo de venta a 15 días** y **sin
> descuento automático en Fase 1** (RN-023). `inventory_lots(lot_id, site_id)` es la fuente de
> verdad y `inventory_by_site` su proyección en la misma transacción; **no existe un modelo
> de inventario alternativo** que conviva con esta decisión.
