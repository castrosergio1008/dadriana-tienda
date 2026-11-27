import type { HomeContent } from '@/lib/home-content';

type CategoryCardsProps = {
  navigation: HomeContent['navigation'];
};

const CATEGORY_HREFS = new Set(['/piel', '/cabello', '/marcas']);

export function CategoryCards({ navigation }: CategoryCardsProps) {
  const categories = navigation.filter((item) => CATEGORY_HREFS.has(item.href));

  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="categories-title" className="bg-white py-16 md:py-20">
      <div className="mx-auto w-full max-w-[var(--content-max)] px-5 md:px-6 lg:px-8">
        <h2 id="categories-title" className="text-3xl text-ink md:text-4xl">
          Explora por categoría
        </h2>
        <div aria-hidden="true" className="mt-4 h-px w-14 bg-accent" />

        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {categories.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="flex h-full flex-col justify-between gap-10 rounded-card border border-surface-alt bg-surface p-6 shadow-soft transition-colors duration-200 hover:border-primary"
              >
                <h3 className="text-lg text-ink">{item.label}</h3>
                <span className="font-semibold text-primary">
                  Ver {item.label.toLowerCase()}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
