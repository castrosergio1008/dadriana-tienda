# ADR-MVP-002 — Modelo de datos mínimo e inventario como decisión diferida

| Campo | Valor |
|---|---|
| **ID** | `ADR-MVP-002` |
| **Estado** | **Proposed** — pendiente de `forge-reviewer`, `forge-sentinel` y `apex-forge` |
| **Fecha** | 25 de noviembre de 2026 |
| **Decisores** | `forge-architect` + `apex-forge` |
| **Relacionado** | `DD-MVP-06`, `DD-MVP-07`, `DD-MVP-17`, `DD-MVP-21`, `DD-MVP-22`, [Design Doc MVP §5.2, §8.2 y §8.4](../design-doc-mvp.md), [RF-MVP-008/030/031/037…042](../../01-requisitos/mvp-requisitos.md), N-MVP-08, Q-MVP-01, C-01/C-02 |

## Contexto

El MVP necesita persistir catálogo, marcas, categorías, imágenes, reseñas moderadas, tiendas físicas, selecciones curadas y configuración pública (RF-MVP-044). También debe mostrar disponibilidad publicada (RF-MVP-037…041), pero el cliente dejó pendiente el mecanismo de actualización: «podemos definirlo después». El diseño anterior define `inventory_lots(lot_id, site_id)` con FEFO, reservas y movimientos, y C-01 lo declaró fuente de verdad para el e-commerce transaccional. Trasladar ese modelo al MVP implicaría decidir fuente, frecuencia y permisos sin información, y construir capacidades que no se usan.

Además, los no-objetivos prohíben pedidos, carrito, cuentas, pagos, facturas, logística, lotes y reservas.

## Decisión

Adoptar un **modelo de datos mínimo** en PostgreSQL con estas entidades: `categories`, `brands`, `products` (con `price_cents` `BIGINT`, `currency='COP'` y `availability_status` ∈ {`available`, `out_of_stock`}), `product_images`, `reviews` (con estado `pending`/`approved`/`rejected`, consentimiento versionado, `contact_email_hmac` e `ip_hmac`), `sites`, `curated_selections` y `app_config`.

**A1 — `app_config` es la fuente canónica única de contenido editable sin deploy:** número oficial de WhatsApp, URLs de Instagram/Facebook, tiendas físicas y selecciones curadas («más vendidos» / «más referenciados»), además de textos legales y etiquetas. `sites` y `curated_selections` son **proyecciones normalizadas de esa misma configuración** para consulta eficiente, no una segunda fuente de verdad. No existen variables de entorno **de contenido**: el inventario es `NEXT_PUBLIC_SITE_URL` y `DATABASE_URL`, más la excepción explícita `REVIEW_HASH_PEPPER` (DD-MVP-21/22, secreta, no derivada de `app_config`). `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_INSTAGRAM_URL` y `NEXT_PUBLIC_FACEBOOK_URL` quedan **eliminadas**; si ya están en la consola de Vercel, no se usan y pueden borrarse.

**A4 — hashing versionado (DD-MVP-21/22):** correo e IP se persisten **solo como `HMAC-SHA256(peppers[version], valor)`**, con pepper secreto y rotatable guardado en Vercel Encrypted Environment Variables. `reviews` incluye `email_hmac_key_version` e `ip_hmac_key_version` junto a los hashes. Nunca hash plano reversible por diccionario, nunca en claro en la respuesta ni en logs. Si el autor no proporciona correo, la deduplicación se hace por `HMAC(IP) + producto/alias`. **No existe `review_verification_tokens`**: la baja/rectificación se verifica manualmente contra el correo HMAC **usando la versión persistida, no la vigente** (A3, ver ADR-MVP-003); la alternativa de token de un solo uso queda diferida a un DD nuevo si se autoriza panel.

El pepper es la **excepción explícita** a A1: `REVIEW_HASH_PEPPER` es una tercera variable, secreta, exclusiva de Vercel; no es pública, no va en `app_config` ni se commitea, y `.env.example` solo contiene `<VALUE>`. La rotación publica `N+1`, conserva el anterior como `REVIEW_HASH_PEPPER_PREVIOUS` (o historial versionado equivalente en Vercel) **durante la ventana de rotación**, rehashea en escritura/lectura y registra fecha + versión + responsable en el runbook. Sin ese procedimiento la verificación de baja/rectificación deja de funcionar.

La **disponibilidad es un dato publicado e informativo**, no un saldo transaccional: no hay `inventory_lots`, `inventory_by_site`, `reservations`, `inventory_movements`, FEFO, vencimientos ni anti-sobreventa. Se reutilizan las convenciones C-01 (`site_id` como identificador técnico, «tienda» como etiqueta UI) y C-02 (`price_cents` en `BIGINT`), pero **no se calcula IVA ni total de cobro**. Los JSON públicos usan `slug`/`sku`; no exponen `reviews.id` ni `product_id` internos (H-9).

La fuente de verdad del inventario, su frecuencia de actualización, los permisos y el responsable quedan **abiertos en Q-MVP-01**. El diseño fija solo el contrato de lectura (`availability_status`) y la regla de que un producto agotado no se puede agregar a la lista; no inventa quién ni cómo se actualiza. **A5:** si el moderador detecta un menor, se borran la reseña, el correo HMAC y los metadatos, con excepción explícita a la conservación de evidencia de consentimiento.

## Consecuencias

**Positivas**

- Esquema pequeño, fácil de migrar con `expand → contract` y de probar con datos ficticios.
- No se construye código muerto de lotes, reservas ni FEFO; se evita una decisión inventada sobre inventario.
- La transición a Fase 2 es aditiva: `products.availability_status` puede convertirse en proyección derivada de `inventory_lots` sin rehacer catálogo ni reseñas.
- `price_cents` mantiene precisión sin introducir cálculos fiscales en la app.
- El contenido sensible al negocio se edita en `app_config` sin deploy (RF-MVP-008/030/031/042) y sin duplicidad de configuración.
- HMAC versionado con pepper rotatable reduce el impacto de una filtración, permite deduplicar sin correo en claro y hace que rotar no rompa la verificación; el borrado por menor es una excepción gobernada al consentimiento.

**Negativas / costes aceptados**

- Si la disponibilidad se actualiza mal, el sitio puede mostrar un estado desactualizado; se mitiga con etiqueta informativa, sin promesa de entrega y con RF-MVP-040 de coherencia entre superficies.
- Q-MVP-01 bloquea el go-live: debe resolverse antes de publicar RF-MVP-037…040.
- No hay trazabilidad de lotes ni vencimientos en el MVP; es una decisión explícita, no un descuido (N-MVP-08).

## Alternativas evaluadas

| Alternativa | Por qué se rechaza |
|---|---|
| **Reutilizar `inventory_lots` + FEFO de Fase 2 desde el inicio** | Obliga a decidir fuente, frecuencia y permisos hoy, y a construir reservas/movimientos sin uso; contradice N-MVP-08. Se conserva intacto para Fase 2. |
| **Sin base de datos, contenido estático en el repositorio** | RF-MVP-044 exige PostgreSQL y RF-MVP-008/031 exigen cambiar selecciones y tiendas sin deploy; además complica la moderación de reseñas. |
| **CMS externo como fuente de catálogo y reseñas** | Traslada a un tercero el consentimiento versionado, la retención y la invisibilidad de `pending` (bloqueantes `SEC-MVP-001/-002/-007/-008`). |

## Estado

**Proposed.** `forge-sentinel` ya confirmó en diseño que el modelo satisface minimización de datos, HMAC versionado con pepper rotatable, borrado por menor y retención (evidencias de release pendientes); `forge-reviewer` debe verificar que no se cuela ninguna entidad transaccional ni variable de entorno de contenido, y que `REVIEW_HASH_PEPPER` queda documentada como excepción. Q-MVP-01 y Q-MVP-03 siguen abiertas y no se resuelven aquí.
