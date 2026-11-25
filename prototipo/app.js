/* ============================================================
   Adriana Tienda — Prototipo navegable (S0)
   Vanilla JS SPA: hash router + catalog + cart + checkout demo.
   No backend: payments are simulated and cart persists locally.
   ============================================================ */
'use strict';

/* ── 1. Asset map (real client images) ─────────────────────── */
const IMG = {
  neutral0: 'assets/187485109_101843935456429_4899052523150508942_n.jpg',
  neutral1: 'assets/190319138_102173352090154_4404882555438686406_n.jpg',
  tan2: 'assets/191190005_101841445456678_7142205638447229167_n.jpg',
  neutral3: 'assets/191503315_103767508597405_2444493671324420_n.jpg',
  mauve4: 'assets/193774564_103773088596847_5720665231254481232_n.jpg',
  pale5: 'assets/476076229_941094544864693_1792361008055235315_n.jpg',
  gold6: 'assets/476134411_941094224864725_2822899998559028354_n.jpg',
  terra7: 'assets/476162518_942328904741257_7430935235354454783_n.jpg',
  blue8: 'assets/476224305_942328714741276_1414471928755693199_n.jpg',
  amber9: 'assets/476224305_942328781407936_1974981603524265724_n.jpg',
  brown10: 'assets/476245791_942328784741269_2183723592688087610_n.jpg',
  red11: 'assets/476291670_942330988074382_8866391372323287637_n.jpg',
  olive12: 'assets/476292909_941094474864700_6517118156012006064_n.jpg',
  neutral13: 'assets/476383572_942330954741052_878526072427543475_n.jpg',
  orange14: 'assets/476402716_942330921407722_7554504591105678866_n.jpg',
  taupe15: 'assets/476443865_942328598074621_60058891888020125_n.jpg',
  purple16: 'assets/476452255_942330974741050_5802109887038169884_n.jpg',
  brown17: 'assets/476469612_942328711407943_3669806417903002498_n.jpg',
  rose18: 'assets/476619204_942330994741048_7213401253393793461_n.jpg',
};

/* ── 2. Catalog ────────────────────────────────────────────── */
const BRANDS = [
  "L'Oréal Paris", 'Garnier', 'Vichy', 'La Roche-Posay',
  'CeraVe', 'Eucerin', 'Maybelline', 'Nivea',
];

const CATEGORIES = ['Cabello', 'Rostro', 'Cuerpo', 'Maquillaje', 'Ofertas'];

const NEEDS = ['Caída', 'Frizz', 'Rizos', 'Cabello graso', 'Piel sensible', 'Manchas'];

const HAIR_TYPES = ['Graso', 'Seco', 'Normal', 'Teñido', 'Rizado', 'Fino'];

const PRODUCTS = [
  {
    id: 'shampoo-purificante',
    name: 'Shampoo Purificante Anticaspa',
    brand: "L'Oréal Paris",
    category: 'Cabello',
    subcategory: 'Shampoo',
    price: 34900,
    oldPrice: null,
    rating: 4.7,
    reviews: 28,
    stock: 20,
    badge: 'Bestseller',
    needs: ['Cabello graso'],
    hairType: 'Graso',
    images: [IMG.neutral13],
    variantType: 'size',
    variants: [
      { label: '250 ml', price: 34900, stock: 12, image: IMG.neutral13 },
      { label: '400 ml', price: 44900, stock: 8, image: IMG.neutral13 },
    ],
    description: 'Limpia en profundidad, controla la caspa y deja el cuero cabelludo fresco por más tiempo. Fórmula con piritionato de zinc apta para uso frecuente.',
    howToUse: 'Aplica sobre el cabello mojado, masajea suavemente el cuero cabelludo y enjuaga. Repite si es necesario. Úsalo 2–3 veces por semana.',
    ingredients: 'Aqua, sodium laureth sulfate, zinc pyrithione, cocamidopropyl betaine, glicerina, pantenol.',
    specs: [
      ['Marca', "L'Oréal Paris"],
      ['Presentación', '250 ml / 400 ml'],
      ['Tipo de cabello', 'Graso'],
      ['Uso', 'Frecuente'],
      ['Registro INVIMA', 'NSOC-02457-2019'],
    ],
  },
  {
    id: 'shampoo-morado',
    name: 'Shampoo Morado Anti-amarillo',
    brand: 'Garnier',
    category: 'Cabello',
    subcategory: 'Shampoo',
    price: 38900,
    oldPrice: null,
    rating: 4.6,
    reviews: 41,
    stock: 15,
    badge: null,
    needs: [],
    hairType: 'Teñido',
    images: [IMG.purple16],
    variantType: 'none',
    variants: [{ label: '300 ml', price: 38900, stock: 15, image: IMG.purple16 }],
    description: 'Neutraliza los tonos amarillos en cabello rubio, decolorado o canoso. Fórmula violeta que devuelve el brillo y la frescura al color.',
    howToUse: 'Usa guantes. Aplica sobre el cabello mojado, deja actuar 2–5 minutos según la intensidad deseada y enjuaga. Úsalo 1–2 veces por semana.',
    ingredients: 'Aqua, sodium laureth sulfate, pigmentos violeta (CI 60725), glicerina, ácido cítrico.',
    specs: [
      ['Marca', 'Garnier'],
      ['Presentación', '300 ml'],
      ['Tipo de cabello', 'Teñido / Decolorado'],
      ['Color', 'Violeta'],
      ['Registro INVIMA', 'NSOC-01893-2020'],
    ],
  },
  {
    id: 'mascarilla-reparadora',
    name: 'Mascarilla Reparadora 400 ml',
    brand: "L'Oréal Paris",
    category: 'Cabello',
    subcategory: 'Mascarilla',
    price: 89900,
    oldPrice: 104900,
    rating: 4.8,
    reviews: 32,
    stock: 12,
    badge: 'Bestseller',
    needs: ['Frizz'],
    hairType: 'Seco',
    images: [IMG.terra7],
    variantType: 'size',
    variants: [
      { label: '250 ml', price: 69900, oldPrice: 82900, stock: 14, image: IMG.terra7 },
      { label: '400 ml', price: 89900, oldPrice: 104900, stock: 9, image: IMG.terra7 },
      { label: '1 L', price: 149900, oldPrice: 169900, stock: 4, image: IMG.terra7 },
    ],
    description: 'Repara el cabello dañado y con frizz gracias a su fórmula con keratina y aceite de argán. Cabello suave, suelto y con movimiento desde la primera aplicación.',
    howToUse: 'Después del shampoo, aplica de medios a puntas, deja actuar 3–5 minutos y enjuaga abundante. Úsala 1–2 veces por semana.',
    ingredients: 'Aqua, cetearyl alcohol, keratina hidrolizada, aceite de argán, dimeticona, pantenol.',
    specs: [
      ['Marca', "L'Oréal Paris"],
      ['Presentación', '250 ml / 400 ml / 1 L'],
      ['Tipo de cabello', 'Seco / Dañado'],
      ['Beneficio', 'Reparación y control de frizz'],
      ['Registro INVIMA', 'NSOC-03311-2018'],
    ],
  },
  {
    id: 'aceite-argan',
    name: 'Aceite Capilar de Argán',
    brand: 'Garnier',
    category: 'Cabello',
    subcategory: 'Aceite',
    price: 54900,
    oldPrice: null,
    rating: 4.8,
    reviews: 67,
    stock: 15,
    badge: 'Bestseller',
    needs: ['Frizz', 'Rizos'],
    hairType: 'Seco',
    images: [IMG.gold6, IMG.olive12],
    variantType: 'size',
    variants: [
      { label: '100 ml', price: 54900, stock: 15, image: IMG.gold6 },
      { label: '150 ml', price: 69900, stock: 7, image: IMG.gold6 },
    ],
    description: 'Aceite nutritivo con argán marroquí que sella la humedad, controla el frizz y define los rizos sin dejar sensación grasa.',
    howToUse: 'Aplica 1–2 gotas en las palmas, distribuye de medios a puntas con el cabello húmedo o seco. No enjuagues.',
    ingredients: 'Aceite de argán, dimeticona, ciclopentasiloxano, vitamina E, fragancia.',
    specs: [
      ['Marca', 'Garnier'],
      ['Presentación', '100 ml / 150 ml'],
      ['Tipo de cabello', 'Seco / Rizado'],
      ['Beneficio', 'Nutrición y definición'],
      ['Registro INVIMA', 'NSOC-02987-2021'],
    ],
  },
  {
    id: 'tonico-anticaida',
    name: 'Tónico Anticaída de Tratamiento',
    brand: 'Vichy',
    category: 'Cabello',
    subcategory: 'Tratamiento',
    price: 79900,
    oldPrice: null,
    rating: 4.5,
    reviews: 19,
    stock: 8,
    badge: 'Nuevo',
    needs: ['Caída'],
    hairType: 'Fino',
    images: [IMG.tan2],
    variantType: 'none',
    variants: [{ label: '200 ml', price: 79900, stock: 8, image: IMG.tan2 }],
    description: 'Tratamiento intensivo que fortalece el folículo y reduce la caída por rotura. Con aminexil y agua termal de Vichy.',
    howToUse: 'Aplica 8–10 gotas directamente sobre el cuero cabelludo seco o húmedo, masajea y no enjuagues. Usa 3 veces por semana durante 6 semanas.',
    ingredients: 'Aqua, aminexil, alcohol denat., pantenol, agua termal de Vichy.',
    specs: [
      ['Marca', 'Vichy'],
      ['Presentación', '200 ml'],
      ['Tipo de cabello', 'Fino / Débil'],
      ['Beneficio', 'Anticaída'],
      ['Registro INVIMA', 'NSOC-04021-2022'],
    ],
  },
  {
    id: 'mascarilla-rizos',
    name: 'Mascarilla Rizos Definición',
    brand: 'Garnier',
    category: 'Cabello',
    subcategory: 'Mascarilla',
    price: 49900,
    oldPrice: null,
    rating: 4.6,
    reviews: 24,
    stock: 11,
    badge: null,
    needs: ['Rizos', 'Frizz'],
    hairType: 'Rizado',
    images: [IMG.brown10],
    variantType: 'none',
    variants: [{ label: '300 ml', price: 49900, stock: 11, image: IMG.brown10 }],
    description: 'Define y suaviza los rizos sin apelmazar. Fórmula con manteca de karité que hidrata y controlea el encrespamiento hasta 72 horas.',
    howToUse: 'Aplica sobre el cabello mojado, desenreda con los dedos y enjuaga. Para más definición, deja actuar 2 minutos antes de enjuagar.',
    ingredients: 'Aqua, manteca de karité, aceite de coco, glicerina, proteína de trigo.',
    specs: [
      ['Marca', 'Garnier'],
      ['Presentación', '300 ml'],
      ['Tipo de cabello', 'Rizado'],
      ['Beneficio', 'Definición de rizos'],
      ['Registro INVIMA', 'NSOC-02764-2020'],
    ],
  },
  {
    id: 'serum-vitamina-c',
    name: 'Sérum Vitamina C 30 ml',
    brand: 'La Roche-Posay',
    category: 'Rostro',
    subcategory: 'Sérum',
    price: 119900,
    oldPrice: 139900,
    rating: 4.8,
    reviews: 58,
    stock: 10,
    badge: 'Bestseller',
    needs: ['Manchas'],
    hairType: null,
    images: [IMG.orange14],
    variantType: 'size',
    variants: [
      { label: '30 ml', price: 119900, oldPrice: 139900, stock: 10, image: IMG.orange14 },
      { label: '50 ml', price: 159900, oldPrice: 179900, stock: 3, image: IMG.orange14 },
    ],
    description: 'Sérum concentrado con vitamina C pura que unifica el tono, reduce manchas y aporta luminosidad. Antioxidante de uso diario.',
    howToUse: 'Aplica 4–5 gotas sobre el rostro limpio y seco por la mañana y/o noche. Usa protector solar durante el día.',
    ingredients: 'Agua termal, vitamina C (ácido ascórbico 10%), ácido salicílico, niacinamida, tocoferol.',
    specs: [
      ['Marca', 'La Roche-Posay'],
      ['Presentación', '30 ml / 50 ml'],
      ['Tipo de piel', 'Todo tipo'],
      ['Beneficio', 'Antimanchas y luminosidad'],
      ['Registro INVIMA', 'NSOC-04562-2021'],
    ],
  },
  {
    id: 'serum-hialuronico',
    name: 'Sérum Ácido Hialurónico',
    brand: 'Vichy',
    category: 'Rostro',
    subcategory: 'Sérum',
    price: 109900,
    oldPrice: null,
    rating: 4.7,
    reviews: 44,
    stock: 13,
    badge: null,
    needs: ['Piel sensible'],
    hairType: null,
    images: [IMG.blue8],
    variantType: 'none',
    variants: [{ label: '30 ml', price: 109900, stock: 13, image: IMG.blue8 }],
    description: 'Hidratación profunda con ácido hialurónico fragmentado que rellena y suaviza la piel. Apto para pieles sensibles.',
    howToUse: 'Aplica 5 gotas sobre el rostro limpio, masajea suavemente y continúa con tu crema hidratante. Úsalo mañana y noche.',
    ingredients: 'Ácido hialurónico, aqua, glicerina, alcohol denat., vitamina E.',
    specs: [
      ['Marca', 'Vichy'],
      ['Presentación', '30 ml'],
      ['Tipo de piel', 'Sensible'],
      ['Beneficio', 'Hidratación profunda'],
      ['Registro INVIMA', 'NSOC-04118-2022'],
    ],
  },
  {
    id: 'crema-hidratante',
    name: 'Crema Hidratante Piel Sensible',
    brand: 'CeraVe',
    category: 'Rostro',
    subcategory: 'Hidratante',
    price: 74900,
    oldPrice: null,
    rating: 4.9,
    reviews: 112,
    stock: 18,
    badge: 'Bestseller',
    needs: ['Piel sensible'],
    hairType: null,
    images: [IMG.neutral0],
    variantType: 'size',
    variants: [
      { label: '50 ml', price: 74900, stock: 18, image: IMG.neutral0 },
      { label: '88 ml', price: 94900, stock: 9, image: IMG.neutral0 },
    ],
    description: 'Hidratación 24 horas con ceramidas y ácido hialurónico. Restaura la barrera cutánea y calma la piel sensible o reactiva.',
    howToUse: 'Aplica sobre el rostro y cuello limpios, con ligeros masajes ascendentes. Úsala mañana y noche.',
    ingredients: 'Aqua, ceramidas NP/AP/EOP, ácido hialurónico, glicerina, niacinamida.',
    specs: [
      ['Marca', 'CeraVe'],
      ['Presentación', '50 ml / 88 ml'],
      ['Tipo de piel', 'Sensible / Seca'],
      ['Beneficio', 'Restaura barrera cutánea'],
      ['Registro INVIMA', 'NSOC-03988-2020'],
    ],
  },
  {
    id: 'protector-solar',
    name: 'Protector Solar FPS 50+',
    brand: 'La Roche-Posay',
    category: 'Rostro',
    subcategory: 'Protección solar',
    price: 99900,
    oldPrice: null,
    rating: 4.7,
    reviews: 76,
    stock: 22,
    badge: null,
    needs: ['Piel sensible'],
    hairType: null,
    images: [IMG.pale5],
    variantType: 'none',
    variants: [{ label: '50 ml', price: 99900, stock: 22, image: IMG.pale5 }],
    description: 'Protección muy alta UVA/UVB con textura ligera que no deja residuo graso. Ideal para pieles sensibles y uso diario.',
    howToUse: 'Aplica generosamente 15 minutos antes de exponerte al sol. Reaplica cada 2 horas y después de sudar o nadar.',
    ingredients: 'Filtros UVA/UVB, aqua, glicerina, vitamina E, agua termal.',
    specs: [
      ['Marca', 'La Roche-Posay'],
      ['Presentación', '50 ml'],
      ['FPS', '50+'],
      ['Tipo de piel', 'Sensible'],
      ['Registro INVIMA', 'NSOC-04320-2021'],
    ],
  },
  {
    id: 'tonico-facial',
    name: 'Tónico Facial Calmante',
    brand: 'Eucerin',
    category: 'Rostro',
    subcategory: 'Tónico',
    price: 42900,
    oldPrice: null,
    rating: 4.5,
    reviews: 33,
    stock: 16,
    badge: null,
    needs: ['Piel sensible'],
    hairType: null,
    images: [IMG.neutral3],
    variantType: 'none',
    variants: [{ label: '200 ml', price: 42900, stock: 16, image: IMG.neutral3 }],
    description: 'Tónico sin alcohol que calma, refresca y prepara la piel para la hidratación. Apto para pieles sensibles y reactivas.',
    howToUse: 'Aplica por la mañana y noche con un algodón o con las manos limpias, después de limpiar el rostro.',
    ingredients: 'Aqua, glicerina, pantenol, extracto de avena, poloxámero.',
    specs: [
      ['Marca', 'Eucerin'],
      ['Presentación', '200 ml'],
      ['Tipo de piel', 'Sensible / Reactiva'],
      ['Alcohol', 'Sin alcohol'],
      ['Registro INVIMA', 'NSOC-03654-2019'],
    ],
  },
  {
    id: 'contorno-ojos',
    name: 'Contorno de Ojos Anti-edad',
    brand: 'Eucerin',
    category: 'Rostro',
    subcategory: 'Contorno de ojos',
    price: 58900,
    oldPrice: null,
    rating: 4.4,
    reviews: 15,
    stock: 7,
    badge: 'Nuevo',
    needs: [],
    hairType: null,
    images: [IMG.taupe15],
    variantType: 'none',
    variants: [{ label: '15 ml', price: 58900, stock: 7, image: IMG.taupe15 }],
    description: 'Reduce visiblemente las arrugas y las ojeras del contorno de ojos. Textura ligera de rápida absorción con ácido hialurónico.',
    howToUse: 'Aplica una pequeña cantidad con el dedo anular dando toques suaves desde el lagrimal hacia la sien. Úsala mañana y noche.',
    ingredients: 'Ácido hialurónico, glicerina, aqua, vitamina E, cafeína.',
    specs: [
      ['Marca', 'Eucerin'],
      ['Presentación', '15 ml'],
      ['Tipo de piel', 'Todo tipo'],
      ['Beneficio', 'Antiarrugas y anti-ojeas'],
      ['Registro INVIMA', 'NSOC-04701-2022'],
    ],
  },
  {
    id: 'crema-corporal',
    name: 'Crema Corporal Reparadora',
    brand: 'Eucerin',
    category: 'Cuerpo',
    subcategory: 'Crema corporal',
    price: 69900,
    oldPrice: null,
    rating: 4.8,
    reviews: 51,
    stock: 14,
    badge: null,
    needs: ['Piel sensible'],
    hairType: null,
    images: [IMG.brown17],
    variantType: 'size',
    variants: [
      { label: '250 ml', price: 69900, stock: 14, image: IMG.brown17 },
      { label: '400 ml', price: 89900, stock: 6, image: IMG.brown17 },
    ],
    description: 'Repara la piel seca y rugosa del cuerpo con ceramidas y urea. Hidratación intensa por 48 horas sin sensación pegajosa.',
    howToUse: 'Aplica sobre la piel limpia con un masaje circular hasta absorber. Úsala después de la ducha.',
    ingredients: 'Aqua, urea 5%, ceramidas, glicerina, manteca de karité.',
    specs: [
      ['Marca', 'Eucerin'],
      ['Presentación', '250 ml / 400 ml'],
      ['Tipo de piel', 'Seca / Áspera'],
      ['Beneficio', 'Reparación corporal'],
      ['Registro INVIMA', 'NSOC-03812-2019'],
    ],
  },
  {
    id: 'aceite-corporal',
    name: 'Aceite Corporal Nutritivo',
    brand: 'Nivea',
    category: 'Cuerpo',
    subcategory: 'Aceite corporal',
    price: 52900,
    oldPrice: null,
    rating: 4.6,
    reviews: 38,
    stock: 19,
    badge: null,
    needs: [],
    hairType: null,
    images: [IMG.amber9],
    variantType: 'none',
    variants: [{ label: '200 ml', price: 52900, stock: 19, image: IMG.amber9 }],
    description: 'Aceite seco con aceite de almendras y vitamina E que nutre la piel sin dejar residuo graso. Brillo suave y sedoso.',
    howToUse: 'Aplica sobre la piel húmeda o seca, masajea hasta absorber. Úsalo después de la ducha o antes de dormir.',
    ingredients: 'Aceite de almendras, vitamina E, aceite de girasol, fragancia.',
    specs: [
      ['Marca', 'Nivea'],
      ['Presentación', '200 ml'],
      ['Tipo de piel', 'Normal / Seca'],
      ['Textura', 'Seca'],
      ['Registro INVIMA', 'NSOC-03544-2018'],
    ],
  },
  {
    id: 'labial-mate',
    name: 'Labial Mate de Larga Duración',
    brand: 'Maybelline',
    category: 'Maquillaje',
    subcategory: 'Labial',
    price: 39900,
    oldPrice: null,
    rating: 4.5,
    reviews: 89,
    stock: 24,
    badge: 'Bestseller',
    needs: [],
    hairType: null,
    images: [IMG.red11],
    variantType: 'shade',
    variants: [
      { label: 'Rojo', price: 39900, stock: 8, image: IMG.red11, color: '#B3261E' },
      { label: 'Rosa', price: 39900, stock: 9, image: IMG.rose18, color: '#D97A8C' },
      { label: 'Nude', price: 39900, stock: 5, image: IMG.neutral1, color: '#C89B7B' },
      { label: 'Vino', price: 39900, stock: 2, image: IMG.mauve4, color: '#7A2E3A' },
    ],
    description: 'Color intenso con acabado mate que dura hasta 12 horas sin resecar los labios. Fórmula cremosa y confortable.',
    howToUse: 'Aplica desde el centro de los labios hacia las comisuras. Para mayor definición, usa primero un delineador labial.',
    ingredients: 'Octildodecanol, cera carnauba, pigmentos, vitamina E, aceite de jojoba.',
    specs: [
      ['Marca', 'Maybelline'],
      ['Presentación', '3,6 g'],
      ['Tonos', 'Rojo · Rosa · Nude · Vino'],
      ['Acabado', 'Mate'],
      ['Registro INVIMA', 'NSOC-04810-2021'],
    ],
  },
  {
    id: 'rubor-crema',
    name: 'Rubor en Crema',
    brand: 'Maybelline',
    category: 'Maquillaje',
    subcategory: 'Rubor',
    price: 34900,
    oldPrice: null,
    rating: 4.6,
    reviews: 27,
    stock: 17,
    badge: null,
    needs: [],
    hairType: null,
    images: [IMG.rose18],
    variantType: 'shade',
    variants: [
      { label: 'Durazno', price: 34900, stock: 9, image: IMG.rose18, color: '#E8A08A' },
      { label: 'Rosado', price: 34900, stock: 8, image: IMG.mauve4, color: '#D97A8C' },
    ],
    description: 'Rubor en crema de textura ligera que se funde con la piel y aporta un rubor natural y duradero.',
    howToUse: 'Aplica con los dedos o una brocha pequeña en las manzanas de las mejillas y difumina hacia los pómulos.',
    ingredients: 'Aqua, glicerina, pigmentos, vitamina E, extracto de algodón.',
    specs: [
      ['Marca', 'Maybelline'],
      ['Presentación', '6 g'],
      ['Tonos', 'Durazno · Rosado'],
      ['Acabado', 'Natural / Cremoso'],
      ['Registro INVIMA', 'NSOC-04922-2022'],
    ],
  },
];

const REVIEW_POOL = [
  { author: 'Mariana G.', rating: 5, text: 'Me encantó. Llevo tres semanas usándolo y el cambio se nota muchísimo.', date: 'hace 2 semanas', verified: true },
  { author: 'Carolina P.', rating: 5, text: 'Buena calidad y llegó rapidísimo. Volveré a comprar seguro.', date: 'hace 1 mes', verified: true },
  { author: 'Daniela R.', rating: 4, text: 'Cumple lo que promete, aunque el empaque podría llegar mejor protegido.', date: 'hace 3 semanas', verified: true },
  { author: 'Luisa M.', rating: 5, text: 'Noté la diferencia desde la primera aplicación. Lo recomiendo a todas.', date: 'hace 2 meses', verified: true },
  { author: 'Andrea S.', rating: 4, text: 'Me gusta, pero esperaba ver resultados un poco más rápido.', date: 'hace 1 mes', verified: false },
  { author: 'Paola V.', rating: 5, text: 'Excelente relación calidad-precio. Además la asesoría fue muy amable.', date: 'hace 3 semanas', verified: true },
];

/* ── 3. Reference data ────────────────────────────────────── */
const DEPARTMENTS = {
  'Bogotá D.C.': ['Bogotá'],
  'Antioquia': ['Medellín', 'Envigado', 'Itagüí', 'Sabaneta', 'Bello'],
  'Valle del Cauca': ['Cali', 'Palmira'],
  'Atlántico': ['Barranquilla', 'Soledad'],
  'Santander': ['Bucaramanga', 'Floridablanca'],
  'Cundinamarca': ['Chía', 'Zipaquirá', 'Soacha'],
  'Bolívar': ['Cartagena'],
  'Risaralda': ['Pereira'],
  'Quindío': ['Armenia'],
  'Nariño': ['Pasto'],
  'Meta': ['Villavicencio'],
};

const STORE_PICKUP = [
  'Bogotá — Zona Rosa',
  'Medellín — El Poblado',
  'Cali — Centro',
];

const COUPONS = {
  ADRIANA10: { type: 'percent', value: 10, label: '10% de descuento' },
  ENVIOGRATIS: { type: 'shipping', value: 0, label: 'Envío gratis' },
};

const FREE_SHIPPING_THRESHOLD = 150000;
const FLAT_SHIPPING = 9900;
const SAME_DAY_CITIES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Pereira', 'Armenia', 'Cartagena'];

const PAYMENT_METHODS = [
  { id: 'tarjeta', label: 'Tarjeta de crédito o débito', hint: 'Visa · Mastercard · Amex', icon: 'TC' },
  { id: 'pse', label: 'PSE', hint: 'Pago seguro en línea desde tu banco', icon: 'PSE' },
  { id: 'nequi', label: 'Nequi', hint: 'Aprobación inmediata con tu celular', icon: 'NQ' },
  { id: 'cod', label: 'Contraentrega (COD)', hint: 'Pagas al recibir · aplica en ciudades principales', icon: 'COD' },
  { id: 'bnpl', label: 'BNPL Wompi SU+Pay', hint: '1 a 12 cuotas · aprobación en minutos', icon: 'WP' },
];

/* ── 4. State ──────────────────────────────────────────────── */
const state = {
  route: { name: 'home', id: null, query: {} },
  filters: {
    brands: [],
    needs: [],
    hairTypes: [],
    minPrice: 0,
    maxPrice: 200000,
    minRating: 0,
    inStock: false,
    q: '',
    cat: null,
  },
  sort: 'relevancia',
  visibleCount: 8,
  cart: [],
  wishlist: [],
  pdp: { id: null, variantLabel: null, qty: 1, imageIndex: 0 },
  checkout: {
    step: 1,
    data: {},
    errors: {},
    coupon: null,
    pickup: false,
    payment: 'tarjeta',
    installments: 3,
    processing: false,
    lastOrder: null,
  },
};

/* ── 5. Utils ──────────────────────────────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatCOP(value) {
  return '$' + Math.round(value).toLocaleString('es-CO');
}

function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

function getVariant(product, label) {
  if (!product || !label) return null;
  return product.variants.find((v) => v.label === label) || null;
}

function defaultVariant(product) {
  if (!product) return null;
  if (!product.variants || product.variants.length === 0) return null;
  const inStock = product.variants.filter((v) => v.stock > 0);
  const pool = inStock.length > 0 ? inStock : product.variants;
  // Entry variant = cheapest in stock, so the PDP opens at the "desde" price
  // shown on the product card (card/PDP price consistency).
  return pool.reduce((min, variant) => (variant.price < min.price ? variant : min), pool[0]);
}

function variantOldPrice(variant, product) {
  if (!variant) return product.oldPrice ?? null;
  return variant.oldPrice ?? product.oldPrice ?? null;
}

function getCardPriceInfo(product) {
  const variant = defaultVariant(product);
  const price = variant ? variant.price : product.price;
  const oldPrice = variantOldPrice(variant, product);
  const inStockPrices = product.variants.filter((v) => v.stock > 0).map((v) => v.price);
  const prices = inStockPrices.length ? inStockPrices : product.variants.map((v) => v.price);
  const from = prices.length > 0 && new Set(prices).size > 1;
  return { price, oldPrice: oldPrice && oldPrice > price ? oldPrice : null, from };
}

function getProductPrice(product, variantLabel) {
  const variant = getVariant(product, variantLabel);
  return variant ? variant.price : product.price;
}

function getProductStock(product, variantLabel) {
  const variant = getVariant(product, variantLabel);
  return variant ? variant.stock : product.stock;
}

function getProductImage(product, variantLabel) {
  const variant = getVariant(product, variantLabel);
  if (variant && variant.image) return variant.image;
  return product.images[0];
}

function getProductVariantType(product) {
  if (product.variantType === 'shade') return 'shade';
  if (product.variantType === 'size' && product.variants.length > 1) return 'size';
  return 'none';
}

function stockLabel(stock) {
  if (stock <= 0) return { text: 'Agotado', className: 'stock-status--out' };
  if (stock <= 5) return { text: `¡Quedan ${stock} unidades!`, className: 'stock-status--low' };
  return { text: 'Disponible', className: 'stock-status--ok' };
}

function etaText(city) {
  if (!city) return 'Llega mañana en Bogotá';
  return SAME_DAY_CITIES.includes(city)
    ? `Llega mañana a ${city}`
    : `Llega en 2–3 días hábiles a ${city}`;
}

function starSvg(fillPercent = 1) {
  return `<span class="star" style="--fill:${Math.max(0, Math.min(1, fillPercent))}">
    <svg class="star__bg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4l-5.8 3 1.1-6.4L2.6 9.4l6.5-.9L12 2.6Z"/></svg>
    <span class="star__fg"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4l-5.8 3 1.1-6.4L2.6 9.4l6.5-.9L12 2.6Z"/></svg></span>
  </span>`;
}

function stars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i += 1) {
    const fill = Math.max(0, Math.min(1, rating - (i - 1)));
    html += starSvg(fill);
  }
  return html;
}

function icon(name) {
  const paths = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    cart: '<path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.2L20 8H6"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
    heart: '<path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 0 1 12 5.7a5 5 0 0 1 7.5 6.9Z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="m5 13 4 4L19 7"/>',
    truck: '<path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    store: '<path d="M4 10v10h16V10M4 10 6 4h12l2 6M4 10h16M9 20v-6h6v6"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    returns: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
}

function productUrl(id) {
  return `#/pdp/${id}`;
}

function salePercent(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
}

/* ── 6. Cart ───────────────────────────────────────────────── */
function loadCart() {
  try {
    const raw = localStorage.getItem('adriana_cart_v1');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem('adriana_cart_v1', JSON.stringify(state.cart));
  } catch {
    /* storage unavailable — ignore */
  }
}

/* The last order survives a reload within the same tab (sessionStorage). */
function saveLastOrder(order) {
  try {
    sessionStorage.setItem('adriana_last_order_v1', JSON.stringify(order));
  } catch {
    /* storage unavailable — ignore */
  }
}

function loadLastOrder() {
  try {
    const raw = sessionStorage.getItem('adriana_last_order_v1');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* Orders booked by number so the customer can track them later (local demo). */
function loadOrders() {
  try {
    const raw = localStorage.getItem('adriana_orders_v1');
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveOrder(order) {
  try {
    const orders = loadOrders();
    orders[order.number] = { ...order, createdAt: Date.now() };
    localStorage.setItem('adriana_orders_v1', JSON.stringify(orders));
  } catch {
    /* storage unavailable — ignore */
  }
}

function loadWishlist() {
  try {
    const raw = localStorage.getItem('adriana_wishlist_v1');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWishlist() {
  try {
    localStorage.setItem('adriana_wishlist_v1', JSON.stringify(state.wishlist));
  } catch {
    /* ignore */
  }
}

function cartCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function cartSubtotal() {
  return state.cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    if (!product) return sum;
    return sum + getProductPrice(product, item.variant) * item.qty;
  }, 0);
}

function addToCart(productId, variantLabel, qty = 1) {
  const product = getProduct(productId);
  if (!product) return;
  const variant = getVariant(product, variantLabel) || defaultVariant(product);
  const label = variant ? variant.label : null;
  const stock = variant ? variant.stock : product.stock;
  const existing = state.cart.find((i) => i.id === productId && i.variant === label);
  const currentQty = existing ? existing.qty : 0;
  const nextQty = Math.min(currentQty + qty, Math.max(stock, 0));
  if (nextQty <= 0) {
    toast('No hay stock disponible para este producto.', 'error');
    return;
  }
  if (existing) existing.qty = nextQty;
  else state.cart.push({ id: productId, variant: label, qty: nextQty });
  saveCart();
  updateCartCount();
  renderDrawer();
  syncCheckoutIfActive();
  const name = `${product.name}${label ? ` (${label})` : ''}`;
  if (nextQty === currentQty + qty) toast(`${name} agregado al carrito`);
  else toast(`Solo quedan ${nextQty} unidades de ${name}`, 'error');
}

function updateCartItem(key, qty) {
  const item = state.cart.find((i) => i.id + '|' + i.variant === key);
  if (!item) return;
  const product = getProduct(item.id);
  const stock = product ? getProductStock(product, item.variant) : 99;
  if (qty <= 0) {
    state.cart = state.cart.filter((i) => i !== item);
  } else {
    item.qty = Math.min(qty, stock);
  }
  saveCart();
  updateCartCount();
  renderDrawer();
  syncCheckoutIfActive();
}

function removeCartItem(key) {
  state.cart = state.cart.filter((i) => i.id + '|' + i.variant !== key);
  saveCart();
  updateCartCount();
  renderDrawer();
  syncCheckoutIfActive();
}

function updateCartCount() {
  const count = cartCount();
  const badge = $('#cart-count');
  if (!badge) return;
  badge.textContent = String(count);
  badge.classList.remove('cart-count--bump');
  void badge.offsetWidth;
  badge.classList.add('cart-count--bump');
  const cartBtn = $('.cart-btn');
  if (cartBtn) {
    cartBtn.setAttribute('aria-label', `Abrir carrito de compras, ${count} ${count === 1 ? 'ítem' : 'ítems'}`);
  }
}

function cartKey(item) {
  return `${item.id}|${item.variant}`;
}

/* ── 7. Toast + announcements ──────────────────────────────── */
function toast(message, type = 'success') {
  const region = $('#toast-region');
  if (!region) return;
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' toast--error' : ''}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = `${icon(type === 'error' ? 'close' : 'check')}<span>${escapeHtml(message)}</span>`;
  region.appendChild(el);
  window.setTimeout(() => {
    el.classList.add('toast--leaving');
    window.setTimeout(() => el.remove(), 200);
  }, 3200);
}

/* ── 8. Router ─────────────────────────────────────────────── */
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '') || 'home';
  const [path, qs] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  const parts = path.split('/').filter(Boolean);
  let productId = null;
  if (parts[0] === 'pdp' && parts[1]) {
    try {
      productId = decodeURIComponent(parts[1]);
    } catch {
      productId = parts[1];
    }
  }
  if (parts[0] === 'plp') return { name: 'plp', query };
  if (parts[0] === 'pdp' && productId) return { name: 'pdp', id: productId, query };
  if (parts[0] === 'checkout') return { name: 'checkout', query };
  if (parts[0] === 'confirmation') return { name: 'confirmation', query };
  if (parts[0] === 'tracking') return { name: 'tracking', query };
  return { name: 'home', query };
}

function navigate(hash) {
  if (window.location.hash === hash) {
    renderRoute();
  } else {
    window.location.hash = hash;
  }
}

function setActiveView(name) {
  $$('.view').forEach((view) => {
    const active = view.id === `view-${name}`;
    view.classList.toggle('view--active', active);
    view.hidden = !active;
  });
}

function renderRoute() {
  const route = parseHash();
  state.route = route;
  closeAllOverlays();
  setActiveView(route.name);
  window.scrollTo({ top: 0, behavior: 'auto' });

  if (route.name === 'home') {
    renderHome();
    document.title = 'Adriana Tienda — Belleza y cuidado personal';
  } else if (route.name === 'plp') {
    applyQueryToFilters(route.query);
    renderPLP();
    document.title = 'Catálogo — Adriana Tienda';
  } else if (route.name === 'pdp') {
    renderPDP(route.id, route.query);
    document.title = 'Producto — Adriana Tienda';
  } else if (route.name === 'checkout') {
    renderCheckout();
    document.title = 'Checkout — Adriana Tienda';
  } else if (route.name === 'confirmation') {
    renderConfirmation();
    document.title = 'Pedido confirmado — Adriana Tienda';
  } else if (route.name === 'tracking') {
    renderTracking(route.query);
    document.title = 'Rastrear pedido — Adriana Tienda';
  }
}

/* ── 9. Filters ────────────────────────────────────────────── */
function defaultFilters() {
  return {
    brands: [], needs: [], hairTypes: [],
    minPrice: 0, maxPrice: 200000, minRating: 0,
    inStock: false, q: '', cat: null,
  };
}

function applyQueryToFilters(query) {
  state.filters = defaultFilters();
  state.sort = query.sort || 'relevancia';
  state.visibleCount = 8;
  if (query.cat) state.filters.cat = query.cat.toLowerCase();
  if (query.need) state.filters.needs = [query.need];
  if (query.brand) state.filters.brands = [decodeURIComponent(query.brand)];
  if (query.q) state.filters.q = query.q;
}

function filteredProducts() {
  const f = state.filters;
  let list = PRODUCTS.slice();

  if (f.cat && f.cat !== 'ofertas') list = list.filter((p) => p.category.toLowerCase() === f.cat);
  if (f.cat === 'ofertas') list = list.filter((p) => p.oldPrice && p.oldPrice > p.price);
  if (f.brands.length) list = list.filter((p) => f.brands.includes(p.brand));
  if (f.needs.length) list = list.filter((p) => p.needs.some((n) => f.needs.includes(n)));
  if (f.hairTypes.length) list = list.filter((p) => p.hairType && f.hairTypes.includes(p.hairType));
  if (f.inStock) list = list.filter((p) => p.stock > 0);
  if (f.minRating > 0) list = list.filter((p) => p.rating >= f.minRating);
  list = list.filter((p) => {
    const price = p.price;
    const max = f.maxPrice >= 200000 ? Infinity : f.maxPrice;
    return price >= f.minPrice && price <= max;
  });
  if (f.q) {
    const q = f.q.toLowerCase();
    list = list.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q));
  }

  switch (state.sort) {
    case 'precio-asc': list.sort((a, b) => a.price - b.price); break;
    case 'precio-desc': list.sort((a, b) => b.price - a.price); break;
    case 'novedad': list.sort((a, b) => (a.badge === 'Nuevo' ? -1 : 1) - (b.badge === 'Nuevo' ? -1 : 1)); break;
    case 'rating': list.sort((a, b) => b.rating - a.rating); break;
    default: list.sort((a, b) => b.reviews - a.reviews);
  }
  return list;
}

function activeFilterChips() {
  const f = state.filters;
  const chips = [];
  if (f.cat && f.cat !== 'ofertas') chips.push({ key: 'cat', label: categoryLabel(f.cat) });
  if (f.cat === 'ofertas') chips.push({ key: 'cat', label: 'Ofertas' });
  f.brands.forEach((b) => chips.push({ key: 'brand', label: b, value: b }));
  f.needs.forEach((n) => chips.push({ key: 'need', label: n, value: n }));
  f.hairTypes.forEach((h) => chips.push({ key: 'hairType', label: h, value: h }));
  if (f.minPrice > 0 || f.maxPrice < 200000) {
    chips.push({ key: 'price', label: `${formatCOP(f.minPrice)} – ${f.maxPrice >= 200000 ? '∞' : formatCOP(f.maxPrice)}` });
  }
  if (f.minRating > 0) chips.push({ key: 'rating', label: `${f.minRating}+ estrellas` });
  if (f.inStock) chips.push({ key: 'stock', label: 'Disponible' });
  if (f.q) chips.push({ key: 'q', label: `“${f.q}”` });
  return chips;
}

function removeFilterChip(key, value) {
  const f = state.filters;
  if (key === 'cat') f.cat = null;
  else if (key === 'brand') f.brands = f.brands.filter((x) => x !== value);
  else if (key === 'need') f.needs = f.needs.filter((x) => x !== value);
  else if (key === 'hairType') f.hairTypes = f.hairTypes.filter((x) => x !== value);
  else if (key === 'price') { f.minPrice = 0; f.maxPrice = 200000; }
  else if (key === 'rating') f.minRating = 0;
  else if (key === 'stock') f.inStock = false;
  else if (key === 'q') f.q = '';
  state.visibleCount = 8;
  renderPLP();
}

function categoryLabel(cat) {
  const found = CATEGORIES.find((c) => c.toLowerCase() === cat);
  return found || cat;
}

/* ── 10. Product card ──────────────────────────────────────── */
function productBadges(product, price, oldPrice) {
  const badges = [];
  if (product.badge === 'Nuevo') badges.push('<span class="badge badge--new">Nuevo</span>');
  const sale = salePercent(price, oldPrice);
  if (sale) badges.push(`<span class="badge badge--sale">-${sale}%</span>`);
  if (product.badge === 'Bestseller') badges.push('<span class="badge badge--bestseller">Bestseller</span>');
  if (product.stock <= 0) badges.push('<span class="badge badge--out">Agotado</span>');
  return badges.join('');
}

function productCard(product, index = 0) {
  const priceInfo = getCardPriceInfo(product);
  const price = priceInfo.price;
  const sale = salePercent(price, priceInfo.oldPrice);
  const wished = state.wishlist.includes(product.id);
  const out = product.stock <= 0;
  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="product-card__media">
        <a href="${productUrl(product.id)}" data-nav data-action="open-pdp" data-id="${product.id}" aria-label="${escapeHtml(product.name)}">
          <img src="${product.images[0]}" alt="${escapeHtml(product.name)} de ${escapeHtml(product.brand)}" loading="${index < 4 ? 'eager' : 'lazy'}" width="206" height="206">
        </a>
        <div class="product-card__badges">${productBadges(product, price, priceInfo.oldPrice)}</div>
        <button class="product-card__wish icon-btn" type="button" aria-label="Guardar ${escapeHtml(product.name)} en tu lista" aria-pressed="${wished}" data-action="wishlist" data-id="${product.id}">
          ${icon('heart')}
        </button>
      </div>
      <div class="product-card__body">
        <p class="product-card__brand">${escapeHtml(product.brand)}</p>
        <h3 class="product-card__name">
          <a href="${productUrl(product.id)}" data-nav data-action="open-pdp" data-id="${product.id}">${escapeHtml(product.name)}</a>
        </h3>
        <div class="product-card__rating">
          <span class="stars" aria-label="${product.rating} de 5 estrellas">${stars(product.rating)}</span>
          <span class="rating-text">${product.rating.toFixed(1)} (${product.reviews})</span>
        </div>
        <div class="product-card__price-row">
          ${priceInfo.from ? '<span class="price-from">desde</span>' : ''}
          <span class="price">${formatCOP(price)}</span>
          ${sale ? `<span class="price--old">${formatCOP(priceInfo.oldPrice)}</span>` : ''}
        </div>
        <button class="product-card__quick" type="button" data-action="quick-add" data-id="${product.id}" aria-label="Agregar ${escapeHtml(product.name)} al carrito" ${out ? 'disabled' : ''}>
          ${icon('plus')} ${out ? 'Agotado' : 'Agregar'}
        </button>
      </div>
    </article>
  `;
}

/* ── 11. Home ──────────────────────────────────────────────── */
function renderHeaderStatic() {
  const brandsPanel = $('#brands-panel');
  if (brandsPanel && !brandsPanel.dataset.rendered) {
    brandsPanel.innerHTML = BRANDS.map((brand) =>
      `<a href="#/plp?brand=${encodeURIComponent(brand)}" data-nav>${escapeHtml(brand)}</a>`).join('');
    brandsPanel.dataset.rendered = '1';
  }
  const mobileBrands = $('#mobile-brands');
  if (mobileBrands && !mobileBrands.dataset.rendered) {
    mobileBrands.innerHTML = BRANDS.map((brand) =>
      `<a class="brand-pill" href="#/plp?brand=${encodeURIComponent(brand)}" data-nav>${escapeHtml(brand)}</a>`).join('');
    mobileBrands.dataset.rendered = '1';
  }
}

function renderHome() {
  const track = $('#brands-track');
  if (track && !track.dataset.rendered) {
    track.innerHTML = BRANDS.map((brand) =>
      `<a class="brand-pill" href="#/plp?brand=${encodeURIComponent(brand)}" data-nav>${escapeHtml(brand)}</a>`).join('');
    track.dataset.rendered = '1';
  }

  const needsChips = $('#needs-chips');
  if (needsChips && !needsChips.dataset.rendered) {
    needsChips.innerHTML = NEEDS.map((need) =>
      `<li><a class="chip" href="#/plp?need=${encodeURIComponent(need)}" data-nav>${escapeHtml(need)}</a></li>`).join('');
    needsChips.dataset.rendered = '1';
  }

  const aggregateStars = $('.reviews-aggregate .stars');
  if (aggregateStars && !aggregateStars.dataset.rendered) {
    aggregateStars.innerHTML = stars(4.8);
    aggregateStars.dataset.rendered = '1';
  }

  const bestsellers = $('#bestsellers-grid');
  if (bestsellers && !bestsellers.dataset.rendered) {
    const top = PRODUCTS.slice().sort((a, b) => b.reviews - a.reviews).slice(0, 8);
    bestsellers.innerHTML = top.map((p, i) => productCard(p, i)).join('');
    bestsellers.dataset.rendered = '1';
  }
}

/* ── 12. PLP ───────────────────────────────────────────────── */
function renderFilters(context = 'rail') {
  const f = state.filters;
  // Unique IDs per context (rail vs. mobile sheet) to avoid duplicate DOM ids.
  const fid = (name) => `${name}-${context}`;
  const brandOptions = BRANDS.map((brand) => {
    const count = PRODUCTS.filter((p) => p.brand === brand).length;
    return `<label class="filter-option">
      <input type="checkbox" name="brands" value="${escapeHtml(brand)}" ${f.brands.includes(brand) ? 'checked' : ''} data-filter="brands">
      <span>${escapeHtml(brand)}</span><span class="count">${count}</span>
    </label>`;
  }).join('');

  const needOptions = NEEDS.map((need) => {
    const count = PRODUCTS.filter((p) => p.needs.includes(need)).length;
    return `<label class="filter-option">
      <input type="checkbox" name="needs" value="${escapeHtml(need)}" ${f.needs.includes(need) ? 'checked' : ''} data-filter="needs">
      <span>${escapeHtml(need)}</span><span class="count">${count}</span>
    </label>`;
  }).join('');

  const hairOptions = HAIR_TYPES.map((type) => {
    const count = PRODUCTS.filter((p) => p.hairType === type).length;
    return `<label class="filter-option">
      <input type="checkbox" name="hairTypes" value="${escapeHtml(type)}" ${f.hairTypes.includes(type) ? 'checked' : ''} data-filter="hairTypes">
      <span>${escapeHtml(type)}</span><span class="count">${count}</span>
    </label>`;
  }).join('');

  const ratingOptions = [4.5, 4, 3.5, 3].map((r) => `
    <label class="radio">
      <input type="radio" name="minRating" value="${r}" data-filter="minRating" ${f.minRating === r ? 'checked' : ''}>
      <span>${r}+ estrellas</span>
    </label>`).join('') + `
    <label class="radio">
      <input type="radio" name="minRating" value="0" data-filter="minRating" ${f.minRating === 0 ? 'checked' : ''}>
      <span>Cualquier calificación</span>
    </label>`;

  return `
    <div class="filter-group">
      <button class="filter-group__head" type="button" aria-expanded="true" data-action="toggle-filter-group" aria-controls="${fid('fg-price')}">
        Precio ${icon('chevron')}
      </button>
      <div class="filter-group__body" id="${fid('fg-price')}">
        <div class="range">
          <div class="range__values">
            <span id="${fid('price-min-label')}">${formatCOP(f.minPrice)}</span>
            <span id="${fid('price-max-label')}">${f.maxPrice >= 200000 ? 'Sin tope' : formatCOP(f.maxPrice)}</span>
          </div>
          <div class="range__track">
            <div class="range__fill" id="${fid('range-fill')}"></div>
            <input type="range" id="${fid('price-min')}" min="0" max="200000" step="5000" value="${f.minPrice}" data-filter-range="minPrice" aria-label="Precio mínimo">
            <input type="range" id="${fid('price-max')}" min="0" max="200000" step="5000" value="${f.maxPrice}" data-filter-range="maxPrice" aria-label="Precio máximo">
          </div>
        </div>
      </div>
    </div>
    <div class="filter-group">
      <button class="filter-group__head" type="button" aria-expanded="true" data-action="toggle-filter-group" aria-controls="${fid('fg-brands')}">
        Marca ${icon('chevron')}
      </button>
      <div class="filter-group__body" id="${fid('fg-brands')}">${brandOptions}</div>
    </div>
    <div class="filter-group">
      <button class="filter-group__head" type="button" aria-expanded="true" data-action="toggle-filter-group" aria-controls="${fid('fg-needs')}">
        Necesidad ${icon('chevron')}
      </button>
      <div class="filter-group__body" id="${fid('fg-needs')}">${needOptions}</div>
    </div>
    <div class="filter-group">
      <button class="filter-group__head" type="button" aria-expanded="true" data-action="toggle-filter-group" aria-controls="${fid('fg-hair')}">
        Tipo de cabello ${icon('chevron')}
      </button>
      <div class="filter-group__body" id="${fid('fg-hair')}">${hairOptions}</div>
    </div>
    <div class="filter-group">
      <button class="filter-group__head" type="button" aria-expanded="true" data-action="toggle-filter-group" aria-controls="${fid('fg-rating')}">
        Calificación ${icon('chevron')}
      </button>
      <div class="filter-group__body" id="${fid('fg-rating')}">${ratingOptions}</div>
    </div>
    <div class="filter-group">
      <label class="checkbox">
        <input type="checkbox" data-filter="inStock" ${f.inStock ? 'checked' : ''}>
        <span>Disponible ahora</span>
      </label>
    </div>
  `;
}

function updateRangeUI(root, context = 'rail') {
  const scope = root || document;
  const f = state.filters;
  const suffix = `-${context}`;
  const min = $(`#price-min${suffix}`, scope);
  const max = $(`#price-max${suffix}`, scope);
  if (!min || !max) return;
  const minVal = Math.min(f.minPrice, f.maxPrice);
  const maxVal = Math.max(f.minPrice, f.maxPrice);
  const total = 200000;
  const fill = $(`#range-fill${suffix}`, scope);
  if (fill) {
    fill.style.left = `${(minVal / total) * 100}%`;
    fill.style.width = `${((maxVal - minVal) / total) * 100}%`;
  }
  const minLabel = $(`#price-min-label${suffix}`, scope);
  const maxLabel = $(`#price-max-label${suffix}`, scope);
  if (minLabel) minLabel.textContent = formatCOP(minVal);
  if (maxLabel) maxLabel.textContent = maxVal >= 200000 ? 'Sin tope' : formatCOP(maxVal);
}

function renderPLPFilters() {
  const rail = $('#filters-rail');
  const sheetBody = $('#filter-sheet-body');
  if (rail) rail.innerHTML = renderFilters('rail');
  if (sheetBody) sheetBody.innerHTML = renderFilters('sheet');
  updateRangeUI(rail, 'rail');
  updateRangeUI(sheetBody, 'sheet');
}

function syncOtherFilters(sourceEl) {
  const inRail = sourceEl.closest('#filters-rail');
  const inSheet = sourceEl.closest('#filter-sheet-body');
  if (inRail && $('#filter-sheet-body')) $('#filter-sheet-body').innerHTML = renderFilters('sheet');
  else if (inSheet && $('#filters-rail')) $('#filters-rail').innerHTML = renderFilters('rail');
  updateRangeUI($('#filters-rail'), 'rail');
  updateRangeUI($('#filter-sheet-body'), 'sheet');
}

function plpHeading() {
  const f = state.filters;
  if (f.q) return `Resultados para \u201C${f.q}\u201D`;
  if (f.cat === 'ofertas') return 'Ofertas';
  if (f.cat) return categoryLabel(f.cat);
  if (f.needs.length === 1) return `Necesidad: ${f.needs[0]}`;
  if (f.brands.length === 1) return f.brands[0];
  const otherFilters = f.hairTypes.length > 0 || f.minRating > 0 || f.inStock ||
    f.minPrice > 0 || f.maxPrice < 200000;
  if (otherFilters || f.needs.length > 1 || f.brands.length > 1) return 'Cat\u00E1logo filtrado';
  return 'Todos los productos';
}

function renderPLPResults() {
  const f = state.filters;
  const list = filteredProducts();
  const chips = activeFilterChips();
  const heading = plpHeading();

  // Breadcrumb
  const breadcrumb = $('#plp-breadcrumb');
  if (breadcrumb) {
    const parts = ['<a href="#/home" data-nav>Inicio</a>'];
    if (f.cat) {
      const label = categoryLabel(f.cat);
      if (['Cabello', 'Rostro', 'Cuerpo', 'Maquillaje'].includes(label)) {
        parts.push(`<span aria-hidden="true">${icon('chevron')}</span><a href="#/plp?cat=${label.toLowerCase()}" data-nav>${escapeHtml(label)}</a>`);
      }
    }
    parts.push(`<span aria-hidden="true">${icon('chevron')}</span><span aria-current="page">${escapeHtml(heading)}</span>`);
    breadcrumb.innerHTML = parts.join('');
  }

  const title = $('#plp-title');
  if (title) title.textContent = heading;
  const count = $('#plp-count');
  if (count) count.textContent = `${list.length} producto${list.length === 1 ? '' : 's'}`;

  // Active chips
  const chipsEl = $('#active-chips');
  if (chipsEl) {
    chipsEl.innerHTML = chips.map((chip) => `
      <span class="chip chip--active">
        ${escapeHtml(chip.label)}
        <button class="chip__remove" type="button" aria-label="Quitar filtro ${escapeHtml(chip.label)}" data-action="remove-chip" data-key="${chip.key}" data-value="${escapeHtml(chip.value || '')}">
          ${icon('close')}
        </button>
      </span>`).join('');
  }

  // Grid
  const grid = $('#plp-grid');
  const empty = $('#plp-empty');
  const loadMoreWrap = $('#load-more-wrap');
  if (grid) {
    const visible = list.slice(0, state.visibleCount);
    grid.innerHTML = visible.map((p, i) => productCard(p, i)).join('');
    if (empty) empty.hidden = list.length > 0;
    if (loadMoreWrap) {
      loadMoreWrap.hidden = list.length <= state.visibleCount;
      const btn = $('#load-more-btn');
      if (btn) btn.textContent = `Cargar m\u00E1s (${Math.min(state.visibleCount, list.length)} de ${list.length})`;
    }
  }

  // Sort select
  const sort = $('#sort-select');
  if (sort && sort.value !== state.sort) sort.value = state.sort;

  // Mobile filter count
  const mobileCount = $('#mobile-filter-count');
  if (mobileCount) {
    const n = chips.length;
    mobileCount.hidden = n === 0;
    mobileCount.textContent = String(n);
  }
  const applyBtn = $('#apply-filters-btn');
  if (applyBtn) applyBtn.textContent = chips.length ? `Aplicar (${chips.length})` : 'Aplicar';
}

function renderPLP() {
  renderPLPFilters();
  renderPLPResults();
}

function loadMore() {
  state.visibleCount += 8;
  renderPLP();
}

/* ── 13. PDP ───────────────────────────────────────────────── */
function getReviews(product) {
  const start = product.id.length % REVIEW_POOL.length;
  return [0, 1, 2].map((offset) => REVIEW_POOL[(start + offset) % REVIEW_POOL.length]);
}

function renderPDP(id, query = {}) {
  const container = $('#pdp-container');
  if (!container) return;
  const product = getProduct(id);
  if (!product) {
    container.innerHTML = `
      <div class="empty-state" style="padding-block: var(--space-16);">
        <h2>Producto no encontrado</h2>
        <p>El producto que buscas no existe o fue retirado del catálogo.</p>
        <a class="btn btn--primary" href="#/plp" data-nav>Ver catálogo</a>
      </div>`;
    return;
  }

  const variantType = getProductVariantType(product);
  const initialVariant = query.variant && getVariant(product, query.variant)
    ? query.variant
    : (defaultVariant(product) ? defaultVariant(product).label : null);

  const price = getProductPrice(product, initialVariant);
  const oldPrice = variantOldPrice(getVariant(product, initialVariant), product);
  const stock = getProductStock(product, initialVariant);
  const stockInfo = stockLabel(stock);
  const sale = salePercent(price, oldPrice);
  const image = getProductImage(product, initialVariant);
  const wished = state.wishlist.includes(product.id);

  // For shade products the gallery shows every tone; otherwise the media set.
  let galleryImages = variantType === 'shade'
    ? [...new Set(product.variants.map((v) => v.image).filter(Boolean))]
    : product.images.slice();
  if (!galleryImages.includes(image)) galleryImages.unshift(image);

  state.pdp = {
    id: product.id,
    variantLabel: initialVariant,
    qty: 1,
    imageIndex: 0,
    gallery: galleryImages,
  };

  const gallery = `
    <div class="pdp-gallery">
      <div class="pdp-gallery__main">
        <img id="pdp-main-image" src="${image}" alt="${escapeHtml(product.name)} de ${escapeHtml(product.brand)}" width="1" height="1">
        <div class="pdp-gallery__badges">${productBadges(product, price, oldPrice)}</div>
      </div>
      <div class="pdp-gallery__thumbs" role="group" aria-label="Imágenes del producto">
        ${galleryImages.map((src, i) => `
          <button class="pdp-thumb" type="button" role="button" aria-pressed="${i === 0}" aria-label="Ver imagen ${i + 1}" data-action="pdp-image" data-index="${i}">
            <img src="${src}" alt="" width="64" height="64">
          </button>`).join('')}
      </div>
    </div>
  `;

  const variantPicker = renderVariantPicker(product, variantType, initialVariant);

  const info = `
    <div class="pdp-info">
      <div>
        <p class="pdp-brand">${escapeHtml(product.brand)}</p>
        <h1 class="pdp-name">${escapeHtml(product.name)}</h1>
        <div class="pdp-rating">
          <span class="stars stars--lg" aria-label="${product.rating} de 5 estrellas">${stars(product.rating)}</span>
          <span class="rating-text">${product.rating.toFixed(1)}</span>
          <a href="#pdp-reviews" data-action="goto-reviews">${product.reviews} reseñas</a>
        </div>
      </div>

      <div class="pdp-price" aria-live="polite">
        <span class="price price--lg" id="pdp-price">${formatCOP(price)}</span>
        ${oldPrice ? `<span class="price--old" id="pdp-old-price">${formatCOP(oldPrice)}</span>` : ''}
        ${sale ? `<span class="badge badge--sale" id="pdp-sale-badge">-${sale}%</span>` : ''}
        <span class="price-note">IVA incluido</span>
      </div>

      ${variantPicker}

      <div>
        <p class="stock-status ${stockInfo.className}" id="pdp-stock">
          <span class="stock-status__dot" aria-hidden="true"></span>
          <span id="pdp-stock-text">${stockInfo.text}</span>
        </p>
        <p class="stock-eta" id="pdp-eta">
          ${icon('truck')} ${etaText('Bogotá')}
        </p>
        <p class="stock-eta">${icon('store')} Recoge gratis hoy en tienda</p>
      </div>

      <div class="qty-row">
        <div class="qty-stepper" aria-label="Cantidad">
          <button type="button" data-action="qty-dec" aria-label="Disminuir cantidad" ${state.pdp.qty <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
          <input type="number" id="pdp-qty" value="${state.pdp.qty}" min="1" max="${stock}" inputmode="numeric" aria-label="Cantidad">
          <button type="button" data-action="qty-inc" aria-label="Aumentar cantidad" ${state.pdp.qty >= stock ? 'disabled' : ''}>${icon('plus')}</button>
        </div>
        <div class="pdp-cta">
          <button class="btn btn--primary btn--lg" type="button" data-action="add-to-cart" ${stock <= 0 ? 'disabled' : ''}>
            ${stock <= 0 ? 'Agotado' : 'Agregar al carrito'}
          </button>
        </div>
      </div>

      <div class="pdp-secondary">
        <button class="btn btn--ghost btn--sm" type="button" data-action="wishlist" data-id="${product.id}" aria-pressed="${wished}">
          ${icon('heart')} ${wished ? 'Guardado' : 'Guardar'}
        </button>
        <button class="btn btn--ghost btn--sm" type="button" data-action="share">
          ${icon('arrow')} Compartir
        </button>
      </div>

      <div class="pdp-payments">
        <span>Paga con:</span>
        <span class="pay-badge">Visa</span>
        <span class="pay-badge">Mastercard</span>
        <span class="pay-badge">PSE</span>
        <span class="pay-badge">Nequi</span>
        <span class="pay-badge">COD</span>
        <span class="pay-badge">Wompi</span>
      </div>
    </div>
  `;

  const tabs = renderPDPTabs(product);

  const related = PRODUCTS.filter((p) => p.id !== product.id &&
    (p.category === product.category || p.needs.some((n) => product.needs.includes(n)))).slice(0, 4);

  const relatedHtml = related.length ? `
    <section class="pdp-related" aria-labelledby="related-title">
      <div class="section-head">
        <h2 class="section-title" id="related-title">Relacionados con tu necesidad</h2>
        <a class="link-arrow" href="#/plp?cat=${product.category.toLowerCase()}" data-nav>Ver más ${icon('arrow')}</a>
      </div>
      <div class="product-grid">${related.map((p, i) => productCard(p, i)).join('')}</div>
    </section>
  ` : '';

  const reviewsHtml = renderReviews(product);

  container.innerHTML = `
    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <a href="#/home" data-nav>Inicio</a>
      <span aria-hidden="true">${icon('chevron')}</span>
      <a href="#/plp?cat=${product.category.toLowerCase()}" data-nav>${escapeHtml(product.category)}</a>
      <span aria-hidden="true">${icon('chevron')}</span>
      <a href="#/plp?cat=${product.category.toLowerCase()}&q=${encodeURIComponent(product.subcategory)}" data-nav>${escapeHtml(product.subcategory)}</a>
      <span aria-hidden="true">${icon('chevron')}</span>
      <span aria-current="page">${escapeHtml(product.name)}</span>
    </nav>

    <div class="pdp-grid">
      ${gallery}
      ${info}
    </div>

    <div class="pdp-buybar" id="pdp-buybar">
      <div>
        <p class="price" id="pdp-buybar-price">${formatCOP(price)}</p>
        <p class="price-note" id="pdp-buybar-stock">${stockInfo.text}</p>
      </div>
      <button class="btn btn--primary" type="button" data-action="add-to-cart" ${stock <= 0 ? 'disabled' : ''}>
        Agregar al carrito
      </button>
    </div>

    ${tabs}
    ${relatedHtml}
    ${reviewsHtml}
  `;

  document.title = `${product.name} — Adriana Tienda`;
}

function renderVariantPicker(product, variantType, selectedLabel) {
  if (variantType === 'none') return '';
  const labelText = variantType === 'shade' ? 'Tono' : 'Tamaño';
  if (variantType === 'shade') {
    return `
      <div class="variant-group">
        <p class="variant-group__label">${labelText}: <span id="variant-selected-label">${escapeHtml(selectedLabel || '')}</span></p>
        <div class="variant-options" role="group" aria-label="Selecciona un tono">
          ${product.variants.map((v) => `
            <button class="swatch" type="button" aria-pressed="${v.label === selectedLabel}" aria-label="${escapeHtml(v.label)}${v.stock <= 0 ? ' (agotado)' : ''}" title="${escapeHtml(v.label)}" data-action="select-variant" data-variant="${escapeHtml(v.label)}" ${v.stock <= 0 ? 'disabled' : ''}>
              <span style="background:${v.color || '#ddd'}"></span>
            </button>`).join('')}
        </div>
        <p class="field-hint">Pasa el cursor o toca un tono para ver el color.</p>
      </div>
    `;
  }
  return `
    <div class="variant-group">
      <p class="variant-group__label">${labelText}: <span id="variant-selected-label">${escapeHtml(selectedLabel || '')}</span></p>
      <div class="variant-options" role="group" aria-label="Selecciona un tamaño">
        ${product.variants.map((v) => `
          <button class="variant-btn" type="button" aria-pressed="${v.label === selectedLabel}" data-action="select-variant" data-variant="${escapeHtml(v.label)}" ${v.stock <= 0 ? 'disabled' : ''}>
            ${escapeHtml(v.label)}
          </button>`).join('')}
      </div>
    </div>
  `;
}

function updatePDPVariant(label) {
  const product = getProduct(state.pdp.id);
  if (!product) return;
  const variant = getVariant(product, label);
  if (!variant) return;
  state.pdp.variantLabel = label;
  state.pdp.qty = Math.min(state.pdp.qty, Math.max(variant.stock, 1));

  const price = variant.price;
  const oldPrice = variantOldPrice(variant, product);
  const stock = variant.stock;
  const stockInfo = stockLabel(stock);
  const sale = salePercent(price, oldPrice);
  const image = variant.image || product.images[0];

  const priceBlock = $('.pdp-price');
  if (priceBlock) {
    priceBlock.innerHTML = `
      <span class="price price--lg" id="pdp-price">${formatCOP(price)}</span>
      ${oldPrice && oldPrice > price ? `<span class="price--old" id="pdp-old-price">${formatCOP(oldPrice)}</span>` : ''}
      ${sale ? `<span class="badge badge--sale" id="pdp-sale-badge">-${sale}%</span>` : ''}
      <span class="price-note">IVA incluido</span>
    `;
  }
  const galleryBadges = $('.pdp-gallery__badges');
  if (galleryBadges) galleryBadges.innerHTML = productBadges(product, price, oldPrice);
  const stockText = $('#pdp-stock-text');
  if (stockText) stockText.textContent = stockInfo.text;
  const stockEl = $('#pdp-stock');
  if (stockEl) {
    stockEl.classList.remove('stock-status--ok', 'stock-status--low', 'stock-status--out');
    stockEl.classList.add(stockInfo.className);
  }
  const mainImage = $('#pdp-main-image');
  if (mainImage) mainImage.src = image;
  const gallery = state.pdp.gallery || [];
  const activeIndex = gallery.indexOf(image);
  $$('.pdp-thumb').forEach((thumb, i) => {
    thumb.setAttribute('aria-pressed', String(i === activeIndex));
  });
  const qtyInput = $('#pdp-qty');
  if (qtyInput) {
    qtyInput.value = state.pdp.qty;
    qtyInput.max = Math.max(stock, 1);
  }
  const buybarPrice = $('#pdp-buybar-price');
  if (buybarPrice) buybarPrice.textContent = formatCOP(price);
  const buybarStock = $('#pdp-buybar-stock');
  if (buybarStock) buybarStock.textContent = stockInfo.text;
  const selectedLabel = $('#variant-selected-label');
  if (selectedLabel) selectedLabel.textContent = label;

  $$('.variant-btn, .swatch').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.variant === label));
  });

  $$('[data-action="add-to-cart"]').forEach((btn) => {
    btn.disabled = stock <= 0;
  });

  // Keep the URL in sync with the selected variant (no reload).
  const variantUrl = `#/pdp/${encodeURIComponent(product.id)}?variant=${encodeURIComponent(label)}`;
  if (window.location.hash !== variantUrl) {
    history.replaceState(null, '', variantUrl);
  }
  toast(`Variante ${label} seleccionada`);
}

function renderPDPTabs(product) {
  const tabs = [
    { id: 'detalles', label: 'Detalles' },
    { id: 'modo', label: 'Modo de uso' },
    { id: 'ingredientes', label: 'Ingredientes' },
    { id: 'especificaciones', label: 'Especificaciones' },
  ];
  return `
    <section class="pdp-tabs">
      <div class="tabs-list" role="tablist" aria-label="Información del producto">
        ${tabs.map((t, i) => `
          <button class="tab-btn" type="button" role="tab" id="tab-${t.id}" aria-selected="${i === 0}" aria-controls="panel-${t.id}" data-action="tab" data-tab="${t.id}">
            ${t.label}
          </button>`).join('')}
      </div>
      <div class="tab-panel" role="tabpanel" id="panel-detalles" aria-labelledby="tab-detalles">
        <h3>Detalles</h3>
        <p>${escapeHtml(product.description)}</p>
      </div>
      <div class="tab-panel" role="tabpanel" id="panel-modo" aria-labelledby="tab-modo" hidden>
        <h3>Modo de uso</h3>
        <p>${escapeHtml(product.howToUse)}</p>
      </div>
      <div class="tab-panel" role="tabpanel" id="panel-ingredientes" aria-labelledby="tab-ingredientes" hidden>
        <h3>Ingredientes</h3>
        <p>${escapeHtml(product.ingredients)}</p>
      </div>
      <div class="tab-panel" role="tabpanel" id="panel-especificaciones" aria-labelledby="tab-especificaciones" hidden>
        <h3>Especificaciones</h3>
        <table class="spec-table">
          <tbody>
            ${product.specs.map(([key, value]) => `<tr><th scope="row">${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderReviews(product) {
  const reviews = getReviews(product);
  return `
    <section class="pdp-reviews" id="pdp-reviews" aria-labelledby="reviews-title">
      <div class="section-head">
        <div>
          <h2 class="section-title" id="reviews-title">Reseñas</h2>
          <p class="section-sub">${product.reviews} reseñas verificadas</p>
        </div>
      </div>
      <div class="reviews-summary">
        <div class="reviews-summary__score">
          <span class="rating-big">${product.rating.toFixed(1)}</span>
          <div class="stars stars--lg" aria-label="${product.rating} de 5 estrellas">${stars(product.rating)}</div>
        </div>
        <div class="reviews-summary__bars" aria-hidden="true">
          ${[5, 4, 3, 2, 1].map((star) => {
            const pct = star === 5 ? 72 : star === 4 ? 20 : star === 3 ? 6 : star === 2 ? 1 : 1;
            return `<div class="review-bar"><span>${star}★</span><span class="review-bar__track"><span class="review-bar__fill" style="width:${pct}%"></span></span><span>${pct}%</span></div>`;
          }).join('')}
        </div>
        <div>
          <button class="btn btn--outline btn--sm" type="button" data-action="write-review">Escribir una reseña</button>
        </div>
      </div>
      <div>
        ${reviews.map((r) => `
          <article class="review-card">
            <div class="review-card__head">
              <span class="stars" aria-label="${r.rating} de 5 estrellas">${stars(r.rating)}</span>
              <span class="review-card__author">${escapeHtml(r.author)}</span>
              ${r.verified ? `<span class="review-card__verified">${icon('check')} Compra verificada</span>` : ''}
              <span class="review-card__date">${escapeHtml(r.date)}</span>
            </div>
            <p>${escapeHtml(r.text)}</p>
          </article>`).join('')}
      </div>
    </section>
  `;
}

/* ── 14. Cart drawer ───────────────────────────────────────── */
function renderDrawer() {
  const count = cartCount();
  const subtotal = cartSubtotal();

  const countEl = $('#drawer-count');
  if (countEl) countEl.textContent = `(${count})`;

  const itemsEl = $('#cart-items');
  const freeEl = $('#free-shipping');
  const subtotalEl = $('#cart-subtotal');
  const checkoutBtn = $('#checkout-btn');

  if (subtotalEl) subtotalEl.textContent = formatCOP(subtotal);
  if (checkoutBtn) checkoutBtn.disabled = state.cart.length === 0;

  if (freeEl) {
    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
    freeEl.innerHTML = remaining > 0
      ? `<p class="free-shipping__text">Te faltan <strong>${formatCOP(remaining)}</strong> para envío gratis</p>
         <div class="free-shipping__track"><div class="free-shipping__fill" style="width:${pct}%"></div></div>`
      : `<p class="free-shipping__text"><strong>¡Tienes envío gratis!</strong> Tu pedido aplica para entrega sin costo.</p>
         <div class="free-shipping__track"><div class="free-shipping__fill" style="width:100%"></div></div>`;
  }

  if (!itemsEl) return;
  if (state.cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        ${icon('cart')}
        <p>Tu carrito está vacío.<br>Agrega productos para empezar.</p>
        <button class="btn btn--outline btn--sm" type="button" data-action="close-drawer">Seguir explorando</button>
      </div>`;
    return;
  }

  itemsEl.innerHTML = state.cart.map((item) => {
    const product = getProduct(item.id);
    if (!product) return '';
    const price = getProductPrice(product, item.variant);
    const image = getProductImage(product, item.variant);
    const stock = getProductStock(product, item.variant);
    const key = cartKey(item);
    return `
      <article class="cart-item" data-key="${escapeHtml(key)}">
        <img class="cart-item__img" src="${image}" alt="${escapeHtml(product.name)}" width="64" height="64">
        <div class="cart-item__body">
          <p class="cart-item__name">${escapeHtml(product.name)}</p>
          ${item.variant ? `<p class="cart-item__variant">${escapeHtml(item.variant)}</p>` : ''}
          <div class="cart-item__row">
            <div class="cart-item__qty">
              <button type="button" data-action="cart-qty-dec" data-key="${escapeHtml(key)}" aria-label="Disminuir cantidad" ${item.qty <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
              <span aria-live="polite">${item.qty}</span>
              <button type="button" data-action="cart-qty-inc" data-key="${escapeHtml(key)}" aria-label="Aumentar cantidad" ${item.qty >= stock ? 'disabled' : ''}>${icon('plus')}</button>
            </div>
            <span class="cart-item__price">${formatCOP(price * item.qty)}</span>
          </div>
          <button class="cart-item__remove" type="button" data-action="cart-remove" data-key="${escapeHtml(key)}">
            ${icon('trash')} Eliminar
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function openDrawer() {
  const drawer = $('#cart-drawer');
  const overlay = $('#drawer-overlay');
  if (!drawer || !overlay) return;
  renderDrawer();
  drawer.hidden = false;
  overlay.hidden = false;
  void overlay.offsetWidth;
  document.body.classList.add('overlay-open', 'drawer-open');
  document.body.style.overflow = 'hidden';
  const closeBtn = drawer.querySelector('[data-action="close-drawer"]');
  if (closeBtn) closeBtn.focus();
  trapFocus(drawer);
}

function closeDrawer() {
  const drawer = $('#cart-drawer');
  const overlay = $('#drawer-overlay');
  if (!drawer || !overlay || drawer.hidden) return;
  document.body.classList.remove('drawer-open');
  window.setTimeout(() => {
    if (!document.body.classList.contains('drawer-open')) {
      drawer.hidden = true;
      overlay.hidden = true;
      if (!document.body.classList.contains('sheet-open')) {
        document.body.classList.remove('overlay-open');
        document.body.style.overflow = '';
      }
    }
  }, 220);
  untrapFocus();
}

/* ── 15. Filter sheet ──────────────────────────────────────── */
function openFilters() {
  const sheet = $('#filter-sheet');
  const overlay = $('#sheet-overlay');
  if (!sheet || !overlay) return;
  sheet.hidden = false;
  overlay.hidden = false;
  void overlay.offsetWidth;
  document.body.classList.add('overlay-open', 'sheet-open');
  document.body.style.overflow = 'hidden';
  const closeBtn = sheet.querySelector('[data-action="close-filters"]');
  if (closeBtn) closeBtn.focus();
  trapFocus(sheet);
}

function closeFilters() {
  const sheet = $('#filter-sheet');
  const overlay = $('#sheet-overlay');
  if (!sheet || !overlay || sheet.hidden) return;
  document.body.classList.remove('sheet-open');
  window.setTimeout(() => {
    if (!document.body.classList.contains('sheet-open')) {
      sheet.hidden = true;
      overlay.hidden = true;
      if (!document.body.classList.contains('drawer-open')) {
        document.body.classList.remove('overlay-open');
        document.body.style.overflow = '';
      }
    }
  }, 220);
  untrapFocus();
}

function closeAllOverlays() {
  closeDrawer();
  closeFilters();
  closeMobileNav();
  closeBrands();
}

/* ── 16. Focus trap ────────────────────────────────────────── */
let focusTrapHandler = null;
let previouslyFocused = null;

function trapFocus(container) {
  previouslyFocused = document.activeElement;
  focusTrapHandler = (event) => {
    if (event.key === 'Tab') {
      const focusables = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
        .filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };
  document.addEventListener('keydown', focusTrapHandler, true);
}

function untrapFocus() {
  if (focusTrapHandler) {
    document.removeEventListener('keydown', focusTrapHandler, true);
    focusTrapHandler = null;
  }
  if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
  previouslyFocused = null;
}

/* ── 17. Checkout ──────────────────────────────────────────── */
function checkoutTotals() {
  const subtotal = cartSubtotal();
  let discount = 0;
  let shipping = FLAT_SHIPPING;
  const coupon = state.checkout.coupon;
  if (coupon) {
    if (coupon.type === 'percent') discount = Math.round((subtotal * coupon.value) / 100);
    if (coupon.type === 'shipping') shipping = 0;
  }
  if (state.checkout.pickup) shipping = 0;
  else if (subtotal >= FREE_SHIPPING_THRESHOLD) shipping = 0;
  const total = Math.max(0, subtotal - discount + shipping);
  return { subtotal, discount, shipping, total };
}

/* Repaint the checkout when the cart changes while the view is active. */
function syncCheckoutIfActive() {
  const view = $('#view-checkout');
  if (!view || view.hidden) return;
  if (state.cart.length === 0) {
    renderCheckout();
    return;
  }
  renderCheckoutSummary();
  updatePayButton();
}

function updatePayButton() {
  const btn = $('#pay-btn');
  if (!btn) return;
  const totals = checkoutTotals();
  btn.textContent = state.checkout.processing ? 'Procesando…' : `Pagar ${formatCOP(totals.total)}`;
  btn.disabled = state.checkout.processing || state.cart.length === 0;
}

function renderCheckoutSummary() {
  const summary = $('#checkout-summary');
  if (!summary) return;
  const totals = checkoutTotals();
  const coupon = state.checkout.coupon;

  const itemsHtml = state.cart.length === 0
    ? '<p class="summary-row__note">Tu carrito está vacío.</p>'
    : state.cart.map((item) => {
      const product = getProduct(item.id);
      if (!product) return '';
      const price = getProductPrice(product, item.variant);
      const image = getProductImage(product, item.variant);
      return `
        <div class="summary-item">
          <img class="summary-item__img" src="${image}" alt="${escapeHtml(product.name)}" width="56" height="56">
          <div class="summary-item__body">
            <p class="summary-item__name">${escapeHtml(product.name)}</p>
            ${item.variant ? `<p class="summary-item__variant">${escapeHtml(item.variant)}</p>` : ''}
            <p class="summary-item__qty">Cantidad: ${item.qty}</p>
          </div>
          <span class="summary-item__price">${formatCOP(price * item.qty)}</span>
        </div>
      `;
    }).join('');

  summary.innerHTML = `
    <div class="checkout-summary__head">
      <h2>Resumen</h2>
      <button class="btn btn--link btn--sm" type="button" data-action="toggle-summary" aria-expanded="true">
        <span class="summary-toggle-text">Ocultar</span>
      </button>
    </div>
    <div class="checkout-summary__items">${itemsHtml}</div>
    <div class="summary-rows">
      <div class="summary-row"><span>Subtotal</span><span>${formatCOP(totals.subtotal)}</span></div>
      ${totals.discount > 0 ? `<div class="summary-row summary-row--discount"><span>Descuento (${escapeHtml(coupon.code)})</span><span>-${formatCOP(totals.discount)}</span></div>` : ''}
      <div class="summary-row"><span>Envío</span><span>${totals.shipping === 0 ? 'Gratis' : formatCOP(totals.shipping)}</span></div>
      <div class="summary-row summary-row--total"><span>Total</span><span id="checkout-total">${formatCOP(totals.total)}</span></div>
      <p class="summary-row__note">IVA incluido. ${state.checkout.pickup ? 'Recoges en tienda, sin costo de envío.' : totals.shipping === 0 ? 'Envío gratis por compra superior a ' + formatCOP(FREE_SHIPPING_THRESHOLD) + '.' : 'Envío estándar a todo el país.'}</p>
      <div class="summary-divider"></div>
      <div class="coupon">
        <label class="sr-only" for="coupon-input">Código de descuento</label>
        <input id="coupon-input" type="text" placeholder="Código de descuento" value="${coupon ? escapeHtml(coupon.code) : ''}" autocomplete="off">
        <button class="btn btn--outline btn--sm" type="button" data-action="apply-coupon">Aplicar</button>
      </div>
      ${coupon ? `<button class="btn btn--link btn--sm" type="button" data-action="remove-coupon">Quitar cupón</button>` : ''}
    </div>
  `;
}

function renderCheckout() {
  const container = $('#checkout-container');
  if (!container) return;
  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding-block: var(--space-16);">
        ${icon('cart')}
        <h2>Tu carrito está vacío</h2>
        <p>Agrega productos antes de continuar al checkout.</p>
        <a class="btn btn--primary" href="#/plp" data-nav>Explorar catálogo</a>
      </div>`;
    return;
  }
  const totals = checkoutTotals();
  const data = state.checkout.data;
  const errors = state.checkout.errors;

  const step1Done = state.checkout.step > 1;
  const step2Done = state.checkout.step > 2;

  container.innerHTML = `
    <div class="checkout-head">
      <h1>Checkout</h1>
      <p>Completa tus datos y confirma tu pedido. Sin registro, sin complicaciones.</p>
    </div>
    <div class="checkout-layout">
      <div class="checkout-steps">

        <section class="step ${step1Done ? 'step--done' : ''}" data-step="1">
          <button class="step__head" type="button" aria-expanded="${state.checkout.step === 1}" data-action="step-toggle" data-step="1">
            <span class="step__number">${step1Done ? icon('check') : '1'}</span>
            <span class="step__title">Contacto</span>
            <span class="step__summary">${data.email ? escapeHtml(data.email) : ''}</span>
            <span class="step__chev">${icon('chevron')}</span>
          </button>
          <div class="step__body" ${state.checkout.step === 1 ? '' : 'hidden'}>
            <div class="form-grid form-grid--2">
              <div class="field">
                <label for="co-name">Nombre completo</label>
                <input id="co-name" type="text" autocomplete="name" value="${escapeHtml(data.name || '')}" aria-invalid="${errors.name ? 'true' : 'false'}" placeholder="María Pérez">
                <span class="field-error ${errors.name ? 'field-error--visible' : ''}" id="error-name">Ingresa tu nombre completo.</span>
              </div>
              <div class="field">
                <label for="co-email">Correo electrónico</label>
                <input id="co-email" type="email" autocomplete="email" value="${escapeHtml(data.email || '')}" aria-invalid="${errors.email ? 'true' : 'false'}" placeholder="tucorreo@ejemplo.com">
                <span class="field-error ${errors.email ? 'field-error--visible' : ''}" id="error-email">Ingresa un correo válido.</span>
              </div>
              <div class="field">
                <label for="co-phone">Celular</label>
                <input id="co-phone" type="tel" autocomplete="tel" value="${escapeHtml(data.phone || '')}" aria-invalid="${errors.phone ? 'true' : 'false'}" placeholder="300 123 4567">
                <span class="field-error ${errors.phone ? 'field-error--visible' : ''}" id="error-phone">Ingresa un celular de 10 dígitos.</span>
              </div>
            </div>
            <div class="step__actions">
              <button class="btn btn--primary" type="button" data-action="step-continue" data-step="1">Continuar a entrega</button>
            </div>
          </div>
        </section>

        <section class="step ${step2Done ? 'step--done' : ''}" data-step="2">
          <button class="step__head" type="button" aria-expanded="${state.checkout.step === 2}" data-action="step-toggle" data-step="2">
            <span class="step__number">${step2Done ? icon('check') : '2'}</span>
            <span class="step__title">Entrega</span>
            <span class="step__summary">${data.city ? `${escapeHtml(data.city)}${data.pickup ? ' · Recoge en tienda' : ''}` : ''}</span>
            <span class="step__chev">${icon('chevron')}</span>
          </button>
          <div class="step__body" ${state.checkout.step === 2 ? '' : 'hidden'}>
            <div class="payment-methods" role="radiogroup" aria-label="Tipo de entrega">
              <label class="payment-method">
                <input type="radio" name="delivery" id="delivery-domicilio" value="domicilio" ${!state.checkout.pickup ? 'checked' : ''} data-action="delivery-type">
                <span class="payment-method__icon">${icon('truck')}</span>
                <span class="payment-method__label">Envío a domicilio<span class="payment-method__hint">Llega mañana en ciudades principales</span></span>
              </label>
              <label class="payment-method">
                <input type="radio" name="delivery" id="delivery-recoger" value="recoger" ${state.checkout.pickup ? 'checked' : ''} data-action="delivery-type">
                <span class="payment-method__icon">${icon('store')}</span>
                <span class="payment-method__label">Recoger en tienda<span class="payment-method__hint">Gratis · disponibilidad inmediata</span></span>
              </label>
            </div>

            <div id="delivery-fields">
              ${state.checkout.pickup ? renderPickupFields(data, errors) : renderShippingFields(data, errors)}
            </div>

            <div class="step__actions">
              <button class="btn btn--ghost" type="button" data-action="step-toggle" data-step="1">Volver</button>
              <button class="btn btn--primary" type="button" data-action="step-continue" data-step="2">Continuar a pago</button>
            </div>
          </div>
        </section>

        <section class="step" data-step="3">
          <button class="step__head" type="button" aria-expanded="${state.checkout.step === 3}" data-action="step-toggle" data-step="3">
            <span class="step__number">3</span>
            <span class="step__title">Pago</span>
            <span class="step__summary">${state.checkout.payment ? escapeHtml(PAYMENT_METHODS.find((m) => m.id === state.checkout.payment)?.label || '') : ''}</span>
            <span class="step__chev">${icon('chevron')}</span>
          </button>
          <div class="step__body" ${state.checkout.step === 3 ? '' : 'hidden'}>
            <div class="payment-methods" role="radiogroup" aria-label="Método de pago">
              ${PAYMENT_METHODS.map((method) => `
                <label class="payment-method">
                  <input type="radio" name="payment" id="payment-${method.id}" value="${method.id}" ${state.checkout.payment === method.id ? 'checked' : ''} data-action="payment-method">
                  <span class="payment-method__icon">${method.icon}</span>
                  <span class="payment-method__label">${escapeHtml(method.label)}<span class="payment-method__hint">${escapeHtml(method.hint)}</span></span>
                </label>`).join('')}
            </div>

            <div id="payment-fields">${renderPaymentFields(data, errors)}</div>

            <div class="step__actions">
              <button class="btn btn--ghost" type="button" data-action="step-toggle" data-step="2">Volver</button>
              <button class="btn btn--primary btn--lg" type="button" data-action="pay" id="pay-btn" ${state.checkout.processing || state.cart.length === 0 ? 'disabled' : ''}>
                ${state.checkout.processing ? 'Procesando…' : `Pagar ${formatCOP(totals.total)}`}
              </button>
            </div>
            <p class="field-hint" style="display:flex;gap:6px;align-items:center;">
              ${icon('shield')} Pago simulado en este prototipo. No se procesa ningún cargo real.
            </p>
          </div>
        </section>

      </div>

      <aside class="checkout-summary" id="checkout-summary" aria-label="Resumen del pedido"></aside>
    </div>
  `;

  renderCheckoutSummary();
  updatePayButton();
}

function renderShippingFields(data, errors) {
  const deptOptions = Object.keys(DEPARTMENTS).map((dept) =>
    `<option value="${escapeHtml(dept)}" ${data.department === dept ? 'selected' : ''}>${escapeHtml(dept)}</option>`).join('');
  const cities = data.department ? DEPARTMENTS[data.department] || [] : [];
  const cityOptions = cities.map((city) =>
    `<option value="${escapeHtml(city)}" ${data.city === city ? 'selected' : ''}>${escapeHtml(city)}</option>`).join('');

  return `
    <div class="form-grid form-grid--2">
      <div class="field">
        <label for="co-department">Departamento</label>
        <select id="co-department" aria-invalid="${errors.department ? 'true' : 'false'}">
          <option value="">Selecciona un departamento</option>
          ${deptOptions}
        </select>
        <span class="field-error ${errors.department ? 'field-error--visible' : ''}">Selecciona tu departamento.</span>
      </div>
      <div class="field">
        <label for="co-city">Ciudad</label>
        <select id="co-city" aria-invalid="${errors.city ? 'true' : 'false'}" ${data.department ? '' : 'disabled'}>
          <option value="">Selecciona una ciudad</option>
          ${cityOptions}
        </select>
        <span class="field-error ${errors.city ? 'field-error--visible' : ''}">Selecciona tu ciudad.</span>
      </div>
      <div class="field">
        <label for="co-address">Dirección</label>
        <input id="co-address" type="text" autocomplete="street-address" value="${escapeHtml(data.address || '')}" aria-invalid="${errors.address ? 'true' : 'false'}" placeholder="Calle 12 # 34 – 56, apto 501">
        <span class="field-error ${errors.address ? 'field-error--visible' : ''}">Ingresa tu dirección completa.</span>
      </div>
      <div class="field">
        <label for="co-neighborhood">Barrio (opcional)</label>
        <input id="co-neighborhood" type="text" value="${escapeHtml(data.neighborhood || '')}" placeholder="Chapinero">
      </div>
      <div class="field" style="grid-column: 1 / -1;">
        <label for="co-notes">Indicaciones de entrega (opcional)</label>
        <textarea id="co-notes" rows="2" placeholder="Casa blanca con reja gris, segundo piso">${escapeHtml(data.notes || '')}</textarea>
      </div>
    </div>
  `;
}

function renderPickupFields(data, errors) {
  const options = STORE_PICKUP.map((store) =>
    `<option value="${escapeHtml(store)}" ${data.store === store ? 'selected' : ''}>${escapeHtml(store)}</option>`).join('');
  return `
    <div class="form-grid form-grid--2">
      <div class="field">
        <label for="co-store">Sede de recogida</label>
        <select id="co-store" aria-invalid="${errors.store ? 'true' : 'false'}">
          <option value="">Selecciona una sede</option>
          ${options}
        </select>
        <span class="field-error ${errors.store ? 'field-error--visible' : ''}">Selecciona una sede.</span>
      </div>
      <div class="field">
        <label for="co-pickup-time">Horario</label>
        <select id="co-pickup-time">
          <option>Lunes a sábado 9:00–19:00</option>
          <option>Domingo 10:00–14:00</option>
        </select>
      </div>
    </div>
    <p class="field-hint">Te enviaremos un WhatsApp cuando tu pedido esté listo para recoger. Suele estar listo en 2 horas.</p>
  `;
}

function renderPaymentFields(data, errors) {
  if (state.checkout.payment === 'bnpl') {
    const options = [1, 2, 3, 6, 12].map((n) =>
      `<option value="${n}" ${state.checkout.installments === n ? 'selected' : ''}>${n} cuotas</option>`).join('');
    return `
      <div class="field">
        <label for="co-installments">Número de cuotas</label>
        <select id="co-installments">
          ${options}
        </select>
        <p class="field-hint">Simulación Wompi SU+Pay: cuota mensual aproximada de ${formatCOP(checkoutTotals().total / state.checkout.installments)}.</p>
      </div>
    `;
  }
  if (state.checkout.payment === 'nequi' || state.checkout.payment === 'cod') {
    return `<p class="field-hint">${state.checkout.payment === 'nequi'
      ? 'Te enviaremos una solicitud de cobro a tu número Nequi registrado en el paso de contacto.'
      : 'Pagas en efectivo al momento de recibir tu pedido. El repartidor lleva cambio.'}</p>`;
  }
  if (state.checkout.payment === 'pse') {
    return `<p class="field-hint">Serás redirigido a la pasarela PSE de tu banco para completar el pago de forma segura.</p>`;
  }
  return `
    <div class="form-grid form-grid--2">
      <div class="field" style="grid-column: 1 / -1;">
        <label for="co-card-number">Número de tarjeta</label>
        <input id="co-card-number" type="text" inputmode="numeric" autocomplete="cc-number" value="${escapeHtml(data.cardNumber || '')}" aria-invalid="${errors.cardNumber ? 'true' : 'false'}" placeholder="1234 5678 9012 3456">
        <span class="field-error ${errors.cardNumber ? 'field-error--visible' : ''}">Ingresa un número de tarjeta válido (16 dígitos).</span>
      </div>
      <div class="field" style="grid-column: 1 / -1;">
        <label for="co-card-name">Nombre en la tarjeta</label>
        <input id="co-card-name" type="text" autocomplete="cc-name" value="${escapeHtml(data.cardName || '')}" aria-invalid="${errors.cardName ? 'true' : 'false'}" placeholder="MARÍA PÉREZ">
        <span class="field-error ${errors.cardName ? 'field-error--visible' : ''}">Ingresa el nombre como aparece en la tarjeta.</span>
      </div>
      <div class="field">
        <label for="co-card-exp">Vencimiento</label>
        <input id="co-card-exp" type="text" inputmode="numeric" placeholder="MM/AA" value="${escapeHtml(data.cardExp || '')}" aria-invalid="${errors.cardExp ? 'true' : 'false'}">
        <span class="field-error ${errors.cardExp ? 'field-error--visible' : ''}">Ingresa una fecha válida (MM/AA).</span>
      </div>
      <div class="field">
        <label for="co-card-cvv">CVV</label>
        <input id="co-card-cvv" type="text" inputmode="numeric" autocomplete="cc-csc" placeholder="123" value="${escapeHtml(data.cardCvv || '')}" aria-invalid="${errors.cardCvv ? 'true' : 'false'}">
        <span class="field-error ${errors.cardCvv ? 'field-error--visible' : ''}">Ingresa el CVV (3–4 dígitos).</span>
      </div>
    </div>
  `;
}

function validateCheckoutStep(step) {
  const data = state.checkout.data;
  const errors = {};
  if (step === 1) {
    if (!data.name || data.name.trim().length < 3) errors.name = true;
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = true;
    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) errors.phone = true;
  } else if (step === 2) {
    if (state.checkout.pickup) {
      if (!data.store) errors.store = true;
    } else {
      if (!data.department) errors.department = true;
      if (!data.city) errors.city = true;
      if (!data.address || data.address.trim().length < 5) errors.address = true;
    }
  } else if (step === 3) {
    if (state.checkout.payment === 'tarjeta') {
      if (!data.cardNumber || data.cardNumber.replace(/\D/g, '').length !== 16) errors.cardNumber = true;
      if (!data.cardName || data.cardName.trim().length < 3) errors.cardName = true;
      if (!data.cardExp || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.cardExp)) errors.cardExp = true;
      if (!data.cardCvv || !/^\d{3,4}$/.test(data.cardCvv)) errors.cardCvv = true;
    }
  }
  return errors;
}

function collectCheckoutData() {
  const data = state.checkout.data;
  const fields = {
    name: '#co-name', email: '#co-email', phone: '#co-phone',
    department: '#co-department', city: '#co-city', address: '#co-address',
    neighborhood: '#co-neighborhood', notes: '#co-notes',
    store: '#co-store', cardNumber: '#co-card-number', cardName: '#co-card-name',
    cardExp: '#co-card-exp', cardCvv: '#co-card-cvv',
  };
  Object.entries(fields).forEach(([key, sel]) => {
    const el = $(sel);
    if (el) data[key] = el.value.trim();
  });
  if ($('#co-installments')) state.checkout.installments = Number($('#co-installments').value);
  state.checkout.pickup = !!$('input[name="delivery"]:checked') && $('input[name="delivery"]:checked').value === 'recoger';
}

function goToStep(step) {
  state.checkout.step = step;
  $$('.step').forEach((el) => {
    const stepNum = Number(el.dataset.step);
    const body = el.querySelector('.step__body');
    const head = el.querySelector('.step__head');
    const isOpen = stepNum === step;
    if (body) body.hidden = !isOpen;
    if (head) head.setAttribute('aria-expanded', String(isOpen));
  });
}

/* Re-render the checkout without losing the control that triggered the change. */
function renderCheckoutPreservingFocus() {
  const activeId = document.activeElement ? document.activeElement.id : null;
  renderCheckout();
  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) el.focus();
  }
}

function processPayment() {
  if (state.cart.length === 0) {
    renderCheckout();
    toast('Tu carrito está vacío. Agrega productos para pagar.', 'error');
    return;
  }
  collectCheckoutData();
  const e1 = validateCheckoutStep(1);
  const e2 = validateCheckoutStep(2);
  const e3 = validateCheckoutStep(3);
  state.checkout.errors = { ...e1, ...e2, ...e3 };
  if (Object.keys(state.checkout.errors).length > 0) {
    const firstInvalid = Object.keys(e1).length > 0 ? 1 : Object.keys(e2).length > 0 ? 2 : 3;
    state.checkout.step = firstInvalid;
    renderCheckout();
    const firstField = document.querySelector('[aria-invalid="true"]');
    if (firstField) firstField.focus();
    toast('Revisa los campos marcados en rojo.', 'error');
    return;
  }
  state.checkout.processing = true;
  renderCheckout();
  window.setTimeout(() => {
    const totals = checkoutTotals();
    const method = PAYMENT_METHODS.find((m) => m.id === state.checkout.payment);
    const order = {
      number: `ATR-${Date.now().toString().slice(-6)}`,
      total: totals.total,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      method: method ? method.label : 'Tarjeta',
      email: state.checkout.data.email,
      name: state.checkout.data.name,
      city: state.checkout.pickup ? 'Recoge en tienda' : state.checkout.data.city,
      eta: state.checkout.pickup ? 'Listo para recoger hoy' : etaText(state.checkout.data.city),
      items: state.cart.map((item) => {
        const product = getProduct(item.id);
        return {
          name: product ? product.name : item.id,
          variant: item.variant,
          qty: item.qty,
          price: product ? getProductPrice(product, item.variant) : 0,
          image: product ? getProductImage(product, item.variant) : '',
        };
      }),
    };
    state.checkout.lastOrder = order;
    saveLastOrder(order);
    saveOrder(order);
    state.cart = [];
    saveCart();
    updateCartCount();
    state.checkout.processing = false;
    navigate('#/confirmation');
  }, 1400);
}

function renderConfirmation() {
  const container = $('#confirmation-container');
  const order = state.checkout.lastOrder;
  if (!container) return;
  if (!order) {
    container.innerHTML = `
      <div class="empty-state" style="padding-block: var(--space-16);">
        <h2>No hay un pedido reciente</h2>
        <p>Cuando completes una compra verás aquí la confirmación.</p>
        <a class="btn btn--primary" href="#/plp" data-nav>Ir al catálogo</a>
      </div>`;
    return;
  }
  container.innerHTML = `
    <div class="confirmation">
      <div class="confirmation__icon">${icon('check')}</div>
      <h1>¡Gracias por tu compra, ${escapeHtml(order.name.split(' ')[0])}!</h1>
      <p>Tu pedido fue confirmado. Te enviamos la información a <strong>${escapeHtml(order.email)}</strong> y te avisaremos cuando esté en camino.</p>
      <p class="confirmation__order">Pedido ${escapeHtml(order.number)}</p>

      <div class="confirmation__grid">
        <div class="summary-row"><span>Total pagado</span><span><strong>${formatCOP(order.total)}</strong></span></div>
        <div class="summary-row"><span>Método de pago</span><span>${escapeHtml(order.method)}</span></div>
        <div class="summary-row"><span>Entrega</span><span>${escapeHtml(order.eta)}</span></div>
        <div class="summary-row"><span>${order.city === 'Recoge en tienda' ? 'Sede' : 'Ciudad'}</span><span>${escapeHtml(order.city)}</span></div>
        <div class="summary-divider"></div>
        ${order.items.map((item) => `
          <div class="summary-item">
            <img class="summary-item__img" src="${item.image}" alt="${escapeHtml(item.name)}" width="56" height="56">
            <div class="summary-item__body">
              <p class="summary-item__name">${escapeHtml(item.name)}</p>
              ${item.variant ? `<p class="summary-item__variant">${escapeHtml(item.variant)}</p>` : ''}
              <p class="summary-item__qty">Cantidad: ${item.qty}</p>
            </div>
            <span class="summary-item__price">${formatCOP(item.price * item.qty)}</span>
          </div>`).join('')}
      </div>

      <div class="confirmation__actions">
        <a class="btn btn--primary" href="#/plp" data-nav>Seguir comprando</a>
        <a class="btn btn--outline" href="#/tracking?order=${encodeURIComponent(order.number)}" data-nav>Rastrear tu pedido</a>
        <button class="btn btn--ghost" type="button" data-action="download-invoice">Descargar factura (PDF)</button>
      </div>
      <p class="field-hint">¿Dudas con tu pedido? Escríbenos por WhatsApp al 300 123 4567. Recuerda que tienes 5 días hábiles para retracto (Ley 1480).</p>
    </div>
  `;
}

/* ── 17b. Rastrear pedido ───────────────────────────────────── */
function trackingResultHTML(order) {
  const pickup = order.city === 'Recoge en tienda';
  const steps = pickup
    ? ['Pedido confirmado', 'En preparación', 'Listo para recoger', 'Recogido']
    : ['Pedido confirmado', 'En preparación', 'En ruta', 'Entregado'];
  const elapsedMin = (Date.now() - (order.createdAt || Date.now())) / 60000;
  let current = 0;
  let state = steps[0];
  if (pickup) {
    if (elapsedMin >= 3) { current = 2; state = 'Listo para recoger'; }
    else if (elapsedMin >= 1) { current = 1; state = 'En preparación'; }
  } else if (elapsedMin >= 3) {
    current = 2; state = 'En ruta';
  } else if (elapsedMin >= 1) {
    current = 1; state = 'En preparación';
  }
  const digits = String(order.number).replace(/\D/g, '').padStart(7, '0').slice(-7);
  const guide = `GU-${digits}`;
  return `
    <div class="tracking__result">
      <div class="tracking__result-head">
        <div>
          <p class="micro">Pedido</p>
          <p class="tracking__num">${escapeHtml(order.number)}</p>
        </div>
        <span class="tracking__badge">${escapeHtml(state)}</span>
      </div>
      <div class="tracking__meta">
        <div><span>Entrega</span><strong>${pickup ? 'Recoge en tienda' : 'A la dirección'}</strong></div>
        <div><span>${pickup ? 'Sede' : 'Ciudad'}</span><strong>${escapeHtml(order.city)}</strong></div>
        ${pickup ? '' : `<div><span>Transportadora</span><strong>Coordinadora</strong></div>`}
        ${pickup ? '' : `<div><span>Guía</span><strong>${guide}</strong></div>`}
        <div><span>Entrega estimada</span><strong>${escapeHtml(order.eta)}</strong></div>
      </div>
      <ol class="tracking__steps">
        ${steps.map((s, i) => `<li class="${i < current ? 'is-done' : i === current ? 'is-active' : ''}">${s}</li>`).join('')}
      </ol>
      <p class="tracking__note">Te enviamos las novedades a <strong>${escapeHtml(order.email)}</strong>.</p>
    </div>`;
}

function renderTracking(query = {}) {
  const container = $('#tracking-container');
  if (!container) return;
  const prefill = query.order || '';
  const orders = loadOrders();
  const match = prefill ? orders[String(prefill).trim().toUpperCase()] : null;

  container.innerHTML = `
    <div class="tracking">
      <header class="tracking__head">
        <h1>Rastrear tu pedido</h1>
        <p>Ingresa el número de pedido y el correo con el que compraste.</p>
      </header>
      <form class="form-grid tracking__form" data-action="track-order" novalidate>
        <div class="field">
          <label for="tr-order">Número de pedido</label>
          <input id="tr-order" type="text" autocomplete="off" placeholder="ATR-000000" value="${escapeHtml(prefill)}" required>
        </div>
        <div class="field">
          <label for="tr-email">Correo de compra</label>
          <input id="tr-email" type="email" autocomplete="email" placeholder="tucorreo@ejemplo.com" value="${match ? escapeHtml(match.email) : ''}" required>
        </div>
        <div class="tracking__actions">
          <button class="btn btn--primary" type="submit">Rastrear</button>
          <a class="btn btn--link" href="#/plp" data-nav>Ir al catálogo</a>
        </div>
      </form>
      <div id="tracking-result" aria-live="polite"></div>
    </div>`;
}

/* ── 18. Mobile menu / brands dropdown ─────────────────────── */
function closeMobileNav() {
  const nav = $('#mobile-nav');
  const btn = $('.menu-toggle');
  if (nav && !nav.hidden) {
    nav.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
}

function closeBrands() {
  const panel = $('#brands-panel');
  const btn = $('.nav-dropdown__toggle');
  if (panel && !panel.hidden) {
    panel.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
}

/* ── 19. Wishlist ──────────────────────────────────────────── */
function toggleWishlist(id) {
  const product = getProduct(id);
  if (!product) return;
  const index = state.wishlist.indexOf(id);
  if (index >= 0) {
    state.wishlist.splice(index, 1);
    toast(`${product.name} quitado de tu lista`);
  } else {
    state.wishlist.push(id);
    toast(`${product.name} guardado en tu lista`);
  }
  saveWishlist();
  $$(`[data-action="wishlist"][data-id="${CSS.escape(id)}"]`).forEach((btn) => {
    btn.setAttribute('aria-pressed', String(index < 0));
  });
}

/* ── 20. Event delegation ──────────────────────────────────── */
function handleAction(action, el, event) {
  const id = el.dataset.id;
  switch (action) {
    case 'toggle-menu': {
      const nav = $('#mobile-nav');
      const isOpen = nav && !nav.hidden;
      if (isOpen) closeMobileNav();
      else {
        closeBrands();
        nav.hidden = false;
        $('.menu-toggle').setAttribute('aria-expanded', 'true');
      }
      break;
    }
    case 'toggle-brands': {
      const panel = $('#brands-panel');
      if (!panel) break;
      const isOpen = !panel.hidden;
      if (isOpen) closeBrands();
      else {
        closeMobileNav();
        panel.hidden = false;
        $('.nav-dropdown__toggle').setAttribute('aria-expanded', 'true');
      }
      break;
    }
    case 'open-drawer': openDrawer(); break;
    case 'close-drawer': closeDrawer(); break;
    case 'go-checkout':
      closeDrawer();
      navigate('#/checkout');
      break;
    case 'open-filters': openFilters(); break;
    case 'close-filters': closeFilters(); break;
    case 'apply-filters': closeFilters(); break;
    case 'clear-filters':
      state.filters = defaultFilters();
      state.sort = 'relevancia';
      state.visibleCount = 8;
      renderPLP();
      break;
    case 'load-more': loadMore(); break;
    case 'remove-chip':
      removeFilterChip(el.dataset.key, el.dataset.value);
      break;
    case 'toggle-filter-group': {
      const group = el.closest('.filter-group');
      const body = group.querySelector('.filter-group__body');
      if (body) {
        const expanded = el.getAttribute('aria-expanded') === 'true';
        el.setAttribute('aria-expanded', String(!expanded));
        body.hidden = expanded;
      }
      break;
    }
    case 'quick-add': {
      const product = getProduct(id);
      if (!product) break;
      if (product.stock <= 0) {
        toast('Producto agotado.', 'error');
        break;
      }
      const variant = defaultVariant(product);
      addToCart(id, variant ? variant.label : null, 1);
      break;
    }
    case 'open-pdp': {
      event.preventDefault();
      navigate(productUrl(id));
      break;
    }
    case 'select-variant':
      updatePDPVariant(el.dataset.variant);
      break;
    case 'qty-dec': {
      state.pdp.qty = Math.max(1, state.pdp.qty - 1);
      const input = $('#pdp-qty');
      if (input) input.value = state.pdp.qty;
      const decBtn = $('[data-action="qty-dec"]');
      const incBtn = $('[data-action="qty-inc"]');
      if (decBtn) decBtn.disabled = state.pdp.qty <= 1;
      if (incBtn) {
        const stock = getProductStock(getProduct(state.pdp.id), state.pdp.variantLabel);
        incBtn.disabled = state.pdp.qty >= stock;
      }
      break;
    }
    case 'qty-inc': {
      const stock = getProductStock(getProduct(state.pdp.id), state.pdp.variantLabel);
      state.pdp.qty = Math.min(stock, state.pdp.qty + 1);
      const input = $('#pdp-qty');
      if (input) input.value = state.pdp.qty;
      const decBtn = $('[data-action="qty-dec"]');
      const incBtn = $('[data-action="qty-inc"]');
      if (decBtn) decBtn.disabled = state.pdp.qty <= 1;
      if (incBtn) incBtn.disabled = state.pdp.qty >= stock;
      break;
    }
    case 'add-to-cart': {
      const qty = Math.max(1, Math.min(state.pdp.qty || 1, 99));
      addToCart(state.pdp.id, state.pdp.variantLabel, qty);
      break;
    }
    case 'pdp-image': {
      const index = Number(el.dataset.index);
      const product = getProduct(state.pdp.id);
      if (!product) break;
      const main = $('#pdp-main-image');
      const images = $$('.pdp-thumb');
      if (main && images[index]) {
        main.src = images[index].querySelector('img').src;
        images.forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === index)));
      }
      break;
    }
    case 'tab': {
      const tabId = el.dataset.tab;
      $$('.tab-btn').forEach((btn) => btn.setAttribute('aria-selected', String(btn.dataset.tab === tabId)));
      $$('.tab-panel').forEach((panel) => {
        panel.hidden = panel.id !== `panel-${tabId}`;
      });
      break;
    }
    case 'goto-reviews': {
      event.preventDefault();
      const reviews = $('#pdp-reviews');
      if (reviews) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        reviews.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
      break;
    }
    case 'wishlist': toggleWishlist(id); break;
    case 'wishlist-header': {
      const count = state.wishlist.length;
      toast(count > 0
        ? `Tienes ${count} ${count === 1 ? 'producto guardado' : 'productos guardados'}. Guarda favoritos desde la tarjeta o la PDP.`
        : 'Guarda tus favoritos desde la tarjeta o la PDP.');
      break;
    }
    case 'skip-to-main': {
      const main = $('#main');
      if (main) {
        main.focus();
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        main.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
      break;
    }
    case 'share': {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: document.title, url }).catch(() => {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(() => toast('Enlace copiado al portapapeles'))
          .catch(() => toast('No se pudo copiar el enlace', 'error'));
      } else {
        toast('Copia la URL desde la barra de direcciones para compartir');
      }
      break;
    }
    case 'write-review':
      toast('Gracias por tu interés. La reseña se habilita después de la compra.');
      break;
    case 'cart-qty-dec':
      updateCartItem(el.dataset.key, (state.cart.find((i) => cartKey(i) === el.dataset.key)?.qty || 1) - 1);
      break;
    case 'cart-qty-inc':
      updateCartItem(el.dataset.key, (state.cart.find((i) => cartKey(i) === el.dataset.key)?.qty || 1) + 1);
      break;
    case 'cart-remove':
      removeCartItem(el.dataset.key);
      break;
    case 'step-toggle':
      goToStep(Number(el.dataset.step));
      break;
    case 'step-continue': {
      collectCheckoutData();
      const errors = validateCheckoutStep(Number(el.dataset.step));
      const nextStep = Number(el.dataset.step) + 1;
      if (Object.keys(errors).length === 0) {
        state.checkout.errors = {};
        goToStep(nextStep);
        renderCheckout();
        const head = document.querySelector(`[data-step="${nextStep}"] .step__head`);
        if (head) head.focus();
        toast(`Paso ${el.dataset.step} completado`);
      } else {
        state.checkout.errors = errors;
        renderCheckout();
        const firstInvalid = document.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        toast('Revisa los campos marcados en rojo.', 'error');
      }
      break;
    }
    case 'delivery-type': {
      state.checkout.pickup = el.value === 'recoger';
      renderCheckoutPreservingFocus();
      break;
    }
    case 'payment-method':
      state.checkout.payment = el.value;
      renderCheckoutPreservingFocus();
      break;
    case 'apply-coupon': {
      const input = $('#coupon-input');
      const code = input ? input.value.trim().toUpperCase() : '';
      const coupon = COUPONS[code];
      if (coupon) {
        state.checkout.coupon = { code, ...coupon };
        toast(`Cupón ${code} aplicado: ${coupon.label}`);
      } else {
        toast('Cupón no válido. Prueba con ADRIANA10.', 'error');
      }
      renderCheckoutSummary();
      updatePayButton();
      const couponInput = $('#coupon-input');
      if (couponInput) couponInput.focus();
      break;
    }
    case 'remove-coupon':
      state.checkout.coupon = null;
      renderCheckoutSummary();
      updatePayButton();
      const couponInput = $('#coupon-input');
      if (couponInput) couponInput.focus();
      break;
    case 'toggle-summary': {
      const summary = $('#checkout-summary');
      if (!summary) break;
      const collapsed = summary.classList.toggle('checkout-summary--collapsed');
      const text = summary.querySelector('.summary-toggle-text');
      if (text) text.textContent = collapsed ? 'Ver resumen' : 'Ocultar';
      el.setAttribute('aria-expanded', String(!collapsed));
      break;
    }
    case 'pay':
      processPayment();
      break;
    case 'download-invoice':
      toast('En producción aquí se descargaría la factura electrónica (DIAN).');
      break;
    case 'noop':
      event.preventDefault();
      break;
    default:
      break;
  }
}

/* ── 21. Global listeners ──────────────────────────────────── */
function bindEvents() {
  document.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action]');
    if (el) {
      handleAction(el.dataset.action, el, event);
      return;
    }
    // Close dropdowns when clicking outside
    if (!event.target.closest('.nav-dropdown')) closeBrands();
    if (!event.target.closest('#mobile-nav') && !event.target.closest('.menu-toggle')) closeMobileNav();
  });

  // PDP tabs: ArrowLeft/ArrowRight + Home/End per the ARIA tabs pattern.
  document.addEventListener('keydown', (event) => {
    const list = event.target.closest('.tabs-list');
    if (!list) return;
    const tabs = $$('.tab-btn', list);
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next = null;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    tabs[next].focus();
    const tabId = tabs[next].dataset.tab;
    tabs.forEach((btn) => btn.setAttribute('aria-selected', String(btn.dataset.tab === tabId)));
    $$('.tab-panel').forEach((panel) => {
      panel.hidden = panel.id !== `panel-${tabId}`;
    });
  });

  // Filter changes (rail + sheet share the same data-filter names)
  document.addEventListener('change', (event) => {
    const el = event.target;
    if (el.dataset.filter) {
      const key = el.dataset.filter;
      const value = el.value;
      if (el.type === 'checkbox') {
        if (key === 'inStock') state.filters.inStock = el.checked;
        else {
          const arr = state.filters[key];
          if (el.checked) arr.push(value);
          else state.filters[key] = arr.filter((x) => x !== value);
        }
      } else if (el.type === 'radio') {
        state.filters.minRating = Number(value);
      }
      state.visibleCount = 8;
      renderPLPResults();
      syncOtherFilters(el);
      return;
    }
    if (el.dataset.filterRange) {
      state.visibleCount = 8;
      renderPLPResults();
      syncOtherFilters(el);
      return;
    }
    if (el.dataset.action === 'sort') {
      state.sort = el.value;
      renderPLPResults();
      return;
    }
    if (el.id === 'co-department') {
      state.checkout.data.department = el.value;
      state.checkout.data.city = '';
      renderCheckoutPreservingFocus();
      return;
    }
    if (el.id === 'co-city') {
      state.checkout.data.city = el.value;
      return;
    }
    if (el.id === 'co-installments') {
      state.checkout.installments = Number(el.value);
      renderCheckoutPreservingFocus();
      return;
    }
  });

  // Range sliders
  document.addEventListener('input', (event) => {
    const el = event.target;
    if (el.dataset.filterRange) {
      const key = el.dataset.filterRange;
      let value = Number(el.value);
      if (key === 'minPrice' && value > state.filters.maxPrice) value = state.filters.maxPrice;
      if (key === 'maxPrice' && value < state.filters.minPrice) value = state.filters.minPrice;
      state.filters[key] = value;
      const scope = el.closest('#filters-rail') || el.closest('#filter-sheet-body');
      updateRangeUI(scope, scope && scope.id === 'filter-sheet-body' ? 'sheet' : 'rail');
      return;
    }
    if (el.id === 'pdp-qty') {
      const stock = getProductStock(getProduct(state.pdp.id), state.pdp.variantLabel);
      state.pdp.qty = Math.max(1, Math.min(stock, Number(el.value) || 1));
      el.value = state.pdp.qty;
      return;
    }
    // Persist checkout field values as they are typed
    if (el.closest('.step')) {
      const map = {
        'co-name': 'name', 'co-email': 'email', 'co-phone': 'phone',
        'co-address': 'address', 'co-neighborhood': 'neighborhood', 'co-notes': 'notes',
        'co-card-number': 'cardNumber', 'co-card-name': 'cardName',
        'co-card-exp': 'cardExp', 'co-card-cvv': 'cardCvv', 'co-store': 'store',
      };
      const key = map[el.id];
      if (key) state.checkout.data[key] = el.value;
    }
  });

  // Submit forms (search + newsletter)
  document.addEventListener('submit', (event) => {
    const form = event.target;
    event.preventDefault();
    if (form.dataset.action === 'search') {
      const input = form.querySelector('input[type="search"]');
      const q = input ? input.value.trim() : '';
      navigate(q ? `#/plp?q=${encodeURIComponent(q)}` : '#/plp');
      return;
    }
    if (form.dataset.action === 'newsletter') {
      const email = form.querySelector('#nl-email');
      const consent = form.querySelector('input[type="checkbox"]');
      if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        toast('Ingresa un correo válido para recibir tu 10%.', 'error');
        email.focus();
        return;
      }
      if (!consent.checked) {
        toast('Debes autorizar el tratamiento de datos para continuar.', 'error');
        return;
      }
      toast('¡Listo! Revisa tu correo para confirmar tu suscripción.');
      form.reset();
      return;
    }
    if (form.dataset.action === 'track-order') {
      const orderNumber = (form.querySelector('#tr-order')?.value || '').trim().toUpperCase();
      const email = (form.querySelector('#tr-email')?.value || '').trim().toLowerCase();
      const result = $('#tracking-result');
      if (!orderNumber) {
        toast('Ingresa tu número de pedido.', 'error');
        const orderInput = form.querySelector('#tr-order');
        if (orderInput) orderInput.focus();
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast('Ingresa el correo con el que compraste.', 'error');
        const emailInput = form.querySelector('#tr-email');
        if (emailInput) emailInput.focus();
        return;
      }
      const order = loadOrders()[orderNumber];
      if (!order) {
        result.innerHTML = `
          <div class="tracking__empty">
            <h2>No encontramos ese pedido</h2>
            <p>Verifica el número de pedido (por ejemplo, ATR-000000) o revisa el correo de confirmación.</p>
          </div>`;
        return;
      }
      if (order.email && order.email.toLowerCase() !== email) {
        result.innerHTML = `
          <div class="tracking__empty">
            <h2>El correo no coincide</h2>
            <p>El correo ingresado no corresponde a este pedido.</p>
          </div>`;
        return;
      }
      result.innerHTML = trackingResultHTML(order);
      return;
    }
  });

  // Escape closes overlays
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if ($('#cart-drawer') && !$('#cart-drawer').hidden) closeDrawer();
      else if ($('#filter-sheet') && !$('#filter-sheet').hidden) closeFilters();
      else closeBrands();
      closeMobileNav();
    }
  });

  // Nav links: close mobile nav on navigation
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-nav]');
    if (link) {
      closeMobileNav();
      closeBrands();
    }
  });
}

/* ── 22. Init ──────────────────────────────────────────────── */
function init() {
  state.cart = loadCart();
  state.wishlist = loadWishlist();
  state.checkout.lastOrder = loadLastOrder();
  bindEvents();
  renderHeaderStatic();
  updateCartCount();
  renderRoute();
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('hashchange', renderRoute);
