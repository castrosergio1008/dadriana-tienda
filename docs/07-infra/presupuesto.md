# Presupuesto estimado de infraestructura — Adriana Tienda

| Campo | Valor |
|---|---|
| **Autor** | `forge-infra` (Plataforma e Infraestructura, APEX FORGE) |
| **Estado** | Estimación para decisión del Comandante y del cliente |
| **Fecha** | 23 de noviembre de 2026 |
| **Relación** | Diseño canónico: [design-doc.md](../02-arquitectura/design-doc.md) (absorbe el raíz `DESIGN_DOC.md` v1.0, decisión C-12). Costes: [analisis-hosting.md §6](analisis-hosting.md#6-comparativa-de-coste-mensual-plataforma-completa) y [decisiones-comandante.md C-09](../02-arquitectura/decisiones-comandante.md#c-09--costes-trm-y-pitr-resuelve-q11q12-m2) |

---

## 1. Supuestos

| Supuesto | Valor usado | Comentario |
|---|---|---|
| TRM de planeación (C-09) | **COP 4.000 / USD** | Única cifra usada en este presupuesto. El 3.317/USD del documento comercial `cotizacion/` es **cotización referencial del proveedor, no usada para el presupuesto** |
| Tráfico meses 1–3 | 20.000–50.000 sesiones/mes, 70% móvil | Según supuesto S5 del Design Doc |
| Tráfico meses 4–12 | +30–50% respecto al inicial | Crecimiento orgánico + campañas |
| Pedidos | 500–1.500/mes (base de cálculo: 1.000) | AOV COP 190.000 |
| Imágenes | ~5.000 originales, ~40 GB con derivados | 300–800 SKUs × 6 fotos |
| Equipo | 2 seats de Vercel; 1 on-call rotativo | Sin FTE de DevOps dedicado en MVP |
| Campañas | Hot Sale, Black Friday, Navidad (3–5× picos) | Presupuesto de pico separado |
| Impuestos/retenciones | **No incluidos** | Las facturas de proveedores USD pueden tener IVA/retención según país de facturación |
| Tarifas | Referencias públicas de noviembre de 2026 | **Verificar plan vigente y contratar por escrito** |

> Todas las cifras son **estimaciones de diseño**, no cotizaciones contractuales. La TRM de
> COP 4.000/USD es una **estimación de planeación** y **se actualizará con la TRM vigente el
> día de firma** (y se revisará al cierre de cada mes). Fuente: decisión C-09.

---

## 2. Coste por ambiente (coste marginal, no acumulativo)

| Ambiente | Recursos | Meses 1–3 (USD) | Meses 4–12 (USD) | Nota |
|---|---|---:|---:|---|
| **Local** | Docker Compose en la máquina del desarrollador | 0 | 0 | Sin coste de nube |
| **CI (GitHub Actions)** | Minutos de runners + Testcontainers | 0–8 | 0–12 | Free tier 2.000 min/mes en repo privado; exceso ~USD 0,008/min |
| **Preview (PR)** | Vercel preview + rama efímera de Neon | 5–10 | 5–10 | Incluido en Pro; branching de Neon por uso. Apagar previews huérfanos |
| **Staging** | Alias de deployment + rama Neon `staging` + datos anonimizados | 10–20 | 15–25 | Implementado como **alias en el mismo proyecto**. Si se exige *custom environment* adicional en Vercel, **+USD 50/mes** (verificar plan) |
| **Producción** | Resto de servicios de la tabla §3 | 290–420 | 350–480 | Donde está el grueso del gasto |
| **DR/backup frío** | Dump frío diario en R2 (30 días) + Object Lock + bucket secundario | 3–8 | 5–12 | Incluido parcialmente en R2 |

**Regla:** el coste de staging y preview se considera parte del coste de calidad, no un
"extra opcional". Recortarlo significa perder verificaciones antes de producción.

---

## 3. Coste mensual por servicio — meses 1–3 (régimen inicial)

| # | Servicio | Supuesto / plan | USD/mes | COP/mes aprox. |
|---:|---|---|---:|---:|
| 1 | Vercel Pro | 2 seats × USD 20, con crédito de uso incluido | 40 | 160.000 |
| 2 | Neon PostgreSQL Launch | `sa-east-1`, compute scale-to-zero, ~10–20 GB, PITR 7 días + dump frío diario (30 días) | 25 | 100.000 |
| 3 | Upstash Redis | Pay-as-you-go, caché + colas | 15 | 60.000 |
| 4 | Meilisearch Cloud | Starter, 1 índice, 800 SKUs | 40 | 160.000 |
| 5 | Cloudflare Pro + WAF | CDN, WAF, bot management | 25 | 100.000 |
| 6 | Cloudflare R2 | ~40–50 GB + operaciones; egress sin coste | 5 | 20.000 |
| 7 | Worker (Fly.io) | 1 máquina shared-cpu, 1 GB, always-on | 15 | 60.000 |
| 8 | Resend | Hasta 50k emails/mes | 20 | 80.000 |
| 9 | Sentry | Team, eventos con sampling | 26 | 104.000 |
| 10 | Better Stack | Uptime + logs + on-call, Starter | 20 | 80.000 |
| 11 | UptimeRobot | Segunda sonda, plan gratuito | 0 | 0 |
| 12 | WhatsApp Cloud API | 1.000–3.000 conversaciones/mes | 30 | 120.000 |
| 13 | Facturación electrónica DIAN | Proveedor tecnológico, ~500–1.500 facturas | 70 | 280.000 |
| 14 | Dominio + certificados | Dominio amortizado; TLS gestionado | 3 | 12.000 |
| 15 | Feature flags | Solución propia/plan free (opcional 0–20) | 0 | 0 |
| | **TOTAL MENSUAL BASE (1–3)** | | **334** | **1.336.000** |

**Rango razonable de planeación:** USD 250–470/mes (COP 1,0–1,9 M) según volumen real y
negociación de planes, coherente con el Design Doc §13.2.

---

## 4. Coste mensual por servicio — meses 4–12 (crecimiento)

| # | Servicio | Cambio respecto a meses 1–3 | USD/mes | COP/mes aprox. |
|---:|---|---|---:|---:|
| 1 | Vercel Pro | Mismo seat; +uso de functions/bandwidth | 40 | 160.000 |
| 2 | Neon Launch | Más compute y almacenamiento; sin cambio de PITR (7 días + dump frío 30 días) | 35 | 140.000 |
| 3 | Upstash Redis | Más comandos por caché de facetas/colas | 20 | 80.000 |
| 4 | Meilisearch Cloud | Mismo plan hasta ~5k documentos | 40 | 160.000 |
| 5 | Cloudflare Pro + WAF | Sin cambio de plan | 25 | 100.000 |
| 6 | Cloudflare R2 | Más imágenes y derivados (~70 GB) | 8 | 32.000 |
| 7 | Worker (Fly.io) | Segunda máquina para picos/colas | 20 | 80.000 |
| 8 | Resend | Más emails de carrito abandonado y campañas | 30 | 120.000 |
| 9 | Sentry | Mismo plan; vigilar sample rate | 26 | 104.000 |
| 10 | Better Stack | Más volumen de logs | 25 | 100.000 |
| 11 | UptimeRobot | Sin cambio | 0 | 0 |
| 12 | WhatsApp Cloud API | 3.000–6.000 conversaciones | 50 | 200.000 |
| 13 | Facturación DIAN | Más facturas por pedido | 90 | 360.000 |
| 14 | Dominio + certificados | Sin cambio | 3 | 12.000 |
| 15 | Feature flags | Si se adopta solución hosted | 0–20 | 0–80.000 |
| | **TOTAL MENSUAL BASE (4–12)** | | **412** | **1.648.000** |

> **PITR (C-09):** el MVP usa **PITR de 7 días + dump frío diario con retención de 30 días**
> (ya cubierto por la fila de Neon y la línea DR/backup). Ampliar a **PITR de 30 días** añade
> USD 50–100/mes (COP 200.000–400.000): es una **mejora aprobable por el cliente, NO un
> requisito bloqueante** y **no está incluida** en los totales USD 334 / 412. Si se decide
> **standby en segunda región** (Fase 2), añadir USD 40–90/mes. Ver
> [backups-y-recuperacion.md §2](backups-y-recuperacion.md#2-inventario-y-política-de-backups).

---

## 5. Costes one-time (no mensuales)

| Concepto | USD | COP aprox. | Responsable |
|---|---:|---:|---|
| Dominio `.com` (primer año) | 12 | 48.000 | Cliente / `forge-infra` |
| Habilitación y resolución de facturación DIAN | 50–150 | 200.000–600.000 | Cliente (puede estar ya contratada) |
| Onboarding Wompi / ePayco | 0 | 0 | Backend |
| Certificados TLS | 0 | 0 | Gestionados por Vercel/Cloudflare |
| Auditoría de seguridad externa (opcional, recomendada antes de picos) | 300–800 | 1,2 M–3,2 M | Comandante |
| **Total one-time** | **62–962** | **0,25 M–3,85 M** | |

---

## 6. Meses de campaña (presupuesto adicional)

| Campaña | Sobrecoste estimado (USD) | COP aprox. | Origen del sobrecoste |
|---|---:|---:|---|
| Hot Sale | +40–70 | 160.000–280.000 | Functions, compute DB, email/WhatsApp |
| Black Friday | +70–120 | 280.000–480.000 | Pico 5×, colas de pago, second machine, observabilidad |
| Navidad | +50–100 | 200.000–400.000 | Tráfico sostenido, más guías y facturas |

**Regla de campaña:** 7 días antes, subir temporalmente los límites de presupuesto y
notificar a `forge-qualis`; 7 días después, bajarlos y revisar el gasto real frente al
estimado. Nunca descubrir el sobrecoste al recibir la factura.

---

## 7. Costes variables por transacción (1.000 pedidos/mes de referencia)

| Concepto | Cálculo | COP/mes | USD/mes aprox. | Naturaleza |
|---|---|---:|---:|---|
| GMV | 1.000 × COP 190.000 | 190.000.000 | 47.500 | Negocio |
| Comisión de pasarela (≈3,59% de tarifa publicada, **sin IVA**) | 70% del GMV pagado con tarjeta/PSE: 190.000.000 × 70% × 3,59% = 4.774.700 | ≈4.775.000 | ≈1.194 | **Tecnología variable** |
| BNPL directo (Fase 2, 4–6%) | 15% del GMV | 1.100.000–1.700.000 | 275–425 | Tecnología variable |
| Envío (subsidio parcial) | 1.000 × COP 12.000 | 12.000.000 | 3.000 | Operación |
| Empaque | 1.000 × COP 2.000 | 2.000.000 | 500 | Operación |
| Mensajería transaccional excedente | Por encima de planes incluidos | 0–400.000 | 0–100 | Tecnología variable |

**Cálculo sin IVA (C-09):** los importes publicados por Wompi (COP 6.825 sobre un ticket de
COP 190.000 ≈ 3,59%) son **sin IVA**; no se aplica ningún ajuste de impuesto sobre la comisión
para evitar doble conteo. Si el contrato gravara la comisión, ese impuesto se registra en
contabilidad y **no se suma** a esta estimación. Take rate resultante: **3,59% del GMV pagado
con tarjeta/PSE** y **≈2,51% del GMV total** (4.774.700 / 190.000.000).

**Take rate objetivo (sin IVA, sobre el GMV pagado con tarjeta/PSE):** comisión efectiva de
pasarela < 3,7%. Si supera 4%, revisar mezcla de métodos (incentivar PSE/Nequi) y negociar
tarifa por volumen con Wompi.

---

## 8. Alertas de coste y control

| Control | Umbral | Acción |
|---|---|---|
| Presupuesto mensual total | 80% de USD 412 (meses 4–12) | Alerta Slack `#alertas-prod` (Sev-3) |
| Presupuesto mensual total | 100% | Revisión de `forge-infra` + Comandante en 24 h |
| Vercel usage | > USD 60/mes en funciones/bandwidth | Auditar ISR, cabeceras de caché y funciones |
| Neon compute/storage | > USD 60/mes | Revisar scale-to-zero, pooling e índices |
| R2 almacenamiento | > 80 GB sin crecimiento de catálogo | Limpiar derivados huérfanos y versiones antiguas |
| Emails/WhatsApp | > 1,5× el volumen previsto | Revisar loops de automatización y reintentos |
| Previews huérfanos | > 10 deployments activos | Limpieza automática por cierre de PR |

**Etiquetado:** todos los recursos llevan `project=adriana-tienda`,
`env=staging|production`, `owner=apex-forge`. Sin etiqueta, no se aprueba el gasto.

---

## 9. Recomendaciones de optimización

| # | Acción | Ahorro estimado | Cuándo |
|---:|---|---:|---|
| 1 | Mantener ISR y caché edge agresiva en catálogo | Hasta 30–40% de compute Vercel | Desde el día uno |
| 2 | Neon scale-to-zero + pooling (Neon serverless driver) | USD 10–25/mes en meses bajos | Desde el día uno |
| 3 | Imágenes AVIF/WebP en R2 con egress gratis | USD 10–30/mes frente a S3+CDN | Diseño ya lo incluye |
| 4 | Sentry con sampling y scrub de PII | USD 5–15/mes | Tras estabilizar release |
| 5 | Apagar preview deployments de PRs cerrados | USD 5–10/mes | Automatizar en CI |
| 6 | Meilisearch en Hetzner (€5) en lugar de Cloud | USD 25–40/mes, +carga operativa | Solo con 1 FTE de plataforma |
| 7 | Resend/WhatsApp: batching y plantillas eficientes | USD 10–30/mes | Meses 4–12 |
| 8 | Negociar tarifa Wompi por volumen e incentivar PSE/Nequi | 0,2–0,5 pp del take rate | Tras 3 meses de datos |
| 9 | Descuentos anuales/reservas | 10–20% en servicios estables | Después del mes 6, con tráfico predecible |
| 10 | No contratar PagerDuty ni standby multi-región en MVP | USD 30–150/mes | Diferido a Fase 2 |

---

## 10. Resumen ejecutivo

| Horizonte | USD/mes | COP/mes aprox. | Incluye |
|---|---:|---:|---|
| Meses 1–3 | **334** (rango 250–470) | **1,34 M** (1,0–1,9 M) | Plataforma completa, sin comisión de pasarela ni envíos |
| Meses 4–12 | **412** (rango 350–500) | **1,65 M** (1,4–2,0 M) | Crecimiento ~30–50% y más volumen de mensajería/facturación |
| Campañas | +40–120 adicionales | +160.000–480.000 | Picos temporales |
| One-time | 62–962 | 0,25–3,85 M | Dominio, DIAN y auditoría opcional |
| Variable (1.000 pedidos) | ~1.194 + BNPL F2 | ~4,775 M + BNPL | Comisión de pasarela **sin IVA** (3,59%) sobre 70% del GMV |

**Conclusión:** el modelo elegido mantiene la plataforma por debajo de USD 500/mes en
régimen normal (≈ COP 2 M), con escalado automático para campañas y sin requerir un
ingeniero de plataforma dedicado. El mayor riesgo de coste no es la factura fija, sino el
**take rate de la pasarela** y el volumen de mensajería: ambos se monitorizan con alertas
específicas en [monitoreo-y-alertas.md](monitoreo-y-alertas.md).
