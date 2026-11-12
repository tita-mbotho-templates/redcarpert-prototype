import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";

const legacyContact = "https://www.instagram.com/bridal_vanesa/?utm_source=chatgpt.com";

/** Runs after footer insertion/neutralisation; copies only changed nodes and ancestors. */
export function correctFooterLinks(document: SiteDocumentData): SiteDocumentData {
  const fail = (reason: string): never => { throw new Error(`Footer corrections ${document.route}: ${reason}`); };
  let contacts = 0, controls = 0;
  const visit = (node: DocumentNode, inFooter = false): DocumentNode => {
    if (typeof node === "string") return node;
    inFooter ||= node.tag === "footer" && node.attrs.id === "footer";
    let attrs = node.attrs;
    if (inFooter && attrs.class === "scroll-to-top") {
      if (node.tag !== "div" || Object.keys(attrs).length !== 1) fail("scroll control shape");
      controls++;
      attrs = { ...attrs, role: "button", tabindex: "0", "aria-label": "Scroll to top" };
    }
    if (node.tag === "a" && attrs.href === legacyContact) {
      if (document.route !== "/contact-us" || inFooter || JSON.stringify(attrs) !== JSON.stringify({ class: "decorated-link", href: legacyContact, target: "_new", rel: "noopener", "data-start": "905", "data-end": "986" }) || node.children.length !== 1 || node.children[0] !== "@bridal_vanesa") fail("Contact Instagram shape");
      contacts++;
      attrs = { ...attrs, role: "link", "aria-disabled": "true", "aria-label": "Instagram: destination not yet available", style: "cursor: pointer" };
      delete attrs.href;
      delete attrs.target;
    }
    const mapped = node.children.map(child => visit(child, inFooter));
    const children = mapped.some((child, i) => child !== node.children[i]) ? mapped : node.children;
    return attrs !== node.attrs || children.some((child, i) => child !== node.children[i]) ? { ...node, attrs, children } satisfies DocumentElement : node;
  };
  const nodes = document.nodes.map(node => visit(node));
  if (contacts !== (document.route === "/contact-us" ? 1 : 0) || controls !== (document.route === "/" ? 0 : 1)) fail("expected unique contact link and control");
  return { ...document, nodes };
}
