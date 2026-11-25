# ADR-001 — Stack frontend: Next.js 15 App Router, React 19, TypeScript strict y Tailwind v4

| Campo | Valor |
|---|---|
| **Estado** | Proposed — pendiente de aprobación del Comandante |
| **Fecha** | 23 de noviembre de 2026 |
| **Decisores** | `forge-architect`, `apex-forge` |
| **Relacionados** | [decisiones-comandante.md](../decisiones-comandante.md) (C-12), [ADR-004](./ADR-004-estrategia-datos-prisma.md), [ADR-006](./ADR-006-estrategia-despliegue.md), [design-doc.md §4.1](../design-doc.md) |

## Contexto

El cliente aprobó un prototipo S0 autocontenido (HTML + CSS + JS sin build) que ya validó la identidad visual (verde `#1E644C`, dorado `#B8895A`, Fraunces + Inter), los flujos de Home/PLP/PDP/carrito/checkout y las decisiones de accesibilidad (focus trap, `aria-live`, tabs con teclado, `prefers-reduced-motion`). El prototipo es deliberadamente **no productivo**: pagos, stock y pedidos son simulados en `localStorage`.

Necesitamos un stack que (a) preserve esa experiencia y sus tokens de diseño, (b) permita Core Web Vitals en verde en móvil (~70% del tráfico), (c) sea el stack oficial de Digitaldevs, y (d) disminuya la fricción de pago sin añadir JS de terceros bloqueante.

## Decisión

> **Decisión:** usar **Next.js 15 (App Router, Server Components, ISR/PPR, Turbopack en desarrollo) + React 19 + TypeScript strict + Tailwind CSS v4** en un monorepo con `packages/ui` (design system) y `packages/core` (dominio). Primitivas de accesibilidad de Radix; sin librerías de animación (CSS-first). Se mantiene la paleta y las tipografías del prototipo como tokens en `@theme` de Tailwind v4.

**Reglas de uso:**

| Regla | Motivo |
|---|---|
| Server Components por defecto; `'use client'` solo donde haya interactividad | Minimizar JS enviado al móvil |
| ISR + `revalidateTag` por entidad en Home/PLP/PDP | TTFB < 800 ms y frescura controlada |
| Server Actions para mutaciones del storefront; Route Handlers `/api/v1` para integraciones y webhooks | Simplicidad sin perder contratos versionados |
| Imágenes `next/image` con AVIF/WebP, `srcset` y dimensiones explícitas | LCP y CLS |
| Fuentes self-hosted con `next/font`, máx. 2 familias / 4 pesos | Evitar flashes y peso |
| Animaciones CSS + `prefers-reduced-motion` | WCAG 2.2 AA sin dependencias |

**Evaluación de versión mayor (exigida por AGENTS.md):** la versión objetivo es Next 15 / React 19 / Tailwind 4. Si al iniciar el Sprint 1 existe una versión mayor estable (p. ej. Next 16), `forge-architect` evaluará adopción con criterios de estabilidad de ecosistema, compatibilidad de librerías (Radix, Prisma, Vitest) y custo de migración; el resultado se registrará como enmienda a este ADR. **No se adopta una mayor por anticipado.**

## Consecuencias

**Positivas**
- Presupuesto de JS por plantilla alcanzable (Home ≤ 150 KB, PDP ≤ 170 KB) gracias a RSC.
- El design system del prototipo se traslada casi 1:1 a tokens, reduciendo retrabajo visual.
- TypeScript strict + dominio separado facilitan tests y reviewer.
- Preview deploys de Vercel permiten revisar cada cambio con el cliente antes de mergear.

**Negativas / costos**
- Curva de aprendizaje de RSC y Server Actions para el equipo si viene de SPA.
- ISR requiere disciplina de invalidación por eventos (outbox → `revalidateTag`); si se invalida "a mano" desde el admin, aparecen inconsistencias.
- Tailwind v4 cambia el modelo de configuración frente a v3; se documenta en `packages/ui/README.md` (cuando se escriba código).

**Neutras**
- Se requiere un `packages/ui` bien gobernado; de lo contrario cada pantalla reinventa componentes.

## Alternativas

| Alternativa | Por qué se descartó |
|---|---|
| React SPA (Vite) + API REST | Pierde RSC/ISR, envía más JS en móvil y peor SEO técnico; el prototipo ya es SPA y sabemos que no escala a producción. |
| Remix / Astro | Buenos para contenido, pero menos alineados al stack Digitaldevs y al ecosistema de despliegue elegido (ADR-006). |
| Next.js Pages Router | API anterior; App Router es el estándar actual y habilita streaming y Server Components. |
| Angular / Vue | Fuera del stack de la organización; costos de formación sin beneficio para este caso. |

## Estado

**Proposed**. Requiere LGTM de `forge-reviewer` y aprobación de `apex-forge` antes de crear el primer `package.json` de producción.
