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

  return {
    ...rawQuery,
    data,
  };
}
