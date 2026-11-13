import imageLinks from "./image-links.json" with { type: "json" };
import { requireImageLink } from "../lib/image-links.ts";

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
    image: requireImageLink(imageLinks.products.mermaid, "sample-mermaid").url,
    imageAlt: "Pexels demonstration bridal photograph (Mermaid silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-01-mermaid",
    imageCredit: { photographer: "Trần Long", sourceUrl: requireImageLink(imageLinks.products.mermaid, "sample-mermaid").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-mermaid-02", name: "Sample 03", category: "mermaid", status: "sample",
    image: requireImageLink(imageLinks.products.mermaid, "sample-mermaid-02").url,
    imageAlt: "Pexels demonstration bridal photograph (Mermaid silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-03-mermaid",
    imageCredit: { photographer: "Tangerine Vitamins", sourceUrl: requireImageLink(imageLinks.products.mermaid, "sample-mermaid-02").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-mermaid-03", name: "Sample 04", category: "mermaid", status: "sample",
    image: requireImageLink(imageLinks.products.mermaid, "sample-mermaid-03").url,
    imageAlt: "Pexels demonstration bridal photograph (Mermaid silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-04-mermaid",
    imageCredit: { photographer: "Bestbe Models", sourceUrl: requireImageLink(imageLinks.products.mermaid, "sample-mermaid-03").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-mermaid-04", name: "Sample 05", category: "mermaid", status: "sample",
    image: requireImageLink(imageLinks.products.mermaid, "sample-mermaid-04").url,
    imageAlt: "Pexels demonstration bridal photograph (Mermaid silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-05-mermaid",
    imageCredit: { photographer: "Genaro Servín", sourceUrl: requireImageLink(imageLinks.products.mermaid, "sample-mermaid-04").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ball-gown", name: "Sample 02", category: "ball_gown", status: "sample",
    image: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown").url,
    imageAlt: "Pexels demonstration bridal photograph (Ball Gown silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-02-ball-gown",
    imageCredit: { photographer: "Thalia villa", sourceUrl: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ball-gown-02", name: "Sample 06", category: "ball_gown", status: "sample",
    image: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown-02").url,
    imageAlt: "Pexels demonstration bridal photograph (Ball Gown silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-06-ball-gown",
    imageCredit: { photographer: "Hiren Lad", sourceUrl: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown-02").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ball-gown-03", name: "Sample 07", category: "ball_gown", status: "sample",
    image: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown-03").url,
    imageAlt: "Pexels demonstration bridal photograph (Ball Gown silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-07-ball-gown",
    imageCredit: { photographer: "Andrea Prochilo", sourceUrl: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown-03").sourceUrl, provenance: "docs/asset-credits.md" },
  },
  {
    id: "sample-ball-gown-04", name: "Sample 08", category: "ball_gown", status: "sample",
    image: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown-04").url,
    imageAlt: "Pexels demonstration bridal photograph (Ball Gown silhouette) — not Redcarpert inventory",
    detailReference: null, previewRoute: "/product/preview/sample-08-ball-gown",
    imageCredit: { photographer: "Andrea Prochilo", sourceUrl: requireImageLink(imageLinks.products.ball_gown, "sample-ball-gown-04").sourceUrl, provenance: "docs/asset-credits.md" },
  },
];
