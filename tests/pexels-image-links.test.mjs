import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import imageLinks from "../src/data/image-links.json" with { type: "json" };
import { requireImageLink } from "../src/lib/image-links.ts";
import { catalogueProducts } from "../src/data/catalogue.ts";
import { adaptEditorialDocument } from "../src/lib/editorial-pages.ts";
import { sitePages } from "../src/data/site.ts";

const descendants = children => children.flatMap(node =>
  typeof node === "string" ? [] : [node, ...descendants(node.children)]);

test("remaining Pexels stock imagery is limited to catalogue and team illustrations", () => {
  const collection = [
    ...imageLinks.products.mermaid,
    ...imageLinks.products.ball_gown,
    ...imageLinks.about_us.team,
  ];
  assert.equal(collection.length, 11);
  assert.equal(new Set(collection.map(item => item.id)).size, 11);
  assert.equal(new Set(collection.map(item => item.url)).size, 11);
  for (const item of collection) {
    const url = new URL(item.url);
    assert.equal(url.hostname, "images.pexels.com");
    assert(url.pathname.startsWith("/photos/"));
    if ("sourceUrl" in item) {
      const source = new URL(item.sourceUrl);
      assert.equal(source.hostname, "www.pexels.com");
      assert(source.pathname.startsWith("/photo/"));
      const id = url.pathname.match(/\/photos\/(\d+)\//)?.[1];
      assert(id && source.pathname.endsWith(id + "/"));
    }
  }
  assert.equal(collection.filter(x => "sourceUrl" in x).length, 8);

});

test("catalogue photos and lookbook links stay identical", () => {
  assert.equal(catalogueProducts.length, 8);
  for (const product of catalogueProducts) {
    const ref = requireImageLink(imageLinks.products[product.category], product.id);
    assert.equal(product.image, ref.url);
    assert.equal(product.imageCredit.sourceUrl, ref.sourceUrl);
    assert.match(product.imageAlt, /not Redcarpert inventory/);
  }
});

test("About Us stock illustrations are preserved", () => {
  const nodes = descendants(adaptEditorialDocument(sitePages["/about-us"]).nodes);
  const cards = nodes.filter(node => node.attrs.class === "redcarpert-editorial-team-card");
  assert.equal(cards.length, 3);
  assert.deepEqual(cards.map(card => descendants(card.children)
    .find(node => node.tag === "img")?.attrs.src), imageLinks.about_us.team.map(item => item.url));
});

test("live modules contain no duplicate Pexels image URLs outside the manifest", () => {
  for (const path of ["src/data/catalogue.ts", "src/lib/editorial-pages.ts"]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /https:\/\/images\.pexels\.com\//, path);
  }
  assert.equal(imageLinks.about_us.atelier.length, 0);
  assert.equal(imageLinks.contact_us.length, 0);
  assert.equal(imageLinks.digital_lookbook.length, 0);
});
