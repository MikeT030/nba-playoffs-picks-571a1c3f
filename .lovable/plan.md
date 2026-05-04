## Add a v4 pack layout (hero dunker), switchable via dot nav

### What you'll see
A new sealed-pack design joins the existing one. It uses the layout from your reference: a large basketball player silhouette dunking on a hoop on the **left**, a centered headline block on the **upper-right**, a "1 CARD" callout on the **mid-right**, the **FLYER Couch Crew** logo bottom-right, and the existing pink "Sizzling hot 2026 series" banner on the bottom-left.

The background keeps everything you already have: navy fill, the tiled skewed primary-color "FLYER" watermark, top/bottom serrated edges, the holo shine, the burn-open animation, and the same Memphis-style title shadows + skewed banner styling.

A row of 2 big dots sits just above the pack on the admin demo drawer, letting you flip between **v3 (current)** and **v4 (new)** instantly. The choice persists per session.

### Layout sketch

```text
┌──────────────────────────────────┐
│  ░░ tiled FLYER watermark ░░     │
│                                   │
│         ┌──────────┐              │
│         │ HEADLINE │              │
│   🏀    │  block   │              │
│  ╱│╲    └──────────┘              │
│ hoop+                             │
│ dunker          ┌──────┐          │
│ silhouette      │1 CARD│          │
│                 └──────┘          │
│                                   │
│  ┌──────────────┐  ┌───────┐      │
│  │Sizzling hot..│  │ LOGO  │      │
│  └──────────────┘  └───────┘      │
└──────────────────────────────────┘
```

### Technical changes

1. **New asset**: copy `user-uploads://FLYER_Couch_Crew_logo_cut_out.png` → `src/assets/flyer-couch-crew-logo.png`.

2. **`src/components/SealedPackCard.tsx`**:
   - Add a `variant?: "v3" | "v4"` prop on `SealedPackCard` (default `"v3"`), forwarded to `FullPackFace`.
   - Extract a new `FullPackFaceV4` component that reuses `MemphisPattern`, `SerratedEdge`, the existing color tokens (PINK/CYAN/YELLOW/INK/BLUE), and the same skewed-banner styling, but lays out:
     - **Left**: an inline SVG silhouette of a player dunking on a hoop+backboard (single-color INK fill so it reads like the reference). Spans ~55% width, vertically centered.
     - **Upper-right**: the existing stacked, skewed, multi-shadow `Supreme Premium Cards` headline, scoped to the right ~45% column.
     - **Mid-right**: a chunky "1 CARD" badge in YELLOW on INK with the same stacked-shadow treatment.
     - **Bottom-left**: the existing pink "Sizzling hot 2026 series" skewed banner, narrowed to ~52% width.
     - **Bottom-right**: the new `flyer-couch-crew-logo.png` with the same pink drop-shadow filter currently used for the top logo.
   - Keep the original `FullPackFace` (v3) untouched so v3 looks identical.

3. **`src/components/DemoFlyerCardVariants.tsx`**:
   - Extend `sealedConfig` typing with `variant?: "v3" | "v4"` and pass it through to `SealedPackCard`.

4. **`src/components/AdminFlyerAwardDemoDrawer.tsx`**:
   - Add local `useState<"v3" | "v4">("v3")` for the active pack variant.
   - Render a centered dot-nav above the pack grid: two large (~14px) dots, active one filled with `primary`, inactive outline. Clicking a dot updates the variant.
   - Pass `sealedConfig={{ ...preset.sealedConfig, variant }}` down through `FlyerCardForId` → `FlyerCardV3` → `SealedPackCard`. (Adds a small `sealedConfig` override on `FlyerCardForId` or inlines the variant via a new optional prop `packVariant`.)

### Notes
- All v3 visuals — watermark, fonts, serrated edges, shine, burn animation, banner shadow stack — are preserved verbatim in v4; only the foreground composition changes.
- The dunker silhouette is drawn as an inline SVG (no external image) so it stays crisp at any size and inherits the INK color token.
