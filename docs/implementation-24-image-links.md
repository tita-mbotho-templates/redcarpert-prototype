# Implementation 24 — Centralized Image Links

The single photo/video URL manifest is `src/data/image-links.json`.

| JSON path | Purpose |
| --- | --- |
| `home_page.hero` | Three approved ImageKit homepage photos |
| `products.mermaid` | Four Pexels demo dresses |
| `products.ball_gown` | Four Pexels demo dresses |
| `wedding_moments.events` | Real client gallery: 86 photos and one ImageKit MP4, stored in one initial upload batch; future events can be added |
| `about_us.team` | Three illustrative Pexels team photos |
| `about_us.atelier` | Future studio photographs |
| `contact_us` | Future contact/studio photographs |
| `digital_lookbook` | Future lookbook media |

The Wedding Moments page is at `/wedding-moments/`. The bridal-only gallery and Pexels stock preview have been retired. Its current media list contains **87 real client items** from the URLs provided by the business, without inventing any event names or dates.

## Upload workflow

1. Request approved media grouped by page and, for Wedding Moments, **by event**. Suggested ImageKit folders: `home-page/`, `products/mermaid/`, `products/ball-gown/`, `wedding-moments/<event-id>/`, `about-us/`, `contact-us/`, `digital-lookbook/`.
2. Copy complete HTTPS ImageKit image/video URLs into `src/data/image-links.json`. Maintain unique stable IDs.
3. For Wedding Moments, place real images and native MP4/WebM videos under `wedding_moments.events`; photos need an `alt`, videos need `caption`. A `poster` image URL is required for every video to keep image-only cards consistent.
4. Before publication, confirm the business has appropriate permission to show identifiable couples, guests and any children. Being provided image URLs does not itself verify the necessary consents. Never publish private links.
5. Run `npm run check`, then preview at desktop and mobile with `npm run dev`. No automatic GitHub Actions or deployment.

See [Implementation 25](implementation-25-wedding-moments.md) for full event examples and the photo/video interaction model. Historical image credits for the catalogue remain in [asset credits](asset-credits.md).

The three homepage URLs and their responsive presentation remain unchanged. Catalogue and team images are also unchanged. All new wedding-scenes images and stock-video preview links are in the JSON manifest; they are not downloaded during the build.
