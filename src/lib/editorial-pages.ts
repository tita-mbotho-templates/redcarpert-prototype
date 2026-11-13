import type { DocumentElement, DocumentNode, SiteDocumentData } from "@/types/site";
import imageLinks from "../data/image-links.json" with { type: "json" };
import { requireImageLink } from "./image-links.ts";
import { weddingMomentEvents, flattenWeddingMomentEvents, renderWeddingMomentGallery } from "./wedding-moments.ts";

const node = (tag: string, attrs: Record<string, string>, children: DocumentNode[]): DocumentElement => ({ tag, attrs, children });
const elements = (list: DocumentNode[]) => list.filter((x): x is DocumentElement => typeof x !== "string");
const all = (list: DocumentNode[]): DocumentElement[] => elements(list).flatMap((x) => [x, ...all(x.children)]);

type EditorialRoute = "/digital-lookbook" | "/wedding-moments" | "/about-us" | "/contact-us";
const editorialRoutes: readonly EditorialRoute[] = ["/digital-lookbook", "/wedding-moments", "/about-us", "/contact-us"];

const p = (text: string) => node("p", {}, [text]);
const h = (text: string, id?: string) => node("h2", id ? { id } : {}, [text]);
const fitting = () => node("button", { type: "button", class: "button", "data-whatsapp-preview": "", "aria-haspopup": "dialog" }, ["Enquire about a fitting"]);

function editorialContent(route: EditorialRoute): DocumentNode[] {
  if (route === "/digital-lookbook") return [
    node("section", { class: "redcarpert-editorial-hero", "aria-labelledby": "redcarpert-lookbook-title" }, [
      node("p", { class: "redcarpert-editorial-eyebrow" }, ["THE BRIDAL EDIT"]),
      node("h2", { id: "redcarpert-lookbook-title" }, ["Digital Lookbook"]),
      node("p", { class: "redcarpert-editorial-lead" }, ["A closer look at Mermaid & Ball Gown silhouettes"]),
      p("Turn through a curated sample of bridal styles, discover the silhouettes that speak to you and explore the dress details at your own pace."),
      node("p", { class: "redcarpert-editorial-disclosure" }, ["Preview imagery only — these photographs are stock samples and are not confirmed Redcarpert inventory."]),
    ]),
    node("div", { "data-lookbook-viewer": "true" }, []),
  ];
  if (route === "/wedding-moments") {
    return [
      node("p", { class: "redcarpert-moments-subtitle" },
        ["The love, the laughter, the unforgettable moments."]),
      ...renderWeddingMomentGallery(flattenWeddingMomentEvents(weddingMomentEvents)),
    ];
  }
  if (route === "/about-us") return [
    node("section", { class: "redcarpert-editorial-hero", "aria-labelledby": "redcarpert-story-title" }, [
      node("p", { class: "redcarpert-editorial-eyebrow" }, ["OUR STORY"]),
      node("h2", { id: "redcarpert-story-title" }, ["A thoughtful start to your bridal journey"]),
      node("p", { class: "redcarpert-editorial-lead" }, ["Discover the look you love, one silhouette at a time."]),
      p("Redcarpert Wedding Dresses is creating a welcoming online space to explore bridal inspiration before enquiring about a fitting. Browse at your own pace, compare different shapes and share the styles you would like to discuss."),
    ]),
    node("section", { class: "redcarpert-editorial-panel", "aria-labelledby": "redcarpert-collections-title" }, [
      h("Our Collections", "redcarpert-collections-title"),
      p("Every bride has her own sense of style. Explore the close-fitting lines of Mermaid dresses or the romantic fullness of Ball Gown silhouettes. Each sample listing provides a starting point for a conversation about what you are looking for."),
      node("nav", { class: "redcarpert-editorial-actions", "aria-label": "Explore bridal collections" }, [
        node("a", { href: "/product-category/mermaid/", class: "redcarpert-editorial-action" }, ["Explore Mermaid"]),
        node("a", { href: "/product-category/ball_gown/", class: "redcarpert-editorial-action" }, ["Explore Ball Gown"]),
      ]),
    ]),
    node("section", { class: "redcarpert-editorial-panel", "aria-labelledby": "redcarpert-fitting-title" }, [
      h("A Personal Fitting Conversation", "redcarpert-fitting-title"),
      p("When a dress catches your eye, use its fitting enquiry option to review a prefilled WhatsApp message. You can ask about availability, preferences and the next steps before arranging a visit. Nothing is sent until you choose to continue in WhatsApp."),
      fitting(),
      node("p", { class: "redcarpert-editorial-disclosure" }, ["Styles shown on this prototype use illustrative photography. Actual dresses, fitting arrangements and business details are subject to confirmation."]),
    ]),
    node("section", { class: "redcarpert-editorial-panel redcarpert-editorial-team", "aria-labelledby": "redcarpert-team-title" }, [
      h("Meet the Team", "redcarpert-team-title"),
      p("The people behind the bridal experience will be introduced here. Until official team portraits and names are supplied, the photographs below illustrate the kind of creative and personal work associated with bridal styling."),
      node("div", { class: "redcarpert-editorial-team-grid" }, [
        ...[
          {
            title: "Bridal Styling",
            image: requireImageLink(imageLinks.about_us.team, "bridal-styling").url,
            alt: "Illustrative stock photograph of a fashion designer in her workshop",
            credit: "Antoni Shkraba",
          },
          {
            title: "Atelier Craft",
            image: requireImageLink(imageLinks.about_us.team, "atelier-craft").url,
            alt: "Illustrative stock photograph of designers working in an atelier",
            credit: "Ron Lach",
          },
          {
            title: "Thoughtful Details",
            image: requireImageLink(imageLinks.about_us.team, "thoughtful-details").url,
            alt: "Illustrative stock photograph of a dressmaker adjusting a bridal gown",
            credit: "Gustavo Fring",
          },
        ].map((item) => node("figure", { class: "redcarpert-editorial-team-card" }, [
          node("img", { src: item.image, alt: item.alt, loading: "lazy", decoding: "async", width: "540", height: "660" }, []),
          node("figcaption", {}, [
            node("h3", {}, [item.title]),
            node("p", {}, ["Team introduction coming soon"]),
            node("small", {}, ["Illustrative Pexels photo by " + item.credit + " · Not Redcarpert staff"]),
          ]),
        ])),
      ]),
    ]),
  ];
  return [
    node("section", { class: "redcarpert-editorial-hero", "aria-labelledby": "redcarpert-contact-title" }, [
      node("p", { class: "redcarpert-editorial-eyebrow" }, ["GET IN TOUCH"]),
      node("h2", { id: "redcarpert-contact-title" }, ["Let's talk about your bridal look"]),
      node("p", { class: "redcarpert-editorial-lead" }, ["Found a silhouette you love? Begin with an enquiry."]),
      p("Explore our collections, choose a dress that interests you and start a fitting conversation through WhatsApp. Share your questions and preferences so the next steps can be discussed directly with Redcarpert."),
      fitting(),
    ]),
    node("section", { class: "redcarpert-editorial-panel", "aria-labelledby": "redcarpert-enquiry-steps" }, [
      h("How to Enquire", "redcarpert-enquiry-steps"),
      node("ol", { class: "redcarpert-editorial-steps" }, [
        node("li", {}, [node("strong", {}, ["Explore"]), p("Browse the Mermaid or Ball Gown collections and open a dress you would like to ask about.")]),
        node("li", {}, [node("strong", {}, ["Review"]), p("Use the enquiry preview to check the dress details and your message before opening WhatsApp.")]),
        node("li", {}, [node("strong", {}, ["Connect"]), p("Send your message in WhatsApp when ready, then confirm availability and any fitting arrangements directly.")]),
      ]),
      node("nav", { class: "redcarpert-editorial-actions", "aria-label": "Browse dresses and contact us" }, [
        node("a", { href: "/product/", class: "redcarpert-editorial-action" }, ["Browse Wedding Dresses"]),
      ]),
    ]),
    node("section", { class: "redcarpert-editorial-panel", "aria-labelledby": "redcarpert-visiting-title" }, [
      h("Before Your Visit", "redcarpert-visiting-title"),
      p("Redcarpert is located in the Sunnyside area of Pretoria, South Africa. Please confirm the exact studio address, opening hours and fitting availability directly with the business before travelling."),
      p("Dress photographs on this website are illustrative samples. The business can confirm which styles are currently available when you enquire."),
    ]),
    node("section", { class: "redcarpert-editorial-panel redcarpert-editorial-location", "aria-labelledby": "redcarpert-map-title" }, [
      h("Our Pretoria Location", "redcarpert-map-title"),
      node("p", { class: "redcarpert-editorial-lead" }, ["Sunnyside · Pretoria · South Africa"]),
      p("The map below shows the Sunnyside area for orientation. It is not a precise studio pin or confirmed street address."),
      node("div", { class: "redcarpert-editorial-map" }, [
        node("iframe", {
          title: "Map of the Sunnyside area in Pretoria, South Africa",
          src: "https://www.google.com/maps?q=Sunnyside%2C%20Pretoria%2C%20South%20Africa&output=embed",
          loading: "lazy",
          referrerpolicy: "no-referrer-when-downgrade",
          "aria-label": "Map showing Sunnyside, Pretoria, South Africa",
        }, []),
      ]),
      node("p", { class: "redcarpert-editorial-map-link" }, [
        node("a", { href: "https://www.google.com/maps/search/?api=1&query=Sunnyside%2C%20Pretoria%2C%20South%20Africa", target: "_blank", rel: "noopener noreferrer" }, ["View Sunnyside on Google Maps"]),
      ]),
      node("p", { class: "redcarpert-editorial-disclosure" }, ["Area shown for reference only. Please confirm an exact address before visiting."]),
    ]),
  ];
}

/** Content-only substitution inside the captured page shell. No source CSS, header,
 * footer, main wrapper, responsive breakpoints, or image galleries are mutated. */
export function adaptEditorialDocument(document: SiteDocumentData): SiteDocumentData {
  if (!editorialRoutes.includes(document.route as EditorialRoute)) return document;
  const route = document.route as EditorialRoute;
  const matches = all(document.nodes);
  const one = (predicate: (n: DocumentElement) => boolean, description: string) => {
    const found = matches.filter(predicate);
    if (found.length !== 1) throw new Error(`Editorial ${route}: expected one ${description}, found ${found.length}`);
    return found[0];
  };
  const main = one(n => n.attrs.id === "main-container", "site shell");
  const footer = one(n => n.tag === "footer" && n.attrs.id === "footer", "footer");
  const header = one(n => n.tag === "header" && n.attrs.id === "header", "header");
  const box = one(n => n.attrs.class === "content-box" && n.tag === "div", "content box");
  const pageTitle = one(n => n.tag === "div" && n.attrs.class === "page-title", "page title");
  const title = all(pageTitle.children).find(n => n.tag === "h1"
    && n.children.length === 1 && typeof n.children[0] === "string");
  if (!title) throw new Error(`Editorial ${route}: missing page banner heading`);
  if (!all([main]).includes(footer) || !all([main]).includes(header) || !all([main]).includes(box)) throw new Error("Editorial: invalid shell");
  // The captured Our Brides shell uses an unused right sidebar, while the
  // Wedding Dresses page uses a full-width four-column catalogue shell.
  // Adopt its content geometry without altering the shared header/footer.
  const replacements = new Map<DocumentElement, DocumentElement>();
  if (route === "/wedding-moments" || route === "/contact-us") {
    const container = one(n => n.attrs.id === "content-container", "page layout");
    const content = one(n => n.attrs.id === "content" && n.attrs.class === "content", "main content column");
    const sidebar = one(n => n.attrs.id === "sidebar" && n.attrs.class === "sidebar", "unused sidebar");
    if (container.attrs.class !== "content-boxed layout-right"
      || !elements(container.children).includes(content)
      || !elements(container.children).includes(sidebar)
      || elements(sidebar.children).length !== 0) {
      throw new Error(`Editorial ${route}: incompatible original sidebar layout`);
    }
    replacements.set(container, {
      ...container,
      attrs: { ...container.attrs, class: "content-boxed layout-full" },
      children: container.children.filter(child => child !== sidebar),
    });
    replacements.set(content, { ...content, attrs: { ...content.attrs, id: "full-width" } });
  }
  if (route !== "/wedding-moments") {
    replacements.set(pageTitle, {
      ...pageTitle,
      attrs: { ...pageTitle.attrs, class: "page-title redcarpert-editorial-page-title" },
    });
  }
  replacements.set(title, { ...title, children: [route === "/digital-lookbook" ? "Digital Lookbook" : route === "/wedding-moments" ? "Wedding Moments" : route === "/about-us" ? "About Us" : "Contact Us"] });
  replacements.set(box, { ...box, attrs: { ...box.attrs, class: route === "/wedding-moments" ? "content-box pexeto-woo-columns-4 redcarpert-moments-content-box" : box.attrs.class }, children: [node("div", { class: "redcarpert-editorial", "data-editorial-route": route }, editorialContent(route))] });
  const visit = (current: DocumentNode): DocumentNode => {
    if (typeof current === "string") return current;
    const chosen = replacements.get(current) ?? current;
    const mapped = chosen.children.map(visit);
    return mapped.some((n, i) => n !== chosen.children[i]) ? { ...chosen, children: mapped } : chosen;
  };
  return { ...document, nodes: document.nodes.map(visit) };
}
