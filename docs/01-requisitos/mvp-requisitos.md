# Requisitos del MVP redefinido — D'Adriana Tienda

| Campo | Valor |
|---|---|
| **Proyecto** | D'Adriana Tienda — tienda virtual de productos de belleza para la piel y el cabello (Colombia) |
| **Fase** | MVP redefinido por el cliente el 25 de noviembre de 2026 — diseño de requisitos, antes de código de producción |
| **Autor** | `forge-architect` (Staff Engineer, APEX FORGE) |
| **Estado** | **Aprobado para Fase 2 (Design Doc)** — revisión de `forge-sentinel` integrada (OK condicionado) · **LGTM de `forge-reviewer`** · **LGTM del Comandante `apex-forge`** (25 nov 2026) |
| **Revisión de seguridad** | `forge-sentinel`: **OK condicionado**; 26 requisitos `SEC-MVP-001..026` integrados en §7. Bloqueantes de release: `SEC-MVP-001`, `-002`, `-007`, `-008`, `-021` y `-024..-026`. |
| **Fecha** | 25 de noviembre de 2026 |
| **Documentos relacionados** | [DESIGN_DOC.md](../../DESIGN_DOC.md), [design-doc.md](../02-arquitectura/design-doc.md), [requisitos-funcionales.md](./requisitos-funcionales.md), [requisitos-no-funcionales.md](./requisitos-no-funcionales.md), [alcance-y-no-objetivos.md](../02-arquitectura/alcance-y-no-objetivos.md), [sistema-diseno.md](../03-disenos/sistema-diseno.md) |

> **Nota de precedencia:** este documento define **el MVP actual** y manda sobre el alcance de las entregas nuevas. El diseño aprobado el 24/11/2026 (`DESIGN_DOC.md` en la raíz y el árbol `docs/` completo: RF-001..RF-081, arquitectura, datos, scrum, seguridad, infra y review con LGTM) **sigue intacto y se reutiliza como referencia de Fase 2 / escalabilidad**. El prototipo en `prototipo/` y la identidad verde/dorada previa también se conservan como referencia histórica. **Ningún archivo anterior a este documento se ha eliminado, editado ni reemplazado**; este documento es un archivo nuevo y la única modificación del repositorio es su propia actualización con la revisión de `forge-sentinel`.

> **Regla de lectura:** en caso de conflicto entre este documento y los anteriores, gana este documento **solo para el MVP**; los anteriores siguen siendo la fuente de verdad para Fase 2. Toda reintroducción de alcance requiere un Design Doc nuevo y el LGTM del Comandante.

> **Convenciones:** prioridad **MoSCoW** — **M** = imprescindible (bloquea go-live), **S** = importante (no bloquea), **C** = deseable, **W** = fuera de este MVP (ver §4). Todo criterio de aceptación (CA) es observable y verificable en QA. La revisión de `forge-sentinel` (OK condicionado) ya está integrada: los **26 requisitos `SEC-MVP-001..026`** están desarrollados en §7, con marcadores de **bloqueante de release**, **no aplicable por decisión del Comandante** y **condicional a decisión de panel**. Los arbitrajes del Comandante mandan sobre el resto del documento: sin persistencia de la lista de pedido, sin panel interno asumido y sin superficies de pago/facturación/tracking.

---

## 1. Resumen ejecutivo y alcance

### 1.1 Qué es

Una **tienda virtual de vitrina y derivación comercial** para D'Adriana: productos de belleza para la piel y el cabello, con **imagen de marca nueva**, catálogo navegable con carruseles y tarjetas, categorías (piel, cabello, marcas), precios en COP, búsqueda y filtros, reseñas moderadas, inventario publicado, ubicación de las tiendas físicas y enlaces a Instagram/Facebook.

La aplicación **informa, organiza la intención de compra y la entrega al asesor por WhatsApp**. El cierre de la venta lo decide el cliente entre **pagar en la tienda física** o **acordar una transferencia por WhatsApp**. La **facturación electrónica la emite el asesor desde su punto de venta (sistema externo)**: la aplicación no emite facturas, no tiene pasarela de pago y no recibe datos de tarjeta.

### 1.2 Qué no es

No es un e-commerce transaccional completo: **no hay pago en línea, carrito de compra, cuenta de usuario para clientes, seguimiento de pedido, emisión de factura electrónica en la app ni logística propia**. La "lista de pedido" del §2.6 es un borrador temporal de comunicación con el asesor, **no un carrito** (no persiste, no checkout, no reserva stock, no cobra).

### 1.3 Límites de la entrega

| Dimensión | Alcance del MVP |
|---|---|
| Superficies | Web pública responsive: Home, PLP, PDP, resultados de búsqueda/filtros, lista de pedido, tiendas físicas, reseñas, páginas de contenido. |
| Canal de cierre | WhatsApp (`wa.me`) o pago presencial en tienda; sin pasarela ni API de pagos. |
| Datos | Catálogo, marcas, categorías, precios, disponibilidad publicada, reseñas aprobadas, tiendas físicas, enlaces sociales. |
| Despliegue | Vercel (preview + producción) con PostgreSQL/Neon propuesto, pendiente de confirmar titularidad y proveedor (Q-MVP-03). |
| Fuente de decisiones | Cliente = el "qué"; APEX FORGE = el "cómo". Decisiones abiertas en §6, no asumidas como cerradas. |

---

## 2. Requisitos funcionales (RF-MVP-001 a RF-MVP-047)

### 2.1 Imagen de marca y rediseño (RF-MVP-001 a RF-MVP-004)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-MVP-001 | Definir y aprobar una **identidad visual nueva** (logotipo, paleta, tipografía, tono de comunicación) que reemplace a la identidad verde/dorada del prototipo. | M | Existe una guía de marca firmada por el cliente y el Comandante; en staging, ningún componente usa los tokens de la identidad anterior; `prototipo/` y `docs/03-disenos/sistema-diseno.md` permanecen intactos como referencia histórica (verificación por diff). |
| RF-MVP-002 | Aplicar la nueva identidad a todas las superficies del MVP: Home, PLP, PDP, lista de pedido, tiendas, reseñas, formularios y estados vacíos. | M | Checklist de QA pantalla por pantalla con 0 componentes fuera de los tokens aprobados; capturas de las mismas rutas en 375 / 768 / 1440 px adjuntas a la UAT. |
| RF-MVP-003 | Publicar un **kit de componentes base** del rediseño (botones, tarjetas, badges, carrusel, inputs, estados de foco/error) documentado en el sistema de diseño nuevo. | S | Cada componente tiene estados normal/hover/foco/deshabilitado y su token asociado; el QA puede localizar el componente usado en cada vista. |
| RF-MVP-004 | Actualizar activos de marca para compartir: favicon, imagen Open Graph y vista previa al pegar una URL en WhatsApp. | S | Al compartir una URL del sitio en WhatsApp aparece el logotipo y el nombre nuevos; el favicon coincide con la nueva identidad. |

### 2.2 Catálogo, carruseles, tarjetas, más vendidos y más referenciados (RF-MVP-005 a RF-MVP-011)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-MVP-005 | Ficha de producto consultable con nombre, marca, descripción, imágenes, precio, categoría y disponibilidad publicada. | M | La PDP muestra todos esos campos; cada producto tiene URL propia y compartible; no aparece botón de pago, carrito ni cuenta. |
| RF-MVP-006 | Tarjetas de producto con imagen, nombre, marca, precio, badges y acción principal «Ver producto» / «Agregar a mi pedido». | M | La tarjeta renderiza todos los campos sin desbordamiento en móvil; la acción principal funciona por click y teclado; no hay CTA de compra online. |
| RF-MVP-007 | **Carruseles** en Home (p. ej. destacados y más vendidos) con CSS `scroll-snap`, sin autoplay y navegables con teclado. | M | Deslizar en móvil y usar flechas/teclado cambia de ítem; con `prefers-reduced-motion: reduce` no hay animación; el carrusel no añade librerías de animación. |
| RF-MVP-008 | Sección **«Más vendidos»** alimentada por una selección curada por el negocio, configurable sin tocar código. | M | Cambiar la selección en los datos cambia la sección tras publicar, sin deploy de código; el orden es el definido por el negocio y queda documentado. |
| RF-MVP-009 | Sección **«Más referenciados»**. Definición operativa **pendiente de confirmar** en Q-MVP-05; propuesta: productos más consultados/más compartidos. | S | Mientras Q-MVP-05 está abierta, la sección muestra una selección curada y lleva etiqueta negra de «selección de la tienda»; al confirmarse la señal, se calcula con esa señal y se documenta la regla. |
| RF-MVP-010 | Galería de imágenes optimizadas en PDP (AVIF/WebP, `srcset`, dimensiones declaradas y `alt` descriptivo). | M | No hay desplazamiento de layout (CLS 0) al cargar; cada imagen tiene `alt` revisado por contenido; la imagen principal se precarga. |
| RF-MVP-011 | Productos relacionados por categoría o marca en la PDP, navegables con teclado. | S | Se muestran al menos 4 relacionados cuando el catálogo lo permite; las tarjetas enlazan a su PDP y respetan el foco visible. |

### 2.3 Categorías: piel, cabello y marcas (RF-MVP-012 a RF-MVP-014)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-MVP-012 | Categorías **Piel** y **Cabello** con páginas propias y *slugs* únicos (`/piel`, `/cabello`). | M | Ambas rutas devuelven 200, muestran solo productos de la categoría y tienen canonical propio; se permite una subcategoría simple si el catálogo real lo requiere. |
| RF-MVP-013 | Índice de **Marcas** en `/marcas` con ficha enlazable por marca y filtro asociado. | M | El listado está alfabético; al abrir una marca se muestran solo sus productos; una marca sin productos publicados no genera enlace roto. |
| RF-MVP-014 | Navegación y *breadcrumbs* coherentes desde Home hasta producto (Home › Piel › Producto). | S | Todos los enlaces internos devuelven 200; el breadcrumb refleja la ruta real; la navegación es operable con teclado y lector de pantalla. |

### 2.4 Precios en COP (RF-MVP-015 a RF-MVP-016)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-MVP-015 | Precios expresados en **pesos colombianos (COP)** con formato local y sin decimales. | M | El precio se muestra como `$ 45.000`; no existe selector de moneda; la app no calcula impuestos, descuentos ni totales de cobro. |
| RF-MVP-016 | Un mismo precio por producto en tarjetas, carruseles, PDP, resultados y mensaje de WhatsApp. | M | Tras cambiar un precio en los datos, todas las superficies muestran el nuevo valor sin editar código; QA compara valor en 5 superficies con el mismo resultado. |

### 2.5 Búsqueda y filtros (RF-MVP-017 a RF-MVP-022)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-MVP-017 | Búsqueda de texto sobre nombre y marca, con sinónimos básicos en español (p. ej. `shampoo` ↔ `champú`). | M | Buscar `shampoo` devuelve productos llamados `champú`; los resultados se ordenan por relevancia; la búsqueda responde < 300 ms p95 con el catálogo previsto. |
| RF-MVP-018 | Filtro por **rango de precio** (mínimo y máximo). | M | Aplicar un rango actualiza resultados y contador; valores inválidos muestran error inline; combinable con los demás filtros. |
| RF-MVP-019 | Filtros por **categoría** y por **marca**, combinables entre sí y con precio y texto. | M | Se pueden seleccionar varias marcas/categorías; el contador de resultados es correcto; «Limpiar filtros» restaura el listado completo. |
| RF-MVP-020 | Filtros y búsqueda reflejados en la **URL** para ser compartibles e indexables. | M | Copiar la URL filtrada y abrirla en otro navegador reproduce exactamente el mismo estado; la canonical apunta a la variante filtrada. |
| RF-MVP-021 | Orden por relevancia, precio ascendente/descendente y nombre A-Z. | S | Cambiar el orden conserva los filtros activos y actualiza la URL; el orden por defecto es relevancia. |
| RF-MVP-022 | Estado vacío con alternativas: sugerencia de revisar filtros y al menos 3 productos populares clicables. | S | Nunca se muestra un listado vacío sin alternativas; los enlaces del estado vacío llevan a PLP o PDP válidas. |

### 2.6 Listado de pedido y envío por WhatsApp (RF-MVP-023 a RF-MVP-028)

> **Límite crítico:** esta lista **no es un carrito**. No persiste entre sesiones, no tiene checkout, no reserva inventario, no calcula impuestos ni cobra. Su única función es **componer un mensaje para el asesor**. El cierre de venta lo decide el cliente: **pago en la tienda física o transferencia acordada por WhatsApp**. La factura electrónica la emite el **asesor desde su POS externo**, nunca esta aplicación.

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-MVP-023 | **Lista de pedido temporal** visible desde cualquier PDP/PLP: productos seleccionados con cantidad y precio unitario de referencia. | M | Agregar un producto muestra la lista y un contador; la lista se pierde al cerrar la pestaña (sin persistencia ni cuenta); no hay botón «Pagar». |
| RF-MVP-024 | Editar cantidades y eliminar ítems de la lista antes de enviarla. | M | Cambiar cantidad actualiza el listado; eliminar un ítem lo retira; la lista nunca muestra un producto agotado sin aviso (RF-MVP-038). |
| RF-MVP-025 | Selección explícita de la **modalidad de cierre**: «Pago en tienda física» o «Transferencia acordada por WhatsApp». | M | El formulario obliga a elegir una de las dos opciones antes de habilitar el envío; no existe tercera opción de pago en línea; la elección queda reflejada en el mensaje. |
| RF-MVP-026 | Envío del listado al asesor mediante enlace **`wa.me`** con mensaje prellenado (productos, cantidades, modalidad elegida y, si aplica, tienda física). El número es oficial y no manipulable; el texto es neutral y sin PII del cliente (`SEC-MVP-010`, `SEC-MVP-011`). | M | Al pulsar «Enviar por WhatsApp» se abre WhatsApp con el número y el texto correctos; el mensaje contiene todos los ítems y la modalidad; cambiar query/hash/referrer no cambia el destino; el texto generado no contiene nombre, teléfono, correo, dirección, cédula ni datos de pago (`SEC-MVP-010/011`). El mecanismo definitivo (enlace vs. API Business) está sujeto a Q-MVP-06. |
| RF-MVP-027 | El mensaje y la interfaz **no solicitan datos de tarjeta, no incluyen link de pago y no prometen factura ni despacho**; se indica que la facturación electrónica la gestiona el asesor en el punto de venta. | M | Revisión de UI y del texto generado: 0 campos de tarjeta, 0 URLs de pasarela, 0 menciones de factura emitida por la web; aparece la nota de facturación por el asesor. |
| RF-MVP-028 | Confirmación en pantalla después de abrir WhatsApp con instrucciones simples («Tu asesor te responderá por WhatsApp») y sin número de pedido generado por la app. | S | Tras el envío se muestra la confirmación; no se crea registro de pedido, estado de seguimiento ni correo automático. |

### 2.7 Tiendas físicas (RF-MVP-029 a RF-MVP-031)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-MVP-029 | Página **«Tiendas»** con el listado de puntos físicos: nombre, dirección, horario, teléfono y enlace a mapa. | M | La página muestra todas las tiendas activas con datos reales (Q-MVP-08); cada tarjeta tiene dirección, horario y enlace de mapas funcional. |
| RF-MVP-030 | Cada tienda ofrece acceso directo a WhatsApp y, si aplica, a la modalidad «Pago en tienda física». El destino sale de configuración (`57` + 10 dígitos) y nunca de datos del usuario (`SEC-MVP-010`). | S | El enlace `wa.me` de cada tienda abre una conversación con el número correcto; el mensaje identifica la tienda elegida; el enlace usa HTTPS y `rel="noopener noreferrer"`; un parámetro inyectado no cambia el número. |
| RF-MVP-031 | Los datos de las tiendas se administran como contenido, sin código, con estado activo/inactivo. | S | Dar de alta una tienda o cambiar su horario no requiere deploy; una tienda inactiva deja de mostrarse; QA valida el cambio en staging. |

### 2.8 Reseñas y calificación con moderación (RF-MVP-032 a RF-MVP-036)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-MVP-032 | **Formulario público de reseñas** por producto con datos mínimos: alias, calificación 1–5, texto plano ≤ 500 caracteres, fecha y producto/SKU; correo **opcional** solo para baja/rectificación; aviso «solo mayores de 18 años», sin campo de edad, sin datos sensibles ni de terceros y consentimiento informado y versionado (`SEC-MVP-001..004`). | M | El inventario de campos contiene solo los autorizados y ningún campo de edad/documento/teléfono/dirección/salud/foto; el texto se valida y normaliza a plano en servidor; el aviso de mayoría de edad y el consentimiento sin marcar aparecen antes del envío; el envío confirma «pendiente de revisión», sin publicación inmediata. |
| RF-MVP-033 | **Moderación previa del equipo**: ninguna reseña se publica sin aprobación manual; toda reseña nace `pending` y permanece invisible en PDP, API pública, `sitemap` y caché SSR; Preview con `noindex` (`SEC-MVP-007`). | M | Una petición anónima a la API y al HTML SSR no devuelve reseñas pendientes; una reseña rechazada no aparece y conserva motivo interno; Preview responde con cabecera `noindex`; al aprobarla aparece. El dueño de la moderación se define en Q-MVP-02 y la herramienta en Q-MVP-01/Q-MVP-02. |
| RF-MVP-034 | Calificación visible solo de reseñas aprobadas: promedio y número de reseñas publicadas en tarjeta y PDP. | M | El promedio se calcula solo sobre reseñas aprobadas; cambiar el estado de una reseña cambia el promedio; una reseña rechazada nunca influye en la calificación. |
| RF-MVP-035 | Listado de reseñas aprobadas en la PDP con fecha y calificación, sin exponer datos personales del autor. **El correo, aun cuando se capture para baja/rectificación, nunca se muestra públicamente**. | S | Se muestran solo alias autorizado, calificación, texto plano y fecha; no aparece correo, teléfono, documento ni IP; el listado es paginado o limitado según diseño; la respuesta pública no incluye esos campos aunque existan en almacenamiento. |
| RF-MVP-036 | Privacidad del formulario: consentimiento **informado, granular y versionado**, responsable D'Adriana, finalidad exclusiva de publicación, derechos y enlace a la política; se persisten `consent_version`, `policy_version` y timestamp; aviso accesible antes del envío (`SEC-MVP-002`, `SEC-MVP-008`). | M | La casilla nace sin marcar y el envío directo sin consentimiento es rechazado en servidor; el moderador puede consultar versión de consentimiento/política y fecha; cada reseña publicada ofrece enlace de baja y rectificación verificado por correo opcional o token de un solo uso, sin documento de identidad (§7, `SEC-MVP-001..009`). |

### 2.9 Inventario actualizado (RF-MVP-037 a RF-MVP-041)

> **Decisión abierta, no inventada:** el mecanismo de actualización del inventario quedó pendiente por el cliente («podemos definirlo después»). Estos RF fijan **qué debe verse**, no **cómo se alimenta**. La fuente de verdad, la frecuencia y los permisos se decidirán en Q-MVP-01 y se documentarán en un ADR antes del go-live. No se asume panel admin, hoja de cálculo, FEFO, lotes ni reservas.

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-MVP-037 | **Disponibilidad publicada** por producto (disponible / agotado) en tarjeta, PDP y lista de pedido. | M | El estado mostrado coincide con la fuente de inventario que se defina en Q-MVP-01; QA comprueba 3 productos disponibles y 1 agotado en las 3 superficies. |
| RF-MVP-038 | Un producto agotado se identifica visualmente y no se puede agregar a la lista de pedido. | M | El CTA se deshabilita o muestra «Agotado»; el intento de agregarlo por URL/API no incorpora el ítem; el aviso es legible con lector de pantalla. |
| RF-MVP-039 | Actualización de la disponibilidad **sin despliegue de código**, desde la fuente acordada en Q-MVP-01. | M | Tras un cambio en esa fuente, el sitio refleja el nuevo estado en el tiempo que se acuerde en Q-MVP-01; la prueba de QA queda registrada con fecha y producto. |
| RF-MVP-040 | Coherencia de disponibilidad entre Home, PLP, búsqueda, PDP y mensaje de WhatsApp. | S | Un producto agotado no aparece como disponible en ninguna superficie; el mensaje al asesor no incluye ítems agotados. |
| RF-MVP-041 | La disponibilidad es **informativa**: no hay reserva de stock, promesa de entrega ni estado de pedido en la app. | M | Revisión de contratos y UI: no existe endpoint de reserva, no se muestra ETA ni seguimiento; el mensaje de WhatsApp remite la confirmación al asesor. |

### 2.10 Contenido, redes sociales y despliegue (RF-MVP-042 a RF-MVP-047)

| ID | Requerimiento | Pri. | Criterios de aceptación (resumen) |
|---|---|---|---|
| RF-MVP-042 | Enlaces visibles a **Instagram y Facebook** en header/footer y en la página de contacto. | M | Ambos enlaces abren los perfiles oficiales en pestaña nueva con `rel="noopener noreferrer"`; las URLs son configurables sin código. |
| RF-MVP-043 | Despliegue en **Vercel** con entornos preview y producción, build de Next.js 15 en verde. | M | Cada PR genera un preview visitante; la rama principal publica a producción; el pipeline falla si tests o lint fallan. |
| RF-MVP-044 | Motor de base de datos **PostgreSQL**, con **Neon como propuesta**, pendiente de confirmar titularidad de cuentas y proveedor definitivo (Q-MVP-03). | M | La app persiste catálogo, reseñas moderadas y tiendas en PostgreSQL; la conexión usa variables de entorno; la decisión de proveedor queda registrada antes de crear el entorno productivo. |
| RF-MVP-045 | Configuración por **variables de entorno** sin secretos en el repositorio; `.env*` en `.gitignore`, solo `.env.example` con marcadores, secretos en Variables de Entorno de Vercel, `NEXT_PUBLIC_` limitado a datos públicos como el número de WhatsApp; entornos Development/Preview/Production separados, Preview protegido y `noindex`, sin credenciales de producción ni PII real (`SEC-MVP-021`, `SEC-MVP-022`). | M | Repo y bundle sin tokens; `gitleaks`/scan en CI limpio; matriz de entornos revisada con cabeceras `noindex` en Preview; las únicas variables públicas son las autorizadas; cabeceras de seguridad aplicadas (`SEC-MVP-023`, ver §7). |
| RF-MVP-046 | Páginas mínimas de contenido: política de privacidad, términos y medio de contacto/WhatsApp. La política incluye responsable D'Adriana, finalidades, derechos de baja/rectificación con plazos de **≤ 10 días hábiles para consultas y ≤ 15 días hábiles para reclamos** (arts. 14 y 15 de la Ley 1581) y la **tabla de retención** (reseña publicada + hasta 12 meses tras baja; consentimiento solo mientras sea necesario; metadatos antiabuso 30 días; auditoría 180 días si hay panel). | M | Los enlaces del footer devuelven 200; los textos son revisados por `forge-sentinel` antes de publicar; el formulario de reseñas enlaza a la política; la política muestra los plazos 10/15 días hábiles y la tabla de retención verificable (`SEC-MVP-008`, `SEC-MVP-009`). |
| RF-MVP-047 | Publicación con **rollback rápido y verificación post-deploy** (Vercel + monitor básico). | S | Ante una incidencia se puede revertir a un deployment anterior en minutos; el checklist post-deploy verifica Home, PLP, PDP, WhatsApp y reseñas en producción. |

---

## 3. Requisitos no funcionales (RNF-MVP-001 a RNF-MVP-019)

Cada requisito indica **objetivo medible**, **método de verificación** y **momento**. Los umbrales se proponen como línea base del MVP y son enmendables solo con acuerdo del Comandante y `forge-qualis`.

> **Nota sobre seguridad:** los IDs `SEC-MVP` ya fueron aportados por `forge-sentinel` (**OK condicionado**) y están integrados en esta tabla y desarrollados en §7. Los requisitos marcados como bloqueantes de release (`SEC-MVP-001`, `-002`, `-007`, `-008`, `-021` y `-024..-026`) deben estar verificados antes de publicar. `SEC-MVP-013/-014` son **no aplicables** por arbitraje del Comandante (sin persistencia de la lista), y `SEC-MVP-016..020` son **condicionales** a que se decida crear un panel mínimo.

| ID | Requisito | Objetivo medible | Verificación | Momento | ID `forge-sentinel` |
|---|---|---|---|---|---|
| RNF-MVP-001 | **LCP** (p75, móvil 4G) | < 2,5 s en Home, PLP y PDP | Vercel Speed Insights + Lighthouse CI | Continuo / por release | — |
| RNF-MVP-002 | **INP** (p75) | < 200 ms en carruseles, filtros y formularios | RUM (`web-vitals`) + CrUX | Continuo | — |
| RNF-MVP-003 | **CLS** (p75) | < 0,1; imágenes y fuentes con dimensiones reservadas | RUM + Lighthouse CI | Continuo | — |
| RNF-MVP-004 | **TTFB** (p75, HTML) | < 800 ms con caché/CDN de Vercel | RUM + medición desde LATAM | Continuo | — |
| RNF-MVP-005 | Presupuesto de JS por plantilla (gzip) | Home ≤ 150 KB · PLP ≤ 160 KB · PDP ≤ 170 KB · lista de pedido ≤ 140 KB | Bundle analyzer en CI; falla el build si se excede | Cada PR | — |
| RNF-MVP-006 | **WCAG 2.2 AA** en flujos públicos (Home, PLP, PDP, búsqueda, lista de pedido, reseñas, tiendas) | 0 violaciones críticas/serias en axe; auditoría manual con teclado y lector de pantalla | `axe-core` en Playwright + checklist manual | Cada release | — |
| RNF-MVP-007 | Navegación por teclado y foco visible en menú, carrusel, filtros, formularios y enlaces `wa.me` | 100% de controles interactivos alcanzables con Tab; sin trampas de foco | Test E2E con teclado | Cada release | — |
| RNF-MVP-008 | `prefers-reduced-motion: reduce` con animaciones **CSS-first** | Todas las transiciones se desactivan sin romper scroll ni navegación; 0 librerías de animación | Emulación de media query + revisión de dependencias | Cada release | — |
| RNF-MVP-009 | Contraste de la **nueva identidad** | ≥ 4,5:1 en texto normal y ≥ 3:1 en texto grande/UI, incluidos badges y estados agotado/pendiente | Cálculo automático de tokens + axe | Diseño y release | — |
| RNF-MVP-010 | **SEO y URLs compartibles** | Título/descripción únicos, canonical, `sitemap.xml`, `robots.txt`, Open Graph y URLs de filtros reproducibles | Lighthouse SEO + revisión de metadata | Cada release | — |
| RNF-MVP-011 | Privacidad de las reseñas: minimización de datos, consentimiento versionado, baja/rectificación y publicación solo tras moderación | 0 correos/teléfonos/documentos/IP expuestos en PDP o API pública; 0 reseñas pendientes visibles; `consent_version`/`policy_version` y timestamp consultables | Test de API + revisión `forge-sentinel` | Pre-go-live (**bloqueante**) | `SEC-MVP-001..009` |
| RNF-MVP-012 | Seguridad de formularios públicos (reseñas y lista de pedido) contra inyección, spam y abuso | `<script>` renderizado inerte; 0 HTML ejecutable; cuarto envío por hora/IP → 429 genérico; 0 uploads; analítica sin PII | Pruebas negativas + revisión `forge-sentinel` | Pre-go-live | `SEC-MVP-005`, `SEC-MVP-006`, `SEC-MVP-007` |
| RNF-MVP-013 | Secretos y configuración en Vercel/Neon; entornos separados y Preview protegido | 0 secretos en repositorio ni bundle; rotación definida; `.env.example` con `<VALUE>`; Preview con datos ficticios y `noindex`; credenciales de producción NUNCA en Preview | gitleaks + revisión de matriz de entornos + `forge-sentinel` | Cada PR y pre-go-live (**bloqueante**) | `SEC-MVP-021`, `SEC-MVP-022` |
| RNF-MVP-014 | Cabeceras y transporte (CSP, HSTS, `nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, HTTPS) | `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'none'` + orígenes explícitos; sin cámara/mic/geolocalización; sin `X-Powered-By`; `curl -I` en producción, report-only antes de enforce | `curl -I` + tests de respuesta + `forge-sentinel` | Cada release | `SEC-MVP-023` |
| RNF-MVP-015 | Compatibilidad Vercel + Next.js 15 + PostgreSQL/Neon | Build y preview verdes; conexión con pool configurado; sin dependencias de filesystem local efímero | CI + prueba en preview | Cada PR y pre-go-live | — |
| RNF-MVP-016 | **Observabilidad mínima** | `requestId` en todo request; logs estructurados; métricas de Speed Insights y errores 5xx en panel; alerta simple al correo/Slack definido para errores y fallos de generación/apertura del enlace `wa.me` | Revisión de logs y simulacro de error | Continuo / pre-go-live | — |
| RNF-MVP-017 | Disponibilidad y recuperación básica | 99,5% mensual objetivo; monitor externo cada 5 min; rollback de Vercel probado; backup de la BD verificado | Uptime check + ensayo de rollback/restore | Continuo / pre-go-live | — |
| RNF-MVP-018 | Localización propuesta | Interfaz en español (`es-CO`) y precios COP; **propuesta pendiente de confirmar** en Q-MVP-09 | Revisión de i18n y formato de precios | Cada release | — |
| RNF-MVP-019 | Calidad y pruebas | TypeScript `strict` sin `any` salvo frontera justificada; ESLint/Prettier sin excepciones; tests unitarios + integración + E2E de los flujos M; cobertura ≥ 70% sin decremento | CI con coverage gate + Playwright | Cada PR y release | — |

---

## 4. No-objetivos del MVP

> Un no-objetivo no es una promesa diferida disfrazada: es una decisión de **no gastar esfuerzo hoy**. Nada de lo listado se elimina de la documentación; simplemente **no se construye en este MVP**.

| # | No se hará en este MVP | Motivo | Cuándo se reevaluará |
|---|---|---|---|
| N-MVP-01 | **Pagos en línea / pasarela (Wompi, ePayco u otra) / BNPL** | El cliente cerró que la venta se paga en la tienda física o por transferencia acordada por WhatsApp; sin campos, esquemas ni SDK de pago (`SEC-MVP-024`, bloqueante). | Fase 2, si el cliente cambia la decisión; el diseño RF-026..RF-033 sigue intacto. |
| N-MVP-02 | **Datos de tarjeta en la aplicación** (PAN, CVV, formulario de tarjeta) | Riesgo PCI y falta de necesidad: ningún flujo de pago ocurre en la web. | Solo si se reintroduce pago en línea, con pasarela hospedada y revisión `forge-sentinel`. |
| N-MVP-03 | **Facturación electrónica en la aplicación (DIAN o proveedor tecnológico)** | **La factura electrónica la genera el ASESOR desde el punto de venta (sistema externo), no la aplicación.** Incluir emisión duplicaría el proceso y crearía riesgo tributario; sin DIAN, NIT/cédula fiscal, PDF tributario ni botón de descarga (`SEC-MVP-025`, bloqueante). | Nunca dentro de este MVP; en Fase 2 solo si el cliente revoca explícitamente la responsabilidad del POS. |
| N-MVP-04 | **Carrito de compra** (persistente, checkout, cupones, envío gratis) | Decisión explícita del cliente. La lista de pedido es solo un borrador de comunicación al asesor. | Fase 2; RF-015..RF-019 y RF-020..RF-025 se conservan como referencia. |
| N-MVP-05 | **Cuenta de usuario para clientes** (registro, login, OAuth, direcciones, wishlist) | Decisión explícita del cliente: el contacto ocurre por WhatsApp. | Fase 2; RF-042..RF-046 intactos. |
| N-MVP-06 | **Seguimiento de pedido / estados de pedido / historial en la app** | Decisión explícita del cliente; el asesor confirma la venta por WhatsApp. Sin endpoint público por correo/teléfono/documento, sin ID secuencial ni estado en el mensaje (`SEC-MVP-026`, bloqueante). | Fase 2; RF-034..RF-041 y la máquina de estados siguen documentados. |
| N-MVP-07 | **Logística propia: envío a domicilio, guías y transportadoras** | No fue solicitado; el cierre ocurre en tienda física o por transferencia acordada. | Fase 2, con diseño de fulfillment. |
| N-MVP-08 | **Lotes, FEFO, vencimientos y reservas de inventario** | El mecanismo de actualización quedó abierto (Q-MVP-01); decidirlo ahora sería inventar una respuesta. | Tras Q-MVP-01; el modelo RF-078..RF-081 se reutiliza si aplica. |
| N-MVP-09 | **Panel interno propio (admin) con login/contraseñas, roles y auditoría** | El MVP solo necesita moderar reseñas y mantener contenido; **no se asume panel**: por defecto se usa consola Vercel/BD con SSO + MFA y privilegios mínimos (`SEC-MVP-015`, aplicable por defecto). Si se decide crear un panel mínimo, aplican `SEC-MVP-016..020` como requisitos condicionales; la herramienta concreta sigue abierta en Q-MVP-01/Q-MVP-02. | Decisión pendiente (Q-MVP-01/Q-MVP-02); si se autoriza, Fase 2 con RF-062..RF-068 y SEC-001..SEC-005 intactos. |
| N-MVP-10 | **WhatsApp Cloud API, plantillas aprobadas por Meta y notificaciones por correo** | Se usa enlace `wa.me` para derivar al asesor; la API se evalúa en Q-MVP-06. | Fase 2; RF-069..RF-073 intactos. |
| N-MVP-11 | **Reseñas con foto, votos útiles, preguntas y verificación de compra** | Moderación de imágenes y verificación requieren cuenta/pedidos, excluidos del MVP. | Fase 2; ver N-13 del diseño anterior. |
| N-MVP-12 | **Cupones, descuentos, promociones y carrito abandonado** | No hay checkout ni cuenta sobre la cual aplicarlos. | Fase 2. |
| N-MVP-13 | **Integración contable/ERP o POS web propio** | El asesor ya opera desde su punto de venta externo; integrarlo está fuera del alcance. | Fase 2, vía adaptador, previa decisión del cliente. |
| N-MVP-14 | **Multi-moneda y multi-idioma** | Mercado único propuesto: COP y español Colombia (Q-MVP-09). | Expansión regional. |
| N-MVP-15 | **App nativa iOS/Android, PWA instalable y modo offline** | La web responsive cubre el caso con un solo codebase. | Fase 3. |
| N-MVP-16 | **Marketplace multi-vendedor** | El negocio es marca/retail propio. | Solo con nueva unidad de negocio y Design Doc nuevo. |
| N-MVP-17 | **Búsqueda semántica, ML, personalización y A/B testing** | Sin volumen ni señales propias aún; búsqueda literal con sinónimos es suficiente. | Fase 3, con datos medidos. |
| N-MVP-18 | **Analítica avanzada y dashboard de negocio** | Se entrega observabilidad técnica mínima (RNF-MVP-016); el reporte comercial se define después. | Fase 2, junto con KPIs del negocio. |

---

## 5. Trazabilidad con el diseño anterior

> **Nada se borró.** Las columnas «se descarta por decisión del cliente» y «se difiere a Fase 2» significan **solo** que esa capacidad no se construye en este MVP; los archivos y sus IDs permanecen disponibles para escalabilidad.

| RF anterior / dominio | Destino en este MVP (se conserva / se difiere a Fase 2 / se descarta por decisión del cliente) | Observación |
|---|---|---|
| RF-001..RF-008 — Catálogo, marcas, variantes, imágenes, badges y relacionados | **Se conserva** (adaptado y simplificado) | RF-MVP-005..RF-MVP-011; las variantes completas y el registro INVIMA quedan para Fase 2. |
| RF-009..RF-014 — Búsqueda y filtros | **Se conserva** (adaptado) | RF-MVP-017..RF-MVP-022; se mantiene URL compartible; autocompletado y facetas avanzadas se difieren a Fase 2. |
| RF-015..RF-019 — Carrito | **Se descarta por decisión del cliente** | La lista de pedido (RF-MVP-023..RF-MVP-028) no es carrito: no persiste, no cobra, no reserva. RF-015..RF-019 intactos para Fase 2. |
| RF-020..RF-025 — Checkout y confirmación | **Se difiere a Fase 2** | Solo se conserva la intención de compra como mensaje de WhatsApp; no hay checkout ni número de pedido generado por la app. |
| RF-026..RF-033 — Pagos Wompi/ePayco/COD/webhooks | **Se descarta por decisión del cliente** | Ningún pago en línea en el MVP; documentación intacta como referencia de Fase 2. |
| RF-034..RF-041 — Pedidos, logística, tracking y retracto | **Se difiere a Fase 2**; tracking **se descarta por decisión del cliente** | No hay máquina de estados ni seguimiento en el MVP; la lista de pedido no crea un pedido en la app. |
| RF-042..RF-047 — Cuenta de cliente y consentimientos | **Se descarta por decisión del cliente** | Sin registro/login; el consentimiento mínimo del formulario de reseñas se cubre en RF-MVP-036. |
| RF-048..RF-061 — `sites`, inventario multi-sede, transferencias y ajustes | **Se difiere a Fase 2**; se conserva la parte informativa | RF-MVP-029..RF-MVP-031 (tiendas físicas) y RF-MVP-037..RF-MVP-041 (disponibilidad publicada); modelo `inventory_lots`/FEFO intacto y pendiente de Q-MVP-01. |
| RF-062..RF-068 — Administración, RBAC y auditoría | **Se difiere a Fase 2**; se conserva solo la moderación mínima | RF-MVP-033; **sin panel asumido**: por defecto, moderación y contenido desde consola Vercel/BD con SSO + MFA (`SEC-MVP-015`); panel mínimo solo si se autoriza (`SEC-MVP-016..020` condicionales, Q-MVP-01/Q-MVP-02). |
| RF-069..RF-073 — Notificaciones | **Se difiere a Fase 2**; se conserva el envío manual | RF-MVP-026 con `wa.me`; sin Cloud API ni correos transaccionales. |
| RF-074..RF-077 — IVA, factura DIAN y privacidad | **Se descarta por decisión del cliente** (facturación en la app); **se conserva** privacidad adaptada | Factura = responsabilidad del asesor en su POS; precios COP en RF-MVP-015..RF-MVP-016; privacidad en RF-MVP-036, RF-MVP-046 y RNF-MVP-011. |
| RF-078..RF-081 — Lotes, vencimientos y FEFO | **Se difiere a Fase 2** | No se decide nada ahora: Q-MVP-01 queda abierta; los RF originales siguen vigentes como referencia. |
| RNF-001..RNF-032 — Requisitos no funcionales | **Se conserva** (adaptado) | RNF-MVP-001..RNF-MVP-019: CWV, WCAG 2.2 AA, `prefers-reduced-motion`, SEO, seguridad, Vercel y observabilidad mínima. Los umbrales de pagos/DIAN no aplican al MVP. |
| SEC-001..SEC-031 — Requisitos de seguridad | **Se conserva** como base de Fase 2; **se integran 26 IDs `SEC-MVP-001..026`** en este MVP (§7) | `forge-sentinel` entregó **OK condicionado**; bloqueantes `-001/-002/-007/-008/-021/-024..-026`, `-013/-014` no aplicables por arbitraje y `-016..-020` condicionales a panel. Ningún archivo de `docs/06-seguridad/` se modifica. |
| `DESIGN_DOC.md` v1.0 + `docs/` completo + `prototipo/` (identidad verde/dorada, 108/108 pruebas) | **Se conserva** íntegramente | Referencia histórica y Fase 2/escalabilidad. Este MVP agrega un archivo nuevo; no edita ni elimina ninguno. |

---

## 6. Preguntas abiertas (Q-MVP-01 a Q-MVP-09)

| ID | Pregunta abierta | Estado / propuesta | Dueño | Momento de resolución | Bloquea |
|---|---|---|---|---|---|
| Q-MVP-01 | ¿Cuál será el mecanismo de actualización del inventario y quién lo opera? ¿Se crea o no un panel mínimo? | **Abierta por decisión del cliente** («podemos definirlo después»). No se asume panel, hoja, archivo, FEFO ni reserva. Debe definir fuente de verdad, frecuencia, permisos y responsable. Por defecto aplica `SEC-MVP-015` (consola Vercel/BD con SSO + MFA, sin superficie propia de auth); si se decide panel, aplican `SEC-MVP-016..020`. | Cliente + `forge-architect` + `forge-backend` + `forge-sentinel` | Sprint 0 / refinement del Sprint 1; antes del go-live | RF-MVP-037..RF-MVP-040, SEC-MVP-015..020 y go-live |
| Q-MVP-02 | ¿Quién modera las reseñas, con qué criterios y con qué herramienta (consola Vercel/BD o panel mínimo)? | Abierta. Propuesta: una persona del equipo de tienda/marketing con revisión de privacidad por `forge-sentinel`. Sin panel asumido: `SEC-MVP-015` por defecto; `SEC-MVP-016..020` solo si se autoriza panel. Debe incluir baja/rectificación en ≤10/≤15 días hábiles (`SEC-MVP-008`). | Cliente (operación) + `forge-sentinel` + `forge-architect` | Sprint 0, antes de habilitar el formulario público | RF-MVP-032..RF-MVP-036, SEC-MVP-007..009 y SEC-MVP-015..020 |
| Q-MVP-03 | ¿Qué proveedor y quién es el titular de la cuenta de base de datos? | Propuesta: **Neon/PostgreSQL**, coherente con el stack y el diseño anterior. Pendiente de confirmar titularidad de la cuenta, región y proveedor definitivo. | Cliente + `forge-infra` | Antes de crear el entorno productivo | RF-MVP-044, RNF-MVP-013/015 |
| Q-MVP-04 | ¿Cuál será el dominio definitivo? | Abierta. Mientras tanto se publica en el dominio de Vercel. | Cliente + `forge-infra` | Antes de la publicación final y de compartir enlaces en redes | RF-MVP-043, RNF-MVP-010 |
| Q-MVP-05 | ¿Qué significa operativamente «más referenciados»? | **Propuesta:** productos más **consultados/compartidos** (combinación de visitas a PDP y veces que se envía el producto por WhatsApp); **a confirmar**. Hasta entonces, selección curada. | Cliente + `forge-frontend` | Sprint 1 (refinement) | RF-MVP-009 (S) |
| Q-MVP-06 | ¿Qué número de WhatsApp se usa y será enlace `wa.me` o API de WhatsApp Business? | Propuesta inicial: enlace `wa.me` con número oficial por tienda; evaluar API Business solo si se requieren plantillas/métricas. | Cliente + `forge-backend` + `forge-sentinel` | Sprint 1, antes de implementar el envío | RF-MVP-026, RF-MVP-030 |
| Q-MVP-07 | ¿El rediseño de imagen es solo digital o también material de tienda (rótulos, bolsas, facturas del POS)? | Abierta. Este MVP cubre **solo lo digital** salvo confirmación en contrario. | Cliente + `forge-frontend` (diseño) | Sprint 0, antes de aprobar la guía de marca | RF-MVP-001..RF-MVP-004 |
| Q-MVP-08 | ¿Cuáles son los datos reales de las tiendas físicas y el catálogo real de productos y marcas? | Abierta. El prototipo usa nombres ilustrativos; se necesitan direcciones, horarios, teléfonos, fotos, productos, marcas y precios autorizados. | Cliente (operación y contenido) + `forge-frontend` | Sprint 1, antes de cargar datos en staging | RF-MVP-005..RF-MVP-016, RF-MVP-029..RF-MVP-031 |
| Q-MVP-09 | ¿Moneda e idioma definitivos? | **Propuesta:** COP y español de Colombia (`es-CO`), sin selector. | Cliente + `forge-architect` | Sprint 0 | RF-MVP-015, RNF-MVP-018 |

---

## 7. Requisitos de seguridad y privacidad (SEC-MVP-001 a SEC-MVP-026)

> **Origen:** revisión de `forge-sentinel` con resultado **OK condicionado**, enmarcada en Ley 1581/2012, Decreto 1074/2015 y OWASP. **Arbitrajes del Comandante aplican:** (1) sin persistencia de la lista de pedido → `SEC-MVP-013/-014` no aplicables; (2) no se asume panel interno → `SEC-MVP-015` por defecto y `SEC-MVP-016..020` condicionales; (3) sin pago, facturación ni tracking en la app → `SEC-MVP-024..026` bloqueantes. Todo `SEC-MVP` marcado como **BLOQUEANTE** debe estar verificado antes del release.

### 7.1 Catálogo de requisitos

| ID | Requisito | Criterio de aceptación | Momento |
|---|---|---|---|
| SEC-MVP-001 | **Datos mínimos en reseñas:** solo alias, calificación 1–5, texto ≤ 500 caracteres, fecha y producto/SKU. Correo **opcional** solo para baja/rectificación y **nunca público**. Prohibido teléfono, dirección, cédula, fecha de nacimiento ni IP en claro. | El esquema y la respuesta pública no contienen campos prohibidos; el correo opcional no aparece en PDP ni API pública. | **BLOQUEANTE** · Diseño + Construcción |
| SEC-MVP-002 | **Consentimiento informado, granular y versionado:** casilla sin marcar, responsable D'Adriana, finalidad exclusiva de publicación, derechos y enlace a la política. Rechazo en servidor si falta. Persiste `consent_version`, `policy_version` y timestamp. | Envío directo sin consentimiento → rechazo en servidor; evidencia consultable por el moderador con versión y fecha. | **BLOQUEANTE** · Diseño + Construcción |
| SEC-MVP-003 | **Menores:** no pedir edad ni fecha de nacimiento; el formulario declara «solo mayores de 18 años». Si se detecta un menor en moderación, descartar y borrar sus datos. | No existe campo de edad ni de fecha de nacimiento; el procedimiento de descarte y borrado está documentado y se ejecuta en la prueba. | Diseño + Construcción |
| SEC-MVP-004 | **Sin datos sensibles ni de terceros:** sin campos de tipo de piel/cabello, alergias, salud, etnia, religión, orientación, biometría ni fotos de personas. Aviso visible; la moderación edita o rechaza. | Inventario de campos limpio; prueba negativa con texto sensible marcada y corregida/rechazada por moderación. | Diseño + Construcción |
| SEC-MVP-005 | **Inyección/XSS:** validación en servidor, texto plano nunca HTML ejecutable, ORM parametrizado, sin *uploads* en el MVP. | `<script>` introducido en una reseña se renderiza inerte; no existe endpoint de subida de archivos. | Construcción + Release |
| SEC-MVP-006 | **Spam/abuso:** honeypot, 3 envíos/hora/IP, 1 reseña por correo/producto, 429 genérico, CAPTCHA solo ante sospecha. IP hasheada/truncada con retención ≤ 30 días si se guarda. | El cuarto envío devuelve 429 genérico; la analítica no contiene PII; la IP almacenada no es reversible en claro. | Construcción + Release |
| SEC-MVP-007 | **Moderación previa:** toda reseña nace `pending`; invisible en listados, API pública, `sitemap` y caché SSR hasta aprobación. Motivo de rechazo interno. Preview con `noindex`. | Una petición anónima no devuelve pendientes; la respuesta de Preview incluye cabecera `no-index`; el motivo de rechazo no se expone públicamente. | **BLOQUEANTE** · Construcción + Release |
| SEC-MVP-008 | **Baja y rectificación:** enlace visible en cada reseña publicada; verificación por correo usado o token de un solo uso, sin documento de identidad. Consultas ≤ 10 días hábiles y reclamos ≤ 15 días hábiles (arts. 14 y 15). | Flujo E2E probado de baja y rectificación; los plazos 10/15 días hábiles figuran en la política publicada. | **BLOQUEANTE** · Diseño + Release |
| SEC-MVP-009 | **Retención:** reseña publicada + hasta 12 meses tras la baja; consentimiento solo mientras sea necesario; metadatos antiabuso 30 días (auditoría 180 días si llega a existir panel). | Existe tabla de retención documentada y la purga es verificable por fecha y tipo de dato. | Diseño + Release |
| SEC-MVP-010 | **Número de WhatsApp oficial no manipulable:** `wa.me` usa `57` + 10 dígitos desde configuración; destino nunca desde query/hash/referrer/reseñas; solo HTTPS y `rel="noopener noreferrer"`. | Cambiar parámetros de la URL no cambia el número; el enlace es HTTPS y lleva `rel="noopener noreferrer"`. | Diseño + Construcción |
| SEC-MVP-011 | **Mensaje seguro:** texto neutral. **Seguro incluir:** SKU, nombre público, cantidades, precios COP, subtotal **informativo de referencia (no monto a cobrar)**, URL pública, fecha local e ID aleatorio **en memoria, sin persistencia**. **Prohibido:** nombre, apellido, teléfono, correo, dirección, cédula, datos de tarjeta/cuenta, notas de salud, fotos de personas ni DMs. | El enlace generado no contiene patrones de PII; la analítica no registra datos del cliente; se verifica el texto en navegador y móvil. | Diseño + Construcción |
| SEC-MVP-012 | **Redes sociales:** solo cuentas oficiales, *allowlist* `instagram.com` / `facebook.com`; sin enlaces de usuarios en reseñas ni parámetros con PII. | Un dominio externo inyectado se rechaza en moderación; los enlaces del sitio apuntan solo a dominios permitidos. | Diseño + Construcción |
| SEC-MVP-013 | **Contenido de `localStorage` (solo si se decide persistir):** únicamente campos de `SEC-MVP-011`; nunca direcciones, documentos, teléfono, correo, nombre, pago, geolocalización ni credenciales/tokens; clave con versión de esquema. | Aserción sobre el contenido serializado: 0 campos prohibidos. | **NO APLICABLE en este MVP por decisión del Comandante** (RF-MVP-023: sin persistencia). Aplicaría automáticamente si se autorizara persistir · Diseño + Construcción |
| SEC-MVP-014 | **Caducidad (solo si se decide persistir):** TTL 7 días (tope 30), purga al cargar, borrado al enviar por WhatsApp, límite 50 SKUs, sin *service worker* que lo cachee. | Entrada antigua eliminada al cargar; tras el envío la clave desaparece. | **NO APLICABLE en este MVP por decisión del Comandante** (RF-MVP-023: sin persistencia). Aplicaría automáticamente si se autorizara persistir · Diseño + Construcción |
| SEC-MVP-015 | **Si NO hay panel:** no crear `/admin`, login, contraseñas en código, claves API en frontend ni parámetros mágicos. Moderación e inventario desde consola Vercel/BD con SSO + MFA y privilegios mínimos. | Escaneo de rutas: 0 superficies propias de autenticación; las operaciones internas se hacen con SSO + MFA. | **Aplica por defecto** (no se asume panel) · Diseño + Construcción + Release |
| SEC-MVP-016 | **Si hay panel:** SSO/OIDC con MFA, sin cuentas compartidas; si es inevitable, Argon2id + bloqueo por intentos; cookies `HttpOnly`, `Secure`, `SameSite`, ≤ 8 h e inactividad 30 min; ningún token en `localStorage`; fallo cerrado. | Sin sesión → 401; atributos de cookie verificados; no existen tokens legibles desde JavaScript. | **CONDICIONAL a decisión de panel** · Diseño + Construcción + Release |
| SEC-MVP-017 | **RBAC mínimo:** `moderador`, `inventario`, `admin`; comprobación en servidor, denegación por defecto, sin auto-elevación. | Matriz por rol ejecutada sobre cada escritura; un moderador no puede cambiar inventario ni roles. | **CONDICIONAL a decisión de panel** · Diseño + Construcción + Release |
| SEC-MVP-018 | **Auditoría *append-only*:** actor, acción, objetivo, antes/después mínimo, IP truncada, sin PII, retención 180 días, solo `admin`, alerta por cambios masivos. | Cada acción genera un evento inmutable; el moderador no consulta la auditoría; existe alerta ante cambios masivos. | **CONDICIONAL a decisión de panel** · Diseño + Construcción + Release |
| SEC-MVP-019 | **CSRF/CORS:** métodos no-GET con token ligado a sesión, verificación `Origin`/`Referer`, `SameSite`; CORS sin comodines. | POST cross-origin → 403; GET sin efectos de escritura. | **CONDICIONAL a decisión de panel** · Diseño + Construcción + Release |
| SEC-MVP-020 | **Validación del panel:** stock numérico acotado, ORM parametrizado, texto plano, sin *uploads* arbitrarios, validación en servidor. | Valores negativos, cadenas largas y HTML → rechazo o render inerte. | **CONDICIONAL a decisión de panel** · Diseño + Construcción + Release |
| SEC-MVP-021 | **Secretos:** `.env*` en `.gitignore`, solo `.env.example` con marcadores; secretos en Variables de Entorno de Vercel; `NEXT_PUBLIC_` solo para públicos como el número de WhatsApp; sin secretos en logs/errores/analítica; escaneo en CI y rotación. | Repositorio y bundle sin tokens; gitleaks en CI limpio; rotación documentada. | **BLOQUEANTE** · Construcción + Release |
| SEC-MVP-022 | **Entornos:** Development/Preview/Production separados; Preview con datos ficticios, protegido y `noindex`; credenciales de producción **NUNCA** en Preview; solo HTTPS. | Matriz de entornos revisada; cabeceras verificadas en Preview y producción; sin PII real en Preview. | Construcción + Release |
| SEC-MVP-023 | **Cabeceras:** CSP `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'none'` + orígenes explícitos; `nosniff`; `Referrer-Policy: strict-origin-when-cross-origin` (`no-referrer` en panel); `X-Frame-Options: DENY`; `Permissions-Policy` sin cámara/mic/geolocalización; HSTS vía Vercel; sin `X-Powered-By`. | Verificación con `curl -I`; CSP en *report-only* antes de aplicar en *enforce*. | Construcción + Release |
| SEC-MVP-024 | **Sin tarjetas ni datos de pago:** sin campos PAN/CVV/vencimiento, sin cuentas bancarias ni comprobantes, sin SDK de pagos; el acuerdo se gestiona por WhatsApp fuera de la app. | No hay campos, esquemas ni dependencias de pago en el código. | **BLOQUEANTE** · Diseño + Release |
| SEC-MVP-025 | **Sin facturación en la app:** sin DIAN, sin NIT/cédula fiscal, sin PDF tributario, sin botón «descargar factura»; la emite el asesor en su POS. | No hay artefactos de facturación en el repositorio ni en la UI. | **BLOQUEANTE** · Diseño + Release |
| SEC-MVP-026 | **Sin *tracking* con PII:** sin endpoint público por correo/teléfono/documento, sin ID secuencial enumerable, sin «consultar mi pedido», sin estado en el mensaje; borrador **en memoria, sin persistencia**, con ID aleatorio sin PII. | Inventario de endpoints limpio; el ID del borrador es aleatorio y no contiene datos del cliente. | **BLOQUEANTE** · Diseño + Release |

### 7.2 Mapa de riesgos → requisitos → momento

| Riesgo | Requisito SEC | Momento |
|---|---|---|
| Exceso de recolección/PII en reseñas | SEC-MVP-001, SEC-MVP-004, SEC-MVP-009 | Diseño + Construcción |
| Consentimiento inválido | SEC-MVP-002 | Diseño + Construcción |
| Menores | SEC-MVP-003 | Diseño + Construcción |
| XSS/spam | SEC-MVP-005, SEC-MVP-006 | Construcción + Release |
| Pendientes visibles | SEC-MVP-007 | Construcción + Release |
| Sin baja/rectificación | SEC-MVP-008 | Diseño + Release |
| `wa.me` manipulable o PII en el mensaje | SEC-MVP-010, SEC-MVP-011, SEC-MVP-012 | Diseño + Construcción |
| PII en almacenamiento | SEC-MVP-013, SEC-MVP-014 | Diseño + Construcción (no aplicables por arbitraje del Comandante) |
| Panel sin auth/roles/auditoría/CSRF | SEC-MVP-015, SEC-MVP-016, SEC-MVP-017, SEC-MVP-018, SEC-MVP-019, SEC-MVP-020 | Diseño + Construcción + Release |
| Secretos/entornos/cabeceras | SEC-MVP-021, SEC-MVP-022, SEC-MVP-023 | Construcción + Release |
| Funciones fuera de alcance (pago, factura, tracking) | SEC-MVP-024, SEC-MVP-025, SEC-MVP-026 | Diseño + Release |

---

> **Siguiente paso del proceso:** requisitos aprobados por `forge-reviewer` (LGTM) y por el Comandante `apex-forge`. Proceder al **Design Doc del MVP redefinido** con `forge-architect` (Fase 1) y después a planificación, construcción y release. Siguen abiertas Q-MVP-01/Q-MVP-02 (inventario, moderación y eventual panel) y Q-MVP-03 (proveedor/titularidad de la BD); los requisitos bloqueantes se verifican antes del release. **No se escribe código de producción hasta tener el Design Doc aprobado.**
