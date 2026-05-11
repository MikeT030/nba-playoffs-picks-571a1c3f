## Goal
Improve readability of the vertical stat line on the right edge of the Davis flyer card (`DemoFlyerCardV3` shared template) by placing a dark gradient behind it, so the amber text stays legible over any background image.

## Change
In `src/components/DemoFlyerCardVariants.tsx`, inside the vertical stat-line block (around line 190–203):

- Add an absolutely-positioned gradient `<div>` as a sibling beneath the stat text, scoped to the right strip only.
- Gradient: horizontal, fading from fully transparent on the left to dark (`black/70`–`black/85`) on the right edge. This keeps it a localized highlight strip rather than darkening the whole image.
- Slightly widen the strip (e.g. `w-8` instead of `w-6`) so the gradient has room to fade naturally without crowding the text.
- Stat text stays on top (`relative z-10`), unchanged in styling.

## Scope
- Only the Davis variant uses this component path with stats; no other variants or business logic touched.
- Pure presentational change, no new tokens required (uses existing black opacity utilities consistent with the existing letterbox gradient on line 187).
