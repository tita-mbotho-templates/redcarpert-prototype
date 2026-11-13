import type { DocumentNode, SiteDocumentData } from "@/types/site";
import imageLinks from "../data/image-links.json" with { type: "json" };

// Keep all user-supplied image URLs in image-links.json, not in source code.
// The three approved homepage panels have stable IDs and ordering. The same
// manifest drives both the rendered backgrounds and the hero preload.
const approvedHeroImages = imageLinks.home_page.hero;
if (approvedHeroImages.length !== 3) {
  throw new Error("image-links.json: home_page.hero must contain exactly three photographs");
}
function approvedHeroUrl(section: number, id: string): string {
  const image = approvedHeroImages[section];
  if (!image || image.id !== id || typeof image.url !== "string") {
    throw new Error(`image-links.json: missing or reordered homepage photograph ${id}`);
  }
  const url = new URL(image.url);
  if (url.protocol !== "https:" || /["'\\\\\n\r<>]/.test(image.url)) {
    throw new Error(`image-links.json: invalid image URL for ${id}`);
  }
  return image.url;
}
export const homepageBackgrounds = [
  { section: 0, original: "/site-assets/ec8b6b2c4222396c44.png", replacement: approvedHeroUrl(0, "home-page-1") },
  { section: 1, original: "/site-assets/9def3725208290c4ef.png", replacement: approvedHeroUrl(1, "home-page-2") },
  { section: 2, original: "/site-assets/46f8a1c412d65fd42b.png", replacement: approvedHeroUrl(2, "home-page-3") },
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
