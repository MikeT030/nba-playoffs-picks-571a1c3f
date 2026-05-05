Make both award drawers fully opaque so the page content behind them is hidden.

## Changes

1. `src/components/AdminFlyerAwardDemoDrawer.tsx` (line 135): replace `bg-background/80 backdrop-blur-md` with `bg-background`.
2. `src/components/FlyerAwardDrawer.tsx` (line 88): replace `bg-black/90 backdrop-blur-md` with `bg-black`.

This affects both `receiver` and `broadcast` modes (shared backdrop in each component).