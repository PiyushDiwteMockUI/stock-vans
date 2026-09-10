---
name: newsletter-photos
description: The Wonderland RV / OffGrid Outfitters newsletter photo treatment — a photo cut on matching diagonals top and bottom, an orange band riding the bottom cut, soft shadow between photo and band, fully transparent background. Load this whenever building or resizing a photo block for an email newsletter, an event graphic, or any branded image card that needs the angled-cut look. Triggers on "newsletter photo", "angled photo", "email photo block", "orange banner photo", "event graphic".
---

# Newsletter Photos

Reusable treatment for every photo that goes into a Wonderland RV / OffGrid Outfitters
newsletter block. Build it from `Newsletter Photos.dc.html` — do not re-derive the geometry.

## Locked spec

| Thing | Value |
| --- | --- |
| Default frame | 570 × 667 px (email content block, portrait) |
| Cut angle | 3.2°, descending left → right, **identical on top and bottom edges** |
| Top cut | starts at y = 30 px on the left edge |
| Bottom cut | starts at y = 610 px on the left edge |
| Orange band | 21.4 px thick, sits directly on the bottom cut, same 3.2° rotation |
| Band width | 92 % of frame width — it must stop short of the right edge |
| Band colour | `#db7627` flat, no gradient |
| Shadow | `drop-shadow(0 7px 11px rgba(20,22,25,.45)) drop-shadow(0 1px 2px rgba(20,22,25,.28))` |
| Background | fully transparent — nothing is painted below the bottom cut |

## Non-negotiable build rules

1. **The drop-shadow goes on an UNCLIPPED parent** of the clipped element. Filter is applied
   before `clip-path`, so a shadow on the same element as the clip is clipped away entirely
   and renders as a hard edge. Structure: `frame > band`, then `frame > shadowWrapper >
   clipWrapper > img`.
2. **Never crop with `object-fit: cover` + `object-position`.** A 1200 × 628 photo in a
   570 × 667 box covers to exactly 667 px tall — zero vertical overflow, so `object-position`
   Y is a no-op and the crop silently refuses to move. Size and place the `<img>` explicitly
   instead: absolute `left` / `top` / `width` in px with `height: auto`.
3. **Nothing important may touch a cut line.** Leave ≥ 35 px of clearance between the subject
   (feet, logos, vehicle edges) and the bottom cut, and ≥ 30 px below the top cut.
4. **No white fill.** The transparent area below the band is the point — the block sits on
   whatever the email section background is.

## Group-photo crop (OffGrid Outfitters showroom, 1200 × 628)

Verified numbers for the 570 × 667 frame:

- `photoWidth: 1265`, `photoLeft: -400`, `photoTop: -9`
- Puts the OffGrid Outfitters building sign clearly in frame, team centred, feet ~50 px above
  the bottom cut.

## Resizing to other formats

Keep the 3.2° angle and the 92 % band width; scale the cut positions proportionally.

- Square 600 × 600 → topCut 27, bottomCut 549, band 19
- Wide hero 1200 × 628 → topCut 28, bottomCut 574, band 20 (angle stays 3.2°, so dy = 67)
- Instagram 1080 × 1080 → topCut 49, bottomCut 988, band 34

Then re-place the photo by the clearance rule above — recompute `photoWidth` / `photoLeft` /
`photoTop`, never `object-position`.

## Pre-ship check

- [ ] Soft falloff visible where the photo meets the orange band (zoom the 30 px above the cut)
- [ ] Top and bottom cuts are the same angle and parallel
- [ ] Band stops short of the right edge
- [ ] Band is `#db7627`, flat
- [ ] Area below the band is transparent, not white
- [ ] Subject clears both cuts; no clipped feet, heads, or logos
- [ ] Frame is exactly the requested pixel size

## Files

- `Newsletter Photos.dc.html` — tweakable template (props: photo src/size/offset, frame size,
  angle, cut positions, band thickness/width/colour, shadow on/off)
- `Offgrid Sydney Event Graphic.dc.html` — the shipped Sydney event block, built on this spec
