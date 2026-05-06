import { useMemo } from "react";
import {
  bracketSeries,
  resolveBracketWithApiGames,
  resolvePlayInSlotsOnly,
  type BracketSeries,
} from "@/data/playoffsData";
import { usePlayoffGamesRaw } from "./usePlayoffGamesRaw";

interface UseBracketDataOptions {
  /**
   * When true (default), real-life series winners are propagated forward into
   * later-round bracket slots — used by Scoreboard, Home, Match views.
   * When false, only Round 1 play-in TBD slots are resolved; future rounds
   * keep empty slots so user picks can fill them — used by /my-picks.
   */
  propagateRealWinners?: boolean;
}

const LIVE_STATUS_RE = /^(1st|2nd|3rd|4th)\s*Qtr$|^Halftime$/i;

export function useBracketData(
  season: number = 2025,
  opts: UseBracketDataOptions = {},
) {
  const { propagateRealWinners = true } = opts;
  const rawQuery = usePlayoffGamesRaw(season);

  const data = useMemo<BracketSeries[]>(() => {
    const games = rawQuery.data;
    if (!games || games.length === 0) return bracketSeries;
    return propagateRealWinners
      ? resolveBracketWithApiGames(games)
      : resolvePlayInSlotsOnly(games);
  }, [rawQuery.data, propagateRealWinners]);

  /**
   * Sorted "ABBR1|ABBR2" keys for matchups currently in progress
   * (≥1 final or live game played, no team has reached 4 wins yet).
   * Used to freeze user-pick propagation one round ahead so a predicted
   * team doesn't auto-fill all later-round slots while losing its series.
   */
  const inProgressPairs = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    const games = rawQuery.data;
    if (!games || games.length === 0) return set;
    const winsByPair = new Map<string, Map<string, number>>();
    const startedPairs = new Set<string>();
    for (const g of games) {
      const a = g.home_team.abbreviation;
      const b = g.visitor_team.abbreviation;
      const key = [a, b].sort().join("|");
      const isFinal = g.status === "Final";
      const isLive = LIVE_STATUS_RE.test(g.status);
      if (!isFinal && !isLive) continue;
      startedPairs.add(key);
      if (isFinal) {
        const winner =
          (g.home_team_score ?? 0) > (g.visitor_team_score ?? 0) ? a : b;
        const m = winsByPair.get(key) ?? new Map<string, number>();
        m.set(winner, (m.get(winner) ?? 0) + 1);
        winsByPair.set(key, m);
      }
    }
    for (const key of startedPairs) {
      const m = winsByPair.get(key);
      const max = m ? Math.max(0, ...Array.from(m.values())) : 0;
      if (max < 4) set.add(key);
    }
    return set;
  }, [rawQuery.data]);

  return {
    ...rawQuery,
    data,
    inProgressPairs,
  };
}
