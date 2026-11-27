import Image from 'next/image';
import type { HomeContent } from '@/lib/home-content';

type SiteFooterProps = {
  navigation: HomeContent['navigation'];
  socials: HomeContent['socials'];
  legalLinks: HomeContent['legalLinks'];
};

const CATALOG_HREFS = new Set(['/piel', '/cabello', '/marcas']);
const STORE_HREFS = new Set(['/tiendas']);

export function SiteFooter({ navigation, socials, legalLinks }: SiteFooterProps) {
  const catalog = navigation.filter((item) => CATALOG_HREFS.has(item.href));
  const stores = navigation.filter((item) => STORE_HREFS.has(item.href));

  return (
    <footer data-surface="light" className="border-t-2 border-primary bg-white text-ink">
      <div className="mx-auto grid w-full max-w-[var(--content-max)] gap-10 px-5 py-14 sm:grid-cols-2 md:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <Image
            src="/brand/logo.png"
            width={48}
            height={48}
            alt="D'Adriana Tienda"
            className="block"
          />
          <p className="mt-4 max-w-xs border-t-2 border-accent pt-4 text-ink">
            Belleza para tu piel y tu cabello
          </p>
        </div>

        <div>
          <h2 className="text-lg">Catálogo</h2>
          <ul className="mt-4 grid gap-2">
            {catalog.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-small text-ink hover:text-ink hover:underline hover:decoration-2 hover:underline-offset-4 hover:decoration-accent-dark"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-lg">Tienda y contacto</h2>
          <ul className="mt-4 grid gap-2">
            {stores.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-small text-ink hover:text-ink hover:underline hover:decoration-2 hover:underline-offset-4 hover:decoration-accent-dark"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a href="/buscar" className="rounded-small text-ink hover:text-ink hover:underline hover:decoration-2 hover:underline-offset-4 hover:decoration-accent-dark">
                Buscar
              </a>
            </li>
          </ul>

          {socials.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink underline decoration-2 underline-offset-4 decoration-accent-dark">Redes</h3>
              <ul className="mt-2 grid gap-2">
                {socials.map((item) => (
                  <li key={item.url}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-small text-ink hover:text-ink hover:underline hover:decoration-2 hover:underline-offset-4 hover:decoration-accent-dark"
                    >
                      {item.label}
                      <span className="sr-only"> (se abre en una pestaña nueva)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {legalLinks.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink underline decoration-2 underline-offset-4 decoration-accent-dark">Legales</h3>
              <ul className="mt-2 grid gap-2">
                {legalLinks.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="rounded-small text-ink hover:text-ink hover:underline hover:decoration-2 hover:underline-offset-4 hover:decoration-accent-dark"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
