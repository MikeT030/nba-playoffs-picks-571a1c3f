import { useQuery } from "@tanstack/react-query";
import { getPlayoffGames, type NbaGame } from "@/lib/nbaApi";

/**
 * Single source of truth for raw NBA playoff games for a season.
 * Both usePlayoffGames (home/match views) and useBracketData (bracket view)
 * derive their data from this query so we never fetch twice and never end up
 * with one view showing real teams while the other shows TBD placeholders.
 */
export function usePlayoffGamesRaw(season: number = 2025) {
  return useQuery({
    queryKey: ["playoff-games-raw", season],
    queryFn: async (): Promise<NbaGame[]> => {
      try {
        return await getPlayoffGames(season);
      } catch (error) {
        console.warn("Failed to fetch NBA playoff games:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}
