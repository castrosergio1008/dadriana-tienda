type SkipLinkProps = {
  target?: string;
};

export function SkipLink({ target = '#main' }: SkipLinkProps) {
  return (
    <a
      href={target}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-white focus:px-4 focus:py-2 focus:text-ink focus:shadow-soft"
    >
      Saltar al contenido
    </a>
  );
}
