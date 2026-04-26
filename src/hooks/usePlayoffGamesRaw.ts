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
      // Let errors propagate so TanStack Query keeps the previous good data
      // in `data` instead of replacing it with an empty array (which would
      // cause the UI to fall back to pre-playoff placeholder cards on a
      // transient API failure).
      return await getPlayoffGames(season);
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    // Auto-refresh:
    //  - every 30s when at least one game is live
    //  - every 60s when the soonest upcoming tip-off is within ~25h, so the
    //    UI can flip "scheduled → next-up → live" without a manual reload
    refetchInterval: (query) => {
      const data = query.state.data as NbaGame[] | undefined;
      if (!Array.isArray(data)) return false;
      const hasLive = data.some((g) =>
        g.status === "Final" ? false : LIVE_STATUS_RE.test(g.status)
      );
      if (hasLive) return 30_000;

      const now = Date.now();
      const TWENTY_FIVE_H = 25 * 60 * 60 * 1000;
      const nearTipOff = data.some((g) => {
        if (g.status === "Final") return false;
        if (LIVE_STATUS_RE.test(g.status)) return false;
        const ts = new Date(g.date).getTime();
        if (isNaN(ts)) return false;
        const diff = ts - now;
        return diff > 0 && diff <= TWENTY_FIVE_H;
      });
      return nearTipOff ? 60_000 : false;
    },
    refetchIntervalInBackground: false,
  });
}
