import { useQuery } from "@tanstack/react-query";
import { type NbaGame } from "@/lib/nbaApi";
import { bracketSeries, resolveBracketWithApiGames, type BracketSeries } from "@/data/playoffsData";
import { usePlayoffGamesRaw } from "./usePlayoffGamesRaw";

/**
 * Returns bracket series with TBD play-in slots resolved from live API data.
 * Derives from the shared playoff-games-raw cache via `select` — no separate
 * fetch — so the bracket and the home page can never disagree.
 */
export function useBracketData(season: number = 2025) {
  // Ensure the shared raw query is mounted/fetched.
  usePlayoffGamesRaw(season);

  return useQuery<NbaGame[], Error, BracketSeries[]>({
    queryKey: ["playoff-games-raw", season],
    // queryFn is provided by usePlayoffGamesRaw; this is a passive subscriber.
    enabled: false,
    initialData: [],
    select: (games) => {
      if (!games || games.length === 0) return bracketSeries;
      return resolveBracketWithApiGames(games);
    },
  });
}
