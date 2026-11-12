import type { CatalogueProduct } from '../data/catalogue';

/** Fail closed before output generation: exactly eight credited Pexels samples. */
export function validateCatalogue(products: readonly CatalogueProduct[]): void {
  if (products.length !== 8) throw new Error('Catalogue must contain eight approved samples');
  const ids = new Set<string>(), routes = new Set<string>(), images = new Set<string>();
  const counts = {mermaid: 0, ball_gown: 0};
  for (const product of products) {
    if (!/^[a-z0-9-]+$/.test(product.id) || ids.has(product.id)) throw new Error(`Duplicate or invalid product ID: ${product.id}`);
    ids.add(product.id);
    if (product.category !== 'mermaid' && product.category !== 'ball_gown') throw new Error(`Unapproved category for ${product.id}`);
    counts[product.category] += 1;
    if (product.status !== 'sample' || product.detailReference !== null) throw new Error(`Unverified inventory: ${product.id}`);
    const image = /^https:\/\/images\.pexels\.com\/photos\/([1-9]\d+)\/pexels-photo-\1\.jpeg\?auto=compress&cs=tinysrgb&w=1200$/.exec(product.image);
    if (!image || images.has(image[1])) throw new Error(`Unapproved or duplicate Pexels image: ${product.id}`);
    images.add(image[1]);
    if (!product.imageCredit || !new RegExp('^https://www\\.pexels\\.com/photo/[a-z0-9-]+-' + image[1] + '/$').test(product.imageCredit.sourceUrl)
      || !product.imageCredit.photographer.trim() || product.imageCredit.provenance !== 'docs/asset-credits.md') throw new Error(`Missing image provenance: ${product.id}`);
    if (!/^\/product\/preview\/[a-z0-9-]+$/.test(product.previewRoute) || routes.has(product.previewRoute)) throw new Error(`Duplicate or invalid preview route: ${product.previewRoute}`);
    routes.add(product.previewRoute);
    if (!/^Sample (0[1-8])$/.test(product.name) || !product.imageAlt.includes('not Redcarpert inventory')) throw new Error(`Missing sample disclosure: ${product.id}`);
  }
  if (counts.mermaid !== 4 || counts.ball_gown !== 4) throw new Error('Catalogue must have four samples per category');
}
