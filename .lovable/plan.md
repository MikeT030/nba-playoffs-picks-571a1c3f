## What you want, in one sentence

The bracket should always preview the **user's predicted path** all the way to the Finals. Reality only overwrites a slot when the parent series of that slot is **actually decided** — and at that moment the pick gets evaluated and its tagline adapts accordingly.

## Why it currently shows TBD in CF / Finals

Today's model (`computeBracketState` in `src/data/playoffsData.ts`) has two override layers:

1. `actualWinners[parent]` → real team (correct, keep this).
2. `inProgressPairs.has(pair)` on the **parent's resolved pair** → forcibly sets that parent's `winnerTeam` to `undefined`, which cascades into every downstream slot.

Rule 2 is the culprit. As soon as PHI's R1 series (or any earlier series) goes "in progress," its `winnerTeam` becomes undefined → East Semi top slot has no team → East CF slot has no team → Finals top slot has no team → "TBD vs TBD" up the chain. The freeze was meant to stop predictions from leapfrogging a live series, but it also kills the very preview you want to keep.

## The new model: predict-by-default, override-with-reality-when-decided

Per series S with parents (P1, P2):

```text
slotTop    = actualWinners[P1] ? team(actualWinners[P1])
           : userPick[P1]      ? team(userPick[P1])
           : undefined
slotBottom = same with P2
```

For Round 1, slots stay the static seed teams (no parents). Real-life winner of S itself still drives `actualWinners[S]` and the green "ADV" / scoring overlay — that part is unchanged.

Properties:
- A live R1 series no longer blanks downstream rounds. Predictions keep flowing.
- The moment a parent series finalizes, its slot in the child card flips from "your predicted team" to "the actual advancing team." That's the trigger point for tagline adaptation on the child card.
- No leapfrogging: the slot for a series whose parent is undecided uses **the user's pick for that parent**, never a pick made two rounds upstream. So if you skipped a Semi pick, the CF slot is genuinely TBD — exactly what an empty slot in a chain *should* mean. Distinct from "TBD because something earlier is live", which we no longer do.

## Tagline adaptation — four cases unified

The card already computes `actualPair` (the slot teams as currently displayed) and `predictedPair = [bet.winner, predictedOpp]` via `getAssumedOpponentAbbr`. Once we apply the new model, `actualPair` is "real teams where decided, else predicted teams" — so `matchCount` already encodes the four cases we care about, with one tweak:

| Case | Condition | Tagline | Color |
|---|---|---|---|
| 1. 100% true | `matchCount === 2` | `Your Pick: X in N` | primary (current) |
| 2. 50% true, your team made it | `matchCount === 1` AND `actualPair.includes(bet.winner)` | `Your Pick: X in N (vs. predicted Y)` | primary |
| 3. 50% true, your winner is the no-show | `matchCount === 1` AND `!actualPair.includes(bet.winner)` | same suffix pattern | **rose** (pick already dead) |
| 4. 0% true | `matchCount === 0` | same suffix pattern | **rose** |

Trigger for cases 2–4: at least one parent of S is decided (so `actualPair` contains a real team that can disagree with the prediction). Until then the preview is purely your predictions and `matchCount` is 2 by construction.

Detail: today's code only marks `isBroken` when `matchCount === 0`. Extend it to also mark broken (rose) when the user's winner isn't in `actualPair`. That's the only behavioral change to the card itself.

## Edge cases to handle

- **Skipped intermediate pick.** You picked R1 + CF but no Semis. The CF slot has no source (`userPick[semi]` undefined, parent undecided) → genuine TBD on that one slot. Show the existing "make your pick" empty state. The Finals card still resolves its own slot from your CF pick, so the Finals can preview even with a Semi gap. That matches your stated intent: predictions display wherever they exist; gaps stay gaps until you fill them.
- **Champion bonus on a broken Finals.** If the Finals slot teams are now real and don't include your champion pick, show rose tagline; scoring/champion bonus already keys off `actualWinners["nba-finals"]`, unaffected.
- **`getAssumedOpponentAbbr`** still walks the user's *own* picks for the predicted opponent — exactly right for "(vs. predicted Y)" even when reality differs.
- **Match-detail / Scoreboard** views use `propagateRealWinners: true` and read `actualWinners` directly. They don't depend on the freeze rule, so unaffected.
- **`useBracketData.inProgressPairs`** stops being consulted by `computeBracketState`. We keep computing it (other call sites may still want it, e.g. the live "in progress" badge), but remove it from `ResolveCtx`/`computeBracketState`. Safer than ripping out the producer.
- **R1 play-in placeholders** (`PIW7`, etc.) keep their current resolve-from-API path via `resolvePlayInSlotsOnly` / `resolveBracketWithApiGames`. No change.

## Files to change

- `src/data/playoffsData.ts`
  - In `computeBracketState`: drop the `inProgressPairs` branch entirely. Keep: real-winner override, then user-pick fallback, then undefined.
  - Leave `ResolveCtx.inProgressPairs` field in the type (still produced by `useBracketData`) but ignore it in resolution. Add a doc comment that resolution is prediction-first.
- `src/components/PlayoffBracket.tsx`
  - Extend the broken-pick condition: `isBroken = matchCount === 0 || (matchCount === 1 && !actualPair.includes(bet.winner))`.
  - Keep the existing rose color path; it already handles `isBroken`.
  - Drop the special-case `isFirstRound` fallback in `resolve()` — with the new model, R1 slots already keep their static teams (no parents to override).
- `src/pages/MyPicks.tsx` and `src/hooks/useBracketData.ts`
  - No logic changes required. `inProgressPairs` keeps being passed through but is now a no-op for slot resolution.

## Tests (in `src/test/`)

Add a unit test file for `computeBracketState` covering:

1. R1 in progress, no real winners yet → CF and Finals slots filled from user picks (regression vs current TBD behavior).
2. One Semi parent decided, the other not → CF top slot is the actual advancing team, CF bottom is the user's pick for the other Semi.
3. Both CF parents decided, user's Finalist not in either → Finals slot teams are the two actual conf champs (case 4: tagline should go rose). Assert via the bracket card snapshot or by checking `actualPair` membership in component test.
4. Skipped Semi pick, CF pick exists → CF slot for that side is undefined; Finals slot still resolves from CF pick.

## Out of scope

- No DB / picks-table schema changes.
- No layout changes; only the tagline color/suffix rules adapt.
- Saved-picks list and scoring rules unchanged.

## Summary

Today the freeze-on-in-progress rule is doing exactly the opposite of what you want: it blanks the future the moment the present starts. Removing it makes the bracket prediction-first and reality-overriding-per-slot, which lines up cleanly with your four-case tagline model and gets rid of every spurious TBD in CF and the Finals.
