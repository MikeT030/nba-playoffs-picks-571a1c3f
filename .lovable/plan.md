# Make the bracket honor user picks consistently

## What's wrong today

`resolveSeriesTeams` is asked, per slot: *"who fills you?"* It then looks at `picks[parentId]` directly. Two failure modes fall out of this:

1. **Missing intermediate pick = TBD wall.** If you didn't pick a Conf-Semi winner but you *did* pick the Conf-Finals winner, the Conf-Finals slot can't find `picks[east-semi-top]` and shows TBD — even though it could derive the team from your R1 picks. Meanwhile the *Finals* slot, asking the same question one level up, happens to have your Conf-Finals pick, recurses through the missing semis with `lookupCtx`, and ends up filled. Result: East Conf Finals is TBD/TBD but the Finals shows PHI vs SAS.
2. **The "freeze in-progress series" rule only freezes the *immediate* child** because the recursion intentionally drops `inProgressPairs` from `lookupCtx`. So PHI losing its R1 series can still appear in the Finals as long as you picked them at every later round.

These are both symptoms of the same root cause: we resolve each slot independently and re-derive the upstream chain on the fly, with different rules at different depths.

## Proposed model: one forward pass, one source of truth per series

Compute, exactly once, an `effectiveWinner: Record<seriesId, string | undefined>` for the whole bracket, walking rounds in order (R1 → Semis → CF → Finals). For each series:

```text
1. realWinner   = actualWinners[id]                     // series decided in real life
2. realPair     = (top, bottom) once both are known     // computed from effectiveWinner of parents
3. inProgress   = realPair && inProgressPairs.has(pairKey(realPair))
4. effectiveWinner[id] =
     realWinner                       if present
   else undefined                     if inProgress     // freeze: don't predict over a live series
   else picks[id]                     if user picked it AND that team is one of the (possibly predicted) parent teams
   else undefined                     // genuinely unknown → TBD
```

Slot teams for a series become:
```text
topTeam    = effectiveWinner[topParentSeriesId]    (or static topTeam for R1)
bottomTeam = effectiveWinner[bottomParentSeriesId] (or static bottomTeam for R1)
```

Why this fixes both cases:

- **Missing semi pick.** When deriving the East Conf Finals slot, we ask `effectiveWinner[east-semi-top]`. If you didn't pick that semi, the rule falls through to "predict from `picks[east-semi-top]`"... which is empty → undefined → TBD. **But** we still want your *Conf-Finals pick* to count once both CF slots resolve. The trick: we treat "no semi pick" as a soft block — the CF slot stays TBD until either (a) you make the semi pick or (b) reality fills it. The Finals can no longer leapfrog to PHI vs SAS because `effectiveWinner[east-conf-finals]` requires both CF slot teams to exist. So: **East CF TBD ⇒ Finals top slot also TBD.** Consistent.
- **PHI losing R1.** `inProgressPairs` is checked at every level in the same pass. Once PHI's R1 pair is "in progress", `effectiveWinner[east-r1-2v7]` is `undefined`. That cascades: East Semi top slot loses its bottom team → its `effectiveWinner` is `undefined` → CF slot bottom is `undefined` → Finals top is `undefined`. Predictions only flow as far as the live front line allows. No more PHI in the Finals while losing R1.

The user's stated intent — *"predictions remain visible until a real series starts"* — is satisfied at every level, not just one.

## Optional nicety: "preview chain" mode

If you want the Conf Finals card to *visually preview* "PHI vs your-other-pick" even when you skipped the semis, add a second pass that fills `undefined` slots from `picks[parentId]` purely for **display**, but never feeds back into `effectiveWinner` (so the Finals still doesn't auto-fill from a skipped chain). I'd default this **off** — it's exactly the kind of "magic backfill" that confused things in the first place. Better UX: show a small "make your pick" affordance on the empty slot.

## Files to change

- `src/data/playoffsData.ts`
  - Replace the recursive `resolveSeriesTeams` with two functions:
    - `computeEffectiveWinners(picks, seriesList, ctx) → Record<id, string|undefined>` (single forward pass, rounds in order).
    - `resolveSeriesTeams(seriesId, effectiveWinners, seriesList) → { topTeam, bottomTeam }` (pure lookup, no recursion, no `picks` arg).
  - Keep `ResolveCtx` (`actualWinners`, `inProgressPairs`).
  - `getAssumedOpponentAbbr` stays as-is (it's about the user's *own* predicted opponent, not the live bracket).

- `src/components/PlayoffBracket.tsx`
  - Compute `effectiveWinners` once at the top of the component, pass to `resolve`. Drop the special-case "fall back to static R1 teams" — it falls out of the new model naturally.

- `src/pages/MyPicks.tsx`, `src/hooks/useBracketData.ts`, anywhere else calling `resolveSeriesTeams(id, picks, list, ctx)`
  - Compute `effectiveWinners` once per render, pass it instead of `picks`.

- Add a unit test in `src/test/` covering the three scenarios:
  1. R1 in progress → that slot's children all TBD; siblings still predict.
  2. R1 picks + Finals pick, no semi/CF picks → CF and Finals both TBD (no leapfrog).
  3. Full pick chain, no real results → entire bracket previews user's path.

## Out of scope

- No DB / picks-table changes.
- No UI redesign — same cards, same layout.
- Saved-picks list ("That's what you've picked") is unaffected; it reads `bets` directly.

## Summary

Today's bug isn't really about the freeze rule — it's that each slot resolves itself in isolation, with different recursion rules. Replacing that with one deterministic forward pass keyed on `effectiveWinner[id]` gives you a single rule applied uniformly to every round, and both the "TBD wall" and "PHI in the Finals" symptoms disappear together.
