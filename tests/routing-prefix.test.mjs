import assert from "node:assert/strict";
import test from "node:test";
import { prefix } from "../scripts/lib/assets.ts";
import { REPOSITORY_BASE } from "../src/config/site.ts";
import { approvedCapturedRoutes, authoredPrototypeRoutes }
  from "../src/lib/public-routes.ts";

test("every public navigation route gets the GitHub Pages / Codespaces base prefix", () => {
  const publicRoutes = [...approvedCapturedRoutes, ...authoredPrototypeRoutes];
  assert.equal(REPOSITORY_BASE, "/redcarpert-prototype/");
  for (const route of publicRoutes) {
    const url = route === "/" ? "/" : route + "/";
    const output = prefix('<a href="' + url + '">View</a>');
    const expected = '<a href="' + REPOSITORY_BASE + url.slice(1) + '">View</a>';
    assert.equal(output, expected, route + " must have the configured site base");
  }
});

test("Wedding Moments navigation works from home and nested pages, including mobile menu links", () => {
  for (const markup of [
    '<a href="/wedding-moments/">Wedding Moments</a>',
    '<div class="mob-nav-menu"><a href="/wedding-moments/">Wedding Moments</a></div>',
  ]) {
    const output = prefix(markup);
    assert(output.includes('href="/redcarpert-prototype/wedding-moments/"'));
    assert(!output.includes('href="/wedding-moments/"'));
    assert(!output.includes('/redcarpert-prototype/redcarpert-prototype/'));
  }
});

test("external media URLs are not rewritten as internal page URLs", () => {
  const url = "https://images.pexels.com/photos/8063143/pexels-photo-8063143.jpeg";
  const markup = '<img src="' + url + '">';
  assert.equal(prefix(markup), markup);
});
