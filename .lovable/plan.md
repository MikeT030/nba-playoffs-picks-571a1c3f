## Goal

Replace the bottom drawer used to award FLYER – The Shot player cards with a full-screen overlay that mimics the reference image: 4 cards at full size, stacked and overlapping (left-to-right, each one nudged down/right), with the rightmost card on top.

## Behavior

**Receiver mode**
1. Layer opens full-screen. No close (X) button is visible yet.
2. Cards are shown at their natural size, stacked/overlapping like the reference image.
3. First tap on any card: the card lifts up, animates to the center/front, becomes the topmost card overlapping the rest. It is now "selected" (claimed in `flyerDemo` for first-come, first-served).
4. Second tap on the now-front (selected) card: triggers the existing `onBurn` burn animation. Sealed packs underneath cannot be tapped while another is selected (only the front card is interactive for burning).
5. After the burn animation completes, a button styled like the existing "TAP TO BURN" pill appears beneath/over the card with the label **"Nice, got it"**. Tapping it closes the layer.
6. A close `X` (top-right) becomes visible only after the user has burned their card. So the user has two ways to close after burning: the pill button or the X.
7. Before the user has burned a card, the layer cannot be closed (Escape, overlay click, swipe-down all blocked).

**Broadcast mode**
- Same full-screen layer + stacked layout, but cards are read-only (revealing only the ones whose owners burned them).
- Close X is always visible in broadcast mode (admin needs to dismiss it).

## Layout (reference image)

```text
   ┌──┐
   │  │┌──┐
   │  ││  │┌──┐
   │  ││  ││  │┌──┐
   │  ││  ││  ││  │  ← front (rightmost, fully visible)
   └──┘└──┘└──┘└──┘
```

- Each card uses its full intrinsic size (the same `FlyerCardForId` rendering used elsewhere).
- Cards are absolutely positioned, offset by `~28px` right and `~22px` down per index, so each one peeks out from behind the next.
- z-index increases left → right, so the rightmost card is on top by default.
- When a card is "lifted", it animates to `translate(0,0)` centered, scales slightly up if needed to fit, and gets the highest z-index. The other cards slide back into the stacked layout (or fade slightly).

## Technical changes

**`src/components/AdminFlyerAwardDemoDrawer.tsx`** — rename usage left as-is for callers; internally swap `Drawer` for a full-screen overlay (fixed `inset-0 z-50 bg-background`, no Vaul). Replace the fan layout with the new stacked layout.

State to add:
- `selectedCardId: FlyerCardId | null` — which card is currently lifted to the front.
- Keep `justBurnedId` for the burn animation; derive `hasBurned` from `claims + burned` for the viewer.

Click logic in receiver mode:
- If no card selected → tapping any card calls `claimDemoCard` (if not already claimed by viewer) and sets `selectedCardId`. If already claimed by viewer, just sets `selectedCardId` to that claimed card.
- If a card is selected and the tap is on the *same* card → trigger burn (pass `onBurn` to `FlyerCardForId` which already wires through to the sealed pack). Other cards are non-interactive while one is selected.
- The viewer can only ever claim one card; subsequent taps on other cards are ignored once a claim exists.

Close gating:
- Replace the Drawer's built-in dismissal. Use a controlled `Dialog`-style div with `onPointerDownOutside`/`onEscapeKeyDown` blocked until `hasBurned`.
- Render an `X` button (top-right) only when `hasBurned || mode === "broadcast"`.
- Render the "Nice, got it" pill (reusing the same visual style as the "TAP TO BURN" pill from `SealedPackCardToppsStyle` — black/55 bg, white text, rounded-full, font-display tracking) below the burned card. Clicking it calls `onOpenChange(false)`.

**Header / copy** — keep existing headline/subline text but render in a top bar inside the full-screen layer (not in the Drawer header).

**No changes needed** to `flyerDemo.ts`, `DemoFlyerCardVariants.tsx`, or the sealed pack components — the burn flow stays identical.

## Files touched

- `src/components/AdminFlyerAwardDemoDrawer.tsx` — full rewrite of the layout & interaction model (Drawer → full-screen overlay, fan → stack, add lift/select state, gated close, "Nice, got it" button).

No other files need changes; callers in `Settings.tsx` / `AdminFlyerAwardPanel.tsx` continue to use the same props (`open`, `onOpenChange`, `mode`, `viewerUserId`).
