# Redcarpert Wedding Dresses

A static bridal catalogue prototype built with **Vite, HTML, CSS and vanilla JavaScript**. The site presents Mermaid and Ball Gown sample collections, informational pages, fitting-enquiry previews and a downloadable two-page sample lookbook. All photographs are illustrative; they are not confirmed inventory.

## Local development

Requires Node.js 24 (Node >=22.12 is supported by dependencies).

```sh
npm ci
npm run dev
```

Open `http://localhost:5173/redcarpert-prototype/`. Editing document data or adapters requires restarting the dev server to regenerate static HTML.

## Validate and preview

```sh
npm run check
npm run preview -- --host 0.0.0.0 --port 4173
```

Run `npm run setup` to install Chromium, then `npm run test:browser` against the running preview. The production site is generated in `dist/` with standalone pages at the configured GitHub Pages base `/redcarpert-prototype/`.

## Hosting and safety

The repository GitHub Pages workflow validates pushes to `main`, but **does not deploy automatically**. Deployment requires an explicitly approved manual workflow dispatch on `main`; configure environment protection separately. The Implementation 11 verification workflow checks its implementation branch only and never deploys.

The fitting-enquiry interaction now opens a **live WhatsApp chat at +27 68 045 8811** only after a visitor reviews the prefilled message and selects Continue to WhatsApp; no message is sent automatically. Sample-detail messages name their selected demonstration dress. No booking backend, payments, confirmed inventory, studio address or opening hours have been configured. The owner reports having obtained permission to use the retained reference-derived design/theme assets; independent licensing documentation has not been inspected.

## Project layout

- `src/data/`: minimal presentation shells, catalogue samples and site metadata
- `src/lib/`: guarded content adapters, page generation helpers and PDF writer
- `src/client/`: native browser interactions, menu, scrolling and lookbook controls
- `src/components/` and `src/styles/`: styles required for the approved design
- `scripts/generate.ts`: renders all approved static routes and collects local assets
- `public/`: only production-relevant visuals, fonts, scripts and theme dependencies
- `tests/`: source, build and browser regression checks

Third-party theme effects remain temporarily to preserve the approved interactions. Implementation 12 refactored the supporting code without replacing these dependencies. Theme replacement remains deferred until separately approved and regression-tested. The modern page-turn lookbook is Implementation 13. Implementation 14 adds the All Dresses / Mermaid / Ball Gown catalogue filter and a five-pattern randomized Our Brides gallery with 18 Pexels photographs and blurred-backdrop image previews. See [the gallery specification](docs/implementation-14-gallery-filter.md). See [asset credits](docs/asset-credits.md).

## Engineering notes

The static generator is organized as `scripts/generate.ts` (entry point), `scripts/lib/prepare-page.ts` (approved content/adapters), `scripts/lib/markup.ts` (safe HTML serialization), and `scripts/lib/assets.ts` (local dependency collection and copying). The single repository subpath configuration is `src/config/site.ts`. Browser features have independent enquiry and lookbook-reader modules under `src/client/`. Keep the existing fullpage and gallery theme dependencies until their behaviour can be replaced and independently regression-tested.

The `Verify static Redcarpert site` GitHub Actions workflow validates implementation branches and pull requests without deployment. Implementation 12 also checks generated HTML and PDF against the approved Implementation 11 baseline. See [the engineering hardening review](docs/implementation-12-hardening.md).


## Final MVP launch checklist

Implementation 15 prepares this static prototype for a controlled GitHub Pages launch without publishing it. See [final release readiness and outstanding approvals](docs/implementation-15-release-readiness.md). CI now verifies Redcarpert browser-tab metadata on all routes, guards against inherited third-party outbound links, and ensures the approved, prefilled live WhatsApp destination is the only allowed messaging target and deployment remains explicitly manual. A green CI result does not constitute separate public deployment approval, independent verification of rights, or real-device Safari/Firefox signoff.
