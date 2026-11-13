import assert from "node:assert/strict";
import test from "node:test";
import imageLinks from "../src/data/image-links.json" with { type: "json" };
import { sitePages } from "../src/data/site.ts";
import { adaptEditorialDocument } from "../src/lib/editorial-pages.ts";
import { parseWeddingMomentEvents, renderWeddingMomentEvents, weddingMomentEvents }
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

test("live wedding moments collection is empty until approved media arrives", () => {
  assert.deepEqual(imageLinks.wedding_moments.events, []);
  assert.deepEqual(weddingMomentEvents, []);
  assert.equal(renderWeddingMomentEvents(weddingMomentEvents).length, 0);
});

test("photo and video records retain event groupings and render native media preview", () => {
  const events = parseWeddingMomentEvents(fixture());
  assert.equal(events.length, 1);
  assert.equal(events[0].media.length, 2);
  const nodes = allNodes(renderWeddingMomentEvents(events));
  const cards = nodes.filter(n => n.attrs["data-wedding-moment-id"]);
  assert.deepEqual(cards.map(n => n.attrs["data-wedding-moment-id"]), ["couple-portrait", "dance-film"]);
  const triggers = nodes.filter(n => n.attrs["data-wedding-media"]);
  assert.deepEqual(triggers.map(n => n.attrs["data-wedding-media"]), ["photo", "video"]);
  assert(triggers[1].attrs["aria-label"].startsWith("Watch"));
  assert.equal(triggers[1].attrs["data-wedding-src"], fixture()[0].media[1].url);
  assert.equal(nodes.filter(n => n.tag === "img").length, 2, "Photo and video poster appear as tiles");
  const dialog = nodes.find(n => n.tag === "dialog" && n.attrs.id === "redcarpert-wedding-preview");
  assert(dialog);
  const nativeVideo = nodes.find(n => n.tag === "video");
  assert(nativeVideo);
  assert.equal(nativeVideo.attrs.controls, "controls");
  assert.equal(nativeVideo.attrs.preload, "none");
  assert.equal(nativeVideo.attrs.src, undefined, "Video must not load until a card is opened");
  assert.equal(nativeVideo.attrs.hidden, "hidden");
});

test("videos remain usable without a poster, with a labelled fallback tile", () => {
  const input = fixture();
  delete input[0].media[1].poster;
  const nodes = allNodes(renderWeddingMomentEvents(parseWeddingMomentEvents(input)));
  assert(nodes.some(n => n.attrs.class === "redcarpert-moment-video-fallback"));
});

test("invalid media is never emitted into page HTML", () => {
  const mutated = mutate => {
    const item = fixture(); mutate(item); return () => parseWeddingMomentEvents(item);
  };
  assert.throws(() => parseWeddingMomentEvents({}), /events must be an array/);
  assert.throws(mutated(e => { e[0].media = []; }), /requires at least one/);
  assert.throws(mutated(e => { e[0].media[0].alt = ""; }), /nonempty text/);
  assert.throws(mutated(e => { e[0].media[1].url = "http://example.com/film.mp4"; }), /HTTPS/);
  assert.throws(mutated(e => { e[0].media[1].url = "https://example.com/film.avi"; }), /MP4 or WebM/);
  assert.throws(mutated(e => { e[0].media[0].url = "https://example.com/pic.jpg\""; }), /unsafe/);
  assert.throws(mutated(e => { e[0].media[1].id = e[0].media[0].id; }), /duplicate or invalid media id/);
  assert.throws(mutated(e => { e.push(structuredClone(e[0])); }), /duplicate or invalid event id/);
  assert.throws(mutated(e => { e[0].media[1].type = "audio"; }), /type must be photo or video/);
});

test("legacy URL stays functional, but visible navigation and page title say Wedding Moments", () => {
  const source = sitePages["/our-brides"];
  const editorial = adaptEditorialDocument(source);
  const nodes = allNodes(editorial.nodes);
  const title = nodes.find(n => n.tag === "h1" && n.children.join("") === "Wedding Moments");
  assert(title);
  const sample = nodes.filter(n => n.attrs["data-bride-card"]);
  assert.equal(sample.length, 18, "Preview keeps clearly labelled stock photos until real media is provided");
  assert(nodes.some(n => n.attrs.class === "redcarpert-moments-empty"));
  assert.match(JSON.stringify(editorial), /Pexels stock photographs for inspiration only/);
  assert.match(JSON.stringify(editorial), /photographs and videos/);
  const header = adaptNavigation(source);
  const links = allNodes(header.nodes);
  assert(links.some(n => n.tag === "a" && n.attrs.href === "/our-brides/" &&
    n.children.includes("Wedding Moments")));
});
