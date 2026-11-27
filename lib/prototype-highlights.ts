// Static, hand-transcribed facts from prototipo/app.js (DD-HOME-20 §4.3).
// The prototype is never imported at build or runtime: only names, brands and
// slugs approved for display live here. Commercial demo data is deliberately
// omitted so it cannot leak into the Home.
export type PrototypeHighlight = {
  slug: string;
  name: string;
  brand: string;
  image: `/products/${string}`;
};

export const PROTOTYPE_HIGHLIGHTS = [
  {
    slug: 'shampoo-purificante',
    name: 'Shampoo Purificante Anticaspa',
    brand: "L'Oréal Paris",
    image: '/products/shampoo-purificante-anticaspa.jpg',
  },
  {
    slug: 'shampoo-morado',
    name: 'Shampoo Morado Anti-amarillo',
    brand: 'Garnier',
    image: '/products/shampoo-morado-anti-amarillo.jpg',
  },
  {
    slug: 'mascarilla-reparadora',
    name: 'Mascarilla Reparadora 400 ml',
    brand: "L'Oréal Paris",
    image: '/products/mascarilla-reparadora-400-ml.jpg',
  },
  {
    slug: 'aceite-argan',
    name: 'Aceite Capilar de Argán',
    brand: 'Garnier',
    image: '/products/aceite-capilar-argan.jpg',
  },
  {
    slug: 'serum-vitamina-c',
    name: 'Sérum Vitamina C 30 ml',
    brand: 'La Roche-Posay',
    image: '/products/serum-vitamina-c-30-ml.jpg',
  },
  {
    slug: 'crema-hidratante',
    name: 'Crema Hidratante Piel Sensible',
    brand: 'CeraVe',
    image: '/products/crema-hidratante-piel-sensible.jpg',
  },
] as const satisfies readonly PrototypeHighlight[];
