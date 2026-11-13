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
} from "../src/lib/wedding-moments.ts";
import { adaptNavigation } from "../src/lib/navigation-adapter.ts";

const allNodes = nodes => nodes.flatMap(n =>
  typeof n === "string" ? [] : [n, ...allNodes(n.children)]);
const base = "https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-moments/";
const suppliedPhotoNumbers = [56, 19, 20, 31, 23, 14, 13, 16, 61, 27, 11, 53, 87, 54, 28, 79, 59, 72, 60, 4, 86, 37, 50, 6, 48, 73, 30, 9, 8, 12, 45, 58, 32, 18, 35, 78, 51, 84, 29, 85, 46, 21, 22, 81, 10, 57, 47, 44, 43, 77, 15, 5, 42, 17, 33, 7, 24, 26, 38, 83, 49, 36, 34, 41, 40, 69, 62, 80, 52, 25, 76, 68, 82, 3, 39, 70, 63, 74, 71, 65, 67, 75, 66, 2, 1, 64];
const videoUrl = base + "wedding-moments-88.mp4";

const fixture = () => [{
  id: "celebration-2026",
  title: "A day to remember",
  media: [
    { id: "couple-portrait", type: "photo",
      url: "https://ik.imagekit.io/example/events/couple.webp",
      alt: "A couple with their loved ones" },
    { id: "dance-film", type: "video",
      url: "https://ik.imagekit.io/example/events/dance.mp4?updatedAt=2",
      poster: "https://ik.imagekit.io/example/events/dance-cover.webp",
      caption: "The wedding dance" },
  ],
}];

test("every supplied real-client URL is stored once and in the given order", () => {
  assert.deepEqual(Object.keys(imageLinks.wedding_moments), ["events"]);
  assert.equal(imageLinks.wedding_moments.events.length, 1);
  assert.equal(weddingMomentEvents.length, 1);
  const media = weddingMomentEvents[0].media;
  assert.equal(media.length, 87);
  assert.equal(new Set(media.map(item => item.id)).size, media.length);
  assert.equal(new Set(media.map(item => item.url)).size, media.length);
  assert.deepEqual(media.map(item => item.id), [
    "wedding-moments-88",
    ...suppliedPhotoNumbers.map(n => "wedding-moments-" + n),
  ]);
  assert.deepEqual(media.map(item => item.url), [
    videoUrl,
    ...suppliedPhotoNumbers.map(n => base + "wedding-moments-" + n + ".jpg"),
  ]);
  assert.equal(media.filter(item => item.type === "photo").length, 86);
  assert.equal(media.filter(item => item.type === "video").length, 1);
  assert.equal(media[0].poster, videoUrl + "/ik-thumbnail.jpg");
  assert.equal(media.some(item => item.id === "wedding-moments-55"), false,
    "do not invent an omitted photograph");
});

test("real client media renders as one gallery with sixteen visible square tiles", () => {
  const media = flattenWeddingMomentEvents(weddingMomentEvents);
  const nodes = allNodes(renderWeddingMomentGallery(media));
  const grids = nodes.filter(n => n.attrs["data-wedding-moments-grid"] !== undefined);
  assert.equal(grids.length, 1);
  const grid = grids[0];
  const template = nodes.find(n => n.tag === "template" &&
    n.attrs["data-wedding-moments-remaining"] !== undefined);
  const loadMore = nodes.find(n => n.attrs["data-wedding-load-more"] !== undefined);
  assert.equal(WEDDING_MOMENTS_PAGE_SIZE, 16);
  assert.equal(grid.children.length, 16);
  assert.equal(template.children.length, 71);
  assert.equal(nodes.filter(n => n.attrs["data-wedding-moment-id"] !== undefined).length, 87);
  assert.equal(nodes.filter(n => ["h2", "h3", "figcaption"].includes(n.tag)).length, 0);
  assert.equal(loadMore.tag, "button");
  assert.equal(loadMore.attrs["aria-controls"], "redcarpert-wedding-grid");
  const tiles = allNodes(grid.children).filter(n => n.attrs["data-wedding-media"] !== undefined);
  assert.equal(tiles.length, 16);
  assert.equal(tiles[0].attrs["data-wedding-media"], "video");
  assert.equal(tiles[0].attrs["data-wedding-src"], videoUrl);
  assert.equal(tiles.filter(n => n.attrs["data-wedding-media"] === "photo").length, 15);
  assert(!nodes.some(n => n.tag === "a" && n.attrs.href?.includes("pexels.com")),
    "stock Pexels video links must never appear on the client page");
});

test("gallery still supports client videos with accessible native controls and image posters", () => {
  const nodes = allNodes(renderWeddingMomentGallery(flattenWeddingMomentEvents(parseWeddingMomentEvents(fixture()))));
  const triggers = nodes.filter(n => n.attrs["data-wedding-media"] !== undefined);
  assert.deepEqual(triggers.map(n => n.attrs["data-wedding-media"]), ["photo", "video"]);
  const videoButton = triggers[1];
  const thumbnail = allNodes(videoButton.children).find(n => n.tag === "img");
  assert.equal(thumbnail.attrs.src, "https://ik.imagekit.io/example/events/dance-cover.webp");
  assert(allNodes(videoButton.children).some(n => n.attrs.class === "redcarpert-moment-play"));
  const player = nodes.find(n => n.tag === "video");
  assert.equal(player.attrs.controls, "controls");
  assert.equal(player.attrs.preload, "none");
  assert.equal(player.attrs.src, undefined);
  assert.equal(player.attrs.hidden, "hidden");
});

test("additional uploaded event batches show newest first without new visual categories", () => {
  const events = parseWeddingMomentEvents([
    { id: "first-upload", title: "First", media: [
      { id: "photo-one", type: "photo", url: "https://example.com/1.jpg", alt: "First" },
    ]},
    { id: "second-upload", title: "Second", media: [
      { id: "photo-two", type: "photo", url: "https://example.com/2.jpg", alt: "Second" },
      { id: "photo-three", type: "photo", url: "https://example.com/3.jpg", alt: "Third" },
    ]},
  ]);
  assert.deepEqual(flattenWeddingMomentEvents(events).map(x => x.id),
    ["photo-two", "photo-three", "photo-one"]);
  assert.deepEqual(flattenWeddingMomentEvents(events, false).map(x => x.id),
    ["photo-one", "photo-two", "photo-three"]);
});

test("client-only schema rejects bad URLs, unsupported videos and duplicate media", () => {
  const mutated = fn => {
    const input = fixture(); fn(input);
    return () => parseWeddingMomentEvents(input);
  };
  assert.throws(() => parseWeddingMomentEvents({}), /events must be an array/);
  assert.throws(mutated(x => { x[0].media = []; }), /requires at least one/);
  assert.throws(mutated(x => { x[0].media[0].alt = ""; }), /nonempty text/);
  assert.throws(mutated(x => { x[0].media[1].url = "http://example.com/video.mp4"; }), /HTTPS/);
  assert.throws(mutated(x => { x[0].media[1].url = "https://example.com/video.avi"; }), /MP4 or WebM/);
  assert.throws(mutated(x => { x[0].media[1].poster = ""; }), /nonempty text/);
  assert.throws(mutated(x => { x[0].media[0].url = 'https://example.com/image.jpg"'; }), /unsafe/);
  assert.throws(mutated(x => { x[0].media[1].id = x[0].media[0].id; }), /duplicate or invalid media id/);
  assert.throws(mutated(x => { x.push(structuredClone(x[0])); }), /duplicate or invalid event id/);
  assert.throws(mutated(x => { x[0].media[1].type = "video_link"; }), /type must be photo or video/);
});

test("Wedding Moments page has only its heading, subtitle and single client gallery", () => {
  const source = sitePages["/wedding-moments"];
  assert(source);
  const doc = adaptEditorialDocument(source);
  const descendants = allNodes(doc.nodes);
  const root = descendants.find(n => n.attrs["data-editorial-route"] === "/wedding-moments");
  assert(root);
  assert(descendants.some(n => n.tag === "h1" && n.children.includes("Wedding Moments")));
  const inner = allNodes(root.children);
  assert.equal(inner.filter(n => ["h2", "h3", "figcaption"].includes(n.tag)).length, 0);
  assert.deepEqual(root.children[0].children, ["The love, the laughter, the unforgettable moments."]);
  assert.equal(inner.filter(n => n.attrs["data-wedding-moments-grid"] !== undefined).length, 1);
  assert.equal(inner.filter(n => n.attrs["data-wedding-moment-id"] !== undefined).length, 87);
  assert.equal(inner.filter(n => n.attrs["data-bride-card"] !== undefined).length, 0);
  assert.doesNotMatch(JSON.stringify(root), /Stock wedding photography|Pexels stock|not Redcarpert client events/);
  const menu = allNodes(adaptNavigation(source).nodes);
  assert(menu.some(n => n.tag === "a" && n.attrs.href === "/wedding-moments/" &&
    n.children.includes("Wedding Moments")));
});
