# Visto bueno de `forge-qualis` — firma de **DISEÑO**

| Campo | Valor |
|---|---|
| **Proyecto** | Adriana Tienda — e-commerce de belleza (Colombia, COP, dos sedes físicas) |
| **Autor / firmante** | `forge-qualis` (Quality & Reliability / SRE) |
| **Tipo de firma** | **DISEÑO**: aprobación de la estrategia de pruebas, las compuertas y los criterios de release. **NO es firma de ejecución.** |
| **Versión** | 1.0 |
| **Fecha** | **23 de noviembre de 2026** |
| **Estado** | **APROBADO para diseño**. La firma de ejecución (Go/No-Go) queda pendiente y condicionada a evidencia real del Día D |
| **Alcance** | `docs/05-scrum/*` — estrategia de pruebas, matriz de riesgos, backlog inicial, métricas de éxito, plan de sprints, definición de terminado, metodología Scrum |
| **Documentos relacionados** | [`estrategia-pruebas.md`](./estrategia-pruebas.md) v1.1, [`matriz-riesgos.md`](./matriz-riesgos.md) v1.1, [`backlog-inicial.md`](./backlog-inicial.md) v1.1, [`metricas-exito.md`](./metricas-exito.md) v1.1, [`plan-sprints.md`](./plan-sprints.md), [`definicion-terminado.md`](./definicion-terminado.md), [decisiones del Comandante](../02-arquitectura/decisiones-comandante.md) |

> **Aclaración de alcance (no negociable).** Esta firma aprueba el **diseño** del sistema de calidad:
> qué se prueba, con qué umbrales, quién valida, cómo se escala el canary y cómo se revierte.
> **No certifica ejecución**: a la fecha de este documento no hay E2E ejecutados, ni canary
> desplegado, ni simulacro de rollback medido. Las firmas de ejecución de §5 y el Go/No-Go de §7
> los emite `forge-qualis` en el Día D con fecha/hora, evidencia y métricas reales. Ninguna fila de
> este documento afirma que un despliegue ya ocurrió.

---

## 1. Verificación de C-13 en `docs/05-scrum/*`

Se ejecutó búsqueda literal y case-insensitive sobre los **siete documentos preexistentes** de la
carpeta (antes de crear este visto bueno, que es el octavo) para los identificadores retirados por
C-13. Las apariciones en la tabla siguiente son exclusivamente negaciones/prohibiciones explícitas
de este documento de firma.

| Identificador retirado | Resultado de la búsqueda |
|---|---|
| `PAID_NEEDS_REVIEW` | 0 apariciones |
| `SHIPPED` | 0 apariciones |
| `RETURNED` | 0 apariciones |
| `PICKED_UP_READY` | 0 apariciones |
| `DRAFT` (como `OrderStatus`) | 0 apariciones |

**Único hallazgo case-insensitive (fuera de alcance, se conserva):** `backlog-inicial.md` línea 121,
«el Design Doc en estado *Draft* … queda en *Approved*». Es el **ciclo de vida del documento**, no
un estado de pedido; C-13 retira `DRAFT` únicamente como `OrderStatus`. No se modifica.

**Canónica vigente confirmada en la carpeta** (no se encontraron usos divergentes):

| Situación | Representación canónica | Dónde queda reflejado |
|---|---|---|
| Pago aprobado tras expirar la reserva | Pedido `PENDING_PAYMENT` + `reviewRequired=true` (`payments.status = PAID`) | `estrategia-pruebas.md` §2.1; `backlog-inicial.md` (PAG-04, reglas de pago); `matriz-riesgos.md` R4/R5; `metricas-exito.md` §3.2 |
| Envío a domicilio | `OUT_FOR_DELIVERY` | `backlog-inicial.md` (criterios de cancelación de pedido); `metricas-exito.md` §3.2 |
| Retiro confirmado en sede | `DELIVERED` | `backlog-inicial.md` (recogida en tienda) |
| Retracto | `RETURN_REQUESTED` → `RETURN_REJECTED` o reembolso; **sin** `RETURNED` | `estrategia-pruebas.md` E2E-20; `metricas-exito.md` §3.2 |

**Conclusión de verificación:** no fue necesario corregir ningún archivo; la propagación de C-13 en
esta carpeta ya está completa y no introduje cambios en los documentos existentes.

---

## 2. Estrategia de pruebas aprobada

**Aprobada:** [`estrategia-pruebas.md`](./estrategia-pruebas.md) **v1.1** (23 nov 2026), con sus
ocho preguntas de «estrategia suficiente» (§10) como criterio de cierre. Pirámide validada:

- **Unitarias (Vitest)** — dominio, precios en `BIGINT` centavos con IVA 1900 bps, cupones,
  máquinas de estado, reglas FEFO y casos límite monetarios (§2.1.1).
- **Integración (Testcontainers)** — Postgres/Redis reales, transacciones, idempotencia,
  concurrencia web/web y **web/POS**, outbox, autorización y rate limits (§2.2).
- **Contrato (fixtures + Zod)** — Wompi, ePayco, DIAN, transportadora, GA4/Consent Mode (§2.3).
- **E2E (Playwright)** — 21 flujos críticos, 375 px, tablet POS y desktop (§2.4).
- **Accesibilidad / visual / rendimiento / carga-caos / seguridad** (§2.5–§2.9).
- **Rate limits (C-05)** — valores únicos: login 5/15 min por IP+cuenta, checkout 20 req/min por
  sesión con `Idempotency-Key`; 8 casos dedicados (§2.10).

**Responsabilidades aprobadas (§6):** el ingeniero que construye escribe y ejecuta; `forge-reviewer`
firma PR; `forge-qualis` firma cobertura, E2E, accesibilidad, rendimiento, carga y Go/No-Go;
`forge-sentinel` firma pagos, PII, auth y fiscal; `forge-infra` ejecuta despliegue y rollback.

**Autoridad aprobada:** `forge-qualis` bloquea el release si falta evidencia de cualquier fila. El
Comandante arbitra conflictos con el PO. Sin atajos por presión de fecha (R16).

---

## 3. Los 21 escenarios E2E — aprobados como gate de release

| # | Escenario | Dispositivo |
|---:|---|---|
| 1 | Home → categoría → PLP → PDP → bolsa | 375 px |
| 2 | Búsqueda con typo → resultado → PDP | 375 px |
| 3 | Filtro por necesidad + faceta de marca, URL compartible | 375 px |
| 4 | Cambio de variante sin recarga (precio/imagen/stock/URL) | Desktop |
| 5 | Variante agotada bloquea CTA y ofrece «avísame» | 375 px |
| 6 | Quick-add desde PLP con selector de variante, `aria-live` | 375 px |
| 7 | Carrito invitado persiste tras cerrar navegador | 375 px |
| 8 | Merge de bolsa invitada al iniciar sesión | Desktop |
| 9 | Cupón válido aplica y se revierte al quitarlo | 375 px |
| 10 | Cupón expirado se rechaza sin cambiar el total | 375 px |
| 11 | Checkout con envío a ciudad y ETA | 375 px |
| 12 | Checkout con recogida en sede (Bogotá/Medellín) | 375 px |
| 13 | Pago con tarjeta aprobada (fixture Wompi), sin PAN en el DOM | 375 px |
| 14 | Pago rechazado + reintento con otro método, reserva <30 min | 375 px |
| 15 | PSE (mock) y Nequi (mock), condiciones visibles | 375 px |
| 16 | Webhook duplicado no duplica pedido ni email | API + UI |
| 17 | Contraentrega con límite y OTP | 375 px |
| 18 | Confirmación: factura, ETA, evento `purchase` único | Desktop |
| 19 | Tracking público con número + email + rate limit, sin fuga | 375 px |
| 20 | Retracto dentro de 5 días hábiles → nota crédito (Ley 1480) | Desktop |
| **21** | **Pedido POS: descuenta lote FEFO, cuadra IVA en centavos y no sobrevende si coincide con checkout web** | **Tablet POS + API** |

**Política de ejecución aprobada:** PR → smoke `{1, 7, 13, 18, 21}`; merge a trunk → suite completa
en staging; release → suite completa **×3** para detectar flakiness. **E2E-21 no se puede omitir ni
marcar `skip`: es condición de Go/No-Go (C-03).** Cero tests flaky sin cuarentena con dueño y fecha.

---

## 4. Coberturas aprobadas (diseño de los umbrales)

| Capa | Umbral | Gate |
|---|---:|---|
| Global de líneas (Vitest CI) | ≥70% | Bloquea merge si baja sin justificación |
| `packages/core` (dominio) | ≥80% líneas y ramas críticas | Bloquea merge |
| Flujos de pago | 100% de ramas críticas | Bloquea release |
| Integración BD/cola | 100% de flujos críticos (transacción, reserva concurrente, outbox) | Bloquea merge |
| Contratos externos | 100% de eventos mapeados | Bloquea merge |
| E2E | **21/21**, incluido E2E-21 POS | Bloquea release |
| Accesibilidad (axe 2.2 AA) | 0 violaciones críticas/serias | Bloquea release |
| Lighthouse | ≥90 en Home, PLP, PDP, Checkout | Bloquea release |
| CWV p75 móvil (LCP / INP / CLS) | <2,5 s / <200 ms / <0,1; sin regresión >10% | Bloquea release |
| Carga (k6) | 200 rps 15 min, p95 API <400 ms, errores <0,1%; pico 400 rps sin 5xx | Bloquea release |
| Seguridad | 0 críticos (audit + ZAP + Semgrep + gitleaks) + visto bueno Sentinel | Bloquea merge/release |

**Regla de descenso:** caída >2 puntos respecto al sprint anterior requiere justificación escrita en
el PR; sin ella, bloquea merge. La cobertura se mide **por capa** y se reporta en CI.

---

## 5. Canary 5% → 25% → 100% — firma de diseño en cada promoción

La firma de la columna **Diseño** es mía y aprueba la compuerta tal como está diseñada. La columna
**Ejecución** es deliberadamente *PENDIENTE*: se completa el Día D con hora, evidencia y métricas
reales. **Sin SLOs en verde no se promociona**; cualquier señal roja devuelve al paso anterior o
dispara rollback (§6). Autoridad de No-Go: `forge-qualis`.

| Paso | Tráfico | Duración | Condición de promoción (diseño aprobado) | Firma de **diseño** | Firma de **ejecución** |
|---:|---:|---|---|---|---|
| 0 | 0% (interno) | — | Smoke tests y health checks 100% en verde; `checkout_enabled=false` en el deploy inicial | `forge-qualis` · **23 nov 2026** · APROBADO | PENDIENTE — Día D, con evidencia |
| 1 | **5%** | 24 h | Error 5xx <0,1%; checkout success >97%; LCP p75 <2,5 s; webhook lag en rango; **0 sobreventas web/POS**; 0 incidentes Sev-1 | `forge-qualis` · **23 nov 2026** · APROBADO | PENDIENTE — Día D, con evidencia |
| 2 | **25%** | 24 h | Igual que 5% + factura DIAN y guías; sin desviación >10% frente al baseline de staging | `forge-qualis` · **23 nov 2026** · APROBADO | PENDIENTE — Día D, con evidencia |
| 3 | **100%** | 72 h reforzadas | Igual que 25% + consumo de error budget dentro de lo previsto; on-call 72 h | `forge-qualis` · **23 nov 2026** · APROBADO | PENDIENTE — Día D, con evidencia |

**Señales monitorizadas en cada paso:** disponibilidad (99,9% / 43 min 12 s de budget mensual),
5xx, p95 API (<400 ms; alerta >600 ms en 15 min), checkout success (>97%; alerta <95% en 1 h),
LCP/INP/CLS, webhook lag (<60 s p95), facturas DIAN (<15 min p95), job failures (<1%), pedidos POS
y sobreventas, consentimiento y PII en logs. Si el error budget se agota → **feature freeze**; la
feature espera, no se negocia con sensaciones.

---

## 6. Rollback < 2 min — diseño aprobado

| Capa | Mecanismo de reversión | Objetivo | Evidencia a verificar en ejecución |
|---|---|---|---|
| Web | Revert a deployment anterior en Vercel / redeploy de tag inmutable | **<2 min** | Simulacro cronometrado en S8 |
| Worker | Redeploy de imagen anterior (tag inmutable) | <5 min | Simulacro en S8 |
| Funcionalidad | Feature flags `checkout_enabled`, `payments_enabled`, `search_v2` | <1 min, sin redeploy | Verificado en S7 |
| Base de datos | Migraciones expand/contract; nunca destructivas en el mismo release | Código anterior sigue funcionando | Revisión en cada PR |
| Datos | PITR (RPO ≤5 min, RTO ≤1 h) | Restauración real probada | T-2 semanas |
| Negocio | Facturación manual temporal + plan B ePayco | Seguir vendiendo | Runbook + prueba conmutación |

**Secuencia aprobada:** SLO en rojo → apagar flag afectado → revert <2 min → smoke post-rollback →
verificar pedidos/pagos/facturas en reconciliación → postmortem **sin culpables en ≤72 h** con
acciones correctivas y actualización de la matriz de riesgos. **Sin plan de reversión probado no hay
deploy.** La afirmación «rollback <2 min» es hoy un **objetivo de diseño**: en ejecución debe
presentarse el cronómetro del simulacro de S8; sin esa evidencia, No-Go.

---

## 7. Condiciones que deben verificarse antes del go-live

Checklist de Go/No-Go. **Si alguna casilla no se verifica con evidencia, el veredicto es No-Go.**

- [ ] **21/21 E2E en verde**, ejecutados ×3, incluido **E2E-21 (POS, C-03)** y 0 sobreventas web/POS demostradas.
- [ ] Coberturas de §4 en verde por capa; pagos al 100% de ramas críticas; sin descenso >2 pts sin justificación.
- [ ] Gate de CI completo en verde (lint, typecheck, unit, integración, contrato, audit, secretos, build, budget, smoke) + LGTM de `forge-reviewer` + visto bueno de `forge-sentinel` en pagos/PII/auth.
- [ ] Webhook duplicado/fuera de orden y carrera de stock sin duplicados ni sobreventa (E2E-16, integración, k6).
- [ ] axe 2.2 AA: 0 críticas/serias en móvil; teclado y lector de pantalla validados en checkout y confirmación; UAT de accesibilidad firmada por el PO.
- [ ] LCP/INP/CLS y presupuestos de JS sin regresión >10%; Lighthouse ≥90 en las cuatro plantillas.
- [ ] k6 200 rps con p95 <400 ms y errores <0,1%; pico 400 rps sin 5xx; escenarios de caos (Wompi, Meilisearch, Redis) con degradación aceptable.
- [ ] 0 críticos de seguridad (audit, ZAP, Semgrep, gitleaks); separación de credenciales y sin PII/PAN en logs ni analytics.
- [ ] **Rollback simulado en S8 con tiempo medido <2 min**, runbook actualizado y flags de apagado probados.
- [ ] SLOs, dashboards, alertas y synthetics activos; on-call 72 h; error budget disponible (consumo <50%); reglas de feature freeze aceptadas.
- [ ] Catálogo ≥95% por tanda, factura DIAN (o contingencia) operativa, plan B ePayco probado y direcciones de sedes confirmadas.
- [ ] **C-13:** ninguno de los cinco estados retirados como `OrderStatus`; pago tardío ⇒ `PENDING_PAYMENT` + `reviewRequired=true`; envío ⇒ `OUT_FOR_DELIVERY`; retiro confirmado ⇒ `DELIVERED`.
- [ ] **C-11:** 42 historias / 280 puntos, Fibonacci estricta (1, 2, 3, 5, 8, 13), sin historias de 6 ni 11.
- [ ] **C-03:** POS en el MVP (OPS-09) con E2E-21 como gate; numeración y concurrencia web/POS conforme a C-14/C-15.
- [ ] Datos de prueba sintéticos en local/CI/staging; pagos de prueba en sandbox; ningún dato real cargado en staging.

---

## 8. Confirmación de propagación en `docs/05-scrum/*`

| Decisión | Confirmación | Evidencia en la carpeta |
|---|---|---|
| **C-03 — POS/E2E-21** | **PROPAGADA** | `estrategia-pruebas.md` §1, §2.2, §2.4 (**E2E-21**, no omisible), §7 (R5), §8, §9, §10; `matriz-riesgos.md` R5, §3, §4, §5, §7; `backlog-inicial.md` (OPS-09, épica 7, criterios POS); `metricas-exito.md` §3.1 «Ventas POS» y §5 `pos_sale`; `plan-sprints.md` S6/S8 y canary 5% |
| **C-11 — Fibonacci, 42 historias / 280 puntos** | **PROPAGADA** | `backlog-inicial.md` total **42 / 280** (Sin 6 ni 11; recomputados 11→13, 6→5/8); `metricas-exito.md` velocity 28–39 pts (media 33,6); `estrategia-pruebas.md` y `matriz-riesgos.md` con enmienda C-11 declarada en su cabecera v1.1 |
| **C-13 — estados residuales retirados** | **PROPAGADA Y VERIFICADA** | Ver §1: 0 apariciones de los cinco identificadores como `OrderStatus` en los siete documentos preexistentes; canónica de pago tardío, envío y retiro confirmado reflejada en `estrategia-pruebas.md`, `backlog-inicial.md`, `matriz-riesgos.md` y `metricas-exito.md`; único «Draft» hallado es el estado del Design Doc, fuera de alcance |

---

## 9. Veredicto de la firma

**FIRMA DE DISEÑO: APROBADA.** `forge-qualis` · **23 de noviembre de 2026**.

Aprobaré el release **solo cuando** las condiciones de §7 estén verificadas con evidencia, los 21
E2E estén en verde (E2E-21 incluido), el rollback <2 min esté cronometrado y el error budget lo
permita. Las firmas de promoción 5/25/100 de §5 quedan **registradas en diseño y pendientes en
ejecución**; se emitirán con métricas reales en el Día D. Cualquier SLO en rojo, test flaky sin
cuarentena, cobertura caída o plan de reversión no probado ⇒ **No-Go**, sin excepción ni apelación a
la presión de fecha. El Comandante arbitra si hay conflicto con el PO.

> Firma de diseño ≠ certificado de calidad en producción. Este documento es la promesa de cómo se
> validará el sistema; la promesa se cumple —o se detiene— con datos, no con optimismo.
