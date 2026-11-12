import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";
import type { CatalogueProduct } from "@/data/catalogue";

const routes = { "/product": [100, "PRODUCTS", "Wedding Dresses"], "/product-category/mermaid": [78, "Mermaid", "Mermaid"], "/product-category/ball_gown": [36, "Ball Gown", "Ball Gown"] } as const;
const elements = (nodes: DocumentNode[]) => nodes.filter((n): n is DocumentElement => typeof n !== "string");
const all = (nodes: DocumentNode[]): DocumentElement[] => elements(nodes).flatMap(n => [n, ...all(n.children)]);

/** Listing-only immutable adaptation. Raw captures and every unrelated route remain untouched. */
export function adaptCatalogue(document: SiteDocumentData, catalogueProducts: readonly CatalogueProduct[]): SiteDocumentData {
  if (!(document.route in routes)) return document;
  const [count, oldTitle, newTitle] = routes[document.route as keyof typeof routes];
  const fail = (detail: string): never => { throw new Error(`Catalogue ${document.route}: incompatible capture (${detail})`); };
  const one = (nodes: DocumentElement[], predicate: (n: DocumentElement) => boolean, detail: string) => {
    const found = nodes.filter(predicate);
    return found.length === 1 ? found[0] : fail(detail);
  };
  const nodes = all(document.nodes);
  const grid = one(nodes, n => n.tag === "ul" && n.attrs.class === "products columns-4", "grid");
  const cards = elements(grid.children);
  if (cards.length !== count || Object.keys(grid.attrs).length !== 1) fail("card count/grid attributes");
  const ordering = one(nodes, n => n.attrs.class === "woocommerce-ordering", "ordering");
  if (ordering.tag !== "form" || ordering.attrs.method !== "get") fail("ordering form");
  const select = one(all(ordering.children), n => n.tag === "select" && n.attrs.class === "orderby", "ordering select");
  if (elements(select.children).map(n => n.attrs.value).join() !== "menu_order,popularity,rating,date,price,price-desc") fail("ordering options");
  const result = one(nodes, n => n.attrs.class === "woocommerce-result-count", "result count");
  const heading = one(nodes, n => n.tag === "h1" && n.children.length === 1 && n.children[0] === oldTitle, "heading");
  if (nodes.filter(n => n.tag === "h1").length !== (document.route === "/product" ? 1 : 2)) fail("heading count");
  if (heading.children.length !== 1 || heading.children[0] !== oldTitle || result.tag !== "p" || result.children.length !== 1 || typeof result.children[0] !== "string") fail("listing text");
  const pagination = nodes.filter(n => n.attrs.class === "woocommerce-pagination");
  if (pagination.length !== (document.route === "/product" ? 1 : 0)) fail("pagination count");
  const cardParts = cards.map(card => {
    if (card.tag !== "li" || !card.attrs.class?.startsWith("product type-product post-")) return fail("card shape");
    const anchor = one(elements(card.children), n => n.tag === "a" && n.attrs.class === "woocommerce-LoopProduct-link woocommerce-loop-product__link", "card anchor");
    const image = one(elements(anchor.children), n => n.tag === "img", "card image");
    const title = one(elements(anchor.children), n => n.tag === "h2" && n.attrs.class === "woocommerce-loop-product__title", "card title");
    const price = one(elements(anchor.children), n => n.attrs.class === "price", "shipping slot");
    if (!anchor.attrs.href?.startsWith("/product/") || image.attrs.width !== "370" || image.attrs.height !== "444" || image.attrs.class !== "attachment-woocommerce_thumbnail size-woocommerce_thumbnail" || price.tag !== "span" || price.children.length !== 1 || price.children[0] !== "Worldwide Shipping" || title.children.length !== 1 || typeof title.children[0] !== "string") fail("card content");
    if (elements(card.children).some(n => n !== anchor && !(n.tag === "span" && n.attrs.class === "screen-reader-text"))) fail("unexpected card control");
    return { card, anchor, image, title, price };
  });
  const products = catalogueProducts.filter(p => document.route === "/product" || document.route.endsWith(`/${p.category}`));
  if (!products.length || products.some(p => p.status !== "sample" || p.detailReference !== null)) fail("sample readiness");
  const replacements = new Map<DocumentElement, DocumentElement>();
  replacements.set(heading, { ...heading, ...(document.route === "/product" ? { attrs: { ...heading.attrs, "data-catalogue-heading": "true" } } : {}), children: [newTitle] });
  replacements.set(result, { ...result, children: ["Sample photographs — not client inventory"] });
  // The catalogue landing page receives a working three-option filter.
  // Category pages retain the legacy ordering placeholder and unchanged layout.
  if (document.route === "/product") {
    const categories = [
      ["all", "All Dresses"],
      ["mermaid", "Mermaid"],
      ["ball_gown", "Ball Gown"],
    ] as const;
    replacements.set(ordering, {
      tag: "div",
      attrs: { class: "woocommerce-ordering redcarpert-catalogue-filter", "data-catalogue-filter": "", role: "group", "aria-label": "Filter wedding dresses by category" },
      children: [
        ...categories.map(([id, label]) => ({
          tag: "button",
          attrs: { type: "button", "data-filter-category": id, "aria-pressed": id === "all" ? "true" : "false" },
          children: [label],
        })),
        { tag: "span", attrs: { class: "redcarpert-filter-status", "data-filter-status": "", role: "status", "aria-live": "polite" }, children: ["Showing " + products.length + " of " + products.length + " sample dresses"] },
      ],
    });
  } else {
    replacements.set(ordering, { tag: "div", attrs: { class: "woocommerce-ordering", "aria-hidden": "true", style: "visibility: hidden; pointer-events: none; width: 237px; max-width: 100%" }, children: [
      { ...select, attrs: { disabled: "", "aria-label": "Catalogue ordering unavailable", style: "width: 100%" }, children: [{ tag: "option", attrs: {}, children: ["Catalogue preview"] }] },
    ] });
  }
  const children = products.map((product, index): DocumentElement => {
    const { card, anchor, image, title, price } = cardParts[index];
    const imageAttrs: Record<string, string> = { ...image.attrs, src: product.image, alt: product.imageAlt, width: "370", height: "370", style: "aspect-ratio: 1 / 1; object-fit: cover; object-position: center 25%" };
    delete imageAttrs.srcset;
    delete imageAttrs.sizes;
    return { ...card, attrs: { class: `product${index % 4 === 0 ? " first" : index % 4 === 3 ? " last" : ""}`, "data-catalogue-id": product.id, "data-catalogue-category": product.category }, children: card.children.flatMap<DocumentNode>(node => {
      if (typeof node === "string") return [node];
      if (node !== anchor) return [];
      const attrs: Record<string, string> = { ...anchor.attrs, href: product.previewRoute, "aria-label": `${product.name}: view sample detail demonstration`, style: "cursor: pointer" };
      return [{ ...anchor, attrs, children: anchor.children.map(child => child === image ? { ...image, attrs: imageAttrs } : child === title ? { ...title, children: [product.name] } : child === price ? { ...price, attrs: { class: "catalogue-sample-note" }, children: ["Sample imagery"] } : child) }];
    }) };
  });
  replacements.set(grid, { ...grid, attrs: { ...grid.attrs, "data-catalogue-preview": "true" }, children });
  const visit = (node: DocumentNode): DocumentNode | null => {
    if (typeof node === "string") return node;
    if (pagination.includes(node)) return null;
    const replacement = replacements.get(node);
    if (replacement) return replacement;
    const children = node.children.map(visit).filter((n): n is DocumentNode => n !== null);
    return children.length !== node.children.length || children.some((child, i) => child !== node.children[i]) ? { ...node, children } : node;
  };
  return { ...document, nodes: document.nodes.map(visit).filter((n): n is DocumentNode => n !== null) };
}
