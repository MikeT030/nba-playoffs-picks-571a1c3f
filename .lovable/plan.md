# Fix: Conference Finals & NBA Finals show TBD instead of predictions

## What's wrong

The "freeze one round ahead" rule is cascading too far.

When PHI's Round 1 series is in progress:
- Conf Semis slot → correctly frozen to TBD ✓
- Conf Finals slot → tries to fill from Conf Semis. But Conf Semis already returned `undefined / undefined` (frozen), so the lookup `parentWinner === pTop?.abbreviation` evaluates against `undefined`, returns `undefined`, and the slot stays TBD. ✗
- NBA Finals → same cascade. ✗

The intent was: freeze ONLY the direct child of an in-progress series. Predictions for later rounds (whose own parents haven't tipped off yet) should remain visible.

## Fix

Single change in `src/data/playoffsData.ts` inside `resolveSeriesTeams` → `fillFromParent`:

When recursing to resolve the parent's predicted pair (used purely as a lookup to map `parentWinner` abbreviation → full `Team` object), call `resolveSeriesTeams` WITHOUT `inProgressPairs` in the ctx. Keep `actualWinners` so real results still take precedence.

Then apply the freeze check only against THIS parent's pair. If that pair isn't in `inProgressPairs`, fall back to the predicted winner as before.

```ts
const fillFromParent = (parentId: string): Team | undefined => {
  const parentWinner = picks[parentId];
  if (!parentWinner) return undefined;
  const parentSeries = seriesList.find((s) => s.id === parentId);
  if (!parentSeries) return undefined;

  // Resolve parent's predicted pair without the freeze, so predictions
  // chain forward through later rounds whose own parent hasn't started.
  const lookupCtx: ResolveCtx = { actualWinners: ctx.actualWinners };
  const { topTeam: pTop, bottomTeam: pBottom } =
    resolveSeriesTeams(parentId, picks, seriesList, lookupCtx);

  // Freeze only the IMMEDIATE child of an in-progress series.
  const parentDecided = !!ctx.actualWinners?.[parentId];
  if (!parentDecided && ctx.inProgressPairs && pTop && pBottom) {
    const key = pairKey(pTop.abbreviation, pBottom.abbreviation);
    if (key && ctx.inProgressPairs.has(key)) return undefined;
  }

  return parentWinner === pTop?.abbreviation ? pTop : pBottom;
};
```

## Resulting behavior

- R1 series in progress (e.g. PHI vs opponent) → Conf Semis slot for that branch shows TBD with the red ✗ "(vs. <predictedOpp>)" tagline. ✓
- Conf Finals & NBA Finals → keep showing the user's prediction (since their own parent series haven't started yet). ✓
- Once a Conf Semis actually tips off and is undecided, its child (Conf Finals) becomes TBD. Same rule, applied one round deeper.
- Saved picks list ("That's what you've picked") untouched.

## Files

- `src/data/playoffsData.ts` (only)
