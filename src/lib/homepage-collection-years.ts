import type { DocumentNode, SiteDocumentData } from "../types/site";

/**
 * Replace only the approved hero collection-year text with semantic year spans.
 * The build year is a no-JavaScript fallback; runtime refreshes both spans
 * using the visitor's calendar year, without a yearly deployment.
 */
export function adaptHomepageCollectionYears(
  document: SiteDocumentData,
  currentYear = new Date().getFullYear(),
): SiteDocumentData {
  if (document.route !== "/") return document;
  const path = [1, 1, 4, 1, 1, 0, 0, 0];
  const expected = "2026 - 2027 Collectıon";
  const fail = (): never => { throw new Error("Homepage collection heading: captured title changed"); };
  const update = (nodes: DocumentNode[], depth: number): DocumentNode[] => {
    const index = path[depth];
    const node = nodes[index];
    if (!node || typeof node === "string") return fail();
    if (depth === path.length - 1) {
      if (node.tag !== "h2" || node.attrs.class !== "section-title"
          || node.children.length !== 1 || node.children[0] !== expected) return fail();
      return nodes.map((item, i) => i === index
        ? { ...node, children: [
          { tag: "span", attrs: { "data-collection-year": "start" }, children: [String(currentYear)] },
          " - ",
          { tag: "span", attrs: { "data-collection-year": "end" }, children: [String(currentYear + 1)] },
          " Collectıon",
        ] }
        : item);
    }
    const children = update(node.children, depth + 1);
    return nodes.map((item, i) => i === index ? { ...node, children } : item);
  };
  return { ...document, nodes: update(document.nodes, 0) };
}
