import { teamMeta } from "@/lib/nbaApi";

export interface Team {
  name: string;
  abbreviation: string;
  color: string;
  logo: string;
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

const fallbackTeams: Record<string, Team> = {
  BOS: makeTeam("BOS", "Boston Celtics"),
  ORL: makeTeam("ORL", "Orlando Magic"),
  CLE: makeTeam("CLE", "Cleveland Cavaliers"),
  MIA: makeTeam("MIA", "Miami Heat"),
  OKC: makeTeam("OKC", "Oklahoma City Thunder"),
  DEN: makeTeam("DEN", "Denver Nuggets"),
  LAL: makeTeam("LAL", "Los Angeles Lakers"),
  MIN: makeTeam("MIN", "Minnesota Timberwolves"),
  GSW: makeTeam("GSW", "Golden State Warriors"),
  HOU: makeTeam("HOU", "Houston Rockets"),
  NYK: makeTeam("NYK", "New York Knicks"),
  DET: makeTeam("DET", "Detroit Pistons"),
  MIL: makeTeam("MIL", "Milwaukee Bucks"),
  IND: makeTeam("IND", "Indiana Pacers"),
  LAC: makeTeam("LAC", "Los Angeles Clippers"),
  DAL: makeTeam("DAL", "Dallas Mavericks"),
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
