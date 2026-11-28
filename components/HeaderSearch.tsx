'use client';

import { useEffect, useRef, useState } from 'react';

function SearchGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 49.36 45.44"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="19" cy="19" r="15" />
      <path d="M30 30 L46 42" />
    </svg>
  );
}

export function HeaderSearch() {
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    inputRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Chromium clears type="search" on Escape by default; keep the typed
      // term when the disclosure closes.
      event.preventDefault();
      setExpanded(false);
      toggleRef.current?.focus();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && formRef.current?.contains(event.target)) return;
      setExpanded(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [expanded]);

  return (
    <form
      ref={formRef}
      data-surface="light"
      action="/buscar"
      method="get"
      role="search"
      data-search-ready={ready ? 'true' : 'false'}
      className="order-2 ml-auto flex min-w-0 items-center gap-1 md:order-none md:ml-0"
    >
      <div
        id="site-search-panel"
        data-surface="light"
        hidden={!expanded}
        className="flex min-w-0 items-center gap-1"
      >
        <label htmlFor="site-search" className="sr-only">
          ¿Qué estás buscando?
        </label>
        <input
          ref={inputRef}
          data-surface="light"
          id="site-search"
          name="q"
          type="search"
          placeholder="¿Qué estás buscando?"
          className="w-36 min-w-0 border-0 border-b border-ink/50 bg-transparent px-1 py-1 text-sm text-ink placeholder:text-[13px] placeholder:text-ink/70 focus:outline-none sm:w-48 md:w-56"
        />
        <button
          data-surface="light"
          type="submit"
          aria-label="Enviar búsqueda"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink"
        >
          <SearchGlyph className="h-5 w-5" />
        </button>
      </div>

      <button
        ref={toggleRef}
        data-surface="light"
        type="button"
        aria-label="Buscar"
        aria-expanded={expanded}
        aria-controls="site-search-panel"
        onClick={() => setExpanded((current) => !current)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink"
      >
        <SearchGlyph className="h-[22px] w-[22px] md:h-7 md:w-7" />
      </button>
    </form>
  );
}
