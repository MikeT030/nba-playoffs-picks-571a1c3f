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
  DET: 1, BOS: 2, NYK: 3, CLE: 4, TOR: 5, ATL: 6,
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

// Dummy play-in placeholder teams with unique abbreviations so picks can be made
const playInPlaceholders: Record<string, Team> = {
  "PIW7": { name: "West Play-In 7th", abbreviation: "PIW7", color: "#888", logo: "🏀", seed: 7 },
  "PIW8": { name: "West Play-In 8th", abbreviation: "PIW8", color: "#888", logo: "🏀", seed: 8 },
  "PIE7": { name: "East Play-In 7th", abbreviation: "PIE7", color: "#888", logo: "🏀", seed: 7 },
  "PIE8": { name: "East Play-In 8th", abbreviation: "PIE8", color: "#888", logo: "🏀", seed: 8 },
};

export function isPlayInPlaceholder(abbr: string): boolean {
  return abbr in playInPlaceholders;
}

// Full bracket following 2025 NBA bracket structure:
// R1: 1v8, 4v5, 3v6, 2v7
// Semis: W(1v8) vs W(4v5), W(3v6) vs W(2v7)
// Conf Finals: W(top semis) vs W(bottom semis)
// Finals: W(West) vs W(East)

export const bracketSeries: BracketSeries[] = [
  // ===== WEST FIRST ROUND =====
  { id: "west-r1-1v8", round: "First Round", conference: "West",
    topTeam: makeTeam("OKC", "Oklahoma City Thunder", 1), bottomTeam: playInPlaceholders["PIW8"] },
  { id: "west-r1-4v5", round: "First Round", conference: "West",
    topTeam: makeTeam("LAL", "Los Angeles Lakers", 4), bottomTeam: makeTeam("HOU", "Houston Rockets", 5) },
  { id: "west-r1-3v6", round: "First Round", conference: "West",
    topTeam: makeTeam("DEN", "Denver Nuggets", 3), bottomTeam: makeTeam("MIN", "Minnesota Timberwolves", 6) },
  { id: "west-r1-2v7", round: "First Round", conference: "West",
    topTeam: makeTeam("SAS", "San Antonio Spurs", 2), bottomTeam: playInPlaceholders["PIW7"] },

  // ===== EAST FIRST ROUND =====
  { id: "east-r1-1v8", round: "First Round", conference: "East",
    topTeam: makeTeam("DET", "Detroit Pistons", 1), bottomTeam: playInPlaceholders["PIE8"] },
  { id: "east-r1-4v5", round: "First Round", conference: "East",
    topTeam: makeTeam("CLE", "Cleveland Cavaliers", 4), bottomTeam: makeTeam("TOR", "Toronto Raptors", 5) },
  { id: "east-r1-3v6", round: "First Round", conference: "East",
    topTeam: makeTeam("NYK", "New York Knicks", 3), bottomTeam: makeTeam("ATL", "Atlanta Hawks", 6) },
  { id: "east-r1-2v7", round: "First Round", conference: "East",
    topTeam: makeTeam("BOS", "Boston Celtics", 2), bottomTeam: playInPlaceholders["PIE7"] },

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
  picks: Record<string, string>,
  seriesList: BracketSeries[] = bracketSeries
): { topTeam?: Team; bottomTeam?: Team } {
  const series = seriesList.find((s) => s.id === seriesId);
  if (!series) return {};

  let topTeam = series.topTeam;
  let bottomTeam = series.bottomTeam;

  if (series.topParentSeriesId) {
    const parentWinner = picks[series.topParentSeriesId];
    if (parentWinner) {
      const parentSeries = seriesList.find((s) => s.id === series.topParentSeriesId);
      if (parentSeries) {
        const { topTeam: pTop, bottomTeam: pBottom } = resolveSeriesTeams(series.topParentSeriesId, picks, seriesList);
        topTeam = parentWinner === pTop?.abbreviation ? pTop : pBottom;
      }
    }
  }

  if (series.bottomParentSeriesId) {
    const parentWinner = picks[series.bottomParentSeriesId];
    if (parentWinner) {
      const parentSeries = seriesList.find((s) => s.id === series.bottomParentSeriesId);
      if (parentSeries) {
        const { topTeam: pTop, bottomTeam: pBottom } = resolveSeriesTeams(series.bottomParentSeriesId, picks, seriesList);
        bottomTeam = parentWinner === pTop?.abbreviation ? pTop : pBottom;
      }
    }
  }

  return { topTeam, bottomTeam };
}

/**
 * Given real playoff games from the API, detect which teams fill the TBD (7/8 seed)
 * slots by looking at who the known 1-seed and 2-seed teams are playing against.
 */
export function resolveBracketWithApiGames(
  games: { home_team: { abbreviation: string; full_name: string }; visitor_team: { abbreviation: string; full_name: string } }[]
): BracketSeries[] {
  if (!games.length) return bracketSeries;

  // Known seeds whose opponents reveal the play-in winners
  const knownSeeds: Record<string, { seriesId: string; slot: "bottom" }> = {
    OKC: { seriesId: "west-r1-1v8", slot: "bottom" },  // 1-seed West → opponent is 8-seed
    SAS: { seriesId: "west-r1-2v7", slot: "bottom" },  // 2-seed West → opponent is 7-seed
    DET: { seriesId: "east-r1-1v8", slot: "bottom" },  // 1-seed East → opponent is 8-seed
    BOS: { seriesId: "east-r1-2v7", slot: "bottom" },  // 2-seed East → opponent is 7-seed
  };

  const resolved: Record<string, Team> = {};

  for (const game of games) {
    for (const knownAbbr of Object.keys(knownSeeds)) {
      const info = knownSeeds[knownAbbr];
      let opponentAbbr: string | null = null;
      let opponentName: string | null = null;

      if (game.home_team.abbreviation === knownAbbr) {
        opponentAbbr = game.visitor_team.abbreviation;
        opponentName = game.visitor_team.full_name;
      } else if (game.visitor_team.abbreviation === knownAbbr) {
        opponentAbbr = game.home_team.abbreviation;
        opponentName = game.home_team.full_name;
      }

      if (opponentAbbr && opponentName && !resolved[info.seriesId]) {
        const seed = info.seriesId.includes("1v8") ? 8 : 7;
        resolved[info.seriesId] = makeTeam(opponentAbbr, opponentName, seed);
      }
    }
  }

  if (Object.keys(resolved).length === 0) return bracketSeries;

  return bracketSeries.map((s) => {
    if (resolved[s.id]) {
      return { ...s, bottomTeam: resolved[s.id] };
    }
    return s;
  });
}

// Convert bracket series to Match format for the home page (first round only)
const firstRoundMatchups = bracketSeries.filter((s) => s.round === "First Round" && s.topTeam && s.bottomTeam);

// Dummy demo matchup so the matchup card layout is always visible (e.g. CHA vs MIA)
const chaMiaDummy: Match = {
  id: "demo-cha-mia",
  round: "First Round",
  conference: "East",
  gameNumber: 7,
  date: "Apr 21",
  time: "OT 2:14",
  homeTeam: makeTeam("MIA", "Miami Heat"),
  awayTeam: makeTeam("CHA", "Charlotte Hornets"),
  homeWins: 3,
  awayWins: 3,
  status: "live" as const,
  homeScore: 106,
  awayScore: 101,
  tips: makeTips("MIA", "CHA"),
};

export const fallbackMatches: Match[] = [
  ...firstRoundMatchups.map((s, i) => ({
    id: s.id,
    round: "First Round",
    conference: s.conference,
    gameNumber: 1,
    date: isPlayInPlaceholder(s.bottomTeam!.abbreviation) ? "TBD" : (i < 3 ? "Apr 19" : "Apr 20"),
    time: isPlayInPlaceholder(s.bottomTeam!.abbreviation) ? "TBD" : (["7:00 PM", "8:00 PM", "9:30 PM", "3:30 PM"][i] + " ET"),
    homeTeam: s.topTeam!,
    awayTeam: s.bottomTeam!,
    homeWins: 0,
    awayWins: 0,
    status: "upcoming" as const,
    tips: makeTips(s.topTeam!.abbreviation, s.bottomTeam!.abbreviation),
  })),
  chaMiaDummy,
];