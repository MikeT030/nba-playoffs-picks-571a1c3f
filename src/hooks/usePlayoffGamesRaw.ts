import { useQuery } from "@tanstack/react-query";
import { getPlayoffGames, type NbaGame } from "@/lib/nbaApi";

const LIVE_STATUS_RE = /^(1st|2nd|3rd|4th)\s*Qtr$|^Halftime$/i;

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
    // Auto-refresh every 30s while at least one game is live; otherwise no polling.
    refetchInterval: (query) => {
      const data = query.state.data as NbaGame[] | undefined;
      const hasLive =
        Array.isArray(data) &&
        data.some((g) => g.status === "Final" ? false : LIVE_STATUS_RE.test(g.status));
      return hasLive ? 30_000 : false;
    },
    refetchIntervalInBackground: false,
  });
}
