import Image from 'next/image';
import type { ProductCardData } from '@/lib/home-content';

// Full ProductCardData still satisfies this display-only shape, so curated
// sections remain unchanged. Static highlights supply facts only.
export type ProductCardDisplay = Pick<ProductCardData, 'slug' | 'name'> &
  Partial<Pick<ProductCardData, 'brand' | 'image' | 'priceLabel' | 'availability'>> & {
    linkLabel?: string;
  };

type ProductCardProps = {
  product: ProductCardDisplay;
};

export function ProductCard({ product }: ProductCardProps) {
  // Only local, versioned assets are rendered; no external runtime resources.
  const localImage = product.image?.startsWith('/') ? product.image : undefined;

  return (
    <article className="flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-card border border-surface-alt bg-white shadow-soft">
      {localImage ? (
        <div className="relative aspect-square w-full bg-surface-alt">
          <Image
            src={localImage}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 288px, 80vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-2 p-5">
        {product.brand ? <p className="text-sm text-primary">{product.brand}</p> : null}
        <h3 className="text-lg text-ink">{product.name}</h3>
        {product.priceLabel ? (
          <p className="font-semibold text-ink">{product.priceLabel}</p>
        ) : null}
        {product.availability === 'out_of_stock' ? (
          <p className="text-sm text-ink">
            <span className="rounded-small bg-surface-alt px-2 py-1">Agotado</span>
          </p>
        ) : null}
        <a
          href={`/productos/${product.slug}`}
          className="mt-auto pt-4 font-semibold text-primary underline underline-offset-4"
        >
          {product.linkLabel ?? 'Ver producto'}
        </a>
      </div>
    </article>
  );
}
