import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";

const originalItems = [
  ["15418", "HOME", "/"], ["15821", "PRODUCTS", "/product/"],
  ["15416", "About Us", "/about-us/"], ["15417", "Contact Us", "/contact-us/"],
  ["16080", "OUR BRIDES", "/our-brides/"], ["16165", "ATELIER", "/atelier-2/"],
  ["16171", "STORE", "/store/"],
] as const;
const originalCategories = [
  ["15421", "MERMAID", "/product-category/mermaid/"],
  ["15422", "Ball Gown", "/product-category/ball_gown/"],
  ["16276", "BRIDAL BAGS", "/product-category/bridal-bags/"],
] as const;
const originalSocialLinks = [
  "https://www.instagram.com/bridal_vanesa/", "https://www.youtube.com/@BridalVanesa",
  "https://twitter.com/vanesabridal", "https://tr.pinterest.com/vanesabridal/", "https://www.tiktok.com/@bridalvanesa",
];
const elements = (nodes: DocumentNode[]): DocumentElement[] => nodes.filter((n): n is DocumentElement => typeof n !== "string");
const hasClass = (n: DocumentElement, name: string) => (n.attrs.class ?? "").split(/\s+/).includes(name);
const find = (nodes: DocumentNode[], predicate: (n: DocumentElement) => boolean): DocumentElement[] => elements(nodes).flatMap(n => [...(predicate(n) ? [n] : []), ...find(n.children, predicate)]);

/** Change the verified source header before PEXETO creates its responsive menu. */
export function adaptNavigation(document: SiteDocumentData): SiteDocumentData {
  const fail = (detail: string): never => { throw new Error(`Navigation ${document.route}: incompatible captured header (${detail})`); };
  const one = (nodes: DocumentNode[], predicate: (n: DocumentElement) => boolean, description: string) => {
    const matches = find(nodes, predicate);
    return matches.length === 1 ? matches[0] : fail(description);
  };
  const header = one(document.nodes, n => n.attrs.id === "header", "unique #header");
  if (header.tag !== "header") fail("header element");
  const section = one(header.children, n => hasClass(n, "section-header"), "section header");
  const nav = one(section.children, n => hasClass(n, "navigation-container"), "navigation container");
  const mobile = one(section.children, n => hasClass(n, "mobile-nav"), "mobile control");
  const menu = one(nav.children, n => n.attrs.id === "menu", "#menu");
  if (section.tag !== "div" || !hasClass(section, "section-boxed") || nav.tag !== "nav"
    || !elements(section.children).includes(nav) || !elements(section.children).includes(mobile)
    || menu.tag !== "div" || !hasClass(menu, "nav-menu") || !elements(nav.children).includes(menu)) fail("menu wrappers");
  const list = one(menu.children, n => n.attrs.id === "menu-blog-layouts", "menu list");
  if (list.tag !== "ul" || !hasClass(list, "menu-ul") || !elements(menu.children).includes(list)) fail("menu list wrapper");
  const logo = one(section.children, n => n.attrs.id === "logo-container", "logo");
  const logoLinks = elements(logo.children);
  if (logoLinks.length !== 1 || logoLinks[0].tag !== "a" || logoLinks[0].attrs.href !== "/") fail("root logo link");

  const validateItems = (parent: DocumentElement, expected: readonly (readonly [string, string, string])[]) => {
    const items = elements(parent.children);
    if (items.length !== expected.length) fail("menu item count");
    items.forEach((item, i) => {
      const [id, text, href] = expected[i];
      const children = elements(item.children);
      const link = children[0];
      if (item.tag !== "li" || item.attrs.id !== `menu-item-${id}` || !hasClass(item, "menu-item") || !hasClass(item, `menu-item-${id}`)
        || !link || link.tag !== "a" || link.attrs.href !== href || link.children.length !== 1 || link.children[0] !== text
        || children.length !== (id === "15821" ? 2 : 1)) fail(`menu item ${id}`);
    });
    return items;
  };
  const items = validateItems(list, originalItems);
  const products = items[1];
  const submenu = elements(products.children)[1];
  if (!hasClass(products, "menu-item-has-children") || submenu.tag !== "ul" || !hasClass(submenu, "sub-menu")) fail("original two-level submenu");
  const categories = validateItems(submenu, originalCategories);
  const socials = one(header.children, n => hasClass(n, "social-icons"), "header social icons");
  const socialLinks = find(socials.children, n => n.tag === "a");
  const profiles = one(nav.children, n => hasClass(n, "social-profiles"), "social wrapper");
  if (socials.tag !== "ul" || !elements(profiles.children).includes(socials) || socialLinks.length !== originalSocialLinks.length
    || socialLinks.some((link, i) => link.attrs.href !== originalSocialLinks[i])) fail("original social destinations");

  // Replacements are keyed by source identity: body, footer, logo, cart and metadata stay shared.
  const replacements = new Map<DocumentElement, DocumentElement>();
  const route = document.route.replace(/\/+$/, "") || "/";
  const catalogue = route === "/product" || /^\/product\/page\/\d+$/.test(route);
  const catalogueChild = /^\/(product\/|product-category\/|product-tag\/|marka\/)/.test(route) && !catalogue;
  const current = new Map<string, string>([
    ["/", "15418"], ["/about-us", "15416"], ["/contact-us", "15417"], ["/our-brides", "16080"], ["/digital-lookbook", "16165"],
    ["/product-category/mermaid", "15421"], ["/product-category/ball_gown", "15422"],
  ]).get(route) ?? (catalogue ? "15821" : undefined);
  const updateItem = (item: DocumentElement, label: string, disabled = false, destination?: string) => {
    const id = item.attrs.id.slice("menu-item-".length);
    const active = id === current;
    const parent = id === "15821" && catalogueChild;
    const classes = (item.attrs.class ?? "").split(/\s+/).filter(c => !/^current[-_]/.test(c));
    if (active) classes.push("current-menu-item", "current_page_item");
    if (parent) {
      classes.push("current-menu-ancestor", "current_page_ancestor");
      if (current === "15421" || current === "15422") classes.push("current-menu-parent", "current_page_parent");
    }
    const link = elements(item.children)[0];
    const attrs = { ...link.attrs };
    if (destination) attrs.href = destination;
    delete attrs["aria-current"];
    if (active) attrs["aria-current"] = "page";
    if (disabled) {
      delete attrs.href;
      Object.assign(attrs, { role: "link", "aria-disabled": "true", tabindex: "0" });
    }
    if (label !== link.children[0] || JSON.stringify(attrs) !== JSON.stringify(link.attrs)) replacements.set(link, { ...link, attrs, children: label === link.children[0] ? link.children : [label] });
    const className = classes.join(" ");
    if (className !== item.attrs.class) replacements.set(item, { ...item, attrs: { ...item.attrs, class: className } });
  };
  const order = [0, 1, 5, 4, 2, 3];
  const labels = ["Home", "Wedding Dresses", "Digital Lookbook", "Our Brides", "About Us", "Contact Us"];
  order.forEach((index, i) => updateItem(items[index], labels[i], false, index === 5 ? "/digital-lookbook/" : undefined));
  categories.slice(0, 2).forEach((item, i) => updateItem(item, i ? "Ball Gown" : "Mermaid"));
  const reorder = (node: DocumentElement, ordered: DocumentElement[]) => {
    let index = 0;
    return { ...node, children: node.children.flatMap<DocumentNode>(child => typeof child === "string" ? [child] : index < ordered.length ? [ordered[index++]] : []) };
  };
  replacements.set(list, reorder(list, order.map(i => items[i])));
  replacements.set(submenu, reorder(submenu, categories.slice(0, 2)));
  // Remove only the approved header icon list; leave its wrappers and hidden cart intact.
  replacements.set(profiles, { ...profiles, children: profiles.children.filter(child => child !== socials) });
  const visit = (node: DocumentNode): DocumentNode => {
    if (typeof node === "string") return node;
    const replacement = replacements.get(node) ?? node;
    const children = replacement.children.map(visit);
    return children.some((child, i) => child !== replacement.children[i]) ? { ...replacement, children } : replacement;
  };
  return { ...document, nodes: document.nodes.map(visit) };
}
