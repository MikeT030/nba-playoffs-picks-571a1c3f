## Goal
Sync the golden glitter so it starts falling exactly when the splash hands off to the auth page, instead of starting earlier (currently it begins as soon as `Auth` mounts, which happens during the splash's hero-morph phase, so the first ~400ms of glitter is hidden behind the splash overlay).

## Approach
Gate `GoldenGlitter` rendering in `Auth.tsx` on a "splash finished" signal. If the splash never ran (already shown this session, or user navigated directly), show the glitter immediately.

## Changes

### 1. `src/components/SplashScreen.tsx`
- When the splash unmounts at the end of its sequence (the existing 4000ms timeout, and also the reduced-motion path), dispatch a `window` event: `window.dispatchEvent(new Event("splash:done"))`.
- Also dispatch `splash:done` immediately if `show` is `false` on first render (so consumers don't wait forever when no splash plays). Implement via a one-shot `useEffect` that fires `splash:done` on mount when `show === false`.

### 2. `src/pages/Auth.tsx`
- Add local state `showGlitter`, initialized to `false` only when a splash is currently in progress, otherwise `true`. Detection: `sessionStorage.getItem("splash-shown") === "1"` AND no active splash element — simplest heuristic: initialize `showGlitter = sessionStorage.getItem("splash-shown") === "1"` so it's `true` on subsequent visits and `false` on the very first load (when splash is about to/just finished playing).
  - Edge case: on first load, `SplashScreen`'s effect sets `splash-shown` to `"1"` immediately on mount, before `Auth` mounts. So that heuristic isn't reliable. Instead, gate purely on the event: initialize `showGlitter = false`, listen for `splash:done`, set to `true`. To cover the "no splash" case, `SplashScreen` always fires `splash:done` on mount when it decides not to show (per change #1). Auth will reliably hear it because `SplashScreen` is mounted at the app root before route children — confirm by reading `App.tsx` during implementation; if order is reversed, switch to a tiny `sessionStorage` flag `splash-done` that Auth checks synchronously.
- Render `<GoldenGlitter />` only when `showGlitter` is `true`.
- Also re-trigger when the user clicks the "App Loader" button: that already dispatches `splash:replay` which resets the splash; `showGlitter` should reset to `false` on `splash:replay` so the glitter re-syncs with the next handoff.

## Notes
- No changes to glitter timing/visuals — it will still last ~3.5s; it just starts at the correct moment.
- The existing splash overlay covers the auth page (z-100 vs glitter z-90), so the visible "early fall" is exactly the ~400ms between Auth mount and splash unmount; gating removes that.
