import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { adaptSiteDocument } from "../src/lib/content-adapter.ts";
import { contentAdaptations } from "../src/data/content-adaptations.ts";
import { sitePages } from "../src/data/site.ts";

function freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}

const fixture = freeze({
  route: "/sample", title: "Original", description: "Description", bodyClass: "theme", htmlClass: "",
  styles: [{ css: ".button { padding: 12px }" }], scripts: ["/theme.js"], themeConfig: "/config.js",
  postScripts: ["/after.js"], rendered: { bodyClass: "theme", htmlClass: "" },
  nodes: [{ tag: "main", attrs: { id: "content", style: "width:100%" }, children: [
    { tag: "a", attrs: { id: "hero", href: "/old", class: "button" }, children: ["Original", { tag: "span", attrs: {}, children: ["Nested"] }] },
    { tag: "a", attrs: { id: "other", href: "/old", class: "button" }, children: ["Original"] },
    { tag: "img", attrs: { src: "/old.jpg", srcset: "/old.jpg 1x", sizes: "100vw", alt: "Old image", width: "400", height: "600", style: "object-fit:cover" }, children: [] },
    { tag: "script", attrs: { src: "/runtime.js" }, children: ["original code"] },
  ] }],
});
const rule = (changes, target = { tag: "a", attrs: { id: "hero" } }, extra = {}) => ({
  id: "sample-rule", route: "/sample", target, changes, ...extra,
});
const text = { kind: "text", childIndex: 0, expected: "Original", value: "Replacement" };

test("all 8 source documents remain immutable; only the homepage has applicable rules", () => {
  assert.equal(contentAdaptations.length, 2, "Only the two approved homepage text rules are enabled");
  assert.ok(contentAdaptations.every((adaptation) => adaptation.route === "/"));
  assert.equal(Object.keys(sitePages).length, 8);
  for (const adaptation of contentAdaptations) assert.ok(Object.hasOwn(sitePages, adaptation.route), "unknown configured route");
  const digest = () => createHash("sha256").update(JSON.stringify(sitePages)).digest("hex");
  const before = digest();
  freeze(sitePages);
  for (const [route, original] of Object.entries(sitePages)) {
    assert.equal(original.route, route);
    assert.strictEqual(adaptSiteDocument(original, []), original, route);
    const result = adaptSiteDocument(original, contentAdaptations);
    if (route !== "/") assert.strictEqual(result, original, route);
  }
  assert.equal(digest(), before);
});

test("homepage changes exactly the approved brand and hero CTA text, retaining every attribute and other child", () => {
  const nodeAt = (document, path) => path.reduce((nodes, index, i) => i === path.length - 1 ? nodes[index] : nodes[index].children, document.nodes);
  const brandPath = [1, 1, 4, 1, 1, 2, 0, 0];
  const ctaPath = [1, 1, 4, 1, 1, 0, 0, 2];
  const original = sitePages["/"];
  const expected = structuredClone(original);
  assert.equal(nodeAt(expected, brandPath).children[0], "VANESA BRIDAL");
  assert.equal(nodeAt(expected, ctaPath).children[0], "EXPLORE COLLECTION");
  nodeAt(expected, brandPath).children[0] = "Redcarpert Wedding Dresses";
  nodeAt(expected, ctaPath).children[0] = "Explore Wedding Dresses";
  const result = adaptSiteDocument(original, contentAdaptations);
  assert.deepEqual(result, expected);
  for (const field of Object.keys(original).filter((field) => field !== "nodes")) assert.strictEqual(result[field], original[field], field);
  assert.strictEqual(nodeAt(result, [1, 1, 2]), nodeAt(original, [1, 1, 2]), "Header/logo/navigation subtree is unchanged");
  assert.equal(nodeAt(result, ctaPath).attrs.href, "/product/");
  assert.ok(Object.hasOwn(sitePages, "/product"), "Existing catalogue destination remains available");
  assert.equal(nodeAt(original, brandPath).children[0], "VANESA BRIDAL");
  assert.equal(nodeAt(original, ctaPath).children[0], "EXPLORE COLLECTION");
});

test("only a guarded text slot and href change; nested markup and all runtime/design fields survive", () => {
  const result = adaptSiteDocument(fixture, [rule([text, { kind: "attribute", name: "href", expected: "/old", value: "/new" }])]);
  const main = result.nodes[0];
  assert.equal(main.children[0].children[0], "Replacement");
  assert.equal(main.children[0].attrs.href, "/new");
  assert.equal(main.children[0].attrs.class, "button");
  assert.strictEqual(main.children[0].children[1], fixture.nodes[0].children[0].children[1]);
  assert.strictEqual(main.children[1], fixture.nodes[0].children[1]);
  assert.deepEqual(main.attrs, fixture.nodes[0].attrs);
  assert.equal(main.children.length, fixture.nodes[0].children.length);
  for (const field of Object.keys(fixture).filter((field) => field !== "nodes")) assert.strictEqual(result[field], fixture[field], field);
  assert.equal(fixture.nodes[0].children[0].children[0], "Original");
  assert.equal(fixture.nodes[0].children[0].attrs.href, "/old");
});

test("image content attributes can change without touching dimensions, styles or siblings", () => {
  const changes = [
    ["src", "/old.jpg", "/new.jpg"], ["srcset", "/old.jpg 1x", "/new.jpg 1x"],
    ["sizes", "100vw", "80vw"], ["alt", "Old image", "Sample image"],
  ].map(([name, expected, value]) => ({ kind: "attribute", name, expected, value }));
  const result = adaptSiteDocument(fixture, [rule(changes, { tag: "img", attrs: { src: "/old.jpg" } })]);
  const image = result.nodes[0].children[2];
  assert.equal(image.attrs.src, "/new.jpg");
  assert.equal(image.attrs.alt, "Sample image");
  for (const name of ["width", "height", "style"]) assert.equal(image.attrs[name], fixture.nodes[0].children[2].attrs[name]);
  assert.strictEqual(result.nodes[0].children[0], fixture.nodes[0].children[0]);
});

test("missing and ambiguous targets fail; an exact path can disambiguate repeated markup", () => {
  assert.throws(() => adaptSiteDocument(fixture, [rule([text], { tag: "a", attrs: { id: "missing" } })]), /expected exactly one target, found 0/);
  assert.throws(() => adaptSiteDocument(fixture, [rule([text], { tag: "a", attrs: { class: "button" } })]), /expected exactly one target, found 2/);
  const result = adaptSiteDocument(fixture, [rule([text], { tag: "a", attrs: { class: "button" }, path: [0, 1] })]);
  assert.equal(result.nodes[0].children[1].children[0], "Replacement");
  assert.strictEqual(result.nodes[0].children[0], fixture.nodes[0].children[0]);
  assert.throws(() => adaptSiteDocument(fixture, [rule([text], { tag: "a", attrs: { id: "hero" }, path: [0, 1] })]), /found 0/);
});

test("expected-value and text-slot guards reject stale edits without mutating the source", () => {
  const snapshot = JSON.stringify(fixture);
  for (const change of [
    { ...text, expected: "Stale" }, { ...text, childIndex: 1 }, { ...text, childIndex: -1 }, { ...text, childIndex: 0.5 },
    { kind: "attribute", name: "href", expected: "/stale", value: "/new" },
    { kind: "attribute", name: "title", expected: "", value: "New" },
  ]) assert.throws(() => adaptSiteDocument(fixture, [rule([change])]), /does not match/);
  assert.throws(() => adaptSiteDocument(fixture, [rule([text, { kind: "attribute", name: "href", expected: "/stale", value: "/new" }])]), /does not match/);
  assert.equal(JSON.stringify(fixture), snapshot);
});

test("plain-JS configuration cannot edit classes, styles, dimensions, plugin settings or events", () => {
  for (const name of ["class", "style", "id", "width", "height", "data-settings", "onclick"]) {
    assert.throws(() => adaptSiteDocument(fixture, [rule([{ kind: "attribute", name, expected: "", value: "new" }])]), /outside the content allowlist/);
  }
  assert.throws(() => adaptSiteDocument(fixture, [rule([{ kind: "attribute", name: "src", expected: "/runtime.js", value: "/new.js" }], { tag: "script", attrs: {} })]), /executable\/style nodes/);
});

test("overlapping rules and duplicate IDs fail even when an earlier edit is a no-op", () => {
  assert.throws(() => adaptSiteDocument(fixture, [rule([text]), rule([text])]), /duplicate rule id/);
  assert.throws(() => adaptSiteDocument(fixture, [rule([{ ...text, value: "Original" }, text])]), /overlapping changes/);
  assert.throws(() => adaptSiteDocument(fixture, [rule([text]), rule([text], undefined, { id: "second-rule" })]), /overlapping changes/);
});

test("nonoverlapping edits of the same target compose against the original; unrelated routes retain identity", () => {
  const result = adaptSiteDocument(fixture, [rule([text]), rule([{ kind: "attribute", name: "href", expected: "/old", value: "/new" }], undefined, { id: "link-rule" })]);
  assert.equal(result.nodes[0].children[0].children[0], "Replacement");
  assert.equal(result.nodes[0].children[0].attrs.href, "/new");
  assert.strictEqual(adaptSiteDocument(fixture, [rule([text], undefined, { route: "/elsewhere" })]), fixture);
});
