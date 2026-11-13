# Implementation 25 — Wedding Moments

The former **Our Brides** page is now presented as **Wedding Moments**. It is designed for event photos and films featuring couples, family, guests, ceremonies and celebrations. The existing URL `/our-brides/` remains in place for backwards compatibility; page title, navigation and browser metadata use the new name.

## Media workflow

The single source of image and video URLs is `src/data/image-links.json`, under `wedding_moments.events`. Photos from a particular celebration belong together in one event, alongside their videos.

**Publish only media for which the business has permission from the relevant couple and identifiable guests, including permission for public display.** The JSON file is committed into a public website; do not store private or unapproved URLs there, even temporarily. Never describe stock photographs as real Redcarpert couples or events.

Example structure (placeholder URLs for documentation only):

```json
{
  "wedding_moments": {
    "events": [
      {
        "id": "celebration-2026",
        "title": "A day to remember",
        "description": "A joyful ceremony with family and friends",
        "media": [
          {
            "id": "celebration-2026-couple",
            "type": "photo",
            "url": "https://YOUR-IMAGEKIT-HOST/wedding-moments/event/couple.webp",
            "alt": "Newly married couple surrounded by family",
            "caption": "A moment together"
          },
          {
            "id": "celebration-2026-dance",
            "type": "video",
            "url": "https://YOUR-IMAGEKIT-HOST/wedding-moments/event/dance.mp4",
            "poster": "https://YOUR-IMAGEKIT-HOST/wedding-moments/event/dance-cover.webp",
            "caption": "Celebrating on the dance floor"
          }
        ]
      }
    ]
  }
}
```

Keep the other top-level JSON sections intact; only edit the `events` array. Every event needs a unique lowercase hyphenated `id`, a descriptive `title`, and at least one photo or video. `description` is optional. Each media item needs its own unique ID and an HTTPS URL. Photos require `alt` text. Videos require a short `caption`, and accept MP4 or WebM URLs. An HTTPS `poster` is recommended for video thumbnail cards, but not required (the site uses a neutral cover when absent).

Media is shown in the order of events and items in JSON. Photos appear in square gallery cards and open in an uncropped preview. Videos appear in matching cards with a play symbol, and use the browser's native player with controls. Videos are **not autoplayed**, and media is paused and unloaded when the preview closes. Media loads from the external host, not from the repository.

## Current preview status

No approved client event media URLs have been provided yet, so `wedding_moments.events` is empty. The page therefore displays clear **coming soon** copy and retains the existing 18 Pexels bridal-inspiration photos with an explicit stock-photography disclaimer. They are not described as Redcarpert couples, weddings or clients.

When client event media is added, the actual grouped event gallery takes the place of the stock-photo preview automatically. The separate `our_brides` JSON array is intentionally retained for those historical Pexels placeholders, not used to store approved event footage.

## Implementation protections

- Existing site header, footer, gallery card sizes, mobile layout, catalogue, lookbook and homepage are preserved
- Navigation text and page title change to Wedding Moments; the old address still works
- Photo and video URLs share the one central JSON manifest
- Malformed links, duplicate IDs, missing photo descriptions and unsupported video formats are rejected by build-time validation
- Test locally with `npm run check` and `npm run dev` before seeking approval to merge
- **No GitHub Actions workflow**, automatic merge or deployment is part of this implementation
