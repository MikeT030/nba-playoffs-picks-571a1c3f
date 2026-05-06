## Problem

On `/my-picks`, the user's pick (e.g. PHI) auto-fills every later-round bracket slot up to the Finals — even though PHI is currently *losing* a Round 1 series that hasn't ended yet. The bracket should freeze the user's predicted winner from propagating once the real-life series has started but isn't decided.

## Root cause

`resolveSeriesTeams` (in `src/data/playoffsData.ts`) recursively fills any empty slot from `picks[parentId]`. For in-progress series, `resolveBracketWithApiGames` leaves the slot empty (no winner yet), so the recursive fallback pulls in the user's predicted winner and carries it through every later round.

We need a "look one round ahead" rule: **if the parent series has started in real life but isn't decided, the child slot stays TBD** instead of falling back to the user's pick. If the parent series hasn't started at all, the predicted winner can still propagate (so the bracket isn't fully empty before the playoffs begin).

## Changes

### 1. `src/hooks/useBracketData.ts`
Also derive and return an `inProgressPairs: Set<string>` — a set of `"ABBR1|ABBR2"` (sorted) pair keys for any matchup where at least one game has been played (live or final) but the series isn't yet won (no team has 4 wins). Computed from the same raw games already in `usePlayoffGamesRaw`, so no extra fetch.

### 2. `src/data/playoffsData.ts`
Update `resolveSeriesTeams` to accept an optional context:

```ts
resolveSeriesTeams(
  seriesId,
  picks,
  seriesList,
  ctx?: {
    actualWinners?: Record<string, string>;   // by bracket series id
    inProgressPairs?: Set<string>;            // sorted "A|B" keys
  }
)
```

For each parent slot that needs filling:
1. Resolve the parent's `(top, bottom)` recursively first.
2. If `actualWinners[parentId]` is set → use that real winner (already implicitly handled because `activeBracket` carries it, but keep as explicit guard).
3. Else, build the parent pair key from the *predicted* parent teams. If `inProgressPairs` contains that key → **leave the child slot empty (TBD)**. Do not fall back to `picks[parentId]`.
4. Else (parent hasn't started) → fall back to `picks[parentId]` as today.

This is the "freeze one round ahead" rule. Conf Semis can still show the user's predicted winner *until* that semi-final actually tips off; once it does and is undecided, Conf Finals / NBA Finals slots stay TBD on this user's bracket.

### 3. `src/pages/MyPicks.tsx`
- Pull `inProgressPairs` from `useBracketData`.
- Build `actualWinners` from `seriesResults` (already done).
- Pass both into every `resolveSeriesTeams(...)` call on this page (series scores loop + the loop that derives live scores).
- Pass `inProgressPairs` and `actualWinners` down to `<PlayoffBracket />` via new props.

### 4. `src/components/PlayoffBracket.tsx`
- Accept new optional props `inProgressPairs?: Set<string>` and reuse the existing `actualWinners` prop.
- In `BracketCard` (and any place it calls `resolveSeriesTeams`), pass the new ctx so the rendered `topTeam` / `bottomTeam` come back as `undefined` (TBD) for frozen slots.
- Tagline logic stays exactly as just implemented (2/1/0 overlap with `predictedOpp`). When the actual pair is `[]` (TBD), `matchCount === 0` → red text + ✗ + `(vs. <predictedOpp>)`. That is the desired behavior for downstream rounds whose parents are in progress.

## Untouched

- "That's what you've picked" `PickCard` list — still uses original `picksBracket` / saved bets, unaffected.
- Scoreboard, Home, Match views — they already use `propagateRealWinners: true` without the user-pick fallback path through `resolveSeriesTeams` for display, and they don't render predicted slots.
- Scoring, ADV badges, championship section, play-in TBD resolution.

## Files

- `src/hooks/useBracketData.ts`
- `src/data/playoffsData.ts`
- `src/pages/MyPicks.tsx`
- `src/components/PlayoffBracket.tsx`
