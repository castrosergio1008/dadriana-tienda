# ADR-MVP-006 — Exposición pública temporal de la página de presentación

| Campo | Valor |
|---|---|
| **ID** | `ADR-MVP-006` |
| **Estado** | **Accepted** — excepción temporal aprobada por el Comandante el 25-nov-2026; ejecución sujeta a los controles del runbook antes de compartir el enlace |
| **Fecha** | 25 de noviembre de 2026 |
| **Decisores** | `apex-forge` (Comandante, elección de la opción) + `forge-architect` (documentación de la excepción) |
| **Relacionado** | `DD-MVP-23`, `DD-MVP-18` (A2/H-6/F-1/F-6), [Design Doc MVP §10.1 y §10.2](../design-doc-mvp.md), [ADR-MVP-005](./ADR-MVP-005.md), [Runbook MVP §3.4](../../07-infra/runbook-mvp.md) |

## Contexto

`docs/02-arquitectura/design-doc-mvp.md` A2/`DD-MVP-18` exige Deployment Protection y `X-Robots-Tag: noindex` en Production hasta cerrar Q-MVP-03/04/08 y crear la `DATABASE_URL` de Production. Esa regla protege **la aplicación**: evita publicar contenido no autorizado, un formulario público de reseñas o credenciales productivas antes del go-live.

Existe además `presentacion/mvp/index.html`, una página temporal de presentación del MVP. Es HTML estático y autocontenido: CSS inline, sin JavaScript, sin formularios, sin recursos externos y sin datos reales; ya incluye `<meta name="robots" content="noindex, nofollow">` y no contiene un enlace `wa.me` con número ficticio ni redes sin confirmar. Hoy el repositorio no tiene `package.json` ni aplicación, y el proyecto de Vercel `dadriana-tienda` existe pero **no tiene un despliegue útil de la presentación**. No hay dominio propio (Q-MVP-04 abierta): el canonical temporal es `https://dadriana-tienda.vercel.app`.

El Comandante eligió la opción «Pública en dadriana-tienda (Recomendado)». Necesita compartir la presentación por URL sin convertirla en la tienda pública, sin crear la BD de Production y sin reabrir las condiciones de go-live. Se documenta aquí la excepción **antes** de cualquier cambio de configuración de despliegue.

## Decisión

1. **Publicar solo el HTML estático:** `presentacion/mvp/index.html` se sirve en la URL pública del proyecto de Vercel **`dadriana-tienda`** (canonical temporal `https://dadriana-tienda.vercel.app`). No se publica la aplicación, no se crea `package.json` y no se activa un build de Next.js para este artefacto. No se inventa fecha de go-live.
2. **Sin datos ni secretos:** el despliegue no usa `DATABASE_URL`, no crea esa variable en Production y no define variables de entorno ni secretos. El contenido sigue siendo ilustrativo y descriptivo del estado del proyecto: sin catálogo, precios, tiendas, números de WhatsApp, reseñas ni enlaces a redes sin confirmar (Q-MVP-08 sigue abierta).
3. **Doble `noindex`:** se conserva `<meta name="robots" content="noindex, nofollow">` en el HTML **en todo momento** y se añade la cabecera `X-Robots-Tag: noindex, nofollow`. La página es **visible por URL, no indexable**; no se le da carácter de sitio definitivo ni se promociona en buscadores.
4. **Cabeceras acordes al HTML:** CSP estricta en `enforce` compatible con el CSS inline — `default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests'` — más `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y HSTS por HTTPS. No se configura `report-uri`: el sitio estático no tiene endpoint de reportes. El criterio `report-only` → `enforce` de la app (§8.3 del Design Doc) **no se aplica a esta página**, porque no hay scripts ni formularios que puedan romperse.
5. **Excepción acotada, no derogación:** A2/`DD-MVP-18` permanece vigente para la futura aplicación y para Previews. La protección se restaura **antes de desplegar la aplicación o en cuanto aparezcan datos reales**, sin esperar a completar el checklist de 10 pasos. La publicación temporal **no es go-live** del MVP ni autoriza abrir Production.
6. **Mecanismo reversible:** el cambio se limita a un `vercel.json` **temporal**, versionado y revisado (PR + LGTM de `forge-reviewer`, con OK de `forge-infra` y `forge-sentinel` para configuración y cabeceras). La reversión consiste en **retirar ese `vercel.json` temporal y reactivar Deployment Protection** en Production (Previews no se modifican), verificando después `MVP-E2E-23`: sin autenticar ⇒ 401 + `X-Robots-Tag: noindex`.
7. **Procedimiento operativo:** publicación, verificación con `curl`, disparadores de reversión y acta en el [runbook MVP §3.4](../../07-infra/runbook-mvp.md). Cualquier desviación de cabeceras o aparición de datos reales bloquea compartir el enlace.
8. **Protección en consola, no en `vercel.json`:** Vercel Authentication queda en **Only Preview Deployments** (Production pública, Previews con SSO), Password Protection **OFF**, Trusted IPs sin bloqueo y sin Shareable Links ni bypasses. Debe anotarse el valor anterior para restaurarlo; borrar el archivo temporal **no** reactiva la protección.

## Consecuencias

**Positivas**

- El Comandante puede compartir la presentación por URL sin publicar la app ni sus datos futuros.
- La superficie es mínima: un único archivo HTML, sin JS, sin formularios, sin red de datos y sin secretos.
- La excepción es barata de probar y barata de revertir: un archivo de configuración temporal y una verificación de cabeceras; no hay migraciones ni BD que deshacer.
- `noindex` en meta y cabecera mantiene la página fuera de índices aunque alguien comparta el enlace.

**Negativas / costes aceptados**

- Durante la ventana temporal, la URL pública del proyecto no está protegida: cualquiera con el enlace puede ver la presentación. Se acepta porque el contenido es ilustrativo y no contiene PII ni credenciales.
- La CSP usa `style-src 'unsafe-inline'` por el CSS inline de la página; es un ámbito exclusivo de este artefacto y **no** se hereda en la app.
- El `vercel.json` temporal es una fuente adicional de deriva: exige control de revisión y una reversión explícita para volver a la configuración de ADR-MVP-005.
- Si la presentación permanece publicada cuando llegue la app, existe riesgo de publicar antes de tiempo; se mitiga con los disparadores de reversión del runbook.

## Alternativas evaluadas

| Alternativa | Por qué se rechaza |
|---|---|
| **Proyecto de Vercel separado solo para la presentación** | Aísla mejor la protección, pero crea un segundo proyecto, otra configuración y otro canonical; duplica superficie de revisión y aumenta la deriva respecto a `dadriana-tienda`. El Comandante eligió publicar en el proyecto existente; la opción queda disponible si la excepción se alarga. |
| **GitHub Pages** | Añade un tercer host con modelo de protección y cabeceras distinto, fuera del pipeline y del runbook de `forge-infra`; la reversión y la verificación de `noindex` dejarían de ser uniformes. |
| **Ver la presentación solo en local** | No resuelve la necesidad de compartirla por URL; es la opción por defecto solo si no se autoriza la excepción. |
| **Publicar la app incompleta con datos ilustrativos para «ver avances»** | Viola A2/`DD-MVP-18` y SEC-MVP-007: implicaría app, formulario o datos no autorizados antes de cerrar Q-MVP-03/04/08 y crear `DATABASE_URL`. La presentación estática evita exactamente ese riesgo. |

## Estado

**Accepted.** Excepción temporal documentada por `forge-architect` y elegida por el Comandante el 25-nov-2026. Antes de compartir el enlace deben ejecutarse los controles del [runbook §3.4](../../07-infra/runbook-mvp.md) y verificarse las cabeceras. Este ADR **no** autoriza crear `DATABASE_URL` en Production, retirar la protección de la aplicación ni dar por cumplido el checklist de go-live; la protección se restaura antes de desplegar la app o en cuanto aparezcan datos reales.
