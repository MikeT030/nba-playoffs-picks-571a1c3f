import { useQuery } from "@tanstack/react-query";
import { getPlayoffGames, teamMeta, type NbaGame } from "@/lib/nbaApi";
import { type Match, type Team, makeTips, fallbackMatches, getConference, teamSeeds } from "@/data/playoffsData";

const dummyFinalMatch: Match = {
  id: "cha-mia",
  round: "First Round",
  conference: "East",
  gameNumber: 4,
  date: "Apr 22",
  time: "Final",
  homeTeam: {
    name: "Miami Heat",
    abbreviation: "MIA",
    color: teamMeta["MIA"].color,
    logo: teamMeta["MIA"].logo,
    seed: 8,
  },
  awayTeam: {
    name: "Charlotte Hornets",
    abbreviation: "CHA",
    color: teamMeta["CHA"].color,
    logo: teamMeta["CHA"].logo,
    seed: 7,
  },
  homeWins: 3,
  awayWins: 1,
  status: "final",
  homeScore: 104,
  awayScore: 92,
  tips: makeTips("MIA", "CHA"),
};

function gameStatusToLocal(status: string): "upcoming" | "live" | "final" {
  if (status === "Final") return "final";
  if (status.includes(":") || status.startsWith("Q") || status.startsWith("Half")) return "live";
  return "upcoming";
}

function nbaTeamToTeam(t: { full_name: string; abbreviation: string }): Team {
  const meta = teamMeta[t.abbreviation] || { color: "#666", logo: "🏀" };
  return {
    name: t.full_name,
    abbreviation: t.abbreviation,
    color: meta.color,
    logo: meta.logo,
    seed: teamSeeds[t.abbreviation],
  };
}

// Group games into series (by team matchup) and compute series records
function groupIntoSeries(games: NbaGame[]): Match[] {
  const seriesMap = new Map<string, NbaGame[]>();

  for (const game of games) {
    const key = [game.home_team.abbreviation, game.visitor_team.abbreviation].sort().join("-");
    if (!seriesMap.has(key)) seriesMap.set(key, []);
    seriesMap.get(key)!.push(game);
  }

  const matches: Match[] = [];

  for (const [key, seriesGames] of seriesMap) {
    // Sort by date
    seriesGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const [teamA, teamB] = key.split("-");
    let teamAWins = 0;
    let teamBWins = 0;

    for (const g of seriesGames) {
      if (g.status === "Final") {
        const homeWon = g.home_team_score > g.visitor_team_score;
        const winner = homeWon ? g.home_team.abbreviation : g.visitor_team.abbreviation;
        if (winner === teamA) teamAWins++;
        else teamBWins++;
      }
    }

    // Use the latest game for display
    const latestGame = seriesGames[seriesGames.length - 1];
    const dateObj = new Date(latestGame.date);
    const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Determine home team (team with home court - first game's home team)
    const firstGame = seriesGames[0];
    const homeAbbr = firstGame.home_team.abbreviation;
    const awayAbbr = firstGame.visitor_team.abbreviation;

    const homeTeam = nbaTeamToTeam(firstGame.home_team);
    const awayTeam = nbaTeamToTeam(firstGame.visitor_team);

    matches.push({
      id: key.toLowerCase(),
      round: "First Round",
      conference: getConference(homeAbbr, awayAbbr),
      gameNumber: seriesGames.length,
      date: dateStr,
      time: latestGame.status === "Final" ? "Final" : latestGame.time || "TBD",
      homeTeam,
      awayTeam,
      homeWins: homeAbbr === teamA ? teamAWins : teamBWins,
      awayWins: awayAbbr === teamA ? teamAWins : teamBWins,
      status: gameStatusToLocal(latestGame.status),
      homeScore: latestGame.home_team_score,
      awayScore: latestGame.visitor_team_score,
      tips: makeTips(homeAbbr, awayAbbr),
    });
  }

  return matches;
}

export function usePlayoffGames(season: number = 2025) {
  return useQuery({
    queryKey: ["playoff-games", season],
    queryFn: async () => {
      try {
        const games = await getPlayoffGames(season);
        if (games.length === 0) return fallbackMatches;
        const apiMatches = groupIntoSeries(games);

        // Merge in TBD fallback matchups that aren't covered by API data
        const apiTeamKeys = new Set(
          apiMatches.map((m) =>
            [m.homeTeam.abbreviation, m.awayTeam.abbreviation].sort().join("-")
          )
        );
        const tbdMatches = fallbackMatches.filter((fb) => {
          const key = [fb.homeTeam.abbreviation, fb.awayTeam.abbreviation].sort().join("-");
          return !apiTeamKeys.has(key);
        });

        const allMatches = [...apiMatches, ...tbdMatches];
        // Add dummy CHA vs MIA final match
        if (!allMatches.some((m) => m.id === "cha-mia")) {
          allMatches.push(dummyFinalMatch);
        }
        return allMatches;
      } catch (error) {
        console.warn("Failed to fetch NBA data, using fallback:", error);
        return fallbackMatches;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1,
  });
}
