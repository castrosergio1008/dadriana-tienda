# Code Review de documentación de diseño — Adriana Tienda

| Campo | Valor |
|---|---|
| **Revisor** | `forge-reviewer` (Gatekeeper APEX FORGE) — veredicto independiente |
| **Fecha** | 23 de noviembre de 2026 |
| **Alcance revisado** | 57 archivos bajo `docs/` (7 carpetas), 6 ADR, 10 maquetas HTML + guías, contratos y planes |
| **Estado del artefacto revisado** | `docs/02-arquitectura/design-doc.md` en **Draft**, con 5 firmas pendientes (líneas 392–401) |
| **Tipo de revisión** | Diseño/documentación. No se revisó código de producción (no existe aún) |
| **Veredicto** | **REQUEST CHANGES** — sin LGTM en esta iteración |

## 1. Veredicto

**REQUEST CHANGES.** La documentación es sólida en lo que respecta a SLOs, seguridad (SAQ-A, HMAC, PII), estructura del ERD y accesibilidad básica de las maquetas, pero existen **tres contradicciones de fondo que impiden aprobar el Design Doc**: dos modelos incompatibles de inventario, dos representaciones monetarias incompatibles y una capacidad declarada como crítica (venta POS) que no existe en el backlog ni en el plan de sprints. Además, seis contradicciones mayores afectan al contrato API, la autenticación y la trazabilidad de decisiones.

**Condición para el LGTM:** corregir B1–B3 en los artefactos de origen (Design Doc, ADR y documentos de datos) y registrar decisión del Comandante sobre M1–M6, reflejándola en todos los documentos afectados. Los hallazgos Menores y Nits no bloquean, pero deben quedar en el backlog de documentación.

**Resumen de hallazgos: 21 en total** — Bloqueante **3** · Mayor **6** · Menor **8** · Nit **4**.

---

## 2. Bloqueantes

### B1. Dos modelos de inventario incompatibles (fuente de verdad, clave y FEFO)
- `docs/02-arquitectura/design-doc.md:173-180` y `docs/02-arquitectura/adr/ADR-003-modelo-inventario-multisede.md:18,24,27`: la fuente de verdad es `inventory` con clave `(variant_id, branch_id)`, `on_hand/reserved/in_transit`, y el anti-sobreventa es `UPDATE inventory SET reserved = reserved + :qty ...`.
- `docs/04-datos/modelo-logico-er.md:569,589-592`, `docs/04-datos/diccionario-datos.md:326`, `docs/04-datos/reglas-negocio.md:96` y `docs/04-datos/maquinas-estado.md:128`: la fuente de verdad es `inventory_lots(lot_id, site_id)` con selección FEFO; `inventory_by_site(variant_id, site_id)` es solo una proyección; el `UPDATE` atómico se aplica a `inventory_lots`.
- `docs/02-arquitectura/adr/ADR-004-estrategia-datos-prisma.md:26,48` usa `branches`, `stock_reservations`, `transfers`; los datos usan `sites`, `reservations`, `site_transfers`. Tres vocabularios distintos para la misma sede.
- **Estado también contradictorio:** `docs/README.md:38` declara D5 «Lotes con FEFO obligatorio» como decisión **ya tomada**, mientras `docs/README.md:118` (Q9) y `docs/04-datos/estrategia-datos.md:225` lo dejan **abierto**, y `docs/04-datos/modelo-logico-er.md:610-618` lo registra como delta «para concerted con `forge-architect`». Ni un solo RF/RNF (`docs/01-requisitos/`) menciona lotes, vencimientos o FEFO.
- **Impacto:** cambia la tabla sobre la que se aplica el test de concurrencia (bloqueante de release), las reglas de transferencia, el cálculo de disponibilidad en PDP y el esquema Prisma. No pueden aprobarse ambos modelos a la vez.
- **Corrección sugerida:** el Comandante decide (recomendación: **adoptar lotes + FEFO** porque son cosméticos con vencimiento y la trazabilidad es un requisito legal, y porque el modelo de datos ya está desarrollado). Entonces: (a) enmendar ADR-003 y Design Doc §4.3 con `inventory_lots` como fuente de verdad y proyección por sede; (b) unificar `branch_id`/`site_id` a un solo nombre; (c) añadir RF-078..RF-08x de lotes/FEFO y una historia de backlog; (d) cerrar Q9 y actualizar D5; (e) corregir el typo «concerted» → «concertar».

### B2. Representación monetaria incompatible
- `docs/02-arquitectura/adr/ADR-004-estrategia-datos-prisma.md:35`: «Dinero: `Int` en COP enteros; porcentajes en *basis points*»; `docs/05-scrum/estrategia-pruebas.md:54` repite «COP entero».
- `docs/README.md:36` (D4): «Dinero en **BIGINT centavos**»; `docs/04-datos/api-rest.md:21` («Importes en centavos (`grand_total_cents`)»), `docs/04-datos/diccionario-datos.md:449-477`, `docs/04-datos/modelo-prisma-documental.md` y `docs/02-arquitectura/design-doc.md:241` («montos enteros en COP») no concuerdan entre sí.
- **Impacto:** afecta al redondeo del IVA por línea, a todos los campos `*_cents`, al contrato con la pasarela (minor units) y a los tests de casos límite, que son bloqueantes de release.
- **Corrección sugerida:** unificar en **BIGINT centavos** (recomendado: coincide con Wompi y con todo el modelo de datos ya escrito). Actualizar ADR-004:35, Design Doc §3.3/§4.4, `estrategia-pruebas.md:54` y el glosario; declarar 1.900 bp = 19 % para evitar el doble uso de `1900` como `rate`.

### B3. La venta POS es crítica y bloqueante de release, pero no está planificada
- Declarada como MVP: `docs/02-arquitectura/design-doc.md:17,42,65,183,278` (dependencia «Sprint 6-7 … retiro, POS»), `docs/01-requisitos/requisitos-funcionales.md:95` (RF-036), `docs/01-requisitos/historias-usuario.md:139-142` (HU-019), `docs/02-arquitectura/alcance-y-no-objetivos.md:22`.
- Es **gate de release**: `docs/02-arquitectura/design-doc.md:325` exige un escenario E2E de «pedido POS».
- **No aparece ni una sola vez** en `docs/05-scrum/backlog-inicial.md` ni en `docs/05-scrum/plan-sprints.md` (búsqueda `POS` en ambos: 0 coincidencias). El plan S6 (`plan-sprints.md:47`) incluye DIAN, guías, tracking e inventario, pero no registro de venta presencial. `docs/README.md:96` afirma erróneamente que S6 incluye «venta POS».
- **Impacto:** el canary podría aprobarse sin haber probado uno de los flujos que el propio Design Doc declara bloqueante; además el riesgo R1 (concurrencia POS/web) queda sin escenario asignado.
- **Corrección sugerida:** añadir una historia (p. ej. `POS-01 — Registro de venta presencial`, 5–8 pts) en S6 o S7 con dependencia de `INV-01`, el escenario E2E faltante en `estrategia-pruebas.md` y el punto en el plan de sprints; o, si el Comandante decide diferir POS a Fase 2, eliminarlo de MVP, de la matriz de riesgos y de los gates de release. Recomendación: **mantenerlo en MVP**, porque es una de las tres razones de ser del modelo multi-sede.

---

## 3. Mayores

| # | Hallazgo | `archivo:línea` | Impacto y corrección |
|---|---|---|---|
| M1 | **Token de acceso en `Bearer` vs. en cookie httpOnly.** El contrato usa `Authorization: Bearer <access>` y el API exige JWT en header; la decisión de seguridad dice que el access token viaja en cookie httpOnly. | `design-doc.md:221`, `api-rest.md:29,277` vs. `design-doc.md:245`, `ADR-005:18,24` | Un `Bearer` legible por JS contradice la justificación XSS de la decisión. Elegir una vía: recomiendo **cookie httpOnly para el storefront** y documentar `Bearer` solo como opción server-to-server, o eliminarlo del ejemplo de contrato. |
| M2 | **Límites de login y checkout contradictorios.** RNF-016 y ADR-005: 10 intentos/min por IP; API y SEC-011: 5 intentos/15 min por IP+cuenta. Checkout: 20 req/min (RNF) vs. 30 req/min (API). | `requisitos-no-funcionales.md:54`, `ADR-005:32` vs. `api-rest.md:65,67`, `requisitos-seguridad.md:155` | Requisito de seguridad no singular → implementación y test arbitrarios. Unificar en un único valor (recomiendo el más estricto: 5/15 min IP+cuenta, backoff y CAPTCHA) y propagarlo a RNF-016 y ADR-005. |
| M3 | **Contrato de creación de pedido divergente.** El Design Doc documenta `POST /api/v1/orders` con `branchId`, `fulfillment.type=PICKUP`, `total` y `paymentUrl`; el API contrata `POST /checkout` con `cartId`, `fulfillmentType`, `grandTotalCents` y `nextAction.checkoutUrl`. `/orders` solo existe como GET. | `design-doc.md:219-238` vs. `api-rest.md:238,275-314,354` | Dos contratos incompatibles para la misma operación. Adoptar `POST /checkout` como canónico y reescribir el ejemplo del Design Doc con los nombres reales del API. |
| M4 | **Colisión de IDs de preguntas abiertas.** README Q1–Q12 y Design Doc Q1–Q9 reutilizan los mismos IDs con significados distintos (Q3 umbrales vs. cuentas/dominio; Q4 split vs. PO; Q5 transportadora vs. modalidad de pago; Q6 BNPL vs. MFA; Q7 fotos vs. umbrales; Q8 AWS vs. split; Q9 PO vs. FEFO). | `README.md:110-121` vs. `design-doc.md:380-388` | Seguimiento de decisiones imposible y riesgo de dar por cerrada una pregunta distinta. Renumerar con prefijo de documento (`DD-Q1..Q9`, `RM-Q1..Q12`) y consolidar en una única tabla de decisiones con dueño y fecha. |
| M5 | **Vocabulario de estados de pedido no canónico.** Requisitos/ADR usan español (`PENDIENTE_PAGO`, `PAGADO`, `LISTO_PARA_RETIRO`, `ENTREGADO_EN_TIENDA`, `REEMBOLSADO`); datos usa inglés (`PENDING_PAYMENT`, `PAID`, `PACKED`, `DELIVERED`, `REFUNDED`) y modela `LISTO_PARA_RETIRO` como estado derivado de `store_pickups.status=READY`, no de `orders.status`. | `requisitos-funcionales.md:82,85,93,124`, `ADR-003:26,28` vs. `maquinas-estado.md:30-60,231` | Los nombres en español parecen identificadores en RF y ADR, pero no existen en la máquina de estados. Publicar una tabla única de mapeo «nombre de negocio → identificador canónico → subsistema dueño» y marcar los ejemplos en español como etiquetas UI. |
| M6 | **Transición que rompe la monotonicidad declarada.** `RETURN_REQUESTED → DELIVERED` (retracto rechazado) retrocede el estado, y MT-06 declara `DELIVERED` terminal y «no se reabre», mientras el propio diagrama permite `DELIVERED → RETURN_REQUESTED`. | `maquinas-estado.md:47,49,54,232`; `requisitos-funcionales.md:93,124` («transiciones monotónicas») | Máquina de estados ambigua en el flujo de devoluciones. Usar estados dedicados y monotónicos, p. ej. `RETURN_REJECTED` como terminal, y ajustar MT-06 para enumerar `DELIVERED` solo como terminal *hasta solicitar devolución*. |

---

## 4. Menores

| # | Hallazgo | `archivo:línea` | Corrección |
|---|---|---|---|
| m1 | `SameSite=Lax` para sesión en Design Doc/ADR-005/API vs. `Strict` en SEC-023. | `design-doc.md:245`, `ADR-005:18,24`, `api-rest.md:30` vs. `requisitos-seguridad.md:224-229` | Decidir `Strict` con excepción documentada para el flujo de retorno desde Wompi; reflejar en los tres documentos. |
| m2 | Aritmética de coste de pasarela: la fórmula aplica `× 1,19`, pero los importes publicados (6.825 = 3,59 % de 190.000) son previos a IVA; `presupuesto.md` los rotula «con IVA». Con IVA serían ≈8.122 (≈4,27 %). | `design-doc.md:156-163`, `ADR-002:49`, `presupuesto.md:131` | Aclarar si la comisión mostrada incluye IVA; si lo incluye, recalcular la tabla y el take rate; si no, quitar el `× 1,19` de la nota y el «con IVA». |
| m3 | Contraste declarado incorrecto: `#B8895A` sobre `#1C1418` es **5,82:1**, no 6,4:1 (verificado con WCAG 2.1). Sigue cumpliendo AA, pero el dato es falso. | `sistema-diseno.md:214` | Corregir a 5,82:1. El resto de ratios declarados (12 comprobados) son correctos. |
| m4 | Tokens de color fuera del sistema de diseño en maquetas admin: `#8A3B4E`, `#FBF0DE`, `#FFFCF8`, `#E4C9C0`, `#9A8F92` (este último, texto deshabilitado a 3,13:1). | `admin-pedidos.html:130,166,356,364,417,442` y otras; `sistema-diseno.md:67-105` | Añadirlos al sistema como tokens semánticos (`--color-alert`, `--color-warning-soft`) o sustituirlos por `#B3261E` / `#F4EAE0` / `#8F5600`. |
| m5 | Convención Fibonacci incumplida: se declaran 1/2/3/5/8/13, pero hay estimaciones de 11 y 6 puntos. | `backlog-inicial.md:10` vs. `:50,53,58,77` | Ajustar a 8 o 13 y a 5 u 8, o documentar la excepción. Las sumas por sprint y el total 259 sí son correctos. |
| m6 | `mercado-pago` aparece como proveedor de webhook pese a estar descartado. | `api-rest.md:549` vs. `design-doc.md:160`, `ADR-002:25` | Quitar el adaptador del contrato o marcarlo explícitamente como «no activo, Fase 2». |
| m7 | Coexisten dos Design Docs sin precedencia clara: el raíz `DESIGN_DOC.md` v1.0 y `docs/02-arquitectura/design-doc.md` (Draft), conreferencias cruzadas a secciones del primero (§13.1, §12.3, anexo B). | `presupuesto.md:8`, `monitoreo-y-alertas.md:8`, `analisis-hosting.md:9,32`, `design-doc.md:10` | Declarar cuál manda y convertir las referencias relativas en enlaces; el Draft debe absorber o sustituir explícitamente a v1.0. |
| m8 | Alcance de MFA ambiguo: la decisión dice Admin/Superadmin, el diagrama exige MFA también al Vendedor y las consecuencias hablan de sesión de 8 h para vendedores. | `ADR-005:28,46,64,85`, `design-doc.md:245`, `README.md:115` | Resolver Q6 y alinear decisión, diagrama y requisitos de seguridad antes de implementar `/admin/**`. |

---

## 4b. Nits

| # | Hallazgo | `archivo:línea` |
|---|---|---|
| n1 | Ninguna maqueta contiene `aria-live`, aunque el sistema de diseño lo exige para cambios del carrito. Es aceptable en maquetas estáticas sin JS; debe garantizarse en la implementación. | `sistema-diseno.md:281`; 0 coincidencias en `maquetas/*.html` |
| n2 | Tres formatos de número de pedido en ejemplos: `ADR-20485` (maquetas), `AT-2026-000123` (Design Doc), `ORD-2026-000123` (API). | `pedido-confirmado.html:133`, `design-doc.md:231`, `api-rest.md:303` |
| n3 | Cupón de ejemplo `ADRIAN10` en maquetas vs. `ADRIANA10` en el contrato. | `carrito.html:203`, `design-doc.md:227` |
| n4 | Typo «concerted» en el título de la sección de deltas del modelo lógico. | `modelo-logico-er.md:610` |

---

## 5. Tabla de consistencia cruzada

| Tema | Valor en requisitos / diseño | Valor en datos / seguridad / infra / scrum | Resultado |
|---|---|---|---|
| Pasarela | Wompi principal, ePayco plan B, MP y Stripe descartados (`design-doc.md:143-165`, `ADR-002:25`) | Idéntico en `pagos-y-pci.md:6-7`, `diagramas.md:23-24`, `plan-despliegue.md:186`, `backlog-inicial.md:66`; residuo `mercado-pago` en `api-rest.md:549` | **OK** con observation (m6) |
| Modelo de inventario | `inventory(variant,branch)` fuente de verdad, sin lotes (`design-doc.md:173-185`, `ADR-003:18-30`) | `inventory_lots(lot,site)` fuente de verdad + FEFO (`modelo-logico-er.md:569,589`, `reglas-negocio.md:96`), D5 «decidido» en `README.md:38` | **CONTRADICCIÓN (B1)** |
| Dinero e IVA | `Int` COP enteros (`ADR-004:35`); IVA por línea `base=round(total/1,19)` (`design-doc.md:103`) | BIGINT centavos (`api-rest.md:21`, `README.md:36`); misma fórmula IVA (`reglas-negocio.md`); coste con/sin IVA dudoso (`presupuesto.md:131`) | **CONTRADICCIÓN (B2)** + m2 |
| Roles RBAC | Cliente, Vendedor tienda, Admin, Superadmin (`design-doc.md:21,247-252`, `RF-066`) | Cuatro roles en `requisitos-seguridad.md:66` («Vendedor») y `ADR-005:27`; actor «Finanzas/Admin» en `maquinas-estado.md:218` | **OK** (variación de nombre; aclarar «Finanzas» como permiso) |
| Estados de pedido | Español: `PENDIENTE_PAGO`, `PAGADO`, `LISTO_PARA_RETIRO`, `REEMBOLSADO` (`RF-028, RF-031, RF-053`) | Inglés: `PENDING_PAYMENT → PAID → PREPARING → PACKED → DELIVERED` (`maquinas-estado.md:30-56`) | **CONTRADICCIÓN (M5, M6)** |
| SLOs y error budget | 99,9 %, API p95 <400 ms, checkout >97 %, webhook p95 <60 s, factura p95 <15 min, job <1 %, RPO ≤5 min/RTO ≤1 h (`design-doc.md:90,345`, `RNF-019..028`) | Idénticos en `monitoreo-y-alertas.md:88-101`, `ADR-006:68`, `metricas-exito.md:106,119`, `plan-sprints.md:207`; 43,2 min vs. «43 min» en `RNF-019` | **OK** (redondeo Nit) |
| Costes y TRM | TRM 4.000 en v1.0 (`DESIGN_DOC.md:2631`, `ADR-006:82`); cotización 3.317 (`analisis-hosting.md:33`) | Presupuesto USD 334/412 mensuales, coherente con TRM 4.000 (`presupuesto.md:66,92`); discrepancia TRM ya registrada como Q12 | **OK** — decisión pendiente del Comandante |
| Plazos y sprints | 2 semanas, 8 sprints, 143 pts/26 historias citadas (`design-doc.md:269,283`) | S0+S1–S8 = 17 semanas, 259 pts/40 historias (`plan-sprints.md:8-9,51`); reconciliado en `README.md:100` como núcleo de diseño vs. backlog completo | **OK** con observación (B3: falta POS) |
| IDs de historias | HU-001..HU-026, EP-01..EP-08, RF-001..RF-077, RNF-001..RNF-032: secuencias completas, sin duplicados | Backlog usa IDs `FUN/DIS/CAT/...` distintos pero con índice propio; 40 historias, suma 259 verificada | **OK** (dos sistemas de IDs, pero documentados) |
| IDs de preguntas abiertas | DD-Q1..Q9 (`design-doc.md:380-388`) | RM-Q1..Q12 (`README.md:110-121`) con significados cruzados | **CONTRADICCIÓN (M4)** |
| Venta POS | Crítica, RF-036/HU-019, gate E2E (`design-doc.md:325`) | Ausente del backlog y del plan de sprints | **CONTRADICCIÓN (B3)** |
| Autenticación | Cookie httpOnly access+refresh, SameSite=Lax, MFA Admin/Superadmin (`design-doc.md:245`, `ADR-005:18`) | `Bearer` en API (`api-rest.md:29`), Strict en SEC-023, MFA ambigua en ADR-005 | **CONTRADICCIÓN (M1, m1, m8)** |
| Rate limiting | Login 10/min, checkout 20/min (`RNF-016`) | Login 5/15 min, checkout 30/min (`api-rest.md:65,67`, `SEC-011:155`) | **CONTRADICCIÓN (M2)** |
| Contrato de pedido | `POST /api/v1/orders` con `branchId`/`paymentUrl` (`design-doc.md:219`) | `POST /checkout` con `cartId`/`checkoutUrl` (`api-rest.md:238`) | **CONTRADICCIÓN (M3)** |
| ERD ↔ Prisma ↔ diccionario | 6 esquemas lógicos, fuente PostgreSQL única (`design-doc.md:193-204`) | 50 entidades ER, 50 modelos Prisma con `@@map`, 50 tablas en el diccionario: **0 huérfanas, 0 faltantes**. Solo `idempotency_keys`/`outbox_events` sin relación graficada (aceptable) | **OK** — mejor parte de la documentación |
| Máquinas de estado | Webhook manda; redirección nunca confirma; estados monotónicos (`design-doc.md:165`, `RF-030, RF-034`) | Coincide en `maquinas-estado.md:12-22`, HMAC y dedupe en `SEC-025`; excepción `RETURN_REQUESTED → DELIVERED` | **OK** con M6 |
| Pruebas y release | ≥70 % global/≥80 % core/100 % críticos, 20 E2E, canary 5/25/100, rollback <2 min (`design-doc.md:322-352`) | Idéntico en `estrategia-pruebas.md:20-27,232`, `definicion-terminado.md:99,234`, `plan-despliegue.md:67-75` | **OK** (salvo el E2E de POS ausente, B3) |
| Seguridad bloqueante | SAQ-A, sin PAN, MFA, cifrado AES-256-GCM, audit append-only, secretos fuera del repo (`design-doc.md:89,210-214`) | Requisitos SEC-001..SEC-030 con estado BLOQUEANTE, HMAC sobre raw body + `timingSafeEqual` + ventana 5 min (`pagos-y-pci.md:85-95`, `requisitos-seguridad.md:261-265`) | **OK** |
| Maquetas | 1 `<h1>` por maqueta, `alt` en todas las imágenes, `lang="es"`, `prefers-reduced-motion`, responsive, un único `<script>` (CDN Tailwind), sin JS de aplicación, contraste AA verificado | 10/10 maquetas pasan los controles automáticos; desviaciones menores de paleta (m4) y `aria-live` (n1) | **OK** |

---

## 6. Contradicciones que el Comandante debe resolver (con recomendación)

1. **FEFO/lotes vs. `inventory` por variante+sede (B1).** Recomendación: **aprobar FEFO**, enmendar ADR-003/Design Doc y añadir RF y backlog; es la única opción que justifica la trazabilidad exigible a cosméticos. Si se rechaza, eliminar D5, Q9 y todo el modelo de lotes del repositorio documental.
2. **COP enteros vs. centavos (B2).** Recomendación: **BIGINT centavos**, por compatibilidad con Wompi y con el modelo de datos/API ya escrito. Actualizar ADR-004 y la frase de `design-doc.md:241`.
3. **POS dentro o fuera del MVP (B3).** Recomendación: **mantenerlo en MVP** y añadir la historia y su E2E; es una de las tres razones del modelo multi-sede. Si se difiere, quitarlo de gates y de la matriz de riesgos.
4. **Transporte del access token (M1).** Recomendación: **cookie httpOnly** en el storefront; `Bearer` solo para integraciones servidor-servidor, documentado explícitamente.
5. **Umbrales de rate limit (M2).** Recomendación: **el más estricto** (5 intentos/15 min por IP+cuenta; checkout 20 req/min), con backoff y CAPTCHA; propagar a RNF-016 y ADR-005.
6. **Esquema de creación de pedido (M3).** Recomendación: **`POST /checkout` canónico**; el ejemplo del Design Doc se reescribe, no se añade un segundo endpoint.
7. **Numeración de preguntas abiertas (M4).** Recomendación: prefijos por documento y una única tabla maestra de decisiones con dueño, fecha y estado.
8. **MFA para vendedores (m8).** Recomendación: **MFA para Admin/Superadmin en MVP**, vendedores con sesión de tablet de 8 h y MFA diferida a Fase 2; cerrar Q6 antes de Sprint 1.
9. **TRM 4.000 vs. 3.317 y PITR 7 vs. 30 días.** Recomendación: una sola cifra al cliente (recomendación: rango con TRM vigente del día de cierre, no un valor fijo) y decidir PITR con el coste de `presupuesto.md:94` antes del go-live. Ya está registrado como Q12/Q11; solo falta la decisión.

---

## 7. Proceso y formalidad

- Scrum, DoR/DoD, estrategia de pruebas, matriz de riesgos, plan de release, canary y rollback están **alineados** con el Design Doc (ver tabla). La única desalineación de proceso es la ausencia de la historia POS (B3).
- `forge-sentinel`, `forge-qualis` e `forge-infra` siguen con firma pendiente (`design-doc.md:398-401`). **Este LGTM no existe y, cuando se emita, no sustituirá esas aprobaciones**: los cambios B1, B2 y m1/m8 tocan datos, PII y auth, por lo que requieren visto bueno explícito de `forge-sentinel`.
- No se encontraron secretos reales, claves, tokens ni credenciales en ninguno de los 57 archivos (los ejemplos usan `<VALUE>`/`example.com`). No se encontraron datos personales reales: teléfonos y documentos son ficticios.
- Las 10 maquetas son artefactos de diseño: contienen exclusivamente el CDN de Tailwind como `<script>`, sin `fetch`, `localStorage` ni manejadores `onclick`; llevan el aviso de «no es código de producción». Cumplen.
- El español para el cliente es claro y consistente; los ejemplos de código y comentarios están en inglés donde corresponde. Se detectó el typo «concerted» (n4).
- **No se escribió código de producción ni se modificó ningún artefacto existente.** La única escritura de esta revisión es este informe en `docs/08-review/lgtm-documentacion.md`. El workspace no es un repositorio Git, por lo que **no se realizó ningún commit** y no se solicitó hacerlo.

---

## 8. Cierre

**Veredicto final: REQUEST CHANGES.** Reenvío a `forge-architect` para B1–B3 y al Comandante para las nueve decisiones de la sección 6. Una vez corregidos los bloqueantes y registradas las decisiones mayores en los artefactos, este revisor emitirá LGTM con las observaciones Menores/Nit documentadas como seguimiento.
