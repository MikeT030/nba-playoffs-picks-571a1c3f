import { useMemo } from "react";
import { usePlayoffGamesRaw } from "./usePlayoffGamesRaw";
import { useBracketData } from "./useBracketData";
import { useAllSeriesResults } from "./useAllSeriesResults";
import type { NbaGame } from "@/lib/nbaApi";
import type { BracketSeries } from "@/data/playoffsData";

export interface DetectedSeriesResult {
  series_id: string;
  round: string;
  conference: "East" | "West" | "Finals";
  topAbbr: string;
  bottomAbbr: string;
  /** Detected winner abbreviation, or null if series isn't decided yet. */
  detectedWinner: string | null;
  /** Total games played in the series so far (finals only). */
  detectedGamesPlayed: number;
  /** Win counts per team. */
  topWins: number;
  bottomWins: number;
  /** Existing confirmed result, if any. */
  confirmed: { winner: string; games_played: number } | null;
  /** True if confirmed result matches detected. */
  matchesConfirmed: boolean;
}

function detectForSeries(
  series: BracketSeries,
  games: NbaGame[]
): { winner: string | null; gamesPlayed: number; topWins: number; bottomWins: number } {
  if (!series.topTeam || !series.bottomTeam) {
    return { winner: null, gamesPlayed: 0, topWins: 0, bottomWins: 0 };
  }
  const top = series.topTeam.abbreviation;
  const bottom = series.bottomTeam.abbreviation;
  const teamSet = new Set([top, bottom]);

  const finals = games.filter(
    (g) =>
      g.status === "Final" &&
      teamSet.has(g.home_team.abbreviation) &&
      teamSet.has(g.visitor_team.abbreviation)
  );

  let topWins = 0;
  let bottomWins = 0;
  for (const g of finals) {
    const winnerAbbr =
      g.home_team_score > g.visitor_team_score
        ? g.home_team.abbreviation
        : g.visitor_team.abbreviation;
    if (winnerAbbr === top) topWins++;
    else if (winnerAbbr === bottom) bottomWins++;
  }

  let winner: string | null = null;
  if (topWins >= 4) winner = top;
  else if (bottomWins >= 4) winner = bottom;

  return {
    winner,
    gamesPlayed: topWins + bottomWins,
    topWins,
    bottomWins,
  };
}

/**
 * Combines the live NBA feed with the bracket and confirmed series_results
 * to surface auto-detected series winners for admin confirmation.
 */
export function useDetectedSeriesResults(season: number = 2025) {
  const gamesQuery = usePlayoffGamesRaw(season);
  const bracketQuery = useBracketData(season);
  const resultsQuery = useAllSeriesResults();

  const data = useMemo<DetectedSeriesResult[]>(() => {
    const games = gamesQuery.data ?? [];
    const bracket = bracketQuery.data ?? [];
    const confirmed = resultsQuery.data ?? [];
    const confirmedMap = new Map(confirmed.map((r) => [r.series_id, r]));

    return bracket
      .filter((s) => s.topTeam && s.bottomTeam)
      .map((s) => {
        const det = detectForSeries(s, games);
        const conf = confirmedMap.get(s.id) ?? null;
        const matches =
          !!conf &&
          !!det.winner &&
          conf.winner === det.winner &&
          conf.games_played === det.gamesPlayed;
        return {
          series_id: s.id,
          round: s.round,
          conference: s.conference,
          topAbbr: s.topTeam!.abbreviation,
          bottomAbbr: s.bottomTeam!.abbreviation,
          detectedWinner: det.winner,
          detectedGamesPlayed: det.gamesPlayed,
          topWins: det.topWins,
          bottomWins: det.bottomWins,
          confirmed: conf ? { winner: conf.winner, games_played: conf.games_played } : null,
          matchesConfirmed: matches,
        };
      });
  }, [gamesQuery.data, bracketQuery.data, resultsQuery.data]);

  return {
    data,
    isLoading: gamesQuery.isLoading || bracketQuery.isLoading || resultsQuery.isLoading,
  };
}
