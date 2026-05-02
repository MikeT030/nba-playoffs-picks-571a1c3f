## Goal

Append `(vs. ABBR)` to the "Your Pick" line on every match card, where `ABBR` is the **opponent the user predicted to face their picked winner** (Option A). On mismatches with reality, no warning is shown — we just display the user's assumed opponent.

Example: `Your Pick: SAS in 7 (vs. DEN)` even if the real series is SAS vs. MIN.

## Where

`src/components/MatchCard.tsx` — the `Your Pick` block (lines 273–290).

## How to derive the assumed opponent

For the bracket series the card resolves to (already computed via `getBracketSeriesIdForMatch` in `useUserBet`):

1. **First Round slot** (`bracketSeries[i].topTeam` / `bottomTeam` are fixed teams):
   - Opponent = whichever of `topTeam` / `bottomTeam` is **not** `bet.winner`.

2. **Later round slot** (`topParentSeriesId` / `bottomParentSeriesId`):
   - Look up the user's pick winner for each parent series in `allPicks`.
   - The two parent-winners are the user's assumed semis/finals matchup.
   - Opponent = whichever parent-winner is **not** `bet.winner`.
   - If a parent pick is missing, no opponent suffix is rendered.

3. If `bet.winner` does not appear in the assumed pair (data inconsistency), render no suffix.

## Implementation steps

1. In `useUserBet` (or directly in `MatchCard`), expose `bracketSeriesId`, `bracketData`, and `allPicks` so we can compute the opponent.
2. Add a small helper `getAssumedOpponent(bracketSeriesId, winnerAbbr, bracketData, allPicks): string | null` in `src/data/playoffsData.ts` next to `getBracketSeriesIdForMatch`. It implements the two cases above and returns the abbreviation or `null`.
3. Update the JSX:
   ```tsx
   Your Pick: <b>{bet.winner}</b> in <b>{bet.gamesInSeries}</b>
   {opponent ? <> (vs. {opponent})</> : null}
   ```
   The `· N Points` segment continues to render after this.
4. Apply the same change to `MatchDetailDialog.tsx` if/where it shows the same "Your Pick" line, so card and detail stay consistent. (Will verify during implementation.)

## Notes

- Spacing: `(vs. DEN)` with a space after the period (standard typography). Confirmed earlier.
- No visual indicator when assumed opponent ≠ real opponent — purely Option A.
- `DemoMatchCardColored` uses a hardcoded demo string and is unaffected unless you want it updated too (let me know).
