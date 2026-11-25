# Monitoreo y alertas — Adriana Tienda

| Campo | Valor |
|---|---|
| **Autor** | `forge-infra` (Plataforma e Infraestructura, APEX FORGE) |
| **Estado** | Propuesta; compuertas y SLOs coordinados con `forge-qualis` |
| **Fecha** | 23 de noviembre de 2026 |
| **Referencia** | Diseño canónico: [design-doc.md §3.2 RNF](../02-arquitectura/design-doc.md#32-no-funcionales) y [§8 Rollout y rollback](../02-arquitectura/design-doc.md#8-rollout-y-rollback) (absorbe al raíz `DESIGN_DOC.md` v1.0, C-12); [requisitos-no-funcionales.md §4 y §7](../01-requisitos/requisitos-no-funcionales.md#4-disponibilidad-y-resiliencia-rnf-019-a-rnf-022); umbrales operativos en §4 y §5 de este documento |
| **Nota** | Documento de diseño. No contiene código de producción ni credenciales. |

---

## 1. Principios

1. **Toda alerta tiene dueño, umbral y runbook.** Si no hay acción concreta, es ruido y se
   elimina.
2. **Cuatro señales, una correlación.** `requestId` permite saltar de una alerta de Better
   Stack al error en Sentry y al rastro en Vercel.
3. **Sin PII en logs ni en alertas.** Prohibido registrar PAN, documentos, emails completos,
   direcciones o tokens. Se usa `userId` seudonímico y `orderId`.
4. **Consentimiento primero.** RUM y GA4 respetan Consent Mode v2; sin consentimiento no se
   envía dato de comportamiento (sí métricas técnicas agregadas anónimas).
5. **Medir es obligatorio desde el primer deploy.** Un release sin dashboards es un release
   no observable y no debe salir de staging.

---

## 2. Qué medir

| Categoría | Métrica | Fuente | Por qué importa |
|---|---|---|---|
| **Disponibilidad** | Uptime de `www`, `admin`, `api` desde BOG/MDE + externo | Better Stack + UptimeRobot | SLO 99,9%; detecta caída antes que el cliente |
| | Tiempo de resolución DNS y expiración de certificado SSL | Better Stack / check sintético | Fallos silenciosos de renovación |
| | Edge cache hit ratio | Cloudflare Analytics | Caída del hit ratio encarece y ralentiza |
| **Frontend (CWV reales)** | LCP p75 (móvil) | Vercel Speed Insights + CrUX | Meta < 2,5 s; ventaja competitiva |
| | INP p75 | RUM | Meta < 200 ms; interacción de filtros/carrito |
| | CLS p75 | RUM | Meta < 0,1; imágenes con dimensiones |
| | TTFB p75 HTML | RUM + Cloudflare | Meta < 800 ms; regressiones de ISR |
| | JS transferido por plantilla | Bundle analyzer en CI | Presupuesto PDP ≤170 KB gzip |
| **Backend** | Tasa de errores 5xx (% de requests) | Sentry + Vercel logs | Objetivo < 0,1% |
| | Latencia p95/p99 de `/api/v1/*` | Sentry performance + Vercel | Objetivo p95 < 400 ms |
| | Duración/memoria de Serverless Functions | Vercel | Detecta cold starts y functions al límite |
| | Conexiones activas y lentitud de queries | Neon + Sentry DB insights | Previene saturación en campañas |
| | Redis evictions / hit ratio | Upstash | Caché de facetas e idempotencia |
| | Latencia de Meilisearch y tasa de fallback a FTS | Worker + Sentry | Degradación controlada de búsqueda |
| **Pagos y facturación** | Checkout success rate (excluyendo rechazos del banco) | Eventos de dominio + GA4 | SLO > 97% |
| | Tasa de aprobación por método (tarjeta/PSE/Nequi/BNPL/COD) | Wompi + DB | Detecta caída de un método específico |
| | Webhooks fallidos y edad de la cola | `webhook_event` + BullMQ | SLO p95 < 60 s; cola > 100 es crítico |
| | Pedidos pagados sin factura DIAN | Query de integridad | Objetivo 0; reintento < 15 min |
| | Latencia de emisión de factura | Worker + Sentry | SLO p95 < 15 min |
| | Tasa de reembolsos y notas crédito | DB | Señal de fraude o calidad |
| **Operación** | Guias creadas vs pedidos despachados | Agregador logístico + DB | Evita pedidos "atascados" |
| | Emails/WhatsApp: entregados, bounced, fallidos | Resend / Meta / outbox | Detecta caída de entregabilidad |
| | Job failures y tamaño de DLQ | BullMQ + Sentry | Objetivo < 1% de fallos |
| | Stock inconsistente (negativo, `reserved > on_hand`) | Query de integridad en Neon | Riesgo de sobreventa (R5 del Design Doc) |
| | Pedidos duplicados / `Idempotency-Key` en conflicto | DB | Integridad transaccional |
| **Negocio** | Sesiones → PDP → add-to-cart → checkout → pago | GA4 + eventos de dominio | Embudo con consentimiento |
| | CVR móvil, AOV, abandono de carrito | GA4 + DB | KPIs del §2.1 del Design Doc |
| | Take rate de pasarela (comisión publicada **sin IVA**, C-09) | DB + reporte Wompi | Coste variable que erosiona margen; objetivo < 3,7% del GMV pagado, ver [presupuesto.md §7](presupuesto.md) |
| **Coste** | Gasto diario por servicio y presupuesto mensual | Vercel/Neon/Cloudflare/Resend | Alerta al 80% del presupuesto |

---

## 3. Evaluación de herramientas

| Herramienta | Qué aporta | Pros | Contras | Coste referencial | Decisión |
|---|---|---|---|---:|---|
| **Vercel Analytics + Speed Insights** | Core Web Vitals reales por ruta/dispositivo | Cero instrumentación; datos de campo; integrado con deployments | Solo cubre lo que pasa por Vercel; sin trazas profundas | Incluido / ~USD 10–20 | **Adoptar** para CWV |
| **Sentry** | Errores, trazas, performance de API y worker | Correlación con releases; source maps; alertas por regla | Coste por eventos; requiere sampling y limpieza de PII | ~USD 26/mes (Team) | **Adoptar** como sistema de errores |
| **Better Stack** | Uptime sintético + logs centralizados + on-call + status page | Una sola herramienta para detectar, correlacionar y escalar; logs estructurados | Curva de configuración; coste crece con volumen de logs | USD 0–29/mes (Starter) | **Adoptar** como sistema de incidentes y logs |
| **UptimeRobot** | Segundo sonda externa independiente | Gratis/barato; distinta red → reduce falsos positivos | Interfaz y funciones limitadas; no sustituye a un sistema de incidentes | USD 0–7/mes | **Adoptar sólo como segunda opinión** (canal de baja prioridad) |
| **Cloudflare Analytics** | Hit ratio, WAF, ancho de banda, bots | Ya pagamos Cloudflare; visión edge | No ve lógica de negocio | Incluido en Pro | **Adoptar** para capa edge |
| **GA4 + GTM** | Embudo, campañas, atribución | Gratis; imprescindible para marketing | Consent Mode obligatorio; datos de campo con muestreo | USD 0 | **Adoptar** para negocio, no para incidentes |
| **Metabase** | Dashboard de negocio (Fase 2) | SQL sobre Postgres; sin vendor adicional | Requiere hosting y mantenimiento | USD 0–20 | **Fase 2**, no bloqueante para lanzamiento |
| **PagerDuty/Opsgenie** | Escalado telefónico avanzado | Muy robusto | Excesivo para 2 sucursales y equipo pequeño | USD 30+/mes/seat | **No adoptar en MVP**; WhatsApp + SMS bastan |

**Arquitectura de observabilidad recomendada:** Vercel Speed Insights (CWV) + Sentry
(errores/trazas) + Better Stack (uptime, logs, on-call y status page) + UptimeRobot como
sonda independiente + GA4 (negocio) + Cloudflare (edge). Se evita duplicar plataformas de
incidentes: Better Stack es la **fuente de verdad**; UptimeRobot sólo confirma o desmiente.

---

## 4. SLOs y presupuesto de error

| SLO | Objetivo | Ventana | Alerta disparadora |
|---|---|---|---|
| Disponibilidad storefront | 99,9% | 30 días | < 99,95% en 1 h o caída > 2 min |
| LCP p75 móvil | < 2,5 s | 28 días (CrUX/RUM) | > 3,0 s en 1 h |
| INP p75 | < 200 ms | 28 días | > 300 ms en 1 h |
| CLS p75 | < 0,1 | 28 días | > 0,15 en 1 h |
| TTFB p75 HTML | < 800 ms | 7 días | > 1,2 s en 30 min |
| Latencia p95 API | < 400 ms | 7 días | > 600 ms en 15 min |
| Tasa de errores 5xx | < 0,1% | 24 h | > 0,5% en 10 min; > 2% = Sev-1 |
| Checkout success rate | > 97% (sin rechazos bancarios) | 24 h | < 95% en 1 h |
| Procesamiento de webhook | p95 < 60 s | 24 h | cola > 100 o evento más antiguo > 5 min |
| Emisión de factura DIAN | p95 < 15 min | 24 h | > 30 min o 3 reintentos |
| Job failures | < 1% | 24 h | > 5% o DLQ ≥ 10 |
| Stock inconsistencies | 0 filas | Continuo | Cualquier `reserved > on_hand` |

**Presupuesto de error (99,9% en 30 días):** 43,2 minutos de indisponibilidad al mes.
Regla de gobierno: si se consumió > 50% del presupuesto en la primera quincena, se congela
el despliegue de features y el equipo trabaja sólo en fiabilidad (decisión de `forge-qualis`).

---

## 5. Umbrales de alerta y severidad

| Severidad | Condición (ejemplos) | Canal primario | Respuesta |
|---|---|---|---|
| **Sev-1** | `www` caído > 2 min en 2 sondas; 5xx > 2% en 5 min; checkout success < 90% en 10 min; DB inalcanzable; sospecha de fuga de datos | WhatsApp al on-call + llamada/SMS a los 10 min + Slack `#incidentes` | ≤ 5 min; Comandante informado; status page en 15 min |
| **Sev-2** | p95 API > 600 ms en 15 min; webhook p95 > 5 min; factura > 30 min; LCP p75 > 3 s; error rate 0,5–2%; DLQ ≥ 10; stock inconsistente | Slack `#alertas-prod` + mención al on-call | ≤ 30 min en horario; ≤ 60 min fuera de horario |
| **Sev-3** | SSL expira en < 30 días; coste > 80% del presupuesto; bounce de email > 5%; hit ratio de edge cae > 20%; una pasarela de pago con éxito bajo | Slack `#alertas-prod` (no pagina) | Próximo día hábil |
| **Info** | Deploy completado, flag cambiado, restore finalizado, pico de tráfico previsto | Slack `#deploys` | Sin acción; registro para auditoría |

**Reglas anti-ruido:**

- Ventanas de evaluación de 2 muestras consecutivas antes de disparar (excepto Sev-1).
- Supresión de alertas por 5 minutos durante un deploy conocido (`deployment_id` en contexto).
- Deduplicación por `alert_key` (métrica + servicio + entorno).
- Escalado automático: Sev-1 sin acknowledge en 10 min → SMS/llamada al suplente; en 30 min
  → Comandante.
- Toda alerta Sev-1/Sev-2 enlaza a su runbook en [plan-despliegue.md §7](plan-despliegue.md)
  y [backups-y-recuperacion.md](backups-y-recuperacion.md).

---

## 6. Canales y dashboards

| Canal | Uso | Regla |
|---|---|---|
| Slack `#alertas-prod` | Centro de alertas Sev-2/Sev-3 e info | Un hilo por incidente; el bot publica métricas y cierre |
| Slack `#incidentes` | Coordinación de Sev-1 | Creado automáticamente por Better Stack |
| WhatsApp Business on-call | Pageo inmediato de Sev-1 | Mensajes cortos, sin datos de clientes; plantilla aprobada |
| SMS / llamada | Escalado a los 10/30 min en Sev-1 | Solo on-call y suplente |
| Email | Resumen diario de costes, SLO y pedidos pendientes | 08:00 hora Colombia, a dirección de roles (no personal) |
| `status.<DOMINIO>` | Estado público en incidentes | Better Stack status page; lo actualiza el Comandante |

| Dashboard | Audiencia | Paneles clave |
|---|---|---|
| **Storefront** | Frontend + `forge-qualis` | LCP/INP/CLS por plantilla, TTFB, hit ratio edge, 5xx, JS por ruta, tráfico por dispositivo |
| **Checkout y pagos** | Backend + Negocio | Checkout success, aprobación por método, webhook lag, pagos pendientes, reembolsos, take rate |
| **Operaciones/jobs** | Backend + Operaciones | Outbox pendiente, DLQ, reintentos, facturas DIAN, guías, emails/WhatsApp, stock inconsistente |
| **Negocio** | Cliente + `forge-marketing` | Embudo completo, CVR móvil, AOV, abandono, campañas y atribución (GA4) |
| **Costes** | `forge-infra` + Comandante | Gasto diario por servicio, presupuesto consumido, egress, volumen de email/SMS |

---

## 7. Instrumentación obligatoria

- **Logs estructurados (pino)** en web y worker con `requestId`, `orderId` seudonímico,
  `route`, `duration_ms`, `status`, `environment`, `version`. Nivel `info` por defecto;
  `debug` sólo en staging.
- **Trazas** en Sentry para checkout, webhooks y jobs; sample rate inicial 20% en requests y
  100% en flujos de pago (ajustar por coste).
- **Eventos de dominio** como `order_paid`, `invoice_issued`, `webhook_received` emitidos una
  sola vez desde el outbox: son la fuente de las métricas de negocio, no GA4.
- **Retención:** logs operativos 30 días; trazas 30 días; auditoría administrativa 12 meses;
  métricas agregadas 13 meses.
- **Redacción (scrubbing):** cabeceras `authorization`, `cookie`, campos `card`, `cvv`,
  `token`, `document` se eliminan antes de enviar a cualquier proveedor de observabilidad.
- **Prueba de observabilidad en CI:** un test de humo emite un `requestId` sintético y
  verifica que aparece en Sentry y Better Stack antes de firmar el release.

---

## 8. On-call y proceso de incidente

| Rol | Responsabilidad | Disponibilidad inicial |
|---|---|---|
| On-call primario (`forge-infra` o Backend rotativo) | Primer respondiente; decide Sev y activa rollback | Horario laboral CO; 24 h en campañas |
| Suplente | Escalado a 10 min si no hay acknowledge | Horario laboral CO |
| `forge-qualis` | Dueño del proceso de incidente y postmortem | Sev-1/Sev-2 |
| Comandante `apex-forge` | Comunicación al cliente y decisión de negocio | Sev-1 |

**Flujo:** detectar → declarar → mitigar (flag/rollback) → comunicar → investigar →
reconciliar → postmortem sin culpables en ≤72 h con acciones asignadas y fecha.

**Entrega al lanzamiento:** dashboards creados, alertas probadas con un incidente simulado
(p. ej. forzar 5xx en staging), on-call nominado por escrito y status page configurada con
el dominio y el logo aprobados.
