
# Enrich Wade's recap with crucial game moments

Right now Wade only sees the final score, quarter scores (sample only), date, round, and game number. The recaps end up generic ("they remembered to play in the 4th"). Goal: feed Wade 2–3 concrete moments per game so he can drop one or two into the snark naturally — top scorer, a hot shooter, or a quarter swing — without losing the 400-char cap or the voice.

## Scope

Three files. No DB schema. No scoring. Drawer UI gets one new collapsible row.

- `supabase/functions/demo-game-recap/index.ts` — accept `highlights: string[]` on the factsheet and add prompt instructions to weave 1–2 in.
- `src/components/DeadpoolRecapDrawer.tsx` — when a real NBA game is picked, fetch player box scores via the existing `nba-api` proxy (`endpoint=stats&game_ids[]=<id>`) and derive highlight strings. For the sample, hardcode 2 highlights. Show them in a small collapsible "Key moments" block above the recap so the user can see what Wade was given. Pass them into the function call.
- `src/lib/nbaApi.ts` — add a thin `getGameStats(gameId)` helper + a minimal `NbaPlayerStat` type. No other changes.

## How highlights are derived

From `stats?game_ids[]=<id>&per_page=100`:

1. **Top scorer overall** — `LastName Xpts/Yreb/Zast` (e.g. `"Edwards 31pts/8reb/6ast"`).
2. **Best second story** — pick whichever is most newsworthy:
   - A teammate or opponent with ≥6 made threes → `"Castle 6/9 from deep"`.
   - Otherwise the next highest scorer on the losing team → `"Wembanyama 24/12/4 in the loss"`.
3. **Quarter swing** *(only when `factsheet.quarters` is present — sample only for now)* — find the quarter with the largest single-team net (e.g. `+13`) → `"MIN ran a 31-18 third"`.

Cap at 3 strings, dedupe, drop empties. If stats fetch fails, send no highlights — Wade falls back to the current behavior.

## Prompt change (edge function)

Append to the user prompt only when highlights exist:

```
Crucial moments (use 1 or 2, naturally — do NOT list them, do NOT name-drop all of them, do NOT invent stats not on this list):
- {highlight 1}
- {highlight 2}
- {highlight 3}
```

Add one line to the system prompt's style rules:

```
- If "Crucial moments" are provided, slip ONE or TWO into the recap as flavor — do not enumerate, do not invent any other player names or stats.
```

The 400-char cap and one-paragraph rules stay.

## Drawer UI

Above the existing recap output box, add:

```
Key moments  ▼
  · Edwards 31pts/8reb/6ast
  · Castle 6/9 from deep
  · MIN ran a 31-18 third
```

Collapsed by default on mobile, expanded on desktop. No edit field in v1 — keep it minimal. (If the user later wants to type in their own moment, that's a follow-up.)

The moments are recomputed any time `source` changes; the same array is sent to the edge function and surfaced in the existing "Inputs sent to model" JSON dump.

## Out of scope

- Letting the user type custom moments (easy follow-up if asked).
- Persisting highlights with the recap in localStorage — Wade only needs them at generation time.
- Play-by-play / shot chart data — balldontlie's free tier doesn't expose it, and stats are enough for color.
- Quarter scores for fetched NBA games — balldontlie's basic `games` endpoint doesn't return per-period scores, so the swing line stays sample-only for now.

## Verification

1. Open drawer with the sample → see 3 moments listed → generated recap mentions one (e.g. a player line) without listing all three. Char count still ≤ 400.
2. Pick a real finished game → moments populate from box score → Wade weaves one in.
3. Force the stats fetch to fail (offline) → no moments shown, recap still generates as before.
4. `npm run test` — existing tests untouched.

