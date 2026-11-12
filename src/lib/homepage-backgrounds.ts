import type { DocumentNode, SiteDocumentData } from "@/types/site";

// Client-supplied ImageKit photographs. Keep the approved layout and order:
// first panel = home-page-1, second = home-page-2, third = home-page-3.
// Centralise URL references for hero preload, global loader, and page rendering.
export const homepageBackgrounds = [
  { section: 0, original: "/site-assets/ec8b6b2c4222396c44.png", replacement: "https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-1.webp?updatedAt=1794351596508" },
  { section: 1, original: "/site-assets/9def3725208290c4ef.png", replacement: "https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-2.webp?updatedAt=1794351597603" },
  { section: 2, original: "/site-assets/46f8a1c412d65fd42b.png", replacement: "https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-3.webp?updatedAt=1794351600184" },
] as const;

export function adaptHomepageBackgrounds(document: SiteDocumentData): SiteDocumentData {
  if (document.route !== "/") return document;
  let nodes = document.nodes;
  for (const background of homepageBackgrounds) {
    const path = [1, 1, 4, 1, 1, background.section];
    const expected = `background-image:url("${background.original}");background-position:center center;`;
    const fail = (): never => { throw new Error(`Homepage background ${background.section}: expected original section and inline style at ${path.join("/")}`); };
    const update = (children: DocumentNode[], depth: number): DocumentNode[] => {
      const index = path[depth];
      const node = children[index];
      if (!node || typeof node === "string") return fail();
      if (depth === path.length - 1) {
        if (node.tag !== "div" || node.attrs.class !== "section section-text layout-cc" || node.attrs.style !== expected) return fail();
        return children.map((child, i) => i === index
          ? { ...node, attrs: { ...node.attrs,
              // CSS draws one blurred cover layer plus the uncropped original.
              // Keep the original background declaration as an image fallback.
              style: expected.replace(background.original, background.replacement)
                + `--redcarpert-home-photo:url("${background.replacement}");`,
            } }
          : child);
      }
      const updated = update(node.children, depth + 1);
      return children.map((child, i) => i === index ? { ...node, children: updated } : child);
    };
    nodes = update(nodes, 0);
  }
  return { ...document, nodes };
}
