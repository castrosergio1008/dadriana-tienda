# Maquetas de diseño · Adriana

Esta carpeta contiene **maquetas visuales estáticas** para revisión de diseño. **No son código de producción**: no se deben copiar a la aplicación, ni conectar a una base de datos, ni publicar como sitio real.

## Cómo abrirlas

Abre cualquiera de los archivos `.html` directamente en un navegador (doble clic). No hace falta instalar nada ni levantar un servidor.

- Requiere conexión a internet para cargar Tailwind CDN, las fuentes de Google y las fotografías de Unsplash.
- Para revisar los tres breakpoints, usa el modo responsive del navegador en **375 px**, **768 px** y **1440 px**.
- Cada archivo lleva en la primera línea el aviso `APEX FORGE · MAQUETA DE DISEÑO · NO ES CÓDIGO DE PRODUCCIÓN`.

## Archivos

| Archivo | Qué representa |
|---|---|
| `index.html` | Inicio: propuesta de valor, categorías, productos destacados, campaña, reseñas, tiendas y boletín. Es la referencia de encabezado y pie compartidos. |
| `catalogo.html` | Catálogo con filtros laterales en escritorio y hoja inferior en móvil, chips y ordenamiento. |
| `producto.html` | Ficha de producto con galería, buy box, pestañas, reseñas y barra de compra fija en móvil. |
| `carrito.html` | Bolsa con cantidades, cupón `ADRIANA10`, envío gratis desde $ 150.000 y drawer lateral representado. |
| `checkout.html` | Pago en tres pasos: contacto, entrega a domicilio o recogida en tienda, y método de pago. |
| `pedido-confirmado.html` | Confirmación con número de pedido, resumen y siguientes pasos. |
| `cuenta.html` | Área del cliente: pedidos, favoritos, direcciones y datos personales. |
| `seguimiento-pedido.html` | Consulta sin iniciar sesión, timeline de cuatro estados y variante de recogida en tienda. |
| `admin-pedidos.html` | Panel de operación: métricas del día, filtros, revisión de pago, tabla de pedidos y tarjetas en móvil. |
| `admin-productos.html` | Panel de operación: catálogo, precios e inventario por sede con alertas de stock. |

## Decisiones de diseño visibles en las maquetas

- **Identidad:** verde profundo `#1E644C`, dorado `#B8895A`, crema `#FDFBF9`, rosado `#F7EAE7` y verde suave `#E8F1EC`; tipografías Fraunces (titulares) e Inter (cuerpo).
- **Idioma y moneda:** textos en español, precios en COP con IVA incluido y dos sedes físicas: Bogotá — Zona Rosa y Medellín — El Poblado.
- **Accesibilidad:** salto al contenido, semántica HTML, etiquetas en formularios, `alt` en imágenes, foco visible, contraste AA y `prefers-reduced-motion`. El texto deshabilitado usa `#6B5F63` (6,10:1 sobre blanco), sin opacidad que lo degrade.
- **Colores del panel:** los tonos de alerta, revisión y filas críticas están tokenizados en `sistema-diseno.md` §2.5; el dorado `#B8895A` sobre `#1C1418` es 5,82:1 (AA).
- **Interacción:** solo CSS. No hay JavaScript de aplicación; el único `<script>` es el CDN de Tailwind. Los menús desplegables usan `:hover`, `:focus-within` o `<details>`. Al no haber JS, `aria-live` no se exige en estas maquetas: es requisito de la implementación (n1).
- **Datos de producto y pago:** la ficha muestra lote y vencimiento como etiqueta informativa (FEFO); el checkout no tiene campos de tarjeta y explica el pago hospedado de Wompi con cookies seguras.
- **Imágenes:** fotografías de Unsplash con tamaño y `alt` explícitos; los colores de respaldo evitan saltos de layout si una imagen no carga.

## Datos de ejemplo

Productos, precios, pedidos (`AT-2026-000123`, `AT-2026-000122`, etc.), lotes (`L-2409`), cupón (`ADRIANA10`), sedes y métodos de pago son **ilustrativos** y coinciden con el prototipo exploratorio. No deben interpretarse como datos reales ni como contratos de API.

El encabezado, el pie y los metadatos son idénticos en todas las páginas. Si necesitas cambiarlos, hazlo primero en `index.html` —que es la referencia— y propaga el cambio a las demás maquetas; no edites cada archivo de forma independiente.
