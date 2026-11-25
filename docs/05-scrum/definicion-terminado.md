# Definition of Ready y Definition of Done — Adriana Tienda

| Campo | Valor |
|---|---|
| **Proyecto** | Adriana Tienda — e-commerce colombiano de belleza (COP, español, dos sedes) |
| **Autor** | `forge-qualis` (Quality & Reliability / SRE) |
| **Versión** | 1.1 — 23 de noviembre de 2026 (enmienda C-01, C-02, C-03, C-11, C-12) |
| **Aplicación** | **Todo** cambio de producción, sin excepciones por presión de fecha |
| **Documentos relacionados** | [`metodologia-scrum.md`](./metodologia-scrum.md), [`backlog-inicial.md`](./backlog-inicial.md), [`plan-sprints.md`](./plan-sprints.md), [`estrategia-pruebas.md`](./estrategia-pruebas.md), [`matriz-riesgos.md`](./matriz-riesgos.md), [`metricas-exito.md`](./metricas-exito.md), [Design Doc canónico](../02-arquitectura/design-doc.md), [decisiones-comandante.md](../02-arquitectura/decisiones-comandante.md) |

> **Fuentes canónicas (C-07/C-12):** [Design Doc](../02-arquitectura/design-doc.md) y tabla maestra
> de [decisiones del Comandante](../02-arquitectura/decisiones-comandante.md). La DoD se aplica
> igual a la web y al POS: mismo FEFO, mismos centavos, mismo gate E2E-21.

> **Frase que manda:** *"Terminado" no es "yo creo que funciona"; es "hay evidencia de que
> funciona, es seguro, es accesible, está revisado y se puede medir".* Sin evidencia, la historia
> vuelve al tablero en columna **En curso**.

---

## 1. Principios rectores

1. **La DoD es la puerta, no una sugerencia.** El PO no puede aceptar una historia que no cumple
   la DoD, aunque el negocio tenga prisa.
2. **El que construye, prueba.** `forge-qualis` valida la estrategia y firma el release; no
   escribe los tests por el ingeniero.
3. **Nadie aprueba su propio trabajo.** LGTM de `forge-reviewer` + visto bueno de `forge-sentinel`
   en cambios sensibles.
4. **CI en verde o no hay merge.** Sin `--no-verify`, sin "lo arreglo en el próximo commit".
5. **Todo cambio de producción trae o mantiene tests.** Si un cambio elimina cobertura sin
   justificación documentada, se bloquea.
6. **Sin métrica y fuente, no hay Done.** Cada historia debe dejar una señal observable
   (evento GA4, log estructurado, alerta o dashboard).
7. **La calidad no se negocia con la fecha.** Si hay presión de tiempo, se recorta **alcance**,
   nunca la DoD.

---

## 2. Definition of Ready (DoR) — entrada al Sprint Backlog

La DoR se valida en **Backlog Refinement** (45 min semanales) y se revalida al inicio del
Sprint Planning. Una historia que no la cumple se devuelve al PO con un motivo concreto.

| # | Criterio | Evidencia requerida | Quién valida |
|---:|---|---|---|
| 1 | **Identificable**: ID, épica y título claro | Fila en [`backlog-inicial.md`](./backlog-inicial.md) | PO |
| 2 | **Formato de historia**: Como / Quiero / Para con valor de negocio | Texto en la historia | PO |
| 3 | **Criterios de aceptación** en Given/When/Then, mínimo 1 caso feliz + 1 de fallo | CA escritos y numerados | PO + Qualis |
| 4 | **Estimación acordada** en puntos **Fibonacci estricta (1, 2, 3, 5, 8, 13; nunca 6 ni 11, C-11)** con Planning Poker | Valor en el backlog | Dev Team |
| 5 | **Prioridad MoSCoW** y posición en el orden del backlog | Orden actualizado | PO |
| 6 | **Dependencias** identificadas (historias, contratos, datos) | Campo de dependencias | SM + Dev Team |
| 7 | **Datos de prueba definidos**: fixtures y qué representan (réplicas sintéticas) | Nombre del fixture o dataset | Qualis |
| 8 | **Implicaciones marcadas**: accesibilidad, seguridad/PII, rendimiento, legal | Casillas Sí/No con nota | Qualis + Sentinel |
| 9 | **Tamaño viable**: ≤13 puntos y descomponible en tareas verificables | Desglose preliminar en Planning | Dev Team |
| 10 | **Cabe en la capacidad** del sprint (≤10% por encima requiere acuerdo PO) | Cálculo de puntos vs. capacidad | SM |

### 2.1 DoR exprés (checklist copiable)

```markdown
- [ ] ID y título claros
- [ ] Como / Quiero / Para completo
- [ ] CA Given/When/Then (feliz + fallo)
- [ ] Puntos acordados en Planning Poker
- [ ] MoSCoW y orden definidos
- [ ] Dependencias listadas
- [ ] Fixtures / datos de prueba definidos
- [ ] Impacto a11y, seguridad, rendimiento y legal marcado
- [ ] ≤13 puntos y descomponible
- [ ] Cabe en capacidad del sprint
```

---

## 3. Definition of Done (DoD) — salida de "En curso" a "Done"

Una historia solo puede moverse a **Done** cuando **todas** las casillas aplicables están
marcadas **y hay un enlace a la evidencia**. El autor inicialmente marca; `forge-reviewer`
verifica el bloque de código y `forge-qualis` verifica el bloque de calidad en el gate.

### 3.1 Bloque A — Funcionalidad y criterios de aceptación

- [ ] **A1.** Todos los criterios Given/When/Then se ejecutaron y pasan.
- [ ] **A2.** La demo en Review muestra el comportamiento real (no un mock de pantalla).
- [ ] **A3.** El PO aceptó o rechazó explícitamente la historia en el Sprint Review.
- [ ] **A4.** Los casos de error y límites (stock 0, monto mínimo, cupón expirado, webhook duplicado) están cubiertos por tests o evidencia manual.
- [ ] **A5.** No quedan `TODO`, `FIXME`, `console.log` de depuración ni secrets en el cambio.

### 3.2 Bloque B — Código, arquitectura y convenciones

- [ ] **B1.** TypeScript en modo estricto; sin `any` salvo capa de frontera justificada y documentada.
- [ ] **B2.** Linter y formatter del proyecto en verde, sin excepciones rápidas.
- [ ] **B3.** La lógica de negocio vive en `packages/core` / capa de dominio, no en componentes UI ni en route handlers.
- [ ] **B4.** Cambios de esquema usan migraciones versionadas **expand/contract** (nada destructivo en el mismo release).
- [ ] **B5.** Contratos de API documentados (envelope de errores, `requestId`, paginación por cursor, `Idempotency-Key` cuando aplica).
- [ ] **B6.** ADR actualizado si la historia cambia una decisión técnica.

### 3.3 Bloque C — Pruebas (obligatorio, write by builder)

- [ ] **C1.** Tests **unitarios** nuevos o ajustados por el autor para la lógica tocada.
- [ ] **C2.** Tests de **integración** contra Postgres/Redis reales cuando hay BD, transacción o idempotencia.
- [ ] **C3.** Test de **contrato** si la historia toca Wompi, ePayco, DIAN, transportadora o webhooks (fixtures de eventos, incluyendo duplicado y fuera de orden).
- [ ] **C4.** Escenario **E2E** de Playwright si la historia cambia un flujo crítico (compra, pago, tracking, retracto). Las historias INV-03 y OPS-09 comparten el **E2E-21 (pedido POS)** como gate de release.
- [ ] **C5.** Cobertura: global ≥70%, `packages/core` ≥80%, flujos de pago 100%; **sin descensos** sin justificación escrita.
- [ ] **C6.** Los tests son deterministas: sin datos reales de clientes, sin dependencia de red externa en CI, sin `sleep` arbitrarios.
- [ ] **C7.** Suite completa en verde en CI (no solo local).

> **Nota:** el umbral numérico es una red de seguridad, no un sustituto de tests significativos.
> Un test que solo aumenta cobertura sin verificar comportamiento no cuenta.

### 3.4 Bloque D — Accesibilidad (WCAG 2.2 AA)

- [ ] **D1.** Navegación completa por teclado en lo tocado (foco visible de 2 px con offset, orden lógico).
- [ ] **D2.** `axe-core` sin violaciones **críticas ni serias** en la pantalla tocada.
- [ ] **D3.** Contraste ≥4,5:1 en texto y ≥3:1 en componentes; targets ≥44 px.
- [ ] **D4.** Cambios de estado anunciados con `aria-live="polite"`; modales con focus trap y `Esc`.
- [ ] **D5.** `prefers-reduced-motion` respetado; animaciones CSS-first (sin librerías de animación).
- [ ] **D6.** Imágenes con `alt` significativo (decorativas con `alt=""`) y dimensiones explícitas (CLS 0).
- [ ] **D7.** Revisión manual de lector de pantalla en flujos críticos (checkout y confirmación), al menos una vez por release.

### 3.5 Bloque E — Seguridad, privacidad y cumplimiento

- [ ] **E1.** `forge-sentinel` aprobó el cambio si toca pagos, PII, auth, roles, webhooks o datos fiscales.
- [ ] **E2.** Ningún PAN, CVV, token de tarjeta o secreto en repo, logs, errores o analytics.
- [ ] **E3.** Datos personales cifrados donde aplica (teléfono, documento, snapshots de despacho) con claves en gestor.
- [ ] **E4.** Autorización verificada: un usuario no ve ni modifica recursos de otro (test de IDs ajenos).
- [ ] **E5.** Rate limiting y validación de entrada en endpoints públicos; errores con `requestId` sin stack traces.
- [ ] **E6.** Consentimiento registrado con versión si se recogen datos o se dispara analytics.
- [ ] **E7.** Si hay impacto fiscal (DIAN, reembolso, retracto), el plazo y la nota crédito quedan documentados.

### 3.6 Bloque F — Rendimiento y observabilidad

- [ ] **F1.** Presupuesto de la plantilla respetado (Home ≤150 KB JS, PLP ≤160 KB, PDP ≤170 KB, Checkout ≤190 KB gzip).
- [ ] **F2.** Lighthouse CI móvil: LCP <2,5 s, INP <200 ms, CLS <0,1 y score ≥90 (o sin regresión >10%).
- [ ] **F3.** Logs estructurados con `requestId`, correlación con Sentry y trazas cuando aplica.
- [ ] **F4.** Evento de negocio instrumentado (GA4 + Consent Mode v2) y verificable en el dashboard.
- [ ] **F5.** Alerta o check definido si la historia es operacional (pago, factura, stock, webhook, job).

### 3.7 Bloque G — Documentación, review y CI

- [ ] **G1.** README / contratos / ADR / runbook actualizados cuando el cambio los afecta.
- [ ] **G2.** Mensaje de commit en inglés, Conventional Commits, un cambio por commit.
- [ ] **G3.** PR con descripción: qué cambia, por qué, cómo se probó, riesgo y plan de rollback.
- [ ] **G4.** **LGTM de `forge-reviewer`**; el autor no aprobó su propio cambio.
- [ ] **G5.** Visto bueno de `forge-sentinel` cuando aplica (Bloque E).
- [ ] **G6.** CI verde: lint + typecheck + unit + integración + build + performance + security scan.
- [ ] **G7.** Deploy a staging/preview accesible y smoke test pasado.

### 3.8 Checklist reproducible por historia

```markdown
### DoD — <ID> <Título>
- [ ] A1 CA ejecutados   [ ] A2 Demo en Review   [ ] A3 Aceptación PO
- [ ] A4 Casos de error  [ ] A5 Sin TODO/secrets
- [ ] B1 TypeScript strict [ ] B2 Lint/formatter [ ] B3 Dominio bien ubicado
- [ ] B4 Migración expand/contract [ ] B5 API documentada [ ] B6 ADR
- [ ] C1 Unitarias [ ] C2 Integración [ ] C3 Contrato [ ] C4 E2E
- [ ] C5 Cobertura ≥ umbral [ ] C6 Deterministas [ ] C7 CI verde
- [ ] D1 Teclado [ ] D2 axe [ ] D3 Contraste [ ] D4 aria-live/focus trap
- [ ] D5 reduced-motion [ ] D6 alt/dimensiones [ ] D7 lector de pantalla (release)
- [ ] E1 Sentinel [ ] E2 Sin PAN/secrets [ ] E3 PII cifrada [ ] E4 Autorización
- [ ] E5 Rate limit/validación [ ] E6 Consentimiento [ ] E7 Fiscal
- [ ] F1 Presupuesto JS [ ] F2 CWV [ ] F3 Logs/Sentry [ ] F4 Evento GA4 [ ] F5 Alerta
- [ ] G1 Docs [ ] G2 Commit [ ] G3 PR [ ] G4 LGTM [ ] G5 Sentinel [ ] G6 CI [ ] G7 Staging

Evidencia: PR <url> · CI <run> · Tests <report> · Lighthouse <json> · axe <json> · Demo <url>
Métrica/signal: <nombre> · Fuente: <sistema> · Responsable: <nombre>
Firmado: autor ____ · reviewer ____ · qualis ____ · PO ____
```

---

## 4. Política "no se da por terminado hasta..."

### 4.1 Regla inquebrantable

> **No se da por terminado hasta que exista evidencia verificable de los Bloques A–G, con CI en
> verde, LGTM (y visto bueno de seguridad cuando aplica), y una métrica o señal con fuente
> identificada.**

Consecuencias automáticas de incumplirla:

| Situación | Consecuencia | Dueño de la corrección |
|---|---|---|
| CI roja en el merge | Merge bloqueado; se revierte si ya entró a trunk | Autor |
| Sin tests en cambio de producción | Sin LGTM; historia vuelve a **En curso** | Autor + reviewer |
| axe con violación crítica/seria | Sin Done; bloquea release si está en flujo crítico | Autor (frontend) |
| Sin aprobación de Sentinel en cambio sensible | Sin merge y sin release | Autor + Sentinel |
| Sin métrica/fuente | Sin Done; se documenta la señal antes de cerrar | Autor + Qualis |
| Defecto escapado en una historia ya Done | La historia vuelve a **En curso/Ready**; se contabiliza como escape defect y se analiza en retro | Autor + Qualis |
| Cobertura en descenso sin justificación | Bloqueo de release | Autor + Qualis |

### 4.2 Quién puede excepcionar (y qué no)

- El **Comandante** arbitra conflictos de prioridad y puede renegociar **alcance** con el PO.
- **`forge-qualis` puede detener un release (No-Go)** si faltan gates, tests de rollback o SLOs.
- **Nadie**, ni el Comandante ni el PO, puede excepcionar: tests de pagos, revisión de seguridad
  de datos/PII, CI en verde, ni la firma Rollback. Esa es la línea roja de APEX FORGE.
- Cualquier excepción temporal debe quedar como **riesgo aceptado** en
  [`matriz-riesgos.md`](./matriz-riesgos.md) con dueño, fecha de expiración y plan de contingencia.

### 4.3 Casos especiales

| Caso | Cómo se aplica la DoD |
|---|---|
| **Cambio trivial** (typo, color, texto legal corregido) | Se omiten diseño y planificación, pero se mantienen: test que cubra el cambio (o captura visual), LGTM, CI verde y métrica si aplica |
| **Spike / investigación** | No se marca Done por código: se marca Done por **decisión documentada** (ADR o nota) con evidencia; no suma puntos de producto |
| **Bugfix en producción** | Requiere test de regresión que reproduzca el fallo + LGTM + CI; si es Sev-1, el test puede entrar en el mismo PR o en el siguiente **dentro de 24 h**, con riesgo registrado |
| **Dependencia externa pendiente** (DIAN, transportadora) | La historia se mantiene Ready con impedimento I3; el equipo puede avanzar con adaptador simulado y test de contrato, pero **no se marca Done** hasta probar el entorno real en staging |
| **Datos del cliente incompletos** | CAT-01 no se acepta con placeholders definitivos: se usa datos sintéticos para desarrollo y se congela la carga real en S7 |
| **Historias de configuración** (flags, secretos) | Evidencia = captura de configuración + test de activación/desactivación + runbook actualizado |

---

## 5. Definition of Done del Sprint (Incremento)

Además de la DoD por historia, el **Sprint** solo se cierra cuando:

- [ ] Todas las historias comprometidas están **Done** o fueron renegociadas explícitamente por el PO antes del cierre.
- [ ] El Incremento está desplegado en **staging** y es accesible para la Review.
- [ ] La suite completa de regresión pasa (no solo los tests de las historias nuevas).
- [ ] No hay errores Sev-1/Sev-2 abiertos en el Incremento.
- [ ] Las métricas de proceso están actualizadas: velocity, cycle time, % DoD, escape defects.
- [ ] El Sprint Review produjo decisiones escritas (aceptar / rechazar / reprogramar).
- [ ] La Retro produjo 1–2 experimentos con dueño y fecha.
- [ ] Los impedimentos abiertos tienen dueño y SLA.

> Una historia comprometida que queda a medias **no cuenta puntos** y se devuelve al backlog;
> se reporta en la Review con transparencia. El Sprint Goal puede haberse cumplido parcialmente,
> pero eso se dice explícitamente.

---

## 6. Definition of Done del Release (Go/No-Go)

Checklist final firmado por `forge-qualis`, `forge-infra`, `forge-reviewer`, `forge-sentinel` y el PO:

- [ ] Todas las historias Must del MVP están Done (**42 historias, 280 puntos**, S0–S8).
- [ ] **21 escenarios E2E en verde** en móvil, tablet POS y desktop; **E2E-21 (pedido POS) no omitible (C-03)**.
- [ ] **FEFO verificado (C-01):** aviso a 90 días, bloqueo a 15 días y 0 sobreventas web/POS (R5).
- [ ] **Dinero verificado (C-02):** importes `BIGINT` centavos, IVA 1900 bps y cuadre por línea.
- [ ] axe: 0 violaciones críticas/serias en flujos críticos; lector de pantalla verificado.
- [ ] Lighthouse y k6 dentro de umbrales (LCP <2,5 s, INP <200 ms, CLS <0,1; 200 rps sin degradación).
- [ ] OWASP ZAP y `npm audit`: 0 críticos; `forge-sentinel` firmó.
- [ ] UAT firmado por el negocio (pedido, pago, factura DIAN, guía, retracto, recogida en sede).
- [ ] Catálogo ≥95% con imagen, precio, stock y ficha; dos sedes configuradas.
- [ ] Pago real de bajo monto probado en producción antes del canary.
- [ ] Factura DIAN validada en el portal de la DIAN; nota crédito probada.
- [ ] Guía y tracking generados con la transportadora real.
- [ ] Emails y WhatsApp con plantillas aprobadas; legales publicados y versionados.
- [ ] Backups con restore real verificado; migrations expand/contract revisadas.
- [ ] Runbook, on-call, dashboards y alertas operativos.
- [ ] **Rollback probado en <2 min** y feature flags verificados.
- [ ] Error budget disponible y SLOs en verde en staging.
- [ ] Plan de canary 5% → 25% → 100% con ventana de monitoreo acordada.

---

## 7. Trazabilidad y evidencia

Cada historia Done debe poder responderse en 30 segundos:

| Pregunta | Dónde se responde |
|---|---|
| ¿Qué criterios se aceptaron? | CA numerados en [`backlog-inicial.md`](./backlog-inicial.md) |
| ¿Quién lo hizo y quién lo aprobó? | PR + LGTM + firma en checklist |
| ¿Cómo se probó? | Enlace a CI run y reporte de tests |
| ¿Es accesible y rápido? | Reportes axe y Lighthouse |
| ¿Es seguro? | Aprobación Sentinel + ZAP/audit |
| ¿Cómo se mide en producción? | Métrica con fuente en [`metricas-exito.md`](./metricas-exito.md) |
| ¿Cómo se revierte? | Runbook y plan de rollback en [`plan-sprints.md`](./plan-sprints.md) |

> Si alguna respuesta es "no sé", la historia **no está Done**.
