# Adriana Tienda · Presentación del proyecto

Deck de diapositivas en HTML + CSS para presentar el proyecto de e-commerce a la cliente.
Son **14 láminas** en formato 16:9, con la identidad de marca (verde, dorado y papel),
imágenes reales de la tienda y un **mapa de navegación tipo wireframe** del recorrido de compra.

## Cómo abrirla

1. Abre `index.html` con doble clic (se abre en el navegador).
2. Pon la ventana en pantalla completa (F11) para una mejor experiencia.

No necesita internet: las tipografías (Fraunces e Inter) están incluidas en `assets/fonts/`.

## Controles

| Acción | Cómo |
|---|---|
| Siguiente / anterior | Flechas del teclado, botones de la barra inferior o deslizando en móvil |
| Ir a una lámina | `index.html#9` (abre la lámina 9) o los puntos de la barra inferior |
| Primera / última | `Inicio` / `Fin` |
| Imprimir o guardar PDF | `Ctrl/Cmd + P` (cada lámina sale en una página) |

## Láminas

1. Portada
2. El punto de partida
3. Lo que vamos a construir
4. Así se verá tu tienda (Home)
5. Comprar por necesidad
6. El catálogo
7. La ficha de producto
8. Carrito y checkout
9. **Mapa de navegación** (wireframes conectados)
10. Pagos sin fricción
11. Tu operación, bajo control
12. Plan de trabajo (17 semanas)
13. Siguiente paso
14. Inversión

## Verificación

- **QA de maquetación**: abre `index.html?qa` — reporta desbordes y solapes de las 14 láminas.
- **Sintaxis JS**: `node --check app.js`.

## Archivos

```
presentacion/
├── index.html      # Las 14 láminas
├── styles.css      # Diseño e identidad visual
├── app.js          # Navegación y escalado del deck
├── fonts.css       # Tipografías autoalojadas
└── assets/
    ├── fonts/      # Fraunces + Inter (woff2, latin)
    └── *.jpg       # Imágenes de la tienda
```

El contenido comercial (cifras, tiempos y forma de pago) proviene de la cotización
`DD-2026-0117`; cualquier cambio debe reflejarse ahí primero.
