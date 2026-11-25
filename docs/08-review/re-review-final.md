# Re-review final de documentación — Adriana Tienda

| Campo | Valor |
|---|---|
| **Revisor** | `forge-reviewer` (Gatekeeper APEX FORGE) — veredicto independiente |
| **Fecha** | 24 de noviembre de 2026 |
| **Originado por** | `docs/08-review/lgtm-documentacion.md` — REQUEST CHANGES (21 hallazgos) |
| **Autoridad aplicada** | `docs/02-arquitectura/decisiones-comandante.md` — C-01…C-15 (tabla maestra ejecutoria) |
| **Alcance** | Los 57 archivos bajo `docs/`, re-grepados tras la enmienda; verificaciones por reemplazo (no por apéndice) |
| **Veredicto** | **LGTM FINAL** — sin condiciones de documentación |
| **Cierre** | R1–R3 corregidos en los cinco `archivo:línea` señalados; **21/21 hallazgos originales cerrados** |
| **Design Doc** | Autorizado a pasar a **`Approved`** |

---

## 1. Veredicto

**LGTM FINAL — sin condiciones de documentación.**

En la iteración anterior el Gatekeeper emitió REQUEST CHANGES por tres valores residuales (R1, R2, R3). El equipo los ha corregido **por reemplazo, en los cinco `archivo:línea` exactos** señalados, y se ha verificado por re-lectura y grep que no subsisten `20 escenarios`, `20/20`, `40 historias`, `en recálculo`, `10 req/min` ni estados residuales vigentes. Las únicas apariciones que quedan de esos literales están en cláusulas de prohibición o registros de verificación (`visto-bueno-diseno.md:48`, `api-rest.md:488-489`, `maquinas-estado.md:32-33`, `modelo-prisma-documental.md:165-166`), no como valores operativos.

Con esto, **los 21 hallazgos del review inicial están cerrados**: B1–B3, M1–M6, m1–m8 y n1–n4. El detalle de los cinco puntos corregidos consta en la sección 2.

Las condiciones de verificación en staging registradas por `forge-sentinel` (§5), los gates de ejecución de `forge-qualis` y las condiciones de go-live de `forge-infra` pertenecen a la fase de implementación/release y **no forman parte de este gate de documentación**.

---

## 2. Cierre de R1–R3 (evidencia de los cinco puntos corregidos)

> Estado: los tres hallazgos fueron **REQUEST CHANGES** y están **CERRADOS**. Se conserva su detalle como registro de trazabilidad; ya no bloquean.

### R1 — Límite de checkout (reabierta M2) → **CERRADO**

- **Corrección verificada:** `docs/07-infra/arquitectura-despliegue.md:312` ahora dice:
  `| Rate limiting | /api/v1/checkout (y alias POS) | **20 req/min por sesión** + Idempotency-Key (C-05, visto bueno de forge-sentinel) |`
- El antiguo renglón `/api/v1/orders, /checkout | 10 req/min/IP` desaparece: es reemplazo, no apéndice.
- **Coherencia:** coincide con C-05 (`decisiones-comandante.md:44-46`), `ADR-005:33`, `RNF-016:57`, `api-rest.md:82` y `requisitos-seguridad.md:154-159`. La condición de `forge-sentinel` (`visto-bueno-diseno.md:48`: retiro del OK si aparece `10/min`) queda **satisfecha**.
- **Grep de regresión:** sin `10 req/min` vivo en `docs/`.

### R2 — Recuento de backlog «en recálculo» (reabierta m5) → **CERRADO**

- **Corrección verificada:**
  - `docs/02-arquitectura/design-doc.md:301` (§4.7): «el backlog completo de entrega (**42 historias / 280 puntos**, ya recalculado con Fibonacci estricta según **C-11** y verificado por `forge-qualis`)».
  - `docs/01-requisitos/historias-usuario.md:226` (DD-Q14): «(**42 historias / 280 puntos**, cerrado por C-11)».
- **Coherencia:** coincide con `backlog-inicial.md:42` (24+10+57+26+31+23+35+15+8+16+35 = 280; 4+2+6+3+4+4+5+3+2+2+7 = 42), `README.md:104`, `plan-sprints.md:14,46-58` y la firma `visto-bueno-qualis.md:190` (suma de sprints del README: 11+31+34+34+34+39+34+34+29 = 280).
- **Grep de regresión:** sin `40 historias` ni `en recálculo` vivos en `docs/`.

### R3 — Compuerta E2E con recuento antiguo (reabierta el gate de B3) → **CERRADO**

- **Corrección verificada:**
  - `docs/02-arquitectura/design-doc.md:364` (§7): «**21 escenarios**: … pedido POS (`OPS-09`) — gate de release».
  - `docs/07-infra/plan-despliegue.md:71` (etapa 8): «21 escenarios (… **E2E-21 pedido POS**) … Gate de salida: **21/21 en verde**; E2E-21 es gate no omisible».
- **Coherencia:** coincide con `visto-bueno-qualis.md:104,107,121,178`, `estrategia-pruebas.md:28,99,385`, `README.md:102` y `definicion-terminado.md:238`. La compuerta de CI ya no puede liberar sin el E2E POS.
- **Grep de regresión:** sin `20 escenarios` ni `20/20` vivos en `docs/`.

---

## 3. Cierre de los 21 hallazgos originales

| ID | Estado | Evidencia (texto vigente, `archivo:línea`) |
|---|---|---|
| **B1** | ✅ Resuelto | `design-doc.md:176,185,194`; `ADR-003:16,20,29`; `ADR-004:20,28`; RF-051 (`requisitos-funcionales.md:131`); `diccionario-datos.md:301,343,353`; `reglas-negocio.md:88,97`; `README.md:37`. `branch_id`/`sucursal_id` solo en cláusulas de prohibición; FEFO 90/15 cerrado (C-01); RF-078..RF-081 y EP-05 añadidas. |
| **B2** | ✅ Resuelto | `ADR-004:37`; `design-doc.md:21,37,106,243,330`; `diccionario-datos.md:23-24,58-83`; `api-rest.md:23-24,152-154`; `README.md:38`. Todo `*_cents` BIGINT, IVA `1900 bp`, prohibido `1900` como decimal. |
| **B3** | ✅ Resuelto | `OPS-09` (8 pts, S6) en `backlog-inicial.md:42,75,557` y `plan-sprints.md:52`; E2E-21 en `estrategia-pruebas.md:28,99`; `visto-bueno-qualis.md:104`. Recuento del gate corregido a 21/21 (R3). |
| **M1** | ✅ Resuelto | `api-rest.md:34,39,306,672`; `ADR-005:18,24,25`; `design-doc.md:250,275`; `requisitos-seguridad.md:52,237`. Cookie `httpOnly` en cliente; `Bearer` solo S2S. |
| **M2** | ✅ Resuelto | Correcto en `ADR-005:33`, `RNF-016:57`, `api-rest.md:82`, `SEC-011:154-159`; residual de `arquitectura-despliegue.md:312` corregido (R1). |
| **M3** | ✅ Resuelto | `design-doc.md:170,226,269`; `api-rest.md:269-270`; `ADR-002:34`; `maquinas-estado.md:86`. `POST /api/v1/checkout` único; `/orders` solo consulta; alias POS documentado (C-14). |
| **M4** | ✅ Resuelto | `design-doc.md:417,421-435` (`DD-Q1..Q15`); `README.md:110-121` (`RM-Q1..Q8`); `metodologia-scrum.md:18`. Sin ID `Qn` suelto vigente. |
| **M5** | ✅ Resuelto | RF-032 (`requisitos-funcionales.md:32`); `design-doc.md:269`; `diccionario-datos.md:697`; `maquinas-estado.md:79`. Español = etiqueta UI; inglés = identificador canónico C-08. |
| **M6** | ✅ Resuelto | `design-doc.md:271`; `maquinas-estado.md:32-33,97,266`; RF-034/039 (`:98,103`); `flujos-pagos.md:190`. `RETURN_REQUESTED → DELIVERED` eliminado; `RETURN_REJECTED` terminal; MT-06 ajustado. |
| **m1** | ✅ Resuelto | `ADR-005:18,24`; `design-doc.md:275,444`; `modelo-amenazas.md:97`. `Strict` con única excepción `Lax` documentada para retorno Wompi. |
| **m2** | ✅ Resuelto | `pagos-y-pci.md:150`; `design-doc.md:166,449`; `monitoreo-y-alertas.md:59`; `visto-bueno-infra.md:57-62`. Comisión **sin IVA**, sin `× 1,19`. |
| **m3** | ✅ Resuelto | `sistema-diseno.md:70,236,405`; `maquetas/README.md:33`. Ratio corregido a **5,82:1**; eliminado el 6,4:1. |
| **m4** | ✅ Resuelto | `sistema-diseno.md:115-122,373-380,407` añade `--color-alert`, `--color-warning-soft`, `--color-row-review` y `--color-text-disabled` (`#6B5F63`, 6,10:1); maquetas usan esos tokens; `#9A8F92` prohibido. |
| **m5** | ✅ Resuelto | Backlog corregido (`backlog-inicial.md:10,42`, `README.md:104`, `visto-bueno-qualis.md:190`); residuales de `design-doc.md:301` y `historias-usuario.md:226` corregidos (R2). |
| **m6** | ✅ Resuelto | `design-doc.md:163,168,452`; `api-rest.md:711-712`; `diagramas.md:184`. Sin adaptador `mercado-pago` en el contrato. |
| **m7** | ✅ Resuelto | `design-doc.md:10` declara que absorbe al raíz v1.0; enlaces relativos en `metodologia-scrum.md:13-16`, `backlog-inicial.md:14-15`, `visto-bueno-infra.md:9`, `checklist-lanzamiento.md:8`. |
| **m8** | ✅ Resuelto | `ADR-005:18`; `design-doc.md:23,275`; `RNF-015:56`; RF-062 (`:147`); `visto-bueno-diseno.md:42`. MFA Admin/Superadmin; vendedores tablet 8 h, MFA Fase 2; DD-Q12 cerrada. |
| **n1** | ✅ Resuelto | `sistema-diseno.md:304,327,344-346,430`; `maquetas/README.md:34`; `definicion-terminado.md:115`. `aria-live` = requisito de implementación, no de maqueta estática. |
| **n2** | ✅ Resuelto | `pedido-confirmado.html:133`, `seguimiento-pedido.html:136`, `api-rest.md:338,445`, `design-doc.md:240`; formato `AT-AAAA-XXXXXX` en C-15 (`decisiones-comandante.md:102`). |
| **n3** | ✅ Resuelto | `carrito.html:203,206`, `pedido-confirmado.html:211`, `api-rest.md:279`, `sistema-diseno.md:409`: cupón único `ADRIANA10`. |
| **n4** | ✅ Resuelto | `decisiones-comandante.md:21` ordena la corrección; `modelo-logico-er.md:604` ya usa «DD-Q9 / RM-Q9» sin «concerted». |

**Recuento final: 21/21 cerrados.** Ningún hallazgo sigue abierto.

### Verificaciones transversales adicionales (sin hallazgo)

- **Precedencia y firmas:** C-01…C-15 presentes en `decisiones-comandante.md`; C-13 (estados retirados), C-14 (alias POS) y C-15 (numeración) propagados. `RETURNED`/`SHIPPED`/`PAID_NEEDS_REVIEW` solo aparecen como negación o como `ShipmentStatus` (`maquinas-estado.md:179-185`, `diccionario-datos.md:591,703`, `modelo-prisma-documental.md:227-237`) — correcto, no son `OrderStatus` vivos.
- **TRM y PITR:** 4.000/USD único con nota de estimación (`presupuesto.md:16`, `visto-bueno-infra.md:44-47`); PITR 7 días + dump frío 30 días y PITR 30 días como mejora no bloqueante (`backups-y-recuperacion.md`, `visto-bueno-infra.md:72-80`).
- **Maquetas:** 10/10 con un solo `<h1>`, `alt` en todas las imágenes, `lang="es"`, `<main>`/`<nav>`, `prefers-reduced-motion`, un único `<script>` (CDN Tailwind) y cero `onclick`/`fetch`/`localStorage`. Sin estados retirados en las etiquetas UI.
- **Seguridad:** sin secretos reales (marcadores `<VALUE>`), SAQ-A y HMAC sobre raw body con `timingSafeEqual` y 5 min intactos (`pagos-y-pci.md §4`).
- **Proceso:** **no se escribió código de producción** (ningún `.ts/.tsx/.js/.py` nuevo fuera de `docs/`; los únicos `.js` del árbol son `node_modules` preexistentes en `cotizacion/`) y **no se hizo ningún commit**: el workspace no es repositorio Git (`git rev-parse` → «no es un repositorio git»). La única escritura de esta revisión es este informe.

---

## 4. Firmas recibidas

| Rol | Documento | Resultado | Alcance / límite |
|---|---|---|---|
| `forge-sentinel` | `docs/06-seguridad/visto-bueno-diseno.md:9,103` | **OK CONDICIONADO (diseño)** — 23 nov 2026 | Cubre C-01/C-02/C-04/C-05. **Condición R1 satisfecha**: `arquitectura-despliegue.md:312` usa el valor canónico C-05. No autoriza go-live (condición de staging, fuera de este gate). |
| `forge-infra` | `docs/07-infra/visto-bueno-infra.md:7,118` | **APROBADO DE DISEÑO** — 23 nov 2026 | Cierra C-09 y C-12 en `docs/07-infra/`. R3 (`:71`) corregido a 21/21 con E2E-21 no omisible. No autoriza despliegues. |
| `forge-qualis` | `docs/05-scrum/visto-bueno-qualis.md:10,208` | **FIRMA DE DISEÑO: APROBADA** — 23 nov 2026 | Cierra C-03, C-11 y C-13 en `docs/05-scrum/*`. Firma de ejecución/Go-No-Go pendiente del Día D. |
| `forge-reviewer` (este informe) | `docs/08-review/re-review-final.md` | **LGTM FINAL** — 24 nov 2026 | 21/21 hallazgos cerrados; sin condiciones de documentación. No aprueba código (no existe). |
| `apex-forge` (Comandante) | `decisiones-comandante.md:114` | Decisiones emitidas; firma final pendiente | Firma el go-live tras LGTM + verificación en staging. |

---

## 5. ¿Puede el Design Doc pasar a Approved?

**SÍ. Confirmo explícitamente que el Design Doc puede pasar a `Approved`.**

`README.md:130` condicionaba el cambio de estado al LGTM del Gatekeeper sobre los artefactos enmendados, y `decisiones-comandante.md:114` lo condicionaba a LGTM + firmas. Ambas condiciones están cumplidas:

- **LGTM emitido** en este informe, sin condiciones de documentación;
- **21/21 hallazgos cerrados**, incluidos R1–R3 en sus cinco `archivo:línea` exactos;
- **firmas de diseño recibidas** de `forge-sentinel` (OK condicionado, condición R1 ya satisfecha en el artefacto), `forge-infra` (APROBADO DE DISEÑO) y `forge-qualis` (FIRMA DE DISEÑO APROBADA);
- precedencia resuelta (C-07/C-12): manda `decisiones-comandante.md`, después `docs/02-arquitectura/design-doc.md`.

Las verificaciones en staging de `forge-sentinel` (§5), los gates de ejecución de `forge-qualis` y las condiciones de go-live de `forge-infra` siguen vigentes **para la fase de implementación/release**, pero no son condiciones de este gate documental y no impiden el estado `Approved` del diseño.

---

**Veredicto final: LGTM.** 21/21 hallazgos cerrados. Design Doc autorizado a pasar a **Approved**.
