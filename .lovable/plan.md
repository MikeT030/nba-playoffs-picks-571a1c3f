# Persist Wade's recaps + key by series_id

## Goal

Two small, related fixes to the "Add to game" flow in `DeadpoolRecapDrawer`:

1. **Robust key** — the recap is currently looked up by `${awayAbbr}-${homeAbbr}-G${gameNumber}`. Home/away can flip per game in a series, so a recap added from one orientation can silently fail to display on the matchup detail. Key by **bracket `series_id` + `gameNumber`** instead.
2. **Persistence** — the in-memory `Map` resets on page reload. Mirror it to **`localStorage`** so added recaps survive refresh.

No DB schema changes. No scoring changes. No visible UI redesign — the "The gist of it" section behaves the same, just more reliably.

## Scope

Three files:

- `src/lib/demoRecapStore.ts` — change `recapKey` signature, add localStorage hydration + write-through.
- `src/components/DeadpoolRecapDrawer.tsx` — resolve `series_id` for the chosen game (sample or NBA-API game) and pass it to `recapKey`.
- `src/components/MatchDetailDialog.tsx` — use the already-computed `bracketSeriesId` for the lookup; drop the away/home-abbr key.
- `src/components/DemoMatchDetailDialog.tsx` — pure-demo screen with hardcoded data; pass a stable demo series id (e.g. `"demo-pac-sac"`) so it keeps working.

## Technical details

### `demoRecapStore.ts`

```ts
const STORAGE_KEY = "demoRecapStore.v2";

function recapKey(seriesId: string, gameNumber?: number): string {
  return `${seriesId}::G${gameNumber ?? "x"}`;
}

// On module load: try JSON.parse(localStorage[STORAGE_KEY]) into the Map.
// On setDemoRecap: write the serialized Map back to localStorage (wrapped in try/catch).
```

The `v2` suffix avoids colliding with stale `away-home-Gn` entries from the old key shape — they simply won't be read.

### `DeadpoolRecapDrawer.tsx`

The drawer currently builds a `FactSheet` from either the sample constant or an `NbaGame`. To produce a series id:

- Pull `useBracketData()` (already used elsewhere) once at the top of the drawer.
- Add a small helper that, given two team abbreviations, finds the matching bracket series via the existing `getBracketSeriesIdForMatch`-style lookup (orientation-independent set match on `topTeam`/`bottomTeam` abbreviations).
- For the sample factsheet, use a fixed string like `"sample-demo"` — the existing demo dialog will use the same constant.

Pass `recapKey(seriesId, factsheet.gameNumber)` into `setDemoRecap`.

### `MatchDetailDialog.tsx`

`bracketSeriesId` is already computed (line 129). Replace the two `useDemoRecap(recapKey(awayAbbr, homeAbbr, …))` calls with:

```ts
const recapByGame   = useDemoRecap(recapKey(bracketSeriesId ?? "", activeGame?.gameNumber));
const recapBySeries = useDemoRecap(recapKey(bracketSeriesId ?? "", undefined));
```

### `DemoMatchDetailDialog.tsx`

It's a static demo screen. Use the same `"sample-demo"` constant the drawer uses for its sample factsheet, so the demo dialog still picks up a recap added against the sample.

## Out of scope

- Server-side persistence (Supabase table) — not needed for a demo feature.
- Cleanup of old localStorage keys — there were none under v1 (in-memory only).
- Any change to scoring, picks, or matchup layout.

## Verification

1. Open the recap drawer, pick the sample, click **Add to game**, open the demo matchup detail → "The gist of it" appears.
2. Hard-refresh the page → "The gist of it" still appears.
3. Pick a real finished game (e.g. one where home/away differs from how the matchup card lists them), add to game, open the matchup detail for that series → recap appears regardless of orientation.
4. `npm run test` — existing tests untouched and still pass.
