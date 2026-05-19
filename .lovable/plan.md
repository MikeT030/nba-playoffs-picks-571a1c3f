## Goal

Make the broadcast headings in `src/components/DemoBroadcastHeading.tsx` match the reference image: solid white letters with a soft inner shadow falling from the top edge inward, and a subtle outer drop shadow underneath.

## Current state

The component currently uses:
- A near-white gradient clipped to text (a faint "gloss")
- `text-shadow` layers below the letters (which render *outside* the glyphs, not inside)
- Several `filter: drop-shadow(...)` layers for outer glow and bottom shadow

`text-shadow` cannot produce a true inner shadow — it only draws outside the glyph. The current "inner shadow" is actually just an outer shadow below the text. The reference image shows shading *inside* the top of each letter.

## Approach

Use an SVG filter (`feGaussianBlur` + `feComposite operator="arithmetic"`) to render a real inner shadow on the text, then apply it via CSS `filter: url(#inner-shadow-top)`. This is the only reliable way to get an inner shadow on live text in the browser.

### Changes to `src/components/DemoBroadcastHeading.tsx`

1. Add an inline `<svg>` (width/height 0, absolutely positioned) defining a filter with id `broadcast-inner-shadow`:
   - `feGaussianBlur` on `SourceAlpha` (stdDeviation ~3)
   - `feOffset` dy=4 (shadow pushed down so the dark band sits at the top inside the glyph)
   - `feComposite` operator `arithmetic` with `in2="SourceAlpha"` and k2=-1, k3=1 → produces the inner shadow shape
   - `feColorMatrix` to set the shadow to black at ~55% opacity
   - `feComposite` over `SourceGraphic` so the original white glyph remains visible underneath

2. Update `.broadcast-heading` CSS:
   - Remove the gradient + `background-clip: text` + `-webkit-text-fill-color` block
   - Set `color: #ffffff`
   - Remove the `text-shadow` layers (they were faking the inner shadow and now conflict)
   - Apply `filter: url(#broadcast-inner-shadow) drop-shadow(0 2px 0 rgba(0,0,0,0.55)) drop-shadow(0 6px 14px rgba(0,0,0,0.5))` so the inner shadow renders first, then the soft outer shadow under the letters
   - Keep the top highlight subtle (`drop-shadow(0 -1px 0 rgba(255,255,255,0.4))`) if it still reads well; otherwise drop it

3. No changes to layout, font, sizing, headings, or container styling.

## Technical notes

```text
SVG filter pipeline (conceptual):
  SourceAlpha → blur(3) → offset(dy=4) → invert+composite with SourceAlpha
              → tint black @ ~55% → draw over SourceGraphic (white text)
Result: white glyph with a soft dark band along the inside-top edge.
```

The SVG `<defs>` lives once at the bottom of the component (not per-heading) so all four `<h1>` elements share the same filter id.

## Out of scope

- No changes to other components, routes, or styling tokens
- No new dependencies
- No font changes
