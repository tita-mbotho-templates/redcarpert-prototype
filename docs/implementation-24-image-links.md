# Implementation 24 — Centralized image links

The file **`src/data/image-links.json`** stores all live photo URLs by page: 3 approved ImageKit homepage images and 29 current Pexels stock images (8 catalogue, 18 Our Brides, 3 About Us). Their 26 existing Pexels source/attribution URLs are stored beside the matching pictures. Keep stable IDs so each page loads the correct image.

## Current scope

| JSON key | Intended page / content | Current state |
| --- | --- | --- |
| `home_page.hero` | Homepage panels, in display order | **Live:** the three approved ImageKit photos |
| `products.mermaid` | Mermaid catalogue | **Live:** 4 Pexels sample photos |
| `products.ball_gown` | Ball Gown catalogue | **Live:** 4 Pexels sample photos |
| `our_brides` | Bridal inspiration gallery | **Live:** 18 Pexels sample photos (not real clients) |
| `about_us.atelier` | Atelier/studio imagery | Ready for future client uploads |
| `about_us.team` | About Us illustrations | **Live:** 3 Pexels sample photos (not staff portraits) |
| `contact_us` | Contact/studio imagery | Ready for future client uploads |
| `digital_lookbook` | Client-approved lookbook pages | Ready for future client uploads |

**Important:** `home_page.hero`, `products.mermaid`, `products.ball_gown`, `our_brides`, and `about_us.team` are now **live** and read their URLs from the manifest. These Pexels photos remain stock placeholders, not verified Redcarpert inventory, clients or staff. The interactive lookbook reuses the eight catalogue images, so their URLs are not duplicated.

Do **not** casually replace an active Pexels URL with a real client photo. The relevant page implementation must also update sample-only text, image alt text, credits, approval status, and the intentionally strict catalogue validation. The still-empty `about_us.atelier`, `contact_us` and `digital_lookbook` slots remain **staging only** until connected to the page.

## How to add photos

1. Upload images to ImageKit under separate page folders, following the client's established handoff: `home-page/`, `products/mermaid/`, `products/ball-gown/`, `our-brides/`, `about-us/`, `contact-us/`, and `digital-lookbook/`.
2. Copy each complete HTTPS ImageKit URL, including any `?updatedAt=...` query if supplied.
3. Edit **`src/data/image-links.json`** on your implementation branch.
4. Keep the `id` unchanged for active images; new staged photos need a unique `id` and a complete HTTPS `url`. Live Pexels product and Our Brides entries also have `sourceUrl` for attribution. Multiple views may be staged for a later implementation; the current site renders one `url` per product. Do not add example URLs to the production JSON.
5. Maintain valid JSON: double quotes around strings and keys, commas between entries, and **no trailing commas**.
6. Restart `npm run dev` after edits (the generator runs at startup) and run `npm run check` before opening your pull request. Browser review and approval come before merging or deploying.

### Entry examples (documentation only — do not paste the sample URLs)

An Our Brides photo:

```json
{
  "id": "bride-001",
  "url": "https://YOUR-IMAGEKIT-HOST/our-brides/bride-001.webp",
  "alt": "Bride wearing a Redcarpert ball gown at her fitting"
}
```

A future dress with multiple views (additional views require a later page-specific implementation):

```json
{
  "id": "mermaid-001",
  "name": "Client-approved dress name",
  "url": "https://YOUR-IMAGEKIT-HOST/products/mermaid/mermaid-001-front.webp",
  "images": [
    "https://YOUR-IMAGEKIT-HOST/products/mermaid/mermaid-001-front.webp",
    "https://YOUR-IMAGEKIT-HOST/products/mermaid/mermaid-001-back.webp"
  ]
}
```

## Homepage rules that must not regress

The `src/lib/homepage-backgrounds.ts` adapter reads the three `home_page.hero` URLs directly from JSON. The generator uses that same adapter to preload the first image. The website continues to show the same original photos; desktop/tablet display a 60% sharp central panel with 32px blurred sides, and mobile shows an unblurred, edge-to-edge photograph. Do not change their order or IDs casually.

Historical Pexels source citations in `docs/asset-credits.md` and `docs/implementation-14-gallery-filter.md` remain in place as an audit trail; the **live application** now loads Pexels image and credit URLs from JSON only. Tests still use domain patterns to check remote-image safety.

No new image downloads, styling changes, category changes, new pages, deployments, or stock-image replacements are included in Implementation 24.
