# Implementation 15 — Final MVP readiness and launch checklist

**Branch:** `implementation/15-release-readiness`  
**Starting baseline:** approved Implementation 14 merge `287ad1a`  
**Scope:** production-readiness verification and release handoff only; **no redesign or publication**.

## Current prototype

- **Vite static site** designed for GitHub Pages at `/redcarpert-prototype/`, no backend or checkout.
- **16 routes**: homepage, Wedding Dresses, Mermaid and Ball Gown categories, eight sample detail previews, About Us, Contact Us, Our Brides and Digital Lookbook.
- **Wedding Dresses:** eight remote Pexels demonstration photographs, square card thumbnails, category filter.
- **Our Brides:** 18 remote sample photographs in fixed order with six complementary shade cards randomized between five curated patterns; square cards and full-photo preview.
- **Digital Lookbook:** ten-page online reader with a PDF containing the original two sample pictures.
- **Fitting enquiry:** live WhatsApp destination **+27 68 045 8811** (South Africa; `https://wa.me/27680458811`). Each existing sample-dress preview has its own prefilled fitting enquiry. The review dialog requires a deliberate **Continue to WhatsApp** action; the visitor must still press Send in WhatsApp. No backend, checkout, prices, sizes or verified inventory.

## Automated release checks

- Source tests, ESLint, TypeScript, Vite production build and static artifact integrity.
- All public pages have Redcarpert-branded page titles/descriptions, not inherited Bridal Vanesa catalogue titles.
- The only approved external enquiry destination is `https://wa.me/27680458811?text=...` with the full, URL-encoded, route-specific message; no other outbound links or captured WhatsApp numbers are allowed.
- No captured reference-site image, script or stylesheet `src`/`href` points to the reference site's host.
- GitHub Pages deploy action is guarded by a manual `workflow_dispatch` with `approve_deployment` defaulting to `false`.
- Browser regressions cover the catalogue, filters, pages, 1440/768/390 viewports, mobile simulation, ten-page lookbook and preview interactions.

**A successful build is necessary but not sufficient for public launch.**

## Manual gates not yet confirmed

- [ ] Client approves whether the sample-content prototype may be published or whether real photographs and text must be supplied first.
- [x] Client supplied a live WhatsApp contact, local number `0680458811`, formatted as `+27 68 045 8811` for display and `27680458811` for wa.me. Real prefilled chats open only after the visitor reviews the message and selects Continue to WhatsApp. Confirm registration and delivery with an actual device before publication.\n- [ ] Confirm any studio address, opening hours and fitting policies the client wants shown. Do not invent details.
- [x] User reports obtaining permission for the retained **reference-derived design/theme assets** on 1 November 2026. This is an owner attestation; the written permission or licence scope has not been independently inspected. Keep the permission documentation with the business records and check it covers all third-party assets intended for public publication.
- [ ] Verify external Pexels URL availability, appropriateness and usage terms in a connected browser. Browser regressions may stub remote images.
- [ ] Test on a real iOS Safari device and Firefox, particularly gallery previews, mobile menu, scroll handoff and page turns. Existing Playwright coverage uses Chromium.
- [ ] Obtain final client and developer visual signoff at 1440px, 768px and 390px.
- [ ] Obtain explicit approval to deploy GitHub Pages.
- [ ] Smoke-test the live public URL and all 16 routes after approved deployment.

## Controlled release steps

1. Review the Implementation 15 draft PR and green CI at its **exact final head commit**.
2. Once approved, squash-merge the PR into `main`.
3. Check the `Deploy static Pages site` workflow **build** job on `main`. A push only builds/uploads an artifact, **not** the website deployment.
4. After client readiness and explicit publishing approval, manually run the workflow on **main** with `approve_deployment=true`. Never modify the guard to deploy automatically.
5. Confirm the actual published Pages URL, page titles, image loading, catalogue categories, gallery modal, mobile navigation, sample enquiry, lookbook and PDF.

**Release state:** owner-confirmed permission and live WhatsApp destination supplied; readiness code remains a candidate for final review and real-device verification. **Do not deploy until explicit publishing authorization and remaining manual gates are settled.**
