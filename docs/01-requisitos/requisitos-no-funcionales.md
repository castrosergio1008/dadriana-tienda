# Requisitos No Funcionales — Adriana Tienda

| Campo | Valor |
|---|---|
| **Proyecto** | Adriana Tienda — e-commerce de belleza, Colombia |
| **Fase** | Fase 1 — Diseño (antes de código de producción) |
| **Autor** | `forge-architect` (Staff Engineer, APEX FORGE) |
| **Estado** | Draft — pendiente de aprobación del Comandante `apex-forge` |
| **Fecha** | 23 de noviembre de 2026 |
| **Decisiones aplicadas** | [decisiones-comandante.md](../02-arquitectura/decisiones-comandante.md) — C-01 (lotes/FEFO), C-02 (centavos/1900 bp), C-04 (auth), C-05 (rate limits), C-09 (PITR 7+30 y TRM), C-12 (enlaces) |
| **Documentos relacionados** | [requisitos-funcionales.md](./requisitos-funcionales.md), [design-doc.md](../02-arquitectura/design-doc.md), [ADR-005](../02-arquitectura/adr/ADR-005-autenticacion-sesiones.md), [ADR-006](../02-arquitectura/adr/ADR-006-estrategia-despliegue.md) |

> **Precedencia:** manda [decisiones-comandante.md](../02-arquitectura/decisiones-comandante.md); el [design-doc.md](../02-arquitectura/design-doc.md) (Draft) absorbe al `DESIGN_DOC.md` v1.0 de la raíz (C-12).

## Convenciones

Cada requisito indica **objetivo medible**, **método de verificación** y **momento de verificación**.
Los umbrales son los del [design-doc.md](../02-arquitectura/design-doc.md) (Draft, que absorbe al `DESIGN_DOC.md` v1.0) y se mantienen como **no negociables** salvo enmienda firmada por el Comandante.

> **Decisión:** se adopta **WCAG 2.2 nivel AA** como línea de base, con cumplimiento explícito de `prefers-reduced-motion`. Las animaciones son **CSS-first**, sin librerías de animación. Ver RNF-007 a RNF-011.

> **Decisión:** el cumplimiento tributario y de privacidad colombiano (IVA 19%, DIAN, Ley 1581, Ley 1480) se trata como requisito no funcional de **correctitud**, no como feature. Ver RNF-025 y RNF-026.

---

## 1. Rendimiento (RNF-001 a RNF-006)

| ID | Requisito | Objetivo medible | Verificación | Momento |
|---|---|---|---|---|
| RNF-001 | **LCP** (p75, móvil 4G) | < 2,5 s en Home, PLP y PDP | CrUX + Vercel Speed Insights + Lighthouse CI | Continuo / por release |
| RNF-002 | **INP** (p75) | < 200 ms | RUM (web-vitals) + CrUX | Continuo |
| RNF-003 | **CLS** (p75) | < 0,1; imágenes y fuentes con dimensiones reservadas | RUM + Lighthouse CI | Continuo |
| RNF-004 | **TTFB** (p75, HTML) | < 800 ms con caché de CDN | RUM + curl desde red LATAM | Continuo |
| RNF-005 | Presupuesto de JS por plantilla (gzip) | Home ≤ 150 KB · PLP ≤ 160 KB · PDP ≤ 170 KB · Checkout ≤ 190 KB | Bundle analyzer en CI; falla el build si se excede | Cada PR |
| RNF-006 | Peso de HTML y respuesta de búsqueda | Home < 250 KB sin comprimir; sugerencias p95 < 150 ms; resultados p95 < 300 ms | Lighthouse CI + métricas de Meilisearch | Cada release |

**Reglas de soporte:** fuentes self-hosted con `next/font` y `font-display: swap` (máx. 2 familias / 4 pesos); GTM se carga **después del consentimiento** y en `requestIdleCallback`; cero librerías de animación; carruseles con CSS `scroll-snap` y sin autoplay.

## 2. Accesibilidad (RNF-007 a RNF-011)

| ID | Requisito | Objetivo medible | Verificación | Momento |
|---|---|---|---|---|
| RNF-007 | Cumplimiento WCAG 2.2 AA en flujos críticos (Home, PLP, PDP, carrito, checkout, confirmación, tracking, admin). | 0 violaciones críticas/serias en axe; auditoría manual con teclado y NVDA/VoiceOver | `axe-core` en Playwright + checklist manual | Cada release |
| RNF-008 | Navegación completa por teclado en menú, filtros, variantes, tabs, drawer y checkout. | 100% de controles interactivos alcanzables con Tab; foco visible; sin trampas salvo modal (focus trap correcto) | Test E2E con teclado | Cada release |
| RNF-009 | `prefers-reduced-motion: reduce` | Todas las transiciones/animaciones se desactivan; no se bloquea scroll ni navegación | Test con emulación de media query (ya cubierto en prototipo S0) | Cada release |
| RNF-010 | Contraste y estado | Mínimo 4,5:1 en texto normal y 3:1 en texto grande/UI; tokens `--color-accent-dark` y `--color-warning-dark` ya ajustados | Cálculo automatizado de tokens + axe | Diseño y release |
| RNF-011 | Anuncios y formularios | Cambios de carrito/filtros con `aria-live`; errores con `aria-invalid` y mensaje asociado; `lang="es-CO"` | Revisión de markup + axe | Cada release |

## 3. Seguridad y privacidad (RNF-012 a RNF-018)

| ID | Requisito | Objetivo medible | Verificación | Momento |
|---|---|---|---|---|
| RNF-012 | Cumplimiento **OWASP ASVS nivel 2** en storefront y admin. | 0 hallazgos críticos/altos en revisión previa a go-live | Semgrep + ZAP baseline + revisión `forge-sentinel` | Pre-go-live y trimestral |
| RNF-013 | **PCI-DSS SAQ-A**: la aplicación nunca recibe, procesa ni almacena PAN/CVV. | 0 campos de tarjeta en nuestro dominio; checkout hospedado en proveedor; inspección de red y código | Revisión de código + prueba de flujo | Cada release de pagos |
| RNF-014 | Secretos y configuración. | 0 secretos en repositorio; rotación trimestral; variables de entorno/gestor; scan en CI (gitleaks) | CI + `forge-sentinel` | Cada PR |
| RNF-015 | Protección de sesiones y admin. | Access token ≤ 15 min y refresh rotatorio ≤ 7 días en cookie **`httpOnly+Secure+SameSite=Strict`**; única excepción `SameSite=Lax` en la cookie del flujo de retorno desde Wompi (C-04); `Authorization: Bearer` **solo servidor a servidor**, nunca en el storefront (C-04); MFA obligatoria en **Admin/Superadmin**, Vendedor con sesión de tablet de **8 h** y MFA diferida a Fase 2 (C-04); RBAC con ámbito de `site_id` | Test de integración + revisión `forge-sentinel` | Cada release |
| RNF-016 | Rate limiting y antifraude. | Login: **5 intentos fallidos en 15 min por IP+cuenta**, con backoff progresivo y CAPTCHA tras el bloqueo (C-05); API de checkout: **≤ 20 req/min por sesión** (C-05); COD con límite de monto/zona y OTP | k6 + reglas verificadas en staging | Pre-go-live |
| RNF-017 | Protección de datos personales (Ley 1581/1377). | Consentimiento versionado y revocable; PII cifrada AES-256-GCM en reposo (`phone`, `documentNumber`, snapshots); índices ciegos SHA-256 con *pepper*; derecho de supresión efectivo en ≤ 30 días | Revisión `forge-sentinel` + prueba de anonimización | Pre-go-live y anual |
| RNF-018 | Cabezales y aislamiento. | CSP estricta (sin `unsafe-inline` salvo nonce), HSTS, `X-Content-Type-Options`, `Referrer-Policy`; errores sin stack traces al cliente | `securityheaders.com` + tests de respuesta | Cada release |

## 4. Disponibilidad y resiliencia (RNF-019 a RNF-022)

| ID | Requisito | Objetivo medible | Verificación | Momento |
|---|---|---|---|---|
| RNF-019 | Disponibilidad del storefront. | **99,9%** mensual (≤ 43 min/mes de caída) | Uptime checks (Vercel + monitor externo) | Continuo |
| RNF-020 | Tasa de error y latencia de API. | 5xx < 0,1% de requests; p95 API < 400 ms; p95 webhook < 60 s | APM (Sentry) + alertas | Continuo |
| RNF-021 | Degradación elegante. | Si Meilisearch cae → fallback Postgres FTS en < 300 ms; si falla el proveedor de pagos → se ofrece método alterno; si cae WhatsApp → el correo sigue | Pruebas de caos en staging | Pre-go-live y trimestral |
| RNF-022 | Recuperación ante desastre. | **RPO ≤ 5 min, RTO ≤ 1 h**; **PITR de 7 días con restauración real verificada + dump frío diario con retención de 30 días (C-09)** y WAL continuo. La ampliación a PITR de 30 días es mejora aprobable por el cliente, no requisito del MVP | Ensayo de restauración con fecha y verificación del dump frío | Mensual y pre-go-live |

## 5. Escalabilidad (RNF-023 y RNF-024)

| ID | Requisito | Objetivo medible | Verificación | Momento |
|---|---|---|---|---|
| RNF-023 | Carga objetivo sin cambios de arquitectura. | 50.000 sesiones/mes y 1.000 pedidos/mes; pico de 200 rps sostenidos y 500 rps de 5 min sin degradar p95 | k6 / prueba de carga | Pre-go-live y antes de campañas |
| RNF-024 | Crecimiento de catálogo y sedes. | Soporte para 2.000 SKUs y hasta 5 sedes sin rediseño del modelo de inventario; agregar sede es operación de datos, no de código | Prueba de integración con dataset ampliado | Sprint de inventario |

## 6. Localización y cumplimiento fiscal (RNF-025 y RNF-026)

| ID | Requisito | Objetivo medible | Verificación | Momento |
|---|---|---|---|---|
| RNF-025 | Localización COL. | Interfaz 100% en español (`es-CO`); importes COP mostrados sin decimales pero **almacenados como `BIGINT` en centavos (`*_cents`)** (C-02); **IVA expresado como `vat_rate_bps = 1900`** (C-02); fechas `America/Bogota` en UI y UTC en storage; departamentos/ciudades de Colombia completos. TRM de planeación **4.000 COP/USD estimada**, a actualizar con la TRM del día de cierre (C-09) | Revisión de i18n + tests de formato y de impuestos | Cada release |
| RNF-026 | Corrección tributaria y legal. | IVA 19% cuadra por línea y por factura en centavos (`base_cents = round_half_up(total_line_cents / 1.19)`, `iva_cents = total_line_cents − base_cents`); 0 pedidos pagados sin factura DIAN al cierre diario; retracto de 5 días hábiles respetado; precios con impuesto incluido; tarifas de pasarela publicadas **sin IVA** (C-09) | Tests unitarios de impuestos + monitor de facturación + revisión legal | Continuo / pre-go-live |

## 7. Observabilidad (RNF-027 y RNF-028)

| ID | Requisito | Objetivo medible | Verificación | Momento |
|---|---|---|---|---|
| RNF-027 | Trazabilidad de extremo a extremo. | Todo request tiene `requestId`; logs estructurados (pino); correlación web → worker → proveedor; trazas en Sentry | Revisión de logs en staging | Cada release |
| RNF-028 | Alertas y SLOs. | SLOs: disponibilidad 99,9%, API p95 < 400 ms, checkout success > 97% (excluyendo rechazos del banco), webhook p95 < 60 s, emisión de factura p95 < 15 min. Alertas con umbral y dueño definidos; postmortem sin culpables en ≤ 72 h para Sev-1/Sev-2 | Dashboard + simulacro de incidente | Continuo / trimestral |

## 8. Calidad y mantenibilidad (RNF-029 a RNF-032)

| ID | Requisito | Objetivo medible | Verificación | Momento |
|---|---|---|---|---|
| RNF-029 | Cobertura de tests. | ≥ 70% líneas global; ≥ 80% en lógica de dominio; **100% de flujos de pago, cálculo de IVA en centavos, selección FEFO, reserva de stock y webhooks**; el E2E de pedido POS (`OPS-09`) es **gate de release** (C-03) | CI con umbral (coverage gate) + Playwright | Cada PR y release |
| RNF-030 | Tipado y estilo. | TypeScript `strict` sin `any` salvo capa de frontera justificada y documentada; ESLint + Prettier sin excepciones | CI | Cada PR |
| RNF-031 | Migraciones y esquema. | Toda migración es versionada, reversible y aplicada con estrategia *expand → contract*; 0 migraciones destructivas en el mismo release | Revisión `forge-reviewer` | Cada PR |
| RNF-032 | Documentación y decisiones. | Todo cambio significativo tiene ADR o enmienda al Design Doc; README actualizado; convenciones de commits (Conventional Commits) | Revisión de PR | Cada PR |

---

## Matriz de verificación por hito

| Hito | Requisitos obligatorios a verificar |
|---|---|
| **Sprint Review (cada sprint)** | RFs del sprint + RNF-005, RNF-029, RNF-030 (gate de CI) |
| **Release Candidate** | RNF-001..RNF-011, RNF-015, RNF-018, RNF-025, RNF-026 |
| **Go / No-Go** | RNF-012, RNF-013, RNF-014, RNF-017, RNF-019, RNF-021, RNF-022, RNF-028 |

> **Pregunta abierta `DD-Q13`** (registrada en la tabla maestra del [design-doc.md §10](../02-arquitectura/design-doc.md)): ¿el objetivo de disponibilidad 99,9% y el RTO de 1 hora son aceptables para la operación de las dos sedes (por ejemplo, si el panel POS cae, ¿se vende en papel y se concilia después)? Responde: Cliente + Comandante (S0). Contingencia mientras tanto: venta en papel con conciliación diferida contra `inventory_lots` e `inventory_movements`.
