# Implementation 13 — Interactive Digital Lookbook and expanded sample catalogue

**Branch:** `implementation/13-interactive-lookbook`  
**Base:** Implementation 12 main (`c7c125a`). No merge or public deployment.

## Approved design and scope

- A professionally designed **10-page editorial book**: logo-bearing front cover, four Mermaid sample pages, four Ball Gown sample pages and branded back cover.
- 8 demonstration products in the Wedding Dresses grid, split 4/4 across existing approved categories, with individually generated sample-detail routes.
- Direct HTTPS Pexels CDN URLs for **all eight catalogue, book and detail photographs**, from a single catalogue dataset. No new external photographs are downloaded, processed or committed.
- The existing approved Redcarpert PNG logo appears on both covers.
- The **existing local, two-page downloadable sample PDF is unchanged**; it is not the ten-page online book.
- No checkout, prices, inventory assertions, WhatsApp recipient or backend.

## Interaction and dependencies

The book uses a version-pinned **StPageFlip 2.0.7** script from jsDelivr at runtime for page-curl animation. This is separate from Pexels photograph hosting. There is no new npm dependency. A native keyboard, click and touch-swipe fallback works when CDN fails or reduced motion is enabled. Both cover and individual pages remain available if images fail, with photo-unavailable feedback.

New remote-image availability depends on visitor connectivity, Pexels CDN policy and permissions. The baseline browser regression checks fail on broken **local** resources, but remote image reachability is not considered a local build regression. The fallback browser test deliberately disables external resources to verify keyboard/click/swipe navigation. The enhanced browser regression loads the actual StPageFlip library from the pinned CDN, moves through every spread and back cover at 1440/768/390, checks keyboard arrows and mobile swipe, and fails if the library is unavailable.

## Guardrails

Homepage, header, footer, carousel, scroll handoff, Enquiry preview, PDF output and their source styles remain protected. Catalogue validation now enforces eight unique credited images, strictly approved Pexels CDN URL patterns, eight preview routes, four examples per category and explicit sample disclosures.

## Review

Check CI, category grids (4 each), detail links, zoom, book covers and typography, page turns at 1440/768/390, mobile swipe, keyboard controls, the existing PDF, and the logo's visual treatment. Confirm online photos load in a browser with network access. Do not merge until user visual approval and independent review.
