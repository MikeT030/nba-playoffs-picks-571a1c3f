## Goal

Build a demo for the "FLYER – The Shot · AWARD CARDS" admin section that simulates what users see when the first round ends and 4 cards are awarded — without touching the real `flyer_card_assignments` table.

## Behavior

Two drawer variants, both showing 4 cards wrapped in the existing `DemoFlyerCardV3` sealed pack (same pack used for the V3 demo entry).

**Version 1 — Receiver view** ("you got one")
- Heading text: `<User name>, you're worthy of receiving 1 of 4 FLYER – The Shot player cards.`
- The viewer is one of the 4 winners. Their own card is interactive — tap to burn the pack and reveal the player card underneath. Other 3 cards stay sealed (since this drawer represents *that* user's POV).
- Once burned, the revealed card is also surfaced on the Profile page (below the existing "THAT'S YOU" card) under a new "FLYER – THE SHOT" section.

**Version 2 — Broadcast view** ("everyone else sees it")
- Heading text: `It's official, <user 1>, <user 2>, <user 3>, and <user 4> are worthy of receiving 1 of 4 FLYER – The Shot player cards.`
- All 4 cards shown sealed. A card only reveals once *that* winning user has burned it in their own receiver drawer. Until then, only the pack is visible.

## Admin entry points (in the existing FLYER award accordion)

Add a new "Demo" subsection below the live assignment UI:

1. **Pick 4 random winners** button — randomly selects 4 distinct active users from the standings list and assigns each one of the 4 player cards (chapman / paxson / miller / davis), stored only in `localStorage` (key: `demo.flyerWinners`).
2. **Open Receiver drawer** button — opens V1. A small selector lets you pick which of the 4 winners you're viewing as ("View as: Simon ▾").
3. **Open Broadcast drawer** button — opens V2.
4. **Reset demo** button — clears localStorage (winners + burned flags) and closes drawers.

Both drawer buttons are disabled until winners have been picked.

## Storage (demo-only, no DB)

`localStorage`:
- `demo.flyerWinners` → `[{ user_id, name, cardId }]` (length 4)
- `demo.flyerBurned.<cardId>` → `"1"` once that pack has been ripped open in the receiver drawer

The real `flyer_card_assignments` table is never touched by any of this.

## Profile page integration

In `src/pages/Settings.tsx`, after the existing "THAT'S YOU" PlayerCard block, read `demo.flyerWinners` + burned flags. If the current signed-in user appears in the demo winners list AND their card has been burned, render a new section:

- Heading: `FLYER – THE SHOT`
- The matching `FlyerCardV3` (no longer sealed — burned state means card is exposed).

If they're a winner but haven't burned yet, show the sealed pack with a hint to open it from the awards drawer.

## Technical details

**New files**
- `src/components/AdminFlyerAwardDemoDrawer.tsx` — drawer component, supports `mode: "receiver" | "broadcast"`, takes `winners`, `viewerUserId` (receiver only), and exposes a burn handler that writes to localStorage.
- `src/lib/flyerDemo.ts` — small helpers: `getDemoWinners()`, `setDemoWinners()`, `clearDemo()`, `isDemoCardBurned(cardId)`, `markDemoCardBurned(cardId)`, plus a `useDemoFlyerState()` hook that subscribes to the `storage` event so the Profile page updates live.

**Modified files**
- `src/components/AdminFlyerAwardPanel.tsx` — add the Demo subsection (random-pick button, open-drawer buttons, viewer selector, reset). Reuses the standings list it already loads.
- `src/components/DemoFlyerCardVariants.tsx` — refactor so the four `DemoFlyerCardV3 / Paxson / Miller / Davis` exports each forward a `sealed` / `sealedToppsStyle` flag and an optional `onBurn` callback to the underlying `FlyerCardV3`. (Currently only Chapman is sealed; we need all four wrappable.) Add a `getFlyerCardComponent(cardId)` helper.
- `src/components/SealedPackCard.tsx` — add an optional `onOpen` prop fired when `setOpened(true)` runs, plus an optional `defaultOpened` so the broadcast view can show already-burned cards as opened.
- `src/pages/Settings.tsx` — render the burned demo card under the existing "THAT'S YOU" section.

**No DB migration required.** No edits to RLS, edge functions, or the existing `flyer_card_assignments` table.

## Out of scope

- Real "auto-pop on first round complete" trigger. This is described as a demo, so it lives behind admin buttons. (We can wire it to a real round-complete check later if you want.)
- Persisting demo state across browsers — localStorage only.
