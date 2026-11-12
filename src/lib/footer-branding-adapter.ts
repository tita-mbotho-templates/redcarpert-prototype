import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";

const logoSource = "https://nirvanatakipcim.com/gelinlik/wp-content/uploads/2023/07/logo-alt-2-1024x322.png";
const logoSources = "/site-assets/51ff0e0c1d1e52de73.png 1024w, /site-assets/9316562415e262fe03.png 300w, /site-assets/e20a891318ad36cc08.png 768w, /site-assets/0006acef5cbf174467.png 670w, /site-assets/dd1e8f88b5bb9b2fdf.png 1049w";
const paragraphClass = "has-text-align-center wp-block-paragraph";
const paragraphStyle = "font-size:11px;font-style:normal;font-weight:500";
const elements = (nodes: DocumentNode[]) => nodes.filter((node): node is DocumentElement => typeof node !== "string");
const all = (nodes: DocumentNode[]): DocumentElement[] => elements(nodes).flatMap(node => [node, ...all(node.children)]);

/** Apply after homepage insertion and 07E corrections; guard captures before the approved three-column adaptation. */
export function adaptFooterBranding(document: SiteDocumentData): SiteDocumentData {
  const fail = (detail: string): never => { throw new Error(`Footer branding ${document.route}: incompatible footer (${detail})`); };
  const unique = (nodes: DocumentElement[], predicate: (node: DocumentElement) => boolean, detail: string) => {
    const matches = nodes.filter(predicate);
    return matches.length === 1 ? matches[0] : fail(detail);
  };
  const footer = unique(all(document.nodes), node => node.tag === "footer" || node.attrs.id === "footer", "unique footer");
  const home = document.route === "/";
  if (footer.tag !== "footer" || footer.attrs.id !== "footer" || footer.attrs.class !== "center"
    || footer.attrs["data-homepage-footer"] !== (home ? "true" : undefined)) fail("footer identity");
  const widgets = unique(elements(footer.children), node => node.attrs.class === "cols-wrapper footer-widgets section-boxed cols-4", "widget wrapper");
  const columns = elements(widgets.children);
  if (widgets.tag !== "div" || columns.length !== 4 || columns.some((node, i) => node.tag !== "div" || node.attrs.class !== (i === 3 ? "col nomargin" : "col"))) fail("four columns");
  const replacements = new Map<DocumentElement, DocumentElement>();
  const slot = (column: number, id: string, tag: string) => {
    const widget = unique(all(footer.children), node => node.attrs.id === id, id);
    if (!elements(columns[column].children).includes(widget) || widget.tag !== "aside"
      || widget.attrs.class !== `footer-box widget_block ${tag === "img" ? "widget_media_image" : "widget_text"}`) fail(`${id} widget`);
    if (tag === "img") {
      const wrappers = elements(widget.children);
      if (wrappers.length !== 1 || wrappers[0].tag !== "figure" || wrappers[0].attrs.class !== "wp-block-image size-large"
        || elements(wrappers[0].children).length !== 1) fail("logo wrapper");
    }
    return unique(all(widget.children), node => node.tag === tag, `${id} ${tag}`);
  };
  const text = (node: DocumentElement, expected: string[], value: string, className: string, style?: string) => {
    if (JSON.stringify(node.children) !== JSON.stringify(expected) || node.attrs.class !== className || node.attrs.style !== style) fail("text slot");
    replacements.set(node, { ...node, tag: "h2", attrs: { class: "redcarpert-footer-heading" }, children: [value] });
  };
  text(slot(1, "block-20", "p"), [home ? "Contact details to be confirmed" : "Vienna Austria  🇦🇹  Denizli Turkiye 🇹🇷 "], "COLLECTIONS", paragraphClass, paragraphStyle);
  const collections = slot(1, "block-24", "p");
  text(collections, [], "", "wp-block-paragraph");
  replacements.set(collections, { ...collections, attrs: { class: "redcarpert-footer-items" }, children: [
    { tag: "a", attrs: { href: "/product-category/mermaid/" }, children: ["Mermaid"] },
    { tag: "a", attrs: { href: "/product-category/ball_gown/" }, children: ["Ball Gown"] },
  ] });
  text(slot(2, "block-21", "p"), [home ? "Phone number to be confirmed" : "+90 533 413 16 09"], "FITTINGS", paragraphClass, paragraphStyle);
  const via = slot(2, "block-22", "p");
  const expectedFittingText = home ? "Contact details to be confirmed" : "bridalvanesa@gmail.com";
  if (via.children.length !== 1 || via.children[0] !== expectedFittingText
    || via.attrs.class !== paragraphClass || via.attrs.style !== paragraphStyle) fail("fitting content slot");
  // Emit the final, current WhatsApp CTA once. No redundant intermediate text.
  replacements.set(via, { ...via, attrs: { class: "redcarpert-footer-items" }, children: [
    { tag: "button", attrs: {
      type: "button", class: "redcarpert-footer-book",
      "data-whatsapp-preview": "", "aria-haspopup": "dialog",
      "aria-label": "Book a fitting via WhatsApp",
    }, children: [
      { tag: "i", attrs: { class: "fa-brands fa-whatsapp", "aria-hidden": "true" }, children: [] },
      { tag: "span", attrs: {}, children: ["Book a fitting"] },
    ] },
  ] });
  const credit = slot(3, "block-13", "p");
  const [label, br, strong] = credit.children;
  if (credit.children.length !== 3 || label !== (home ? "Client prototype" : "Website Design By:")
    || credit.attrs.class !== "has-text-align-center has-small-font-size wp-block-paragraph" || credit.attrs.style !== "font-style:normal;font-weight:600"
    || typeof br === "string" || br?.tag !== "br" || br.children.length || Object.keys(br.attrs).length
    || typeof strong === "string" || strong?.tag !== "strong" || strong.children.length !== 1 || Object.keys(strong.attrs).length) fail("business identity slot");
  if (typeof strong === "string") return fail("strong element");
  const sub = strong.children[0];
  if (typeof sub === "string" || sub.tag !== "sub" || Object.keys(sub.attrs).length || sub.children.length !== 1 || sub.children[0] !== (home ? "Demonstration only" : "TATLI MEDIA")) fail("former credit");
  if (typeof sub === "string") return fail("sub element");
  // Validate the former designer slot before dropping the redundant fourth column.
  replacements.set(widgets, { ...widgets, attrs: { ...widgets.attrs, class: "cols-wrapper footer-widgets section-boxed redcarpert-footer-columns" }, children: widgets.children.filter(node => node !== columns[3]) });
  replacements.set(footer, { ...footer, attrs: { ...footer.attrs, "data-redcarpert-footer": "true" } });
  const copyright = unique(all(footer.children), node => node.attrs.class === "copyrights", "copyright");
  if (copyright.tag !== "span" || copyright.children.length !== 1 || copyright.children[0] !== (home ? "\n© COPYRIGHT Redcarpert Wedding Dresses" : "\n© COPYRIGHT Brıdal Vanesa")) fail("copyright text");
  // Supply a build-time fallback so the text exists before JavaScript runs.
  // The browser replaces the year on each load; GitHub Pages does not require
  // an annual redeployment for the copyright to stay current.
  replacements.set(copyright, { ...copyright, children: [
    "© ",
    { tag: "span", attrs: { "data-copyright-year": "" }, children: [String(new Date().getFullYear())] },
    " Redcarpert Wedding Dresses",
  ] });

  const logo = slot(0, "block-9", "img");
  const placeholder = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="322" viewBox="0 0 1024 322"><text x="512" y="161" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="52" fill="white">Redcarpert Wedding Dresses</text></svg>';
  const expected = { loading: "lazy", decoding: "async", width: "1024", height: "322", src: home ? `data:image/svg+xml,${encodeURIComponent(placeholder)}` : logoSource, alt: home ? "Redcarpert Wedding Dresses" : "", class: "wp-image-13926", ...(!home ? { srcset: logoSources, sizes: "auto, (max-width: 1024px) 100vw, 1024px" } : {}) };
  if (logo.children.length || Object.keys(logo.attrs).length !== Object.keys(expected).length || Object.entries(expected).some(([key, value]) => logo.attrs[key] !== value)) fail("logo attributes");
  const attrs: Record<string, string> = { ...logo.attrs, src: "/redcarpert/brand/redcarpert-logo-optimized.webp", alt: "Redcarpert Wedding Dresses", style: "object-fit: contain; object-position: center" };
  delete attrs.srcset;
  delete attrs.sizes;
  replacements.set(logo, { ...logo, attrs });
  const profiles = unique(all(footer.children), node => node.attrs.class === "social-profiles", "unique social profiles");
  const bottom = unique(elements(footer.children), node => node.attrs.class === "footer-bottom", "footer bottom");
  const bottomBox = unique(elements(bottom.children), node => node.attrs.class === "section-boxed", "footer bottom box");
  if (!bottomBox.children.includes(profiles)) fail("social insertion point");
  const lists = elements(profiles.children);
  if (lists.length !== 1 || lists[0].tag !== "ul" || lists[0].attrs.class !== "social-icons") fail("social list");
  const socialLinks = all(profiles.children).filter(node => node.tag === "a");
  if (socialLinks.length !== 5 || socialLinks.some(node => node.attrs.href !== undefined || node.attrs.target !== undefined || node.attrs["aria-disabled"] !== "true")) fail("disabled socials");
  replacements.set(bottomBox, { ...bottomBox, children: bottomBox.children.filter(node => node !== profiles) });
  const brandWidget = unique(elements(columns[0].children), node => node.attrs.id === "block-9", "brand widget");
  replacements.set(brandWidget, { ...brandWidget, children: [...brandWidget.children, { tag: "p", attrs: { class: "redcarpert-footer-tagline" }, children: ["Elegant bridal collections"] }, profiles] });
  const visit = (node: DocumentNode): DocumentNode => {
    if (typeof node === "string") return node;
    const replacement = replacements.get(node) ?? node;
    const mapped = replacement.children.map(visit);
    const children = mapped.some((child, i) => child !== replacement.children[i]) ? mapped : replacement.children;
    return children !== replacement.children ? { ...replacement, children } : replacement;
  };
  return { ...document, nodes: document.nodes.map(visit) };
}
