# Implementation 26 — Floating dress details and centralized ZAR prices

## Approved dress detail design

The **right-hand side of each wedding dress detail page** now has a separate warm-white floating card with a subtle border and soft elevation. It is a **permanently visible information card, not a popup dialog**.

The card has precisely four content elements:

1. The collection name, once (for example, `MERMAID COLLECTION`)
2. The dress name in a refined, prominent serif heading
3. A separate price label and value
4. A **horizontally centred Book a Fitting** button, with a small WhatsApp helper note

No dress description, repeated category row, cart, checkout, stock, quantity controls or duplicate actions are included. A discreet **sample imagery** notice remains below and outside the card because the existing catalogue photographs are still Pexels demonstration images. The approved image gallery, zoom action and WhatsApp preview/send controls stay in place. On mobile, the information card stacks below the photograph.

## Prices: one JSON source

Edit **`src/data/products.json`** only when the client has supplied the price for the correct dress.

```json
{
  "currency": "ZAR",
  "dresses": [
    { "id": "sample-mermaid", "priceZar": null }
  ]
}
```

The example is a *fragment*, not the full file. Keep all eight existing IDs. Replace `null` with a confirmed **whole-number rand amount** such as `12500` — not `"R12,500"`, a decimal, or a string. The rendered price will be formatted automatically as `R 12 500`. Unassigned prices display **Price to be confirmed** in the detail view, online lookbook and downloadable PDF. An unassigned price is not represented as R 0, free, or a discount.

**Important:** The current eight products remain sample images, not authenticated Redcarpert inventory. Before publishing selling prices, the client should provide the correct product-to-image mapping and confirm that the prices apply to those dresses. Do not assign commercial prices to unrelated Pexels gowns based only on appearance.

### Where a confirmed price appears

- **Dress detail:** In the approved floating card
- **Wedding Dresses listing:** As a compact price under a sample card once a real amount is present; unpriced sample cards retain the established sample-imagery note
- **Online Digital Lookbook:** Price on each of eight dress pages, rendered into the static book
- **Downloadable PDF:** Price on each of the two existing sample pages

All four use the same `catalogueProducts[].priceZar` value populated from `products.json`. The PDF intentionally remains the existing two-page sample booklet; expanding it to eight pages is a separate design/scope decision.

## Local review workflow

1. In Codespaces, switch to `implementation/26-dress-detail-card-and-pricing` and pull.
2. Run `npm run check` locally. This checks the generated pages and PDF data, without running GitHub Actions.
3. Run `npm run dev` and inspect the right-hand card at desktop, tablet and phone widths.
4. Verify `/product/preview/sample-01-mermaid/` and `/digital-lookbook/`, then the downloadable sample PDF.
5. Do not merge or deploy until the card layout is approved and prices are confirmed.

The implementation adds **no GitHub Actions workflow** and does not trigger any CI or deployment run.
