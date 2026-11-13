import { chromium } from "playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
try {
  for (const width of [1440, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.route("https://images.pexels.com/**", route => route.fulfill({
      status: 200, contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#eee0d2"/></svg>',
    }));

    await page.goto("http://localhost:4173/redcarpert-prototype/wedding-moments/",
      { waitUntil: "domcontentloaded" });
    assert.equal(await page.title(), "Wedding Moments | Redcarpert Wedding Dresses");
    assert.equal(await page.locator("h1").filter({ hasText: "Wedding Moments" }).count(), 1);
    const pageContent = page.locator('[data-editorial-route="/wedding-moments"]');
    assert.equal(await pageContent.locator(".redcarpert-moments-subtitle").textContent(),
      "The love, the laughter, the unforgettable moments.");
    assert.equal(await pageContent.locator("h2,h3,figcaption").count(), 0,
      "no event categories, descriptions or visible media captions");

    const gallery = page.locator("[data-wedding-moments-grid]");
    assert.equal(await gallery.count(), 1, "exactly one continuous gallery");
    const photos = gallery.locator("button[data-wedding-media=photo]");
    const films = gallery.locator("a[href^='https://www.pexels.com/video/']");
    const cards = gallery.locator("[data-wedding-moment-id]");
    assert.equal(await photos.count(), 12);
    assert.equal(await films.count(), 2);
    assert.equal(await cards.count(), 14);
    assert.equal(await page.locator("[data-wedding-load-more]").count(), 0,
      "a 14-item preview needs no Load More button");
    assert.equal(await page.locator("[data-brides-gallery],[data-bride-card]").count(), 0);

    const geometry = await page.evaluate(() => {
      const grid = document.querySelector("[data-wedding-moments-grid]");
      const photo = document.querySelector("[data-wedding-media=photo] img");
      const bounds = photo.getBoundingClientRect();
      return {
        cols: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        ratio: bounds.width / bounds.height,
        overflow: Math.max(document.documentElement.scrollWidth,
          document.body.scrollWidth) > innerWidth + 2,
      };
    });
    assert.equal(geometry.cols, width > 768 ? 4 : 2,
      "four columns on desktop and two on mobile");
    assert(Math.abs(geometry.ratio - 1) < .02, "all cards are square");
    assert.equal(geometry.overflow, false, "no horizontal overflow");

    await photos.first().click();
    const dialog = page.locator("#redcarpert-wedding-preview");
    assert(await dialog.evaluate(el => el.open), "photo lightbox opens");
    const image = dialog.locator("[data-wedding-preview-photo]");
    assert(await image.isVisible(), "photo opens uncropped");
    assert.equal(await image.evaluate(el => getComputedStyle(el).objectFit), "contain");
    await page.keyboard.press("Escape");
    assert.equal(await dialog.evaluate(el => el.open), false);
    assert.equal(await image.getAttribute("src"), null, "closed photo unloads");
    assert.deepEqual(errors, [], "no JavaScript errors at " + width + "px");
    console.log("Wedding Moments square gallery PASS", width + "px");
    await page.close();
  }
} finally {
  await browser.close();
}
