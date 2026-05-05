In `src/components/AdminFlyerAwardPanel.tsx`:

1. Include `burned_at` in the `flyer_card_assignments` query.
2. Add a `burnedMap: Record<CardId, boolean>` state, populated in `load()` from `burned_at != null` per card.
3. Replace the check-mark condition next to each card label so it reads from `burnedMap[card.id]` instead of the demo `burned[card.id]`.

Net effect: the check mark next to Paxson/Miller/Davis appears only when the persisted assignee has burned their pack in the real DB. Saving an assignment does nothing visually; demo "Pick 3 random" no longer flips the marks.