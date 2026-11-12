# Implementation 11 — Redcarpert repository cleanup

Date: 30 October 2026. Branch: `implementation/11-redcarpert-repository-cleanup`. Baseline: Implementation 10 merge `3fefa760aa67d834bb881cf11c2f521f25b4d3ac`.

## Objective and boundaries

Prune legacy Bridal Vanesa/AI Site Cloner material while retaining the **approved Vite static output, typography, navigation, fullpage/footer transitions, catalogue, gallery, non-sending enquiry preview and sample lookbook/PDF**. This is a dependency-safe cleanup, **not** a native-component rewrite, redesign, live deployment or history rewrite. The production GitHub Pages deployment remains manually gated.

## Repository reductions

| Area | Implementation 10 baseline | Implementation 11 | Removed |
|---|---:|---:|---:|
| `src/data/site.ts` presentation documents | 143 | 8 | 135 |
| `src/data/site.ts` UTF-8 source bytes | 11,039,018 | 933,875 | 10,105,143 (~91.5%) |
| `public/` tracked files | 4,781 | 140 | 4,641 |
| `public/` tracked bytes | 1,375,182,430 | 13,594,409 | 1,361,588,021 (~99.0%) |
| Historical `codex-reports/` documents | 22 | 0 | 22 |

Retained document trees: `/`, `/product`, `/product-category/mermaid`, `/product-category/ball_gown`, `/about-us`, `/contact-us`, `/our-brides`, and a **private** `/product/arabella` sample-detail donor. Only approved public routes are emitted. The private donor is **not** a published page.

The retained 140 assets are the local dependencies found in the previously passing Implementation 10 GitHub Actions production manifest, plus the three original homepage comparison images still used by source tests. They include the approved Redcarpert photos, logo, SEO icons, styles, fonts and effect scripts. `scripts/generate.ts` continues to copy only required resources to `dist/`; it does not publish all retained public assets.

Removed `public/images`, `public/gallery-data`, `public/videos`, unused hashed media/script files, legacy app/favicon, empty placeholder directories, the obsolete `src/app` stylesheet path and old reports. `src/app/globals.css` was moved unchanged to `src/styles/globals.css`, and the generator was updated accordingly.

## Identity and documentation

- Replaced inherited `Mahanaicoach/ai-site-cloner` repository/author/issue/homepage metadata with the actual Redcarpert repository. Removed the inherited root-level `MIT` software licence declaration without assigning a new licence (third-party notices still need preservation).
- Synchronized the npm lockfile root metadata and pruned stale Next.js ignore paths.
- Added Redcarpert `README.md`, `docs/asset-credits.md` with the two sample photographers and linked Pexels sources.
- Kept route guards and most source tests; adapted tests that assumed 143 legacy captures, rather than removing those meaningful behavioural protections.
- Added `tests/repository-cleanup.test.mjs` to catch reintroduction of the captured archive, incorrect package identity, and removal of essential artwork.
- Added a **branch-only, no-deploy** GitHub Actions workflow to validate and audit Implementation 11; the existing `main` Pages workflow remains untouched.

## Build and browser validation

GitHub Actions `implementation-11-verify.yml` runs `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:dist`, asset manifest inspection, Chromium installation and `npm run test:browser` against a local Vite preview. These checks provide executable evidence rather than relying exclusively on a narrative report. **Inspect the latest green Actions run for this branch before approval; this document does not assert a pending run passed.**

Run the additional human visual checks at 1440×900, 768×900 and 390×900 before merging, especially the homepage's fullscreen three-image sequence, bounded footer handoff, upward return, Home/logo reset and mobile navigation. No independent controlled pixel-diff comparison was generated in this remote cleanup; the captured DOM adapters and required theme assets have been retained unchanged and must still be visually checked.

## Retained legacy dependencies and follow-up

- The eight page shells in `src/data/site.ts` are still extracted WordPress presentation markup (~934 KB), guarded by the existing adapters. They are not eight fully handwritten native Redcarpert templates. Replacing them, and the remaining legacy CSS/JavaScript effects, without affecting approved pixel geometry is a separate **Implementation 12** engineering task.
- Some original captured script and style files remain **necessary** to preserve validated theme interactions, including PEXETO/fullpage, jQuery and gallery effects; third-party licence notices must not be removed indiscriminately.
- The three original homepage image fixtures remain in `public/site-assets` only because regression tests inspect their metadata. They do not need to be published.
- Git history still contains the former 1.3 GB asset blobs. A normal Git deletion does **not** shrink historical clone/checkout transfer size. History rewriting or a fresh-history repository would require explicit, separate approval; this implementation does not rewrite Git history.
- No genuine client dress inventory, real WhatsApp recipient, bookings, payment processing or confirmed contact address has been enabled.
- **Implementation 13** is the planned modern, responsive, flippable Digital Lookbook; do not confuse this cleanup with that design enhancement.

## Approval

Only the implementation branch is changed. Do not squash-merge, deploy or claim full clone independence without review. Use the GitHub Actions run and a locally pulled Codespaces branch to test before approval.
