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
    const grids = page.locator("[data-wedding-moments-grid]");
    assert.equal(await grids.count(), 3, "three wedding-story themes");
    const photos = page.locator("button[data-wedding-media=photo]");
    const filmLinks = page.locator("a[href^='https://www.pexels.com/video/']");
    assert.equal(await photos.count(), 12, "twelve event-focused stock photographs");
    assert.equal(await filmLinks.count(), 2, "two linked stock wedding films");
    assert.equal(await page.locator("[data-brides-gallery],[data-bride-card]").count(), 0);
    const geometry = await page.evaluate(() => {
      const grid = document.querySelector("[data-wedding-moments-grid]");
      const photo = document.querySelector("[data-wedding-media=photo] img");
      const r = photo.getBoundingClientRect();
      return {
        cols: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        ratio: r.width / r.height,
        overflow: Math.max(document.documentElement.scrollWidth,document.body.scrollWidth) > innerWidth + 2,
      };
    });
    assert.equal(geometry.cols, width > 768 ? 4 : 2, "responsive gallery columns");
    assert(Math.abs(geometry.ratio - 1) < 0.02, "all cards have square photography");
    assert.equal(geometry.overflow, false, "no horizontal overflow");
    await photos.first().click();
    const dialog = page.locator("#redcarpert-wedding-preview");
    assert(await dialog.evaluate(el => el.open), "photo lightbox opens");
    const image = dialog.locator("[data-wedding-preview-photo]");
    assert(await image.isVisible(), "photo is displayed");
    assert.equal(await image.evaluate(el => getComputedStyle(el).objectFit), "contain");
    await page.keyboard.press("Escape");
    assert.equal(await dialog.evaluate(el => el.open), false, "Escape closes photo lightbox");
    assert.equal(await image.getAttribute("src"), null, "closed photos unload");
    assert.deepEqual(errors, [], "no page errors at " + width + "px");
    console.log("Wedding Moments PASS", width + "px");
    await page.close();
  }
} finally { await browser.close(); }
