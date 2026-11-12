import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";

const direct = (nodes: DocumentNode[]): DocumentElement[] =>
  nodes.filter((n): n is DocumentElement => typeof n !== "string");
const elements = (nodes: DocumentNode[]): DocumentElement[] =>
  direct(nodes).flatMap(n => [n, ...elements(n.children)]);
const hasClass = (n: DocumentElement, name: string) =>
  (n.attrs.class ?? "").split(/\s+/).includes(name);
const node = (tag: string, attrs: Record<string, string>, children: DocumentNode[] = []): DocumentElement =>
  ({ tag, attrs, children });
const icon = (family: "brands" | "solid", name: string): DocumentElement =>
  node("i", { class: `fa-${family} fa-${name}`, "aria-hidden": "true" });

/**
 * Last, strictly scoped presentation pass. Keeps the captured document intact,
 * replaces legacy image/glyph icons with current Font Awesome Free icon classes,
 * and retains the pre-existing WhatsApp preview and navigation behaviour.
 */
export function modernizeSiteIcons(document: SiteDocumentData): SiteDocumentData {
  const fail = (reason: string): never => {
    throw new Error(`Modern icons ${document.route}: ${reason}`);
  };
  const all = elements(document.nodes);
  const one = (items: DocumentElement[], predicate: (n: DocumentElement) => boolean, reason: string) => {
    const matches = items.filter(predicate);
    return matches.length === 1 ? matches[0] : fail(reason);
  };
  const replacements = new Map<DocumentElement, DocumentElement>();
  const footer = one(all, n => n.tag === "footer" && n.attrs["data-redcarpert-footer"] === "true", "footer");
  const columns = one(elements(footer.children), n => hasClass(n, "redcarpert-footer-columns"), "footer grid");
  const cols = direct(columns.children);
  if (cols.length !== 3) fail("expected three footer columns");

  // The footer branding stage already emits current copy and icon markup.
  // Validate it here without rebuilding a legacy intermediate link/button.
  const heading = one(elements([cols[2]]), n =>
    n.tag === "h2" && n.attrs.class === "redcarpert-footer-heading", "fittings heading");
  if (heading.children.length !== 1 || heading.children[0] !== "FITTINGS") fail("fittings text");
  const fitList = one(elements([cols[2]]), n =>
    n.attrs.class === "redcarpert-footer-items", "fitting links");
  const controls = direct(fitList.children);
  if (controls.length !== 1 || controls[0].tag !== "button"
    || controls[0].attrs.class !== "redcarpert-footer-book"
    || controls[0].attrs["data-whatsapp-preview"] !== ""
    || !elements([controls[0]]).some(n=>n.tag==="i" && n.attrs.class==="fa-brands fa-whatsapp")) {
    fail("fitting links");
  }

  const socials = one(elements([cols[0]]), n => n.tag === "ul" && n.attrs.class === "social-icons", "footer socials");
  const platforms = [
    ["Instagram", "instagram"], ["YouTube", "youtube"], ["Twitter", "x-twitter"],
    ["Pinterest", "pinterest-p"], ["TikTok", "tiktok"],
  ] as const;
  const previous = direct(socials.children);
  if (previous.length !== platforms.length) fail("five original social placeholders");
  const items: DocumentNode[] = previous.map((item, index) => {
    const anchor = one(elements(item.children), n => n.tag === "a", "social placeholder anchor");
    const [label, symbol] = platforms[index];
    if (anchor.attrs["aria-disabled"] !== "true" || anchor.attrs["aria-label"] !== `${label}: destination not yet available`
      && anchor.attrs["aria-label"] !== `${label}: destination to be confirmed`) fail("social placeholder identity");
    return node("li", {}, [
      node("span", {
        class: "redcarpert-footer-social-placeholder", "aria-label": `${label} (coming soon)`,
        title: `${label} (coming soon)`,
      }, [icon("brands", symbol)]),
    ]);
  });
  items.push(node("li", {}, [
    node("button", {
      type: "button", class: "redcarpert-footer-social-whatsapp",
      "data-whatsapp-preview": "", "aria-haspopup": "dialog",
      "aria-label": "WhatsApp fitting enquiries",
      title: "WhatsApp fitting enquiries",
    }, [icon("brands", "whatsapp")]),
  ]));
  replacements.set(socials, { ...socials, children: items });

  // The captured third-party plugin icon is inspected and then discarded.
  // Publish a clean top-level modern widget instead of copying/remounting any
  // of the original SVG, inline styles, event hooks or plugin wrappers.
  const legacyChat = one(all, n => n.attrs.id === "ht-ctc-chat", "captured floating WhatsApp");
  if (legacyChat.tag !== "div" || !hasClass(legacyChat, "ht-ctc")
    || !elements([legacyChat]).some(n => n.tag === "svg")) fail("floating icon shape");
  const floatingWidget = node("div", {
    id: "redcarpert-floating-whatsapp",
    class: "redcarpert-whatsapp-float",
  }, [
    node("button", {
      type: "button", class: "redcarpert-whatsapp-float-trigger",
      "data-whatsapp-preview": "", "aria-haspopup": "dialog",
      "aria-label": "Open WhatsApp fitting enquiry",
      title: "WhatsApp fitting enquiry",
    }, [icon("brands", "whatsapp")]),
    node("button", {
      type: "button", class: "redcarpert-whatsapp-float-dismiss",
      "data-dismiss-whatsapp": "", "aria-label": "Hide floating WhatsApp button",
      title: "Dismiss WhatsApp widget",
    }, [icon("solid", "xmark")]),
  ]);

  // All editorial and dress-detail fitting CTAs share the same current
  // WhatsApp glyph while preserving their existing visible text and handlers.
  const footerDescendants = new Set(elements([footer]));
  for (const n of all.filter(n =>
    n.tag === "button" && n.attrs["data-whatsapp-preview"] === ""
    && !footerDescendants.has(n)
  )) {
    if (n.children.length === 1 && typeof n.children[0] === "string") {
      replacements.set(n, { ...n, children: [icon("brands", "whatsapp"), ...n.children] });
    }
  }

  // The Products chevron is part of the desktop navigation affordance.
  const products = one(all, n => n.tag === "li" && n.attrs.id === "menu-item-15821", "products menu item");
  const productsLink = one(direct(products.children), n => n.tag === "a", "products menu link");
  if (productsLink.children.length !== 1 || typeof productsLink.children[0] !== "string") fail("products menu label");
  replacements.set(productsLink, {
    ...productsLink, children: [...productsLink.children, icon("solid", "chevron-down")],
  });

  const mobile = one(all, n => n.tag === "span" && hasClass(n, "mob-nav-btn"), "mobile menu");
  if (mobile.children.length !== 1 || typeof mobile.children[0] !== "string") fail("mobile menu text");
  replacements.set(mobile, {
    ...mobile,
    children: [icon("solid", "bars"), node("span", {}, ["Menu"])],
  });

  if (document.route === "/") {
    const down = one(all, n => hasClass(n, "fullpage-scroll-arrow"), "home down arrow");
    replacements.set(down, {
      ...down, attrs: {
        ...down.attrs,
        class: "fullpage-scroll-arrow redcarpert-modern-down-arrow",
      }, children: [icon("solid", "chevron-down")],
    });
  } else {
    const scroll = one(all, n => hasClass(n, "scroll-to-top"), "scroll-to-top");
    replacements.set(scroll, {
      ...scroll, children: [icon("solid", "arrow-up")],
    });
  }

  for (const n of all.filter(n => n.tag === "a" && hasClass(n, "wpgis-popup") && hasClass(n, "fa-expand"))) {
    replacements.set(n, {
      ...n,
      attrs: { ...n.attrs, class: "wpgis-popup redcarpert-modern-zoom" },
      children: [icon("solid", "up-right-and-down-left-from-center")],
    });
  }
  for (const n of all.filter(n => n.tag === "button" && n.attrs["data-bride-preview"] !== undefined)) {
    const images = elements(n.children);
    if (images.length !== 1 || images[0].tag !== "img") fail("bride thumbnail");
    replacements.set(n, { ...n, children: [...n.children,
      node("span", { class: "redcarpert-bride-zoom-badge", "aria-hidden": "true" },
        [icon("solid", "up-right-and-down-left-from-center")]),
    ] });
  }
  for (const n of all.filter(n => n.tag === "button" && n.attrs["data-bride-preview-close"] !== undefined)) {
    replacements.set(n, { ...n, children: [icon("solid", "xmark")] });
  }

  const visit = (n: DocumentNode): DocumentNode | null => {
    if (typeof n === "string") return n;
    if (n === legacyChat) return null;
    const replacement = replacements.get(n) ?? n;
    const visited = replacement.children.map(visit);
    const children = visited.filter((child): child is DocumentNode => child !== null);
    return children.length !== replacement.children.length
      || children.some((child, i) => child !== replacement.children[i])
      ? { ...replacement, children } : replacement;
  };
  const nodes = document.nodes.map(visit).filter((n): n is DocumentNode => n !== null);
  return { ...document, nodes: [...nodes, floatingWidget] };
}
