# ADR-MVP-001 — Vitrina + WhatsApp en lugar de e-commerce transaccional

| Campo | Valor |
|---|---|
| **ID** | `ADR-MVP-001` |
| **Estado** | **Proposed** — OK de diseño de `forge-reviewer` y `forge-sentinel` recibidos; aprobación final de `apex-forge` registrada en el Design Doc |
| **Fecha** | 25 de noviembre de 2026 |
| **Decisores** | Cliente (el «qué») + `apex-forge` (el «cómo») |
| **Relacionado** | `DD-MVP-01`, `DD-MVP-04`, `DD-MVP-05`, `DD-MVP-17`, `DD-MVP-20`, [Design Doc MVP §5.3 y §10.5](../design-doc-mvp.md), [RF-MVP-023…028](../../01-requisitos/mvp-requisitos.md), N-MVP-01…07 |

## Contexto

El diseño aprobado el 24-nov-2026 describe un e-commerce completo con carrito, checkout Wompi/ePayco, facturación DIAN, pedidos, logística, venta POS y panel de operación. El 25-nov-2026 el cliente redefinió el MVP: la web debe **informar y organizar la intención de compra**, no transar. El cierre lo decide la persona entre pagar en la tienda física o acordar una transferencia por WhatsApp, y la factura electrónica la emite el asesor en su POS externo.

Los requisitos aprobados prohiben pago en línea, datos de tarjeta, facturación en la app, carrito persistente, cuentas de cliente, tracking de pedido, logística, lotes, FEFO y reservas (N-MVP-01…08; SEC-MVP-024…026 son bloqueantes). Cualquier superficie transaccional añadiría coste, riesgo regulatorio y PII innecesaria.

## Decisión

Implementar una **vitrina informativa** con una «lista de pedido» que es un borrador **en memoria, sin persistencia** (`localStorage`, `sessionStorage`, cookies, IndexedDB y *service worker* prohibidos). La lista genera un enlace **`https://wa.me/<número oficial>`** con un mensaje prellenado que contiene SKU, cantidades, precios COP de referencia, modalidad de cierre elegida y, si aplica, tienda física. El número se toma de **`app_config` en PostgreSQL, fuente única de contenido (A1/DD-MVP-17)**, se valida con `^57\d{10}$` y nunca se lee de query, hash, `Referer`, reseñas ni entrada del usuario; `NEXT_PUBLIC_WHATSAPP_NUMBER` queda **eliminada del inventario** (si existe en la consola de Vercel, no se usa y puede borrarse). La URL se construye en el navegador **sin endpoint propio**, sin ID de pedido y sin promesa de factura ni despacho. El mensaje incluye la nota de que la facturación la gestiona el asesor en su POS. Se admite un tope de 20 ítems en memoria para evitar URLs excesivamente largas. Conforme a **A8**, no se instrumenta ni se alerta la apertura del enlace: no hay endpoint ni telemetría de servidor; la verificación es una sonda E2E sintética sin PII por release.

## Consecuencias

**Positivas**

- Cero superficies de pago, tarjeta, NIT, DIAN, pedidos ni tracking: se eliminan de raíz los bloqueantes SEC-MVP-024…026.
- No hay sesión de cliente ni almacenamiento local: SEC-MVP-013/-014 son no aplicables por decisión del Comandante.
- Un solo flujo que probar de extremo a extremo y una superficie de ataque mínima.
- El número y las tiendas se editan en `app_config` sin deploy; no hay deriva entre variables de entorno y contenido publicado.
- Observabilidad honesta (A8): no se promete una alerta imposible; la sonda sintética por release verifica el enlace sin PII.
- La Fase 2 puede reactivar el e-commerce completo sin borrar este diseño: la lista no crea datos que deban migrarse.

**Negativas / costes aceptados**

- La conversión comercial depende de la respuesta humana del asesor; no se mide con analítica de personas (N-MVP-17/18).
- El mensaje puede volverse largo; se mitiga con el tope de ítems y plantilla fija.
- Si el cliente cambia de opinión y quiere pago en línea, hace falta un Design Doc nuevo y revisión de `forge-sentinel`.

## Alternativas evaluadas

| Alternativa | Por qué se rechaza |
|---|---|
| **E-commerce transaccional del diseño anterior** (carrito, Wompi, DIAN, pedidos, logística, panel) | Resuelve un problema que el cliente excluyó explícitamente; añade 8 bloqueantes de seguridad y semanas de trabajo. Se conserva para Fase 2. |
| **Carrito persistente sin pago** | Exige decidir TTL, purga y contenido almacenado (SEC-MVP-013/-014), contradiciendo la decisión del Comandante de lista en memoria. |
| **Checkout externo embebido / enlace de pago** | Sigue siendo un payment surface: N-MVP-01/-02 y SEC-MVP-024/-025 lo prohíben. |

## Estado

**Proposed.** Requiere LGTM de `forge-reviewer` y OK de `forge-sentinel` antes de construir; la aprobación final corresponde a `apex-forge`. Q-MVP-06 (número oficial y eventual Business API) permanece abierta y no modifica esta decisión para el MVP. Las enmiendas A1/A8 quedan integradas; `forge-qualis` ya confirmó la sonda E2E-27 en diseño; ejecutarla y adjuntar la evidencia sigue siendo condición de release.
