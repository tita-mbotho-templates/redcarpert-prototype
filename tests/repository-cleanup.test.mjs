import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { sitePages } from "../src/data/site.ts";
import { approvedCapturedRoutes } from "../src/lib/public-routes.ts";

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const target = path.join(dir, item.name);
    return item.isDirectory() ? files(target) : [target];
  });
}

test("the live build has only approved source shells and the private sample-detail donor", () => {
  const expected = [...approvedCapturedRoutes, "/product/arabella"].sort();
  assert.deepEqual(Object.keys(sitePages).sort(), expected);
  assert.equal(Object.keys(sitePages).length, 8);
  for (const page of Object.values(sitePages)) {
    assert.ok(Array.isArray(page.nodes));
    assert.ok(Array.isArray(page.styles));
    assert.equal(typeof page.route, "string");
  }
});

test("the captured public archive has been pruned without removing Redcarpert artwork", () => {
  const paths = files("public");
  const bytes = paths.reduce((sum, file) => sum + statSync(file).size, 0);
  assert.ok(paths.length <= 150, `unexpected public archive growth: ${paths.length} files`);
  assert.ok(bytes < 20 * 1024 * 1024, `unexpected public archive growth: ${bytes} bytes`);
  assert.ok(paths.every((file) => /^public[\\/](?:redcarpert|seo|site-assets)[\\/]/.test(file)), "unapproved asset directory");
  for (const required of [
    "public/redcarpert/brand/redcarpert-logo.png",
    "public/redcarpert/gallery/sample-01-mermaid-pexels.webp",
    "public/redcarpert/gallery/sample-02-ball-gown-pexels.webp",
    "public/redcarpert/home/brand-pexels-sample.webp",
    "public/redcarpert/home/collection-pexels-sample.webp",
    "public/redcarpert/home/hero-pexels-sample.webp",
  ]) assert.ok(existsSync(required), `missing ${required}`);
  for (const retired of ["public/gallery-data", "public/videos", "public/images", "codex-reports"]) {
    assert.ok(!existsSync(retired), `legacy directory still tracked: ${retired}`);
  }
});

test("Redcarpert owns its package metadata and preserves no inherited software licence claim", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  assert.equal(pkg.repository.url, "git+https://github.com/tita-mbotho-studio/redcarpert-prototype.git");
  assert.ok(!("author" in pkg));
  assert.ok(!("license" in pkg));
  assert.ok(!("homepage" in pkg));
  assert.ok(!("bugs" in pkg));
  assert.ok(!("license" in lock.packages[""]));
  assert.equal(lock.packages[""].name, pkg.name);
  assert.equal(lock.packages[""].version, pkg.version);
  assert.ok(existsSync("docs/asset-credits.md"));
});
