# Implementation 24 — Centralized image links

The file **`src/data/image-links.json`** stores client-supplied image URLs by website page. Add or replace URLs there instead of scattering new links throughout application code.

## Current scope

| JSON key | Intended page / content | Current state |
| --- | --- | --- |
| `home_page.hero` | Homepage panels, in display order | **Live:** the three approved ImageKit photos |
| `products.mermaid` | Mermaid dress catalogue | Ready for future client uploads |
| `products.ball_gown` | Ball Gown dress catalogue | Ready for future client uploads |
| `our_brides` | Approved client photographs | Ready for future client uploads |
| `about_us.atelier` | Atelier/studio imagery | Ready for future client uploads |
| `about_us.team` | Team portraits | Ready for future client uploads |
| `contact_us` | Contact/studio imagery | Ready for future client uploads |
| `digital_lookbook` | Client-approved lookbook pages | Ready for future client uploads |

**Important:** Only `home_page.hero` is wired to the website in this implementation. All other arrays intentionally start empty, while the existing website continues showing its current illustrative samples. In a later page-specific implementation, we will connect each approved collection to the respective page and update any stock-image captions and photo credits. Adding a URL to a future array is **staging**, not an automatic publication.

## How to add photos

1. Upload images to ImageKit under separate page folders, following the client's established handoff: `home-page/`, `products/mermaid/`, `products/ball-gown/`, `our-brides/`, `about-us/`, `contact-us/`, and `digital-lookbook/`.
2. Copy each complete HTTPS ImageKit URL, including any `?updatedAt=...` query if supplied.
3. Edit **`src/data/image-links.json`** on your implementation branch.
4. Add a descriptive, stable `id` for each entry and a useful `alt` description for photographs rendered as `<img>`. For dress products, use `images` to group their photographs. Do not use example URLs in the production JSON.
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

A dress with multiple views in the Mermaid category:

```json
{
  "id": "mermaid-001",
  "name": "Client-approved dress name",
  "images": [
    "https://YOUR-IMAGEKIT-HOST/products/mermaid/mermaid-001-front.webp",
    "https://YOUR-IMAGEKIT-HOST/products/mermaid/mermaid-001-back.webp"
  ]
}
```

## Homepage rules that must not regress

The `src/lib/homepage-backgrounds.ts` adapter reads the three `home_page.hero` URLs directly from JSON. The generator uses that same adapter to preload the first image. The website continues to show the same original photos; desktop/tablet display a 60% sharp central panel with 32px blurred sides, and mobile shows an unblurred, edge-to-edge photograph. Do not change their order or IDs casually.

No new image downloads, styling changes, category changes, new pages, deployments, or stock-image replacements are included in Implementation 24.
