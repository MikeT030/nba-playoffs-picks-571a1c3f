import { describe, it, expect } from "vitest";
import { scorePick, totalUserPoints, type PickLite, type SeriesResultLite } from "@/lib/pickScoring";
import type { BracketSeries } from "@/data/playoffsData";

// Minimal bracket fixture for tests. Two First Round series feeding one semi.
const fixtureBracket: BracketSeries[] = [
  {
    id: "r1-top",
    round: "First Round",
    conference: "East",
    topTeam: { name: "A", abbreviation: "A", color: "#000", logo: "🏀", seed: 1 },
    bottomTeam: { name: "H", abbreviation: "H", color: "#000", logo: "🏀", seed: 8 },
  },
  {
    id: "r1-bot",
    round: "First Round",
    conference: "East",
    topTeam: { name: "D", abbreviation: "D", color: "#000", logo: "🏀", seed: 4 },
    bottomTeam: { name: "E", abbreviation: "E", color: "#000", logo: "🏀", seed: 5 },
  },
  {
    id: "semi",
    round: "Conference Semifinals",
    conference: "East",
    topParentSeriesId: "r1-top",
    bottomParentSeriesId: "r1-bot",
  },
  {
    id: "nba-finals",
    round: "Finals",
    conference: "Finals",
    topParentSeriesId: "semi",
    bottomParentSeriesId: "semi",
  },
];

describe("scorePick (new rules)", () => {
  it("3 pts: right winner + right assumed opponent + right games", () => {
    const userPicks: PickLite[] = [
      { series_id: "r1-top", winner: "A", games_in_series: 5 },
      { series_id: "r1-bot", winner: "D", games_in_series: 6 },
      { series_id: "semi", winner: "A", games_in_series: 7 },
    ];
    const results: SeriesResultLite[] = [
      { series_id: "r1-top", winner: "A", games_played: 5 },
      { series_id: "r1-bot", winner: "D", games_played: 6 },
      { series_id: "semi", winner: "A", games_played: 7 },
    ];
    const info = scorePick(userPicks[2], userPicks, results, fixtureBracket);
    expect(info).toEqual({ points: 3, kind: "perfect" });
  });

  it("2 pts: right winner + right assumed opponent + wrong games", () => {
    const userPicks: PickLite[] = [
      { series_id: "r1-top", winner: "A", games_in_series: 5 },
      { series_id: "r1-bot", winner: "D", games_in_series: 6 },
      { series_id: "semi", winner: "A", games_in_series: 6 },
    ];
    const results: SeriesResultLite[] = [
      { series_id: "r1-top", winner: "A", games_played: 5 },
      { series_id: "r1-bot", winner: "D", games_played: 6 },
      { series_id: "semi", winner: "A", games_played: 7 },
    ];
    const info = scorePick(userPicks[2], userPicks, results, fixtureBracket);
    expect(info).toEqual({ points: 2, kind: "winner" });
  });

  it("1 pt: right winner but wrong assumed opponent (E's NYK-vs-BOS scenario)", () => {
    // User predicted r1-bot winner = D, but E actually advanced.
    // Their semi pick (A in 6) still has the right winner but the opponent is wrong.
    const userPicks: PickLite[] = [
      { series_id: "r1-top", winner: "A", games_in_series: 5 },
      { series_id: "r1-bot", winner: "D", games_in_series: 6 },
      { series_id: "semi", winner: "A", games_in_series: 6 },
    ];
    const results: SeriesResultLite[] = [
      { series_id: "r1-top", winner: "A", games_played: 5 },
      { series_id: "r1-bot", winner: "E", games_played: 7 },
      { series_id: "semi", winner: "A", games_played: 4 },
    ];
    const info = scorePick(userPicks[2], userPicks, results, fixtureBracket);
    expect(info).toEqual({ points: 1, kind: "loose" });
  });

  it("0 pts: wrong winner — even if that team won a different series", () => {
    const userPicks: PickLite[] = [
      { series_id: "r1-top", winner: "H", games_in_series: 5 }, // wrong, A won
    ];
    const results: SeriesResultLite[] = [
      { series_id: "r1-top", winner: "A", games_played: 5 },
      { series_id: "r1-bot", winner: "H", games_played: 6 }, // H won elsewhere
    ];
    const info = scorePick(userPicks[0], userPicks, results, fixtureBracket);
    expect(info).toEqual({ points: 0, kind: "none" });
  });

  it("First Round picks never score 1 pt (assumed opp = actual opp)", () => {
    const userPicks: PickLite[] = [
      { series_id: "r1-top", winner: "A", games_in_series: 7 },
    ];
    const results: SeriesResultLite[] = [
      { series_id: "r1-top", winner: "A", games_played: 5 },
    ];
    const info = scorePick(userPicks[0], userPicks, results, fixtureBracket);
    expect(info.kind).toBe("winner");
    expect(info.points).toBe(2);
  });

  it("Missing parent pick falls back to actual opponent (no downgrade)", () => {
    // No r1-bot pick at all → assumed opponent unresolved → don't downgrade.
    const userPicks: PickLite[] = [
      { series_id: "r1-top", winner: "A", games_in_series: 5 },
      { series_id: "semi", winner: "A", games_in_series: 7 },
    ];
    const results: SeriesResultLite[] = [
      { series_id: "r1-top", winner: "A", games_played: 5 },
      { series_id: "r1-bot", winner: "E", games_played: 7 },
      { series_id: "semi", winner: "A", games_played: 7 },
    ];
    const info = scorePick(userPicks[1], userPicks, results, fixtureBracket);
    expect(info).toEqual({ points: 3, kind: "perfect" });
  });

  it("Series not yet decided → 0 / none", () => {
    const userPicks: PickLite[] = [
      { series_id: "semi", winner: "A", games_in_series: 6 },
    ];
    const info = scorePick(userPicks[0], userPicks, [], fixtureBracket);
    expect(info).toEqual({ points: 0, kind: "none" });
  });
});

describe("totalUserPoints", () => {
  it("includes +4 champion bonus when nba-finals pick is correct", () => {
    const picks: PickLite[] = [
      { series_id: "nba-finals", winner: "A", games_in_series: 6 },
    ];
    const results: SeriesResultLite[] = [
      { series_id: "nba-finals", winner: "A", games_played: 6 },
    ];
    // No parent picks → fallback path → 3 pts (perfect) + 4 champion = 7
    const total = totalUserPoints(picks, results, fixtureBracket);
    expect(total).toBe(7);
  });
});
