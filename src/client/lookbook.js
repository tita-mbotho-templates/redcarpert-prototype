/** Book content is derived directly from the published catalogue; no duplicate images or links. */
import { catalogueProducts } from '../data/catalogue.ts';
import { displayDressPrice } from '../lib/pricing.ts';
export const lookbookEntries = catalogueProducts.map(product => ({
  id: product.id,
  category: product.category === 'mermaid' ? 'Mermaid' : 'Ball Gown',
  name: product.name,
  image: product.image,
  priceZar: product.priceZar,
  priceDisplay: displayDressPrice(product.priceZar),
  alt: product.imageAlt,
  href: product.previewRoute + '/',
  photographer: product.imageCredit.photographer,
}));
