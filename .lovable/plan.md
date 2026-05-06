## Problem

On `/my-picks`, PHI (a real Round 1 winner) is shown all the way up the bracket to the Finals — as if the user had picked PHI in every round. The user did not.

The "Your Pick: …" line below each card already handles the case where the user's pick is no longer in the live matchup (strikethrough + `(vs. ActualOpp)` suffix). That UX is correct and should stay.

The bug is in the **team slots** (the two team rows at the top of each bracket card) for rounds 2+, not in the pick line.

## Root cause

`useBracketData()` returns a bracket where `resolveBracketWithApiGames` has already:
1. Filled play-in TBD slots from live API data (correct, needed everywhere), AND
2. Walked the bracket forward and **pre-filled future round slots with real-life series winners** (e.g. PHI lands in `east-semi-top`).

In `PlayoffBracket.tsx`, `resolve(id)` only falls back to the user's predicted opponent when a slot is empty (`needsFill` in `resolveSeriesTeams`). Since the slot is already filled with PHI, the user's predicted bracket is overridden — and because PHI then becomes the "top team" of the semi card, the same propagation chains it forward into Conf Finals and the Finals.

The Scoreboard / Home / Match views *want* the propagated bracket (they show real-life standings). My-Picks does not.

## Fix

Split the two responsibilities in `src/data/playoffsData.ts`:

- Keep `resolveBracketWithApiGames(games)` as-is — used by Scoreboard, Home, MatchCard, MatchDetail (real-life view).
- Add `resolvePlayInSlotsOnly(games)` — same play-in TBD resolution, but **does not** propagate later-round winners forward. Future-round `topTeam` / `bottomTeam` stay `undefined` so `resolveSeriesTeams` can fall back to the user's picks.

Update `useBracketData` to accept an option:

```ts
useBracketData(season?: number, opts?: { propagateRealWinners?: boolean })
// default: true (existing behavior, no other caller changes)
```

When `propagateRealWinners: false`, call `resolvePlayInSlotsOnly` instead.

Update `src/pages/MyPicks.tsx` only:

```ts
const { data: resolvedBracket } = useBracketData(2025, { propagateRealWinners: false });
```

All other call sites stay on the default and keep their current behavior.

## What stays the same

- Play-in 7/8 seeds still resolve from live data on every page (no TBD on /my-picks).
- "Your Pick: TEAM in N (vs. ActualOpp)" line, strikethrough on broken picks, ✓/✗ marks, ADV badges, and points tags all keep working — they're driven by `bets`, `actualWinners`, `seriesScores`, and `pickPoints`, not by the team slots.
- Scoreboard, Home, Match cards, and Match detail dialogs continue to show the real-life propagated bracket.

## Files

- `src/data/playoffsData.ts` — add `resolvePlayInSlotsOnly`.
- `src/hooks/useBracketData.ts` — add optional `propagateRealWinners` flag.
- `src/pages/MyPicks.tsx` — pass `{ propagateRealWinners: false }`.
