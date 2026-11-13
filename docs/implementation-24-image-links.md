# Implementation 24 — Centralized Image Links

The single photo/video URL manifest is `src/data/image-links.json`.

| JSON path | Purpose |
| --- | --- |
| `home_page.hero` | Three approved ImageKit homepage photos |
| `products.mermaid` | Four Pexels demo dresses |
| `products.ball_gown` | Four Pexels demo dresses |
| `wedding_moments.showcase` | Stock wedding-scenes preview: couples, loved ones, celebrations and linked Pexels films |
| `wedding_moments.events` | Client-approved wedding events (photo and direct video links grouped by event) |
| `about_us.team` | Three illustrative Pexels team photos |
| `about_us.atelier` | Future studio photographs |
| `contact_us` | Future contact/studio photographs |
| `digital_lookbook` | Future lookbook media |

The Wedding Moments page is at `/wedding-moments/`. The obsolete bridal-only gallery and its data have been retired. The current preview is **stock** photography and linked example videos, not real client weddings, gowns, couples or events.

## Upload workflow

1. Request approved media grouped by page and, for Wedding Moments, **by event**. Suggested ImageKit folders: `home-page/`, `products/mermaid/`, `products/ball-gown/`, `wedding-moments/<event-id>/`, `about-us/`, `contact-us/`, `digital-lookbook/`.
2. Copy complete HTTPS ImageKit image/video URLs into `src/data/image-links.json`. Maintain unique stable IDs.
3. For Wedding Moments, place real images and native MP4/WebM videos under `wedding_moments.events`; photos need an `alt`, videos need `caption`. A `poster` image URL is required for every video to keep image-only cards consistent.
4. Client media should be added **only after confirmation that all needed publication permissions have been obtained**, particularly for identifiable guests or children. Never publish private links.
5. Run `npm run check`, then preview at desktop and mobile with `npm run dev`. No automatic GitHub Actions or deployment.

See [Implementation 25](implementation-25-wedding-moments.md) for full event examples and the photo/video interaction model. Historical image credits for the catalogue remain in [asset credits](asset-credits.md).

The three homepage URLs and their responsive presentation remain unchanged. Catalogue and team images are also unchanged. All new wedding-scenes images and stock-video preview links are in the JSON manifest; they are not downloaded during the build.
