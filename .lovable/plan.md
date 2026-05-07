## Goal

Add an intro splash that plays once per session before the user lands on the app. It uses the uploaded logo (small, rounded-corner trophy image) and the same headline as `/auth`. Animation runs ~2s, then hands off to `/auth` (signed-out) or `/` Games (signed-in / locked playoffs).

## Asset

- Copy `user-uploads://Logo_rounded_corners.png` → `src/assets/splash-logo.png`. Imported in the splash component as an ES module.

## Animation timeline (~2000ms total)

```text
 0ms   →  900ms : image gently pulses (scale 1 ↔ 1.06, ~1.4s ease-in-out loop)
                  headline rendered with filter: blur(14px) + opacity 0.85 — milky glass
 900ms → 1700ms : headline blur fades to 0 (600ms ease-out)
                  image grows smoothly from scale 1 → 1.35 (800ms ease-out)
1700ms → 2000ms : image zoom-burst to scale ~28 (320ms cubic-bezier(0.7,0,0.84,0))
                  headline fades out (250ms)
2000ms          : splash unmounts → user sees /auth or /
```

GPU-friendly: only `transform`, `filter`, `opacity`. `will-change: transform` on the image.

## Routing & lifecycle

- New component `src/components/SplashScreen.tsx` — fixed full-screen overlay (`z-[100]`, `bg-background`).
- Mount once in `src/App.tsx` **inside** `<BrowserRouter>` (so it can call `useNavigate` / `useLocation`) and inside `<AuthProvider>`. Place it right after `<AwardDrawerHost />`.
- Show-once-per-session via `sessionStorage["splash-shown"]`. Refreshes don't replay it; new tab does.
- On unmount, decide target route:
  - signed-in → `/` (Games)
  - signed-out → `/auth`
  - if already on a deep link the user opened intentionally (anything other than `/` or `/auth`), don't redirect — just unmount the overlay.
- Skip the splash entirely on `/reset-password` (email-link landing must not be hijacked).
- Respect `prefers-reduced-motion`: skip pulse/zoom-burst, just a 600ms fade out.

## Visual details

- Image: `src/assets/splash-logo.png` rendered at `w-40 h-40 md:w-48 md:h-48`, `rounded-2xl` (already rounded in source, but matches app style).
- Headline: identical markup/fonts to `/auth`'s `<h1>`:
  - `2026` — Barlow thin
  - `Playoffs` / `Picks` — Claymale / Archivo Black, `text-5xl block leading-[1.15]`
- Centered vertically + horizontally; image above headline with `mt-8` gap.
- Background `bg-background` for seamless transition to `/auth` (same bg).
- `aria-hidden="true"`, `pointer-events-none` while animating.

## Files

- **New** `src/components/SplashScreen.tsx` — self-contained component with inline `<style>` tag for the one pulse keyframe (no Tailwind config changes).
- **New asset** `src/assets/splash-logo.png` — copied from upload.
- **Edit** `src/App.tsx` — add lazy or eager `<SplashScreen />` inside `<BrowserRouter>` (eager is fine, component is tiny).

## Out of scope

- No changes to `/auth`, `/`, or routing config.
- No new Tailwind keyframes — pulse keyframe lives inline in the component.
- No persistence beyond `sessionStorage`.

## Summary

A single ~2s splash overlay (pulsing logo + de-blurring headline + zoom-burst), shown once per session, mounted in `App.tsx`, that hands the user off to `/auth` or `/` based on auth state.
