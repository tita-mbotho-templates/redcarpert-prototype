import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";

/** Replace only the verified captured header logo, sharing every untouched subtree. */
export function adaptLogo(document: SiteDocumentData): SiteDocumentData {
  const find = (nodes: DocumentNode[], predicate: (node: DocumentElement) => boolean): DocumentElement[] =>
    nodes.flatMap(node => typeof node === "string" ? [] : [...(predicate(node) ? [node] : []), ...find(node.children, predicate)]);
  const fail = (): never => { throw new Error(`Logo ${document.route}: incompatible captured header`); };
  const headers = find(document.nodes, node => node.attrs.id === "header");
  if (headers.length !== 1 || headers[0].tag !== "header") fail();
  const logos = find(headers[0].children, node => node.attrs.id === "logo-container");
  if (logos.length !== 1 || logos[0].tag !== "div") fail();
  const elements = (nodes: DocumentNode[]) => nodes.filter((node): node is DocumentElement => typeof node !== "string");
  const links = elements(logos[0].children);
  if (links.length !== 1 || links[0].tag !== "a" || links[0].attrs.href !== "/") fail();
  const images = elements(links[0].children);
  if (images.length !== 1 || images[0].tag !== "img" || images[0].attrs.src !== "/site-assets/ce75cb7d04ef279275.png"
    || images[0].attrs.alt !== "Bridal Vanesa" || images[0].children.length || Object.keys(images[0].attrs).sort().join() !== "alt,src") fail();
  const image = images[0];
  const visit = (node: DocumentNode): DocumentNode => {
    if (typeof node === "string") return node;
    if (node === image) return { ...node, attrs: { ...node.attrs, src: "/redcarpert/brand/redcarpert-logo-optimized.webp", alt: "Redcarpert", style: "object-fit: contain" } };
    const children = node.children.map(visit);
    return children.some((child, index) => child !== node.children[index]) ? { ...node, children } : node;
  };
  return { ...document, nodes: document.nodes.map(visit) };
}
