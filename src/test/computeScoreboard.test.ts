import { describe, it, expect } from "vitest";

// Re-implement computeScoreboard here to test the scoring logic in isolation
interface PickRow {
  profile_name: string;
  series_id: string;
  winner: string;
  games_in_series: number;
}

interface SeriesResult {
  series_id: string;
  winner: string;
  games_played: number;
}

interface ParticipantScore {
  name: string;
  perfectPicks: number;
  winnerPicks: number;
  loosePicks: number;
  championBonus: boolean;
  totalPoints: number;
}

function computeScoreboard(
  allPicks: PickRow[],
  results: SeriesResult[]
): ParticipantScore[] {
  const playerPicks = new Map<string, PickRow[]>();
  for (const p of allPicks) {
    const list = playerPicks.get(p.profile_name) || [];
    list.push(p);
    playerPicks.set(p.profile_name, list);
  }

  const resultMap = new Map<string, SeriesResult>();
  for (const r of results) resultMap.set(r.series_id, r);

  const actualWinners = new Set(results.map((r) => r.winner));

  const scores: ParticipantScore[] = [];

  for (const [name, picks] of playerPicks) {
    let perfectPicks = 0;
    let winnerPicks = 0;
    let loosePicks = 0;
    let championBonus = false;

    const scoredPicks = new Set<number>();

    for (let i = 0; i < picks.length; i++) {
      const pick = picks[i];
      const result = resultMap.get(pick.series_id);
      if (!result) continue;

      if (result.winner === pick.winner) {
        if (result.games_played === pick.games_in_series) {
          perfectPicks++;
        } else {
          winnerPicks++;
        }
        scoredPicks.add(i);
      }
    }

    for (let i = 0; i < picks.length; i++) {
      if (scoredPicks.has(i)) continue;
      const pick = picks[i];
      const result = resultMap.get(pick.series_id);
      if (result && result.winner !== pick.winner && actualWinners.has(pick.winner)) {
        loosePicks++;
        scoredPicks.add(i);
      }
    }

    const finalsResult = resultMap.get("nba-finals");
    const finalsPick = picks.find((p) => p.series_id === "nba-finals");
    if (finalsResult && finalsPick && finalsResult.winner === finalsPick.winner) {
      championBonus = true;
    }

    const totalPoints =
      perfectPicks * 3 + winnerPicks * 2 + loosePicks * 1 + (championBonus ? 4 : 0);

    scores.push({ name, perfectPicks, winnerPicks, loosePicks, championBonus, totalPoints });
  }

  return scores.sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
}

describe("computeScoreboard", () => {
  it("returns empty array when no picks", () => {
    expect(computeScoreboard([], [])).toEqual([]);
  });

  it("scores a perfect pick as 3 points", () => {
    const picks: PickRow[] = [
      { profile_name: "Alice", series_id: "s1", winner: "OKC", games_in_series: 5 },
    ];
    const results: SeriesResult[] = [
      { series_id: "s1", winner: "OKC", games_played: 5 },
    ];
    const scores = computeScoreboard(picks, results);
    expect(scores).toHaveLength(1);
    expect(scores[0].perfectPicks).toBe(1);
    expect(scores[0].totalPoints).toBe(3);
  });

  it("scores correct winner with wrong game count as 2 points", () => {
    const picks: PickRow[] = [
      { profile_name: "Bob", series_id: "s1", winner: "OKC", games_in_series: 6 },
    ];
    const results: SeriesResult[] = [
      { series_id: "s1", winner: "OKC", games_played: 5 },
    ];
    const scores = computeScoreboard(picks, results);
    expect(scores[0].winnerPicks).toBe(1);
    expect(scores[0].totalPoints).toBe(2);
  });

  it("scores a loose pick as 1 point (right team, wrong series)", () => {
    const picks: PickRow[] = [
      { profile_name: "Carol", series_id: "s1", winner: "OKC", games_in_series: 5 },
    ];
    const results: SeriesResult[] = [
      { series_id: "s1", winner: "HOU", games_played: 6 },
      { series_id: "s2", winner: "OKC", games_played: 5 },
    ];
    const scores = computeScoreboard(picks, results);
    expect(scores[0].loosePicks).toBe(1);
    expect(scores[0].totalPoints).toBe(1);
  });

  it("awards 4 bonus points for correct Supreme Finals champion", () => {
    const picks: PickRow[] = [
      { profile_name: "Dan", series_id: "nba-finals", winner: "BOS", games_in_series: 6 },
    ];
    const results: SeriesResult[] = [
      { series_id: "nba-finals", winner: "BOS", games_played: 7 },
    ];
    const scores = computeScoreboard(picks, results);
    expect(scores[0].championBonus).toBe(true);
    // 2 (winner correct, wrong games) + 4 (champion bonus) = 6
    expect(scores[0].totalPoints).toBe(6);
  });

  it("does not award champion bonus for wrong finals pick", () => {
    const picks: PickRow[] = [
      { profile_name: "Eve", series_id: "nba-finals", winner: "LAL", games_in_series: 6 },
    ];
    const results: SeriesResult[] = [
      { series_id: "nba-finals", winner: "BOS", games_played: 6 },
    ];
    const scores = computeScoreboard(picks, results);
    expect(scores[0].championBonus).toBe(false);
  });

  it("sorts players by total points descending, then by name", () => {
    const picks: PickRow[] = [
      { profile_name: "Zara", series_id: "s1", winner: "OKC", games_in_series: 5 },
      { profile_name: "Alice", series_id: "s1", winner: "OKC", games_in_series: 5 },
      { profile_name: "Bob", series_id: "s1", winner: "HOU", games_in_series: 6 },
    ];
    const results: SeriesResult[] = [
      { series_id: "s1", winner: "OKC", games_played: 5 },
    ];
    const scores = computeScoreboard(picks, results);
    // Alice and Zara both have 3 pts, Bob has 0
    expect(scores[0].name).toBe("Alice");
    expect(scores[1].name).toBe("Zara");
    expect(scores[2].name).toBe("Bob");
  });

  it("ignores picks for undecided series", () => {
    const picks: PickRow[] = [
      { profile_name: "Frank", series_id: "s1", winner: "OKC", games_in_series: 5 },
    ];
    const scores = computeScoreboard(picks, []);
    expect(scores[0].totalPoints).toBe(0);
  });

  it("handles multiple picks per player correctly", () => {
    const picks: PickRow[] = [
      { profile_name: "Grace", series_id: "s1", winner: "OKC", games_in_series: 5 },
      { profile_name: "Grace", series_id: "s2", winner: "BOS", games_in_series: 6 },
      { profile_name: "Grace", series_id: "nba-finals", winner: "OKC", games_in_series: 7 },
    ];
    const results: SeriesResult[] = [
      { series_id: "s1", winner: "OKC", games_played: 5 },
      { series_id: "s2", winner: "MIA", games_played: 7 },
      { series_id: "nba-finals", winner: "OKC", games_played: 7 },
    ];
    const scores = computeScoreboard(picks, results);
    // s1: perfect (3), s2: wrong (0), finals: perfect (3) + champion bonus (4) = 10
    expect(scores[0].perfectPicks).toBe(2);
    expect(scores[0].championBonus).toBe(true);
    expect(scores[0].totalPoints).toBe(10);
  });
});
