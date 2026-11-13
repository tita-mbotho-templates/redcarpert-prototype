# Implementation 25 — Wedding Moments

**Page:** `/wedding-moments/` (the previous bridal-only page and gallery are retired).

Wedding Moments documents not only bridal styling but **the couple, family, friends, ceremony, reception and celebrations** through photos and films.

## Visible content today

- Three gallery stories: **Together, at last**, **The people who make it special**, and **When the celebration begins**
- Twelve Pexels stock photos featuring couples and guests instead of isolated bridal portraits
- Two linked Pexels sample wedding films, marked as examples and opening the video source page in a new tab
- Responsive square gallery cards (four columns desktop, two columns mobile), photo lightbox and a blurred backdrop
- An explicit stock-media disclosure: **none of the current examples depict Redcarpert clients or events**

The Pexels photo links and film source pages reside in `src/data/image-links.json` under `wedding_moments.showcase`, grouped by editorial theme. The showcase is displayed **only while `wedding_moments.events` is empty**. The separate bridal-only gallery, scripts, CSS and JSON keys have been removed.

The client has not provided approved real wedding photographs or video URLs yet; no real couple or event is claimed.

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

Each event requires a unique lowercase hyphenated ID and title. Each media item needs a unique ID, type, HTTPS URL, and appropriate descriptive text. Photos require `alt`; videos require `caption`. Direct video files must end in `.mp4` or `.webm` (query strings allowed). A video `poster` is optional but recommended.

When at least one approved event exists, it automatically replaces the themed stock showcase. Native videos only begin downloading when opened; they have player controls and are paused/unloaded when the preview closes. This is a static website: the client is responsible for hosting the files and managing the links.

## Publication and design safeguards

Only publish client media after confirming the couple and identifiable people (including children) have provided any necessary permissions. Do not present stock subjects as Redcarpert customers or imply their endorsement. Source links for all stock examples are retained in the JSON file.

Do not edit the homepage hero layout, catalogue, header, footer, fitting WhatsApp flow or shared responsive widths as part of media replacement.

Run `npm run check` and preview using `npm run dev`. GitHub Actions and deployment happen **only** when explicitly requested by the project owner.
