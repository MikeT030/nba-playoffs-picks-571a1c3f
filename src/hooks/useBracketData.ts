import { useMemo } from "react";
import { bracketSeries, resolveBracketWithApiGames, type BracketSeries } from "@/data/playoffsData";
import { usePlayoffGamesRaw } from "./usePlayoffGamesRaw";

/**
 * Returns bracket series with TBD play-in slots resolved from live API data.
 * Derives from the shared playoff-games-raw query result — no separate fetch —
 * so the bracket and the home page can never disagree.
 */
export function useBracketData(season: number = 2025) {
  const rawQuery = usePlayoffGamesRaw(season);

  const data = useMemo<BracketSeries[]>(() => {
    const games = rawQuery.data;
    if (!games || games.length === 0) return bracketSeries;
    return resolveBracketWithApiGames(games);
  }, [rawQuery.data]);

  return {
    ...rawQuery,
    data,
  };
}
