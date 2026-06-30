# Projects data

Edit `projects.json` to manage the cards in the Projects carousel. It's an array
of project objects — add, remove, or reorder freely. Each card shows a cover
(image / video / embed) on top and the text below. **Clicking a card opens a
modal**: project info + tech stack on the left, and a media gallery (plus an
optional PDF) on the right.

## Fields

| Field         | Required | Description |
| ------------- | -------- | ----------- |
| `title`       | yes      | Card heading. |
| `description` | yes      | One or two sentences. |
| `tags`        | no       | Array of short strings shown as pills (the "Tech stack"), e.g. `["Vue", "TypeScript"]`. |
| `link`        | no       | URL for the "View project →" link (shown in the modal). |
| `accent`      | no       | Two hex colors `["#aabbcc", "#ddeeff"]` used for the marching pixel border, placeholder, and modal accents. |
| `image`       | no       | Image used as the **card cover**. |
| `video`       | no       | Video file (`.mp4` / `.webm`) used as the card cover. |
| `poster`      | no       | Image shown before a `video` plays. |
| `embed`       | no       | An iframe embed URL (e.g. a YouTube/Vimeo **embed** link) used as the card cover. |
| `gallery`     | no       | Array of media items shown in the **modal** (see below). |
| `paper`       | no       | A PDF (URL or `/public` path) rendered in the modal's right panel as an extra viewer item. |

## Cover priority

The card cover uses the first available of: `embed` → `video` → `image`. If none
are set, an accent-colored placeholder is shown.

## Gallery (modal)

`gallery` is an array; each item provides **one** of `image`, `video`, or
`embed` (a `video` may also include a `poster`). Items appear as thumbnails on
the right side of the modal. If `gallery` is omitted/empty, the modal falls back
to the single cover media above. If `paper` is set, the PDF is appended as a
final viewer item.

```json
{
  "title": "Example",
  "description": "…",
  "tags": ["Python", "PyTorch"],
  "accent": ["#0a35f6", "#06b6d4"],
  "image": "/media/cover.png",
  "gallery": [
    { "image": "/media/shot-1.png" },
    { "video": "/media/demo.mp4", "poster": "/media/demo-poster.png" },
    { "embed": "https://www.youtube.com/embed/VIDEO_ID" }
  ],
  "paper": "/media/paper.pdf"
}
```

## Where to put media files

Use any of:

- **A bundled source file (recommended)** — drop the file under `src/assets/`
  (e.g. `src/assets/pdfs/paper.pdf`) and reference it by that path:
  `"paper": "./src/assets/pdfs/paper.pdf"`. `src/data/resolveAsset.ts` rewrites
  these to hashed, build-safe URLs, so they render in both `npm run dev` and the
  deployed site. A leading `./` is optional.
- **A full URL** — e.g. `"image": "https://.../shot.png"`, or a YouTube embed
  `"embed": "https://www.youtube.com/embed/VIDEO_ID"`. Left untouched.
- **A local file in `public/`** — drop the file in `public/` (e.g.
  `public/media/demo.mp4`) and reference it with a root-absolute path:
  `"video": "/media/demo.mp4"`. Files in `public/` are served as-is by Vite.

> Note: a bare `src/...` path is only a real file in dev. Referencing it without
> going through the resolver will 404 in the production build — that's exactly
> what `resolveAsset()` (applied in `App.vue`) fixes.

Leave a media field as `""` (or remove it) to skip it.
