import { useMemo } from "react";
import {
  bracketSeries,
  resolveBracketWithApiGames,
  resolveBracketWithApiGamesRound1Only,
  type BracketSeries,
} from "@/data/playoffsData";
import { usePlayoffGamesRaw } from "./usePlayoffGamesRaw";

export type BracketResolveMode = "live" | "picksOnly";

/**
 * Returns bracket series with TBD play-in slots resolved from live API data.
 *
 * - mode "live" (default): later-round slots are also filled with actual
 *   advancing teams from finished series. Used by the home page, scoreboard,
 *   and live match cards.
 * - mode "picksOnly": only Round 1 play-in (7/8 seed) slots are resolved.
 *   Later rounds stay empty so the user's picks drive who advances. Used by
 *   the "/my-picks" bracket so real winners don't shadow user predictions.
 */
export function useBracketData(
  season: number = 2025,
  options: { mode?: BracketResolveMode } = {}
) {
  const mode = options.mode ?? "live";
  const rawQuery = usePlayoffGamesRaw(season);

  const data = useMemo<BracketSeries[]>(() => {
    const games = rawQuery.data;
    if (!games || games.length === 0) return bracketSeries;
    return mode === "picksOnly"
      ? resolveBracketWithApiGamesRound1Only(games)
      : resolveBracketWithApiGames(games);
  }, [rawQuery.data, mode]);

  return {
    ...rawQuery,
    data,
  };
}
