import imageLinks from "../data/image-links.json" with { type: "json" };
import type { DocumentElement, DocumentNode } from "../types/site.ts";

export const WEDDING_MOMENTS_PAGE_SIZE = 16;

export type WeddingMomentMedia =
  | { id: string; type: "photo"; url: string; alt: string; caption?: string }
  | { id: string; type: "video"; url: string; caption: string; poster: string }
  | { id: string; type: "video_link"; url: string; caption: string; poster: string };

export interface WeddingMomentEvent {
  id: string;
  title: string;
  description?: string;
  media: WeddingMomentMedia[];
}

const record = (input: unknown, location: string): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Wedding Moments: " + location + " must be an object");
  }
  return input as Record<string, unknown>;
};
const text = (value: unknown, location: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Wedding Moments: " + location + " must be nonempty text");
  }
  return value.trim();
};
const optionalText = (value: unknown, location: string): string | undefined =>
  value === undefined ? undefined : text(value, location);

const safeUrl = (input: unknown, location: string, directVideo = false): string => {
  const value = text(input, location);
  if (/["'<>\\\r\n]/.test(value)) throw new Error("Wedding Moments: unsafe " + location);
  let url: URL;
  try { url = new URL(value); }
  catch { throw new Error("Wedding Moments: invalid " + location); }
  if (url.protocol !== "https:" || !url.hostname) {
    throw new Error("Wedding Moments: " + location + " must use HTTPS");
  }
  if (directVideo && !/\.(mp4|webm)$/i.test(url.pathname)) {
    throw new Error("Wedding Moments: " + location + " must be an MP4 or WebM video");
  }
  return value;
};

/** Events remain grouped in JSON for editing, but are displayed in one gallery. */
export function parseWeddingMomentEvents(input: unknown): WeddingMomentEvent[] {
  if (!Array.isArray(input)) throw new Error("Wedding Moments: events must be an array");
  const eventIds = new Set<string>();
  const mediaIds = new Set<string>();
  return input.map((value, eventIndex): WeddingMomentEvent => {
    const event = record(value, "event " + eventIndex);
    const id = text(event.id, "event id");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || eventIds.has(id)) {
      throw new Error("Wedding Moments: duplicate or invalid event id " + id);
    }
    eventIds.add(id);
    const title = text(event.title, id + " title");
    const description = optionalText(event.description, id + " description");
    if (!Array.isArray(event.media) || event.media.length === 0) {
      throw new Error("Wedding Moments: " + id + " requires at least one photo or video");
    }
    const media = event.media.map((item, index): WeddingMomentMedia => {
      const entry = record(item, id + " media " + index);
      const mediaId = text(entry.id, id + " media id");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(mediaId) || mediaIds.has(mediaId)) {
        throw new Error("Wedding Moments: duplicate or invalid media id " + mediaId);
      }
      mediaIds.add(mediaId);
      if (entry.type !== "photo" && entry.type !== "video" && entry.type !== "video_link") {
        throw new Error("Wedding Moments: " + mediaId + " type must be photo, video or video_link");
      }
      const url = safeUrl(entry.url, mediaId + " url", entry.type === "video");
      if (entry.type === "video_link" &&
          !/^https:\/\/www\.pexels\.com\/video\/[a-z0-9-]+\d+\/$/.test(url)) {
        throw new Error("Wedding Moments: only Pexels stock video pages are allowed as links");
      }
      if (entry.type === "photo") {
        const alt = text(entry.alt, mediaId + " alt");
        const caption = optionalText(entry.caption, mediaId + " caption");
        return { id: mediaId, type: "photo", url, alt, ...(caption ? { caption } : {}) };
      }
      const caption = text(entry.caption, mediaId + " caption");
      const poster = safeUrl(entry.poster, mediaId + " poster");
      return { id: mediaId, type: entry.type, url, caption, poster };
    });
    return { id, title, ...(description ? { description } : {}), media };
  });
}

export const weddingMomentEvents = parseWeddingMomentEvents(imageLinks.wedding_moments.events);
export const weddingMomentShowcase = parseWeddingMomentEvents(imageLinks.wedding_moments.showcase);

/** New events are appended to JSON and appear first; each event keeps its photo order. */
export function flattenWeddingMomentEvents(
  events: readonly WeddingMomentEvent[],
  newestFirst = true,
): WeddingMomentMedia[] {
  const ordered = newestFirst ? [...events].reverse() : events;
  return ordered.flatMap(event => event.media);
}

const node = (tag: string, attrs: Record<string, string>, children: DocumentNode[] = []): DocumentElement =>
  ({ tag, attrs, children });

function mediaCard(media: WeddingMomentMedia, index: number): DocumentElement {
  const label = media.type === "photo"
    ? "Enlarge " + (media.caption || media.alt)
    : "Watch " + media.caption;
  const thumbnail = node("img", {
    src: media.type === "photo" ? media.url : media.poster,
    alt: media.type === "photo" ? media.alt : "",
    width: "370", height: "370",
    loading: index < 4 ? "eager" : "lazy",
    decoding: "async",
  });
  const play = media.type === "photo" ? [] : [
    node("span", { class: "redcarpert-moment-play", "aria-hidden": "true" }, [
      node("i", { class: "fa-solid fa-play", "aria-hidden": "true" }),
    ]),
  ];

  const action = media.type === "video_link"
    ? node("a", {
      href: media.url, target: "_blank", rel: "noopener noreferrer",
      "aria-label": "Watch sample wedding film on Pexels: " + media.caption,
    }, [thumbnail, ...play])
    : node("button", {
      type: "button", "data-wedding-media": media.type,
      "data-wedding-src": media.url,
      "aria-haspopup": "dialog", "aria-label": label,
    }, [thumbnail, ...play]);

  return node("div", {
    class: "redcarpert-moments-media-card", "data-wedding-moment-id": media.id,
  }, [action]);
}

/** First 16 cards are live; remaining cards sit inert in a template until Load More. */
export function renderWeddingMomentGallery(
  media: readonly WeddingMomentMedia[],
): DocumentNode[] {
  if (media.length === 0) return [];
  const cards = media.map(mediaCard);
  const initial = cards.slice(0, WEDDING_MOMENTS_PAGE_SIZE);
  const remaining = cards.slice(WEDDING_MOMENTS_PAGE_SIZE);
  return [
    node("div", {
      id: "redcarpert-wedding-grid", class: "redcarpert-moments-media-grid",
      "data-wedding-moments-grid": "",
    }, initial),
    ...(remaining.length ? [
      node("template", { "data-wedding-moments-remaining": "" }, remaining),
      node("div", { class: "redcarpert-moments-more" }, [
        node("button", {
          type: "button", "data-wedding-load-more": "",
          "aria-controls": "redcarpert-wedding-grid",
        }, ["Load More"]),
      ]),
    ] : []),
    node("dialog", {
      id: "redcarpert-wedding-preview", class: "redcarpert-wedding-dialog",
      "aria-label": "Wedding moments photo and video preview",
    }, [
      node("div", { class: "redcarpert-moment-dialog-inner" }, [
        node("img", {
          class: "redcarpert-wedding-preview-image", "data-wedding-preview-photo": "",
          alt: "", decoding: "async", hidden: "hidden",
        }),
        node("video", {
          class: "redcarpert-wedding-preview-video", "data-wedding-preview-video": "",
          controls: "controls", playsinline: "playsinline",
          preload: "none", hidden: "hidden",
        }),
        node("button", {
          type: "button", class: "redcarpert-wedding-preview-close",
          "data-wedding-preview-close": "", "aria-label": "Close media preview",
        }, ["×"]),
      ]),
    ]),
  ];
}
