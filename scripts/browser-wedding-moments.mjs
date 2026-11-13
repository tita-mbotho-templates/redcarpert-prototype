import { chromium } from "playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const base = "https://ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/wedding-moments/";
try {
  for (const width of [1440, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    const galleryImageRequests = [];
    page.on("pageerror", err => errors.push(err.message));
    await page.route("https://ik.imagekit.io/**", route => {
      const url = route.request().url();
      if (url.includes("/wedding-moments/") &&
          (url.endsWith(".jpg") || url.endsWith("/ik-thumbnail.jpg"))) {
        galleryImageRequests.push(url);
      }
      if (route.request().resourceType() === "media") {
        return route.fulfill({ status: 200, contentType: "video/mp4", body: "" });
      }
      return route.fulfill({
        status: 200, contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#eee0d2"/></svg>',
      });
    });

    await page.goto("http://localhost:4173/redcarpert-prototype/wedding-moments/",
      { waitUntil: "domcontentloaded" });
    await page.locator("[data-wedding-moments-grid] button").first().waitFor();
    assert.equal(await page.title(), "Wedding Moments | Redcarpert Wedding Dresses");
    assert.equal(await page.locator("h1").filter({ hasText: "Wedding Moments" }).count(), 1);
    const content = page.locator('[data-editorial-route="/wedding-moments"]');
    assert.equal(await content.locator(".redcarpert-moments-subtitle").textContent(),
      "The love, the laughter, the unforgettable moments.");
    assert.equal(await content.locator("h2,h3,figcaption").count(), 0);

    const gallery = page.locator("[data-wedding-moments-grid]");
    assert.equal(await gallery.count(), 1, "one continuous client gallery");
    const cards = gallery.locator("[data-wedding-moment-id]");
    const loadMore = page.locator("[data-wedding-load-more]");
    const template = page.locator("template[data-wedding-moments-remaining]");
    assert.equal(await cards.count(), 16, "first sixteen cards only");
    assert.equal(await template.evaluate(el => el.content.children.length), 71,
      "remaining 71 media tiles stay inert until selected");
    assert.equal(await loadMore.count(), 1);
    assert.equal(await gallery.locator("button[data-wedding-media=video]").count(), 1);
    assert.equal(await gallery.locator("button[data-wedding-media=photo]").count(), 15);
    assert.equal(await gallery.locator("a[href*='pexels.com']").count(), 0,
      "no stock video links after switching to real client media");
    assert.equal(await gallery.locator("button[data-wedding-media=video]").first()
      .getAttribute("data-wedding-src"), base + "wedding-moments-88.mp4");

    const geometry = await page.evaluate(() => {
      const grid = document.querySelector("[data-wedding-moments-grid]");
      const image = document.querySelector("[data-wedding-moments-grid] img");
      const rect = image.getBoundingClientRect();
      return {
        columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        ratio: rect.width / rect.height,
        overflow: Math.max(document.documentElement.scrollWidth,
          document.body.scrollWidth) > innerWidth + 2,
      };
    });
    assert.equal(geometry.columns, width > 768 ? 4 : 2);
    assert(Math.abs(geometry.ratio - 1) < .02, "all media cards remain square");
    assert.equal(geometry.overflow, false, "no horizontal scrolling");

    const firstPhoto = gallery.locator("button[data-wedding-media=photo]").first();
    assert.equal(await firstPhoto.getAttribute("data-wedding-src"),
      base + "wedding-moments-56.jpg");
    await firstPhoto.click();
    const dialog = page.locator("#redcarpert-wedding-preview");
    assert(await dialog.evaluate(el => el.open));
    const fullImage = dialog.locator("[data-wedding-preview-photo]");
    assert(await fullImage.isVisible());
    assert.equal(await fullImage.evaluate(el => getComputedStyle(el).objectFit), "contain");
    await page.keyboard.press("Escape");
    assert.equal(await dialog.evaluate(el => el.open), false);
    assert.equal(await fullImage.getAttribute("src"), null, "close removes large photo");

    const filmButton = gallery.locator("button[data-wedding-media=video]").first();
    await filmButton.click();
    const player = dialog.locator("[data-wedding-preview-video]");
    assert(await player.isVisible());
    assert.equal(await player.getAttribute("src"), base + "wedding-moments-88.mp4");
    assert(await player.evaluate(el => el.controls), "native video controls");
    await page.keyboard.press("Escape");
    assert.equal(await player.getAttribute("src"), null, "close unloads video");

    for (const expected of [32, 48, 64, 80, 87]) {
      await loadMore.click();
      assert.equal(await cards.count(), expected, "Load More reveals another batch");
    }
    assert.equal(await template.evaluate(el => el.content.children.length), 0);
    assert.equal(await loadMore.isVisible(), false, "Load More disappears when finished");
    assert.equal(await gallery.locator("img").count(), 87);
    assert.deepEqual(errors, [], "no JavaScript errors at " + width + "px");
    console.log("Wedding Moments real media PASS", width + "px",
      "image requests observed:", galleryImageRequests.length);
    await page.close();
  }
} finally {
  await browser.close();
}
