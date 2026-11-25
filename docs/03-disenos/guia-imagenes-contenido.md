# Guía de imágenes y contenido — Adriana Tienda

| Campo | Valor |
|---|---|
| **Aplica a** | Fotografía, copy y contenido de catálogo, home, campañas y admin |
| **Idioma** | Español de Colombia · moneda COP con IVA incluido |
| **Estado** | Propuesta para revisión del cliente |
| **Relación** | Complementa `sistema-diseno.md` y las maquetas de `maquetas/` |

> Las imágenes que aparecen en las maquetas son **placeholders remotos** (`images.unsplash.com`)
> con fondos degradados de respaldo. Representan la dirección estética, no el catálogo real.
> En producción se usarán las fotografías del cliente o las producidas según esta guía.

---

## 1. Dirección de fotografía

### 1.1 Principio rector

**Belleza real, luz honesta.** Se busca la sensación de una tienda boutique colombiana: cálida,
limpia y creíble. Nada de stock foto con sonrisas forzadas ni laboratorios fríos. El producto
es el protagonista; la piel y las manos humanas aparecen como contexto, nunca como promesa de
resultado.

### 1.2 Luz

- **Luz natural difusa** de ventana, preferiblemente en horas de la mañana. Si se usa flash,
  difusor grande y temperatura neutra (5000–5600 K).
- Evitar sombras duras, reflejos metálicos en el envase y contraluz que oscurezca la etiqueta.
- Fondo de superficie mate: mármol crema, piedra clara, lino o papel texturizado.
- Consistencia de temperatura y dirección de luz en **todas las fotos de un mismo producto**,
  para que la galería parezca una sola sesión.

### 1.3 Fondos y paleta fotográfica

| Uso | Fondo sugerido | Referencia del sistema |
|---|---|---|
| Producto (ficha y grid) | Blanco cálido `#FFFFFF` o crema `#FDFBF9` | `--color-bg` / `--color-surface` |
| Categoría Facial | Rosado suave `#F7EAE7` + toallas de lino | `--color-blush` |
| Categoría Cabello | Verde suave `#E8F1EC` + elementos botánicos | `--color-sage` |
| Categoría Cuerpo | Crema dorado `#F4EAE0` + madera clara | `--color-accent-soft` |
| Campañas | Degradado crema→rosado con acento dorado | Identidad |

Regla: el producto ocupa **70–80 % del encuadre** y no se recorta el envase. Se prohíben
fondos negros, neón o estampados que compitan con el empaque.

### 1.4 Tipos de shot

| Tipo | Descripción | Dónde se usa |
|---|---|---|
| **Producto frontales** | Envase de pie, etiqueta legible, sin accesorios | Grid de catálogo, carrito, relacionados |
| **Textura / cut open** | Crema extendida, gota de sérum, espuma entre manos | Galería PDP, second shot |
| **Manos y aplicación** | Manos reales sosteniendo el envase o aplicando el producto | Galería PDP, banners |
| **Flat lay** | Composición ordenada de 3–5 productos + elemento natural (hoja, piedra, toalla) | Home, categorías, newsletter |
| **Antes / después** | Dos paneles con la **misma luz, mismo ángulo y sin retoque agresivo** | Solo campañas con evidencia real; **nunca** en cabello/facial sin respaldo |
| **Sucursal** | Interior de Zona Rosa y El Poblado: estantería, mostrador, equipo humano | Sección de tiendas, footer, confianza |
| **Editorial de rutina** | Secuencia paso a paso con manos y productos de la misma línea | Guías y blog |

**Ética visual:** no se usan imágenes antes/después manipuladas, ni promesas de eficacia
total, nombres de celebridades sin autorización ni porcentajes de resultado. Los resultados se
describen con lenguaje de cuidado («resultados visibles con uso constante»), nunca de cura.

### 1.5 Composición por pantalla

- **Hero home:** sujeto o producto a la derecha, espacio negativo a la izquierda para el titular.
  Proporción 16:9 en desktop y 4:5 en móvil; el punto de atención debe sobrevivir al recorte.
- **Cards de producto:** mismo encuadre y misma escala en toda la cuadrícula; eso evita saltos
  visuales y hace que la comparación de precios sea cómoda.
- **Galería PDP:** 1 frontal · 2 textura · 3 aplicación · 4 detalle de etiqueta/ingredientes.
- **Admin:** miniaturas cuadradas de 64 px; se recortan desde el original 4:5, nunca se estiran.

---

## 2. Especificaciones técnicas

### 2.1 Formatos y medidas

| Uso | Ratio | Dimensiones de exportación | Formato | Peso objetivo |
|---|---|---|---|---|
| Producto (grid y PDP) | **4:5** | 800 × 1000 px (y 1600 × 2000 para zoom) | WebP (AVIF cuando esté disponible) | ≤ 120 KB en 800 px |
| Miniatura carrito / admin | 1:1 | 160 × 160 px derivado del original | WebP | ≤ 20 KB |
| Hero desktop | 16:9 | 1920 × 1080 px | AVIF / WebP | ≤ 200 KB |
| Hero móvil | 4:5 | 960 × 1200 px | AVIF / WebP | ≤ 140 KB |
| Categorías y campañas | 4:3 | 1200 × 900 px | WebP | ≤ 150 KB |
| Sucursales | 3:2 | 1200 × 800 px | WebP | ≤ 150 KB |
| Logotipo | — | SVG vectorial + PNG 512 px | SVG / PNG | ≤ 30 KB |

**Reglas de entrega**

- `srcset` con al menos tres anchos (400 / 800 / 1600) y `sizes` acorde al breakpoint.
- `width` y `height` explícitos (o `aspect-[4/5]`) para reservar espacio y mantener **CLS = 0**.
- `loading="lazy"` en todo excepto la imagen LCP del hero, que usa `fetchpriority="high"`.
- Compresión: WebP calidad 78–82; AVIF calidad 55–65. Sin metadatos EXIF de cámara.
- Perfil de color sRGB. Espacio de color consistente para evitar cambios de tono entre navegadores.
- Las imágenes se sirven por CDN (Cloudflare R2 + Image Resizing en producción).

### 2.2 Nomenclatura de archivos

Formato: `{categoria}-{producto}-{vista}-{ancho}.{ext}`

```
cabello-shampoo-purificante-frontal-800.webp
cabello-shampoo-purificante-textura-800.webp
facial-serum-vitamina-c-aplicacion-1600.webp
cuerpo-crema-corporal-detalle-800.webp
campania-rutina-rosada-1200.webp
tienda-bogota-zona-rosa-1200.webp
tienda-medellin-el-poblado-1200.webp
```

- Minúsculas, guiones medios, sin tildes ni espacios, sin caracteres especiales.
- Un sufijo de vista por archivo: `frontal`, `textura`, `aplicacion`, `detalle`, `flatlay`,
  `antes`, `despues`, `sede`.
- Si hay variantes de tono: `-tono-{slug}` antes de la vista
  (`maquillaje-labial-mate-tono-vino-frontal-800.webp`).
- Nunca sobrescribir un archivo publicado: se sube con nombre versionado si cambia la foto.

### 2.3 Almacenamiento y administración

- Una carpeta por categoría y una subcarpeta por SKU.
- El admin permite reemplazar la imagen principal y reordenar la galería sin tocar código.
- Toda imagen nueva pasa por revisión de contraste del texto que pueda llevar superpuesto:
  se usa un degradado oscuro suave debajo del texto, no un filtro que cambie el producto.

---

## 3. Texto alternativo (`alt`)

### 3.1 Reglas

1. ** Producto:** describir tipo de producto + marca + característica visible relevante.
   Ejemplo: `alt="Shampoo purificante anticaspa de L'Oréal Paris, frasco blanco de 400 ml"`.
2. **Variante de tono:** incluir el tono. Ejemplo: `alt="Labial mate tono vino, envase rojo oscuro"`.
3. **Decorativa:** `alt=""` (vacío) para que lectores de pantalla la omitan.
4. **Imagen con texto incrustado:** el `alt` contiene ese texto, porque es información.
5. **Antes/después:** describir ambas partes en un solo `alt` sin interpretar resultados.
6. **Sucursal:** `alt="Interior de la tienda Adriana en Zona Rosa, Bogotá"`.
7. **No empezar** con «Imagen de» ni «Foto de»; el lector ya anuncia que es una imagen.
8. Extensión máxima recomendada: 120 caracteres; si hace falta más contexto, va en la ficha.
9. En las maquetas, las imágenes de placeholder llevan `alt` escrito como si fueran las definitivas,
   para que el patrón sea copiable en producción.

### 3.2 Ejemplos correctos e incorrectos

| Situación | ❌ Incorrecto | ✅ Correcto |
|---|---|---|
| Card de catálogo | `alt="producto"` | `alt="Mascarilla reparadora de L'Oréal Paris, tarro terracota de 400 ml"` |
| Banner de campaña | `alt="banner"` | `alt="Rutina facial en tonos rosados con frascos de sérum y crema hidratante"` |
| Textura | `alt="crema"` | `alt="Textura de crema hidratante extendida sobre superficie de lino"` |
| Icono decorativo | `alt="estrella"` | `alt=""` (el rating ya está en texto: «4,8 de 5, 128 reseñas») |

---

## 4. Tono de voz de la marca

### 4.1 Atributos

| Atributo | Sí | No |
|---|---|---|
| **Cercano** | «Encuentra tu rutina en minutos» | «Optimice su régimen de cuidado» |
| **Claro** | «Llega mañana en Bogotá» | «Envío express disponible» |
| **Honesto** | «Con ácido hialurónico. Sin promesas milagrosas.» | «Resultados increíbles en 3 días» |
| **Premium sin frialdad** | «Textura ligera, acabado sedoso» | «Formulación de alta tecnología patentada» |
| **Colombiano** | «Recoge hoy en El Poblado» | «Retiro en punto físico» |

### 4.2 Microcopy clave

| Contexto | Texto recomendado |
|---|---|
| Envío gratis | «Te faltan $ 45.100 para envío gratis» |
| Retiro | «Recoge gratis hoy en Zona Rosa · listo en 2 horas» |
| Stock bajo | «Quedan 3 unidades en Medellín — El Poblado» |
| Agotado | «Agotado en esta sede · avísame cuando llegue» |
| Confianza | «IVA incluido · retracto en 5 días hábiles» |
| Lote y vencimiento | «Lote L-2409 · Vence 05/2027» (etiqueta discreta en la ficha; FEFO sin lógica en la maqueta) |
| Pago | «Pago seguro: nunca te pedimos datos de tarjeta; pagas en el checkout hospedado de Wompi. Tu sesión usa cookies seguras.» |
| Newsletter | «Recibe rituales y novedades. Puedes darte de baja cuando quieras.» |
| Error de pago | «No pudimos aprobar el pago. Revisa los datos o intenta con otro método.» |
| Confirmación | «¡Listo, Adriana! Tu pedido #AT-2026-000123 está confirmado.» |

### 4.3 Reglas de escritura

- Tuteo en todo el storefront; «usted» solo en mensajes legales y transaccionales formales.
- Precios: `$ 119.900` (espacio después del símbolo, punto como separador de miles), siempre
  acompañados de «IVA incluido» en la primera aparición de cada pantalla.
- Números de pedido con formato único `AT-2026-000123`; es el que se muestra, se busca y se reporta a soporte (C-12). El cupón de ejemplo es `ADRIANA10`.
- Verbos en imperativo amable para CTA: «Agregar al carrito», «Ver mi pedido», «Elegir sede».
- Sin exclamaciones en exceso: máximo una por pantalla y solo en confirmación.
- Sin palabras prohibidas en cosmética: «cura», «elimina arrugas», «100 % seguro»,
  «aprobado por dermatólogos» salvo que el cliente tenga el respaldo documentado.

---

## 5. Contenido de la ficha de producto

### 5.1 Estructura obligatoria (en este orden)

1. **Marca** (enlace a la colección de la marca).
2. **Nombre del producto** con tamaño o presentación cuando sea parte del nombre.
3. **Rating y reseñas**: `★ 4,8 · 128 reseñas verificadas`, enlace a `#resenas`.
4. **Badges** como máximo dos: oferta real, nuevo, bestseller.
5. **Precio COP** con IVA incluido; precio anterior tachado **solo si el descuento es verificable**.
6. **Selector de presentación**: chips con tamaño/tono, precio por variante y stock.
7. **Disponibilidad**: stock por sede + ETA estimada por ciudad.
8. **Cantidad** limitada al stock; **un solo CTA** «Agregar al carrito».
9. **Modalidad de entrega**: retiro en tienda vs despacho a domicilio.
10. **Medios de pago** y mensaje de seguridad.
11. **Acordeones/tabs**: Detalles · Modo de uso · Ingredientes · Especificaciones.
12. **Reseñas verificadas** con distribución de estrellas.
13. **Productos relacionados** por necesidad/categoría (sin descuento de bundle en MVP).

### 5.2 Campos y longitud sugerida

| Campo | Longitud | Qué responder |
|---|---|---|
| Titular | 40–70 caracteres | Producto + beneficio principal + tamaño |
| Subtítulo / descripción corta | 90–140 caracteres | Para quién es y qué problema de cuidado atiende |
| Detalles | 2–3 párrafos cortos | Textura, aroma, sensación, frecuencia de uso |
| Modo de uso | 3–5 pasos numerados | Cuándo, cuánto, cómo, precauciones |
| Ingredientes | Lista + destacados | Activos clave con su función en lenguaje sencillo; lista completa INCI |
| Especificaciones | Tabla | Contenido neto, tipo de piel/cabello, origen, registro INVIMA si aplica |
| Reseñas | 30–200 caracteres cada una | Uso real, sin premios ni incentivos condicionados |

### 5.3 Ejemplo de ficha (contenido ilustrativo)

> **L'Oréal Paris**
>
> ### Mascarilla Reparadora 400 ml
>
> ★ 4,8 · 128 reseñas verificadas · `Bestseller`
>
> **$ 89.900** IVA incluido · ~~$ 104.900~~ (−14 %)
>
> *Para cabello dañado o con frizz: repara sin apelmazar y deja el tacto suave desde la primera
> aplicación.*
>
> **Presentación:** [250 ml $ 69.900] **[400 ml $ 89.900]** [1 L $ 149.900]
>
> **Disponible hoy en Bogotá — Zona Rosa · 9 und.** · En Medellín — El Poblado · 6 und.
> *Llega mañana en Bogotá y Medellín.*
>
> `[ Cantidad − 1 + ]` · ♡ Guardar · **[ Agregar al carrito ]**
>
> 🚚 Despacho a domicilio · 🏬 Recoge gratis hoy en tienda
>
> **Modo de uso:** 1. Lava con shampoo. 2. Aplica de medios a puntas. 3. Deja 5 minutos.
> 4. Enjuaga con agua tibia.
>
> **Ingredientes destacados:** queratina hidrolizada (repara la fibra), aceite de argán
> (suavidad y brillo), pantenol (retención de humedad).

### 5.4 Buenas prácticas de contenido

- El mismo producto debe tener **idéntico nombre y precio** en grid, ficha, carrito y factura.
- La descripción corta del grid se reutiliza en email y WhatsApp: evita reescribirla mal.
- Los atributos de filtro (`tipo de piel`, `preocupación`, `tipo de cabello`) se cargan desde
  campos estructurados, **nunca** se infieren del texto libre.
- Si el producto tiene registro sanitario INVIMA, se muestra en Especificaciones con su número
  y estado vigente; si no aplica, se omite (no se inventa).
- Los badges de oferta se calculan con el precio anterior verificable; nunca se fijan a mano.
- Toda ficha pasa por revisión de legal antes del lanzamiento cuando mencione activos o
  resultados.

---

## 6. Checklist de entrega de contenido

- [ ] Fotos en WebP/AVIF con el ratio y peso acordado, con `srcset` y dimensiones explícitas.
- [ ] Nomenclatura de archivos coherente con la convención.
- [ ] `alt` descriptivo en cada imagen informativa; `alt=""` en decorativas.
- [ ] Hero con punto de atención seguro en 16:9 y 4:5.
- [ ] Precios en COP con IVA incluido y descuentos verificables.
- [ ] Copia en español colombiano, tuteo y sin promesas prohibidas.
- [ ] Ficha con los 13 bloques en orden y un solo CTA.
- [ ] Stock por sede y ETA reales antes de publicar.
- [ ] Registro INVIMA mostrado solo cuando exista y esté vigente.
- [ ] Contenido legal y de privacidad enlazado desde la ficha y el checkout.
