# A reserved picture box and "hide it on error" must be decided together; keep height: auto when the img has size attributes ^L-REQ-fs-007-5

| Field | Value |
|---|---|
| ID | LESSON-REQ-fs-007-5 |
| Captured | 2026-10-09 |
| REQ | REQ-fs-007 |
| Component | `frontend/src/components/posts/FeedPost`, `Avatar` |
| Tags | images, layout, css, frontend |
| Severity | trap (cost real time before) |

## The lesson

A box that reserves room for a picture stops the page from moving when the picture arrives, but if a failed link is then hidden, the page moves up once, late. Decide the failure look together with the box (an empty grey box, or accept one move). And an `<img>` with `width` and `height` attributes needs `height: auto` in its CSS: the attribute sets the height unless CSS does, and `aspect-ratio` is then ignored, so removing `height: auto` would draw a 3px picture for `height="3"`. A 1x1 attribute on an avatar is only safe because its CSS sets both sides to 100 percent.

## Saw it in

- `FeedPost.module.css` `.image`: a fixed 4:3 box gave layout shift 0 for wide and tall pictures, and 0.17 to 0.20 for a link that failed after 2 seconds (the owner chose to keep "hide on error", as in REQ-fs-006).
- `Avatar.tsx` and `Avatar.module.css`: square size hint with 100 percent CSS.

## Related

- Originating REQ: REQ-fs-007
