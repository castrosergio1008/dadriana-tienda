const APPROVED_SLOGAN = 'Belleza para tu piel y tu cabello';

export function EditorialBanner() {
  return (
    <section
      aria-labelledby="editorial-title"
      data-surface="dark"
      className="bg-primary text-white"
    >
      <div className="mx-auto grid w-full max-w-[var(--content-max)] gap-8 px-5 py-16 md:grid-cols-[1fr_auto] md:items-center md:px-6 md:py-20 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-accent-soft">
            D&apos;Adriana
          </p>
          <div aria-hidden="true" className="my-5 h-px w-16 bg-accent" />
          <h2 id="editorial-title" className="max-w-3xl text-3xl md:text-4xl lg:text-5xl">
            {APPROVED_SLOGAN}
          </h2>
        </div>
        <a
          href="/tiendas"
          className="inline-flex w-fit items-center rounded-pill border border-white px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-white hover:text-ink"
        >
          Conoce nuestras tiendas
        </a>
      </div>
    </section>
  );
}
