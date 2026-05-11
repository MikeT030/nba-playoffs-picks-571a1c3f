// Shared scoring logic so the bracket overlay matches the Scoreboard page.
// Rules:
//   3 pts - correct winner + correct assumed opponent + correct games-in-series
//   2 pts - correct winner + correct assumed opponent + wrong games-in-series
//   1 pt  - correct winner but wrong assumed opponent (right team won the
//           series, but the user predicted them to face a different opponent
//           than the one that actually advanced)
//   0 pts - wrong winner
//   +4 pt - bonus for correctly picking the Finals champion (nba-finals)
//
// "Assumed opponent" is derived from the user's *own* picks in the two feeder
// (parent) series. For First Round series the assumed opponent is the other
// fixed team in the slot, so it always equals the actual opponent, which means
// First Round picks can only ever score 0/2/3 — never 1.

import type { BracketSeries } from "@/data/playoffsData";
import { getAssumedOpponentAbbr } from "@/data/playoffsData";

export interface PickLite {
  series_id: string;
  winner: string;
  games_in_series: number;
}

export interface SeriesResultLite {
  series_id: string;
  winner: string;
  games_played: number;
}

export type PickPointKind = "perfect" | "winner" | "loose" | "none";

export interface PickPointInfo {
  points: number;
  kind: PickPointKind;
}

/**
 * Determine the actual opponent of `pickedWinner` in this series, using the
 * confirmed parent-series winners (or the fixed slot teams for First Round).
 * Returns null if it can't be resolved (parent series not yet decided, or the
 * picked team isn't actually in the matchup).
 */
function getActualOpponentAbbr(
  seriesId: string,
  pickedWinner: string,
  bracketSeries: BracketSeries[],
  results: SeriesResultLite[],
): string | null {
  const series = bracketSeries.find((s) => s.id === seriesId);
  if (!series) return null;

  // First Round: opponent is the other fixed team in the slot.
  if (series.round === "First Round") {
    const top = series.topTeam?.abbreviation;
    const bot = series.bottomTeam?.abbreviation;
    if (!top || !bot) return null;
    if (top === pickedWinner) return bot;
    if (bot === pickedWinner) return top;
    return null;
  }

  // Later rounds: derive from the two parent-series winners.
  const topParentId = series.topParentSeriesId;
  const botParentId = series.bottomParentSeriesId;
  if (!topParentId || !botParentId) return null;
  const topWinner = results.find((r) => r.series_id === topParentId)?.winner;
  const botWinner = results.find((r) => r.series_id === botParentId)?.winner;
  if (!topWinner || !botWinner) return null;
  if (topWinner === pickedWinner) return botWinner;
  if (botWinner === pickedWinner) return topWinner;
  return null;
}

/**
 * Score a single pick against the current set of results.
 *
 * `allUserPicks` is the full pick set for *this same user*; it's needed so we
 * can resolve the assumed opponent from the user's bracket.
 * `bracketSeries` is the full bracket definition (used for parent-series links
 * and First Round slot teams).
 */
export function scorePick(
  pick: PickLite,
  allUserPicks: PickLite[],
  results: SeriesResultLite[],
  bracketSeries: BracketSeries[],
): PickPointInfo {
  const result = results.find((r) => r.series_id === pick.series_id);
  if (!result) return { points: 0, kind: "none" };

  // Wrong winner → 0. (No "won some other series" credit.)
  if (result.winner !== pick.winner) return { points: 0, kind: "none" };

  // Right winner. Now check assumed opponent vs actual opponent.
  const assumedOpp = getAssumedOpponentAbbr(
    pick.series_id,
    pick.winner,
    bracketSeries,
    allUserPicks,
  );
  const actualOpp = getActualOpponentAbbr(
    pick.series_id,
    pick.winner,
    bracketSeries,
    results,
  );

  // Wrong assumed opponent → 1 pt (loose).
  if (assumedOpp && actualOpp && assumedOpp !== actualOpp) {
    return { points: 1, kind: "loose" };
  }

  // Right (or unknown) assumed opponent → 2 or 3 pts.
  if (result.games_played === pick.games_in_series) return { points: 3, kind: "perfect" };
  return { points: 2, kind: "winner" };
}

export function totalUserPoints(
  allUserPicks: PickLite[],
  results: SeriesResultLite[],
  bracketSeries: BracketSeries[],
): number {
  let total = 0;
  for (const p of allUserPicks) {
    total += scorePick(p, allUserPicks, results, bracketSeries).points;
  }
  // Champion bonus
  const finalsPick = allUserPicks.find((p) => p.series_id === "nba-finals");
  const finalsResult = results.find((r) => r.series_id === "nba-finals");
  if (finalsPick && finalsResult && finalsPick.winner === finalsResult.winner) {
    total += 4;
  }
  return total;
}
