# Admin Panel: Award "Flyer – The Shot" Cards

Add an admin-only panel on `/admin` that computes current standings and lets you assign each of the 4 Flyer cards (Chapman, Paxson, Miller, Davis) to a user — defaulting to the current top 4.

## What the user sees

A new accordion section on the Admin page titled **"Flyer – The Shot · Award Cards"**, containing:

1. **Live standings table** — top 10 users with current points (computed with the same scoring logic used on the Leaderboard).
2. **4 assignment rows**, one per card:
   - Card name + small preview thumbnail (Chapman / Paxson / Miller / Davis)
   - A user dropdown, pre-selected with the current top-4 user for that slot
   - Current assignee badge (if already assigned)
3. A **"Save assignments"** button that persists all four at once, plus a **"Reset to current top 4"** button.
4. A confirmation toast on save. Re-assigning a card to a different user replaces the previous holder.

Tie handling: when users are tied (e.g. Simon and Hannes L both at 10), the dropdown shows all tied users so you choose; the default order falls back to earliest pick `created_at`.

## Data model

New table `flyer_card_assignments`:

```text
card_id    text   primary key   -- 'chapman' | 'paxson' | 'miller' | 'davis'
user_id    uuid   not null
assigned_at timestamptz default now()
assigned_by uuid                 -- admin who assigned
```

- RLS: SELECT public (so the holder can see their card later); INSERT/UPDATE/DELETE restricted to `has_role(auth.uid(), 'admin')`.
- `card_id` as PK guarantees only one holder per card. Reassigning = upsert on `card_id`.
- Kept separate from `player_card_assignments` so the existing roulette flow (one random "Career Lowlight" per user, queried with `.maybeSingle()`) is untouched.

## Implementation

1. **Migration** — create `flyer_card_assignments` with the schema + RLS policies above.
2. **Hook** `useFlyerAssignments` — fetch all 4 rows, expose `{ assignments, upsert(cardId, userId), loading }`.
3. **Hook** `useStandings` — batched query of all `picks` + `series_results` + `profiles`, runs `totalUserPoints` from `src/lib/pickScoring.ts` per user, returns sorted `[{ user_id, display_name, points }]`. Reused by the panel (and available for future use on the Scoreboard if we want to dedupe later).
4. **Component** `AdminFlyerAwardPanel.tsx`:
   - Renders standings table + 4 assignment rows
   - Card metadata (id, label, thumb) hardcoded from the existing 4 `DemoFlyerCard*` exports
   - "Save" calls `upsert` for each changed row
5. **Admin.tsx** — add a new accordion item above the demo previews section that mounts `AdminFlyerAwardPanel`.

## Out of scope (can follow up)

- Showing the awarded card to the recipient on their profile / homepage.
- Notifying the recipient.
- Auto-recomputing assignments as more series finish (this panel stays manual; you click "Reset to current top 4" whenever you want to re-snap).

## Current top 4 (for reference, will be the initial defaults)

1. Simon — 10
2. Hannes L — 10
3. Larsn — 8
4. Axlzander — 8
