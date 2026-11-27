type CommitmentCardsProps = {
  items: string[];
};

export function CommitmentCards({ items }: CommitmentCardsProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="commitments-title" className="bg-surface-alt py-16 md:py-20">
      <div className="mx-auto w-full max-w-[var(--content-max)] px-5 md:px-6 lg:px-8">
        <h2 id="commitments-title" className="text-3xl text-ink md:text-4xl">
          Nuestros compromisos
        </h2>
        <div aria-hidden="true" className="mt-4 h-px w-14 bg-accent" />

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((text) => (
            <li
              key={text}
              tabIndex={0}
              className="rounded-card border border-surface bg-white p-6 shadow-soft"
            >
              <p className="font-semibold text-ink">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
