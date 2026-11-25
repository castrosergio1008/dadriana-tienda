# ADR-MVP-004 — Rediseño de identidad conservando el diseño anterior

| Campo | Valor |
|---|---|
| **ID** | `ADR-MVP-004` |
| **Estado** | **Proposed** — pendiente de aprobación del cliente, `forge-reviewer` y `apex-forge` |
| **Fecha** | 25 de noviembre de 2026 |
| **Decisores** | Cliente (estética y significado) + `apex-forge` (factibilidad) |
| **Relacionado** | `DD-MVP-11`, `DD-MVP-18`, [Design Doc MVP §7 y §10.2](../design-doc-mvp.md), RF-MVP-001…004, RNF-MVP-006…010, Q-MVP-04/Q-MVP-07 |

## Contexto

El cliente pidió una **imagen de marca nueva** conservando el diseño verde/dorado anterior como referencia histórica. El prototipo en `prototipo/` y `docs/03-disenos/sistema-diseno.md` documentan esa identidad aprobada (verde `#1E644C`, dorado `#B8895A`, Fraunces e Inter) y las maquetas de carrito, checkout, cuenta y seguimiento que ya no se construyen en este MVP. RF-MVP-001 exige que la guía nueva sea firmada por cliente y Comandante, que ningún componente use los tokens anteriores y que los archivos históricos permanezcan intactos verificables por diff.

Una identidad nueva malgobernada genera regresiones de contraste, CLS por fuentes y discrepancia entre favicon, Open Graph y lo que se comparte por WhatsApp.

## Decisión

Definir una identidad nueva versionada (`brand-tokens/v1`) en un **archivo nuevo** del sistema de diseño; **no editar ni eliminar** `docs/03-disenos/`, `prototipo/` ni `DESIGN_DOC.md`. El proceso tiene seis pasos con gate explícito: descubrimiento (alcance solo digital salvo Q-MVP-07), tokens (color, tipografía, espaciado, radios, movimiento), componentes base (botones, tarjetas, badges, carrusel, inputs, foco/error), activos (favicon, Open Graph, vista previa en WhatsApp), copy legal revisado por `forge-sentinel` y congelación con firma del cliente y del Comandante.

Tokens en `@theme` de Tailwind v4, sin hex sueltos; contraste ≥ 4,5:1 en texto normal y ≥ 3:1 en texto grande/UI; animaciones CSS-first con `prefers-reduced-motion`; imágenes AVIF/WebP con dimensiones reservadas; fuentes autoalojadas con `next/font`. El favicon, el Open Graph y la vista previa al compartir apuntan al canonical temporal `https://dadriana-tienda.vercel.app` mientras Q-MVP-04 está abierta y **no se publican como contenido indexable** hasta retirar Deployment Protection y `X-Robots-Tag: noindex` de Production (A2/DD-MVP-18).

## Consecuencias

**Positivas**

- RF-MVP-001 se verifica por diff: los archivos anteriores siguen ahí y ningún componente MVP usa sus tokens.
- Los cambios de opinión son baratos: cambiar tokens en un archivo nuevo no reescribe la referencia histórica.
- La aprobación por pasos evita descubrir problemas de contraste o de compartibilidad al final del sprint.

**Negativas / costes aceptados**

- La aprobación del cliente es ruta crítica: si se retrasa, se bloquea RF-MVP-001 y la UAT visual.
- Existe riesgo de confusión entre la identidad nueva y las maquetas antiguas; se mitiga con etiquetado claro de «referencia histórica» en el índice de documentación y con la verificación por diff en QA.
- Si Q-MVP-07 confirma material físico (rótulos, bolsas, facturas del POS), ese trabajo queda fuera de este MVP y requiere planificación adicional.

## Alternativas evaluadas

| Alternativa | Por qué se rechaza |
|---|---|
| **Conservar la identidad verde/dorada en producción** | Contradice la decisión explícita del cliente (RF-MVP-001). |
| **Rediseñar editando o borrando los archivos anteriores** | Destruye la referencia histórica exigida y rompe la trazabilidad del diseño aprobado el 24-nov-2026. |
| **Rediseño solo de colores, sin tokens ni componentes** | No cubre RF-MVP-002/-003/-004 ni garantiza contraste, foco, `prefers-reduced-motion` ni compartibilidad. |

## Estado

**Proposed.** Requiere aprobación estética del cliente, LGTM de `forge-reviewer` y aprobación final de `apex-forge`. Q-MVP-07 permanece abierta y no se interpreta en su favor.
