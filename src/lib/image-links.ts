/** Resolve a named photo from the page image manifest without silent fallbacks. */
export function requireImageLink<T extends { readonly id: string; readonly url: string }>(
  links: readonly T[],
  id: string,
): T {
  const matches = links.filter(link => link.id === id);
  if (matches.length !== 1) throw new Error(`image-links.json: expected exactly one image with ID ${id}`);
  const link = matches[0];
  if (!link || !/^https:\/\//.test(link.url) || /["'<>\\\r\n]/.test(link.url)) {
    throw new Error(`image-links.json: invalid HTTPS image URL for ${id}`);
  }
  return link;
}
