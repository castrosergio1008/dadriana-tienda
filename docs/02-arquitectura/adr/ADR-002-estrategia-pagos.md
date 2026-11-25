# ADR-002 — Estrategia de pagos: Wompi como pasarela primaria con ePayco de plan B

| Campo | Valor |
|---|---|
| **Estado** | Enmendado por `C-06`, `C-09` y `C-12` — pendiente de aprobación del Comandante y de `forge-sentinel` |
| **Fecha** | 23 de noviembre de 2026 |
| **Decisores** | `forge-architect`, `apex-forge`, `forge-sentinel` |
| **Relacionados** | [decisiones-comandante.md](../decisiones-comandante.md), [ADR-003](./ADR-003-modelo-inventario-multisede.md), [ADR-006](./ADR-006-estrategia-despliegue.md), [design-doc.md §4.2](../design-doc.md), RF-026..RF-033 |

## Contexto

El cliente pidió explícitamente una pasarela "fácil y sin dolor" para Colombia. El checkout debe cubrir tarjeta de crédito/débito, **PSE**, billeteras (Nequi, Daviplata), efectivo en corresponsales y cuotas (BNPL), sin que nuestro servidor toque datos de tarjeta. Además necesitamos webhooks firmados, reconciliación diaria, reembolsos y facturación DIAN coherente.

Se evaluaron **Wompi, ePayco, Mercado Pago y Stripe con PSE** con criterios de facilidad de integración/reducción de PCI, cobertura de métodos locales, costo, webhooks/reconciliación y confianza de marca (matriz completa en el [design-doc.md §4.2](../design-doc.md)). Tarifas de lista, consulta oct-2026, **a verificar por escrito antes de firmar**. Los importes de coste publicados son **sin IVA** (C-09).

| Proveedor | Resultado ponderado | Observación decisiva |
|---|---:|---|
| **Wompi** | **9,15** | Una integración cubre todos los métodos del MVP, incluido BNPL nativo; respaldo Bancolombia; checkout hospedado → SAQ-A |
| ePayco | 8,10 | Buena cobertura y costo similar; sin BNPL nativo |
| Mercado Pago | 7,30 | Costo mayor (≈4,42% efectivo en venta de COP 190.000) y menor cobertura local; **sin adaptador, reevaluación en Fase 2 (C-12)** |
| Stripe (con PSE) | 6,60 | PSE no nativo en Colombia → exigiría proveedor adicional; no cubre efectivo ni billeteras locales |

## Decisión

> **Decisión:** adoptar **Wompi (Bancolombia)** como pasarela primaria con **checkout hospedado / redirección**, manteniendo **ePayco como plan B** implementado en staging tras el mismo contrato. **Mercado Pago queda descartado y sin adaptador en el contrato**; se reevaluaría en Fase 2 (C-12). Stripe se descarta. La captura directa de PAN en nuestros servidores está prohibida.

**Contrato común (puerto):** `createIntent`, `getStatus`, `refund`, `verifyWebhook`. Implementaciones: `wompi.provider`, `epayco.provider`, `cash-on-delivery.provider`. **No existe adaptador `mercado-pago`** (C-12). El dominio y el checkout conocen solo el puerto.

**Reglas obligatorias:**

1. El pedido se confirma **únicamente** por webhook con firma válida o por conciliación; la redirección del navegador es informativa.
2. Todo webhook se verifica (HMAC), se persiste con `unique(provider, event_id)` y se procesa de forma asíncrona e idempotente en el worker.
3. Los eventos son monotónicos: un pago rechazado tardío no puede retroceder un pedido `PAGADO`.
4. `Idempotency-Key` obligatoria en creación de intención, reembolsos y en `POST /api/v1/checkout` (único endpoint de creación de pedido; no existe `POST /orders`, C-06).
5. Conciliación diaria contra la API del proveedor; toda diferencia abre `PAGO_REVISION` y alerta.
6. **Contraentrega (COD)** se modela como método propio, no como pasarela: pedido en `PENDING_PAYMENT` con método `COD` (identificador canónico C-08; «pendiente de pago en tienda» es solo etiqueta UI), límite de monto/zona, OTP y confirmación por WhatsApp. Sin factura hasta el cobro → `PAID`.
7. BNPL nativo de Wompi entra en MVP; Addi/Sistecrédito directos se difieren a Fase 2 (requieren contrato, homologación y conciliación propias).

## Consecuencias

**Positivas**
- Alcance PCI reducido a **SAQ-A**: no almacenamos, procesamos ni transmitimos PAN/CVV.
- Un solo adaptador cubre tarjeta, PSE, Nequi, Daviplata, efectivo, QR y BNPL → menos superficie de bugs.
- Cambiar a ePayco por falla o tarifa es activar una bandera, no rehacer checkout ni pedidos.
- Confianza de marca local (Bancolombia) reduce fricción en el momento del pago.

**Negativas / costos**
- Dependencia de un proveedor externo en el critical path: mitigada con plan B probado y prueba de caos.
- Comisión efectiva ≈3,59% en ticket de COP 190.000, **sin IVA** (C-09): los importes publicados no incluyen impuesto, para evitar doble conteo en el *take rate*. Requiere negociación por volumen e incentivar PSE/Nequi.
- Los webhooks duplicados/fuera de orden exigen idempotencia y máquina de estados (coste de implementación y tests).
- Conciliación diaria añade un job y un runbook operativo.

**Neutras**
- Las tarifas publicadas cambian con frecuencia: el documento usa valores solo como referencia, nunca como compromiso.

## Alternativas

| Alternativa | Por qué se descartó |
|---|---|
| ePayco como primaria | Similar en costo y cobertura, pero sin BNPL nativo y con desembolso más lento; se conserva como plan B. |
| Mercado Pago | Costo mayor y menos "local" en PSE; útil para cobros por link/redes, no para este checkout. |
| Stripe con PSE | PSE no nativo en Colombia (verificar vigente) → añade proveedor; no resuelve efectivo ni billeteras. |
| Captura de tarjeta propia (SAQ-D) | Alcance PCI y riesgo de seguridad inaceptables para un equipo pequeño. |
| BNPL directo Addi/Sistecrédito en MVP | Contrato, homologación y conciliación propios; difiere el go-live sin desbloquear el checkout. |

## Estado

**Proposed**. Requiere revisión de `forge-sentinel` (PCI, webhooks, PII) y aprobación de `apex-forge`. Antes de firmar: confirmar tarifas, cobertura de BNPL y plazos de desembolso por escrito con Wompi.

> **Pregunta abierta (`DD-Qn` en el Design Doc):** ¿el contrato con Wompi permite checkout hospedado con nuestro dominio de retorno y webhooks firmados desde el primer día, o hay un proceso de homologación que afecte el Sprint 5? Responde: Comandante + Finanzas.
