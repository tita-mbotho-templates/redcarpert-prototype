# Implementation 12 — Reliability, maintainability, reuse and scalability

**Date:** 30 October 2026  
**Branch:** `implementation/12-engineering-hardening`  
**Baseline:** approved Implementation 11 `cd5b00215c2272785f31574c3fe39361bdb79957`  
**Scope:** code and test hardening, not a redesign or deployment.

## Changes delivered

### Maintainability
- Split the former one-file `scripts/generate.ts` into a small orchestrator and `scripts/lib/{prepare-page,markup,assets}.ts`. The page adapter order, HTML serialization, local asset resolution and approved PDF generator are unchanged.
- Centralized the GitHub Pages base at `src/config/site.ts` for Vite, page generation, local path conversion and preview redirects.
- Extracted native `src/client/{enquiry-preview,lookbook-reader}.js` from the browser entry point. Both retain the exact existing non-sending enquiry and two-page reader behaviour. The flippable lookbook is **not** implemented here (reserved for Implementation 13).
- Made the GitHub Actions validation workflow reusable for implementation branches and pull requests. It does **not** deploy. The separate `pages.yml` retains its explicit manual deployment approval.

### Reliability
- Added testable HTML-renderer invariants covering escaping, script stripping, inert WhatsApp links, unchanged input nodes and repository-relative URLs.
- Added `scripts/lib/request-url.ts` to reject malformed escape sequences and traversal attempts before Vite preview filesystem checks. Normal routes and base paths are unchanged.
- Added `src/lib/validate-catalogue.ts` and tests rejecting duplicate IDs/routes, unapproved category/status, external/invalid images and missing sample content. Checks run **before clearing generated output**.
- Added `scripts/compare-page-html.mjs` comparing all eleven generated HTML documents and the PDF against a clean Implementation 11 build, allowing only the hashed JS bundle filename to differ.
- Retained existing static build, 10-page route, desktop/tablet/mobile interaction and mobile-touch browser regression tests.

### Reuse and scalability
- Shared renderer, path and asset helpers are callable from tests and future build features.
- Catalogue integrity checks stop accidental duplicate or unapproved preview publication. The **current product-preview generator intentionally supports only two approved sample dresses**; adding verified client inventory needs an explicit model/content change rather than quietly inventing routes or products.
- No npm runtime dependencies or production backend added. The static GitHub Pages design is preserved.

## Required verification

The `Verify static Redcarpert site (no deployment)` workflow runs `npm ci`, source tests, ESLint, TypeScript typecheck, Vite build, static artifact assertions and Playwright Chromium route/interaction/touch checks. For the Implementation 12 branch it also builds the fixed Implementation 11 baseline and asserts **exact** page HTML and PDF parity (normalizing only the changing Vite JS bundle hash).

**Review the latest green CI run for the actual final commit; do not assume a pending run has passed.** Also inspect the homepage at 1440×900, 768×900 and 390×900 with special attention to the Image 1 → Image 2 → Image 3 → Footer scroll handoff, upward Image 3 return, logo/Home reset and mobile menu.

## Not in scope / remaining risks

- The retained eight source page trees still originate in captured template markup and rely on local WordPress-derived PEXETO/jQuery/fullpage/gallery/CSS assets. Replacing them wholesale is deliberately **not** part of this guarded hardening: the approved visual geometry and behavior must not be sacrificed for superficial framework purity.
- The reader remains a simple two-image lookbook until Implementation 13, where an accessible responsive page-turn viewer will be designed.
- Stock imagery is not confirmed client inventory; contact details and WhatsApp Business recipient remain unconfirmed. The fitting enquiry remains non-sending.
- Real phone Safari/Firefox testing, third-party licence audit, and final domain/Pages release readiness remain separate production gates.
- No merge or public Pages deployment is included.

**Approval:** User reviews locally after final CI success and independent Codex audit, then PR may be squash-merged.
