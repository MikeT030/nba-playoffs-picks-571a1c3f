## Goal

On `/my-picks`, the **bracket** cards from Round 2 onward should show the actual real-life teams that have advanced (like Scoreboard/Home). The "Your Pick" tagline below each bracket card adapts based on how much the user's predicted matchup overlaps with the actual matchup.

The **"That's what you've picked"** list further down the page (the `PickCard` accordion view) is **NOT touched** — it always shows the user's original predicted matchups exactly as saved, regardless of real-life results.

## Tagline rules (bracket cards only)

| Overlap | Tagline behavior |
|---|---|
| **2/2 teams match** | Normal tagline, no suffix. ✓/✗ if decided. |
| **1/2 teams match** | Normal tagline + ` (vs. <predictedOpp>)`. ✓/✗ if decided. |
| **0/2 teams match** | Red text + ✗ prefix + ` (vs. <predictedOpp>)`. No strikethrough. No points tag. |

## Changes

### 1. `src/pages/MyPicks.tsx`
- Restore propagation in the bracket: `useBracketData(2025)` (drop `{ propagateRealWinners: false }`).
- The "That's what you've picked" section continues to render `PickCard` from the user's saved `bets` against the **original** `bracketSeries` topTeam/bottomTeam (predicted matchups). Confirm it does not get switched to `activeBracket`.

### 2. `src/components/PlayoffBracket.tsx` — `BracketCard` tagline block
Replace the current "broken / showAssumed" logic with explicit overlap counting:

- `predictedOpp = getAssumedOpponentAbbr(seriesId, bet.winner, seriesList, allPicks)`
- `actualPair = [topTeam, bottomTeam].map(t => t?.abbreviation).filter(Boolean)`
- `predictedPair = [bet.winner, predictedOpp].filter(Boolean)`
- `matchCount = predictedPair.filter(t => actualPair.includes(t)).length`

Render:
- `matchCount === 2` → no suffix, primary (or rose if decided & wrong).
- `matchCount === 1` → suffix `(vs. <predictedOpp>)`, primary (or rose if decided & wrong).
- `matchCount === 0` → red text, ✗ icon prefix, suffix `(vs. <predictedOpp>)`, no strikethrough, hide points tag.
- Decided ✓/✗ indicator keeps its current behavior when `matchCount >= 1`.

## Files

- `src/pages/MyPicks.tsx` — drop the `propagateRealWinners: false` option (verify "That's what you've picked" section stays on the original `bracketSeries`).
- `src/components/PlayoffBracket.tsx` — rewrite tagline block in `BracketCard` using 2/1/0 overlap rule.

`useBracketData` flag and `resolvePlayInSlotsOnly` helper stay (harmless) for potential reuse.

## Untouched

- "That's what you've picked" `PickCard` list — always original predicted matchups.
- Scoreboard, Home, Match views.
- Scoring logic, ADV badges, series scores, championship section, play-in TBD resolution.
