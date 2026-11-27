import Image from 'next/image';
import type { HomeContent } from '@/lib/home-content';
import { WhatsAppCta } from './WhatsAppCta';

type SiteHeaderProps = {
  navigation: HomeContent['navigation'];
  whatsappUrl: string | null;
};

function BrandMark() {
  return (
    <Image
      src="/brand/logo.png"
      width={48}
      height={48}
      alt="D'Adriana Tienda, ir al inicio"
      priority
      className="block"
    />
  );
}

export function SiteHeader({ navigation, whatsappUrl }: SiteHeaderProps) {
  return (
    <header data-surface="light" className="border-b-2 border-primary bg-white text-ink">
      <div className="mx-auto flex w-full max-w-[var(--content-max)] flex-wrap items-center gap-4 px-5 py-4 md:px-6 lg:px-8">
        <a href="/" className="inline-flex items-center gap-3 rounded-card">
          <BrandMark />
          <span aria-hidden="true" className="hidden font-semibold sm:inline">
            D&apos;Adriana Tienda
          </span>
        </a>

        <nav aria-label="Principal" className="order-3 w-full md:order-none md:ml-auto md:w-auto">
          <ul className="hidden items-center gap-6 md:flex">
            {navigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-small text-sm font-medium text-ink hover:text-ink hover:underline hover:decoration-2 hover:underline-offset-4 hover:decoration-accent-dark"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <details className="md:hidden">
            <summary className="w-fit cursor-pointer list-none rounded-pill border border-primary px-4 py-2 text-sm font-semibold text-ink">
              Menú
            </summary>
            <ul
              data-surface="light"
              className="mt-3 grid gap-1 rounded-card bg-surface p-4 text-ink shadow-soft"
            >
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="block rounded-small px-2 py-2 text-ink hover:bg-surface-alt hover:underline hover:decoration-2 hover:decoration-accent-dark"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </nav>

        <form
          data-surface="light"
          action="/buscar"
          method="get"
          role="search"
          className="order-2 ml-auto flex min-w-0 items-center gap-2 rounded-card border border-primary bg-surface p-1.5 md:order-none md:ml-0"
        >
          <label htmlFor="site-search" className="sr-only">
            Buscar en la tienda
          </label>
          <input
            data-surface="light"
            id="site-search"
            name="q"
            type="search"
            placeholder="Buscar"
            className="w-full min-w-0 rounded-small bg-surface px-3 py-2 text-ink placeholder:text-ink md:w-40"
          />
          <button
            data-surface="light"
            type="submit"
            className="rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white outline-ink transition-colors duration-200 hover:bg-primary-hover"
          >
            Buscar
          </button>
        </form>

        <WhatsAppCta href={whatsappUrl} label="WhatsApp" variant="header" />
      </div>
    </header>
  );
}
