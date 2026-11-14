import test from "node:test";
import assert from "node:assert/strict";
import products from "../src/data/products.json" with { type: "json" };
import { catalogueProducts } from "../src/data/catalogue.ts";
import { priceForDress, displayDressPrice } from "../src/lib/pricing.ts";
import { createNodeRenderer } from "../scripts/lib/markup.ts";

test("central products.json has one ZAR price slot per approved dress", () => {
  assert.equal(products.currency, "ZAR");
  assert.equal(products.dresses.length, 8);
  const ids = products.dresses.map(dress => dress.id);
  assert.equal(new Set(ids).size, 8);
  assert.deepEqual([...ids].sort(), catalogueProducts.map(dress => dress.id).sort());
  for (const product of catalogueProducts) {
    assert.equal(product.priceZar, priceForDress(product.id));
    assert(product.priceZar === null || (Number.isSafeInteger(product.priceZar) && product.priceZar > 0),
      "prices must be unassigned or positive whole-rand amounts");
  }
  assert.throws(() => priceForDress("unknown-dress"), /missing price/);
});

test("price formatting works for unassigned and verified integer ZAR prices", () => {
  assert.equal(displayDressPrice(null), "Price to be confirmed");
  assert.equal(displayDressPrice(12500).replace(/\s/g, " "), "R 12 500");
  assert.equal(displayDressPrice(950).replace(/\s/g, " "), "R 950");
  for (const invalid of [0, -120, 100.25, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => displayDressPrice(invalid), /Invalid wedding dress price/);
  }
});

test("the pre-rendered 10-page Digital Lookbook has eight JSON-backed price slots", () => {
  const render = createNodeRenderer([]);
  const html = render({ tag: "div", attrs: { "data-lookbook-viewer": "true" }, children: [] });
  assert.equal((html.match(/data-book-page=/g) || []).length, 10);
  assert.equal((html.match(/data-book-price=/g) || []).length, 8);
  assert.equal((html.match(/class="redcarpert-book-dress"/g) || []).length, 0,
    "book dress classes may include additional class names");
  for (const product of catalogueProducts) {
    assert(html.includes('data-book-price="' + product.id + '"'));
    assert(html.includes(displayDressPrice(product.priceZar)));
  }
  assert(!html.includes("R 0"), "never invent a zero-price dress");
});
