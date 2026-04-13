import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlayoffGames, type NbaGame } from "@/lib/nbaApi";
import { bracketSeries, resolveBracketWithApiGames, type BracketSeries } from "@/data/playoffsData";

/**
 * Returns bracket series with TBD play-in slots resolved from live API data.
 * Reuses cached playoff-games query data when available to avoid duplicate API calls.
 */
export function useBracketData(season: number = 2025) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["bracket-data", season],
    queryFn: async (): Promise<BracketSeries[]> => {
      try {
        // Try to reuse already-fetched games from the playoff-games query
        const cachedGames = queryClient.getQueryData<NbaGame[]>(["playoff-games-raw", season]);
        const games = cachedGames ?? await getPlayoffGames(season);
        if (!cachedGames && games.length > 0) {
          queryClient.setQueryData(["playoff-games-raw", season], games);
        }
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
