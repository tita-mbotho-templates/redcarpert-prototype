# Implementation 14: Catalogue filtering and Our Brides gallery

Branch: implementation/14-catalogue-filter-brides-gallery. Implementation 13 main baseline. No merge or deployment before visual approval.

## Approved changes
- On /product/, three working category filters: All Dresses / Mermaid / Ball Gown, preserving sample counts, category routes, and four-column responsive card widths; all catalogue photographs are now square (1:1).
- On /our-brides/, 18 independent, credited Pexels sample photographs displayed as the same square (1:1) photograph ratio as the catalogue, plus six complementary shade tiles in one of five predesigned layouts.
- Four cards per desktop row, responsive two columns on tablet/mobile. Only the six shade positions randomize between five patterns on each visit; the 18 photograph positions retain their original sequence, including after refresh. sessionStorage prevents immediately repeating the pattern in the same tab. Stable during browsing.
- Centered constrained image-card preview in native modal dialog, blurred and darkened backdrop, Escape, close button and outside click.
- Source assets strictly remote; no downloaded photos and no claims about real Redcarpert clients.

## Pexels photo credits
All photos are illustrative, not confirmed Redcarpert customers. Pexels imagery is loaded remotely and never stored in the repository.

| Image | Photographer | Source |
| --- | --- | --- |
| 01 | Leeloo The First | https://www.pexels.com/photo/woman-in-white-floral-lace-wedding-dress-4545094/ |
| 02 | Bárbara Marques | https://www.pexels.com/photo/portrait-of-bride-in-white-dress-and-veil-10587269/ |
| 03 | Alexander Mass | https://www.pexels.com/photo/elegant-bride-in-outdoor-wedding-ceremony-33435175/ |
| 04 | Alexander Mass | https://www.pexels.com/photo/elegant-bridal-portrait-with-lace-veil-39903996/ |
| 05 | Bárbara Marques | https://www.pexels.com/photo/wedding-photo-of-bride-in-white-dress-and-long-veil-10587270/ |
| 06 | Danielle Reese | https://www.pexels.com/photo/woman-in-wedding-dress-2495648/ |
| 07 | ArtHouse Studio | https://www.pexels.com/photo/portrait-of-bride-wearing-veil-and-wedding-dress-4645961/ |
| 08 | Dina Ashraf | https://www.pexels.com/photo/portrait-of-a-bride-in-a-white-embroidered-wedding-dress-and-a-chiffon-veil-19751829/ |
| 09 | Nataliya Vaitkevich | https://www.pexels.com/photo/woman-in-white-floral-dress-4456481/ |
| 10 | HONG SON | https://www.pexels.com/photo/a-beautiful-bride-wearing-white-gown-and-veil-5646476/ |
| 11 | Alexander Mass | https://www.pexels.com/photo/elegant-bride-in-white-wedding-veil-portrait-34328152/ |
| 12 | Alexander Mass | https://www.pexels.com/photo/smiling-bride-in-elegant-white-wedding-dress-39903999/ |
| 13 | Joy Marino | https://www.pexels.com/photo/woman-wearing-wedding-dress-and-veil-3031777/ |
| 14 | cottonbro studio | https://www.pexels.com/photo/wedding-fashion-model-in-white-clothing-covered-with-tulle-fabric-7289121/ |
| 15 | Leeloo The First | https://www.pexels.com/photo/woman-in-white-dress-wearing-straw-hat-and-veil-holding-flowers-5038574/ |
| 16 | Danik Prihodko | https://www.pexels.com/photo/bride-in-wedding-dress-and-hat-15865463/ |
| 17 | Uday Ahir | https://www.pexels.com/photo/bride-in-wedding-dress-under-serene-tree-39980506/ |
| 18 | Alexander Mass | https://www.pexels.com/photo/elegant-outdoor-wedding-bride-with-bouquet-39837863/ |

## Refinements after the first gallery review
- Our Brides now uses the same full-width content-container shell and four-column content box as Wedding Dresses. Removes the unused inherited empty right sidebar without changing the shared header or footer.
- Photographs keep their original fixed order; only six shade tiles move among five curated compositions.
- The image preview is a wider bridal editorial card with adjacent typography and photo on desktop, stacked on mobile, constrained within the viewport, preserving the blurred backdrop and Escape/close behavior.

### Exact catalogue geometry
The original page had a 4% inset on each side of its generic content box. The catalogue removes that inset. The Our Brides shell now does the same using a page-specific class, alongside the same 20.1% desktop / 45.7% mobile image widths and matching gutter percentages (using 1cqw per tile side). Chromium checks compare the actual rendered widths at 1440, 768 and 390px.

### Final square-card refinement
Wedding Dresses (including the Mermaid and Ball Gown category listing pages) and Our Brides use square 1:1 photo frames with the same card widths at 1440px, 768px and 390px. All shade-card artwork is also square. Images crop with `object-fit: cover`, never stretch; photo captions remain below their frames. The expanded Our Brides modal stays a wide editorial preview, and product-detail zoom frames stay portrait. The existing five curated shade arrangements and fixed 18-photo sequence are unchanged.

### Final screenshot-based gallery refinement
- Make the visible gallery tiles identical in square image dimensions and edge treatment to the catalogue, eliminating inherited button rounding and padding. The photo caption remains outside the square surface.
- Keep the 18 images in order while randomized shade cards shift positions.
- Centre the bridal introduction (heading and description) and the closing sample-photo disclaimer.
- The expanded photo preview is image-only (plus accessible close button). Show the complete, uncropped remote image at its native aspect ratio, constrained within the viewport; backdrop blur and Escape/outside-click dismissal remain.
