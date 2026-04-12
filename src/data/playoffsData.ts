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

function makeTeam(abbr: string, fullName: string): Team {
  const meta = teamMeta[abbr] || { color: "#666", logo: "" };
  return { name: fullName, abbreviation: abbr, color: meta.color, logo: meta.logo };
}

// Regular season seeds for 2026 playoffs
export const teamSeeds: Record<string, number> = {
  // East
  DET: 1, BOS: 2, NYK: 3, CLE: 4, ATL: 5, TOR: 6,
  // West
  OKC: 1, SAS: 2, DEN: 3, LAL: 4, HOU: 5, MIN: 6,
};

const fallbackTeams: Record<string, Team> = {
  OKC: { ...makeTeam("OKC", "Oklahoma City Thunder"), seed: teamSeeds["OKC"] },
  SAS: { ...makeTeam("SAS", "San Antonio Spurs"), seed: teamSeeds["SAS"] },
  DEN: { ...makeTeam("DEN", "Denver Nuggets"), seed: teamSeeds["DEN"] },
  LAL: { ...makeTeam("LAL", "Los Angeles Lakers"), seed: teamSeeds["LAL"] },
  HOU: { ...makeTeam("HOU", "Houston Rockets"), seed: teamSeeds["HOU"] },
  MIN: { ...makeTeam("MIN", "Minnesota Timberwolves"), seed: teamSeeds["MIN"] },
  DET: { ...makeTeam("DET", "Detroit Pistons"), seed: teamSeeds["DET"] },
  BOS: { ...makeTeam("BOS", "Boston Celtics"), seed: teamSeeds["BOS"] },
  NYK: { ...makeTeam("NYK", "New York Knicks"), seed: teamSeeds["NYK"] },
  CLE: { ...makeTeam("CLE", "Cleveland Cavaliers"), seed: teamSeeds["CLE"] },
  ATL: { ...makeTeam("ATL", "Atlanta Hawks"), seed: teamSeeds["ATL"] },
  TOR: { ...makeTeam("TOR", "Toronto Raptors"), seed: teamSeeds["TOR"] },
};

const eastTeams = new Set(["BOS", "NYK", "DET", "CLE", "ATL", "TOR", "ORL", "MIA", "MIL", "IND", "CHI", "BKN", "CHA", "WAS", "PHI"]);

export function getConference(team1: string, team2: string): "East" | "West" | "Finals" {
  const t1East = eastTeams.has(team1);
  const t2East = eastTeams.has(team2);
  if (t1East && t2East) return "East";
  if (!t1East && !t2East) return "West";
  return "Finals";
}

const matchups: { teams: [string, string]; conference: "East" | "West" }[] = [
  // East
  { teams: ["CLE", "ATL"], conference: "East" },
  { teams: ["NYK", "TOR"], conference: "East" },
  // West
  { teams: ["LAL", "HOU"], conference: "West" },
  { teams: ["DEN", "MIN"], conference: "West" },
];

export const fallbackMatches: Match[] = matchups.map(({ teams: [home, away], conference }, i) => ({
  id: `${home.toLowerCase()}-${away.toLowerCase()}`,
  round: "First Round",
  conference,
  gameNumber: 1,
  date: i < 3 ? "Apr 19" : "Apr 20",
  time: ["7:00 PM", "8:00 PM", "9:30 PM", "3:30 PM", "6:00 PM", "7:00 PM", "8:30 PM", "10:00 PM"][i] + " ET",
  homeTeam: fallbackTeams[home],
  awayTeam: fallbackTeams[away],
  homeWins: 0,
  awayWins: 0,
  status: "upcoming" as const,
  tips: makeTips(home, away),
}));
