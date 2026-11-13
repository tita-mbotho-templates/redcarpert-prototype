import assert from "node:assert/strict";
import test from "node:test";
import imageLinks from "../src/data/image-links.json" with { type: "json" };
import { sitePages } from "../src/data/site.ts";
import { adaptEditorialDocument } from "../src/lib/editorial-pages.ts";
import {
  WEDDING_MOMENTS_PAGE_SIZE,
  parseWeddingMomentEvents,
  flattenWeddingMomentEvents,
  renderWeddingMomentGallery,
  weddingMomentEvents,
  weddingMomentShowcase,
} from "../src/lib/wedding-moments.ts";
import { adaptNavigation } from "../src/lib/navigation-adapter.ts";

const allNodes = nodes => nodes.flatMap(n =>
  typeof n === "string" ? [] : [n, ...allNodes(n.children)]);

const fixture = () => [{
  id: "celebration-2026",
  title: "A day to remember",
  description: "Ceremony and reception",
  media: [
    { id: "couple-portrait", type: "photo",
      url: "https://ik.imagekit.io/example/events/couple.webp",
      alt: "A couple with their loved ones", caption: "With loved ones" },
    { id: "dance-film", type: "video",
      url: "https://ik.imagekit.io/example/events/dance.mp4?updatedAt=2",
      poster: "https://ik.imagekit.io/example/events/dance-cover.webp",
      caption: "The wedding dance" },
  ],
}];

test("Wedding Moments has one continuous gallery of photos and film previews", () => {
  assert.deepEqual(imageLinks.wedding_moments.events, []);
  assert.deepEqual(weddingMomentEvents, []);
  assert.equal(weddingMomentShowcase.length, 3, "JSON may retain internal groups");
  const media = flattenWeddingMomentEvents(weddingMomentShowcase, false);
  assert.equal(media.filter(item => item.type === "photo").length, 12);
  assert.equal(media.filter(item => item.type === "video_link").length, 2);
  const output = renderWeddingMomentGallery(media);
  const rendered = allNodes(output);
  assert.equal(rendered.filter(n => n.attrs["data-wedding-moments-grid"] !== undefined).length, 1);
  assert.equal(rendered.filter(n => n.attrs["data-wedding-moment-id"] !== undefined).length, 14);
  assert.equal(rendered.filter(n => n.tag === "h3" || n.tag === "figcaption").length, 0);
  assert.equal(rendered.filter(n => n.attrs["data-wedding-load-more"] !== undefined).length, 0,
    "14 stock thumbnails fit in the first batch");
  const links = rendered.filter(n => n.tag === "a" && n.attrs.href?.includes("pexels.com/video/"));
  assert.equal(links.length, 2);
  assert(links.every(link => link.attrs.target === "_blank" && link.attrs.rel === "noopener noreferrer"));
});

test("gallery displays latest appended event first, keeping event media in their original sequence", () => {
  const events = parseWeddingMomentEvents([
    { id: "earlier-wedding", title: "Earlier", media: [
      { id: "earlier-photo", type: "photo", url: "https://example.com/earlier.jpg", alt: "Earlier photo" },
    ] },
    { id: "newest-wedding", title: "Newer", media: [
      { id: "newer-photo-1", type: "photo", url: "https://example.com/newer1.jpg", alt: "Newer photo 1" },
      { id: "newer-photo-2", type: "photo", url: "https://example.com/newer2.jpg", alt: "Newer photo 2" },
    ] },
  ]);
  assert.deepEqual(flattenWeddingMomentEvents(events).map(x => x.id),
    ["newer-photo-1", "newer-photo-2", "earlier-photo"]);
  assert.deepEqual(flattenWeddingMomentEvents(events, false).map(x => x.id),
    ["earlier-photo", "newer-photo-1", "newer-photo-2"]);
});

test("16-card batches defer the rest in an inert template until Load More", () => {
  const raw = Array.from({ length: 3 }, (_, eventIndex) => ({
    id: "event-" + eventIndex,
    title: "Celebration " + eventIndex,
    media: Array.from({ length: 14 }, (_, imageIndex) => ({
      id: "photo-" + eventIndex + "-" + imageIndex,
      type: "photo",
      url: "https://ik.imagekit.io/example/photos/" + eventIndex + "-" + imageIndex + ".webp",
      alt: "Wedding photograph " + imageIndex,
    })),
  }));
  const media = flattenWeddingMomentEvents(parseWeddingMomentEvents(raw));
  assert.equal(media.length, 42);
  const rendered = renderWeddingMomentGallery(media);
  const nodes = allNodes(rendered);
  const grid = nodes.find(n => n.attrs["data-wedding-moments-grid"] !== undefined);
  const template = nodes.find(n => n.tag === "template" &&
    n.attrs["data-wedding-moments-remaining"] !== undefined);
  const button = nodes.find(n => n.attrs["data-wedding-load-more"] !== undefined);
  assert.equal(WEDDING_MOMENTS_PAGE_SIZE, 16);
  assert.equal(grid.children.length, 16);
  assert.equal(template.children.length, 26);
  assert.equal(nodes.filter(n => n.attrs["data-wedding-moment-id"] !== undefined).length, 42);
  assert.equal(button.tag, "button");
  assert.equal(button.attrs["aria-controls"], "redcarpert-wedding-grid");
  assert.equal(nodes.filter(n => n.tag === "figcaption" || n.tag === "h3").length, 0);
});

test("real MP4/WebM videos have poster thumbnails and native accessible player", () => {
  const events = parseWeddingMomentEvents(fixture());
  const nodes = allNodes(renderWeddingMomentGallery(flattenWeddingMomentEvents(events)));
  const cards = nodes.filter(n => n.attrs["data-wedding-moment-id"] !== undefined);
  assert.deepEqual(cards.map(n => n.attrs["data-wedding-moment-id"]), ["couple-portrait", "dance-film"]);
  const triggers = nodes.filter(n => n.attrs["data-wedding-media"] !== undefined);
  assert.deepEqual(triggers.map(n => n.attrs["data-wedding-media"]), ["photo", "video"]);
  assert.equal(nodes.filter(n => n.tag === "img").length, 3, "Both cards plus preview img");
  assert(nodes.some(n => n.tag === "dialog" && n.attrs.id === "redcarpert-wedding-preview"));
  const nativeVideo = nodes.find(n => n.tag === "video");
  assert.equal(nativeVideo.attrs.controls, "controls");
  assert.equal(nativeVideo.attrs.preload, "none");
  assert.equal(nativeVideo.attrs.src, undefined);
  const videoCard = cards[1];
  assert(!allNodes(videoCard.children).some(n => n.tag === "figcaption"));
  assert(allNodes(videoCard.children).some(n => n.attrs.class === "redcarpert-moment-play"));
});

test("all video cards require a thumbnail image, even for client files", () => {
  const withoutPoster = fixture();
  delete withoutPoster[0].media[1].poster;
  assert.throws(() => parseWeddingMomentEvents(withoutPoster), /poster must be nonempty text/);
});

test("unsafe URLs, bad media types and duplicate IDs fail closed", () => {
  const mutated = fn => { const input = fixture(); fn(input); return () => parseWeddingMomentEvents(input); };
  assert.throws(() => parseWeddingMomentEvents({}), /events must be an array/);
  assert.throws(mutated(x => { x[0].media = []; }), /requires at least one/);
  assert.throws(mutated(x => { x[0].media[0].alt = ""; }), /nonempty text/);
  assert.throws(mutated(x => { x[0].media[1].url = "http://example.com/film.mp4"; }), /HTTPS/);
  assert.throws(mutated(x => { x[0].media[1].url = "https://example.com/film.avi"; }), /MP4 or WebM/);
  assert.throws(mutated(x => { x[0].media[0].url = 'https://example.com/pic.jpg"'; }), /unsafe/);
  assert.throws(mutated(x => { x[0].media[1].id = x[0].media[0].id; }), /duplicate or invalid media id/);
  assert.throws(mutated(x => { x.push(structuredClone(x[0])); }), /duplicate or invalid event id/);
  assert.throws(mutated(x => { x[0].media[1].type = "audio"; }), /type must be photo, video or video_link/);
});

test("published page contains only one headline, subtitle and image-only gallery", () => {
  const source = sitePages["/wedding-moments"];
  const document = adaptEditorialDocument(source);
  const root = allNodes(document.nodes).find(n => n.attrs["data-editorial-route"] === "/wedding-moments");
  const descendants = allNodes(root.children);
  assert(allNodes(document.nodes).some(n => n.tag === "h1" && n.children.includes("Wedding Moments")));
  assert.equal(descendants.filter(n => ["h2", "h3", "figcaption"].includes(n.tag)).length, 0);
  const subtitle = root.children.find(n => n.attrs.class === "redcarpert-moments-subtitle");
  assert.deepEqual(subtitle.children, ["The love, the laughter, the unforgettable moments."]);
  assert.equal(descendants.filter(n => n.attrs["data-wedding-moments-grid"] !== undefined).length, 1);
  assert.equal(descendants.filter(n => n.attrs["data-wedding-moment-id"] !== undefined).length, 14);
  assert.equal(descendants.filter(n => n.attrs["data-bride-card"] !== undefined).length, 0);
  assert.match(JSON.stringify(root), /not Redcarpert client events/);
  const menu = allNodes(adaptNavigation(source).nodes);
  assert(menu.some(n => n.tag === "a" && n.attrs.href === "/wedding-moments/" &&
    n.children.includes("Wedding Moments")));
});
