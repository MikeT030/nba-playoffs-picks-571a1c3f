// Shared scoring logic so the bracket overlay matches the Scoreboard page.
// Mirrors the rules in src/pages/Scoreboard.tsx:
//   3 pts - correct winner + correct games-in-series (perfect)
//   2 pts - correct winner, wrong games-in-series
//   1 pt  - correct team picked, but assigned to the wrong series (loose)
//   4 pts - bonus for correctly picking the Finals champion (nba-finals)

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
 * Score a single pick against the current set of results.
 * Loose-pick detection requires the full picks list for that user so we don't
 * double-count a series that was already a perfect/winner hit.
 */
export function scorePick(
  pick: PickLite,
  allUserPicks: PickLite[],
  results: SeriesResultLite[]
): PickPointInfo {
  const result = results.find((r) => r.series_id === pick.series_id);
  if (result && result.winner === pick.winner) {
    if (result.games_played === pick.games_in_series) return { points: 3, kind: "perfect" };
    return { points: 2, kind: "winner" };
  }
  // Loose: this pick's series has no matching winner, but the team they picked
  // did win some other series, AND that team isn't already covered by another
  // perfect/winner pick from the same user.
  const actualWinners = new Set(results.map((r) => r.winner));
  if (!actualWinners.has(pick.winner)) return { points: 0, kind: "none" };
  // Has the user already scored on this team via the correct series?
  const alreadyScored = allUserPicks.some((p) => {
    const r = results.find((rr) => rr.series_id === p.series_id);
    return r && r.winner === p.winner && p.winner === pick.winner;
  });
  if (alreadyScored) return { points: 0, kind: "none" };
  return { points: 1, kind: "loose" };
}

export function totalUserPoints(
  allUserPicks: PickLite[],
  results: SeriesResultLite[]
): number {
  let total = 0;
  for (const p of allUserPicks) {
    total += scorePick(p, allUserPicks, results).points;
  }
  // Champion bonus
  const finalsPick = allUserPicks.find((p) => p.series_id === "nba-finals");
  const finalsResult = results.find((r) => r.series_id === "nba-finals");
  if (finalsPick && finalsResult && finalsPick.winner === finalsResult.winner) {
    total += 4;
  }
  return total;
}
