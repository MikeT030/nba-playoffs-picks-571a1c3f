# Deadpool Recap — Admin Demo

A self-contained demo on `/admin` that proves the Deadpool game-recap concept end-to-end. No production caching, cron, or drawer integration yet — just enough to compare AI models side-by-side and decide if the output is good enough to roll out.

## Entry point

In `src/pages/Admin.tsx`, swap one accordion item:
```ts
{ value: "match-card-colored", label: "DEMO MATCH CARD — TEAM COLORS",
  content: <DemoMatchCardColoredWithRecap /> }
```

Behavior: the accordion expands as today and shows the existing colored match card. **Tapping the card** opens a bottom drawer that generates and shows the Deadpool recap. No new buttons on the card itself.

## Drawer contents (`DeadpoolRecapDrawer`)

```text
┌─────────────────────────────────────┐
│  WADE'S TAKE                        │
│  Final · LAL 112 — 108 DEN · OT     │
├─────────────────────────────────────┤
│  Game source:  ◉ Sample  ○ Latest   │
│  Model:        [ gemini-3-flash ▼ ] │
│                                     │
│  ┌─ skeleton ─┐  →  recap text...   │
│                                     │
│  327 / 400 chars                    │
│                                     │
│  [Regenerate]   [Copy]              │
│                                     │
│  ▸ Inputs sent to model             │
└─────────────────────────────────────┘
```

- **Voice is fixed to Deadpool** — written text only, no audio/video.
- **Model picker** — `google/gemini-3-flash-preview` (default), `google/gemini-2.5-flash`, `openai/gpt-5-mini`. Lets us A/B output quality.
- **Game source** — *Sample* (a baked-in Final game so the demo never blanks out) or *Latest* (most recent finished playoff game pulled live via the existing `nba-api` function).
- **Regenerate** — recalls the function, no caching.
- **Copy** — copies the generated text.
- **Char counter** — visible so we can judge whether 400 is the right cap.
- **Collapsible "Inputs"** — shows the exact fact sheet sent to the model (teams, final score, quarter scores, OT, date) for transparency while we tune.

## Edge function: `demo-game-recap`

Single new function, **no DB writes**. Body:
```json
{ "game_id": 15908525, "model": "google/gemini-3-flash-preview" }
```

Logic:
1. Fetch the game from balldontlie via the existing pattern (reuses `BALLDONTLIE_API_KEY`).
2. Build a fact sheet (teams, final score, quarter scores, OT, date).
3. Call Lovable AI Gateway with the **Deadpool system prompt** + fact sheet. Hard cap ~400 chars, no markdown, no emojis, no profanity, no future-game spoilers, max one chimichanga reference.
4. Return `{ summary, factsheet, model }`. Surface 429/402 cleanly so the drawer can toast them.

## What this deliberately skips

- No `game_recaps` table, no caching.
- No cron sweeper.
- No changes to `MatchDetailDialog` or any user-facing route.
- No admin-only RLS plumbing — the demo function is public like the existing `nba-api`.

Once the output feels right, we lift the same edge-function logic into the cached + cron'd production version (the earlier full plan).

## Technical details

**Files to add**
- `supabase/functions/demo-game-recap/index.ts` — fact sheet builder + Lovable AI call.
- `src/components/DemoMatchCardColoredWithRecap.tsx` — wraps existing `DemoMatchCardColored`, adds tap handler that opens the drawer.
- `src/components/DeadpoolRecapDrawer.tsx` — drawer UI (uses existing `ui/drawer`), model picker, game-source toggle, regenerate, copy, char counter, inputs panel.

**Files to edit**
- `src/pages/Admin.tsx` — point the one accordion item at `DemoMatchCardColoredWithRecap`.

**Lovable AI**
- Default model: `google/gemini-3-flash-preview`. Prompt lives only on the backend — easy to tune later without a frontend redeploy.
