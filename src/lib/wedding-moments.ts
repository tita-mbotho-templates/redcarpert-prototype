import imageLinks from "../data/image-links.json" with { type: "json" };
import type { DocumentElement, DocumentNode } from "../types/site.ts";

export type WeddingMomentMedia =
  | { id: string; type: "photo"; url: string; alt: string; caption?: string }
  | { id: string; type: "video"; url: string; caption: string; poster?: string }
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

const safeUrl = (input: unknown, location: string, video = false): string => {
  const value = text(input, location);
  if (/["'<>\\\r\n]/.test(value)) throw new Error("Wedding Moments: unsafe " + location);
  let url: URL;
  try { url = new URL(value); }
  catch { throw new Error("Wedding Moments: invalid " + location); }
  if (url.protocol !== "https:" || !url.hostname) {
    throw new Error("Wedding Moments: " + location + " must use HTTPS");
  }
  if (video && !/\.(mp4|webm)$/i.test(url.pathname)) {
    throw new Error("Wedding Moments: " + location + " must be an MP4 or WebM video");
  }
  return value;
};

/** Only add publicly approved client media to JSON: every entry is rendered. */
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
      if (entry.type === "video_link" && !/^https:\/\/www\.pexels\.com\/video\/[a-z0-9-]+\d+\/$/.test(url)) {
        throw new Error("Wedding Moments: only verified Pexels preview-page links are allowed");
      }
      if (entry.type === "photo") {
        const alt = text(entry.alt, mediaId + " alt");
        const caption = optionalText(entry.caption, mediaId + " caption");
        return { id: mediaId, type: "photo", url, alt, ...(caption ? { caption } : {}) };
      }
      const caption = text(entry.caption, mediaId + " caption");
      const poster = entry.poster === undefined
        ? undefined : safeUrl(entry.poster, mediaId + " poster");
      if (entry.type === "video_link") {
        if (!poster) throw new Error("Wedding Moments: external stock film needs a poster");
        return { id: mediaId, type: "video_link", url, caption, poster };
      }
      return { id: mediaId, type: "video", url, caption, ...(poster ? { poster } : {}) };
    });
    return { id, title, ...(description ? { description } : {}), media };
  });
}

export const weddingMomentEvents = parseWeddingMomentEvents(imageLinks.wedding_moments.events);
export const weddingMomentShowcase = parseWeddingMomentEvents(imageLinks.wedding_moments.showcase);

const node = (tag: string, attrs: Record<string, string>, children: DocumentNode[] = []): DocumentElement =>
  ({ tag, attrs, children });

/** Server-render photo/video cards; JavaScript only adds modal interaction. */
export function renderWeddingMomentEvents(events: readonly WeddingMomentEvent[]): DocumentNode[] {
  if (!events.length) return [];
  const sections: DocumentNode[] = events.map(event =>
    node("section", { class: "redcarpert-moments-event", "aria-label": event.title }, [
      node("h3", { class: "redcarpert-moments-event-title" }, [event.title]),
      ...(event.description ? [node("p", { class: "redcarpert-moments-event-description" }, [event.description])] : []),
      node("div", { class: "redcarpert-moments-media-grid", "data-wedding-moments-grid": "" },
        event.media.map((media, index) =>
          node("figure", { class: "redcarpert-moments-media-card", "data-wedding-moment-id": media.id }, [
            node(media.type === "video_link" ? "a" : "button", media.type === "video_link"
              ? {
                href: media.url, target: "_blank", rel: "noopener noreferrer",
                "aria-label": "Watch sample wedding film on Pexels: " + media.caption,
              }
              : {
                type: "button",
                "data-wedding-media": media.type,
                "data-wedding-src": media.url,
                "aria-haspopup": "dialog",
                "aria-label": media.type === "video"
                  ? "Watch " + media.caption : "Enlarge " + (media.caption || media.alt),
              },
            }, [
              ...(media.type === "photo"
                ? [node("img", { src: media.url, alt: media.alt, width: "370", height: "370",
                    loading: index < 4 ? "eager" : "lazy", decoding: "async" })]
                : media.poster
                  ? [node("img", { src: media.poster, alt: "", width: "370", height: "370",
                      loading: "lazy", decoding: "async" })]
                  : [node("span", { class: "redcarpert-moment-video-fallback", "aria-hidden": "true" },
                      ["Wedding film"])]),
              ...(media.type !== "photo" ? [
                node("span", { class: "redcarpert-moment-play", "aria-hidden": "true" }, [
                  node("i", { class: "fa-solid fa-play", "aria-hidden": "true" }),
                ]),
              ] : []),
            ]),
            node("figcaption", {}, [media.caption || "Wedding photograph"]),
          ])
        )
      ),
    ])
  );
  sections.push(node("dialog", {
    id: "redcarpert-wedding-preview", class: "redcarpert-wedding-dialog",
    "aria-label": "Wedding moments photo and video preview",
  }, [
    node("div", { class: "redcarpert-moment-dialog-inner" }, [
      node("img", { class: "redcarpert-wedding-preview-image", "data-wedding-preview-photo": "",
        alt: "", decoding: "async", hidden: "hidden" }),
      node("video", { class: "redcarpert-wedding-preview-video", "data-wedding-preview-video": "",
        controls: "controls", playsinline: "playsinline", preload: "none", hidden: "hidden" }),
      node("button", { type: "button", class: "redcarpert-wedding-preview-close",
        "data-wedding-preview-close": "", "aria-label": "Close media preview" }, ["×"]),
    ]),
  ]));
  return sections;
}
