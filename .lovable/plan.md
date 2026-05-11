## Goal
Restore the vertical stat line for Chapman and Paxson without making it bleed through the closed sealed-pack art.

## Change
In `src/components/DemoFlyerCardVariants.tsx`:

1. Add local `opened` state inside `FlyerCardV3`, initialized to `defaultOpened ?? (!sealed && !sealedToppsStyle)`.
2. Wrap the `onBurn` callback so the `onOpen` handlers passed to `SealedPackCard` and `SealedPackCardToppsStyle` set `opened = true` and still invoke the original `onBurn`.
3. Change the stat-line render guard from `!sealed && !sealedToppsStyle && stats…` to `opened && stats && stats.length > 0`.

## Result
- Miller / Davis (unsealed): stats visible immediately.
- Chapman / Paxson (sealed): stats appear after the pack burns open, hidden while the pack is sealed.
