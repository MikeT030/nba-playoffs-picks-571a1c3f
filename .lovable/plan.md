# Ship Award Cards for Real (DB-backed)

Move the flyer-award flow off `localStorage` and onto the existing `flyer_card_assignments` table, with realtime sync, then wire the auto-opening receiver/broadcast drawers from the previous plan on top.

## 1. Database migration

- Add columns to `public.flyer_card_assignments`:
  - `burned_at timestamptz null`
  - `round text not null default 'first_round'`
- Unique constraint: `(round, user_id)` and `(round, card_id)` — one card per user per round, no duplicates.
- New RLS policy: authenticated users can `UPDATE` their own row to set `burned_at`:
  - `using (auth.uid() = user_id) with check (auth.uid() = user_id and burned_at is not null)`
- Enable realtime:
  - `ALTER TABLE public.flyer_card_assignments REPLICA IDENTITY FULL;`
  - `ALTER PUBLICATION supabase_realtime ADD TABLE public.flyer_card_assignments;`

## 2. New runtime module: `src/lib/flyerState.ts`

Replaces `flyerDemo.ts` (keep the old file until call sites are migrated, then delete). Exports:

- `useFlyerState()` — selects all assignments for the current round, subscribes via `supabase.channel('flyer').on('postgres_changes', { table: 'flyer_card_assignments' }, ...)`. Returns `{ winners, burned, myCardId, loading }`.
- `burnMyCard()` — `update flyer_card_assignments set burned_at = now() where user_id = auth.uid()`.
- `getCardForUser(userId)` — derived from the fetched rows.

## 3. Admin panel: `src/components/AdminFlyerAwardPanel.tsx`

- Replace `setDemoWinners(...)` with a Supabase write:
  - Delete existing rows for the current round, then insert one row per winner (`user_id`, `card_id`, `assigned_by = auth.uid()`, `round = 'first_round'`).
- "Pick random" / "Clear" buttons now hit the DB.
- Keep the demo preview drawers for admins to inspect both modes against live data.

## 4. Receiver drawer: `src/components/AdminFlyerAwardDemoDrawer.tsx`

- Remove the claim/unclaim mechanic. Cards are pre-assigned, so the receiver just sees their own card.
- "Burn" calls `burnMyCard()` instead of `markDemoCardBurned()`.
- Rename file/component to `FlyerAwardDrawer` for clarity.

## 5. Global auto-open host: `src/components/AwardDrawerHost.tsx`

Mounted once in `src/App.tsx` inside `AuthProvider`:

- Reads `useFlyerState()` + `useAuth()`.
- If current user has an assignment with `burned_at = null` → render `FlyerAwardDrawer mode="receiver"`, open. Closes only after they burn.
- Else, if user is a winner and the set of `burned_at` values has changed since the last value they saw (tracked per-device in `localStorage` key `flyer.lastSeenBurnedAt.<userId>`), open the drawer in `mode="broadcast"`. On close, persist the latest `max(burned_at)` they've seen.
- Receiver mode wins over broadcast.

## 6. Surface flyer cards beyond the drawer

- `src/pages/Settings.tsx`: existing "FLYER – THE SHOT" block already renders below "THAT'S YOU" — switch its data source from `useDemoFlyerState` to `useFlyerState`.
- `src/pages/Scoreboard.tsx`: in the player-card drawer, after fetching `flyer_card_assignments`, append one extra slide per player who also has a flyer card. Render with `<FlyerCardForId cardId=... defaultOpened hideHeading />`.

## 7. Cleanup

- Delete `src/lib/flyerDemo.ts` and rename `useDemoFlyerState` references.
- Remove the "demo" wording from admin labels now that it's real.

## Notes / risks

- Broadcast "seen" tracking is per-device. If you want cross-device consistency later, add a small `flyer_broadcast_seen (user_id, last_seen_burned_at)` table — not required for v1.
- The new `UPDATE` RLS policy intentionally only allows users to set `burned_at` on their own row; admins still manage everything else via the existing admin policies.
- After the migration, an admin must re-assign winners once via the admin panel — the localStorage demo state does not migrate over.
