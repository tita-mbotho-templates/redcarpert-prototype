import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import imageLinks from "../src/data/image-links.json" with { type: "json" };
import { requireImageLink } from "../src/lib/image-links.ts";
import { catalogueProducts } from "../src/data/catalogue.ts";
import { bridalGalleryPhotos } from "../src/data/bridal-gallery.ts";
import { adaptEditorialDocument } from "../src/lib/editorial-pages.ts";
import { sitePages } from "../src/data/site.ts";

const descendants = children => children.flatMap(node =>
  typeof node === "string" ? [] : [node, ...descendants(node.children)]);

test("all 29 live Pexels image links are unique and grouped by page", () => {
  const groups = [
    imageLinks.products.mermaid,
    imageLinks.products.ball_gown,
    imageLinks.our_brides,
    imageLinks.about_us.team,
  ];
  assert.deepEqual(groups.map(group => group.length), [4, 4, 18, 3]);
  const entries = groups.flat();
  assert.equal(entries.length, 29);
  assert.equal(new Set(entries.map(photo => photo.id)).size, 29);
  assert.equal(new Set(entries.map(photo => photo.url)).size, 29);
  for (const photo of entries) {
    const image = new URL(photo.url);
    assert.equal(image.hostname, "images.pexels.com");
    assert(image.pathname.startsWith("/photos/"));
    if ("sourceUrl" in photo) {
      const credit = new URL(photo.sourceUrl);
      assert.equal(credit.hostname, "www.pexels.com");
      assert(credit.pathname.startsWith("/photo/"));
      const imageId = image.pathname.match(/\/photos\/(\d+)\//)?.[1];
      assert(imageId && credit.pathname.endsWith(imageId + "/"));
    }
  }
  assert.equal(entries.filter(photo => "sourceUrl" in photo).length, 26);
});

test("catalogue and lookbook continue to use the 8 credited sample links", () => {
  assert.equal(catalogueProducts.length, 8);
  for (const product of catalogueProducts) {
    const link = requireImageLink(imageLinks.products[product.category], product.id);
    assert.equal(product.image, link.url, product.id);
    assert.equal(product.imageCredit.sourceUrl, link.sourceUrl, product.id);
    assert.match(product.imageAlt, /not Redcarpert inventory/);
    assert.equal(product.status, "sample");
  }
});

test("Our Brides continues to use exactly the 18 credited gallery photos", () => {
  assert.equal(bridalGalleryPhotos.length, 18);
  for (const photo of bridalGalleryPhotos) {
    const link = requireImageLink(imageLinks.our_brides, photo.id);
    assert.equal(photo.image, link.url, photo.id);
    assert.equal(photo.sourceUrl, link.sourceUrl, photo.id);
    assert.match(photo.alt, /not a Redcarpert customer/);
  }
});

test("About Us still renders its 3 illustrations in manifest order", () => {
  const document = adaptEditorialDocument(sitePages["/about-us"]);
  const cards = descendants(document.nodes).filter(node =>
    node.attrs.class === "redcarpert-editorial-team-card");
  assert.equal(cards.length, 3);
  const actual = cards.map(card =>
    descendants(card.children).find(node => node.tag === "img")?.attrs.src);
  assert.deepEqual(actual, imageLinks.about_us.team.map(photo => photo.url));
  for (const card of cards) assert.match(JSON.stringify(card), /Not Redcarpert staff/);
});

test("live application modules no longer hardcode any Pexels URLs", () => {
  for (const path of [
    "src/data/catalogue.ts",
    "src/data/bridal-gallery.ts",
    "src/lib/editorial-pages.ts",
  ]) {
    assert.doesNotMatch(readFileSync(path, "utf8"),
      /https:\/\/(?:images|www)\.pexels\.com\//, path);
  }
  assert.equal(imageLinks.about_us.atelier.length, 0);
  assert.equal(imageLinks.contact_us.length, 0);
  assert.equal(imageLinks.digital_lookbook.length, 0);
});

test("missing, duplicate and invalid photo references fail closed", () => {
  assert.throws(() => requireImageLink(imageLinks.our_brides, "missing-id"), /expected exactly one/);
  const duplicate = [imageLinks.our_brides[0], imageLinks.our_brides[0]];
  assert.throws(() => requireImageLink(duplicate, duplicate[0].id), /expected exactly one/);
  assert.throws(() =>
    requireImageLink([{ id: "bad", url: "http://example.com/image.jpg" }], "bad"),
    /invalid HTTPS/);
});
