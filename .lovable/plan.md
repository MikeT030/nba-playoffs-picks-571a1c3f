# Redefine the 1-point rule

## New scoring rules

For every pick, compare it against (a) the actual series result and (b) the **assumed matchup** — the opponent the user implicitly predicted, derived from their own picks in the two feeder series.

| Outcome | Points |
|---|---|
| Right winner + right assumed opponent + right games-in-series | **3** |
| Right winner + right assumed opponent + wrong games-in-series | **2** |
| Right winner + wrong assumed opponent (any game count) | **1** |
| Wrong winner | **0** |

Champion bonus (+4 for correct `nba-finals` winner) stays unchanged.

The current "right team won some other series" loose rule is **removed** and replaced by the rule above.

## Worked example (E, east-semi-bottom)

- E's picks: `east-r1-2v7 → BOS`, `east-r1-3v6 → NYK`, `east-semi-bottom → NYK in 6`
- E's assumed matchup for east-semi-bottom: **BOS vs NYK**
- Actual: PHI beat BOS in r1; semi was **PHI vs NYK**, NYK in 4
- Right winner (NYK), wrong assumed opponent (BOS vs actual PHI) → **1 pt** (was 2 before)

## Series with no feeders (First Round)

- The "assumed opponent" is the other fixed team in the slot, so it always equals the actual opponent.
- First Round picks therefore can only score 0 / 2 / 3 — never 1.

## Edge cases

- **Missing parent pick:** if the user never picked one of the two feeder series, fall back to treating the assumed opponent as the actual opponent (so they can still earn 2/3 pts and never get downgraded to 1 because of an empty slot).
- **Series not yet decided:** 0 pts, same as today.
- **Wrong winner:** always 0. We are not keeping any "but they won elsewhere" credit.

## Technical implementation

Files to touch:

1. **`src/lib/pickScoring.ts`** — rewrite `scorePick`:
   - Add params for the bracket series list and the picker's full pick set (already passed for loose detection).
   - Add the actual results map so we can resolve the actual opponent (winners of `topParentSeriesId` / `bottomParentSeriesId`).
   - Use existing `getAssumedOpponentAbbr(seriesId, pickedWinner, bracketSeries, userPicks)` from `src/data/playoffsData.ts` to get the assumed opponent.
   - Compute actual opponent from `series_results` of the two parent series (or the static slot teams for First Round).
   - Apply the new 3/2/1/0 table above. Drop the `actualWinners`/`alreadyScored` block.
   - Update `PickPointKind` semantics: `loose` now means "right winner, wrong assumed opponent."

2. **`src/pages/Scoreboard.tsx`** — its inline `computeScoreboard` mirrors the same logic; rewrite the loose-pick pass to use assumed-vs-actual opponent (importing `bracketSeries` + `getAssumedOpponentAbbr`). Per-user totals will shift; verify against E (expected: still 13 pts since none of E's loose picks under the old rule survive, but east-semi-bottom drops 2 → 1, while a previously-zero loose pick may now score 1 — re-tally during implementation).

3. **`src/components/MatchDetailDialog.tsx`** — replace the local `computePts` / `effectivePts` with a call to the updated `scorePick`, passing the picker's full picks + all series_results + bracketSeries (already available via existing hooks). This finally aligns the drawer with the Scoreboard, as discussed.

4. **`src/test/computeScoreboard.test.ts`** — update existing loose-pick test ("right team, wrong series") and add new cases:
   - Right winner, wrong assumed opponent → 1
   - Right winner, right assumed opponent, wrong games → 2
   - Right winner, right assumed opponent, right games → 3
   - Wrong winner whose team won elsewhere → 0 (regression of removed rule)
   - Missing parent pick → falls back to actual opponent (no downgrade)

## What will NOT change

- DB schema (no new "predicted opponent" column — we derive it from the user's bracket).
- UI of the drawer beyond the corrected number/label.
- Champion bonus rule.
