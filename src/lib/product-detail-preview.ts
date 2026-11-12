import { catalogueProducts, type CatalogueProduct } from "../data/catalogue.ts";
import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";

const elements = (nodes: DocumentNode[]) => nodes.filter((n): n is DocumentElement => typeof n !== "string");
const all = (nodes: DocumentNode[]): DocumentElement[] => elements(nodes).flatMap(n => [n, ...all(n.children)]);
const node = (tag: string, attrs: Record<string, string>, children: DocumentNode[]): DocumentElement => ({ tag, attrs, children });

/** Single source of truth: remote Pexels images are shared by book, grid and details. */
export const sampleGalleryImages: Record<string, {src: string; width: number; height: number}> = Object.fromEntries(
  catalogueProducts.map(product => [product.id, {src:product.image,width:1200,height:1800}]),
);

export function sampleDetailTitle(product: CatalogueProduct): string {
  return `${product.name} — ${product.category === "mermaid" ? "Mermaid" : "Ball Gown"}`;
}

export function sampleFittingMessage(product: CatalogueProduct): string {
  return `Hello Redcarpert Wedding Dresses!\n\nI would like to enquire about a fitting. I was viewing the ${sampleDetailTitle(product)} demonstration. I understand this photograph is sample imagery, not confirmed Redcarpert inventory.\n\nCould you please provide more information?\n\nThank you.`;
}

/** New demonstration document from one guarded capture; legacy routes/data stay intact. */
export function createProductDetailPreview(source: SiteDocumentData, product: CatalogueProduct): SiteDocumentData {
  const fail = (detail: string): never => { throw new Error(`Product detail preview: incompatible ${detail}`); };
  if (source.route !== "/product/arabella") fail("source route");
  const original = catalogueProducts.find(entry => entry.id === product.id);
  if (!original || JSON.stringify(product) !== JSON.stringify(original)
    || product.status !== "sample" || product.detailReference !== null) fail("sample mapping");
  const one = (nodes: DocumentElement[], predicate: (n: DocumentElement) => boolean, detail: string) => {
    const matches = nodes.filter(predicate);
    return matches.length === 1 ? matches[0] : fail(detail);
  };
  const root = one(all(source.nodes), n => n.attrs.id === "product-15828", "product root");
  const parts = elements(root.children);
  if (root.tag !== "div" || parts.length !== 4 || parts.map(n => n.attrs.class).join("|") !== "images|summary entry-summary|woocommerce-tabs wc-tabs-wrapper|related products") fail("product sections");
  const [images, summary, tabs, related] = parts;
  const slider = one(elements(images.children), n => n.attrs.class === "slider wpgis-slider-for", "slider");
  const thumbs = one(elements(images.children), n => n.attrs.id === "wpgis-gallery", "thumbnails");
  if (elements(slider.children).length !== 5 || elements(thumbs.children).length !== 5) fail("gallery count");
  const firstSlide = elements(slider.children)[0];
  const firstImage = elements(firstSlide.children)[0];
  if (firstSlide.attrs.class !== "zoom" || firstImage.tag !== "img" || firstImage.attrs.width !== "848" || firstImage.attrs.height !== "1264"
    || firstImage.attrs.src !== "/site-assets/da2a2c0ad7f169a475.png") fail("gallery frame");
  const title = one(elements(summary.children), n => n.tag === "h1" && n.attrs.class === "product_title entry-title", "title");
  const price = one(elements(summary.children), n => n.attrs.class === "price", "shipping slot");
  if (title.children.join("") !== "Arabella" || price.children.join("") !== "Worldwide Shipping" || elements(summary.children).length !== 3) fail("summary content");
  if (elements(tabs.children).map(n => n.attrs.id || n.attrs.class).join("|") !== "tabs wc-tabs|tab-description|tab-reviews"
    || all(related.children).filter(n => n.tag === "li").length !== 3) fail("tabs/related sections");
  // SHARE is a sibling of the captured product, not part of its summary/gallery.
  const share = one(all(source.nodes), n => n.attrs.class === "social-share", "share section");
  const parent = one(all(source.nodes), n => elements(n.children).includes(root), "product parent");
  const shareItems = all(share.children).filter(n => n.tag === "li");
  if (share.tag !== "div" || !elements(parent.children).includes(share)
    || elements(share.children)[0]?.children.join("") !== "Share"
    || shareItems.map(n => n.attrs.title).join("|") !== "Facebook|Twitter|Google+|Pinterest"
    || shareItems.some(n => n.attrs["data-url"] !== "https://bridalvanesa.com/product/arabella/")) fail("share content");

  const category = product.category === "mermaid" ? "Mermaid" : "Ball Gown";
  const gallery = sampleGalleryImages[product.id as keyof typeof sampleGalleryImages];
  const preview = { ...root, attrs: { id: `detail-${product.id}`, class: "product", "data-detail-preview": product.id }, children: [
    { ...images, children: [{ ...slider, children: [node("div", { class: "zoom", "data-sample-frame": "true" }, [
      node("img", { src: gallery.src, width: String(gallery.width), height: String(gallery.height), class: "attachment-shop_single size-shop_single wp-post-image", alt: product.imageAlt, decoding: "async", fetchpriority: "high" }, []),
      node("a", { href: gallery.src, class: "wpgis-popup fa fa-expand", "data-fancybox": "product-gallery", "aria-label": "Enlarge sample photograph" }, []),
    ])] }] },
    { ...summary, children: [
      { ...title, children: [sampleDetailTitle(product)] },
      node("p", { class: "sample-detail-notice" }, ["Sample imagery — not confirmed Redcarpert inventory."]),
      node("div", { class: "product_meta" }, ["Category: ", node("a", { href: `/product-category/${product.category}/`, rel: "tag" }, [category])]),
      node("p", {}, [node("button", { type: "button", class: "button", "data-whatsapp-preview": "", "aria-haspopup": "dialog" }, ["Enquire About a Fitting"])]),
    ] },
    { ...tabs, children: [
      node("ul", { class: "tabs wc-tabs", role: "tablist" }, [node("li", { role: "presentation", class: "description_tab", id: "tab-title-description" }, [node("a", { href: "#tab-description", role: "tab", "aria-controls": "tab-description" }, ["Sample information"])])]),
      node("div", { class: "woocommerce-Tabs-panel woocommerce-Tabs-panel--description panel entry-content wc-tab", id: "tab-description", role: "tabpanel", "aria-labelledby": "tab-title-description" }, [
        node("h2", {}, ["Sample information"]),
        node("p", {}, ["This demonstration uses a stock photograph. Dress information will be added after client confirmation."]),
      ]),
    ] },
  ] };
  const visit = (n: DocumentNode): DocumentNode | null => {
    if (typeof n === "string") return n;
    if (n === share) return null;
    if (n === root) return preview;
    const children = n.children.map(visit).filter((child): child is DocumentNode => child !== null);
    return children.length !== n.children.length || children.some((c, i) => c !== n.children[i]) ? { ...n, children } : n;
  };
  return { ...source, route: product.previewRoute, title: `${sampleDetailTitle(product)} | Sample Preview | Redcarpert`, description: "Sample dress detail demonstration. Stock imagery, not confirmed Redcarpert inventory.", nodes: source.nodes.map(visit).filter((n): n is DocumentNode => n !== null) };
}
