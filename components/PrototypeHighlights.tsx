import { PROTOTYPE_HIGHLIGHTS } from '@/lib/prototype-highlights';
import { ProductCard } from './ProductCard';

const FIRST_HIGHLIGHT = PROTOTYPE_HIGHLIGHTS[0];
const LAST_HIGHLIGHT = PROTOTYPE_HIGHLIGHTS[PROTOTYPE_HIGHLIGHTS.length - 1];

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {direction === 'left' ? (
        <path d="m15 18-6-6 6-6" />
      ) : (
        <path d="m9 18 6-6-6-6" />
      )}
    </svg>
  );
}

// Server component: fragment anchors and native scroll snap only (DD-HOME-20 §4.4).
export function PrototypeHighlights() {
  return (
    <section
      role="region"
      aria-labelledby="destacados-title"
      className="bg-surface py-16 md:py-20"
    >
      <div className="mx-auto w-full max-w-[var(--content-max)] px-5 md:px-6 lg:px-8">
        <h2 id="destacados-title" className="text-3xl text-ink md:text-4xl">
          Productos destacados
        </h2>

        <nav
          aria-label="Navegación de productos destacados"
          className="mt-8 flex flex-wrap items-center gap-1"
        >
          <a
            href="#destacado-1"
            aria-label={`Ir al primer producto destacado: ${FIRST_HIGHLIGHT.name}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-small border border-surface-alt bg-white text-ink"
          >
            <Chevron direction="left" />
          </a>

          {PROTOTYPE_HIGHLIGHTS.map((highlight, index) => (
            <a
              key={highlight.slug}
              href={`#destacado-${index + 1}`}
              aria-label={`Ir al producto ${index + 1} de ${PROTOTYPE_HIGHLIGHTS.length}: ${highlight.name}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-small border border-surface-alt bg-white text-sm font-semibold text-ink"
            >
              {index + 1}
            </a>
          ))}

          <a
            href={`#destacado-${PROTOTYPE_HIGHLIGHTS.length}`}
            aria-label={`Ir al último producto destacado: ${LAST_HIGHLIGHT.name}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-small border border-surface-alt bg-white text-ink"
          >
            <Chevron direction="right" />
          </a>
        </nav>

        <ul
          tabIndex={0}
          className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-4"
        >
          {PROTOTYPE_HIGHLIGHTS.map((highlight, index) => (
            <li
              key={highlight.slug}
              id={`destacado-${index + 1}`}
              tabIndex={-1}
              className="snap-start scroll-mt-28 rounded-card"
            >
              <ProductCard
                product={{
                  slug: highlight.slug,
                  name: highlight.name,
                  brand: highlight.brand,
                  image: highlight.image,
                  linkLabel: `Ver ficha de ${highlight.name}`,
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
