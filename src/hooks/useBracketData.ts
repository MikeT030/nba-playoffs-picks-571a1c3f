import { useQuery } from "@tanstack/react-query";
import { getPlayoffGames } from "@/lib/nbaApi";
import { bracketSeries, resolveBracketWithApiGames, type BracketSeries } from "@/data/playoffsData";

/**
 * Returns bracket series with TBD play-in slots resolved from live API data.
 */
export function useBracketData(season: number = 2025) {
  return useQuery({
    queryKey: ["bracket-data", season],
    queryFn: async (): Promise<BracketSeries[]> => {
      try {
        const games = await getPlayoffGames(season);
        if (games.length === 0) return bracketSeries;
        return resolveBracketWithApiGames(games);
      } catch (error) {
        console.warn("Failed to fetch NBA data for bracket, using fallback:", error);
        return bracketSeries;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
