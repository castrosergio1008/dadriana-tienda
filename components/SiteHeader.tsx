import Image from 'next/image';
import type { HomeContent } from '@/lib/home-content';
import { HeaderSearch } from './HeaderSearch';
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
      <div className="relative mx-auto flex w-full max-w-[var(--content-max)] flex-nowrap items-center gap-2 px-5 py-2 md:px-6 lg:px-8">
        <a href="/" className="order-2 flex shrink-0 flex-col items-center gap-0.5 rounded-card">
          <BrandMark />
          <span aria-hidden="true" className="whitespace-nowrap text-sm font-semibold leading-[21px]">
            D&apos;Adriana Tienda
          </span>
        </a>

        <nav aria-label="Principal" className="order-1 min-w-0 flex-1">
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
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center p-0 text-ink">
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 59.5 28.27"
                className="h-[22px] w-[22px] md:h-7 md:w-7"
                fill="currentColor"
              >
                <rect x="0.5" y="0.5" width="58.5" height="6.8" rx="3.4" />
                <rect x="0.5" y="10.72" width="58.5" height="6.8" rx="3.4" />
                <rect x="0.5" y="20.95" width="58.5" height="6.8" rx="3.4" />
              </svg>
              <span className="sr-only">Menú</span>
            </summary>
            <ul
              data-surface="light"
              className="absolute left-5 top-full z-20 mt-2 grid w-[min(280px,calc(100vw_-_40px))] gap-1 rounded-card bg-surface p-4 text-ink shadow-soft"
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

        {/* Static wrapper: the search panel must anchor to the header container. */}
        <div className="order-3 flex min-w-0 flex-1 items-center justify-end gap-2">
          <HeaderSearch />
          <span className="hidden md:inline-flex">
            <WhatsAppCta href={whatsappUrl} label="WhatsApp" variant="header" />
          </span>
        </div>
      </div>
    </header>
  );
}
