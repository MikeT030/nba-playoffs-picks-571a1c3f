import { teamMeta } from "@/lib/nbaApi";
import { type Team } from "@/data/playoffsData";

export interface SeriesGame {
  gameNumber: number;
  date: string;
  status: "final" | "live" | "upcoming";
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  /** Cumulative series wins after this game: [away, home] */
  seriesRecord: [number, number];
}

const CHA: Team = {
  name: "Charlotte Hornets",
  abbreviation: "CHA",
  color: teamMeta["CHA"].color,
  logo: teamMeta["CHA"].logo,
  seed: 7,
};

const MIA: Team = {
  name: "Miami Heat",
  abbreviation: "MIA",
  color: teamMeta["MIA"].color,
  logo: teamMeta["MIA"].logo,
  seed: 8,
};

// CHA wins series 4-3. Home team alternates: MIA home G1-2, CHA home G3-4, MIA home G5, CHA home G6, MIA home G7
export const chaMiaSeriesGames: SeriesGame[] = [
  { gameNumber: 1, date: "Apr 19", status: "final", homeTeam: MIA, awayTeam: CHA, homeScore: 108, awayScore: 98,  seriesRecord: [0, 1] },
  { gameNumber: 2, date: "Apr 21", status: "final", homeTeam: MIA, awayTeam: CHA, homeScore: 102, awayScore: 110, seriesRecord: [1, 1] },
  { gameNumber: 3, date: "Apr 24", status: "final", homeTeam: CHA, awayTeam: MIA, homeScore: 115, awayScore: 104, seriesRecord: [2, 1] },
  { gameNumber: 4, date: "Apr 26", status: "final", homeTeam: CHA, awayTeam: MIA, homeScore: 99,  awayScore: 107, seriesRecord: [2, 2] },
  { gameNumber: 5, date: "Apr 29", status: "final", homeTeam: MIA, awayTeam: CHA, homeScore: 112, awayScore: 105, seriesRecord: [2, 3] },
  { gameNumber: 6, date: "May 1",  status: "final", homeTeam: CHA, awayTeam: MIA, homeScore: 118, awayScore: 109, seriesRecord: [3, 3] },
  { gameNumber: 7, date: "May 3",  status: "final", homeTeam: MIA, awayTeam: CHA, homeScore: 100, awayScore: 106, seriesRecord: [4, 3] },
];
