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

/**
 * Returns bracket series with TBD play-in slots resolved from live API data.
 * Derives from the shared playoff-games-raw query result — no separate fetch —
 * so the bracket and the home page can never disagree.
 *
 * Also returns `inProgressPairs`: a Set of "ABBR1|ABBR2" (sorted) keys for any
 * matchup with at least one game played but no team has reached 4 wins yet.
 * Used to "freeze" user-pick propagation one round ahead so a predicted team
 * (e.g. PHI) doesn't auto-fill all later-round slots while it's actually
 * losing its current series.
 */
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

  const inProgressPairs = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    const games = rawQuery.data;
    if (!games || games.length === 0) return set;
    const winsByPair = new Map<string, Map<string, number>>();
    for (const g of games) {
      const a = g.home_team.abbreviation;
      const b = g.visitor_team.abbreviation;
      const key = [a, b].sort().join("|");
      const m = winsByPair.get(key) ?? new Map<string, number>();
      if (g.status === "Final") {
        const winner =
          (g.home_team_score ?? 0) > (g.visitor_team_score ?? 0) ? a : b;
        m.set(winner, (m.get(winner) ?? 0) + 1);
      }
      // Track existence of the pair even for non-final games, so live games
      // before any final still mark the series as in-progress.
      if (!winsByPair.has(key)) winsByPair.set(key, m);
      else winsByPair.set(key, m);
    }
    for (const [key, m] of winsByPair.entries()) {
      const max = Math.max(0, ...Array.from(m.values()));
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
