export interface Team {
  name: string;
  abbreviation: string;
  color: string;
  logo: string; // emoji as placeholder
}

export interface Tip {
  user: string;
  avatar: string;
  pick: string; // team abbreviation
  gamesInSeries: number; // e.g. "in 5"
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

const teams: Record<string, Team> = {
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

const buddies = ["Max", "Leon", "Nik", "Jonas", "Alex"];
const avatars = ["😎", "🧢", "🏀", "💪", "🎯"];

function makeTips(teams: [string, string]): Tip[] {
  return buddies.map((name, i) => {
    const pick = Math.random() > 0.5 ? teams[0] : teams[1];
    return {
      user: name,
      avatar: avatars[i],
      pick,
      gamesInSeries: Math.floor(Math.random() * 3) + 4, // 4-6
    };
  });
}

export const matches: Match[] = [
  {
    id: "bos-orl",
    round: "First Round",
    gameNumber: 1,
    date: "Apr 19",
    time: "7:00 PM ET",
    homeTeam: teams.BOS,
    awayTeam: teams.ORL,
    homeWins: 0,
    awayWins: 0,
    status: "upcoming",
    tips: makeTips(["BOS", "ORL"]),
  },
  {
    id: "cle-mia",
    round: "First Round",
    gameNumber: 1,
    date: "Apr 19",
    time: "8:00 PM ET",
    homeTeam: teams.CLE,
    awayTeam: teams.MIA,
    homeWins: 0,
    awayWins: 0,
    status: "upcoming",
    tips: makeTips(["CLE", "MIA"]),
  },
  {
    id: "okc-den",
    round: "First Round",
    gameNumber: 1,
    date: "Apr 19",
    time: "9:30 PM ET",
    homeTeam: teams.OKC,
    awayTeam: teams.DEN,
    homeWins: 0,
    awayWins: 0,
    status: "upcoming",
    tips: makeTips(["OKC", "DEN"]),
  },
  {
    id: "lal-min",
    round: "First Round",
    gameNumber: 1,
    date: "Apr 20",
    time: "3:30 PM ET",
    homeTeam: teams.LAL,
    awayTeam: teams.MIN,
    homeWins: 0,
    awayWins: 0,
    status: "upcoming",
    tips: makeTips(["LAL", "MIN"]),
  },
  {
    id: "gsw-hou",
    round: "First Round",
    gameNumber: 1,
    date: "Apr 20",
    time: "6:00 PM ET",
    homeTeam: teams.GSW,
    awayTeam: teams.HOU,
    homeWins: 0,
    awayWins: 0,
    status: "upcoming",
    tips: makeTips(["GSW", "HOU"]),
  },
  {
    id: "nyk-det",
    round: "First Round",
    gameNumber: 1,
    date: "Apr 20",
    time: "7:00 PM ET",
    homeTeam: teams.NYK,
    awayTeam: teams.DET,
    homeWins: 0,
    awayWins: 0,
    status: "upcoming",
    tips: makeTips(["NYK", "DET"]),
  },
  {
    id: "mil-ind",
    round: "First Round",
    gameNumber: 1,
    date: "Apr 20",
    time: "8:30 PM ET",
    homeTeam: teams.MIL,
    awayTeam: teams.IND,
    homeWins: 0,
    awayWins: 0,
    status: "upcoming",
    tips: makeTips(["MIL", "IND"]),
  },
  {
    id: "lac-dal",
    round: "First Round",
    gameNumber: 1,
    date: "Apr 20",
    time: "10:00 PM ET",
    homeTeam: teams.LAC,
    awayTeam: teams.DAL,
    homeWins: 0,
    awayWins: 0,
    status: "upcoming",
    tips: makeTips(["LAC", "DAL"]),
  },
];
