import { teamMeta } from "@/lib/nbaApi";

export interface Team {
  name: string;
  abbreviation: string;
  color: string;
  logo: string;
  seed?: number;
}

export interface Tip {
  user: string;
  avatar: string;
  pick: string;
  gamesInSeries: number;
}

export interface BracketSeries {
  id: string;
  round: string;
  conference: "East" | "West" | "Finals";
  // For first round: fixed teams. For later rounds: references to parent series
  topTeam?: Team;
  bottomTeam?: Team;
  topParentSeriesId?: string; // winner of this series fills the top slot
  bottomParentSeriesId?: string; // winner of this series fills the bottom slot
}

export interface Match {
  id: string;
  round: string;
  conference: "East" | "West" | "Finals";
  gameNumber: number;
  date: string;
  time: string;
  homeTeam: Team;
  awayTeam: Team;
  homeWins: number;
  awayWins: number;
  status: "upcoming" | "live" | "final";
  homeScore?: number;
  awayScore?: number;
  tips: Tip[];
}

const buddies = ["Erik", "Alexander", "David", "Fabian", "Hannes", "Jörn", "Larsn", "Michi", "Momentum", "Simon", "Sven"];
const avatars = ["🎣", "😎", "🎬", "🏔️", "🌄", "🎿", "🐕", "🎸", "🚀", "📡", "🐶"];

export function makeTips(team1: string, team2: string): Tip[] {
  return buddies.map((name, i) => {
    const seed = (name.charCodeAt(0) + team1.charCodeAt(0) + team2.charCodeAt(0)) % 2;
    const pick = (i + seed) % 2 === 0 ? team1 : team2;
    return {
      user: name,
      avatar: avatars[i],
      pick,
      gamesInSeries: 4 + ((i + seed) % 3),
    };
  });
}

function makeTeam(abbr: string, fullName: string, seed?: number): Team {
  const meta = teamMeta[abbr] || { color: "#666", logo: "" };
  return { name: fullName, abbreviation: abbr, color: meta.color, logo: meta.logo, seed };
}

// 2026 playoff seeds
export const teamSeeds: Record<string, number> = {
  // East
  DET: 1, BOS: 2, NYK: 3, CLE: 4, ATL: 5, TOR: 6,
  // West
  OKC: 1, SAS: 2, DEN: 3, LAL: 4, HOU: 5, MIN: 6,
};

const eastTeams = new Set(["BOS", "NYK", "DET", "CLE", "ATL", "TOR", "ORL", "MIA", "MIL", "IND", "CHI", "BKN", "CHA", "WAS", "PHI"]);

export function getConference(team1: string, team2: string): "East" | "West" | "Finals" {
  const t1East = eastTeams.has(team1);
  const t2East = eastTeams.has(team2);
  if (t1East && t2East) return "East";
  if (!t1East && !t2East) return "West";
  return "Finals";
}

// TBD placeholder team for play-in spots
const tbdTeam = (seed: number): Team => ({
  name: "TBD (Play-In)",
  abbreviation: "TBD",
  color: "#666",
  logo: "",
  seed,
});

// Full bracket following 2025 NBA bracket structure:
// R1: 1v8, 4v5, 3v6, 2v7
// Semis: W(1v8) vs W(4v5), W(3v6) vs W(2v7)
// Conf Finals: W(top semis) vs W(bottom semis)
// Finals: W(West) vs W(East)

export const bracketSeries: BracketSeries[] = [
  // ===== WEST FIRST ROUND =====
  { id: "west-r1-1v8", round: "First Round", conference: "West",
    topTeam: makeTeam("OKC", "Oklahoma City Thunder", 1), bottomTeam: tbdTeam(8) },
  { id: "west-r1-4v5", round: "First Round", conference: "West",
    topTeam: makeTeam("LAL", "Los Angeles Lakers", 4), bottomTeam: makeTeam("HOU", "Houston Rockets", 5) },
  { id: "west-r1-3v6", round: "First Round", conference: "West",
    topTeam: makeTeam("DEN", "Denver Nuggets", 3), bottomTeam: makeTeam("MIN", "Minnesota Timberwolves", 6) },
  { id: "west-r1-2v7", round: "First Round", conference: "West",
    topTeam: makeTeam("SAS", "San Antonio Spurs", 2), bottomTeam: tbdTeam(7) },

  // ===== EAST FIRST ROUND =====
  { id: "east-r1-1v8", round: "First Round", conference: "East",
    topTeam: makeTeam("DET", "Detroit Pistons", 1), bottomTeam: tbdTeam(8) },
  { id: "east-r1-4v5", round: "First Round", conference: "East",
    topTeam: makeTeam("CLE", "Cleveland Cavaliers", 4), bottomTeam: makeTeam("ATL", "Atlanta Hawks", 5) },
  { id: "east-r1-3v6", round: "First Round", conference: "East",
    topTeam: makeTeam("NYK", "New York Knicks", 3), bottomTeam: makeTeam("TOR", "Toronto Raptors", 6) },
  { id: "east-r1-2v7", round: "First Round", conference: "East",
    topTeam: makeTeam("BOS", "Boston Celtics", 2), bottomTeam: tbdTeam(7) },

  // ===== WEST CONFERENCE SEMIFINALS =====
  { id: "west-semi-top", round: "Conference Semifinals", conference: "West",
    topParentSeriesId: "west-r1-1v8", bottomParentSeriesId: "west-r1-4v5" },
  { id: "west-semi-bottom", round: "Conference Semifinals", conference: "West",
    topParentSeriesId: "west-r1-3v6", bottomParentSeriesId: "west-r1-2v7" },

  // ===== EAST CONFERENCE SEMIFINALS =====
  { id: "east-semi-top", round: "Conference Semifinals", conference: "East",
    topParentSeriesId: "east-r1-1v8", bottomParentSeriesId: "east-r1-4v5" },
  { id: "east-semi-bottom", round: "Conference Semifinals", conference: "East",
    topParentSeriesId: "east-r1-3v6", bottomParentSeriesId: "east-r1-2v7" },

  // ===== CONFERENCE FINALS =====
  { id: "west-conf-finals", round: "Conference Finals", conference: "West",
    topParentSeriesId: "west-semi-top", bottomParentSeriesId: "west-semi-bottom" },
  { id: "east-conf-finals", round: "Conference Finals", conference: "East",
    topParentSeriesId: "east-semi-top", bottomParentSeriesId: "east-semi-bottom" },

  // ===== NBA FINALS =====
  { id: "nba-finals", round: "Finals", conference: "Finals",
    topParentSeriesId: "west-conf-finals", bottomParentSeriesId: "east-conf-finals" },
];

// Helper: resolve teams for a series given a map of picks (seriesId -> winner abbreviation)
export function resolveSeriesTeams(
  seriesId: string,
  picks: Record<string, string>
): { topTeam?: Team; bottomTeam?: Team } {
  const series = bracketSeries.find((s) => s.id === seriesId);
  if (!series) return {};

  let topTeam = series.topTeam;
  let bottomTeam = series.bottomTeam;

  if (series.topParentSeriesId) {
    const parentWinner = picks[series.topParentSeriesId];
    if (parentWinner) {
      const parentSeries = bracketSeries.find((s) => s.id === series.topParentSeriesId);
      if (parentSeries) {
        const { topTeam: pTop, bottomTeam: pBottom } = resolveSeriesTeams(series.topParentSeriesId, picks);
        topTeam = parentWinner === pTop?.abbreviation ? pTop : pBottom;
      }
    }
  }

  if (series.bottomParentSeriesId) {
    const parentWinner = picks[series.bottomParentSeriesId];
    if (parentWinner) {
      const parentSeries = bracketSeries.find((s) => s.id === series.bottomParentSeriesId);
      if (parentSeries) {
        const { topTeam: pTop, bottomTeam: pBottom } = resolveSeriesTeams(series.bottomParentSeriesId, picks);
        bottomTeam = parentWinner === pTop?.abbreviation ? pTop : pBottom;
      }
    }
  }

  return { topTeam, bottomTeam };
}

// Convert bracket series to Match format for the home page (first round only)
const firstRoundMatchups = bracketSeries.filter((s) => s.round === "First Round" && s.topTeam && s.bottomTeam);

export const fallbackMatches: Match[] = firstRoundMatchups
  .filter((s) => s.topTeam!.abbreviation !== "TBD" && s.bottomTeam!.abbreviation !== "TBD")
  .map((s, i) => ({
    id: s.id,
    round: "First Round",
    conference: s.conference,
    gameNumber: 1,
    date: i < 3 ? "Apr 19" : "Apr 20",
    time: ["7:00 PM", "8:00 PM", "9:30 PM", "3:30 PM"][i] + " ET",
    homeTeam: s.topTeam!,
    awayTeam: s.bottomTeam!,
    homeWins: 0,
    awayWins: 0,
    status: "upcoming" as const,
    tips: makeTips(s.topTeam!.abbreviation, s.bottomTeam!.abbreviation),
  }));
