# Implementation 25 — Wedding Moments

**Page:** `/wedding-moments/` (the previous bridal-only page and gallery are retired).

Wedding Moments documents not only bridal styling but **the couple, family, friends, ceremony, reception and celebrations** through photos and films.

## Current page design and real client media

Only the **Wedding Moments** title and subtitle appear above a continuous media grid:

> The love, the laughter, the unforgettable moments.

The page contains **86 real client JPG photographs** and one directly hosted **ImageKit MP4 video**, for **87 media cards** in total. They are preserved in the **exact order provided by the business**, starting with the film. All wedding-specific Pexels stock photos and stock film links have been removed from the JSON and the page.

Every card is **square** (four across on desktop, two on mobile), and contains **only an image**, with a discreet play icon on videos. There are no visible event categories, section titles, captions, descriptions or placeholder panels. A photograph opens uncropped in the blurred-background lightbox; the video opens a native player with controls.

**Scalable loading:** The first 16 cards are rendered. The remaining **71 cards** are placed into an inert HTML template, not loaded or requested initially. **Load More** adds 16 per click; five clicks reveal the remaining 71 items (ending with a seven-item batch).

**Video thumbnail:** The first frame of `wedding-moments-88.mp4` is used as its poster through ImageKit's documented `/ik-thumbnail.jpg` suffix. The original video URL is played on demand.

**Internal grouping:** Because the supplied links weren't separated by individual weddings, they are stored under an internal batch `client-upload-batch-01`, not falsely assigned to a particular couple or event. New approved upload batches can be appended to the JSON; the newest batch appears first without a visible grouping.

**Input inventory:** All 86 supplied JPGs are distinct. There is no `wedding-moments-55.jpg` in the supplied list, so no link was fabricated.

## Adding real wedding events

Upload photos and films to ImageKit in **one folder per event**. For instance:

```json
{
  "wedding_moments": {
    "events": [
      {
        "id": "wedding-2027-01",
        "title": "A day to remember",
        "description": "Family, friends and joyful celebrations",
        "media": [
          {
            "id": "wedding-2027-01-couple",
            "type": "photo",
            "url": "https://YOUR-IMAGEKIT-HOST/wedding-moments/wedding-2027-01/couple.webp",
            "alt": "Newlyweds sharing a moment surrounded by family",
            "caption": "Together at last"
          },
          {
            "id": "wedding-2027-01-dance",
            "type": "video",
            "url": "https://YOUR-IMAGEKIT-HOST/wedding-moments/wedding-2027-01/dance.mp4",
            "poster": "https://YOUR-IMAGEKIT-HOST/wedding-moments/wedding-2027-01/dance-cover.webp",
            "caption": "The celebration begins"
          }
        ]
      }
    ]
  }
}
```

This is a **fragment/example**, not a full replacement for the manifest. Only populate the existing `wedding_moments.events` array, leaving the other page sections untouched.

Each event requires a unique lowercase hyphenated ID and title. Each media item needs a unique ID, type, HTTPS URL, and appropriate descriptive text. Photos require `alt`; videos require `caption`. Direct video files must end in `.mp4` or `.webm` (query strings allowed). A video `poster` is **required** so every video card has an image thumbnail. It carries no visible text label.

All media is displayed in one gallery, and the newest appended batch appears at the top. Native videos only begin downloading when opened; they have player controls and are paused/unloaded when the preview closes. This is a static website: the client is responsible for hosting the files and managing the links.

## Publication and design safeguards

The business has identified these URLs as real client media. Before merging or deploying, confirm the appropriate public-display permission from the couple and other identifiable people (including children). This was not independently verified from the URLs alone. The public site should not expose private or unapproved material.

Do not edit the homepage hero layout, catalogue, header, footer, fitting WhatsApp flow or shared responsive widths as part of media replacement.

Run `npm run check` and preview using `npm run dev`. GitHub Actions and deployment happen **only** when explicitly requested by the project owner.
