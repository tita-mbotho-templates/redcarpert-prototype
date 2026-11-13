# Implementation 25 — Wedding Moments

**Page:** `/wedding-moments/` (the previous bridal-only page and gallery are retired).

Wedding Moments documents not only bridal styling but **the couple, family, friends, ceremony, reception and celebrations** through photos and films.

## Visible design

The page shows just **Wedding Moments** and the subtitle:

> The love, the laughter, the unforgettable moments.

Beneath them is **one continuous square gallery**: four columns on desktop and two on mobile. Cards have **no visible titles, event groups, captions or descriptions**. Photography stays edge-to-edge within each card; videos have a small play icon.

For the current demonstration, the gallery contains 12 wedding-focused stock photographs and two linked Pexels sample films. A subtle notice below the grid says that the examples are not Redcarpert client events. The stock links are in `wedding_moments.showcase`; they are replaced by real photos/films automatically when `wedding_moments.events` has approved client content.

**Scalability:** The first 16 cards are rendered immediately. If there are more, the remaining cards are stored in an inert HTML template (their images are not requested), and **Load More** inserts 16 at a time. New wedding events should be appended to the end of the JSON `events` array. The website displays these **newest event first**, while keeping the original order of photographs within each event. JSON grouping is internal only; visitors see one gallery with no categories.

No old bridal-only gallery scripts, CSS, data keys or content are retained. The currently displayed images are demonstrative stock photography, not actual Redcarpert weddings.

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

When at least one approved event exists, it automatically replaces the stock showcase. All events are visually flattened into one gallery, and the newest appended event appears at the top. Native videos only begin downloading when opened; they have player controls and are paused/unloaded when the preview closes. This is a static website: the client is responsible for hosting the files and managing the links.

## Publication and design safeguards

Only publish client media after confirming the couple and identifiable people (including children) have provided any necessary permissions. Do not present stock subjects as Redcarpert customers or imply their endorsement. Source links for all stock examples are retained in the JSON file.

Do not edit the homepage hero layout, catalogue, header, footer, fitting WhatsApp flow or shared responsive widths as part of media replacement.

Run `npm run check` and preview using `npm run dev`. GitHub Actions and deployment happen **only** when explicitly requested by the project owner.
