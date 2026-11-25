# Sistema de diseño — Adriana Tienda

| Campo | Valor |
|---|---|
| **Proyecto** | Adriana Tienda — e-commerce de belleza y cuidado personal (Colombia) |
| **Fase** | Definición visual previa a la implementación (el cliente quiere ver y entender el diseño) |
| **Estado** | Propuesta para revisión del cliente |
| **Relación** | Materializa y amplía el §9 del `DESIGN_DOC.md`; conserva la identidad ya aprobada en el prototipo `prototipo/` (S0) |
| **Idioma / moneda** | Español de Colombia · COP con IVA incluido |
| **Fecha** | 23 de noviembre de 2026 |

> **Nota de alcance.** Este documento y las maquetas de `maquetas/` son artefactos de diseño para
> revisión. No son código de producción ni sustituyen al Design Doc aprobado. La implementación
> real seguirá el pipeline APEX FORGE (Design Doc → plan → construcción → pruebas → review).

---

## 1. Identidad de marca

### 1.1 Nombre y tagline

**Marca: Adriana.** Se mantiene el nombre del negocio, reconocido por el cliente y ya presente
en el prototipo. En contextos formales se usa **Adriana Tienda**; en el logo y en la navegación,
**Adriana** con el isotipo.

**Tagline principal propuesto:** *«Tu ritual de belleza, cerca de ti»*.

Comunica en cinco palabras las dos ideas que diferencian al negocio: el cuidado personal como
ritual (categoría emocional) y la cercanía física de las dos sucursales (Zona Rosa, Bogotá y
El Poblado, Medellín). Es corto, funciona en móvil y no promete resultados clínicos.

Alternativas para validar con el cliente:

| Tagline | Énfasis | Cuándo usarla |
|---|---|---|
| *Tu ritual de belleza, cerca de ti* | Cercanía + rutina | **Recomendada**: home, firma de correos, footer |
| *Belleza consciente, resultados reales* | Confianza e ingredientes | Campañas de facial/cabello |
| *Cuidado que se nota, confianza que se siente* | Prueba social | Banners y redes |

### 1.2 Personalidad

| Rasgo | Cómo se ve | Cómo se escribe |
|---|---|---|
| **Cálida, no clínica** | Papel crema, rosado suave, fotografía con luz natural | «Tu piel, sin prisa» en lugar de «Tratamiento dermatológico» |
| **Premium, no elitista** | Verde profundo + dorado, mucho espacio en blanco, tipografía editorial | Explicación clara sin jerga; precio siempre visible |
| **Transparente** | Stock por sede, ETA, IVA incluido, retracto visible | «Llega mañana en Bogotá», no «Envío rápido» |
| **Cercana** | Dos tiendas con nombre y horario; WhatsApp real | «Recoge hoy en Zona Rosa» |

### 1.3 Decisión cromática (importante)

El §9.2 del Design Doc proponía un burdeos (`#7A1F3D`) como primario. El prototipo S0, ya
aprobado por el cliente, adoptó **verde profundo (`#1E644C`) + dorado (`#B8895A`)** a partir del
logo real de Adriana. **Esta propuesta conserva esa identidad aprobada**: el verde es el color de
marca y el dorado el acento premium. Se añaden el **rosado suave** y el **crema** como tonos de
soporte para las categorías de belleza y para los fondos, de modo que el resultado se lea
crema / rosado / verde suave con acento dorado, sin romper el logotipo. El burdeos queda
descartado y se documenta para evitar regressions.

---

## 2. Paleta de colores

### 2.1 Colores de marca

| Token | Hex | Significado y uso |
|---|---|---|
| `--color-primary` | `#1E644C` | Verde profundo. Identidad, CTA principal, enlaces, header. **7,04:1** sobre blanco (AA y AAA para texto normal). |
| `--color-primary-hover` | `#154E3B` | Estado hover/activo del primario. **9,61:1** sobre blanco. |
| `--color-primary-soft` | `#E8F1EC` | Verde suave. Fondos de badge, callouts y zonas de stock disponible. |
| `--color-accent` | `#B8895A` | Dorado. Detalles premium, estrellas, divisores, adornos. **3,10:1** sobre blanco: **no usar para texto pequeño**; **5,82:1** sobre `#1C1418` (cumple AA incluso para texto normal). |
| `--color-accent-dark` | `#7E5A34` | Dorado oscurecido para texto sobre fondos claros. **6,18:1** sobre blanco, **5,20:1** sobre `#F4EAE0`. |
| `--color-accent-soft` | `#F4EAE0` | Crema dorado. Fondos de badges de oferta y secciones editoriales. |

### 2.2 Neutros y superficies

| Token | Hex | Uso |
|---|---|---|
| `--color-bg` | `#FDFBF9` | Fondo cálido de la página (paper). |
| `--color-surface` | `#FFFFFF` | Tarjetas, inputs, modales, tablas. |
| `--color-ink` | `#1C1418` | Texto principal y titulares. **18,06:1** sobre blanco. |
| `--color-muted` | `#6B5F63` | Texto secundario, metadatos, descripciones. **6,10:1** sobre blanco y **5,91:1** sobre `#FDFBF9`. |
| `--color-border` | `#E8E1DD` | Bordes y divisores sobre fondo claro. |
| `--color-border-strong` | `#D6CCC6` | Bordes de inputs y estados enfatizados. |

### 2.3 Tonos de soporte (belleza)

| Token | Hex | Uso |
|---|---|---|
| `--color-blush` | `#F7EAE7` | Rosado suave: fondo de categoría Facial, banners de campaña. |
| `--color-blush-strong` | `#EBC9C6` | Rosado de acento en ilustraciones y barras decorativas (no texto). |
| `--color-sage` | `#E8F1EC` | Verde suave: categoría Cuerpo, etiquetas de envío gratis. |

### 2.4 Colores de estado

| Token | Hex | Contraste sobre blanco | Uso |
|---|---|---|---|
| `--color-success` | `#1E7A4C` | 5,33:1 | Stock disponible, pago aprobado, pedido entregado. |
| `--color-success-soft` | `#E6F4EC` | — | Fondo de mensajes de éxito. |
| `--color-warning` | `#B26B00` | 4,20:1 | **Solo iconos/gráficos** (no cumple AA para texto normal). |
| `--color-warning-dark` | `#8F5600` | 6,00:1 | Texto de advertencias y stock bajo. |
| `--color-danger` | `#B3261E` | 6,54:1 | Errores, stock agotado, pagos rechazados. |
| `--color-danger-soft` | `#FBE9E8` | — | Fondo de mensajes de error. |

**Regla de uso del dorado:** `#B8895A` es decorativo. Para cualquier palabra escrita sobre
fondo claro se usa `#7E5A34`. Esta distinción evita el fallo de contraste más común del diseño.

### 2.5 Tokens semánticos del panel de operación (admin)

Los tonos empleados en `admin-pedidos.html` y `admin-productos.html` pasan a formar parte del
sistema. Todos los pares de texto verificados cumplen AA (≥ 4,5:1); los bordes son decorativos
y no transmiten información por sí solos.

| Token | Hex | Contraste verificado | Uso en el panel |
|---|---|---|---|
| `--color-alert` | `#8A3B4E` | **7,46:1** sobre blanco · **6,35:1** sobre `#F7EAE7` · **7,29:1** sobre `#FFFCF8` | Texto de alerta, enlaces «Revisar pago», contadores y badges de error. Blanco sobre el token: **7,46:1**. |
| `--color-alert-border` | `#E4C9C0` | Decorativo (1,57:1 sobre blanco) | Borde de avisos y tarjetas en revisión; nunca como texto. |
| `--color-warning-soft` | `#FBF0DE` | Fondo; `#7E5A34` encima = **5,48:1** | Badges «En verificación», «En preparación», «Listo para recoger», «Stock bajo». |
| `--color-row-review` | `#FFFCF8` | Fondo; `#1C1418` encima = **17,66:1** · `--color-muted` = **5,96:1** | Filas y tarjetas de pedidos/productos que requieren revisión. |
| `--color-row-critical` | `#FFF6F6` | Fondo; `--color-alert` encima = **7,02:1** · `--color-muted` = **5,74:1** | Fila/tarjeta de producto sin stock. |
| `--color-row-critical-border` | `#E4C5C5` | Decorativo (1,60:1 sobre blanco) | Borde de la tarjeta sin stock; nunca como texto. |
| `--color-neutral-soft` | `#F1ECE9` | Fondo; `--color-muted` encima = **5,20:1** | Badges de estados neutros («Por empacar», «Entregado»). |
| `--color-text-disabled` | `#6B5F63` (alias de `--color-muted`) | **6,10:1** sobre blanco · **5,91:1** sobre `#FDFBF9` | Único color permitido para texto deshabilitado. Queda prohibido `#9A8F92` (**3,13:1**). |

**Regla de mapeo:** si un color nuevo aparece en una maqueta, se documenta aquí como token con
su par de texto verificado antes de propagarse. No se usan hex sueltos sin token. Estos tonos son
**funcionales del panel**, no de marca: no reintroducen el burdeos descartado en §1.3 ni aparecen
en el storefront.

---

## 3. Tipografía

### 3.1 Familias

| Rol | Fuente | Carga | Fallback |
|---|---|---|---|
| **Display** (titulares, precios grandes, logotipo tipográfico) | **Fraunces** (variable, peso 500–600, óptica suave) | Google Fonts en maquetas; `next/font/local` en producción | Georgia → Times New Roman → serif |
| **UI y cuerpo** | **Inter** (400 / 500 / 600 / 700) | Google Fonts en maquetas; `next/font/local` en producción | system-ui → -apple-system → Segoe UI → sans-serif |

**Alternativas de Google Fonts** (si se requiere un aspecto más editorial o más neutro):

- Display: `Cormorant Garamond` (más fina y lujosa), `DM Serif Display` (más compacta),
  `Playfair Display` (más clásica). Mantener Fraunces como primera opción: es la que ya usa el prototipo.
- Sans: `DM Sans` (más redonda y cercana), `Manrope` (más técnica), `Plus Jakarta Sans`.
  Inter sigue siendo la opción por legibilidad en formularios y tablas admin.

**Regla:** máximo dos familias y cuatro pesos en producción. `font-display: swap` y fuentes
self-hosted con `next/font` para evitar CLS y refs externas bloqueantes.

### 3.2 Escala tipográfica

| Token | px / rem | Line-height | Uso |
|---|---|---|---|
| `--text-xs` | 12 / 0,75 | 1,5 | Etiquetas de badge, metadatos de tabla |
| `--text-sm` | 14 / 0,875 | 1,5 | Body secundario, descripciones, navegación |
| `--text-base` | 16 / 1 | 1,55 | Cuerpo, inputs, botones |
| `--text-lg` | 18 / 1,125 | 1,5 | Subtítulos de sección |
| `--text-xl` | 20 / 1,25 | 1,4 | Títulos de tarjeta |
| `--text-2xl` | 24 / 1,5 | 1,25 | Títulos de sección (móvil) |
| `--text-3xl` | 30 / 1,875 | 1,2 | Títulos de sección (desktop) |
| `--text-4xl` | 38 / 2,375 | 1,15 | H1 de home / hero |
| `--text-5xl` | 48 / 3 | 1,1 | Hero desktop amplio (solo cuando el ancho lo permite) |

Titulares: Fraunces 600, `letter-spacing: -0.01em`. Cuerpo: Inter 400. Etiquetas y botones:
Inter 600. Nunca usar texto por debajo de 12 px ni comprimir line-height por debajo de 1,4 en
párrafos.

---

## 4. Espaciado y layout

**Base 4 px.** Escala: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 96`.
En componentes pequeños se usan saltos de 4/8; entre secciones, 48/64/96.

| Contexto | Valor |
|---|---|
| Gutter de tarjetas de producto | 16 px (móvil) / 24 px (desktop) |
| Padding interno de card | 16–24 px |
| Separación entre bloques de sección | 64 px desktop / 40 px móvil |
| Margen lateral del contenedor | 16 px móvil · 24 px tablet · 32 px desktop |
| Ancho máximo del contenedor | 1280 px útiles (1440 px con márgenes) |
| Rail de filtros PLP | 280 px desde 1024 px |

**Grid**

| Breakpoint | Columnas | Gutter | Observación |
|---|---|---|---|
| < 640 px (375 px de referencia) | 4 | 16 px | 2 tarjetas de producto por fila; bottom-sheet para filtros |
| 640–1023 px (768 px) | 8 | 24 px | 3 tarjetas; filtros colapsables |
| ≥ 1024 px (1440 px) | 12 | 24 px | 4 tarjetas; rail de filtros fijo; galería PDP 7/5 |

---

## 5. Radios, sombras y elevación

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | 4 px | Chips, badges, etiquetas pequeñas |
| `--radius-md` | 8 px | Botones, inputs, filas de tabla |
| `--radius-lg` | 16 px | Tarjetas, paneles, modales, drawer |
| `--radius-full` | 999 px | Píldoras, avatares, swatches de tono |
| `--shadow-sm` | `0 1px 2px rgba(28,20,24,.04), 0 1px 6px rgba(28,20,24,.04)` | Cards en reposo |
| `--shadow-md` | `0 2px 8px rgba(28,20,24,.06), 0 8px 24px rgba(28,20,24,.06)` | Hover de card, dropdowns |
| `--shadow-lg` | `0 8px 24px rgba(28,20,24,.10), 0 24px 64px rgba(28,20,24,.14)` | Modales y drawer |

**Capas (z-index):** header 40 · drawer 60 · modal 80 · toast 90.
**Movimiento:** 120 ms (microinteracción) / 200 ms (hover y foco) / 320 ms (paneles), con
`cubic-bezier(0.2, 0, 0, 1)`. CSS-first, sin librerías de animación.

---

## 6. Iconografía

- Librería: **lucide-react** (misma familia de trazos que se reproduce en las maquetas con SVG
  inline, `stroke-width: 1.75–2`, `stroke-linecap: round`, `stroke-linejoin: round`).
- Tamaños: 16 px (inline en texto y badges), 20 px (navegación y botones), 24 px (acciones de
  cabecera), 32 px (sellos de confianza).
- Iconos del sistema: `Search`, `ShoppingBag`, `Heart`, `User`, `MapPin`, `Menu`, `X`,
  `ChevronDown/Right/Left`, `Plus`, `Minus`, `Trash2`, `Check`, `CheckCircle2`, `Truck`,
  `Store`, `ShieldCheck`, `LockKeyhole`, `CreditCard`, `Package`, `Clock3`, `Star`,
  `SlidersHorizontal`, `ArrowRight`, `Mail`, `Phone`, `Instagram`, `CircleAlert`, `Info`.
- Todo icono decorativo lleva `aria-hidden="true"`. Si el icono es la única contenido de un
  botón, el botón lleva `aria-label` en español.

---

## 7. Componentes base

### 7.1 Botón

| Variante | Estilo | Uso |
|---|---|---|
| **Primario** | Fondo `#1E644C`, texto blanco, radio 8, `px-5 py-3`, Inter 600 14/16 | Una acción por pantalla: «Agregar al carrito», «Ir a pagar», «Pagar» |
| **Secundario** | Fondo blanco, borde `#D6CCC6`, texto `#1E644C` | «Ver detalles», «Seguir comprando» |
| **Terciario / link** | Sin fondo, texto `#1E644C`, subrayado al hover | «Limpiar filtros», «¿Olvidaste tu contraseña?» |
| **Dorado** | Fondo `#B8895A`, texto `#1C1418` (contraste **5,82:1**, AA) | Acciones editoriales: «Ver la colección» en hero |
| **Peligro** | Texto `#B3261E`, borde `#B3261E` | «Eliminar producto», «Cancelar pedido» |

Tamaños: `sm` 36 px de alto · `md` 44 px · `lg` 48–52 px. En móvil ningún target baja de 44 px.

### 7.2 Input

- Altura 44–48 px, radio 8, borde `#D6CCC6`, fondo blanco, padding 12–16 px.
- Label siempre visible encima, Inter 600 14 px, `for` asociado al `id`.
- Placeholder en `#6B5F63`, nunca como sustituto del label.
- Helper text debajo, 12–14 px, `#6B5F63`.
- Error: borde `#B3261E`, mensaje `#B3261E` con icono `CircleAlert`, `aria-invalid="true"`,
  `aria-describedby` apuntando al mensaje. Éxito: borde `#1E7A4C` + `CheckCircle2`.
- `autocomplete` nativo en datos personales; **los datos de tarjeta nunca entran al DOM de la
  tienda** (checkout hospedado de la pasarela).

### 7.3 Badge

| Variante | Fondo / texto | Uso |
|---|---|---|
| Oferta | `#F4EAE0` / `#7E5A34` | `-15%`, precio anterior vérificable |
| Nuevo | `#E8F1EC` / `#1E644C` | Producto nuevo |
| Bestseller | `#1E644C` / blanco | Más vendido |
| Agotado | `#FBE9E8` / `#B3261E` | Sin stock |
| Estado pedido | `#E6F4EC` / `#1E7A4C` (pagado), `#F4EAE0` / `#8F5600` (pendiente) | Tablas y timeline |
| Lote / vencimiento | `#F4EAE0` / `#7E5A34` | Etiqueta discreta en la ficha de producto: «Lote L-2409 · Vence 05/2027». Informativa: refleja lotes + FEFO, sin lógica en las maquetas. |

Radio 4 px, 11–12 px Inter 600, `uppercase` solo en badges cortos (2 palabras máximo).

### 7.4 Card

Fondo blanco, borde `#E8E1DD`, radio 16, sombra `sm`, padding 16–24. En hover: sombra `md`,
borde `#D6CCC6` y `translateY(-2px)` (desactivado con `prefers-reduced-motion`). La imagen de
producto usa proporción **4:5** y rellena el ancho; el nombre va en Inter 600 14,
la marca en Inter 500 12 `#6B5F63`, el precio en Fraunces 600 18–20 y las estrellas en dorado
con el número de reseñas en `#6B5F63`.

### 7.5 Navbar

- Barra de anuncio: 32–36 px, verde profundo, texto blanco 12 px («Envío gratis desde
  $150.000 · Recoge en tienda sin costo»).
- Header principal: 72 px, fondo blanco, borde inferior `#E8E1DD`, `sticky top-0`.
  Logo a la izquierda; navegación de categorías con mega-menú al pasar el foco/click;
  buscador centrado; acciones a la derecha (favoritos, cuenta, bolsa con contador).
- En móvil: logo + buscador + bolsa + botón `Menu`; el mega-menú se convierte en panel
  desplegable. El buscador ocupa toda la pantalla al enfocarse.
- Skip link visible al enfocarse: «Saltar al contenido principal».

### 7.6 Footer

Cuatro columnas en desktop, acordeones en móvil: **Compra** (categorías y marcas), **Ayuda**
(envíos, retracto, seguimiento, FAQ), **Nosotras** (quiénes somos, contacto, tiendas), **Legal**
(política de datos, términos, libro de reclamaciones). Franja inferior con `#1E644C`, métodos de
pago (Visa, Mastercard, PSE, Nequi, Daviplata, Wompi), copyright y tagline. Cada tienda física se
muestra con dirección, horario y enlace «Cómo llegar».

---

## 8. Estados interactivos

| Estado | Regla visual |
|---|---|
| **Hover** | Botón primario → `#154E3B`. Enlaces subrayados. Card → sombra `md` + borde más oscuro. 200 ms. |
| **Focus visible** | `outline: 2px solid #1E644C`, `outline-offset: 2px`; sobre fondos verdes se usa `#F4EAE0`. **Nunca** `outline: none` sin reemplazo. |
| **Active / pressed** | Botón se desplaza 1 px y usa `#154E3B`. |
| **Disabled** | Texto con `--color-text-disabled` (`#6B5F63`, 6,10:1 sobre blanco) a **opacidad completa**: no se usa `opacity` sobre el texto ni gris claro (WCAG 1.4.3 no exime el texto deshabilitado). `cursor: not-allowed`, sin hover; el botón lleva `disabled` real y los elementos no interactivos `aria-disabled="true"`. |
| **Loading** | Texto «Procesando…», spinner con `aria-busy="true"`; el botón se bloquea para evitar doble envío. |
| **Error** | Borde `#B3261E`, mensaje inline con `role="alert"`; el foco salta al primer campo inválido. |
| **Éxito** | Mensaje `#1E7A4C` sobre `#E6F4EC` con `CheckCircle2`; `aria-live="polite"` para cambios de carrito **en la implementación** (ver §9, n1). |

---

## 9. Accesibilidad (WCAG 2.2 AA)

Checklist obligatorio para las maquetas y para la implementación:

1. **Contraste (1.4.3 / 1.4.11).** Texto normal ≥ 4,5:1; titulares grandes ≥ 3:1; bordes de
   inputs y gráficos informativos ≥ 3:1. El dorado `#B8895A` solo es decorativo; su variante
   textual es `#7E5A34`.
2. **Reflow (1.4.10) y zoom (1.4.4).** Sin scroll horizontal a 320 px; el contenido se reordena
   en una columna. Soporte de zoom al 200 %.
3. **Espaciado del texto (1.4.12).** Los componentes no se rompen con line-height 1,5,
   spacing de párrafo 2× y letter-spacing 0,12em.
4. **Foco visible (2.4.7 / 2.4.11).** Ring de 2 px en todos los elementos interactivos;
   el foco no queda detrás del header sticky (`scroll-margin-top`).
5. **Target size (2.5.8).** Mínimo 24×24 px, objetivo de diseño 44×44 px en táctil.
6. **Semántica (1.3.1).** Un solo `h1` por página, jerarquía `h2`→`h3` sin saltos; `nav`,
   `main`, `footer`, `header`, `section` con `aria-labelledby` cuando aporte contexto.
7. **Idioma (3.1.1).** `<html lang="es">`; `lang="es-CO"` en fragmentos con modismos o moneda.
8. **Formularios (3.3.1–3.3.3, 3.3.7).** Errores identificados por texto, no solo color;
   etiquetas persistentes; opción de corregir errores en checkout reenviando sin perder datos.
9. **Estado y notificaciones (4.1.3).** Requisito de **implementación**: `aria-live="polite"`
   para carrito y filtros, `role="alert"` para errores y `aria-current="step"` en el paso activo
   del checkout. No exigible en maquetas estáticas (sin JS); ver nota n1 al final de esta sección.
10. **Navegación con teclado (2.1.1).** Drawer y modales con focus trap y `Esc` para cerrar;
    mega-menú accesible con Tab y Enter; orden de tabulación igual al orden visual.
11. **Imágenes (1.1.1).** `alt` descriptivo en producto; `alt=""` en decorativas; las imágenes
    con texto llevan ese texto en el `alt`.
12. **Movimiento (2.3.3).** `@media (prefers-reduced-motion: reduce)` anula transiciones,
    animaciones y scroll suave. Sin autoplay de carruseles. Sin parpadeos > 3 Hz.
13. **Consentimiento (privacidad).** Banner de cookies granular y revocable; Ley 1581/2012.
14. **Dinero y fechas.** COP con separador de miles (`$ 119.900`), IVA incluido declarado,
    fechas en formato colombiano legible («mar 24 de nov»).

> En las maquetas estáticas no hay lógica: los estados interactivos se **representan visualmente**
> (por ejemplo, el chip de filtro activo o el botón deshabilitado) y se documentan aquí para la
> implementación.

> **n1 · `aria-live` no es un pendiente de las maquetas.** Las maquetas son HTML estático sin
> JavaScript: no hay cambios dinámicos que anunciar y no llevan `aria-live`. En la implementación
> del storefront, `aria-live="polite"` es obligatorio en los contadores del carrito, los resultados
> de filtros/búsqueda y los mensajes de estado; `role="alert"` se reserva para errores. Debe
> verificarse en pruebas de la app, no marcarse como fallo de accesibilidad de las maquetas.

---

## 10. Tabla de tokens CSS equivalents (documentación)

| Concepto | Variable CSS | Valor | Equivalente en maquetas (Tailwind CDN, arbitrary value) |
|---|---|---|---|
| Primario | `--color-primary` | `#1E644C` | `bg-[#1E644C]` / `text-[#1E644C]` |
| Primario hover | `--color-primary-hover` | `#154E3B` | `hover:bg-[#154E3B]` |
| Primario suave | `--color-primary-soft` | `#E8F1EC` | `bg-[#E8F1EC]` |
| Acento | `--color-accent` | `#B8895A` | `text-[#B8895A]` / `bg-[#B8895A]` |
| Acento texto | `--color-accent-dark` | `#7E5A34` | `text-[#7E5A34]` |
| Acento suave | `--color-accent-soft` | `#F4EAE0` | `bg-[#F4EAE0]` |
| Fondo | `--color-bg` | `#FDFBF9` | `bg-[#FDFBF9]` |
| Superficie | `--color-surface` | `#FFFFFF` | `bg-white` |
| Tinta | `--color-ink` | `#1C1418` | `text-[#1C1418]` |
| Secundario | `--color-muted` | `#6B5F63` | `text-[#6B5F63]` |
| Borde | `--color-border` | `#E8E1DD` | `border-[#E8E1DD]` |
| Borde fuerte | `--color-border-strong` | `#D6CCC6` | `border-[#D6CCC6]` |
| Rosado | `--color-blush` | `#F7EAE7` | `bg-[#F7EAE7]` |
| Verde suave | `--color-sage` | `#E8F1EC` | `bg-[#E8F1EC]` |
| Éxito | `--color-success` | `#1E7A4C` | `text-[#1E7A4C]` |
| Advertencia texto | `--color-warning-dark` | `#8F5600` | `text-[#8F5600]` |
| Peligro | `--color-danger` | `#B3261E` | `text-[#B3261E]` |
| Alerta admin | `--color-alert` | `#8A3B4E` | `text-[#8A3B4E]` / `bg-[#8A3B4E]` |
| Borde de alerta | `--color-alert-border` | `#E4C9C0` | `border-[#E4C9C0]` |
| Advertencia suave | `--color-warning-soft` | `#FBF0DE` | `bg-[#FBF0DE]` |
| Fila en revisión | `--color-row-review` | `#FFFCF8` | `bg-[#FFFCF8]` |
| Fila crítica | `--color-row-critical` | `#FFF6F6` | `bg-[#FFF6F6]` |
| Borde fila crítica | `--color-row-critical-border` | `#E4C5C5` | `border-[#E4C5C5]` |
| Estado neutro suave | `--color-neutral-soft` | `#F1ECE9` | `bg-[#F1ECE9]` |
| Texto deshabilitado | `--color-text-disabled` | `#6B5F63` | `text-[#6B5F63]` (sin `opacity`) |
| Lote / vencimiento | `--color-accent-soft` + `--color-accent-dark` | `#F4EAE0` / `#7E5A34` | `bg-[#F4EAE0] text-[#7E5A34]` |
| Display | `--font-display` | Fraunces, Georgia, serif | `font-['Fraunces',Georgia,serif]` |
| Sans | `--font-sans` | Inter, system-ui, sans-serif | `font-['Inter',system-ui,sans-serif]` (body) |
| Radio md | `--radius-md` | 8 px | `rounded-lg` |
| Radio lg | `--radius-lg` | 16 px | `rounded-2xl` |
| Radio full | `--radius-full` | 999 px | `rounded-full` |
| Sombra sm | `--shadow-sm` | ver §5 | `shadow-sm` |
| Sombra md | `--shadow-md` | ver §5 | `shadow-md` |
| Sombra lg | `--shadow-lg` | ver §5 | `shadow-xl` |
| Foco | — | `2px solid #1E644C`, offset 2 | `focus-visible:ring-2 focus-visible:ring-[#1E644C] focus-visible:ring-offset-2` |
| Contenedor | `--container` | 1280 px útiles | `max-w-[1280px]` |

> En producción, Tailwind v4 recibe estos valores mediante `@theme` en `globals.css`. En las
> maquetas se usan *arbitrary values* para que cada archivo sea autocontenido y no requiera un
> `tailwind.config` (cero JavaScript de configuración).

---

## 11. Decisiones registradas

| Decisión | Razón |
|---|---|
| Verde profundo como primario, no burdeos | Es la identidad aprobada en el prototipo S0 y coincide con el logo real. |
| Rosado y crema como soporte, no como primario | Aportan la calidez que pide la categoría belleza sin diluir el reconocimiento de marca. |
| Dorado solo decorativo; `#7E5A34` para texto | `#B8895A` tiene 3,1:1 sobre blanco y falla AA en texto normal; sobre `#1C1418` el ratio correcto es **5,82:1** (antes se declaraba 6,4:1). |
| Tokens semánticos para el panel admin (C-10) | Todos los hex usados en las maquetas de operación están documentados en §2.5 con su par de texto verificado; nunca se degradan con opacidad. |
| Texto deshabilitado `#6B5F63` (C-10) | `#9A8F92` daba 3,13:1; el alias de `--color-muted` da 6,10:1 sobre blanco. |
| Lote y vencimiento visibles en la PDP (C-01) | Etiqueta discreta «Lote L-2409 · Vence 05/2027»: hace visible FEFO sin introducir lógica en la maqueta. |
| Pedido `AT-2026-000123` y cupón `ADRIANA10` (C-12) | Formato único en todas las maquetas y guías; evita tres convenciones distintas. |
| Fraunces + Inter | Editorial premium + legibilidad en formularios y tablas; ya validadas en el prototipo. |
| Un solo CTA primario por pantalla | Evita la ambigüedad detectada en la referencia (dos CTAs idénticos). |
| Sin librerías de animación | CSS-first, control de `prefers-reduced-motion` y presupuesto JS. |
| Imágenes 4:5 en producto | Consistencia de grid y menor CLS; ver `guia-imagenes-contenido.md`. |

---

## 12. Checklist antes de dar una pantalla por terminada

- [ ] Contraste verificado con las razones de esta tabla; ningún color fuera de §2 o §2.5.
- [ ] Texto deshabilitado con `--color-text-disabled` a opacidad completa (≥4,5:1).
- [ ] Un solo `h1`; jerarquía de encabezados correcta.
- [ ] `lang="es"`, `<title>` descriptivo y meta viewport.
- [ ] Focus visible en todos los controles; targets ≥ 44 px en móvil.
- [ ] Sin desbordamiento horizontal a 375 px ni a 320 px.
- [ ] Imágenes con `alt` y dimensiones reservadas (`aspect-*` / `width`/`height`).
- [ ] textos en español, precios en COP con IVA incluido.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Estado vacío, error y carga definidos (en maquetas, al menos representados).
- [ ] PDP con etiqueta de lote/vencimiento cuando aplique (C-01).
- [ ] `aria-live` previsto en la implementación, no exigido en la maqueta estática (n1).
