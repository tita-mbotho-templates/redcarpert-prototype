# Implementation 16 — Responsive footer parity with the existing header

**Scope:** Footer-only responsive refinement. Do not change the header, homepage fullpage/footer scroll handoff, navigation, catalogue, lookbook, page content, or GitHub Pages deployment guard.

## Approved visual requirement

Retain the existing **three-column desktop footer** across desktop (1440px), tablet (768px) and mobile (390px). Do not stack the three columns on mobile. The column proportions, ordering, branding, alignment and content remain those of the approved desktop footer. Scale spacing and icons to avoid horizontal overflow, but match footer logo dimensions and all footer typography sizes **exactly** to the header at the same viewport.

## Changes

- Replaced the below-640px single-column footer media rule with the original three-column 45/25/30 grid.
- Reused the header's logo sizing: 350×150 CSS pixels on desktop; the existing header responsive treatment of width:auto and max-height 40px at <=1000px. Maintains the same image and intrinsic proportions.
- Changed headings, body text, tagline and copyright font sizes to match the header's 12px navigation type at all three supported viewports. Preserves the desktop footer typography hierarchy by leaving weights and colours intact.
- Adjusted the footer's horizontal gutters, column padding and social icon sizes for tablet/mobile while preserving its existing placement and three-column structure.
- Kept all changes within `src/components/FooterBranding.css`. No captured theme CSS or header files are modified.

## Verification

Run `npm run check`, then use a production preview at port 4173 and run `node scripts/browser-footer-parity.mjs` (included in `npm run test:browser`).

At 1440px, 768px and 390px on both the catalogue and About Us pages, the browser test checks:

- Footer layout contains exactly three positive-width columns in the original horizontal order.
- Header and footer logos have matching rendered width and height (1.5px tolerance).
- Footer headings, links, tagline and copyright have the same computed font size as the relevant header navigation.
- No horizontal page overflow or browser JavaScript errors.

Review the live page visually before approving the PR. Browser test only certifies measurable dimensions; it does not replace real-device review.

**Deployment:** No merge or deploy in this implementation. The published MVP stays unchanged until approval.
