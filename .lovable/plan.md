## Goal

Make the broadcast drawer appear for **everyone** (logged-in users without a card included) the first time they load the app after any winner burns their pack — not only for the other winners.

## Current behavior

In `src/components/AwardDrawerHost.tsx`, the broadcast condition requires `!!myAssignment`:

```ts
const showBroadcast =
  !showReceiver &&
  !!myAssignment &&            // ← restricts to winners only
  !!latestBurn &&
  latestBurn !== lastSeen &&
  closed?.key !== latestBurn;
```

So non-winners never see it.

## Change

Drop the `!!myAssignment` requirement from `showBroadcast`. Keep everything else:

- Receiver drawer still only shows for users who own an unburned card.
- Broadcast still only fires once there's at least one `burned_at` timestamp on any assignment.
- Per-user `localStorage` key (`flyer.lastSeenBurnedAt.{uid}`) still dedupes so each user sees a given burn event only once.
- Anonymous (logged-out) visitors still see nothing — the early `if (!user) return null;` stays.

Resulting condition:

```ts
const showBroadcast =
  !showReceiver &&
  !!latestBurn &&
  latestBurn !== lastSeen &&
  closed?.key !== latestBurn;
```

## Files

- `src/components/AwardDrawerHost.tsx` — one-line edit to the `showBroadcast` expression.

## Notes / edge cases

- A winner who hasn't burned yet still gets the receiver drawer first (broadcast is gated by `!showReceiver`), so no behavior change for them.
- A winner who has already burned will continue to see the broadcast drawer once per new burn, same as today.
- The "latest burn" timestamp is computed from the realtime-updated `assignments` list, so non-winners will get the drawer live the moment the first burn lands while their tab is open.
- No DB, RLS, or schema changes needed — `flyer_card_assignments` is already publicly readable.