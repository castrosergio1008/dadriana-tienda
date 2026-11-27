type WhatsAppCtaProps = {
  href: string | null;
  label?: string;
  variant?: 'header' | 'section';
};

export function WhatsAppCta({
  href,
  label = 'Hablar por WhatsApp',
  variant = 'section',
}: WhatsAppCtaProps) {
  // A stale or invalid number must render no contact link at all.
  if (!href) return null;

  const className =
    variant === 'header'
      ? 'inline-flex items-center rounded-pill border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white outline-ink transition-colors duration-200 hover:border-primary-hover hover:bg-primary-hover'
      : 'inline-flex items-center rounded-pill bg-primary px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-primary-hover';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label}
      <span className="sr-only"> (se abre en una pestaña nueva)</span>
    </a>
  );
}
