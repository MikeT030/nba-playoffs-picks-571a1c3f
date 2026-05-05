## Problem

On `/my-picks`, the bracket shows real-world series winners (e.g. PHI) advancing all the way to the Finals, even when the user picked a different team. The bug surfaces in two places working together:

1. **`resolveBracketWithApiGames`** (`src/data/playoffsData.ts`) walks finished API series and fills *every* downstream slot — semis, conf finals, finals — with the real winners. Useful for `/index` and the live scoreboard, but wrong for "this is what *you* picked".
2. **`resolveSeriesTeams`** then sees those slots as already filled (`needsFill` is false) and skips the user-pick fallback. So the user's pick is never substituted in.
3. As a secondary bug, the fallback ternary in `resolveSeriesTeams` (lines 309 and 320) defaults to `pBottom` whenever the parent winner does not equal `pTop` — so even if the slot were empty, an unmatched pick would silently resolve to the wrong team instead of being treated as "no pick".

## Fix

### 1. Add a "picks-only" bracket variant

In `src/data/playoffsData.ts`, add a second resolver:

```ts
export function resolveBracketWithApiGamesRound1Only(games: ApiGameLike[]): BracketSeries[]
```

Same as `resolveBracketWithApiGames`, but **only fills the play-in 7/8 seed slots in Round 1**. It does *not* propagate finished-series winners into semis/conf finals/finals — those slots stay empty so user picks can drive them.

### 2. Add a hook variant

In `src/hooks/useBracketData.ts`, expose an option:

```ts
useBracketData(season, { mode: "live" | "picksOnly" })
```

- `"live"` (default) → existing behavior, used by `/index`, `/scoreboard`, match cards.
- `"picksOnly"` → uses the new resolver.

### 3. Use `picksOnly` on `/my-picks`

In `src/pages/MyPicks.tsx` (line 157), switch to `useBracketData(2025, { mode: "picksOnly" })`. The downstream `resolveSeriesTeams(..., activeBracket)` calls then see empty later-round slots and correctly substitute the user's picks.

`actualWinners` / `seriesScores` continue to be computed from `seriesResults` and `liveMatches`, so badges/strikethroughs showing "your pick was wrong, real winner was X" still work.

### 4. Harden `resolveSeriesTeams` fallback

Replace the buggy ternary on lines 309 and 320:

```ts
topTeam = parentWinner === pTop?.abbreviation ? pTop : pBottom;
```

with an explicit match:

```ts
if (parentWinner === pTop?.abbreviation) topTeam = pTop;
else if (parentWinner === pBottom?.abbreviation) topTeam = pBottom;
// else: leave undefined — user has no valid pick yet for this slot
```

Same change for the bottom branch. Prevents silent mis-resolution when a user's earlier pick doesn't match either current parent team (e.g. they picked a team that has since been eliminated in real life).

## Files touched

- `src/data/playoffsData.ts` — add `resolveBracketWithApiGamesRound1Only`; fix ternary fallback in `resolveSeriesTeams`.
- `src/hooks/useBracketData.ts` — add `mode` option.
- `src/pages/MyPicks.tsx` — pass `{ mode: "picksOnly" }`.

No DB or schema changes. Match cards, scoreboard, and home page keep their current live-resolved behavior.
