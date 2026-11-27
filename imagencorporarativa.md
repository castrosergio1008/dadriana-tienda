# Imagen Corporativa — D'Adriana Tienda

Guía de identidad visual para el sitio web y las redes sociales de **D'Adriana Tienda**, tienda virtual de productos de belleza para la piel y el cabello.

> Los códigos de color fueron tomados del logo (imagen), por lo que son aproximados. Si se cuenta con el archivo original del diseñador, se recomienda confirmar los valores exactos.

---

## 1. Concepto de marca

- **Nombre comercial:** D'Adriana Tienda
- **Sector:** Belleza y cuidado personal (piel y cabello)
- **Personalidad:** elegante, femenina, cálida, confiable y con un toque de lujo accesible
- **Logo:** insignia circular en verde esmeralda con borde dorado, monograma "D'A" y silueta femenina con cabello fluido integrada en la letra D

### Uso del nombre

- En textos y redes: **D'Adriana Tienda** (con apóstrofe y espacio).
- En dominio y usuario de redes: **dadrianatienda** (sin apóstrofe, sin guiones, sin espacios).

---

## 2. Paleta de colores

### 2.1 Colores principales (del logo)

| Rol | Nombre | HEX | Uso recomendado |
|---|---|---|---|
| Verde principal | Esmeralda profundo | `#1B5D4A` | Encabezado, botones principales, secciones destacadas |
| Verde claro | Esmeralda brillante | `#22755C` | Hover de botones, degradados, detalles |
| Verde oscuro | Bosque | `#123F33` | Pie de página, texto sobre fondos claros |
| Dorado principal | Oro suave | `#C6A050` | Líneas, íconos, bordes, detalles |
| Dorado claro | Champaña | `#E6CC87` | Texto sobre verde, resaltados, estrellas de reseñas |
| Dorado oscuro | Oro viejo | `#B38F44` | Hover del dorado, sombras |

### 2.2 Fondos claros (derivados de la paleta)

| Uso | HEX |
|---|---|
| Fondo general de la página | `#F7F5EE` |
| Tarjetas y secciones alternas | `#EEF4F1` |
| Blanco (productos y formularios) | `#FFFFFF` |

### 2.3 Proporción de uso (60 / 30 / 10)

- **60%** fondos claros
- **30%** verde
- **10%** dorado (solo como acento)

### 2.4 Reglas de uso y legibilidad

- El dorado `#C6A050` **no debe usarse como texto sobre fondo blanco o crema** (bajo contraste). Para texto sobre fondos claros usar verde oscuro `#123F33`.
- Sobre fondo verde, usar texto en champaña `#E6CC87` o blanco.
- En botones dorados, el texto debe ser verde oscuro `#123F33`, no blanco.
- El dorado es un acento: líneas finas, íconos, bordes y títulos pequeños.

### 2.5 Variables CSS

```css
:root {
  /* Verdes */
  --verde-principal: #1B5D4A;
  --verde-claro: #22755C;
  --verde-oscuro: #123F33;

  /* Dorados */
  --dorado-principal: #C6A050;
  --dorado-claro: #E6CC87;
  --dorado-oscuro: #B38F44;

  /* Fondos */
  --fondo-pagina: #F7F5EE;
  --fondo-suave: #EEF4F1;
  --blanco: #FFFFFF;

  /* Tipografía */
  --fuente-titulos: 'Playfair Display', serif;
  --fuente-texto: 'Inter', sans-serif;
}
```

---

## 3. Tipografía

### 3.1 Combinación principal

| Uso | Fuente | Motivo |
|---|---|---|
| Títulos (H1, H2, secciones) | **Playfair Display** | Serif elegante y femenina, coherente con el logo |
| Texto, menús, botones, descripciones | **Inter** | Muy legible en celular, moderna y ligera |

Ambas son gratuitas en Google Fonts.

### 3.2 Alternativa

| Uso | Fuente |
|---|---|
| Títulos | Cormorant Garamond |
| Texto | Montserrat |

### 3.3 Fuente de apoyo (solo detalles)

**Cinzel** se parece a las mayúsculas del logo. Usar únicamente en textos cortos (etiquetas, menú), nunca en párrafos.

### 3.4 Tamaños sugeridos (escritorio)

| Elemento | Tamaño |
|---|---|
| H1 | 44–56 px |
| H2 | 32–36 px |
| Nombre de producto | 18–20 px |
| Texto general | 16–18 px |
| Texto pequeño | 14 px |

### 3.5 Buenas prácticas

- Máximo **2 fuentes** y 2 o 3 pesos (regular, medio, negrita) para que el sitio cargue rápido.
- Interlineado del texto: 1.5 a 1.7.

---

## 4. Componentes de interfaz

### Botones

| Tipo | Fondo | Texto | Borde |
|---|---|---|---|
| Principal | `#1B5D4A` | Blanco o `#E6CC87` | — |
| Principal (hover) | `#22755C` | Blanco o `#E6CC87` | — |
| Secundario | Transparente | `#123F33` | `#C6A050` |
| Acento dorado | `#C6A050` | `#123F33` | — |

### Otros elementos

- **Encabezado:** fondo verde `#1B5D4A`, menú en champaña `#E6CC87`, logo a la izquierda.
- **Pie de página:** fondo verde oscuro `#123F33`, texto claro, líneas divisorias doradas.
- **Tarjetas de producto:** fondo blanco, borde fino `#EEF4F1`, precio en verde, detalles en dorado.
- **Estrellas de reseñas:** dorado claro `#E6CC87` o principal `#C6A050`.
- **Líneas divisorias:** dorado fino (1 px), como las líneas del logo.

---

## 5. Uso del logo

- Mantener siempre el logo circular completo; no deformarlo ni cambiar sus colores.
- Dejar un margen libre alrededor equivalente al menos al grosor del anillo dorado.
- Sobre fondos claros, usar el logo tal cual (el verde destaca).
- Sobre fondos verdes, colocarlo sobre un fondo claro o usar una versión con borde dorado visible.
- Tamaño mínimo recomendado: 48 px de ancho en pantalla.
- Usar el logo como favicon (versión simplificada con el monograma "D'A").

---

## 6. Estilo visual y fotografía

- **Fotografía:** luminosa y natural, fondos neutros o crema, productos con detalles verdes o dorados.
- **Modelos y texturas:** piel y cabello reales, evitando retoques excesivos.
- **Elementos gráficos:** líneas doradas finas, formas redondeadas inspiradas en el círculo del logo.
- **Iconografía:** trazo fino, estilo lineal, en dorado o verde.

---

## 7. Tono de comunicación

- Cercano, cálido y experto, sin ser técnico en exceso.
- Uso de **storytelling**: contar historias reales de transformación de clientes y la historia de la marca.
- Mensajes enfocados en cuidado, confianza y bienestar.

**Ejemplos de eslogan (a elegir):**
- Belleza para tu piel y tu cabello
- Cuida lo que te hace brillar
- Tu belleza, tu esencia

---

## 8. Resumen rápido

| Elemento | Definición |
|---|---|
| Color principal | Verde esmeralda `#1B5D4A` |
| Color de acento | Dorado `#C6A050` |
| Fondo | Crema `#F7F5EE` |
| Fuente de títulos | Playfair Display |
| Fuente de texto | Inter |
| Estilo | Elegante, femenino, natural, con detalles de lujo |
