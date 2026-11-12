/**
 * Public Redcarpert prototype routes.
 *
 * Only approved routes are exposed; sitePages contains seven retained presentation
 * shells plus one private dress-detail template used for sample previews.
 * The homepage is added explicitly by scripts/generate.ts.
 */
export const approvedCapturedRoutes = [
  "/",
  "/product",
  "/product-category/mermaid",
  "/product-category/ball_gown",
  "/about-us",
  "/contact-us",
  "/our-brides",
] as const;

export const authoredPrototypeRoutes = ["/digital-lookbook"] as const;

const approvedCapturedRouteSet: ReadonlySet<string> = new Set(approvedCapturedRoutes);

export function isApprovedCapturedRoute(route: string): boolean {
  return approvedCapturedRouteSet.has(route);
}

/** Fail closed if a preserved page disappears or a sample path collides. */
export function publicStaticRoutes(
  captures: Readonly<Record<string, unknown>>,
  samplePreviewRoutes: readonly string[],
): string[] {
  for (const route of approvedCapturedRoutes) {
    if (!Object.hasOwn(captures, route)) {
      throw new Error(`Approved Redcarpert route missing from captures: ${route}`);
    }
  }

  const publicCaptured = approvedCapturedRoutes.filter((route) => route !== "/");
  for (const route of authoredPrototypeRoutes) {
    if (Object.hasOwn(captures, route)) throw new Error(`Authored prototype route collides with capture: ${route}`);
  }
  const used = new Set<string>([...publicCaptured, ...authoredPrototypeRoutes]);
  for (const route of samplePreviewRoutes) {
    if (!/^\/product\/preview\/[a-z0-9-]+$/.test(route)
      || Object.hasOwn(captures, route) || used.has(route)) {
      throw new Error(`Invalid or colliding Redcarpert preview route: ${route}`);
    }
    used.add(route);
  }
  return [...publicCaptured, ...authoredPrototypeRoutes, ...samplePreviewRoutes];
}
