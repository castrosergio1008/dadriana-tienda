import type { ProductCardData } from '@/lib/home-content';
import { ProductCard } from './ProductCard';

type CuratedCarouselProps = {
  id: string;
  title: string;
  items: ProductCardData[];
  label?: string;
};

export function CuratedCarousel({
  id,
  title,
  items,
  label,
}: CuratedCarouselProps) {
  if (items.length === 0) return null;

  return (
    <section id={id} role="region" aria-label={label ?? title} className="bg-white py-16 md:py-20">
      <div className="mx-auto w-full max-w-[var(--content-max)] px-5 md:px-6 lg:px-8">
        <h2 className="text-3xl text-ink md:text-4xl">{title}</h2>
        <div aria-hidden="true" className="mt-4 h-px w-14 bg-accent" />
        <p className="sr-only">
          Usa las flechas del teclado para desplazarte por la selección.
        </p>

        <ul
          tabIndex={0}
          className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4"
        >
          {items.map((product) => (
            <li key={product.slug} className="snap-start">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
