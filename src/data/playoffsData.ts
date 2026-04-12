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

// Regular season seeds for 2025 playoffs
export const teamSeeds: Record<string, number> = {
  CLE: 1, BOS: 2, NYK: 3, IND: 4, MIL: 5, DET: 6, ORL: 7, MIA: 8,
  OKC: 1, HOU: 2, LAL: 3, DEN: 4, LAC: 5, MIN: 6, GSW: 7, DAL: 8,
};

const fallbackTeams: Record<string, Team> = {
  BOS: { ...makeTeam("BOS", "Boston Celtics"), seed: teamSeeds["BOS"] },
  ORL: { ...makeTeam("ORL", "Orlando Magic"), seed: teamSeeds["ORL"] },
  CLE: { ...makeTeam("CLE", "Cleveland Cavaliers"), seed: teamSeeds["CLE"] },
  MIA: { ...makeTeam("MIA", "Miami Heat"), seed: teamSeeds["MIA"] },
  OKC: { ...makeTeam("OKC", "Oklahoma City Thunder"), seed: teamSeeds["OKC"] },
  DEN: { ...makeTeam("DEN", "Denver Nuggets"), seed: teamSeeds["DEN"] },
  LAL: { ...makeTeam("LAL", "Los Angeles Lakers"), seed: teamSeeds["LAL"] },
  MIN: { ...makeTeam("MIN", "Minnesota Timberwolves"), seed: teamSeeds["MIN"] },
  GSW: { ...makeTeam("GSW", "Golden State Warriors"), seed: teamSeeds["GSW"] },
  HOU: { ...makeTeam("HOU", "Houston Rockets"), seed: teamSeeds["HOU"] },
  NYK: { ...makeTeam("NYK", "New York Knicks"), seed: teamSeeds["NYK"] },
  DET: { ...makeTeam("DET", "Detroit Pistons"), seed: teamSeeds["DET"] },
  MIL: { ...makeTeam("MIL", "Milwaukee Bucks"), seed: teamSeeds["MIL"] },
  IND: { ...makeTeam("IND", "Indiana Pacers"), seed: teamSeeds["IND"] },
  LAC: { ...makeTeam("LAC", "Los Angeles Clippers"), seed: teamSeeds["LAC"] },
  DAL: { ...makeTeam("DAL", "Dallas Mavericks"), seed: teamSeeds["DAL"] },
};

const eastTeams = new Set(["BOS", "ORL", "CLE", "MIA", "NYK", "DET", "MIL", "IND", "ATL", "CHI", "BKN", "CHA", "TOR", "WAS", "PHI"]);

export function getConference(team1: string, team2: string): "East" | "West" | "Finals" {
  const t1East = eastTeams.has(team1);
  const t2East = eastTeams.has(team2);
  if (t1East && t2East) return "East";
  if (!t1East && !t2East) return "West";
  return "Finals";
}

const matchups: { teams: [string, string]; conference: "East" | "West" }[] = [
  { teams: ["BOS", "ORL"], conference: "East" },
  { teams: ["CLE", "MIA"], conference: "East" },
  { teams: ["NYK", "DET"], conference: "East" },
  { teams: ["MIL", "IND"], conference: "East" },
  { teams: ["OKC", "DEN"], conference: "West" },
  { teams: ["LAL", "MIN"], conference: "West" },
  { teams: ["GSW", "HOU"], conference: "West" },
  { teams: ["LAC", "DAL"], conference: "West" },
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
