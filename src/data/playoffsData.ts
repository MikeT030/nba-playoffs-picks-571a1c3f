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

// Hardcoded buddies tips (will be replaced by DB later)
const buddies = ["Max", "Leon", "Nik", "Jonas", "Alex"];
const avatars = ["😎", "🧢", "🏀", "💪", "🎯"];

export function makeTips(team1: string, team2: string): Tip[] {
  // Deterministic based on team names so it doesn't change on re-render
  return buddies.map((name, i) => {
    const seed = (name.charCodeAt(0) + team1.charCodeAt(0) + team2.charCodeAt(0)) % 2;
    const pick = (i + seed) % 2 === 0 ? team1 : team2;
    return {
      user: name,
      avatar: avatars[i],
      pick,
      gamesInSeries: 4 + ((i + seed) % 3), // 4, 5, or 6
    };
  });
}

// Fallback static matches (used when API is unavailable)
const fallbackTeams: Record<string, Team> = {
  BOS: { name: "Boston Celtics", abbreviation: "BOS", color: "#007A33", logo: "🍀" },
  ORL: { name: "Orlando Magic", abbreviation: "ORL", color: "#0077C0", logo: "✨" },
  CLE: { name: "Cleveland Cavaliers", abbreviation: "CLE", color: "#860038", logo: "⚔️" },
  MIA: { name: "Miami Heat", abbreviation: "MIA", color: "#98002E", logo: "🔥" },
  OKC: { name: "Oklahoma City Thunder", abbreviation: "OKC", color: "#007AC1", logo: "⚡" },
  DEN: { name: "Denver Nuggets", abbreviation: "DEN", color: "#0E2240", logo: "⛏️" },
  LAL: { name: "Los Angeles Lakers", abbreviation: "LAL", color: "#552583", logo: "👑" },
  MIN: { name: "Minnesota Timberwolves", abbreviation: "MIN", color: "#0C2340", logo: "🐺" },
  GSW: { name: "Golden State Warriors", abbreviation: "GSW", color: "#1D428A", logo: "🌉" },
  HOU: { name: "Houston Rockets", abbreviation: "HOU", color: "#CE1141", logo: "🚀" },
  NYK: { name: "New York Knicks", abbreviation: "NYK", color: "#006BB6", logo: "🗽" },
  DET: { name: "Detroit Pistons", abbreviation: "DET", color: "#C8102E", logo: "🏭" },
  MIL: { name: "Milwaukee Bucks", abbreviation: "MIL", color: "#00471B", logo: "🦌" },
  IND: { name: "Indiana Pacers", abbreviation: "IND", color: "#002D62", logo: "🏎️" },
  LAC: { name: "Los Angeles Clippers", abbreviation: "LAC", color: "#C8102E", logo: "⛵" },
  DAL: { name: "Dallas Mavericks", abbreviation: "DAL", color: "#00538C", logo: "🐴" },
};

const matchups: [string, string][] = [
  ["BOS", "ORL"], ["CLE", "MIA"], ["OKC", "DEN"], ["LAL", "MIN"],
  ["GSW", "HOU"], ["NYK", "DET"], ["MIL", "IND"], ["LAC", "DAL"],
];

export const fallbackMatches: Match[] = matchups.map(([home, away], i) => ({
  id: `${home.toLowerCase()}-${away.toLowerCase()}`,
  round: "First Round",
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
