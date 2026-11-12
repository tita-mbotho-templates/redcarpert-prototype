import assert from "node:assert/strict";
import test from "node:test";
import { sitePages } from "../src/data/site.ts";
import { catalogueProducts } from "../src/data/catalogue.ts";
import {
  approvedCapturedRoutes,
  authoredPrototypeRoutes,
  isApprovedCapturedRoute,
  publicStaticRoutes,
} from "../src/lib/public-routes.ts";

test("08C only generates approved Redcarpert and sample preview routes", () => {
  assert.deepEqual([...approvedCapturedRoutes], [
    "/", "/product", "/product-category/mermaid", "/product-category/ball_gown",
    "/about-us", "/contact-us", "/our-brides",
  ]);

  const previews = catalogueProducts.map((product) => product.previewRoute);
  const generated = publicStaticRoutes(sitePages, previews);
  assert.deepEqual(generated, [...approvedCapturedRoutes.filter((route) => route !== "/"), ...authoredPrototypeRoutes, ...previews]);
  assert.equal(new Set(generated).size, generated.length);
  assert(!generated.includes("/")); // Added explicitly by scripts/generate.ts.
  for (const route of generated) assert(route in sitePages || authoredPrototypeRoutes.includes(route) || previews.includes(route));
  for (const route of approvedCapturedRoutes) assert(isApprovedCapturedRoute(route));
  for (const route of previews) assert(!isApprovedCapturedRoute(route)); // Handled by explicit sample route lookup.

  const retired = Object.keys(sitePages).filter((route) => !isApprovedCapturedRoute(route));
  assert.deepEqual(retired, ["/product/arabella"], "Only the private sample-detail shell may remain outside public page captures");
  for (const route of retired) assert(!generated.includes(route));
  for (const route of [
    "/product/arabella", "/product/aventhera", "/product/page/2",
    "/product-category/bridal-bags", "/store", "/atelier-2",
    "/product/preview/unknown",
  ]) {
    assert(!isApprovedCapturedRoute(route));
    assert(!generated.includes(route));
  }
});

test("08C refuses missing approved pages and colliding sample URLs", () => {
  const captures = Object.fromEntries(approvedCapturedRoutes.map((route) => [route, true]));
  const previews = catalogueProducts.map((product) => product.previewRoute);
  assert.deepEqual(publicStaticRoutes(captures, previews),
    [...approvedCapturedRoutes.filter((route) => route !== "/"), ...authoredPrototypeRoutes, ...previews]);
  assert.throws(() => publicStaticRoutes({ "/": true }, previews), /missing from captures/);
  assert.throws(() => publicStaticRoutes(captures, [previews[0], previews[0]]), /colliding/);
  assert.throws(() => publicStaticRoutes({ ...captures, [previews[0]]: true }, previews), /colliding/);
  assert.throws(() => publicStaticRoutes(captures, ["/product/arabella"]), /Invalid or colliding/);
});
