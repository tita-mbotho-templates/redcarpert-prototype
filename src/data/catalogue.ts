/** Eight curated Pexels demonstration dresses. Never describe these as Redcarpert stock. */
export type DressCategory = "mermaid" | "ball_gown";
export interface CatalogueProduct {
  readonly id: string;
  readonly name: string;
  readonly category: DressCategory;
  readonly image: string;
  readonly imageAlt: string;
  readonly detailReference: null;
  readonly previewRoute: `/product/preview/${string}`;
  readonly status: "sample";
  readonly imageCredit: { readonly photographer: string; readonly sourceUrl: string; readonly provenance: string };
}
export const catalogueCategories = [
  { id: "mermaid", name: "Mermaid", route: "/product-category/mermaid/" },
  { id: "ball_gown", name: "Ball Gown", route: "/product-category/ball_gown/" },
] as const;

/** Images stay on Pexels servers: there is no image fetch/download in the build. */
export const catalogueProducts: readonly CatalogueProduct[] = [
  {
    id: "sample-mermaid", name: "Sample 01", category: "mermaid", status: "sample",
    image: "https://images.pexels.com/photos/5984238/pexels-photo-5984238.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Pexels demonstration bridal photograph (Mermaid silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-01-mermaid",
    imageCredit: { photographer: "Trần Long", sourceUrl: "https://www.pexels.com/photo/elegant-asian-bride-on-path-in-countryside-5984238/", provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-mermaid-02", name: "Sample 03", category: "mermaid", status: "sample",
    image: "https://images.pexels.com/photos/4122665/pexels-photo-4122665.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Pexels demonstration bridal photograph (Mermaid silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-03-mermaid",
    imageCredit: { photographer: "Tangerine Vitamins", sourceUrl: "https://www.pexels.com/photo/photo-of-woman-wearing-wedding-dress-4122665/", provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-mermaid-03", name: "Sample 04", category: "mermaid", status: "sample",
    image: "https://images.pexels.com/photos/2062534/pexels-photo-2062534.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Pexels demonstration bridal photograph (Mermaid silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-04-mermaid",
    imageCredit: { photographer: "Bestbe Models", sourceUrl: "https://www.pexels.com/photo/woman-wearing-mermaid-wedding-gown-2062534/", provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-mermaid-04", name: "Sample 05", category: "mermaid", status: "sample",
    image: "https://images.pexels.com/photos/955127/pexels-photo-955127.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Pexels demonstration bridal photograph (Mermaid silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-05-mermaid",
    imageCredit: { photographer: "Genaro Servín", sourceUrl: "https://www.pexels.com/photo/woman-standing-on-grass-field-wearing-mermaid-dress-955127/", provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ball-gown", name: "Sample 02", category: "ball_gown", status: "sample",
    image: "https://images.pexels.com/photos/4277970/pexels-photo-4277970.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Pexels demonstration bridal photograph (Ball Gown silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-02-ball-gown",
    imageCredit: { photographer: "Thalia villa", sourceUrl: "https://www.pexels.com/photo/woman-in-white-wedding-dress-4277970/", provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ball-gown-02", name: "Sample 06", category: "ball_gown", status: "sample",
    image: "https://images.pexels.com/photos/2929632/pexels-photo-2929632.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Pexels demonstration bridal photograph (Ball Gown silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-06-ball-gown",
    imageCredit: { photographer: "Hiren Lad", sourceUrl: "https://www.pexels.com/photo/woman-wearing-white-wedding-dress-2929632/", provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ball-gown-03", name: "Sample 07", category: "ball_gown", status: "sample",
    image: "https://images.pexels.com/photos/36297021/pexels-photo-36297021.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Pexels demonstration bridal photograph (Ball Gown silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-07-ball-gown",
    imageCredit: { photographer: "Andrea Prochilo", sourceUrl: "https://www.pexels.com/photo/elegant-bride-in-luxury-ballroom-setting-36297021/", provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ball-gown-04", name: "Sample 08", category: "ball_gown", status: "sample",
    image: "https://images.pexels.com/photos/36297026/pexels-photo-36297026.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: "Pexels demonstration bridal photograph (Ball Gown silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-08-ball-gown",
    imageCredit: { photographer: "Andrea Prochilo", sourceUrl: "https://www.pexels.com/photo/elegant-bride-in-luxurious-ballroom-setting-36297026/", provenance: "docs/asset-credits.md" },
  },
];
