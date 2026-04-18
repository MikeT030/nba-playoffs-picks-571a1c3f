import { useMemo } from "react";
import { bracketSeries, resolveBracketWithApiGames, type BracketSeries } from "@/data/playoffsData";
import { usePlayoffGamesRaw } from "./usePlayoffGamesRaw";

/**
 * Returns bracket series with TBD play-in slots resolved from live API data.
 * Derives from the shared playoff-games-raw query — no separate fetch — so the
 * bracket and the home page can never disagree about which team fills a slot.
 */
export function useBracketData(season: number = 2025) {
  const { data: games, isLoading, isError, error } = usePlayoffGamesRaw(season);

  const data = useMemo<BracketSeries[]>(() => {
    if (!games || games.length === 0) return bracketSeries;
    return resolveBracketWithApiGames(games);
  }, [games]);

  return { data, isLoading, isError, error };
}
