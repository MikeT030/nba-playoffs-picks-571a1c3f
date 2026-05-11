## Goal
Hide the vertical stat line until the sealed pack's burn animation finishes, so it stops peeking through the foil.

## Change
In `src/components/DemoFlyerCardVariants.tsx`, inside `FlyerCardV3`:

- Replace the immediate `setOpened(true)` in `handleOpen` with a `setTimeout(() => setOpened(true), 4400)` that matches the 4390ms burn duration in `SealedPackCard`.
- Still call `onBurn?.()` synchronously on tap so parent side-effects fire immediately.
- `defaultOpened` initialization stays as-is (already-burned demo state shows stats instantly).

## Result
- Sealed Chapman / Paxson packs: tapping kicks off the full burn; the amber stat line only renders once the foil is gone.
- Unsealed Miller / Davis cards: stats still render immediately.
