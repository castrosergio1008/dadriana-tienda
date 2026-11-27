import type { HomeContent } from '@/lib/home-content';

type HeroCopyProps = {
  hero: HomeContent['hero'];
  tone?: 'on-dark' | 'on-light';
};

/**
 * Server-only copy slot rendered inside HomeStage. There is exactly one h1
 * and one approved CTA on every slide; no data is read here beyond the
 * already-approved copy passed by the RSC page. The default tone keeps the
 * original white-on-photograph output for any other caller.
 */
export function HeroCopy({ hero, tone = 'on-dark' }: HeroCopyProps) {
  const onLight = tone === 'on-light';

  return (
    <div className={onLight ? 'text-ink' : 'text-white'}>
      <p
        className={`text-sm font-semibold uppercase tracking-[0.08em] ${
          onLight ? 'text-ink' : 'text-white/90'
        }`}
      >
        D&apos;Adriana Tienda
      </p>
      <div
        aria-hidden="true"
        className={`mt-5 h-px w-16 ${onLight ? 'bg-accent-dark' : 'bg-accent-soft'}`}
      />
      <h1
        id="hero-title"
        className={`mt-6 max-w-3xl text-[2rem] ${onLight ? 'text-ink' : 'text-white'} md:text-5xl lg:text-[3.5rem]`}
      >
        {hero.headline}
      </h1>
      {hero.body ? (
        <p className={`mt-6 max-w-xl text-lg leading-relaxed ${onLight ? 'text-ink' : 'text-white'}`}>
          {hero.body}
        </p>
      ) : null}
      <a
        href={hero.primaryCta.href}
        className="mt-8 inline-flex rounded-pill bg-primary px-7 py-3 font-semibold text-white transition-colors duration-200 hover:bg-primary-hover"
      >
        {hero.primaryCta.label}
      </a>
    </div>
  );
}
