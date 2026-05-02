## Problem

In the bracket, Round 2+ matchup cards show the user's *predicted* opponent rather than the *actual* one once a parent series has concluded. Example: bracket displays OKC vs HOU (user's R1 pick) even though the real R2 matchup is OKC vs LAL.

## Root cause

`resolveSeriesTeams` in `src/data/playoffsData.ts` always traverses the user's parent picks to fill a child series' slots, overriding the slots that `resolveBracketWithApiGames` already filled with the *real* advancing team.

Per-series flow today:
1. `useBracketData` runs `resolveBracketWithApiGames`, which writes the real `topTeam`/`bottomTeam` into a series once its parent series is decided (4 wins recorded).
2. `PlayoffBracket.resolve()` then calls `resolveSeriesTeams`, which unconditionally replaces those slots with `picks[parentSeriesId]` (the user's predicted winner).

So the API-resolved truth is silently overwritten by the user's pick.

## Fix

In `resolveSeriesTeams`, only fall back to the parent-pick traversal when the slot is *not* already filled by the bracket data. Treat play-in placeholders (`PIE7`/`PIW7`/`PIE8`/`PIW8` via `isPlayInPlaceholder`) as "not filled" so Round 1 TBD behavior is preserved.

Pseudocode:

```text
topTeam = series.topTeam
if topTeam is missing OR isPlayInPlaceholder(topTeam.abbreviation):
    use existing parent-pick traversal to fill it
# same for bottomTeam
```

This keeps the current behavior for:
- Round 1 (slots are always pre-filled in the static bracket; no parent traversal happens anyway).
- Pre-decision rounds where the parent series isn't over yet (slot stays undefined → traversal still uses the user's pick to preview).

And fixes the case where the parent is decided: the real advancing team wins.

## Files to change

- `src/data/playoffsData.ts` — adjust `resolveSeriesTeams` as above (both top and bottom branches).

## Side effects to verify

- `MyPicks.tsx` builds `seriesScores` keyed off `resolveSeriesTeams(...)`. After the fix, the resolved teams will be the *actual* matchup, so `seriesScores` will correctly reflect the actual series score (e.g. OKC-LAL), not the predicted matchup.
- `MatchCard`'s "Your Pick: X in N (vs. OPP)" already compares against `getAssumedOpponentAbbr` and only shows the suffix when the actual matchup differs — unaffected.
- Bracket coloring (winner/loser highlight, "+points" tag) keys off `actualWinners[id]` and the bet's `winner` abbreviation, not the slot teams — unaffected.

## Out of scope

No UI changes, no data-model changes, no changes to Round 1 logic.