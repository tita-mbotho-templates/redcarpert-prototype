import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";
import { adaptHomepageBackgrounds, homepageBackgrounds } from "../src/lib/homepage-backgrounds.ts";
import { adaptSiteDocument } from "../src/lib/content-adapter.ts";
import { contentAdaptations } from "../src/data/content-adaptations.ts";
import { sitePages } from "../src/data/site.ts";

const expectedImages = [
  ["/site-assets/ec8b6b2c4222396c44.png", "https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-1.webp?updatedAt=1794351596508"],
  ["/site-assets/9def3725208290c4ef.png", "https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-2.webp?updatedAt=1794351597603"],
  ["/site-assets/46f8a1c412d65fd42b.png", "https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-3.webp?updatedAt=1794351600184"],
];
const at = (document, section) => document.nodes[1].children[1].children[4].children[1].children[1].children[section];
const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
};

test("only the three approved inline URL substrings change; text, layout, CSS and runtime data survive", () => {
  freeze(sitePages);
  const textAdapted = adaptSiteDocument(sitePages["/"], contentAdaptations);
  const expected = structuredClone(textAdapted);
  expectedImages.forEach(([oldUrl, newUrl], index) => {
    const node = at(expected, index);
    assert.equal(node.attrs.style, `background-image:url("${oldUrl}");background-position:center center;`);
    node.attrs.style = `background-image:url("${newUrl}");background-position:center center;--redcarpert-home-photo:url("${newUrl}");`;
  });
  const result = adaptHomepageBackgrounds(textAdapted);
  assert.deepEqual(result, expected);
  for (const key of Object.keys(textAdapted).filter((key) => key !== "nodes")) assert.strictEqual(result[key], textAdapted[key], key);
  assert.equal(at(result, 0).children[0].children[2].children[0], "Explore Wedding Dresses");
  assert.equal(at(result, 0).children[0].children[2].attrs.href, "/product/");
  assert.equal(at(result, 2).children[0].children[0].children[0], "Redcarpert Wedding Dresses");
  assert.strictEqual(result.nodes[1].children[1].children[2], textAdapted.nodes[1].children[1].children[2], "Header remains shared");
});

test("all original documents stay immutable and all other 7 routes retain their original image references", () => {
  const hash = () => createHash("sha256").update(JSON.stringify(sitePages)).digest("hex");
  const before = hash();
  assert.equal(Object.keys(sitePages).length, 8);
  for (const [route, original] of Object.entries(sitePages)) {
    const result = adaptHomepageBackgrounds(original);
    if (route !== "/") assert.strictEqual(result, original, route);
  }
  assert.equal(hash(), before);
});

test("unexpected URLs, extra declarations, changed classes/tags or missing/reordered sections fail closed", () => {
  for (const modify of [
    (node) => { node.attrs.style = node.attrs.style.replace(".png", "-unexpected.png"); },
    (node) => { node.attrs.style += "background-size:contain;"; },
    (node) => { node.attrs.class = "different-section"; },
    (node) => { node.tag = "section"; },
  ]) {
    const document = structuredClone(sitePages["/"]);
    modify(at(document, 1));
    const before = JSON.stringify(document);
    assert.throws(() => adaptHomepageBackgrounds(document), /expected original section and inline style/);
    assert.equal(JSON.stringify(document), before, "A failure after an earlier replacement cannot mutate the input");
  }
  const missing = structuredClone(sitePages["/"]);
  missing.nodes = [];
  assert.throws(() => adaptHomepageBackgrounds(missing), /expected original section/);
  const reordered = structuredClone(sitePages["/"]);
  const sections = reordered.nodes[1].children[1].children[4].children[1].children[1].children;
  [sections[0], sections[1]] = [sections[1], sections[0]];
  assert.throws(() => adaptHomepageBackgrounds(reordered), /expected original section/);
});

test("all three homepage photos are client-supplied remote WebP assets in natural order", () => {
  assert.equal(homepageBackgrounds.length,3);
  homepageBackgrounds.forEach((item,i)=>{
    assert.equal(item.section,i);
    assert.deepEqual([item.original,item.replacement],expectedImages[i]);
    const url=new URL(item.replacement);
    assert.equal(url.protocol,"https:");
    assert.equal(url.hostname,"ik.imagekit.io");
    assert.equal(url.pathname,`/kw8awoqvwi/red-carpet-wedding-dresses/home-page/home-page-${i+1}.webp`);
    assert(/^[0-9]+$/.test(url.searchParams.get("updatedAt")??""),"keep the supplied asset version");
    assert.equal(url.searchParams.size,1);
  });
  assert.equal(new Set(homepageBackgrounds.map(x=>x.replacement)).size,3);
});

test("Option B gives desktop/tablet a sharp 60% centre and 32px blurred sides; mobile stays original", () => {
  const css = readFileSync("src/components/HomepageExperience.css", "utf8");
  assert(css.includes("--redcarpert-home-sharp-width: 60%"),
    "wide screens must have a 60% sharp central photo");
  assert(css.includes("filter: blur(32px) brightness(.66);"),
    "wide screens must have the approved 32px blurred photographic backdrop");
  assert(css.includes("background-size: 100% 100%, cover;"),
    "foreground photograph must cover the sharp panel");
  assert(css.includes("background-position: center center, center top;")
    && css.includes("background-position: center top;"),
    "desktop/tablet photos must favour face visibility with a top-aligned crop");
  const mobile = css.slice(css.indexOf("@media (max-width: 640px) {", css.indexOf("filter: blur(32px)")));
  assert(mobile.startsWith("@media (max-width: 640px) {"),
    "mobile breakpoint must be 640px; tablets share desktop framing");
  assert(mobile.includes("content: none;") && mobile.includes("display: none;"),
    "phones must not draw a duplicate blurred photo");
  assert(mobile.includes("background-image: none;") && mobile.includes("filter: none;"),
    "phones must not render the blurred background");
  assert(mobile.includes("background-image: var(--redcarpert-home-photo);")
    && mobile.includes("background-size: cover;")
    && mobile.includes("background-position: center center;"),
    "phones must preserve their original full-bleed centred photograph");
  assert(!css.includes("mask-image: linear-gradient("),
    "blur must never bleed over the sharp photograph");
  assert(!/min-height:\\s*(?:80|90)svh/.test(css),
    "no responsive section may be shorter than a full viewport");
});
