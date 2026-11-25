# Checklist de lanzamiento — Adriana Tienda

| Campo | Valor |
|---|---|
| **Autor** | `forge-infra` (Plataforma e Infraestructura, APEX FORGE) |
| **Estado** | checklist operativo para el Go/No-Go del Comandante |
| **Fecha** | 23 de noviembre de 2026 |
| **Relación** | Diseño canónico: [design-doc.md §8](../02-arquitectura/design-doc.md#8-rollout-y-rollback) (absorbe el raíz `DESIGN_DOC.md` v1.0 y su anexo B, C-12); [plan-despliegue.md](plan-despliegue.md), [monitoreo-y-alertas.md](monitoreo-y-alertas.md), [backups-y-recuperacion.md](backups-y-recuperacion.md) |

---

## 0. Cómo usarlo

- Cada ítem debe quedar **OK**, **N/A justificado** o **BLOQUEANTE**.
- La columna implícita de evidencia debe enlazar al artefacto real: captura, ticket, log,
  reporte de Lighthouse, número de factura DIAN de prueba, acta de simulacro.
- El Comandante `apex-forge` firma el Go/No-Go. **`forge-qualis` y `forge-infra` no pueden
  dar por bueno un ítem que no han ejecutado o verificado.**
- Regla: **si hay un bloqueante, no se abre el checkout al público**. Se puede lanzar el
  catálogo en modo solo lectura con `checkout_enabled=false`.

---

## 1. Pre-lanzamiento

### A. Gobernanza y decisiones

- [ ] Design Doc `Approved` y congelado; enmiendas de stack documentadas. (** forge-architect / Comandante**)
- [ ] Dominio definitivo confirmado y titularidad de cuentas Vercel/Neon/Cloudflare/Wompi definida. (** Comandante**)
- [ ] TRM de cierre recalculada con la TRM vigente el día de firma; planeación COP 4.000/USD (C-09: COP 3.317 es cotización referencial del proveedor, **no usada**). (** Comandante**)
- [ ] PITR 7 días + dump frío diario con retención de 30 días activos y con restore probado (C-09); PITR 30 días es mejora opcional aprobable por el cliente, **no bloqueante**. (** `forge-infra` + Comandante**)
- [ ] Runbooks publicados: deploy, rollback, incidentes, facturación, logística. (** `forge-infra`**)
- [ ] On-call primario y suplente nominados por escrito con escalado a 10/30 min. (** `forge-qualis`**)

### B. Dominio, DNS y SSL/TLS

- [ ] DNS autoritativo en Cloudflare; registros de `www`, `admin`, `api`, `staging`, `assets`, `status` creados como código. (** `forge-infra`**)
- [ ] Apex redirige 301 a `www`; `http://` redirige a `https://`. (** `forge-infra`**)
- [ ] Certificados válidos en todos los subdominios; Cloudflare en **Full (strict)**; TLS 1.2+. (** `forge-infra`**)
- [ ] HSTS activo (`includeSubDomains`); `preload` evaluado y decidido. (** `forge-infra`**)
- [ ] SPF, DKIM y DMARC publicados y verificados con Resend. (** `forge-infra`**)
- [ ] `staging.<DOMINIO>` y previews con `noindex` y protección de acceso. (** `forge-infra`**)
- [ ] TTL de DNS en 300 s durante el lanzamiento; check de expiración SSL con alerta a 30 días. (** `forge-infra`**)

### C. Entornos, secretos y CI/CD

- [ ] GitHub Environment `production` con aprobadores y checks requeridos; rama `main` protegida. (** `forge-infra`**)
- [ ] CODEOWNERS con `forge-reviewer` y `forge-sentinel` en pagos/datos; nadie aprueba su propio PR. (** Comandante**)
- [ ] Secretos sólo en GitHub Environments y Vercel por ambiente; auditados con `git ls-files`. (** `forge-infra`**)
- [ ] Sin credenciales de producción en preview/staging; datos anonimizados. (** `forge-sentinel`**)
- [ ] Pipeline completo en verde: install, lint, typecheck, unit, integration, build, e2e, a11y, audit. (** `forge-infra`**)
- [ ] Cobertura ≥70% global, ≥80% en `packages/core`, 100% en pagos. (** `forge-qualis`**)
- [ ] Imágenes del worker etiquetadas por SHA/tag; sin `latest` en producción. (** `forge-infra`**)
- [ ] Rotación de secretos definida (trimestral y tras incidente). (** `forge-sentinel`**)

### D. Datos y migraciones

- [ ] `prisma migrate status` limpio en staging y producción; ningún `db push`. (** Backend + `forge-infra`**)
- [ ] PITR activo y **restore real ejecutado** a rama aislada con validación de conteos. (** `forge-infra`**)
- [ ] Dumps diarios/semanales en R2 con Object Lock y job monitorizado. (** `forge-infra`**)
- [ ] Catálogo ≥95% completo: imagen, precio con IVA, stock, ficha, registro INVIMA cuando aplique. (** Cliente + Backend**)
- [ ] Conciliación de SKUs y stock entre planilla de origen y BD; firmada por operaciones. (** Cliente**)
- [ ] Dos bodegas/sucursales configuradas con prioridad fija y reglas de recogida. (** Backend + Cliente**)
- [ ] Impuestos: IVA incluido en precios, base imponible y reporte validados por contador. (** Cliente**)
- [ ] Seed de producción limitado al catálogo inicial; sin usuarios/pedidos ficticios. (** Backend**)

### E. Pasarela de pagos y facturación DIAN

- [ ] Credenciales de producción de Wompi en variables de entorno; sandbox desactivado. (** Backend + `forge-sentinel`**)
- [ ] Webhook firmado verificado; `unique(provider, event_id)` y máquina de estados probadas. (** Backend**)
- [ ] Adaptador ePayco (plan B) desplegado y probado en staging; flag de conmutación listo. (** Backend**)
- [ ] **Prueba de compra real** de bajo monto con tarjeta y con PSE/Nequi; pago aprobado y reflejado. (** Comandante + Backend**)
- [ ] Prueba de pago rechazado, reembolso y nota crédito. (** Backend**)
- [ ] Contraentrega con límites de monto/zonas, OTP o confirmación por WhatsApp. (** Negocio + Backend**)
- [ ] Proveedor tecnológico DIAN habilitado, resolución de numeración vigente y CUFE validado en el portal de la DIAN. (** Comandante**)
- [ ] Factura de prueba emitida, descargable y con reintento < 15 min monitorizado. (** Backend**)
- [ ] Plan de contingencia de facturación manual documentado si el proveedor falla. (** Comandante**)

### F. Email, WhatsApp y logística

- [ ] Plantillas de email aprobadas (confirmación, envío, entrega, retracto, recibo). (** Cliente + `forge-qualis`**)
- [ ] Entregabilidad verificada: bandeja de entrada, no spam; SPF/DKIM/DMARC alineados. (** `forge-infra`**)
- [ ] Plantillas de WhatsApp aprobadas por Meta y probadas con número de prueba. (** Cliente + Backend**)
- [ ] Agregador de transportadoras en producción: cotización, guía y tracking probados con pedido real. (** Backend + Cliente**)
- [ ] Recogida en tienda: horarios, direcciones y responsables por sede publicados. (** Cliente**)

### G. Monitoreo y alertas

- [ ] Dashboards Storefront, Checkout/Pagos, Operaciones, Negocio y Costes creados. (** `forge-infra`**)
- [ ] SLOs y umbrales configurados según `monitoreo-y-alertas.md`. (** `forge-qualis`**)
- [ ] Sentry con source maps y releases; Vercel Speed Insights con datos de campo. (** `forge-infra`**)
- [ ] Better Stack con sondas sintéticas desde BOG/MDE + UptimeRobot como segunda opinión. (** `forge-infra`**)
- [ ] Alertas Sev-1 probadas en simulacro: Slack, WhatsApp y escalado SMS. (** `forge-qualis`**)
- [ ] Status page `status.<DOMINIO>` configurada con logo y textos aprobados. (** Comandante**)
- [ ] Presupuestos de coste con alerta al 80% en Vercel/Neon/Cloudflare/Resend. (** `forge-infra`**)
- [ ] Sin PII/PAN en logs; scrubbing verificado con un evento sintético. (** `forge-sentinel`**)

### H. Seguridad, legal y accesibilidad

- [ ] Visto bueno de `forge-sentinel` para pagos, datos personales y DIAN. (** `forge-sentinel`**)
- [ ] WAF, rate limiting y bot management activos; CSP y cabeceras de seguridad validadas. (** `forge-infra`**)
- [ ] OWASP ASVS nivel 2: `npm audit`/Semgrep sin críticos, ZAP baseline aceptable. (** `forge-qualis`**)
- [ ] Consentimiento granular y revocable con registro de versión; GTM carga tras consentimiento. (** `forge-sentinel`**)
- [ ] Política de privacidad, términos, cookies, retracto y reversión publicados. (** Cliente + `forge-sentinel`**)
- [ ] RNBD evaluado y, si aplica, inscripción en trámite o completada. (** Cliente**)
- [ ] axe-core: 0 violaciones críticas en Home, PLP, PDP y checkout; `prefers-reduced-motion` respetado. (** `forge-qualis`**)
- [ ] Etiquetado INVIMA/registro sanitario visible cuando aplique. (** Cliente + `forge-sentinel`**)

### I. Rendimiento y carga

- [ ] Lighthouse CI en móvil: LCP < 2,5 s, INP < 200 ms, CLS < 0,1; TTFB p75 < 800 ms. (** `forge-qualis`**)
- [ ] Presupuestos de bundle por plantilla (PDP ≤170 KB gzip) sin regresión. (** Frontend**)
- [ ] Imágenes AVIF/WebP con `sizes`/`srcset`, dimensiones explícitas y `priority` sólo en LCP. (** Frontend**)
- [ ] Reglas de caché verificadas: ISR catálogo, `no-store` en checkout/admin/webhooks. (** `forge-infra`**)
- [ ] Prueba de carga k6: 200 rps sostenidos y pico 3–5× de campaña sin degradación. (** `forge-qualis`**)
- [ ] Pruebas de caos: Wompi down, Redis down y Meilisearch down con degradación elegante. (** `forge-qualis`**)

### J. Rollback y simulacros

- [ ] Rollback de código (alias a deployment anterior) ejecutado en staging y cronometrado < 5 min. (** `forge-infra`**)
- [ ] Kill switches de features probados (`checkout_enabled`, `wompi_enabled`, `epayco_enabled`). (** Backend**)
- [ ] Restauración PITR ejecutada y documentada. (** `forge-infra`**)
- [ ] Rollback del worker (imagen con tag anterior + replay de outbox) probado. (** `forge-infra`**)
- [ ] Plan de comunicación de incidentes y status page ensayado. (** Comandante**)

### K. Contenido y SEO

- [ ] Sitemap y robots.txt correctos; envío a Search Console. (** Frontend + `forge-marketing`**)
- [ ] Canonical, JSON-LD (Product, BreadcrumbList, Organization, FAQ) y URLs limpias validados. (** Frontend**)
- [ ] 301 de URLs antiguas/campañas; sin parámetros de plataforma en URLs públicas. (** Frontend**)
- [ ] Metadatos y textos legales en español, COP con IVA incluido. (** Cliente**)
- [ ] GA4 + Consent Mode v2 verificados en el embudo completo. (** `forge-marketing` + `forge-sentinel`**)

---

## 2. GO / NO-GO (bloqueantes)

| # | Criterio | Responsable | Estado |
|---:|---|---|---|
| 1 | CI en verde y LGTM de `forge-reviewer` en el release candidato | `forge-infra` | [ ] |
| 2 | Visto bueno de `forge-sentinel` en pagos, datos y DIAN | `forge-sentinel` | [ ] |
| 3 | Compra real aprobada + factura DIAN validada | Comandante | [ ] |
| 4 | Restore PITR probado con resultado OK | `forge-infra` | [ ] |
| 5 | Rollback de código probado < 5 min | `forge-infra` | [ ] |
| 6 | Alertas Sev-1 y on-call operativos | `forge-qualis` | [ ] |
| 7 | Dominio, SSL y DNS en producción verificados | `forge-infra` | [ ] |
| 8 | Catálogo ≥95% y stock conciliado | Cliente | [ ] |
| 9 | CWV y carga dentro de presupuesto | `forge-qualis` | [ ] |
| 10 | Legales publicados y consentimiento activo | `forge-sentinel` | [ ] |

**Decisión final:** [ ] **GO**  [ ] **NO-GO** — Firma: `apex-forge` — Fecha/hora: `<FECHA_HORA_CO>`

---

## 3. Post-lanzamiento

### 3.1 Primeras 2 horas (Día D)

- [ ] Confirmar que el tag desplegado es el aprobado y que `prisma migrate status` está limpio. (** `forge-infra`**)
- [ ] Flags en estado inicial acordado; canary al 5% con cohorte interna. (** Backend**)
- [ ] Smoke tests automáticos y manuales: Home, PLP, PDP, carrito, checkout, confirmación, tracking. (** `forge-qualis`**)
- [ ] Verificar webhook recibido, stock descontado y reserva confirmada en pedido real. (** Backend**)
- [ ] Verificar email y WhatsApp entregados en los últimos 30 min. (** Backend**)
- [ ] Revisar error rate 5xx (<0,1%), p95 API (<400 ms) y LCP p75 (<2,5 s). (** `forge-infra`**)
- [ ] Revisar tasa de aprobación de pagos por método frente al baseline de staging. (** Backend**)
- [ ] Revisar gasto en Vercel/Neon frente al plan diario. (** `forge-infra`**)
- [ ] Comunicación interna de estado a las 2 h, aunque todo esté bien. (** Comandante**)

### 3.2 De 2 a 24 horas

- [ ] Canary 5% → 25% tras 24 h sin Sev-1/Sev-2 y con métricas dentro de SLO. (** `forge-qualis`**)
- [ ] Revisar facturas DIAN emitidas en las últimas 24 h: 0 pedidos pagados sin factura. (** Backend**)
- [ ] Revisar cola de webhooks (p95 < 60 s), DLQ y jobs fallidos (<1%). (** Backend**)
- [ ] Revisar stock inconsistente: 0 filas con `reserved > on_hand`. (** Backend**)
- [ ] Revisar incidentes reportados por atención al cliente y clasificarlos. (** Cliente + `forge-qualis`**)
- [ ] Revisar CAUs y consultas de búsqueda sin resultados para ajustar sinónimos. (** Backend + `forge-marketing`**)
- [ ] Confirmar que no hay secretos en logs y que el scrubbing funciona. (** `forge-sentinel`**)

### 3.3 De 24 a 72 horas

- [ ] Canary 25% → 100% tras segunda ventana de 24 h en verde. (** `forge-qualis`**)
- [ ] Monitoreo reforzado 72 h con revisión de dashboards cada 4 h en horario laboral. (** `forge-infra`**)
- [ ] Comparar CVR móvil, AOV y abandono de carrito frente a hipótesis del Design Doc. (** `forge-marketing`**)
- [ ] Analizar rechazos de pago por método y decidir ajustes de UI o de pasarela. (** Backend + Negocio**)
- [ ] Verificar copias de seguridad de los primeros 3 días (jobs diarios ejecutados). (** `forge-infra`**)
- [ ] Cerrar incidencias menores y registrar lecciones en el acta de lanzamiento. (** `forge-qualis`**)

### 3.4 Día 7 y día 30

- [ ] Día 7: primera revisión de presupuesto vs gasto real y de presupuesto de error del SLO. (** `forge-infra`**)
- [ ] Día 7: primera prueba de restore mensual programada en calendario. (** `forge-infra`**)
- [ ] Día 30: postmortem del lanzamiento (sin culpables) con acciones y dueños. (** `forge-qualis`**)
- [ ] Día 30: revisión de la matriz de hosting con datos reales de tráfico y coste. (** `forge-infra`**)
- [ ] Día 30: rotación de secretos de lanzamiento y limpieza de flags temporales. (** `forge-sentinel`**)

---

## 4. Firma de cierre

| Rol | Nombre | Fecha | OK |
|---|---|---|---|
| `forge-infra` (CI/CD, hosting, backups) | `<NOMBRE>` | `<FECHA>` | [ ] |
| `forge-qualis` (tests, SLOs, rollout) | `<NOMBRE>` | `<FECHA>` | [ ] |
| `forge-sentinel` (seguridad, pagos, datos) | `<NOMBRE>` | `<FECHA>` | [ ] |
| `apex-forge` (Comandante / cliente) | `<NOMBRE>` | `<FECHA>` | [ ] |
