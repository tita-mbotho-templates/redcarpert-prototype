import assert from "node:assert/strict";
import test from "node:test";
import imageLinks from "../src/data/image-links.json" with { type: "json" };
import { sitePages } from "../src/data/site.ts";
import { adaptEditorialDocument } from "../src/lib/editorial-pages.ts";
import { parseWeddingMomentEvents, renderWeddingMomentEvents, weddingMomentEvents, weddingMomentShowcase }
  from "../src/lib/wedding-moments.ts";
import { adaptNavigation } from "../src/lib/navigation-adapter.ts";

const allNodes = values => values.flatMap(n =>
  typeof n === "string" ? [] : [n, ...allNodes(n.children)]);
const fixture = () => [{
  id: "celebration-2026",
  title: "A day to remember",
  description: "Ceremony and reception",
  media: [
    { id: "couple-portrait", type: "photo",
      url: "https://ik.imagekit.io/example/events/couple.webp", alt: "A couple with their loved ones",
      caption: "With loved ones" },
    { id: "dance-film", type: "video",
      url: "https://ik.imagekit.io/example/events/dance.mp4?updatedAt=2",
      poster: "https://ik.imagekit.io/example/events/dance-cover.webp",
      caption: "The wedding dance" },
  ],
}];

test("preview features wedding scenes, guests and films rather than old bridal portraits", () => {
  assert.deepEqual(imageLinks.wedding_moments.events, []);
  assert.deepEqual(weddingMomentEvents, []);
  assert.equal(weddingMomentShowcase.length, 3);
  const media = weddingMomentShowcase.flatMap(section => section.media);
  assert.equal(media.filter(item => item.type === "photo").length, 12);
  assert.equal(media.filter(item => item.type === "video_link").length, 2);
  assert(media.some(item => item.alt?.includes("guests")));
  assert(!Object.hasOwn(imageLinks, "our_brides"), "old image manifest is retired");
});

test("real client events support native photo and direct video playback", () => {
  const events = parseWeddingMomentEvents(fixture());
  assert.equal(events.length, 1);
  const nodes = allNodes(renderWeddingMomentEvents(events));
  const cards = nodes.filter(n => n.attrs["data-wedding-moment-id"]);
  assert.deepEqual(cards.map(n => n.attrs["data-wedding-moment-id"]), ["couple-portrait", "dance-film"]);
  const triggers = nodes.filter(n => n.attrs["data-wedding-media"]);
  assert.deepEqual(triggers.map(n => n.attrs["data-wedding-media"]), ["photo", "video"]);
  assert.equal(nodes.filter(n => n.tag === "img").length, 2);
  assert(nodes.some(n => n.tag === "dialog" && n.attrs.id === "redcarpert-wedding-preview"));
  const video = nodes.find(n => n.tag === "video");
  assert.equal(video.attrs.controls, "controls");
  assert.equal(video.attrs.preload, "none");
  assert.equal(video.attrs.src, undefined, "Native video is loaded only after opening");
});

test("stock video examples link to real Pexels pages without pretending to be MP4 files", () => {
  const nodes = allNodes(renderWeddingMomentEvents(weddingMomentShowcase));
  const links = nodes.filter(n => n.tag === "a" && n.attrs.href?.includes("pexels.com/video/"));
  assert.equal(links.length, 2);
  assert(links.every(link => link.attrs.target === "_blank" && link.attrs.rel === "noopener noreferrer"));
  assert(links.every(link => link.attrs["data-wedding-media"] === undefined));
});

test("native videos accept an optional poster; thumbnails fall back when omitted", () => {
  const source = fixture(); delete source[0].media[1].poster;
  const nodes = allNodes(renderWeddingMomentEvents(parseWeddingMomentEvents(source)));
  assert(nodes.some(n => n.attrs.class === "redcarpert-moment-video-fallback"));
});

test("invalid media, unsafe URLs, unsupported videos and duplicate IDs fail closed", () => {
  const mutated = fn => { const source = fixture(); fn(source); return () => parseWeddingMomentEvents(source); };
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

test("Wedding Moments is its own public URL with no rendered old gallery", () => {
  const source = sitePages["/wedding-moments"];
  assert(source);
  assert.equal(sitePages["/our-brides"], undefined);
  const document = adaptEditorialDocument(source);
  const nodes = allNodes(document.nodes);
  assert(nodes.some(n => n.tag === "h1" && n.children.includes("Wedding Moments")));
  assert.equal(nodes.filter(n => n.attrs["data-bride-card"]).length, 0);
  assert.equal(nodes.filter(n => n.attrs["data-wedding-moment-id"]).length, 14);
  assert(!JSON.stringify(document).includes("Bridal inspiration — preview gallery"));
  assert.match(JSON.stringify(document), /not Redcarpert clients, events or services/);
  const menu = allNodes(adaptNavigation(source).nodes);
  assert(menu.some(n => n.tag === "a" && n.attrs.href === "/wedding-moments/" &&
    n.children.includes("Wedding Moments")));
});
