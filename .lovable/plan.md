I found the root cause: the current lookup checks “direct team pair” before it checks what round the card is in. That means the First Round DEN vs MIN card can match the static bracket slot `west-r1-3v6`, but the broader logic can still become unsafe when the same two teams appear as resolved/current participants in another bracket context. The fix should make the lookup round-aware and parent-slot-aware, not just team-pair-aware.

Plan:

1. Update `getBracketSeriesIdForMatch` in `src/data/playoffsData.ts`
   - First try to map by the card’s own `match.id` if it is already a known bracket series id.
     - Example: First Round DEN vs MIN should resolve immediately to `west-r1-3v6`.
   - Then restrict all team-pair matching by both:
     - `match.round`
     - `match.conference`
   - Direct matching will only consider bracket slots in the same round/conference as the visible card.
     - Example: A First Round DEN vs MIN card cannot resolve to `west-semi-bottom`.
     - Example: A Conference Semis MIN vs SAS card cannot resolve to `west-r1-3v6`.

2. Make parent-walking recursive and slot-specific
   - Use confirmed `series_results` to derive the expected teams for later-round bracket slots.
   - Only match a later-round slot when both parent winners are known and exactly equal the visible matchup pair.
   - This keeps MIN vs SAS mapped to `west-semi-bottom` after these results exist:
     - `west-r1-3v6 = MIN`
     - `west-r1-2v7 = SAS`

3. Prevent wrong fallback behavior
   - If no strict same-round/same-conference bracket slot is found, return `match.id`.
   - That means no unrelated picks are displayed rather than showing picks from the wrong series.

4. Add focused tests for the bug cases
   - DEN vs MIN, First Round -> `west-r1-3v6`
   - MIN vs SAS, Conference Semifinals with confirmed parent results -> `west-semi-bottom`
   - MIN vs SAS without confirmed parent results -> fallback to `match.id`, so no incorrect picks bleed in
   - DEN vs MIN must never resolve to the semis slot

5. Verify the UI paths using the same corrected helper
   - `MatchCard.tsx` already calls the shared helper.
   - `MatchDetailDialog.tsx` already calls the shared helper.
   - After the helper is fixed, both the card “Your Pick” line and detail drawer “All Picks” list will use the same safe mapping.

Expected result:

- On the DEN vs MIN First Round matchup, the app will show picks from `west-r1-3v6` only: the 11 DEN picks.
- It will not show the later-round `west-semi-bottom` picks on the DEN vs MIN card.
- On the MIN vs SAS Conference Semis matchup, once the parent results are confirmed, the app will show picks from `west-semi-bottom`: 7 DEN and 4 SAS.
- It will not invent/show MIN picks for the semis unless someone actually picked MIN for `west-semi-bottom`.