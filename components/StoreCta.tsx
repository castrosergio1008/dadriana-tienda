import { WhatsAppCta } from './WhatsAppCta';

type StoreCtaProps = {
  whatsappUrl?: string | null;
};

export function StoreCta({ whatsappUrl = null }: StoreCtaProps) {
  return (
    <section aria-labelledby="stores-title" className="bg-surface py-16 md:py-20">
      <div className="mx-auto w-full max-w-[var(--content-max)] px-5 md:px-6 lg:px-8">
        <h2 id="stores-title" className="text-3xl text-ink md:text-4xl">
          Tiendas
        </h2>
        <div aria-hidden="true" className="mt-4 h-px w-14 bg-accent" />
        <p className="mt-6 max-w-xl text-ink">Conoce dónde encontrarnos.</p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="/tiendas"
            className="inline-flex rounded-pill bg-primary px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-primary-hover"
          >
            Encuentra tu tienda
          </a>
          <WhatsAppCta href={whatsappUrl} />
        </div>
      </div>
    </section>
  );
}
